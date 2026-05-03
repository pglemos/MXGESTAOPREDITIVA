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

type SellerRow = {
  uid: string;
  name: string;
  email: string | null;
  is_venda_loja: boolean;
  leads: number;
  agd_cart_today: number;
  agd_net_today: number;
  vis: number;
  vp: number;
  vc: number;
  vn: number;
  vnd_yesterday: number;
  sem_registro: boolean;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await authorizeReportRequest(req);
    if (auth.response) return auth.response;

    const body = await parseReportBody(req);
    const dates = getSaoPauloDates();
    const { data: lojas, error: storesError } = await buildStoreQuery(supabase, body.store_id);

    if (storesError) throw storesError;
    if (!lojas?.length) {
      return jsonResponse({ message: "No active lojas", reports: [] });
    }

    const reports = [];

    for (const store of lojas) {
      const idempotencyKey = `matinal-${store.id}-${dates.today}`;
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

      const payload = await buildMorningPayload(store, dates);
      const html = generateHTML(payload);
      const xlsxBase64 = generateXLSX(payload.ranking);
      const fileName = `Relatorio_${sanitizeAttachmentName(store.name)}.xlsx`;

      let emailStatus: "sent" | "failed" | "not_sent" | "dry_run" = body.dry_run ? "dry_run" : "not_sent";
      let warnings: string[] = [];

      if (!body.dry_run) {
        const result = await sendReportEmail({
          resend,
          to: payload.recipients,
          subject: `📊 Matinal: ${store.name.toUpperCase()} - Tendência: ${payload.projection} ${pluralizeCar(payload.projection)}`,
          html,
          attachments: [{ filename: fileName, content: xlsxBase64 }],
          logPrefix: "[Matinal]",
          storeName: store.name,
        });

        emailStatus = result.status;
        warnings = result.warnings;

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
        total_vendas: payload.totalSales,
        meta: payload.storeGoal,
        pct: payload.reaching,
        projection: payload.projection,
        sem_registro: payload.semRegistro.length,
        recipients: payload.recipients.length,
        email: emailStatus,
        dry_run: body.dry_run || false,
      });

      if (!body.dry_run && payload.semRegistroFull.length > 0) {
        const { data: managers } = await supabase
          .from("vinculos_loja")
          .select("user_id")
          .eq("store_id", store.id)
          .eq("role", "gerente");

        if (managers && managers.length > 0) {
          for (const manager of managers) {
            await supabase.from("notificacoes").insert({
              recipient_id: manager.user_id,
              store_id: store.id,
              title: `Alerta de Disciplina: ${store.name}`,
              message: `Atencao: ${payload.semRegistroFull.length} vendedores estao sem registro no fechamento de ontem: ${payload.semRegistro.join(", ")}.`,
              type: "discipline",
              priority: "high",
              link: `/equipe`,
            });
          }
        }

        for (const seller of payload.semRegistroFull) {
          await supabase.from("notificacoes").insert({
            recipient_id: seller.uid,
            store_id: store.id,
            title: "Pendente: Registro de Ontem",
            message: "Sua producao de ontem ainda nao foi registrada no sistema. Regularize seu lançamento diário agora.",
            type: "discipline",
            priority: "medium",
            link: `/lancamento-diario`,
          });
        }
      }
    }

    return jsonResponse({ message: "Processamento matinal concluido", reports });
  } catch (error) {
    console.error("[Matinal] Fatal error:", (error as Error)?.message || "Unknown error");
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function getSaoPauloDates() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());
  const [year, month, day] = today.split("-").map(Number);
  const todayAtNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const reference = new Date(todayAtNoon);
  reference.setUTCDate(reference.getUTCDate() - 1);
  const referenceDate = formatter.format(reference);
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysElapsed = Number(referenceDate.split("-")[2]);

  return {
    today,
    referenceDate,
    startOfMonth,
    year,
    month,
    totalDays,
    daysElapsed,
    daysRemaining: Math.max(totalDays - daysElapsed, 0),
    referenceAsDate: reference,
  };
}

