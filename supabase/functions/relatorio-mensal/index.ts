import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabase = createClient(supabaseUrl, serviceKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type MonthlyRequest = {
  store_id?: string;
  dry_run?: boolean;
  force?: boolean;
};

type SellerMonthlyRow = {
  uid: string;
  name: string;
  leads: number;
  agd: number;
  vis: number;
  vp: number;
  vc: number;
  vn: number;
  is_venda_loja: boolean;
  vt: number;
};

Deno.serve(async (req: Request) => {
  try {
    const body = await parseBody(req);
    const dates = getSaoPauloMonthlyWindow();

    let storesQuery = supabase.from("stores").select("*").eq("active", true).order("name");
    if (body.store_id) storesQuery = storesQuery.eq("id", body.store_id);

    const { data: stores, error: storesError } = await storesQuery;
    if (storesError) throw storesError;
    if (!stores?.length) return jsonResponse({ message: "No active stores", reports: [] });

    const reports = [];

    for (const store of stores) {
      const idempotencyKey = `mensal-${store.id}-${dates.year}-${String(dates.month).padStart(2, "0")}`;
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

      const payload = await buildMonthlyPayload(store, dates);
      const html = generateMonthlyHTML(payload);
      const xlsxBase64 = generateMonthlyXLSX(payload);
      const fileName = `fechamento_mensal_MX_${store.name.replace(/\s+/g, "_")}_${dates.year}_${String(dates.month).padStart(2, "0")}.xlsx`;

      let emailStatus: "sent" | "failed" | "not_sent" | "dry_run" = body.dry_run ? "dry_run" : "not_sent";
      let warnings: string[] = [];

      if (!body.dry_run) {
        if (!resend) {
          warnings = ["RESEND_API_KEY nao configurada"];
        } else if (payload.recipients.length === 0) {
          warnings = ["Nenhum destinatario mensal configurado"];
        } else {
          try {
            const { error } = await resend.emails.send({
              from: "MX Relatórios <relatorios@mxperformance.com.br>",
              to: payload.recipients,
              subject: `Fechamento Mensal MX: ${store.name} - ${payload.monthLabel.toUpperCase()}`,
              html,
              attachments: [{ filename: fileName, content: xlsxBase64 }],
            });

            if (error) {
              console.error(`[Mensal] Error sending email for ${store.name}:`, error);
              emailStatus = "failed";
              warnings = ["Falha no disparo do e-mail"];
            } else {
              emailStatus = "sent";
            }
          } catch (err) {
            console.error(`[Mensal] Critical error sending email for ${store.name}:`, err);
            emailStatus = "failed";
            warnings = ["Erro critico no disparo do e-mail"];
          }
        }

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
          processed_at: new Date().toISOString(),
        });
      }

      reports.push({
        store: store.name,
        total_vendas: payload.totalSales,
        meta: payload.storeGoal,
        pct: payload.reaching,
        recipients: payload.recipients.length,
        email: emailStatus,
        dry_run: body.dry_run || false,
      });
    }

    return jsonResponse({ message: "Processamento mensal concluido", reports });
  } catch (error) {
    console.error("[Mensal] Fatal error:", error);
    return jsonResponse({ error: String(error) }, 500);
  }
});

async function parseBody(req: Request): Promise<MonthlyRequest> {
  if (req.method !== "POST") return {};
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function getSaoPauloMonthlyWindow() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());
  const [year, month] = today.split("-").map(Number);
  const referenceMonthDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  referenceMonthDate.setUTCMonth(referenceMonthDate.getUTCMonth() - 1);

  const referenceYear = referenceMonthDate.getUTCFullYear();
  const referenceMonth = referenceMonthDate.getUTCMonth() + 1;
  const start = `${referenceYear}-${String(referenceMonth).padStart(2, "0")}-01`;
  const end = `${referenceYear}-${String(referenceMonth).padStart(2, "0")}-${String(new Date(Date.UTC(referenceYear, referenceMonth, 0)).getUTCDate()).padStart(2, "0")}`;
  const monthLabel = referenceMonthDate.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    month: "long",
    year: "numeric",
  });

  return {
    year: referenceYear,
    month: referenceMonth,
    start,
    end,
    monthLabel,
  };
}

