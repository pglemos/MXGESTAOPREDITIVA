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
        // Se disparado na segunda de manhã, pega de segunda a domingo da semana anterior
        const endDateDate = new Date(now);
        endDateDate.setDate(endDateDate.getDate() - 1); 
        const endDate = endDateDate.toISOString().split("T")[0];
        
        const startDateDate = new Date(endDateDate);
        startDateDate.setDate(startDateDate.getDate() - 6);
        const startDate = startDateDate.toISOString().split("T")[0];

        const { data: stores } = await supabase.from("stores").select("*").eq("active", true);
        if (!stores?.length) return new Response(JSON.stringify({ message: "No stores" }), { headers: { "Content-Type": "application/json" } });

        const reports: any[] = [];

        for (const store of stores) {
            // Idempotência
            const idempotencyKey = `semanal-${store.id}-${endDate}`;
            const { data: existingLog } = await supabase.from("reprocess_logs").select("id").eq("source_type", idempotencyKey).single();
            if (existingLog) {
                console.log(`[Semanal] Skipped ${store.name} - Já disparado esta semana.`);
                continue;
            }

            // Puxando regras de entrega para destinatários de e-mail
            const { data: deliveryRules } = await supabase.from("store_delivery_rules").select("weekly_recipients").eq("store_id", store.id).single();
            const recipients = deliveryRules?.weekly_recipients || [];

            const { data: sellers } = await supabase.from("store_sellers").select("seller_user_id, is_active, users:seller_user_id(name, email)").eq("store_id", store.id).eq("is_active", true);
            const { data: checkins } = await supabase.from("daily_checkins").select("*").eq("store_id", store.id).gte("reference_date", startDate).lte("reference_date", endDate);
            
            const { data: benchmarkData } = await supabase.from("store_benchmarks").select("*").eq("store_id", store.id).single();
            const benchmark = benchmarkData || { lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 };

            const { data: metaData } = await supabase.from("store_meta_rules").select("monthly_goal").eq("store_id", store.id).single();
            const storeMonthlyGoal = metaData?.monthly_goal || 0;
            const teamWeeklyGoal = Math.round(storeMonthlyGoal / 4);

            const teamTotal = { leads: 0, agd: 0, vis: 0, vnd: 0 };
            const agg = new Map<string, any>();
            
            for (const s of sellers || []) {
                const u = (s as any).users;
                agg.set(s.seller_user_id, {
                    uid: s.seller_user_id,
                    name: u?.name || "Vendedor",
                    leads: 0, agd: 0, vis: 0, vnd: 0
                });
            }

            for (const c of checkins || []) {
                const a = agg.get(c.seller_user_id);
                const l = c.leads_prev_day || 0;
                const ag = (c.agd_cart_today || 0) + (c.agd_net_today || 0);
                const vi = c.visit_prev_day || 0;
                const vn = (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0);
                
                teamTotal.leads += l; teamTotal.agd += ag; teamTotal.vis += vi; teamTotal.vnd += vn;
                
                if (a) {
                    a.leads += l; a.agd += ag; a.vis += vi; a.vnd += vn;
                }
            }

            const activeCount = agg.size || 1;
            const teamAvg = {
                leads: Math.round(teamTotal.leads / activeCount),
                agd: Math.round(teamTotal.agd / activeCount),
                vis: Math.round(teamTotal.vis / activeCount),
                vnd: Math.round(teamTotal.vnd / activeCount),
            };

            const ranking = Array.from(agg.values()).map(s => {
                const txLeadAgd = s.leads > 0 ? (s.agd / s.leads) * 100 : 0;
                const txAgdVis = s.agd > 0 ? (s.vis / s.agd) * 100 : 0;
                const txVisVnd = s.vis > 0 ? (s.vnd / s.vis) * 100 : 0;

                const desvio = s.vnd - teamAvg.vnd;
                const performanceLabel = desvio > 0 ? `+${desvio} acima da média` : desvio < 0 ? `${desvio} abaixo da média` : "Na média da equipe";

                const gaps = [
                    { etapa: "Lead → Agendamento", real: txLeadAgd, bench: benchmark.lead_to_agend, acao: "Aumentar volume de ligações e focar no script de quebra de objeção ao telefone." },
                    { etapa: "Agendamento → Visita", real: txAgdVis, bench: benchmark.agend_to_visit, acao: "Reforçar follow-up na véspera e aumentar perceived value do showroom." },
                    { etapa: "Visita → Venda", real: txVisVnd, bench: benchmark.visit_to_sale, acao: "Trabalhar contorno de objeção presencial e teste drive focado." }
                ].filter(g => g.real < g.bench).sort((a, b) => (b.bench - b.real) - (a.bench - a.real));

                const diagnostico = gaps.length > 0 ? `⚠️ Gargalo Crítico: ${gaps[0].etapa} (${Math.round(gaps[0].real)}% vs ${gaps[0].bench}%)` : "✅ Funil operando dentro ou acima da Metodologia MX.";
                const acao = gaps.length > 0 ? gaps[0].acao : "Manter ritmo e buscar superar meta global.";

                return { ...s, txLeadAgd, txAgdVis, txVisVnd, diagnostico, acao, performanceLabel };
            }).sort((a, b) => b.vnd - a.vnd);

            // Gerar CSV para anexo
            const csvBase64 = generateCSV(ranking);
            const fileName = `feedback_semanal_MX_${store.name.replace(/\s+/g, "_")}_${endDate}.csv`;

            const html = generateWeeklyHTML(store.name, startDate, endDate, teamAvg, ranking, benchmark, teamWeeklyGoal);
            
            // Enviar e-mail via Resend se configurado
            let emailStatus = "not_sent";
            if (resend && recipients.length > 0) {
                try {
                    const { error } = await resend.emails.send({
                        from: "MX Relatórios <relatorios@mxgestaopreditiva.com.br>",
                        to: recipients,
                        subject: `📊 Feedback Semanal MX: ${store.name} (${startDate} a ${endDate})`,
                        html: html,
                        attachments: [
                            {
                                filename: fileName,
                                content: csvBase64,
                            }
                        ]
                    });
                    if (error) {
                        console.error(`[Semanal] Error sending email for ${store.name}:`, error);
                        emailStatus = "failed";
                    } else {
                        emailStatus = "sent";
                    }
                } catch (err) {
                    console.error(`[Semanal] Critical error sending email for ${store.name}:`, err);
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

            reports.push({ store: store.name, sellers: ranking.length, top_gargalo: ranking[0]?.diagnostico, email: emailStatus });
            console.log(`[Semanal] Disparado para ${store.name}. Status E-mail: ${emailStatus}`);
        }

        return new Response(JSON.stringify({ message: `Processamento semanal concluído`, reports }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});

function generateCSV(ranking: any[]) {
    const headers = ["Vendedor", "Leads", "Agendamentos", "Visitas", "Vendas", "Diagnóstico"];
    const rows = ranking.map(r => [
        `"${r.name}"`,
        r.leads,
        r.agd,
        r.vis,
        r.vnd,
        `"${r.diagnostico}"`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    
    const encoder = new TextEncoder();
    const data = encoder.encode(csvContent);
    const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
}

function generateWeeklyHTML(storeName: string, start: string, end: string, avg: any, ranking: any[], bench: any, goal: number) {
    const wppText = encodeURIComponent(`*📊 FEEDBACK SEMANAL MX - ${storeName}*\n📅 Período: ${start} a ${end}\n\n🏆 *Resumo da Equipe*\n🎯 Meta Est.: ${goal}\n📈 Média: ${avg.leads}L | ${avg.agd}A | ${avg.vis}V | ${avg.vnd}Vnd\n\n*Destaque Individual:*\n${ranking.slice(0, 3).map((r, i) => `${i + 1}º ${r.name} - ${r.vnd}v`).join('\n')}\n\nConfira o relatório completo no e-mail ou no painel.`);

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
body{font-family:'Inter',sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px;line-height:1.5}
.c{max-width:680px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px -10px rgba(0,0,0,0.1);overflow:hidden}
.h{background:#0f172a;padding:48px 32px;text-align:center;border-bottom:4px solid #4f46e5}
.h h1{color:#fff;margin:0 0 12px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.h p{color:#94a3b8;margin:0;font-size:14px;text-transform:uppercase;letter-spacing:3px}
.content{padding:40px 32px}
.summary-box{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:32px}
.sb-item{text-align:center;padding:20px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0}
.sb-val{font-size:20px;font-weight:900;color:#0f172a;display:block}
.sb-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:700}
.card{background:#ffffff;border-radius:20px;padding:24px;margin-bottom:24px;border:1px solid #e2e8f0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
.name-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.name{font-size:18px;font-weight:900;color:#0f172a;margin:0;text-transform:uppercase;letter-spacing:1px}
.perf-badge{font-size:10px;font-weight:700;padding:6px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px}
.perf-above{background:#dcfce7;color:#166534}
.perf-below{background:#fee2e2;color:#991b1b}
.perf-avg{background:#f1f5f9;color:#475569}
.metrics{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px}
.m{text-align:center;padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9}
.mv{font-size:18px;font-weight:900;color:#0f172a;line-height:1}.ml{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.diag{background:#eff6ff;border:1px solid #bfdbfe;padding:16px;border-radius:12px;font-size:13px;color:#1e3a8a;margin-bottom:12px;line-height:1.4}
.acao{background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:12px;font-size:13px;color:#065f46;font-weight:600;line-height:1.4}
.btn{display:block;width:100%;background:#4f46e5;color:#fff;text-align:center;padding:18px;border-radius:14px;text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-top:24px;box-shadow:0 4px 14px 0 rgba(79,70,229,0.3)}
.btn-wpp{background:#25d366;box-shadow:0 4px 14px 0 rgba(37,211,102,0.3);margin-top:12px}
.f{text-align:center;padding:32px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #f1f5f9;background:#fcfcfc}
</style></head><body><div class="c">
<div class="h"><h1>📊 Feedback Semanal</h1><p>${storeName} • ${start} a ${end}</p></div>
<div class="content">
<div class="summary-box">
<div class="sb-item"><span class="sb-val">${goal}</span><span class="sb-label">Meta Semanal Est.</span></div>
<div class="sb-item"><span class="sb-val">${avg.leads} | ${avg.agd} | ${avg.vis} | ${avg.vnd}</span><span class="sb-label">Média da Equipe</span></div>
</div>
${ranking.map((r: any) => {
        const perfClass = r.performanceLabel.includes('acima') ? 'perf-above' : r.performanceLabel.includes('abaixo') ? 'perf-below' : 'perf-avg';
        return `
<div class="card">
<div class="name-row">
<h3 class="name">${r.name}</h3>
<span class="perf-badge ${perfClass}">${r.performanceLabel}</span>
</div>
<div class="metrics">
<div class="m"><div class="mv">${r.leads}</div><div class="ml">Leads</div></div>
<div class="m"><div class="mv">${r.agd}</div><div class="ml">Agend.</div></div>
<div class="m"><div class="mv">${r.vis}</div><div class="ml">Visitas</div></div>
<div class="m"><div class="mv">${r.vnd}</div><div class="ml">Vendas</div></div>
</div>
<div class="diag"><strong>Diagnóstico (Bench ${bench.lead_to_agend}/${bench.agend_to_visit}/${bench.visit_to_sale}):</strong><br>${r.diagnostico}</div>
<div class="acao"><strong>🎯 Ação Orientada:</strong><br>${r.acao}</div>
</div>
`}).join("")}
<a href="https://autogestao.vercel.app/feedback" class="btn">ACESSAR PAINEL DE FEEDBACK</a>
<a href="https://api.whatsapp.com/send?text=${wppText}" class="btn btn-wpp">ENVIAR VIA WHATSAPP</a>
</div>
<div class="f">MX Gestão Preditiva © 2026</div>
</div></body></html>`;
}
