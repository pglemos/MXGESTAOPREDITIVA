import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (_req: Request) => {
    try {
        const now = new Date();
        // Previous month
        const prevMonth = now.getMonth(); // 0-indexed (if now=March, prevMonth=2 but we want February=2)
        const year = prevMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const month = prevMonth === 0 ? 12 : prevMonth;
        const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
        const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

        const { data: stores } = await supabase
            .from("stores")
            .select("*")
            .eq("active", true);
        if (!stores?.length) {
            return new Response(JSON.stringify({ message: "No stores" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        const globalRanking: any[] = [];
        const storeReports: any[] = [];

        for (const store of stores) {
            const { data: members } = await supabase
                .from("memberships")
                .select("user_id, users(name)")
                .eq("store_id", store.id)
                .eq("role", "vendedor");

            const { data: checkins } = await supabase
                .from("daily_checkins")
                .select("*")
                .eq("store_id", store.id)
                .gte("date", startOfMonth)
                .lte("date", endOfMonth);

            const { data: goalData } = await supabase
                .from("goals")
                .select("target, user_id")
                .eq("store_id", store.id)
                .eq("month", month)
                .eq("year", year);

            const storeGoal =
                goalData?.find((g: any) => g.user_id === null)?.target || 0;

            // Aggregate per seller
            const agg = new Map<string, any>();
            for (const m of members || []) {
                const u = (m as any).users;
                agg.set(m.user_id, {
                    uid: m.user_id,
                    name: u?.name || "Vendedor",
                    store_name: store.name,
                    leads: 0,
                    agd: 0,
                    vis: 0,
                    vp: 0,
                    vc: 0,
                    vn: 0,
                });
            }
            for (const c of checkins || []) {
                const a = agg.get(c.user_id);
                if (a) {
                    a.leads += c.leads || 0;
                    a.agd += (c.agd_cart || 0) + (c.agd_net || 0);
                    a.vis += c.visitas || 0;
                    a.vp += c.vnd_porta || 0;
                    a.vc += c.vnd_cart || 0;
                    a.vn += c.vnd_net || 0;
                }
            }

            const sellers = Array.from(agg.values()).map((s) => ({
                ...s,
                vt: s.vp + s.vc + s.vn,
                sg:
                    goalData?.find((g: any) => g.user_id === s.uid)?.target || 0,
            }));

            const totalVendas = sellers.reduce(
                (sum: number, s: any) => sum + s.vt,
                0
            );
            const pct =
                storeGoal > 0
                    ? Math.round((totalVendas / storeGoal) * 100)
                    : 0;

            storeReports.push({
                store: store.name,
                meta: storeGoal,
                vendas: totalVendas,
                pct,
                porta: sellers.reduce((s: number, x: any) => s + x.vp, 0),
                carteira: sellers.reduce((s: number, x: any) => s + x.vc, 0),
                internet: sellers.reduce((s: number, x: any) => s + x.vn, 0),
                vendedores: sellers.length,
                campeao: sellers.sort((a: any, b: any) => b.vt - a.vt)[0]
                    ?.name || "-",
            });

            globalRanking.push(...sellers);
        }

        // Sort global ranking
        const topSellers = globalRanking
            .sort((a: any, b: any) => b.vt - a.vt)
            .slice(0, 20)
            .map((s: any, i: number) => ({
                position: i + 1,
                name: s.name,
                store: s.store_name,
                vendas: s.vt,
                porta: s.vp,
                carteira: s.vc,
                internet: s.vn,
            }));

        const monthName = new Date(year, month - 1).toLocaleDateString(
            "pt-BR",
            { month: "long", year: "numeric" }
        );

        return new Response(
            JSON.stringify({
                message: `Relatório mensal ${monthName} gerado`,
                periodo: `${startOfMonth} → ${endOfMonth}`,
                resumo: {
                    total_vendas: storeReports.reduce(
                        (s, r) => s + r.vendas,
                        0
                    ),
                    total_meta: storeReports.reduce((s, r) => s + r.meta, 0),
                    pct_global:
                        storeReports.reduce((s, r) => s + r.meta, 0) > 0
                            ? Math.round(
                                (storeReports.reduce((s, r) => s + r.vendas, 0) /
                                    storeReports.reduce((s, r) => s + r.meta, 0)) *
                                100
                            )
                            : 0,
                },
                lojas: storeReports,
                top_vendedores: topSellers,
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
