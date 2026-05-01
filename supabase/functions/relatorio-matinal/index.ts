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
      const fileName = `matinal_MX_${store.name.replace(/\s+/g, "_")}_${formatPtBrDate(dates.referenceDate).replace(/\//g, "-")}.xlsx`;

      let emailStatus: "sent" | "failed" | "not_sent" | "dry_run" = body.dry_run ? "dry_run" : "not_sent";
      let warnings: string[] = [];

      if (!body.dry_run) {
        const result = await sendReportEmail({
          resend,
          to: payload.recipients,
          subject: `Matinal MX: ${store.name} - ${formatPtBrDate(payload.referenceDate)}`,
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
          errors: emailStatus === "failed" ? warnings : [],
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
  const reaching = storeGoal > 0 ? Math.round((totalSales / storeGoal) * 100) : 0;
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

function generateXLSX(ranking: Array<SellerRow & { vt: number }>) {
  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Matinal MX">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell><Data ss:Type="String">LEADS NOVOS RECEBIDOS NO DIA ANTERIOR</Data></Cell>
    <Cell><Data ss:Type="String">AGENDAMENTOS CARTEIRA ( HOJE )</Data></Cell>
    <Cell><Data ss:Type="String">AGENDAMENTOS INTERNET ( HOJE )</Data></Cell>
    <Cell><Data ss:Type="String">VENDA PORTA ( ONTEM )</Data></Cell>
    <Cell><Data ss:Type="String">VENDAS CARTEIRA VENDEDOR ( ONTEM )</Data></Cell>
    <Cell><Data ss:Type="String">VENDA INTERNET ( ONTEM )</Data></Cell>
    <Cell><Data ss:Type="String">STATUS REGISTRO</Data></Cell>
   </Row>
   ${ranking.map(row => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.leads}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.agd_cart_today}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.agd_net_today}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vp}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vc}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vn}</Data></Cell>
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
  return `*MATINAL MX - ${payload.store.name}*
Ref: ${formatPtBrDate(payload.referenceDate)}

Meta: ${payload.storeGoal}
Vendido: ${payload.totalSales} (${payload.reaching}%)
Projecao: ${payload.projection}
Faltam: ${payload.gap}

Top 3
${payload.ranking.slice(0, 3).map((row, index) => `${index + 1}º ${row.name} - ${row.vt}v`).join("\n")}

${payload.semRegistro.length > 0 ? `SEM REGISTRO:\n${payload.semRegistro.join(", ")}` : "Todos registraram."}

MX PERFORMANCE`;
}

function generateHTML(payload: Awaited<ReturnType<typeof buildMorningPayload>>) {
  const wppText = encodeURIComponent(generateWhatsAppText(payload));
  const statusColor = payload.reaching >= 100 ? "#10b981" : payload.reaching >= 80 ? "#4f46e5" : "#f43f5e";
  const wppLink = payload.whatsappGroupRef && payload.whatsappGroupRef.startsWith("http")
    ? payload.whatsappGroupRef
    : `https://api.whatsapp.com/send?text=${wppText}`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:20px;line-height:1.5}
.c{max-width:720px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px -10px rgba(0,0,0,.12);overflow:hidden}
.h{background:#0f172a;padding:44px 32px;text-align:center;border-bottom:4px solid #4f46e5}
.h h1{color:#fff;margin:0 0 12px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.h p{color:#94a3b8;margin:0;font-size:13px;text-transform:uppercase;letter-spacing:3px}
.content{padding:36px 32px}.sr{background:#fff1f2;border-left:4px solid #f43f5e;padding:18px;border-radius:12px;margin-bottom:28px;color:#9f1239;font-weight:700;font-size:14px}
.ss{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:28px}.s{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:22px;text-align:center}
.sv{font-size:36px;font-weight:900;color:#0f172a;line-height:1;margin-bottom:8px}.sl{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;font-weight:700}
.alert{text-align:center;padding:18px;background:#f1f5f9;border-radius:16px;font-size:14px;font-weight:800;color:#334155;margin-bottom:34px;border:1px dashed #cbd5e1}
table{width:100%;border-collapse:separate;border-spacing:0;margin-bottom:34px}th{background:#fff;padding:14px 10px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #0f172a;font-weight:800}
td{padding:16px 10px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:#334155}.btn{display:block;background:#4f46e5;color:#fff;text-align:center;padding:18px;border-radius:14px;text-decoration:none;font-weight:900;text-transform:uppercase;letter-spacing:1.5px}
.f{text-align:center;padding:28px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #f1f5f9;background:#fcfcfc}
</style></head><body><div class="c">
<div class="h"><h1>Matinal MX</h1><p>${payload.store.name} &bull; ${formatPtBrDate(payload.referenceDate)}</p></div>
<div class="content">
${payload.semRegistro.length > 0 ? `<div class="sr">Atencao: ${payload.semRegistro.join(", ")} estao sem registro no fechamento.</div>` : ""}
<div class="ss">
<div class="s"><div class="sv" style="color:${statusColor}">${payload.totalSales}</div><div class="sl">Vendido</div></div>
<div class="s"><div class="sv">${payload.storeGoal}</div><div class="sl">Meta</div></div>
<div class="s"><div class="sv">${payload.projection}</div><div class="sl">Projecao</div></div>
<div class="s"><div class="sv" style="color:${statusColor}">${payload.reaching}%</div><div class="sl">Atingimento</div></div>
</div>
<div class="alert">Faltam ${payload.gap} vendas em ${payload.daysRemaining} dias (${payload.daysRemaining > 0 ? (payload.gap / payload.daysRemaining).toFixed(1) : 0}/dia)</div>
<table><thead><tr><th>Vendedor</th><th>Leads</th><th>AGD Hoje</th><th>Visitas D-1</th><th>VND</th><th>Registro</th></tr></thead>
<tbody>${payload.ranking.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${row.leads}</td><td>${row.agd_cart_today + row.agd_net_today}</td><td>${row.vis}</td><td>${row.vt}</td><td>${row.sem_registro ? "Sem registro" : "OK"}</td></tr>`).join("")}</tbody></table>
<a href="${wppLink}" class="btn">Enviar no WhatsApp</a>
</div>
<div class="f">MX PERFORMANCE &copy; ${payload.year}</div>
</div></body></html>`;
}
