import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createServiceClient, createResendClient } from "../_shared/supabase-client.ts";
import { parseReportBody } from "../_shared/schemas.ts";
import { buildStoreQuery } from "../_shared/store.ts";
import { sendReportEmail } from "../_shared/email.ts";
import { jsonResponse } from "../_shared/response.ts";
import { formatPtBrDate, escapeHtml } from "../_shared/format.ts";
import { authorizeReportRequest } from "../_shared/auth.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { buildXlsxBase64, xlsxCell } from "../_shared/xlsx.ts";
import { uploadDocumentToStore } from "../_shared/drive-upload.ts";

const supabase = createServiceClient();
const resend = createResendClient();
const CHECKIN_REPORT_SELECT = "seller_user_id, reference_date, leads_prev_day, agd_cart_today, agd_net_today, agd_cart_prev_day, agd_net_prev_day, visit_prev_day, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day";

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

type RelatedUser = {
  name?: string | null;
  email?: string | null;
  is_venda_loja?: boolean | null;
};

type RosterRow = {
  user_id: string;
  users?: RelatedUser | RelatedUser[] | null;
};

type SellerTenureRow = {
  seller_user_id: string;
  users?: RelatedUser | RelatedUser[] | null;
};

function normalizeRelatedUser(users: RelatedUser | RelatedUser[] | null | undefined): RelatedUser | null {
  return Array.isArray(users) ? users[0] ?? null : users ?? null;
}

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
      const xlsxBase64 = await generateXLSX(payload);
      const fileName = `Relatorio_${sanitizeAttachmentName(store.name)}.xlsx`;

      // Upload ao Drive (fire-and-forget, não bloqueia o envio de email)
      ;(async () => {
        const bytes = Uint8Array.from(atob(xlsxBase64), c => c.charCodeAt(0));
        await uploadDocumentToStore(store.id, "relatorios", fileName, bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      })().catch(() => {});

      let emailStatus: "sent" | "failed" | "not_sent" | "dry_run" = body.dry_run ? "dry_run" : "not_sent";
      let warnings: string[] = [];

      if (!body.dry_run) {
        const result = await sendReportEmail({
          resend,
          to: payload.recipients,
          subject: `MX Performance | Matinal ${store.name.toUpperCase()} | Tendencia ${payload.projection} ${pluralizeCar(payload.projection)}`,
          html,
          attachments: [{ filename: fileName, content: xlsxBase64, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }],
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
    supabase.from("lancamentos_diarios").select(CHECKIN_REPORT_SELECT).eq("store_id", store.id).eq("metric_scope", "daily").gte("reference_date", dates.startOfMonth).lte("reference_date", dates.referenceDate),
    supabase.from("lancamentos_diarios").select("seller_user_id").eq("store_id", store.id).eq("metric_scope", "daily").eq("reference_date", dates.referenceDate),
    supabase.from("regras_metas_loja").select("monthly_goal, include_venda_loja_in_store_total").eq("store_id", store.id).maybeSingle(),
  ]);

  const tenureRows: RosterRow[] = tenuresRes.data && tenuresRes.data.length > 0
    ? (tenuresRes.data as SellerTenureRow[]).map((item) => ({ user_id: item.seller_user_id, users: item.users }))
    : ((fallbackMembersRes.data || []) as RosterRow[]);

  const checkedReference = new Set((referenceCheckinsRes.data || []).map((c: any) => c.seller_user_id));
  const agg = new Map<string, SellerRow>();

  for (const row of tenureRows) {
    const user = normalizeRelatedUser(row.users);
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

async function generateXLSX(payload: Awaited<ReturnType<typeof buildMorningPayload>>) {
  const ranking = payload.ranking;
  const totalSales = ranking.reduce((sum, row) => sum + row.vt, 0);
  const totalYesterday = ranking.reduce((sum, row) => sum + row.vnd_yesterday, 0);
  const totalLeads = ranking.reduce((sum, row) => sum + row.leads, 0);
  const totalAgd = ranking.reduce((sum, row) => sum + row.agd_cart_today + row.agd_net_today, 0);
  const reachingStyle = payload.reaching >= 100 ? "statusGreen" : payload.reaching >= 80 ? "statusAmber" : "statusRed";
  const summaryRows = [
    { cells: [xlsxCell("MX PERFORMANCE | RELATÓRIO MATINAL", "title"), "", "", "", "", "", "", ""], height: 28 },
    { cells: [xlsxCell(`${payload.store.name.toUpperCase()} | Ref. ${formatPtBrDate(payload.referenceDate)}`, "subtitle"), "", "", "", "", "", "", ""], height: 22 },
    { cells: ["", "", "", "", "", "", "", ""] },
    {
      cells: [
        xlsxCell("Vendas", "metricLabel"),
        xlsxCell("Meta", "metricLabel"),
        xlsxCell("Projeção", "metricLabel"),
        xlsxCell("Atingimento", "metricLabel"),
        xlsxCell("Falta", "metricLabel"),
        xlsxCell("Leads", "metricLabel"),
        xlsxCell("AGD hoje", "metricLabel"),
        xlsxCell("VND ontem", "metricLabel"),
      ],
      height: 22,
    },
    {
      cells: [
        xlsxCell(payload.totalSales, "metricValue"),
        xlsxCell(payload.storeGoal, "metricValue"),
        xlsxCell(payload.projection, "greenMetric"),
        xlsxCell(`${payload.reaching}%`, reachingStyle),
        xlsxCell(payload.gap, "metricValue"),
        xlsxCell(totalLeads, "metricValue"),
        xlsxCell(totalAgd, "metricValue"),
        xlsxCell(totalYesterday, "metricValue"),
      ],
      height: 28,
    },
    { cells: ["", "", "", "", "", "", "", ""] },
    { cells: [xlsxCell("Ranking por vendedor", "section"), "", "", "", "", "", "", ""], height: 22 },
    {
      cells: ["#", "Vendedor", "Leads", "AGD hoje", "VND ontem", "Total mês", "Status", "Venda loja?"].map((value) => xlsxCell(value, "header")),
      height: 24,
    },
    ...ranking.map((row, index) => ({
      cells: [
        xlsxCell(index + 1, "bodyCenter"),
        xlsxCell(row.name, "body"),
        xlsxCell(row.leads, "bodyCenter"),
        xlsxCell(row.agd_cart_today + row.agd_net_today, "bodyCenter"),
        xlsxCell(row.vnd_yesterday, "bodyCenter"),
        xlsxCell(row.vt, "bodyCenter"),
        xlsxCell(row.sem_registro ? "PENDENTE" : "REGISTRADO", row.sem_registro ? "danger" : "bodyCenter"),
        xlsxCell(row.is_venda_loja ? "Sim" : "Não", "bodyCenter"),
      ],
    })),
  ];
  const detailRows = [
    {
      cells: [
        "Vendedor",
        "Leads",
        "AGD carteira hoje",
        "AGD internet hoje",
        "AGD total hoje",
        "VND ontem",
        "Vendas porta",
        "Vendas carteira",
        "Vendas internet",
        "Total mês",
        "Status registro",
      ].map((value) => xlsxCell(value, "header")),
      height: 28,
    },
    ...ranking.map((row) => ({
      cells: [
        xlsxCell(row.name, "body"),
        xlsxCell(row.leads, "bodyCenter"),
        xlsxCell(row.agd_cart_today, "bodyCenter"),
        xlsxCell(row.agd_net_today, "bodyCenter"),
        xlsxCell(row.agd_cart_today + row.agd_net_today, "bodyCenter"),
        xlsxCell(row.vnd_yesterday, "bodyCenter"),
        xlsxCell(row.vp, "bodyCenter"),
        xlsxCell(row.vc, "bodyCenter"),
        xlsxCell(row.vn, "bodyCenter"),
        xlsxCell(row.vt, "bodyCenter"),
        xlsxCell(row.sem_registro ? "PENDENTE" : "REGISTRADO", row.sem_registro ? "danger" : "bodyCenter"),
      ],
    })),
  ];

  return buildXlsxBase64([
    {
      name: "Painel Visual",
      columns: [10, 34, 13, 13, 13, 13, 14, 14],
      rows: summaryRows,
      merges: ["A1:H1", "A2:H2", "A7:H7"],
      autoFilter: `A8:H${Math.max(summaryRows.length, 8)}`,
      freezeRow: 8,
    },
    {
      name: "Lista Detalhada",
      columns: [34, 13, 18, 18, 16, 13, 13, 16, 16, 13, 18],
      rows: detailRows,
      autoFilter: `A1:K${Math.max(detailRows.length, 1)}`,
      freezeRow: 1,
    },
  ]);
}

function generateWhatsAppText(payload: Awaited<ReturnType<typeof buildMorningPayload>>) {
  return `*MX PERFORMANCE | RELATÓRIO MATINAL*
${payload.store.name.toUpperCase()} | Ref: ${formatPtBrDate(payload.referenceDate)}

Falta para a meta: ${payload.gap} ${pluralizeCar(payload.gap)}
Projeção atual: ${payload.projection} ${pluralizeCar(payload.projection)}

${payload.semRegistro.length > 0 ? `Sem registro hoje: ${payload.semRegistro.join(", ")}` : "Todos registraram hoje"}

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
  const projectionColor = payload.projection >= payload.storeGoal ? "#1FCB6E" : "#FF6B5B";
  const reachingColor = payload.reaching >= 100 ? "#1FCB6E" : payload.reaching >= 80 ? "#FFB547" : "#FF6B5B";
  const registrationColor = payload.semRegistro.length > 0 ? "#FF6B5B" : "#1FCB6E";
  const wppLink = payload.whatsappGroupRef && payload.whatsappGroupRef.startsWith("http")
    ? payload.whatsappGroupRef
    : `https://api.whatsapp.com/send?text=${wppText}`;
  const sellerRows = payload.ranking.length > 0
    ? payload.ranking.map((row) => `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin:0 0 12px 0;border:1px solid #243227;border-radius:12px;overflow:hidden;background:#0A100C;">
        <tr>
          <td colspan="4" style="background:#0F1612;border-bottom:1px solid #172019;color:#E8F0EA;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:900;text-transform:uppercase;padding:13px 18px;">${escapeHtml(row.name.toUpperCase())}</td>
        </tr>
        <tr>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Leads</td>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Agd hoje</td>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Vnd ontem</td>
          <td width="25%" align="center" style="background:#0B100C;color:#5C6A60;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;font-weight:900;text-transform:uppercase;padding:8px 8px;">Total mês</td>
        </tr>
        <tr>
          <td align="center" style="background:#0A100C;color:#E8F0EA;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${row.leads}</td>
          <td align="center" style="background:#0A100C;color:#E8F0EA;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${row.agd_cart_today + row.agd_net_today}</td>
          <td align="center" style="background:#0A100C;color:#1FCB6E;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${row.vnd_yesterday}</td>
          <td align="center" style="background:#0F1612;color:#1FCB6E;font-family:Arial,Helvetica,sans-serif;font-size:19px;line-height:24px;font-weight:900;padding:12px 8px;">${row.vt}</td>
        </tr>
      </table>`).join("")
    : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 12px 0;background:#0A100C;border:1px solid #243227;border-radius:12px;"><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;color:#9BA89F;font-size:14px;font-weight:700;padding:18px;">Nenhum vendedor ativo encontrado.</td></tr></table>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MX Performance | Relatório Matinal</title>
</head>
<body style="margin:0;padding:0;background:#070A08;color:#E8F0EA;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#070A08;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 14px;background:#070A08;">
        <table role="presentation" width="860" cellspacing="0" cellpadding="0" style="width:860px;max-width:100%;border-collapse:separate;border-spacing:0;background:#0B100C;border:1px solid #243227;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0F1612;border-bottom:1px solid #243227;font-family:Arial,Helvetica,sans-serif;padding:22px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="color:#1FCB6E;font-size:12px;line-height:16px;font-weight:900;text-transform:uppercase;">MX Performance</div>
                    <div style="color:#E8F0EA;font-size:28px;line-height:34px;font-weight:900;text-transform:uppercase;margin-top:4px;">Relatório Matinal</div>
                  </td>
                  <td align="right" style="vertical-align:middle;color:#9BA89F;font-size:13px;line-height:18px;font-weight:700;text-transform:uppercase;">Ref. ${formatPtBrDate(payload.referenceDate)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#0B100C;border-bottom:1px solid #172019;font-family:Arial,Helvetica,sans-serif;padding:26px 24px;">
              <div style="color:#5C6A60;font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;">Loja monitorada</div>
              <div style="color:#E8F0EA;font-size:30px;line-height:36px;font-weight:900;text-transform:uppercase;margin-top:4px;">${escapeHtml(payload.store.name.toUpperCase())}</div>
              <div style="margin-top:18px;border-left:4px solid ${projectionColor};background:#0A100C;border-radius:10px;padding:16px 18px;">
                <div style="color:#E8F0EA;font-size:21px;line-height:28px;font-weight:900;text-transform:uppercase;">Faltam ${payload.gap} ${pluralizeCar(payload.gap)} para a meta</div>
                <div style="color:#9BA89F;font-size:15px;line-height:22px;margin-top:4px;">Projeção atual de fechamento: <strong style="color:${projectionColor};">${payload.projection} ${pluralizeCar(payload.projection)}</strong></div>
                <div style="color:${registrationColor};font-size:13px;line-height:19px;font-weight:900;text-transform:uppercase;margin-top:10px;">${payload.semRegistro.length > 0 ? `Sem registro hoje: ${escapeHtml(payload.semRegistro.join(", ").toUpperCase())}` : "Todos registraram hoje"}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 22px 0 22px;background:#0B100C;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:10px 0;margin:0 0 18px 0;">
                <tr>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;">
                    <div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Vendas</div>
                    <div style="font-size:27px;line-height:32px;font-weight:900;margin-top:4px;">${payload.totalSales}</div>
                  </td>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;">
                    <div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Meta</div>
                    <div style="font-size:27px;line-height:32px;font-weight:900;margin-top:4px;">${payload.storeGoal}</div>
                  </td>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;">
                    <div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Projeção</div>
                    <div style="font-size:27px;line-height:32px;font-weight:900;color:${projectionColor};margin-top:4px;">${payload.projection}</div>
                  </td>
                  <td width="25%" align="center" style="background:#0A100C;border:1px solid #243227;border-radius:12px;font-family:Arial,Helvetica,sans-serif;color:#E8F0EA;padding:17px 8px;">
                    <div style="font-size:11px;line-height:15px;text-transform:uppercase;color:#5C6A60;font-weight:900;">Ating.</div>
                    <div style="font-size:27px;line-height:32px;font-weight:900;color:${reachingColor};margin-top:4px;">${payload.reaching}%</div>
                  </td>
                </tr>
              </table>
              ${sellerRows}
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#0B100C;padding:22px 22px 12px 22px;font-family:Arial,Helvetica,sans-serif;color:#9BA89F;font-size:14px;line-height:21px;">
              O anexo mantém o painel visual e a lista detalhada para filtros operacionais.
            </td>
          </tr>
          <tr>
            <td align="center" style="background:#0B100C;padding:0 22px 38px 22px;">
              <a href="${wppLink}" style="display:inline-block;background:#1FCB6E;color:#062012;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:900;text-transform:uppercase;padding:15px 34px;">Enviar no WhatsApp</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
