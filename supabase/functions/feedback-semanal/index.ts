import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (_req: Request) => {
    try {
        const now = new Date();
        const endDateDate = new Date(now);
        endDateDate.setDate(endDateDate.getDate() - 1); // Yesterday (Sunday)
        const endDate = endDateDate.toISOString().split("T")[0];
        
        const startDateDate = new Date(endDateDate);
        startDateDate.setDate(startDateDate.getDate() - 6); // Monday
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

            const { data: sellers } = await supabase.from("store_sellers").select("seller_user_id, is_active, users:seller_user_id(name, email)").eq("store_id", store.id).eq("is_active", true);
            const { data: checkins } = await supabase.from("daily_checkins").select("*").eq("store_id", store.id).gte("reference_date", startDate).lte("reference_date", endDate);
            
            const { data: benchmarkData } = await supabase.from("store_benchmarks").select("*").eq("store_id", store.id).single();
            const benchmark = benchmarkData || { lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 };

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

                const gaps = [
                    { etapa: "Lead → Agendamento", real: txLeadAgd, bench: benchmark.lead_to_agend, acao: "Aumentar volume de ligações e focar no script de quebra de objeção ao telefone." },
                    { etapa: "Agendamento → Visita", real: txAgdVis, bench: benchmark.agend_to_visit, acao: "Reforçar follow-up na véspera e aumentar perceived value do showroom." },
                    { etapa: "Visita → Venda", real: txVisVnd, bench: benchmark.visit_to_sale, acao: "Trabalhar contorno de objeção presencial e teste drive focado." }
                ].filter(g => g.real < g.bench).sort((a, b) => (b.bench - b.real) - (a.bench - a.real));

                const diagnostico = gaps.length > 0 ? `⚠️ Gargalo Crítico: ${gaps[0].etapa} (${Math.round(gaps[0].real)}% vs ${gaps[0].bench}%)` : "✅ Funil operando dentro ou acima da Metodologia MX.";
                const acao = gaps.length > 0 ? gaps[0].acao : "Manter ritmo e buscar superar meta global.";

                return { ...s, txLeadAgd, txAgdVis, txVisVnd, diagnostico, acao };
            }).sort((a, b) => b.vnd - a.vnd);

            const html = generateWeeklyHTML(store.name, startDate, endDate, teamAvg, ranking, benchmark);
            
            await supabase.from("reprocess_logs").insert({ store_id: store.id, source_type: idempotencyKey, status: 'completed' });
            reports.push({ store: store.name, sellers: ranking.length, top_gargalo: ranking[0]?.diagnostico });
            console.log(`[Semanal] Disparado para ${store.name}`);
        }

        return new Response(JSON.stringify({ message: `Processamento semanal concluído`, reports }), { headers: { "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});

function generateWeeklyHTML(storeName: string, start: string, end: string, avg: any, ranking: any[], bench: any) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px}
.c{max-width:680px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 4px 20px rgba(0,0,0,0.05);overflow:hidden}
.h{background:#1e1b4b;padding:32px;text-align:center}
.h h1{color:#fff;margin:0 0 8px;font-size:24px;text-transform:uppercase;letter-spacing:1px}.h p{color:#818cf8;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px}
.content{padding:32px}
.card{background:#f1f5f9;border-radius:16px;padding:20px;margin-bottom:24px;border:1px solid #e2e8f0}
.name{font-size:18px;font-weight:900;color:#0f172a;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px}
.metrics{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:16px}
.m{text-align:center;padding:12px;background:#fff;border-radius:12px;border:1px solid #e2e8f0}
.mv{font-size:20px;font-weight:900;color:#1e1b4b;line-height:1}.ml{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.diag{background:#eff6ff;border:1px solid #bfdbfe;padding:16px;border-radius:12px;font-size:13px;color:#1e3a8a;margin-bottom:8px}
.acao{background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:12px;font-size:13px;color:#065f46;font-weight:600}
.avg{text-align:center;padding:16px;background:#f8fafc;border-radius:12px;font-size:11px;font-weight:bold;margin-bottom:32px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.f{text-align:center;padding:20px;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-top:1px solid #f1f5f9}
.btn{display:block;width:100%;background:#4f46e5;color:#fff;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:24px}
</style></head><body><div class="c">
<div class="h"><h1>📊 Feedback Semanal</h1><p>${storeName} • ${start} a ${end}</p></div>
<div class="content">
<div class="avg">Média da Equipe: ${avg.leads} Leads | ${avg.agd} Agd | ${avg.vis} Vis | ${avg.vnd} Vendas</div>
${ranking.map((r: any) => `
<div class="card">
<h3 class="name">${r.name}</h3>
<div class="metrics">
<div class="m"><div class="mv">${r.leads}</div><div class="ml">Leads</div></div>
<div class="m"><div class="mv">${r.agd}</div><div class="ml">Agend.</div></div>
<div class="m"><div class="mv">${r.vis}</div><div class="ml">Visitas</div></div>
<div class="m"><div class="mv">${r.vnd}</div><div class="ml">Vendas</div></div>
</div>
<div class="diag"><strong>Diagnóstico (Benchmark ${bench.lead_to_agend}/${bench.agend_to_visit}/${bench.visit_to_sale}):</strong><br>${r.diagnostico}</div>
<div class="acao"><strong>🎯 Ação Orientada:</strong><br>${r.acao}</div>
</div>
`).join("")}
<a href="https://autogestao.vercel.app/feedback" class="btn">ACESSAR PAINEL DE FEEDBACK COMPLETO</a>
</div>
<div class="f">MX Gestão Preditiva © 2026</div>
</div></body></html>`;
}
