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
        // Mês anterior
        const prevMonthDate = new Date(now);
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const month = prevMonthDate.getMonth() + 1;
        const year = prevMonthDate.getFullYear();
        
        const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
        const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

        const { data: stores } = await supabase.from("stores").select("*").eq("active", true);
        if (!stores?.length) return new Response(JSON.stringify({ message: "No stores" }), { headers: { "Content-Type": "application/json" } });

        const storeReports: any[] = [];

        for (const store of stores) {
            // Idempotência do Mensal
            const idempotencyKey = `mensal-${store.id}-${year}-${month}`;
            const { data: existingLog } = await supabase.from("reprocess_logs").select("id").eq("source_type", idempotencyKey).single();
            if (existingLog) {
                console.log(`[Mensal] Skipped ${store.name} - Já disparado este mês.`);
                continue;
            }

            // Puxando destinatários
            const { data: deliveryRules } = await supabase.from("store_delivery_rules").select("monthly_recipients").eq("store_id", store.id).single();
            const recipients = deliveryRules?.monthly_recipients || [];

            const { data: members } = await supabase.from("memberships").select("user_id, users(name)").eq("store_id", store.id).eq("role", "vendedor");
            const { data: checkins } = await supabase.from("daily_checkins").select("*").eq("store_id", store.id).gte("reference_date", startOfMonth).lte("reference_date", endOfMonth);
            const { data: metaData } = await supabase.from("store_meta_rules").select("monthly_goal").eq("store_id", store.id).single();
            const storeGoal = metaData?.monthly_goal || 0;

            const agg = new Map<string, any>();
            for (const m of members || []) {
                const u = (m as any).users;
                agg.set(m.user_id, {
                    uid: m.user_id,
                    name: u?.name || "Vendedor",
                    leads: 0, agd: 0, vis: 0, vp: 0, vc: 0, vn: 0,
                });
            }
            for (const c of checkins || []) {
                const a = agg.get(c.seller_user_id);
                if (a) {
                    a.leads += c.leads_prev_day || 0;
                    a.agd += (c.agd_cart_today || 0) + (c.agd_net_today || 0);
                    a.vis += c.visit_prev_day || 0;
                    a.vp += c.vnd_porta_prev_day || 0;
                    a.vc += c.vnd_cart_prev_day || 0;
                    a.vn += c.vnd_net_prev_day || 0;
                }
            }

            const sellers = Array.from(agg.values()).map((s) => ({
                ...s,
                vt: s.vp + s.vc + s.vn
            })).sort((a, b) => b.vt - a.vt);

            const totalVendas = sellers.reduce((sum: number, s: any) => sum + s.vt, 0);
            const pct = storeGoal > 0 ? Math.round((totalVendas / storeGoal) * 100) : 0;

            const monthName = prevMonthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
            const html = generateMonthlyHTML(store.name, monthName, totalVendas, storeGoal, pct, sellers, year);

            // Enviar e-mail
            let emailStatus = "not_sent";
            if (resend && recipients.length > 0) {
                try {
                    await resend.emails.send({
                        from: "MX Relatórios <relatorios@mxgestaopreditiva.com.br>",
                        to: recipients,
                        subject: `🏆 Relatório Mensal MX: ${store.name} - ${monthName.toUpperCase()}`,
                        html: html,
                    });
                    emailStatus = "sent";
                } catch (err) {
                    console.error(`[Mensal] Error sending email for ${store.name}:`, err);
                    emailStatus = "failed";
                }
            }

            await supabase.from("reprocess_logs").insert({ 
                store_id: store.id, 
                source_type: idempotencyKey, 
                status: 'completed',
                rows_processed: sellers.length,
                warnings: emailStatus === "failed" ? ["Falha no disparo"] : []
            });

            storeReports.push({ store: store.name, vendas: totalVendas, pct, email: emailStatus });
        }

        return new Response(JSON.stringify({ message: `Processamento mensal concluído`, reports: storeReports }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});

function generateMonthlyHTML(storeName: string, monthName: string, tv: number, meta: number, pct: number, ranking: any[], year: number) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;color:#0f172a;margin:0;padding:20px}
.c{max-width:700px;margin:0 auto;background:#fff;border-radius:32px;box-shadow:0 10px 40px rgba(0,0,0,0.1);overflow:hidden}
.h{background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);padding:48px 32px;text-align:center;color:#fff}
.h h1{margin:0 0 8px;font-size:28px;text-transform:uppercase;letter-spacing:2px;font-weight:900}
.h p{color:#94a3b8;margin:0;font-size:14px;text-transform:uppercase;letter-spacing:4px}
.content{padding:40px}
.ss{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px}
.s{background:#f8fafc;border-radius:24px;padding:32px;text-align:center;border:1px solid #e2e8f0}
.sv{font-size:48px;font-weight:900;color:#0f172a;line-height:1;margin-bottom:8px}.sl{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-weight:700}
.bar-c{height:12px;background:#f1f5f9;border-radius:6px;margin:20px 0;overflow:hidden}
.bar{height:100%;background:#4f46e5;border-radius:6px}
table{width:100%;border-collapse:separate;border-spacing:0 8px;margin-top:20px}
th{padding:12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:2px}
td{padding:20px 12px;background:#f8fafc;font-size:14px;font-weight:700}
td:first-child{border-radius:12px 0 0 12px}
td:last-child{border-radius:0 12px 12px 0;text-align:right}
.f{text-align:center;padding:32px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #f1f5f9}
</style></head><body><div class="c">
<div class="h"><h1>🏆 Fechamento Mensal</h1><p>${storeName} • ${monthName}</p></div>
<div class="content">
<div class="ss">
<div class="s"><div class="sv">${tv}</div><div class="sl">Vendas Realizadas</div></div>
<div class="s"><div class="sv">${pct}%</div><div class="sl">Atingimento Meta</div></div>
</div>
<div style="text-align:center;margin-bottom:40px">
<div class="sl">Meta do Mês: ${meta} unidades</div>
<div class="bar-c"><div class="bar" style="width:${Math.min(pct, 100)}%"></div></div>
</div>
<h3 style="text-transform:uppercase;letter-spacing:2px;font-size:14px;margin-bottom:20px;color:#0f172a">Ranking de Consultores</h3>
<table><thead><tr><th>Consultor</th><th>Leads</th><th>Visitas</th><th>Vendas</th></tr></thead>
<tbody>${ranking.map((r: any) => `<tr><td>${r.name}</td><td>${r.leads}</td><td>${r.vis}</td><td>${r.vt}</td></tr>`).join("")}</tbody></table>
</div>
<div class="f">MX Gestão Preditiva © ${year}</div>
</div></body></html>`;
}