async function buildMonthlyPayload(store: any, dates: ReturnType<typeof getSaoPauloMonthlyWindow>) {
  const [deliveryRulesRes, tenuresRes, fallbackMembersRes, checkinsRes, metaRulesRes] = await Promise.all([
    supabase.from("store_delivery_rules").select("monthly_recipients").eq("store_id", store.id).maybeSingle(),
    supabase
      .from("store_sellers")
      .select("seller_user_id, is_active, users:seller_user_id(name, is_venda_loja)")
      .eq("store_id", store.id)
      .eq("is_active", true),
    supabase
      .from("memberships")
      .select("user_id, users(name, is_venda_loja)")
      .eq("store_id", store.id)
      .eq("role", "vendedor"),
    supabase
      .from("daily_checkins")
      .select("*")
      .eq("store_id", store.id)
      .gte("reference_date", dates.start)
      .lte("reference_date", dates.end),
    supabase
      .from("store_meta_rules")
      .select("monthly_goal, include_venda_loja_in_store_total")
      .eq("store_id", store.id)
      .maybeSingle(),
  ]);

  const rosterRows = tenuresRes.data && tenuresRes.data.length > 0
    ? tenuresRes.data.map((item: any) => ({ user_id: item.seller_user_id, users: item.users }))
    : (fallbackMembersRes.data || []);

  const agg = new Map<string, SellerMonthlyRow>();
  for (const row of rosterRows) {
    const user = (row as any).users;
    agg.set(row.user_id, {
      uid: row.user_id,
      name: user?.name || "Vendedor",
      leads: 0,
      agd: 0,
      vis: 0,
      vp: 0,
      vc: 0,
      vn: 0,
      is_venda_loja: user?.is_venda_loja || false,
      vt: 0,
    });
  }

  for (const checkin of checkinsRes.data || []) {
    const seller = agg.get(checkin.seller_user_id);
    if (!seller) continue;
    seller.leads += checkin.leads_prev_day || 0;
    seller.agd += (checkin.agd_cart_today || 0) + (checkin.agd_net_today || 0);
    seller.vis += checkin.visit_prev_day || 0;
    seller.vp += checkin.vnd_porta_prev_day || 0;
    seller.vc += checkin.vnd_cart_prev_day || 0;
    seller.vn += checkin.vnd_net_prev_day || 0;
    seller.vt = seller.vp + seller.vc + seller.vn;
  }

  const includeVendaLoja = metaRulesRes.data?.include_venda_loja_in_store_total ?? true;
  const ranking = Array.from(agg.values())
    .sort((a, b) => {
      if (b.vt !== a.vt) return b.vt - a.vt;
      if (a.is_venda_loja !== b.is_venda_loja) return a.is_venda_loja ? 1 : -1;
      return b.vis - a.vis;
    });

  const productionRows = includeVendaLoja ? ranking : ranking.filter((row) => !row.is_venda_loja);
  const totalSales = productionRows.reduce((sum, row) => sum + row.vt, 0);
  const storeGoal = metaRulesRes.data?.monthly_goal || 0;
  const reaching = storeGoal > 0 ? Math.round((totalSales / storeGoal) * 100) : 0;
  const recipients = deliveryRulesRes.data?.monthly_recipients || [];

  return {
    store,
    monthLabel: dates.monthLabel,
    recipients,
    ranking,
    totalSales,
    storeGoal,
    reaching,
    year: dates.year,
  };
}

