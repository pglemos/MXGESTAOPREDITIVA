import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const appUrl = Deno.env.get("APP_URL") || "https://autogestao.vercel.app";
const supabase = createClient(supabaseUrl, serviceKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type WeeklyRequest = {
    store_id?: string;
    dry_run?: boolean;
    force?: boolean;
};

type SellerRow = {
    uid: string;
    name: string;
    email: string | null;
    is_venda_loja: boolean;
    leads: number;
    agd: number;
    vis: number;
    vnd: number;
};

type RankingRow = SellerRow & {
    txLeadAgd: number;
    txAgdVis: number;
    txVisVnd: number;
    performanceLabel: string;
    diagnostic: string;
    action: string;
    bottleneck: string | null;
    criterion: string;
};

Deno.serve(async (req: Request) => {
    try {
        const body = await parseBody(req);
        const dates = getSaoPauloPreviousWeek();
        const { data: stores, error: storesError } = await buildStoreQuery(body.store_id);

        if (storesError) throw storesError;
        if (!stores?.length) return jsonResponse({ message: "No active stores", reports: [] });

        const reports = [];

        for (const store of stores) {
            const idempotencyKey = `semanal-${store.id}-${dates.weekStart}-${dates.weekEnd}`;
            const { data: existingLog } = await supabase
                .from("reprocess_logs")
                .select("id")
                .eq("source_type", idempotencyKey)
                .eq("status", "completed")
                .maybeSingle();

            if (existingLog && !body.force && !body.dry_run) {
                reports.push({ store: store.name, skipped: true, reason: "already_sent" });
                continue;
            }

            const payload = await buildWeeklyPayload(store, dates);
            const html = generateWeeklyHTML(payload);
            const xlsxBase64 = generateWeeklyXLSX(payload);
            const baseFileName = `feedback_semanal_MX_${store.name.replace(/\s+/g, "_")}_${dates.weekEnd}`;
            let emailStatus: "sent" | "failed" | "not_sent" | "dry_run" = body.dry_run ? "dry_run" : "not_sent";
            let warnings: string[] = [];

            if (!body.dry_run) {
                if (!resend) {
                    warnings = ["RESEND_API_KEY nao configurada"];
                } else if (payload.recipients.length === 0) {
                    warnings = ["Nenhum destinatario semanal configurado"];
                } else {
                    try {
                        const { error } = await resend.emails.send({
                            from: "MX Relatórios <relatorios@mxperformance.com.br>",
                            to: payload.recipients,
                            subject: `Feedback Semanal MX: ${store.name} (${formatPtBrDate(dates.weekStart)} a ${formatPtBrDate(dates.weekEnd)})`,
                            html,
                            attachments: [
                                { filename: `${baseFileName}.xlsx`, content: xlsxBase64 }
                            ],
                        });

                        if (error) {
                            console.error(`[Semanal] Error sending email for ${store.name}:`, error);
                            emailStatus = "failed";
                            warnings = ["Falha no disparo do e-mail"];
                        } else {
                            emailStatus = "sent";
                        }
                    } catch (err) {
                        console.error(`[Semanal] Critical error sending email for ${store.name}:`, err);
                        emailStatus = "failed";
                        warnings = ["Erro critico no disparo do e-mail"];
                    }
                }

                await supabase.from("weekly_feedback_reports").upsert({
                    store_id: store.id,
                    week_start: dates.weekStart,
                    week_end: dates.weekEnd,
                    team_avg_json: payload.teamAvg,
                    ranking_json: payload.ranking,
                    benchmark_json: payload.benchmark,
                    weekly_goal: payload.weeklyGoal,
                    report_url: payload.reportUrl,
                    email_status: emailStatus,
                    recipients: payload.recipients,
                    warnings,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "store_id,week_start,week_end" });

                await supabase.from("reprocess_logs").insert({
                    store_id: store.id,
                    source_type: idempotencyKey,
                    status: emailStatus === "sent" ? "completed" : "failed",
                    rows_processed: payload.ranking.length,
                    records_processed: payload.ranking.length,
                    warnings,
                    errors: emailStatus === "failed" ? warnings : [],
                    started_at: new Date().toISOString(),
                    finished_at: new Date().toISOString(),
                });
            }

            reports.push({
                store: store.name,
                week_start: dates.weekStart,
                week_end: dates.weekEnd,
                sellers: payload.ranking.length,
                top_bottleneck: payload.ranking[0]?.diagnostic || null,
                recipients: payload.recipients.length,
                email: emailStatus,
                dry_run: body.dry_run || false,
            });

            // --- EPIC-12: Fan-out de Notificações de Performance ---
            if (!body.dry_run) {
                for (const row of payload.ranking) {
                    if (row.bottleneck) {
                        // Notificar o Vendedor sobre o seu gargalo principal
                        await supabase.from("notifications").insert({
                            recipient_id: row.uid,
                            store_id: store.id,
                            title: "Alerta de Funil MX",
                            message: `Seu principal gargalo na última semana foi: ${row.bottleneck === 'lead_agendamento' ? 'Lead para Agendamento' : row.bottleneck === 'agendamento_visita' ? 'Agendamento para Visita' : 'Visita para Venda'}. Acesse seu treinamento prescrito.`,
                            type: 'performance',
                            priority: 'medium',
                            link: `/treinamentos`
                        });
                    }
                }
            }
        }

        return jsonResponse({ message: "Processamento semanal concluido", reports });
    } catch (error) {
        console.error("[Semanal] Fatal error:", error);
        return jsonResponse({ error: String(error) }, 500);
    }
});

async function parseBody(req: Request): Promise<WeeklyRequest> {
    if (req.method !== "POST") return {};
    try {
        return await req.json();
    } catch {
        return {};
    }
}

function getSaoPauloPreviousWeek() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const today = formatter.format(new Date());
    const [year, month, day] = today.split("-").map(Number);
    const localNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = localNoon.getUTCDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    const currentMonday = new Date(localNoon);
    currentMonday.setUTCDate(localNoon.getUTCDate() - daysSinceMonday);
    const previousMonday = new Date(currentMonday);
    previousMonday.setUTCDate(currentMonday.getUTCDate() - 7);
    const previousSunday = new Date(currentMonday);
    previousSunday.setUTCDate(currentMonday.getUTCDate() - 1);

    return {
        today,
        weekStart: formatter.format(previousMonday),
        weekEnd: formatter.format(previousSunday),
        year,
    };
}

