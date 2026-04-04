import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabase = createClient(supabaseUrl, serviceKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

            // Puxando regras de entrega para destinatários de e-mail
            const { data: deliveryRules } = await supabase.from("store_delivery_rules").select("matinal_recipients").eq("store_id", store.id).single();
            const recipients = deliveryRules?.matinal_recipients || [];

            // Puxando vendedores ativos
            const { data: sellers } = await supabase.from("store_sellers").select("seller_user_id, is_active, users:seller_user_id(name, email)").eq("store_id", store.id).eq("is_active", true);

            // Produção acumulada do mês usando reference_date
            const { data: checkins } = await supabase.from("daily_checkins").select("*").eq("store_id", store.id).gte("reference_date", startOfMonth).lte("reference_date", yesterday);

            // Meta da loja
            const { data: metaData } = await supabase.from("store_meta_rules").select("monthly_goal").eq("store_id", store.id).single();
            const storeGoal = metaData?.monthly_goal || 0;

            // Check-ins de ontem (Sem Registro)
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

            // Gerar CSV para anexo
            const csvBase64 = generateCSV(ranking);
            const fileName = `matinal_MX_${store.name.replace(/\s+/g, "_")}_${today}.csv`;

            // Enviar e-mail via Resend se configurado
            let emailStatus = "not_sent";
            if (resend && recipients.length > 0) {
                try {
                    const { error } = await resend.emails.send({
                        from: "MX Relatórios <relatorios@mxgestaopreditiva.com.br>",
                        to: recipients,
                        subject: `📊 Matinal MX: ${store.name} - ${yesterdayDate.toLocaleDateString("pt-BR")}`,
                        html: html,
                        attachments: [
                            {
                                filename: fileName,
                                content: csvBase64,
                            }
                        ]
                    });
                    if (error) {
                        console.error(`[Matinal] Error sending email for ${store.name}:`, error);
                        emailStatus = "failed";
                    } else {
                        emailStatus = "sent";
                    }
                } catch (err) {
                    console.error(`[Matinal] Critical error sending email for ${store.name}:`, err);
                    emailStatus = "failed";
                }
            }

            // Logar disparo (Idempotência) com status do e-mail
            await supabase.from("reprocess_logs").insert({ 
                store_id: store.id, 
                source_type: idempotencyKey, 
                status: 'completed',
                rows_processed: ranking.length,
                warnings: emailStatus === "failed" ? ["Falha no disparo do e-mail"] : emailStatus === "not_sent" ? ["Nenhum destinatário configurado ou Resend desativado"] : []
            });

            reports.push({ store: store.name, total_vendas: tv, pct, sem_registro: semRegistroNomes.length, email: emailStatus });
            console.log(`[Matinal] Disparado para ${store.name} com sucesso. Status E-mail: ${emailStatus}`);
        }

        return new Response(JSON.stringify({ message: `Processamento matinal concluído`, reports }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});

