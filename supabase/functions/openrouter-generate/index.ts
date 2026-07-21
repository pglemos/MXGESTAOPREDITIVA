import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuthenticatedRole, type MxRole } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

type VisitGroupSummaryPayload = {
  mode?: "visit_group_summary";
  draft?: string;
  clientName?: string;
  visitNumber?: number;
  objective?: string;
  visitDate?: string;
  consultantName?: string;
  modality?: string;
  completedTasks?: string[];
  pendingTasks?: string[];
  feedbackClient?: string;
  nextCycleGoal?: string;
};

type CrmWhatsappScriptPayload = {
  mode: "crm_whatsapp_script";
  prompt?: string;
};

type GeneratePayload = VisitGroupSummaryPayload | CrmWhatsappScriptPayload;

const ROLES_BY_MODE: Record<string, MxRole[]> = {
  visit_group_summary: ["administrador_geral", "administrador_mx", "consultor_mx"],
  crm_whatsapp_script: ["administrador_geral", "administrador_mx", "vendedor"],
};

const VISIT_SYSTEM_PROMPT =
  "Voce e um consultor senior da MX Performance. Responda somente com o relatorio e o texto de WhatsApp solicitados, sem comentarios extras.";
const CRM_SCRIPT_SYSTEM_PROMPT =
  "Voce e um assistente de vendas da MX Performance especializado em mensagens de WhatsApp para concessionarias. Responda apenas com o texto da mensagem solicitada, sem explicacoes adicionais, sem markdown, sem aspas.";

type ClaimedQuota = {
  selected_model: string;
  used_requests: number;
  daily_limit: number;
  quota_date: string;
  fallback_used: boolean;
};

