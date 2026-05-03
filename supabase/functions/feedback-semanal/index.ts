import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, createResendClient } from "../_shared/supabase-client.ts";
import { parseReportBody } from "../_shared/schemas.ts";
import { buildStoreQuery } from "../_shared/store.ts";
import { sendReportEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/response.ts";
import { formatPtBrDate, escapeHtml, escapeXml } from "../_shared/format.ts";
import { authorizeReportRequest } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createServiceClient();
const resend = createResendClient();
const appUrl = "https://mxperformance.vercel.app";

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
  sellerWeeklyGoal: number;
  idealAgd: number;
  idealVis: number;
  idealVnd: number;
  agdGap: number;
  visitGap: number;
  saleGap: number;
  salesComparison: string;
  agdComparison: string;
  visitComparison: string;
  feedbackText: string;
  performanceLabel: string;
  diagnostic: string;
  action: string;
  bottleneck: string | null;
  criterion: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await authorizeReportRequest(req);
    if (auth.response) return auth.response;

    const body = await parseReportBody(req);
    const dates = getSaoPauloPreviousWeek();
    const { data: lojas, error: storesError } = await buildStoreQuery(supabase, body.store_id);

    if (storesError) throw storesError;
    if (!lojas?.length) return jsonResponse({ message: "No active lojas", reports: [] });

    const reports = [];

    for (const store of lojas) {
      const idempotencyKey = `semanal-${store.id}-${dates.weekStart}-${dates.weekEnd}`;
      const { data: existingLog } = await supabase
        .from("logs_reprocessamento")
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
      const xlsBase64 = generateWeeklyXLSX(payload);
      const baseFileName = `Feedback Semanal - ${sanitizeAttachmentName(store.name)} - ${formatShortDateForFile(dates.weekStart)} a ${formatShortDateForFile(dates.weekEnd)}`;
      let emailStatus: "sent" | "failed" | "not_sent" | "dry_run" = body.dry_run ? "dry_run" : "not_sent";
      let warnings: string[] = [];

      if (!body.dry_run) {
        const result = await sendReportEmail({
          resend,
          to: payload.recipients,
          subject: `MX Performance | Feedback semanal ${store.name.toUpperCase()}`,
          html,
          attachments: [{ filename: `${baseFileName}.xls`, content: xlsBase64, mimeType: "application/vnd.ms-excel" }],
          logPrefix: "[Semanal]",
          storeName: store.name,
        });

        emailStatus = result.status;
        warnings = result.warnings;

        await supabase.from("relatorios_devolutivas_semanais").upsert({
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

        await supabase.from("logs_reprocessamento").insert({
          store_id: store.id,
          source_type: idempotencyKey,
          status: emailStatus === "sent" ? "completed" : "failed",
          rows_processed: payload.ranking.length,
          records_processed: payload.ranking.length,
          warnings,
          errors: emailStatus === "sent" ? [] : warnings,
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

      if (!body.dry_run) {
        for (const row of payload.ranking) {
          if (row.bottleneck) {
            await supabase.from("notificacoes").insert({
              recipient_id: row.uid,
              store_id: store.id,
              title: "Alerta de Funil MX",
              message: `Seu principal gargalo na ultima semana foi: ${row.bottleneck === "lead_agendamento" ? "Lead para Agendamento" : row.bottleneck === "agendamento_visita" ? "Agendamento para Visita" : "Visita para Venda"}. Acesse seu treinamento prescrito.`,
              type: "performance",
              priority: "medium",
              link: `/treinamentos`,
            });
          }
        }
      }
    }

    return jsonResponse({ message: "Processamento semanal concluido", reports });
  } catch (error) {
    console.error("[Semanal] Fatal error:", (error as Error)?.message || "Unknown error");
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

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

  return { today, weekStart: formatter.format(previousMonday), weekEnd: formatter.format(previousSunday), year };
}

async function buildWeeklyPayload(store: any, dates: ReturnType<typeof getSaoPauloPreviousWeek>) {
  const [deliveryRulesRes, tenuresRes, fallbackMembersRes, checkinsRes, benchmarkRes, metaRulesRes] = await Promise.all([
    supabase.from("regras_entrega_loja").select("weekly_recipients").eq("store_id", store.id).maybeSingle(),
    supabase.from("vendedores_loja").select("seller_user_id, is_active, users:usuarios(name, email, is_venda_loja)").eq("store_id", store.id).eq("is_active", true),
    supabase.from("vinculos_loja").select("user_id, users:usuarios(name, email, is_venda_loja)").eq("store_id", store.id).eq("role", "vendedor"),
    supabase.from("lancamentos_diarios").select("*").eq("store_id", store.id).eq("metric_scope", "daily").gte("reference_date", dates.weekStart).lte("reference_date", dates.weekEnd),
    supabase.from("benchmarks_loja").select("lead_to_agend, agend_to_visit, visit_to_sale").eq("store_id", store.id).maybeSingle(),
    supabase.from("regras_metas_loja").select("monthly_goal, bench_lead_agd, bench_agd_visita, bench_visita_vnd").eq("store_id", store.id).maybeSingle(),
  ]);

  const tenureRows = tenuresRes.data && tenuresRes.data.length > 0
    ? tenuresRes.data.map((item: any) => ({ user_id: item.seller_user_id, users: item.users }))
    : (fallbackMembersRes.data || []);

  const agg = new Map<string, SellerRow>();
  for (const row of tenureRows) {
    const user = (row as any).users;
    agg.set(row.user_id, { uid: row.user_id, name: user?.name || "Vendedor", email: user?.email || null, is_venda_loja: user?.is_venda_loja || false, leads: 0, agd: 0, vis: 0, vnd: 0 });
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
  const sellerWeeklyGoal = Math.max(1, Math.round(weeklyGoal / activeCount));
  const teamTotal = Array.from(agg.values()).reduce((total, seller) => ({
    leads: total.leads + seller.leads, agd: total.agd + seller.agd, vis: total.vis + seller.vis, vnd: total.vnd + seller.vnd,
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
    .map((seller) => buildRankingRow(seller, teamAvg, benchmark, sellerWeeklyGoal, dates.weekStart, dates.weekEnd))
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
    sellerWeeklyGoal,
    teamTotal,
    teamAvg,
    ranking,
    reportUrl: `${appUrl}/devolutivas?store_id=${store.id}&week=${dates.weekStart}`,
  };
}

function buildRankingRow(
  seller: SellerRow,
  teamAvg: Record<string, number>,
  benchmark: Record<string, number>,
  sellerWeeklyGoal: number,
  weekStart: string,
  weekEnd: string,
): RankingRow {
  const txLeadAgd = rate(seller.agd, seller.leads);
  const txAgdVis = rate(seller.vis, seller.agd);
  const txVisVnd = rate(seller.vnd, seller.vis);
  const desvio = seller.vnd - (teamAvg.vnd || 0);
  const performanceLabel = desvio > 0 ? `+${desvio} acima da media` : desvio < 0 ? `${desvio} abaixo da media` : "Na media da equipe";
  const gaps = [
    { key: "lead_agendamento", label: "Lead para Agendamento", real: txLeadAgd, bench: benchmark.lead_to_agend, action: "Priorizar velocidade de primeiro contato, script de agendamento e quebra de objecao por telefone." },
    { key: "agendamento_visita", label: "Agendamento para Visita", real: txAgdVis, bench: benchmark.agend_to_visit, action: "Reforcar confirmacao na vespera, criacao de valor percebido e compromisso de comparecimento." },
    { key: "visita_venda", label: "Visita para Venda", real: txVisVnd, bench: benchmark.visit_to_sale, action: "Revisar demonstracao, contorno de objecoes, test drive e fechamento presencial." },
  ].filter((gap) => gap.real < gap.bench).sort((a, b) => (b.bench - b.real) - (a.bench - a.real));

  const mainGap = gaps[0];
  const idealAgd = Math.round(seller.leads * (benchmark.lead_to_agend / 100));
  const idealVis = Math.round(seller.agd * (benchmark.agend_to_visit / 100));
  const idealVnd = Math.round(seller.vis * (benchmark.visit_to_sale / 100));
  const agdGap = Math.max(idealAgd - seller.agd, 0);
  const visitGap = Math.max(idealVis - seller.vis, 0);
  const saleGap = Math.max(idealVnd - seller.vnd, 0);
  const diagnostic = mainGap
    ? buildDiagnosticMessage(mainGap.key, seller, benchmark, { idealAgd, idealVis, idealVnd, agdGap, visitGap, saleGap })
    : "Funil dentro ou acima do criterio MX.";
  const action = mainGap
    ? buildActionMessage(mainGap.key, { agdGap, visitGap, saleGap })
    : "Manter disciplina de lançamento diário e elevar volume de leads qualificados.";
  const salesComparison = compareToTeam(seller.vnd, teamAvg.vnd, "Volume de Vendas");
  const agdComparison = compareToTeam(seller.agd, teamAvg.agd, "Volume de Agendamentos");
  const visitComparison = compareToTeam(seller.vis, teamAvg.vis, "Volume de Visitas");
  const criterion = `Baseado em ${benchmark.lead_to_agend}% de conversão de Leads para Agendamento; ${benchmark.agend_to_visit} visitas a cada 100 agendamentos; e ${benchmark.visit_to_sale} venda(s) a cada 100 visitas.`;

  const row = {
    ...seller,
    txLeadAgd,
    txAgdVis,
    txVisVnd,
    sellerWeeklyGoal,
    idealAgd,
    idealVis,
    idealVnd,
    agdGap,
    visitGap,
    saleGap,
    salesComparison,
    agdComparison,
    visitComparison,
    performanceLabel,
    diagnostic,
    action,
    bottleneck: mainGap?.key || null,
    criterion,
    feedbackText: "",
  };
  return { ...row, feedbackText: buildSellerFeedbackText(row, weekStart, weekEnd) };
}

function rate(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function sanitizeAttachmentName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase() || "LOJA";
}

function formatShortDateForFile(date: string) {
  const [, month, day] = date.split("-");
  return `${day}_${month}`;
}

function compareToTeam(value: number, avg: number, label: string) {
  if (value > avg) return `${label}: Acima da média da loja.`;
  if (value < avg) return `${label}: Abaixo da média da loja.`;
  return `${label}: Igual à média da loja.`;
}

function buildDiagnosticMessage(
  gapKey: string,
  seller: SellerRow,
  benchmark: Record<string, number>,
  ideals: { idealAgd: number; idealVis: number; idealVnd: number; agdGap: number; visitGap: number; saleGap: number },
) {
  if (gapKey === "lead_agendamento") {
    return `Entrada do Funil: Você recebeu ${seller.leads} leads e agendou ${seller.agd}. Pela métrica de ${benchmark.lead_to_agend}%, deveríamos ter agendado pelo menos ${ideals.idealAgd}. Perdemos ${ideals.agdGap} oportunidades de contato aqui.`;
  }
  if (gapKey === "agendamento_visita") {
    return `Meio do Funil: Você realizou ${seller.agd} agendamentos e recebeu ${seller.vis} visitas. Pela métrica de ${benchmark.agend_to_visit}%, deveríamos ter recebido pelo menos ${ideals.idealVis} visitas. Perdemos ${ideals.visitGap} oportunidades de showroom aqui.`;
  }
  return `Fechamento do Funil: Você recebeu ${seller.vis} visitas e fechou ${seller.vnd} vendas. Pela métrica de ${benchmark.visit_to_sale}%, deveríamos ter fechado pelo menos ${ideals.idealVnd}. Perdemos ${ideals.saleGap} oportunidades de venda aqui.`;
}

function buildActionMessage(gapKey: string, gaps: { agdGap: number; visitGap: number; saleGap: number }) {
  if (gapKey === "lead_agendamento") {
    return `Foco na velocidade: Nesta semana, ligue para o cliente nos primeiros 5 minutos. Revise seus áudios de apresentação para tentar recuperar esses ${gaps.agdGap} agendamentos.`;
  }
  if (gapKey === "agendamento_visita") {
    return `Foco na confirmação: Confirme a visita na véspera e no dia, gere compromisso claro e envie motivo forte para o cliente comparecer.`;
  }
  return `Foco no fechamento: Prepare proposta antes da visita, reforce test drive, contorne objeções e peça o fechamento com próxima ação definida.`;
}

function buildSellerFeedbackText(row: RankingRow, weekStart: string, weekEnd: string) {
  return `Olá, ${row.name.toUpperCase()}. Segue seu Feedback Semanal.

*Período:* ${formatPtBrDate(weekStart)} a ${formatPtBrDate(weekEnd)}

*SEUS NÚMEROS DA SEMANA*
• Vendas Fechadas: ${row.vnd} (Meta Ref: ${row.sellerWeeklyGoal})
• Leads Recebidos: ${row.leads}
• Agendamentos: ${row.agd}
• Visitas na Loja: ${row.vis}

*ANÁLISE DE OPORTUNIDADE*
• Com ${row.leads} Leads, a boa prática diz que você faria *${row.idealAgd} agendamentos*.
• Com ${row.agd} Agendamentos, a boa prática diz que você receberia *${row.idealVis} visitas*.
• Com ${row.vis} Visitas, a boa prática diz que você fecharia *${row.idealVnd} vendas*.

*COMPARATIVO COM A EQUIPE*
• ${row.salesComparison}
• ${row.agdComparison}
• ${row.visitComparison}

*DIAGNÓSTICO E AÇÃO*
${row.diagnostic}
*O que fazer:* ${row.action}

------------------------
*Entenda o critério:* ${row.criterion}`;
}

function generateWeeklyXLSX(payload: any) {
  const { ranking, teamAvg, store, weekStart, weekEnd } = payload;

  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#E8F0EA" ss:Bold="1"/><Interior ss:Color="#0B100C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="ColumnHeader"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#9BA89F" ss:Bold="1"/><Interior ss:Color="#0F1612" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Opportunity"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#062012" ss:Bold="1"/><Interior ss:Color="#1FCB6E" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Compare"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#E8F0EA" ss:Bold="1"/><Interior ss:Color="#172019" ss:Pattern="Solid"/></Style>
  <Style ss:ID="SubHeader"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#E8F0EA" ss:Bold="1"/><Interior ss:Color="#243227" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Center"><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Bold"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1"/></Style>
  <Style ss:ID="Danger"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FF6B5B" ss:Bold="1"/></Style>
  <Style ss:ID="Italic"><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Italic="1"/></Style>
  <Style ss:ID="Footnote"><Interior ss:Color="#172019" ss:Pattern="Solid"/><Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#E8F0EA" ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Resumo Geral">
  <Table>
   <Row><Cell ss:MergeAcross="7" ss:StyleID="Header"><Data ss:Type="String">FEEDBACK SEMANAL - ${escapeXml(store.name.toUpperCase())}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="7" ss:StyleID="Center"><Data ss:Type="String">Periodo: ${formatPtBrDate(weekStart)} a ${formatPtBrDate(weekEnd)}</Data></Cell></Row>
   <Row ss:Index="4">
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Leads</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Agendamentos</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Visitas</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Vendas</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Meta Ref</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Gargalo</Data></Cell>
    <Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Diagnostico</Data></Cell>
   </Row>
   ${ranking.map((row: RankingRow) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${row.leads}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${row.agd}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${row.vis}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${row.vnd}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${row.sellerWeeklyGoal}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(row.bottleneck || "OK")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(row.diagnostic)}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>`;

  for (const seller of ranking) {
    const safeName = escapeXml(seller.name).substring(0, 30).replace(/[\\/?*\[\]]/g, "");
    xml += `
 <Worksheet ss:Name="${safeName}">
  <Table ss:ExpandedColumnCount="5">
   <Row><Cell ss:MergeAcross="4" ss:StyleID="Header"><Data ss:Type="String">RESUMO DO VENDEDOR: ${escapeXml(seller.name.toUpperCase())}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Leads Recebidos</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Agendamentos Feitos</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Visitas Realizadas</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Vendas Fechadas</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Sua Meta Semanal</Data></Cell></Row>
   <Row><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.leads}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.agd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.vis}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.vnd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.sellerWeeklyGoal}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:MergeAcross="4" ss:StyleID="Opportunity"><Data ss:Type="String">ANALISE DE APROVEITAMENTO (REAL vs IDEAL)</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1" ss:StyleID="SubHeader"><Data ss:Type="String">Etapa do Processo</Data></Cell><Cell ss:StyleID="SubHeader"><Data ss:Type="String">Seu Resultado</Data></Cell><Cell ss:StyleID="SubHeader"><Data ss:Type="String">O Ideal Seria</Data></Cell><Cell ss:StyleID="SubHeader"><Data ss:Type="String">Status</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">De Leads para Agendamentos</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.agd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.idealAgd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="String">${seller.agd >= seller.idealAgd ? "Bom" : "Abaixo"}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">De Agendamentos para Visitas</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.vis}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.idealVis}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="String">${seller.vis >= seller.idealVis ? "Bom" : "Abaixo"}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">De Visitas para Vendas</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.vnd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.idealVnd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="String">${seller.vnd >= seller.idealVnd ? "Bom" : "Abaixo"}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:MergeAcross="4" ss:StyleID="Compare"><Data ss:Type="String">SEU DESEMPENHO COMPARADO A MEDIA DA EQUIPE</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1" ss:StyleID="ColumnHeader"><Data ss:Type="String">Criterio</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Sua Producao</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Media da Equipe</Data></Cell><Cell ss:StyleID="ColumnHeader"><Data ss:Type="String">Conclusao</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">Volume de Vendas</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.vnd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${teamAvg.vnd}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(seller.salesComparison.replace("Volume de Vendas: ", ""))}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">Volume de Agendamentos</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.agd}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${teamAvg.agd}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(seller.agdComparison.replace("Volume de Agendamentos: ", ""))}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1"><Data ss:Type="String">Volume de Visitas</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${seller.vis}</Data></Cell><Cell ss:StyleID="Center"><Data ss:Type="Number">${teamAvg.vis}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(seller.visitComparison.replace("Volume de Visitas: ", ""))}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1" ss:StyleID="Bold"><Data ss:Type="String">DIAGNOSTICO DA SEMANA:</Data></Cell><Cell ss:MergeAcross="2" ss:StyleID="Danger"><Data ss:Type="String">${escapeXml(seller.diagnostic)}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="1" ss:StyleID="Bold"><Data ss:Type="String">ORIENTACAO DE ACAO:</Data></Cell><Cell ss:MergeAcross="2" ss:StyleID="Italic"><Data ss:Type="String">${escapeXml(seller.action)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:MergeAcross="4" ss:StyleID="Footnote"><Data ss:Type="String">ENTENDA A CONTA (BOAS PRATICAS DO SETOR)</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="4"><Data ss:Type="String">${escapeXml(seller.criterion)}</Data></Cell></Row>
  </Table>
 </Worksheet>`;
  }

  xml += `\n</Workbook>`;

  const data = new TextEncoder().encode(xml);
  const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

function generateWeeklyWhatsAppText(payload: Awaited<ReturnType<typeof buildWeeklyPayload>>) {
  return `*MX PERFORMANCE | FEEDBACK SEMANAL*
${payload.store.name.toUpperCase()}
Período: ${formatPtBrDate(payload.weekStart)} a ${formatPtBrDate(payload.weekEnd)}

${payload.ranking.map((row) => row.feedbackText).join("\n\n====================\n\n")}

Relatório completo: ${payload.reportUrl}`;
}

function generateWeeklyHTML(payload: Awaited<ReturnType<typeof buildWeeklyPayload>>) {
  const wppText = encodeURIComponent(generateWeeklyWhatsAppText(payload));
  const dateRange = `${formatPtBrDate(payload.weekStart)} a ${formatPtBrDate(payload.weekEnd)}`;
  const totalSales = payload.ranking.reduce((sum, row) => sum + row.vnd, 0);
  const totalLeads = payload.ranking.reduce((sum, row) => sum + row.leads, 0);
  const sellerCount = payload.ranking.length;
  const blocks = payload.ranking.map((row) => `
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#0A100C;border:1px solid #243227;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="border-left:4px solid #1FCB6E;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:20px 24px;">
                    <div style="font-size:11px;line-height:15px;color:#5C6A60;font-weight:900;text-transform:uppercase;">Mensagem pronta</div>
                    <div style="font-size:20px;line-height:26px;font-weight:900;text-transform:uppercase;margin:4px 0 14px 0;">${escapeHtml(row.name.toUpperCase())}</div>
                    <div style="font-size:14px;line-height:21px;color:#9BA89F;white-space:pre-line;">${escapeHtml(row.feedbackText)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`).join("");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MX Performance | Feedback Semanal</title>
</head>
<body style="margin:0;padding:0;background:#070A08;color:#E8F0EA;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#070A08;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 14px;background:#070A08;">
        <table role="presentation" width="980" cellspacing="0" cellpadding="0" style="width:980px;max-width:100%;border-collapse:separate;border-spacing:0;background:#0B100C;border:1px solid #243227;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0F1612;border-bottom:1px solid #243227;font-family:Arial,Helvetica,sans-serif;padding:22px 24px;">
              <div style="color:#1FCB6E;font-size:12px;line-height:16px;font-weight:900;text-transform:uppercase;">MX Performance</div>
              <div style="color:#E8F0EA;font-size:30px;line-height:36px;font-weight:900;text-transform:uppercase;margin-top:4px;">Feedback Semanal</div>
              <div style="color:#9BA89F;font-size:14px;line-height:20px;margin-top:8px;">${escapeHtml(payload.store.name.toUpperCase())} | ${dateRange}</div>
            </td>
          </tr>
          <tr>
            <td style="background:#0B100C;padding:22px 24px 10px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:10px 0;margin:0;">
                <tr>
                  <td width="33%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Vendedores</div><div style="font-size:27px;line-height:32px;font-weight:900;margin-top:4px;">${sellerCount}</div></td>
                  <td width="33%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Leads</div><div style="font-size:27px;line-height:32px;font-weight:900;margin-top:4px;">${totalLeads}</div></td>
                  <td width="33%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;"><div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Vendas</div><div style="font-size:27px;line-height:32px;font-weight:900;color:#1FCB6E;margin-top:4px;">${totalSales}</div></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#0B100C;padding:8px 24px 24px 24px;">
              <a href="${payload.reportUrl}" style="display:inline-block;background:#1FCB6E;color:#062012;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:900;text-transform:uppercase;padding:15px 34px;">Abrir relatório completo</a>
            </td>
          </tr>
          <tr>
            <td style="background:#0B100C;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:0 24px 12px 24px;">
              <div style="font-size:11px;line-height:15px;color:#5C6A60;font-weight:900;text-transform:uppercase;">Operação</div>
              <div style="font-size:22px;line-height:28px;font-weight:900;margin-top:4px;">Sugestões de mensagem</div>
            </td>
          </tr>
          ${blocks}
          <tr><td align="center" style="background:#0B100C;padding:10px 24px 34px 24px;"><a href="https://api.whatsapp.com/send?text=${wppText}" style="display:inline-block;background:#1FCB6E;color:#062012;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:19px;font-weight:900;text-transform:uppercase;padding:14px 30px;">Enviar via WhatsApp</a></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