function buildStoreQuery(storeId?: string) {
    let query = supabase.from("stores").select("*").eq("active", true).order("name");
    if (storeId) query = query.eq("id", storeId);
    return query;
}

async function buildWeeklyPayload(store: any, dates: ReturnType<typeof getSaoPauloPreviousWeek>) {
    const [deliveryRulesRes, tenuresRes, fallbackMembersRes, checkinsRes, benchmarkRes, metaRulesRes] = await Promise.all([
        supabase.from("store_delivery_rules").select("weekly_recipients").eq("store_id", store.id).maybeSingle(),
        supabase.from("store_sellers").select("seller_user_id, is_active, users:seller_user_id(name, email, is_venda_loja)").eq("store_id", store.id).eq("is_active", true),
        supabase.from("memberships").select("user_id, users(name, email, is_venda_loja)").eq("store_id", store.id).eq("role", "vendedor"),
        supabase.from("daily_checkins").select("*").eq("store_id", store.id).eq("metric_scope", "daily").gte("reference_date", dates.weekStart).lte("reference_date", dates.weekEnd),
        supabase.from("store_benchmarks").select("lead_to_agend, agend_to_visit, visit_to_sale").eq("store_id", store.id).maybeSingle(),
        supabase.from("store_meta_rules").select("monthly_goal, bench_lead_agd, bench_agd_visita, bench_visita_vnd").eq("store_id", store.id).maybeSingle(),
    ]);

    const tenureRows = tenuresRes.data && tenuresRes.data.length > 0
        ? tenuresRes.data.map((item: any) => ({ user_id: item.seller_user_id, users: item.users }))
        : (fallbackMembersRes.data || []);

    const agg = new Map<string, SellerRow>();
    for (const row of tenureRows) {
        const user = (row as any).users;
        agg.set(row.user_id, {
            uid: row.user_id,
            name: user?.name || "Vendedor",
            email: user?.email || null,
            is_venda_loja: user?.is_venda_loja || false,
            leads: 0,
            agd: 0,
            vis: 0,
            vnd: 0,
        });
    }

    for (const checkin of checkinsRes.data || []) {
        const seller = agg.get(checkin.seller_user_id);
        if (!seller) continue;

        seller.leads += checkin.leads_prev_day || 0;
        seller.agd += (checkin.agd_cart_prev_day || 0) + (checkin.agd_net_prev_day || 0);
        seller.vis += checkin.visit_prev_day || 0;
        seller.vnd += (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0);
    }

    const benchmark = {
        lead_to_agend: benchmarkRes.data?.lead_to_agend ?? metaRulesRes.data?.bench_lead_agd ?? 20,
        agend_to_visit: benchmarkRes.data?.agend_to_visit ?? metaRulesRes.data?.bench_agd_visita ?? 60,
        visit_to_sale: benchmarkRes.data?.visit_to_sale ?? metaRulesRes.data?.bench_visita_vnd ?? 33,
    };
    const monthlyGoal = metaRulesRes.data?.monthly_goal || 0;
    const weeklyGoal = Math.round(monthlyGoal / 4);
    const activeCount = agg.size || 1;
    const teamTotal = Array.from(agg.values()).reduce((total, seller) => ({
        leads: total.leads + seller.leads,
        agd: total.agd + seller.agd,
        vis: total.vis + seller.vis,
        vnd: total.vnd + seller.vnd,
    }), { leads: 0, agd: 0, vis: 0, vnd: 0 });
    const teamAvg = {
        leads: Math.round(teamTotal.leads / activeCount),
        agd: Math.round(teamTotal.agd / activeCount),
        vis: Math.round(teamTotal.vis / activeCount),
        vnd: Math.round(teamTotal.vnd / activeCount),
        txLeadAgd: rate(teamTotal.agd, teamTotal.leads),
        txAgdVis: rate(teamTotal.vis, teamTotal.agd),
        txVisVnd: rate(teamTotal.vnd, teamTotal.vis),
    };

    const ranking = Array.from(agg.values())
        .map((seller) => buildRankingRow(seller, teamAvg, benchmark))
        .sort((a, b) => {
            if (b.vnd !== a.vnd) return b.vnd - a.vnd;
            if (b.vis !== a.vis) return b.vis - a.vis;
            return b.leads - a.leads;
        });

    return {
        store,
        recipients: deliveryRulesRes.data?.weekly_recipients || [],
        weekStart: dates.weekStart,
        weekEnd: dates.weekEnd,
        year: dates.year,
        benchmark,
        monthlyGoal,
        weeklyGoal,
        teamTotal,
        teamAvg,
        ranking,
        reportUrl: `${appUrl}/feedback?store_id=${store.id}&week=${dates.weekStart}`,
    };
}