function generateMonthlyHTML(payload: Awaited<ReturnType<typeof buildMonthlyPayload>>) {
  const top3 = payload.ranking.slice(0, 3);
  const whatsappText = encodeURIComponent(
    `*FECHAMENTO MENSAL MX - ${payload.store.name.toUpperCase()}*\n` +
      `Periodo: ${payload.monthLabel}\n\n` +
      `Meta: ${payload.storeGoal}\n` +
      `Vendido: ${payload.totalSales} (${payload.reaching}%)\n\n` +
      `TOP 3\n` +
      top3.map((row, index) => `${index + 1}º ${row.name} - ${row.vt}v`).join("\n")
  );

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
body{font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px}
.card{max-width:760px;margin:0 auto;background:#fff;border-radius:32px;border:1px solid #e2e8f0;overflow:hidden}
.hero{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:56px 36px;color:#fff;border-bottom:6px solid #eab308}
.hero h1{margin:0 0 10px;font-size:32px;text-transform:uppercase;letter-spacing:2px}
.hero p{margin:0;color:#facc15;text-transform:uppercase;letter-spacing:5px;font-weight:800}
.content{padding:40px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:32px}
.stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:24px;padding:24px;text-align:center}
.value{font-size:46px;font-weight:900;letter-spacing:-2px}
.label{font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#64748b}
table{width:100%;border-collapse:separate;border-spacing:0 10px}
th{font-size:11px;text-transform:uppercase;color:#94a3b8;text-align:left;letter-spacing:2px;padding:0 12px 6px}
td{padding:16px;background:#f8fafc;font-weight:700;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
td:first-child{border-left:1px solid #e2e8f0;border-radius:14px 0 0 14px}
td:last-child{border-right:1px solid #e2e8f0;border-radius:0 14px 14px 0}
.cta{display:block;margin-top:32px;background:#0f172a;color:#facc15;text-decoration:none;text-align:center;padding:18px;border-radius:18px;font-weight:900;text-transform:uppercase;letter-spacing:3px}
</style></head><body>
<div class="card">
  <div class="hero">
    <h1>Fechamento Mensal MX</h1>
    <p>${payload.store.name} • ${payload.monthLabel}</p>
  </div>
  <div class="content">
    <div class="grid">
      <div class="stat"><div class="value">${payload.totalSales}</div><div class="label">Vendas do Mês</div></div>
      <div class="stat"><div class="value">${payload.reaching}%</div><div class="label">Atingimento</div></div>
    </div>
    <table>
      <thead><tr><th>Especialista</th><th>Leads</th><th>Visitas</th><th>Vendas</th></tr></thead>
      <tbody>${payload.ranking.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${row.leads}</td><td>${row.vis}</td><td>${row.vt}</td></tr>`).join("")}</tbody>
    </table>
    <a class="cta" href="https://wa.me/?text=${whatsappText}">Reconhecer Equipe no WhatsApp</a>
  </div>
</div>
</body></html>`;
}

function generateMonthlyXLSX(payload: any) {
    const { ranking, store, monthLabel } = payload;
    
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="FECHAMENTO MENSAL">
  <Table>
   <Row><Cell><Data ss:Type="String">LOJA: ${escapeXml(store.name)}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">MES: ${monthLabel}</Data></Cell></Row>
   <Row ss:Index="4" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Vendedor</Data></Cell>
    <Cell><Data ss:Type="String">Leads</Data></Cell>
    <Cell><Data ss:Type="String">Agendamentos</Data></Cell>
    <Cell><Data ss:Type="String">Visitas</Data></Cell>
    <Cell><Data ss:Type="String">Venda Porta</Data></Cell>
    <Cell><Data ss:Type="String">Venda Carteira</Data></Cell>
    <Cell><Data ss:Type="String">Venda Internet</Data></Cell>
    <Cell><Data ss:Type="String">Total Vendas</Data></Cell>
   </Row>
   ${ranking.map((row: any) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.leads}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.agd}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vis}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vp}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vc}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vn}</Data></Cell>
    <Cell><Data ss:Type="Number">${row.vt}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

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

function escapeHtml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return char;
    }
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
