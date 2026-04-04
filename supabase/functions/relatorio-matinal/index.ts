import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (_req: Request) => {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
        const today = now.toISOString().split("T")[0];
        
        // Data de referência do matinal é SEMPRE o dia anterior
        const yesterdayDate = new Date(now);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        const daysElapsed = yesterdayDate.getDate();
        const totalDays = new Date(year, month, 0).getDate();
        const daysRemaining = totalDays - daysElapsed;

        const { data: stores } = await supabase.from("stores").select("*").eq("active", true);
        if (!stores?.length) return new Response(JSON.stringify({ message: "No stores" }), { headers: { "Content-Type": "application/json" } });

        const reports: any[] = [];

        for (const store of stores) {
            // STORY-05A.1: Idempotência do Matinal
            const idempotencyKey = `matinal-${store.id}-${today}`;
            const { data: existingLog } = await supabase.from("reprocess_logs").select("id").eq("source_type", idempotencyKey).single();
            
            if (existingLog) {
                console.log(`[Matinal] Skipped ${store.name} - Já disparado hoje.`);
                continue;
            }

            // Puxando vendedores ativos da nova tabela canônica
            const { data: sellers } = await supabase.from("store_sellers").select("seller_user_id, is_active, users:seller_user_id(name, email)").eq("store_id", store.id).eq("is_active", true);

            // Produção acumulada do mês usando reference_date
            const { data: checkins } = await supabase.from("daily_checkins").select("*").eq("store_id", store.id).gte("reference_date", startOfMonth).lte("reference_date", yesterday);

            // Meta da loja do novo schema
            const { data: metaData } = await supabase.from("store_meta_rules").select("monthly_goal").eq("store_id", store.id).single();
            const storeGoal = metaData?.monthly_goal || 0;

            // Check-ins de ontem para saber quem está "Sem Registro"
            const { data: yCheckins } = await supabase.from("daily_checkins").select("seller_user_id").eq("store_id", store.id).eq("reference_date", yesterday);
            const checkedY = new Set((yCheckins || []).map((c: any) => c.seller_user_id));

            const agg = new Map<string, any>();
            for (const s of sellers || []) {
                const u = (s as any).users;
                agg.set(s.seller_user_id, {
                    uid: s.seller_user_id,
                    name: u?.name || "Vendedor",
                    leads: 0, ac: 0, an: 0, vp: 0, vc: 0, vn: 0, vis: 0,
                    sem_registro: !checkedY.has(s.seller_user_id)
                });
            }

            for (const c of checkins || []) {
                const a = agg.get(c.seller_user_id);
                if (a) {
                    a.leads += c.leads_prev_day || 0;
                    a.ac += c.agd_cart_today || 0;
                    a.an += c.agd_net_today || 0;
                    a.vp += c.vnd_porta_prev_day || 0;
                    a.vc += c.vnd_cart_prev_day || 0;
                    a.vn += c.vnd_net_prev_day || 0;
                    a.vis += c.visit_prev_day || 0;
                }
            }

            const ranking = Array.from(agg.values()).map((s) => ({
                ...s,
                at: s.ac + s.an,
                vt: s.vp + s.vc + s.vn
            })).sort((a, b) => b.vt - a.vt);

            const tv = ranking.reduce((s: number, r: any) => s + r.vt, 0);
            const pct = storeGoal > 0 ? Math.round((tv / storeGoal) * 100) : 0;
            const proj = daysElapsed > 0 ? Math.round((tv / daysElapsed) * totalDays) : 0;
            const falta = Math.max(storeGoal - tv, 0);
            
            const semRegistroNomes = ranking.filter(r => r.sem_registro).map(r => r.name);

            // Gerar HTML oficial MX
            const html = generateHTML(store.name, yesterdayDate, tv, storeGoal, pct, proj, falta, daysRemaining, ranking, semRegistroNomes, year);

            // Logar disparo (Idempotência)
            await supabase.from("reprocess_logs").insert({ store_id: store.id, source_type: idempotencyKey, status: 'completed' });

            reports.push({ store: store.name, total_vendas: tv, pct, sem_registro: semRegistroNomes.length });
            console.log(`[Matinal] Disparado para ${store.name} com sucesso.`);
        }

        return new Response(JSON.stringify({ message: `Processamento matinal concluído`, reports }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});

function generateHTML(storeName: string, date: Date, tv: number, meta: number, pct: number, proj: number, falta: number, dr: number, ranking: any[], semRegistro: string[], year: number) {
    const clr = (v: number, t: number) => t > 0 ? ((v / t) * 100 >= 100 ? "color:#10b981" : (v / t) * 100 >= 80 ? "color:#34d399" : "color:#f87171") : "";
    const wppText = encodeURIComponent(`*📊 MATINAL MX - ${storeName}*\n📅 Ref: ${date.toLocaleDateString("pt-BR")}\n\n🎯 Meta: ${meta}\n🔥 Vendido: ${tv} (${pct}%)\n📈 Projeção: ${proj}\n🚨 Faltam: ${falta}\n\n🏆 *Top 3*\n${ranking.slice(0,3).map((r,i) => `${i+1}º ${r.name} - ${r.vt}v`).join('\n')}\n\n${semRegistro.length > 0 ? `⚠️ *SEM REGISTRO HOJE:*\n${semRegistro.join(', ')}` : '✅ Todos registraram hoje!'}`);
    
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px}
.c{max-width:680px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 4px 20px rgba(0,0,0,0.05);overflow:hidden}
.h{background:#0f172a;padding:32px;text-align:center}
.h h1{color:#fff;margin:0 0 8px;font-size:24px;text-transform:uppercase;letter-spacing:1px}.h p{color:#94a3b8;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px}
.content{padding:32px}
.sr{background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:12px;margin-bottom:24px;color:#991b1b;font-weight:bold;font-size:13px}
.ss{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.s{background:#f1f5f9;border-radius:16px;padding:20px;text-align:center}
.sv{font-size:32px;font-weight:900;color:#0f172a;line-height:1}.sl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.alert{text-align:center;padding:16px;background:#f8fafc;border-radius:12px;font-size:13px;font-weight:bold;margin-bottom:32px}
table{width:100%;border-collapse:collapse;margin-bottom:32px}
th{background:#f8fafc;padding:12px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #e2e8f0}
td{padding:16px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600}
.btn{display:block;width:100%;background:#25D366;color:#fff;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:1px}
.f{text-align:center;padding:20px;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-top:1px solid #f1f5f9}
</style></head><body><div class="c">
<div class="h"><h1>📊 Matinal Oficial</h1><p>${storeName} • ${date.toLocaleDateString("pt-BR")}</p></div>
<div class="content">
${semRegistro.length > 0 ? `<div class="sr">⚠️ Atenção: ${semRegistro.join(', ')} estão SEM REGISTRO no fechamento de ontem.</div>` : ''}
<div class="ss">
<div class="s"><div class="sv" style="${clr(tv, meta)}">${tv}</div><div class="sl">Vendido</div></div>
<div class="s"><div class="sv">${meta}</div><div class="sl">Meta do Mês</div></div>
<div class="s"><div class="sv">${proj}</div><div class="sl">Projeção Oficial</div></div>
<div class="s"><div class="sv" style="${clr(tv, meta)}">${pct}%</div><div class="sl">Atingimento</div></div>
</div>
<div class="alert">📌 Faltam ${falta} vendas em ${dr} dias (${dr > 0 ? (falta / dr).toFixed(1) : 0}/dia)</div>
<table><thead><tr><th>Consultor</th><th>AGD</th><th>Vis</th><th>VND</th><th>Ontem</th></tr></thead>
<tbody>${ranking.map((r: any) => `<tr><td>${r.name}</td><td>${r.at}</td><td>${r.vis}</td><td>${r.vt}</td><td>${r.sem_registro ? "❌" : "✅"}</td></tr>`).join("")}</tbody></table>
<a href="https://api.whatsapp.com/send?text=${wppText}" class="btn">COMPARTILHAR NO WHATSAPP</a>
</div>
<div class="f">MX Gestão Preditiva © ${year}</div>
</div></body></html>`;
}