const provider = "openrouter";
const primaryModel = Deno.env.get("OPENROUTER_PRIMARY_MODEL") || "openrouter/free";
const fallbackModel = Deno.env.get("OPENROUTER_FALLBACK_MODEL") || "deepseek/deepseek-v4-flash:free";
const primaryDailyLimit = readPositiveIntEnv("OPENROUTER_PRIMARY_DAILY_LIMIT", 40);
const fallbackDailyLimit = readPositiveIntEnv("OPENROUTER_FALLBACK_DAILY_LIMIT", 5);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function readPositiveIntEnv(name: string, fallback: number) {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function truncate(value: string | undefined, maxLength: number) {
  const text = (value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function listItems(items: string[] | undefined) {
  const values = (items || []).map((item) => item.trim()).filter(Boolean).slice(0, 40);
  return values.length ? values.map((item) => `- ${item}`).join("\n") : "- Nao informado";
}

function buildVisitGroupSummaryPrompt(payload: VisitGroupSummaryPayload) {
  const modality = truncate(payload.modality, 80) || "ONLINE ou PRESENCIAL";

  return [
    "Gere o texto final da visita tecnica no padrao MX.",
    "Use portugues do Brasil, tom consultivo, firme, executivo, direto e humano.",
    "Siga sempre a estrutura abaixo, nessa ordem, com titulos em caixa alta.",
    "Nao invente numeros, nomes, responsaveis, datas, eventos, margem, lucro, bancos ou promessas que nao estejam nos dados.",
    "Quando um dado nao existir, escreva 'Nao informado' ou transforme em orientacao qualitativa sem criar numero.",
    "O relatorio deve ser especifico para a reuniao, nao generico.",
    "",
    "ESTRUTURA OBRIGATORIA:",
    `RELATÓRIO DE VISITA TÉCNICA - MÉTODO MX (${modality.toUpperCase()})`,
    "Empresa: {cliente}",
    "Data da Reunião: {data}",
    "Consultor: {consultor}",
    "________________________________________",
    "🎯 OBJETIVO DA REUNIÃO",
    "{objetivo em um paragrafo}",
    "________________________________________",
    "💰 1. RAIO-X FINANCEIRO E DE ESTOQUE (ONDE ESTÁ O DINHEIRO)",
    "{diagnostico financeiro/estoque/funil com bullets apenas se houver dados. Se nao houver, registrar que os dados precisam ser preenchidos ou validados.}",
    "________________________________________",
    "⚠️ 2. DIAGNÓSTICO DO FUNIL (ONDE ESTÁ O VAZAMENTO)",
    "{gargalos, perdas, causas e leitura operacional. Usar numeros somente se estiverem nos dados.}",
    "________________________________________",
    "👥 3. GESTÃO DE EQUIPE E COMPORTAMENTO",
    "{pontos sobre gestao, foco, comportamento, responsaveis e riscos. Nao expor assunto pessoal sensivel se nao estiver descrito pelo consultor.}",
    "________________________________________",
    "🚀 4. PLANO DE AÇÃO URGENTE E INEGOCIÁVEL",
    "{lista numerada com acoes praticas, donos e prazos somente quando informados.}",
    "________________________________________",
    "Consultor MX {consultor}",
    "________________________________________",
    "📱 TEXTO PARA ENVIAR NO GRUPO DE WHATSAPP DA LOJA",
    "Assunto: Relatorio de Reuniao Gerencial e Plano de Acao - {cliente} ({data})",
    "{mensagem curta, energica e profissional, resumindo diagnostico e plano de acao.}",
    "",
    `Cliente: ${truncate(payload.clientName, 160) || "Nao informado"}`,
    `Visita: ${payload.visitNumber || "Nao informado"}`,
    `Data: ${truncate(payload.visitDate, 80) || "Nao informado"}`,
    `Consultor: ${truncate(payload.consultantName, 160) || "Nao informado"}`,
    `Modalidade: ${modality}`,
    `Objetivo: ${truncate(payload.objective, 1000) || "Nao informado"}`,
    `Foco do proximo ciclo: ${truncate(payload.nextCycleGoal, 1000) || "Nao informado"}`,
    "",
    "Rascunho do consultor:",
    truncate(payload.draft, 8000) || "Nao informado",
    "",
    "Devolutiva ao cliente:",
    truncate(payload.feedbackClient, 4000) || "Nao informado",
    "",
    "Tarefas concluidas:",
    listItems(payload.completedTasks),
    "",
    "Tarefas pendentes:",
    listItems(payload.pendingTasks),
  ].join("\n");
}

function buildCrmWhatsappScriptRequest(payload: CrmWhatsappScriptPayload) {
  const prompt = (payload.prompt || "").trim();
  if (!prompt) throw new Error("Missing prompt");
  if (prompt.length > 8000) throw new Error("Prompt too long");
  return { prompt, systemPrompt: CRM_SCRIPT_SYSTEM_PROMPT };
}

async function claimQuota(providerKey: string, forceFallback = false) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("claim_ai_model_daily_quota", {
    p_provider: providerKey,
    p_primary_model: primaryModel,
    p_primary_daily_limit: primaryDailyLimit,
    p_fallback_model: fallbackModel,
    p_fallback_daily_limit: fallbackDailyLimit,
    p_force_fallback: forceFallback,
  });

  if (error) throw new Error(`Quota check failed: ${error.message}`);
  const claimed = Array.isArray(data) ? data[0] : data;
  return claimed as ClaimedQuota | null;
}

async function callOpenRouter(model: string, prompt: string, systemPrompt: string) {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": Deno.env.get("OPENROUTER_SITE_URL") || "https://mxperformance.vercel.app",
      "X-Title": Deno.env.get("OPENROUTER_APP_NAME") || "MX Performance",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.25,
      top_p: 0.9,
      max_tokens: 2200,
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || `OpenRouter request failed (${response.status})`;
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const text = body?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenRouter returned an empty response");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const payload = await req.json().catch(() => ({})) as GeneratePayload;
    const mode = payload.mode || "visit_group_summary";
    const allowedRoles = ROLES_BY_MODE[mode];
    if (!allowedRoles) {
      return jsonResponse({ success: false, error: "Unsupported generation mode" }, 400);
    }

    const auth = await requireAuthenticatedRole(req, allowedRoles);
    if (auth.response) return auth.response;

    const providerKey = mode === "crm_whatsapp_script" ? "openrouter-crm" : provider;
    const { prompt, systemPrompt } = mode === "crm_whatsapp_script"
      ? buildCrmWhatsappScriptRequest(payload as CrmWhatsappScriptPayload)
      : { prompt: buildVisitGroupSummaryPrompt(payload as VisitGroupSummaryPayload), systemPrompt: VISIT_SYSTEM_PROMPT };

    let quota = await claimQuota(providerKey);
    if (!quota) {
      return jsonResponse({ success: false, error: "Daily OpenRouter free quota exhausted" }, 429);
    }

    try {
      const text = await callOpenRouter(quota.selected_model, prompt, systemPrompt);
      return jsonResponse({
        success: true,
        provider: providerKey,
        text,
        model: quota.selected_model,
        fallbackUsed: quota.fallback_used,
        dailyUsage: {
          used: quota.used_requests,
          limit: quota.daily_limit,
          date: quota.quota_date,
        },
      });
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (![429, 503].includes(status || 0) || quota.selected_model === fallbackModel) throw error;

      quota = await claimQuota(providerKey, true);
      if (!quota || quota.selected_model !== fallbackModel) throw error;

      const text = await callOpenRouter(quota.selected_model, prompt, systemPrompt);
      return jsonResponse({
        success: true,
        provider: providerKey,
        text,
        model: quota.selected_model,
        fallbackUsed: true,
        dailyUsage: {
          used: quota.used_requests,
          limit: quota.daily_limit,
          date: quota.quota_date,
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    const status = message.includes("Missing OPENROUTER_API_KEY") ? 500 : 400;
    return jsonResponse({ success: false, error: message }, status);
  }
});