function generateCSV(ranking: any[]) {
    const headers = ["Vendedor", "Leads", "Agendamentos", "Visitas", "Vendas", "Status Registro"];
    const rows = ranking.map(r => [
        `"${r.name}"`,
        r.leads,
        r.at,
        r.vis,
        r.vt,
        r.sem_registro ? '"Sem Registro"' : '"OK"'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    // In Deno, we can use btoa for simple strings, but for universal UTF-8 support:
    const encoder = new TextEncoder();
    const data = encoder.encode(csvContent);
    const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
}

function generateHTML(storeName: string, date: Date, tv: number, meta: number, pct: number, proj: number, falta: number, dr: number, ranking: any[], semRegistro: string[], year: number) {
    const clr = (v: number, t: number) => t > 0 ? ((v / t) * 100 >= 100 ? "color:#10b981" : (v / t) * 100 >= 80 ? "color:#4f46e5" : "color:#f43f5e") : "color:#4f46e5";
    const wppText = encodeURIComponent(`*📊 MATINAL MX - ${storeName}*\n📅 Ref: ${date.toLocaleDateString("pt-BR")}\n\n🎯 Meta: ${meta}\n🔥 Vendido: ${tv} (${pct}%)\n📈 Projeção: ${proj}\n🚨 Faltam: ${falta}\n\n🏆 *Top 3*\n${ranking.slice(0,3).map((r,i) => `${i+1}º ${r.name} - ${r.vt}v`).join('\n')}\n\n${semRegistro.length > 0 ? `⚠️ *SEM REGISTRO HOJE:*\n${semRegistro.join(', ')}` : '✅ Todos registraram hoje!'}`);
    
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px;line-height:1.5}
.c{max-width:680px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px -10px rgba(0,0,0,0.1);overflow:hidden}
.h{background:#0f172a;padding:48px 32px;text-align:center;border-bottom:4px solid #4f46e5}
.h h1{color:#fff;margin:0 0 12px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.h p{color:#94a3b8;margin:0;font-size:14px;text-transform:uppercase;letter-spacing:3px}
.content{padding:40px 32px}
.sr{background:#fff1f2;border-left:4px solid #f43f5e;padding:20px;border-radius:12px;margin-bottom:32px;color:#9f1239;font-weight:600;font-size:14px}
.ss{display:grid;grid-template-columns:repeat(2, 1fr);gap:16px;margin-bottom:32px}
.s{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:24px;text-align:center;transition:all 0.3s}
.sv{font-size:36px;font-weight:900;color:#0f172a;line-height:1;margin-bottom:8px}.sl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:600}
.alert{text-align:center;padding:20px;background:#f1f5f9;border-radius:16px;font-size:14px;font-weight:700;color:#334155;margin-bottom:40px;border:1px dashed #cbd5e1}
table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:40px}
th{background:#fff;padding:16px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #0f172a;font-weight:700}
td{padding:18px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#334155}
.btn{display:block;width:100%;background:#4f46e5;color:#fff;text-align:center;padding:20px;border-radius:14px;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;box-shadow:0 4px 14px 0 rgba(79,70,229,0.39)}
.f{text-align:center;padding:32px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #f1f5f9;background:#fcfcfc}
</style></head><body><div class="c">
<div class="h"><h1>📊 Matinal MX</h1><p>${storeName} • ${date.toLocaleDateString("pt-BR")}</p></div>
<div class="content">
${semRegistro.length > 0 ? `<div class="sr">⚠️ Atenção: ${semRegistro.join(', ')} estão SEM REGISTRO no fechamento de ontem.</div>` : ''}
<div class="ss">
<div class="s"><div class="sv" style="${clr(tv, meta)}">${tv}</div><div class="sl">Vendido</div></div>
<div class="s"><div class="sv">${meta}</div><div class="sl">Meta</div></div>
<div class="s"><div class="sv">${proj}</div><div class="sl">Projeção</div></div>
<div class="s"><div class="sv" style="${clr(tv, meta)}">${pct}%</div><div class="sl">Atingimento</div></div>
</div>
<div class="alert">📌 Faltam ${falta} vendas em ${dr} dias (${dr > 0 ? (falta / dr).toFixed(1) : 0}/dia)</div>
<table><thead><tr><th>Consultor</th><th>AGD</th><th>Vis</th><th>VND</th><th>Ontem</th></tr></thead>
<tbody>${ranking.map((r: any) => `<tr><td>${r.name}</td><td>${r.at}</td><td>${r.vis}</td><td>${r.vt}</td><td>${r.sem_registro ? '<span style="color:#f43f5e">❌</span>' : '<span style="color:#10b981">✅</span>'}</td></tr>`).join("")}</tbody></table>
<a href="https://api.whatsapp.com/send?text=${wppText}" class="btn">ENVIAR FEEDBACK VIA WHATSAPP</a>
</div>
<div class="f">MX Gestão Preditiva © ${year}</div>
</div></body></html>`;
}