function buildRankingRow(seller: SellerRow, teamAvg: Record<string, number>, benchmark: Record<string, number>): RankingRow {
    const txLeadAgd = rate(seller.agd, seller.leads);
    const txAgdVis = rate(seller.vis, seller.agd);
    const txVisVnd = rate(seller.vnd, seller.vis);
    const desvio = seller.vnd - (teamAvg.vnd || 0);
    const performanceLabel = desvio > 0 ? `+${desvio} acima da media` : desvio < 0 ? `${desvio} abaixo da media` : "Na media da equipe";
    const gaps = [
        {
            key: "lead_agendamento",
            label: "Lead para Agendamento",
            real: txLeadAgd,
            bench: benchmark.lead_to_agend,
            action: "Priorizar velocidade de primeiro contato, script de agendamento e quebra de objecao por telefone.",
        },
        {
            key: "agendamento_visita",
            label: "Agendamento para Visita",
            real: txAgdVis,
            bench: benchmark.agend_to_visit,
            action: "Reforcar confirmacao na vespera, criacao de valor percebido e compromisso de comparecimento.",
        },
        {
            key: "visita_venda",
            label: "Visita para Venda",
            real: txVisVnd,
            bench: benchmark.visit_to_sale,
            action: "Revisar demonstracao, contorno de objecoes, test drive e fechamento presencial.",
        },
    ]
        .filter((gap) => gap.real < gap.bench)
        .sort((a, b) => (b.bench - b.real) - (a.bench - a.real));

    const mainGap = gaps[0];
    const diagnostic = mainGap
        ? `Gargalo principal: ${mainGap.label} (${mainGap.real}% vs ${mainGap.bench}% ideal).`
        : "Funil dentro ou acima do criterio MX.";

    return {
        ...seller,
        txLeadAgd,
        txAgdVis,
        txVisVnd,
        performanceLabel,
        diagnostic,
        action: mainGap?.action || "Manter disciplina de check-in e elevar volume de leads qualificados.",
        bottleneck: mainGap?.key || null,
        criterion: `Criterio MX: ${benchmark.lead_to_agend}/${benchmark.agend_to_visit}/${benchmark.visit_to_sale}.`,
    };
}