async function buildMorningPayload(store: any, dates: ReturnType<typeof getSaoPauloDates>) {
  const [deliveryRulesRes, tenuresRes, fallbackMembersRes, checkinsRes, referenceCheckinsRes, metaRulesRes] = await Promise.all([
    supabase.from("regras_entrega_loja").select("matinal_recipients, whatsapp_group_ref").eq("store_id", store.id).maybeSingle(),
    supabase.from("vendedores_loja").select("seller_user_id, is_active, users:usuarios(name, email, is_venda_loja)").eq("store_id", store.id).eq("is_active", true),
    supabase.from("vinculos_loja").select("user_id, users:usuarios(name, email, is_venda_loja)").eq("store_id", store.id).eq("role", "vendedor"),
    supabase.from("lancamentos_diarios").select("*").eq("store_id", store.id).eq("metric_scope", "daily").gte("reference_date", dates.startOfMonth).lte("reference_date", dates.referenceDate),
    supabase.from("lancamentos_diarios").select("seller_user_id").eq("store_id", store.id).eq("metric_scope", "daily").eq("reference_date", dates.referenceDate),
    supabase.from("regras_metas_loja").select("monthly_goal, include_venda_loja_in_store_total").eq("store_id", store.id).maybeSingle(),
  ]);

  const tenureRows = tenuresRes.data && tenuresRes.data.length > 0
    ? tenuresRes.data.map((item: any) => ({ user_id: item.seller_user_id, users: item.users }))
    : (fallbackMembersRes.data || []);

  const checkedReference = new Set((referenceCheckinsRes.data || []).map((c: any) => c.seller_user_id));
  const agg = new Map<string, SellerRow>();

  for (const row of tenureRows) {
    const user = (row as any).users;
    agg.set(row.user_id, {
      uid: row.user_id,
      name: user?.name || "Vendedor",
      email: user?.email || null,
      is_venda_loja: user?.is_venda_loja || false,
      leads: 0,
      agd_cart_today: 0,
      agd_net_today: 0,
      vis: 0,
      vp: 0,
      vc: 0,
      vn: 0,
      vnd_yesterday: 0,
      sem_registro: !checkedReference.has(row.user_id),
    });
  }

  for (const checkin of checkinsRes.data || []) {
    const seller = agg.get(checkin.seller_user_id);
    if (!seller) continue;

    seller.leads += checkin.leads_prev_day || 0;
    seller.agd_cart_today += checkin.agd_cart_today || 0;
    seller.agd_net_today += checkin.agd_net_today || 0;
    seller.vis += checkin.visit_prev_day || 0;
    seller.vp += checkin.vnd_porta_prev_day || 0;
    seller.vc += checkin.vnd_cart_prev_day || 0;
    seller.vn += checkin.vnd_net_prev_day || 0;
    if (checkin.reference_date === dates.referenceDate) {
      seller.vnd_yesterday +=
        (checkin.vnd_porta_prev_day || 0) +
        (checkin.vnd_cart_prev_day || 0) +
        (checkin.vnd_net_prev_day || 0);
    }
  }

  const includeVendaLoja = metaRulesRes.data?.include_venda_loja_in_store_total ?? true;
  const ranking = Array.from(agg.values())
    .map((seller) => ({ ...seller, vt: seller.vp + seller.vc + seller.vn }))
    .sort((a, b) => {
      if (b.vt !== a.vt) return b.vt - a.vt;
      if (a.is_venda_loja !== b.is_venda_loja) return a.is_venda_loja ? 1 : -1;
      return b.vis - a.vis;
    });

  const productionRows = includeVendaLoja ? ranking : ranking.filter((row) => !row.is_venda_loja);
  const totalSales = productionRows.reduce((sum, row) => sum + row.vt, 0);
  const storeGoal = metaRulesRes.data?.monthly_goal || 0;
  const reaching = storeGoal > 0 ? Math.round((totalSales / storeGoal) * 1000) / 10 : 0;
  const projection = dates.daysElapsed > 0 ? Math.round((totalSales / dates.daysElapsed) * dates.totalDays) : 0;
  const gap = Math.max(storeGoal - totalSales, 0);
  const semRegistro = ranking.filter((row) => row.sem_registro).map((row) => row.name);
  const semRegistroFull = ranking.filter((row) => row.sem_registro);

  const recipients = deliveryRulesRes.data?.matinal_recipients || [];

  return {
    store,
    recipients,
    whatsappGroupRef: deliveryRulesRes.data?.whatsapp_group_ref || null,
    referenceDate: dates.referenceDate,
    referenceAsDate: dates.referenceAsDate,
    year: dates.year,
    daysRemaining: dates.daysRemaining,
    totalSales,
    storeGoal,
    reaching,
    projection,
    gap,
    ranking,
    semRegistro,
    semRegistroFull,
  };
}

