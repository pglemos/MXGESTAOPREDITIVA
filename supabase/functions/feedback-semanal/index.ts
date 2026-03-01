import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (_req: Request) => {
    try {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const startDate = weekAgo.toISOString().split("T")[0];
        const endDate = now.toISOString().split("T")[0];

        const { data: stores } = await supabase
            .from("stores")
            .select("*")
            .eq("active", true);
        if (!stores?.length) {
            return new Response(JSON.stringify({ message: "No stores" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        const reports: any[] = [];

        for (const store of stores) {
            const { data: checkins } = await supabase
                .from("daily_checkins")
                .select("*")
                .eq("store_id", store.id)
                .gte("date", startDate)
                .lte("date", endDate);

            const { data: benchmark } = await supabase
                .from("benchmarks")
                .select("*")
                .eq("store_id", store.id)
                .single();

            if (!checkins) continue;

            // Aggregate
            const leads = checkins.reduce((s, c) => s + (c.leads || 0), 0);
            const agdTotal = checkins.reduce(
                (s, c) => s + (c.agd_cart || 0) + (c.agd_net || 0),
                0
            );
            const visitas = checkins.reduce((s, c) => s + (c.visitas || 0), 0);
            const vndTotal = checkins.reduce(
                (s, c) =>
                    s + (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0),
                0
            );
            const vndPorta = checkins.reduce(
                (s, c) => s + (c.vnd_porta || 0),
                0
            );
            const vndCart = checkins.reduce(
                (s, c) => s + (c.vnd_cart || 0),
                0
            );
            const vndNet = checkins.reduce((s, c) => s + (c.vnd_net || 0), 0);

            const txLeadAgd = leads > 0 ? Math.round((agdTotal / leads) * 100) : 0;
            const txAgdVis =
                agdTotal > 0 ? Math.round((visitas / agdTotal) * 100) : 0;
            const txVisVnd =
                visitas > 0 ? Math.round((vndTotal / visitas) * 100) : 0;

            // Identify bottleneck
            let gargalo = "Funil saudável ✅";
            if (benchmark) {
                const gaps = [
                    {
                        etapa: "Lead → Agendamento",
                        real: txLeadAgd,
                        bench: benchmark.lead_to_appt,
                    },
                    {
                        etapa: "Agendamento → Visita",
                        real: txAgdVis,
                        bench: benchmark.appt_to_visit,
                    },
                    {
                        etapa: "Visita → Venda",
                        real: txVisVnd,
                        bench: benchmark.visit_to_sale,
                    },
                ]
                    .filter((g) => g.real < g.bench)
                    .sort((a, b) => b.bench - b.real - (a.bench - a.real));

                if (gaps.length > 0) {
                    gargalo = `⚠️ Gargalo: ${gaps[0].etapa} (${gaps[0].real}% vs benchmark ${gaps[0].bench}%)`;
                }
            }

            // Unique check-in days
            const uniqueDays = new Set(checkins.map((c) => c.date)).size;

            reports.push({
                store: store.name,
                periodo: `${startDate} → ${endDate}`,
                dias_com_dados: uniqueDays,
                leads,
                agd_total: agdTotal,
                visitas,
                vnd_total: vndTotal,
                vnd_porta: vndPorta,
                vnd_cart: vndCart,
                vnd_net: vndNet,
                tx_lead_agd: txLeadAgd,
                tx_agd_vis: txAgdVis,
                tx_vis_vnd: txVisVnd,
                gargalo,
            });

            console.log(
                `[feedback-semanal] ${store.name}: ${vndTotal} vendas, gargalo: ${gargalo}`
            );
        }

        return new Response(
            JSON.stringify({
                message: `Feedback semanal gerado para ${reports.length} lojas`,
                periodo: `${startDate} → ${endDate}`,
                reports,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    Connection: "keep-alive",
                },
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