function rate(numerator: number, denominator: number) {
    if (denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 100);
}

function generateWeeklyXLSX(payload: any) {
    const { ranking, teamAvg, benchmark, store, weekStart, weekEnd } = payload;
    
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Benchmark">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E3A8A" ss:Bold="1"/>
   <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="RESUMO DA LOJA">
  <Table>
   <Row><Cell><Data ss:Type="String">LOJA: ${escapeXml(store.name)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">PERIODO: ${weekStart} a ${weekEnd}</Data></Cell></Row>
   <Row ss:Index="4" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell><Data ss:Type="String">Leads</Data></Cell>
    <Cell><Data ss:Type="String">Agendamentos</Data></Cell>
    <Cell><Data ss:Type="String">Visitas</Data></Cell>
    <Cell><Data ss:Type="String">Vendas</Data></Cell>
    <Cell><Data ss:Type="String">Tx Conversao</Data></Cell>
   </Row>
   ${ranking.map((row: any) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.leads}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.agd}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vis}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vnd}</Data></Cell>
    <Cell><Data ss:Type="String">${row.txVisVnd}%</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>`;

    for (const seller of ranking) {
        const safeName = escapeXml(seller.name).substring(0, 30).replace(/[\\/?*\[\]]/g, '');
        xml += `
 <Worksheet ss:Name="${safeName}">
  <Table ss:ExpandedColumnCount="2">
   <Row><Cell ss:MergeAcross="1" ss:StyleID="Header"><Data ss:Type="String">ANÁLISE DE FUNIL: ${escapeXml(seller.name)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Métrica</Data></Cell><Cell><Data ss:Type="String">Valor</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Leads</Data></Cell><Cell><Data ss:Type="Number">${seller.leads}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Agendamentos</Data></Cell><Cell><Data ss:Type="Number">${seller.agd}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Visitas</Data></Cell><Cell><Data ss:Type="Number">${seller.vis}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Vendas</Data></Cell><Cell><Data ss:Type="Number">${seller.vnd}</Data></Cell></Row>
   <Row ss:Index="8" ss:StyleID="Benchmark"><Cell><Data ss:Type="String">TAXA REAL VS CRITERIO MX</Data></Cell><Cell><Data ss:Type="String">${benchmark.lead_to_agend}% / ${benchmark.agend_to_visit}% / ${benchmark.visit_to_sale}%</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">L -> A</Data></Cell><Cell><Data ss:Type="String">${seller.txLeadAgd}%</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">A -> V</Data></Cell><Cell><Data ss:Type="String">${seller.txAgdVis}%</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">V -> V</Data></Cell><Cell><Data ss:Type="String">${seller.txVisVnd}%</Data></Cell></Row>
   <Row ss:Index="13" ss:StyleID="Header"><Cell ss:MergeAcross="1"><Data ss:Type="String">DIAGNÓSTICO E PLANO DE AÇÃO</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">${escapeXml(seller.diagnostic)}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">${escapeXml(seller.action)}</Data></Cell></Row>
  </Table>
 </Worksheet>`;
    }

    xml += `\n</Workbook>`;

    const data = new TextEncoder().encode(xml);
    const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
}

function escapeXml(unsafe: string) {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

function generateWeeklyWhatsAppText(payload: Awaited<ReturnType<typeof buildWeeklyPayload>>) {
    return `*FEEDBACK SEMANAL MX - ${payload.store.name}*
Periodo: ${formatPtBrDate(payload.weekStart)} a ${formatPtBrDate(payload.weekEnd)}

Meta semanal estimada: ${payload.weeklyGoal}
Media da equipe: ${payload.teamAvg.leads}L | ${payload.teamAvg.agd}A | ${payload.teamAvg.vis}V | ${payload.teamAvg.vnd} vendas
Criterio MX: ${payload.benchmark.lead_to_agend}/${payload.benchmark.agend_to_visit}/${payload.benchmark.visit_to_sale}

Top 3
${payload.ranking.slice(0, 3).map((row, index) => `${index + 1}º ${row.name} - ${row.vnd}v - ${row.diagnostic}`).join("\n")}

Relatorio completo: ${payload.reportUrl}`;
}

function generateWeeklyHTML(payload: Awaited<ReturnType<typeof buildWeeklyPayload>>) {
    const wppText = encodeURIComponent(generateWeeklyWhatsAppText(payload));
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px;line-height:1.5}
.c{max-width:760px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px -10px rgba(0,0,0,.12);overflow:hidden}
.h{background:#0f172a;padding:44px 32px;text-align:center;border-bottom:4px solid #4f46e5}
.h h1{color:#fff;margin:0 0 12px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.h p{color:#94a3b8;margin:0;font-size:13px;text-transform:uppercase;letter-spacing:3px}
.content{padding:36px 32px}.ss{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:28px}.s{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:22px;text-align:center}
.sv{font-size:28px;font-weight:900;color:#0f172a;line-height:1;margin-bottom:8px}.sl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:700}
.card{border:1px solid #e2e8f0;border-radius:20px;padding:22px;margin-bottom:18px}.name{font-size:18px;font-weight:900;text-transform:uppercase;margin:0 0 8px}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.m{background:#f8fafc;border-radius:12px;padding:12px;text-align:center}.mv{font-weight:900;font-size:18px}.ml{font-size:9px;color:#64748b;text-transform:uppercase;font-weight:800;letter-spacing:1px}
.diag{background:#eff6ff;border:1px solid #bfdbfe;padding:14px;border-radius:12px;color:#1e3a8a;font-weight:700;font-size:13px}.action{background:#ecfdf5;border:1px solid #a7f3d0;padding:14px;border-radius:12px;color:#065f46;font-weight:700;font-size:13px;margin-top:10px}
.btn{display:block;background:#4f46e5;color:#fff;text-align:center;padding:18px;border-radius:14px;text-decoration:none;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;margin-top:20px}.wpp{background:#25d366}
.f{text-align:center;padding:28px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #f1f5f9;background:#fcfcfc}
</style></head><body><div class="c">
<div class="h"><h1>Feedback Semanal MX</h1><p>${escapeHtml(payload.store.name)} • ${formatPtBrDate(payload.weekStart)} a ${formatPtBrDate(payload.weekEnd)}</p></div>
<div class="content">
<div class="ss">
<div class="s"><div class="sv">${payload.weeklyGoal}</div><div class="sl">Meta semanal estimada</div></div>
<div class="s"><div class="sv">${payload.teamAvg.leads} | ${payload.teamAvg.agd} | ${payload.teamAvg.vis} | ${payload.teamAvg.vnd}</div><div class="sl">Media da equipe</div></div>
</div>
${payload.ranking.map((row) => `
<div class="card">
<h3 class="name">${escapeHtml(row.name)}</h3>
<div style="font-size:11px;color:#64748b;font-weight:800;text-transform:uppercase">${escapeHtml(row.performanceLabel)} • ${escapeHtml(row.criterion)}</div>
<div class="metrics">
<div class="m"><div class="mv">${row.leads}</div><div class="ml">Leads</div></div>
<div class="m"><div class="mv">${row.agd}</div><div class="ml">Agend.</div></div>
<div class="m"><div class="mv">${row.vis}</div><div class="ml">Visitas</div></div>
<div class="m"><div class="mv">${row.vnd}</div><div class="ml">Vendas</div></div>
</div>
<div class="diag">${escapeHtml(row.diagnostic)}</div>
<div class="action">Acao orientada: ${escapeHtml(row.action)}</div>
</div>`).join("")}
<a href="${payload.reportUrl}" class="btn">Acessar relatorio completo</a>
<a href="https://api.whatsapp.com/send?text=${wppText}" class="btn wpp">Enviar via WhatsApp</a>
</div>
<div class="f">MX PERFORMANCE © ${payload.year}</div>
</div></body></html>`;
}

function formatPtBrDate(date: string) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[char] || char));
}

function jsonResponse(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