function pluralizeCar(value: number) {
  return value === 1 ? "carro" : "carros";
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

function generateXLSX(ranking: Array<SellerRow & { vt: number }>) {
  const totalSales = ranking.reduce((sum, row) => sum + row.vt, 0);
  const totalYesterday = ranking.reduce((sum, row) => sum + row.vnd_yesterday, 0);
  const totalLeads = ranking.reduce((sum, row) => sum + row.leads, 0);
  const totalAgd = ranking.reduce((sum, row) => sum + row.agd_cart_today + row.agd_net_today, 0);
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="#082B66" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#225A86" ss:Pattern="Solid"/></Style>
  <Style ss:ID="MetricHeader"><Font ss:Bold="1" ss:Color="#666666"/><Interior ss:Color="#EDEDED" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Metric"><Font ss:Bold="1"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Highlight"><Font ss:Bold="1"/><Interior ss:Color="#DDEEFF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
 </Styles>
 <Worksheet ss:Name="Painel Visual">
  <Table>
   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="Title"><Data ss:Type="String">RELATORIO MATINAL</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">LEADS</Data></Cell>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">AGD (HOJE)</Data></Cell>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">VND (ONTEM)</Data></Cell>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">TOTAL (MES)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Metric"><Data ss:Type="Number">${totalLeads}</Data></Cell>
    <Cell ss:StyleID="Metric"><Data ss:Type="Number">${totalAgd}</Data></Cell>
    <Cell ss:StyleID="Metric"><Data ss:Type="Number">${totalYesterday}</Data></Cell>
    <Cell ss:StyleID="Highlight"><Data ss:Type="Number">${totalSales}</Data></Cell>
   </Row>
   ${ranking.map(row => `
   <Row><Cell ss:MergeAcross="3" ss:StyleID="Header"><Data ss:Type="String">${escapeXml(row.name.toUpperCase())}</Data></Cell></Row>
   <Row>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">LEADS</Data></Cell>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">AGD (HOJE)</Data></Cell>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">VND (ONTEM)</Data></Cell>
    <Cell ss:StyleID="MetricHeader"><Data ss:Type="String">TOTAL (MES)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Metric"><Data ss:Type="Number">${row.leads}</Data></Cell>
    <Cell ss:StyleID="Metric"><Data ss:Type="Number">${row.agd_cart_today + row.agd_net_today}</Data></Cell>
    <Cell ss:StyleID="Metric"><Data ss:Type="Number">${row.vnd_yesterday}</Data></Cell>
    <Cell ss:StyleID="Highlight"><Data ss:Type="Number">${row.vt}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Lista de Vendas Detalhada">
  <Table>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">LEADS NOVOS RECEBIDOS NO DIA ANTERIOR</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">AGENDAMENTOS CARTEIRA (HOJE)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">AGENDAMENTOS INTERNET (HOJE)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">VND (ONTEM)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">TOTAL (MES)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">STATUS REGISTRO</Data></Cell>
   </Row>
   ${ranking.map(row => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.leads}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.agd_cart_today}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.agd_net_today}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vnd_yesterday}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vt}</Data></Cell>
    <Cell><Data ss:Type="String">${row.sem_registro ? "PENDENTE" : "REGISTRADO"}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>
</Workbook>`;

  const data = new TextEncoder().encode(xml);
  const binString = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

function generateWhatsAppText(payload: Awaited<ReturnType<typeof buildMorningPayload>>) {
  return `📊 *RELATÓRIO MATINAL*
${payload.store.name.toUpperCase()} | Ref: ${formatPtBrDate(payload.referenceDate)}

🔎 FALTA POUCO: ${payload.gap} ${pluralizeCar(payload.gap)}
🔮 PROJEÇÃO ATUAL: FECHAR COM ${payload.projection} ${pluralizeCar(payload.projection)}

${payload.semRegistro.length > 0 ? `⚠️ SEM REGISTRO HOJE: ${payload.semRegistro.join(", ")}` : "✅ TODOS REGISTRARAM"}

*Resumo*
Vendas: ${payload.totalSales}
Meta: ${payload.storeGoal}
Projeção: ${payload.projection}
Ating.: ${payload.reaching}%

*Ranking*
${payload.ranking.slice(0, 5).map((row, index) => `${index + 1}º ${row.name} - ${row.vt} no mês (${row.vnd_yesterday} ontem)`).join("\n")}

MX PERFORMANCE`;
}

function generateHTML(payload: Awaited<ReturnType<typeof buildMorningPayload>>) {
  const wppText = encodeURIComponent(generateWhatsAppText(payload));
  const projectionColor = payload.projection >= payload.storeGoal ? "#22c55e" : "#ff3b3b";
  const reachingColor = payload.reaching >= 100 ? "#22c55e" : payload.reaching >= 80 ? "#ffe100" : "#ff3b3b";
  const wppLink = payload.whatsappGroupRef && payload.whatsappGroupRef.startsWith("http")
    ? payload.whatsappGroupRef
    : `https://api.whatsapp.com/send?text=${wppText}`;
  const sellerRows = payload.ranking.length > 0
    ? payload.ranking.map((row) => `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:0 0 12px 0;border:1px solid #c9d0d6;border-radius:6px;overflow:hidden;background:#ffffff;">
        <tr>
          <td colspan="4" style="background:#225a86;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:800;text-transform:uppercase;padding:8px 18px;">${escapeHtml(row.name.toUpperCase())}</td>
        </tr>
        <tr>
          <td width="25%" align="center" style="background:#ededed;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:800;text-transform:uppercase;padding:6px 8px;">LEADS</td>
          <td width="25%" align="center" style="background:#ededed;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:800;text-transform:uppercase;padding:6px 8px;">AGD (HOJE)</td>
          <td width="25%" align="center" style="background:#ededed;color:#666666;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:800;text-transform:uppercase;padding:6px 8px;">VND (ONTEM)</td>
          <td width="25%" align="center" style="background:#ededed;color:#000000;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:900;text-transform:uppercase;padding:6px 8px;">TOTAL (MÊS)</td>
        </tr>
        <tr>
          <td align="center" style="background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:800;padding:10px 8px;">${row.leads}</td>
          <td align="center" style="background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:800;padding:10px 8px;">${row.agd_cart_today + row.agd_net_today}</td>
          <td align="center" style="background:#ffffff;color:#082b66;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:900;padding:10px 8px;">${row.vnd_yesterday}</td>
          <td align="center" style="background:#dcecf8;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:22px;font-weight:900;padding:10px 8px;">${row.vt}</td>
        </tr>
      </table>`).join("")
    : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 12px 0;background:#ffffff;border:1px solid #e5e7eb;"><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#666666;font-size:14px;font-weight:700;padding:18px;">Nenhum vendedor ativo encontrado.</td></tr></table>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Relatório Matinal</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f2f2f2;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 14px;">
        <table role="presentation" width="860" cellspacing="0" cellpadding="0" style="width:860px;max-width:100%;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #d5d9de;border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#082b66;color:#ffffff;font-family:Arial,Helvetica,sans-serif;padding:28px 24px;">
              <div style="font-size:28px;line-height:34px;font-weight:900;text-transform:uppercase;">📊 RELATÓRIO MATINAL</div>
              <div style="font-size:18px;line-height:24px;margin-top:8px;">${escapeHtml(payload.store.name.toUpperCase())} | Ref: ${formatPtBrDate(payload.referenceDate)}</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#fffef1;border-bottom:1px solid #e7e7d8;font-family:Arial,Helvetica,sans-serif;padding:24px 18px;">
              <div style="font-size:22px;line-height:28px;color:#3d3d3d;font-weight:900;text-transform:uppercase;">🔎 FALTA POUCO: ${payload.gap} ${pluralizeCar(payload.gap)}</div>
              <div style="font-size:17px;line-height:24px;color:#111111;font-weight:900;text-transform:uppercase;margin-top:8px;">🔮 PROJEÇÃO ATUAL: FECHAR COM ${payload.projection} ${pluralizeCar(payload.projection)}</div>
              ${payload.semRegistro.length > 0 ? `<div style="font-size:15px;line-height:21px;color:#ff0000;font-weight:500;text-transform:uppercase;margin-top:10px;">⚠️ SEM REGISTRO HOJE: ${escapeHtml(payload.semRegistro.join(", ").toUpperCase())}</div>` : `<div style="font-size:15px;line-height:21px;color:#15803d;font-weight:700;text-transform:uppercase;margin-top:10px;">✅ TODOS REGISTRARAM HOJE</div>`}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 22px 0 22px;background:#ffffff;">
              ${sellerRows}
            </td>
          </tr>
          <tr>
            <td style="padding:0 22px 0 22px;background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#303030;margin:0;">
                <tr>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;">
                    <div style="font-size:18px;line-height:22px;text-transform:uppercase;">VENDAS</div>
                    <div style="font-size:24px;line-height:28px;font-weight:900;">${payload.totalSales}</div>
                  </td>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;">
                    <div style="font-size:18px;line-height:22px;text-transform:uppercase;">META</div>
                    <div style="font-size:24px;line-height:28px;font-weight:900;">${payload.storeGoal}</div>
                  </td>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;">
                    <div style="font-size:18px;line-height:22px;text-transform:uppercase;">PROJEÇÃO</div>
                    <div style="font-size:24px;line-height:28px;font-weight:900;color:${projectionColor};">${payload.projection}</div>
                  </td>
                  <td width="25%" align="center" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:20px 8px;">
                    <div style="font-size:18px;line-height:22px;text-transform:uppercase;">ATING</div>
                    <div style="font-size:24px;line-height:28px;font-weight:900;color:${reachingColor};">${payload.reaching}%</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#ffffff;padding:26px 22px 12px 22px;font-family:Arial,Helvetica,sans-serif;color:#666666;font-size:16px;line-height:22px;font-style:italic;">
              *O arquivo anexo contém duas abas: O Painel Visual e a <strong>Lista de Vendas Detalhada</strong> onde você pode aplicar filtros.
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#ffffff;padding:0 22px 40px 22px;">
              <a href="${wppLink}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;border-radius:28px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:900;text-transform:uppercase;padding:17px 42px;">📲 ENVIAR NO WHATSAPP</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
