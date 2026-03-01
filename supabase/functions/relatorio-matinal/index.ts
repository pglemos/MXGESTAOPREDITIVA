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
        const daysElapsed = now.getDate();
        const totalDays = new Date(year, month, 0).getDate();
        const daysRemaining = totalDays - daysElapsed;

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
            const { data: members } = await supabase
                .from("memberships")
                .select("user_id, users(name, email)")
                .eq("store_id", store.id)
                .eq("role", "vendedor");

            const { data: checkins } = await supabase
                .from("daily_checkins")
                .select("*")
                .eq("store_id", store.id)
                .gte("date", startOfMonth)
                .lte("date", today);

            const { data: goalData } = await supabase
                .from("goals")
                .select("target, user_id")
                .eq("store_id", store.id)
                .eq("month", month)
                .eq("year", year);

            const storeGoal =
                goalData?.find((g: any) => g.user_id === null)?.target || 0;

            // Check yesterday's check-in
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yStr = yesterday.toISOString().split("T")[0];
            const { data: yCheckins } = await supabase
                .from("daily_checkins")
                .select("user_id")
                .eq("store_id", store.id)
                .eq("date", yStr);
            const checkedY = new Set(
                (yCheckins || []).map((c: any) => c.user_id)
            );

            // Aggregate per seller
            const agg = new Map<string, any>();
            for (const m of members || []) {
                const u = (m as any).users;
                agg.set(m.user_id, {
                    uid: m.user_id,
                    name: u?.name || "Vendedor",
                    email: u?.email,
                    leads: 0,
                    ac: 0,
                    an: 0,
                    vp: 0,
                    vc: 0,
                    vn: 0,
                    vis: 0,
                });
            }
            for (const c of checkins || []) {
                const a = agg.get(c.user_id);
                if (a) {
                    a.leads += c.leads || 0;
                    a.ac += c.agd_cart || 0;
                    a.an += c.agd_net || 0;
                    a.vp += c.vnd_porta || 0;
                    a.vc += c.vnd_cart || 0;
                    a.vn += c.vnd_net || 0;
                    a.vis += c.visitas || 0;
                }
            }

            const ranking = Array.from(agg.values())
                .map((s) => ({
                    ...s,
                    at: s.ac + s.an,
                    vt: s.vp + s.vc + s.vn,
                    sg:
                        goalData?.find((g: any) => g.user_id === s.uid)?.target || 0,
                    cy: checkedY.has(s.uid),
                }))
                .sort((a, b) => b.vt - a.vt);

            const tv = ranking.reduce((s: number, r: any) => s + r.vt, 0);
            const pct = storeGoal > 0 ? Math.round((tv / storeGoal) * 100) : 0;
            const proj =
                daysElapsed > 0 ? Math.round((tv / daysElapsed) * totalDays) : 0;
            const falta = Math.max(storeGoal - tv, 0);

            // Generate HTML email
            const html = generateHTML(
                store.name,
                now,
                tv,
                storeGoal,
                pct,
                proj,
                falta,
                daysRemaining,
                ranking,
                year
            );

            reports.push({
                store: store.name,
                total_vendas: tv,
                meta: storeGoal,
                pct,
                projecao: proj,
                sellers: ranking.length,
            });

            // TODO: Integrate with Resend/SendGrid for actual email delivery
            if (store.manager_email) {
                console.log(
                    `[relatorio-matinal] Email to ${store.manager_email} for ${store.name}`
                );
            }
        }

        return new Response(
            JSON.stringify({
                message: `Relatório matinal gerado para ${reports.length} lojas`,
                generated_at: now.toISOString(),
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

function generateHTML(
    storeName: string,
    now: Date,
    tv: number,
    meta: number,
    pct: number,
    proj: number,
    falta: number,
    dr: number,
    ranking: any[],
    year: number
) {
    const clr = (v: number, t: number) =>
        t > 0
            ? (v / t) * 100 >= 80
                ? "color:#34d399"
                : (v / t) * 100 >= 50
                    ? "color:#fbbf24"
                    : "color:#f87171"
            : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:20px}
.c{max-width:680px;margin:0 auto}
.h{background:linear-gradient(135deg,#1e40af,#059669);border-radius:16px;padding:24px;text-align:center;margin-bottom:20px}
.h h1{color:#fff;margin:0 0 4px;font-size:22px}.h p{color:rgba(255,255,255,.7);margin:0;font-size:13px}
.ss{display:flex;gap:12px;margin-bottom:20px}
.s{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px;text-align:center}
.sv{font-size:28px;font-weight:700;color:#fff}.sl{font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase}
table{width:100%;border-collapse:collapse;background:rgba(255,255,255,.03);border-radius:12px;overflow:hidden}
th{background:rgba(255,255,255,.05);padding:10px 12px;text-align:left;font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase}
td{padding:10px 12px;border-top:1px solid rgba(255,255,255,.05);font-size:13px}
.f{text-align:center;padding:20px;color:rgba(255,255,255,.3);font-size:11px}
</style></head><body><div class="c">
<div class="h"><h1>📊 Relatório Matinal — ${storeName}</h1>
<p>${now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
<div class="ss">
<div class="s"><div class="sv" style="${clr(tv, meta)}">${tv}</div><div class="sl">Vendas</div></div>
<div class="s"><div class="sv">${meta}</div><div class="sl">Meta</div></div>
<div class="s"><div class="sv" style="${clr(tv, meta)}">${pct}%</div><div class="sl">Ating.</div></div>
<div class="s"><div class="sv">${proj}</div><div class="sl">Projeção</div></div>
</div>
<p style="color:rgba(255,255,255,.6);font-size:13px">📌 Faltam <strong>${falta}</strong> vendas em <strong>${dr}</strong> dias (${dr > 0 ? (falta / dr).toFixed(1) : 0}/dia)</p>
<table><thead><tr><th>#</th><th>Vendedor</th><th>Leads</th><th>AGD</th><th>Vis</th><th>P</th><th>C</th><th>I</th><th>VND</th><th>%</th><th>Ontem</th></tr></thead>
<tbody>${ranking
            .map(
                (r: any, i: number) =>
                    `<tr><td>${i + 1}º</td><td><strong>${r.name}</strong></td><td>${r.leads}</td><td>${r.at}</td><td>${r.vis}</td><td>${r.vp}</td><td>${r.vc}</td><td>${r.vn}</td><td><strong>${r.vt}</strong></td><td style="${clr(r.vt, r.sg)}">${r.sg > 0 ? Math.round((r.vt / r.sg) * 100) : "-"}%</td><td>${r.cy ? "✅" : "❌"}</td></tr>`
            )
            .join("")}</tbody></table>
<div class="f">MX Gestão Preditiva · MX Consultoria © ${year}</div>
</div></body></html>`;
}
