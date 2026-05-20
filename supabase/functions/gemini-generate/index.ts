import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { requireAuthenticatedRole } from "../_shared/auth.ts";
import { createServiceClient } from "../_shared/supabase-client.ts";

type VisitGroupSummaryPayload = {
  mode?: "visit_group_summary";
  draft?: string;
  clientName?: string;
  visitNumber?: number;
  objective?: string;
  visitDate?: string;
  completedTasks?: string[];
  pendingTasks?: string[];
  feedbackClient?: string;
  nextCycleGoal?: string;
};

type ClaimedQuota = {
  selected_model: string;
  used_requests: number;
  daily_limit: number;
  quota_date: string;
  fallback_used: boolean;
};

const provider = "gemini";
const primaryModel = Deno.env.get("GEMINI_PRIMARY_MODEL") || "gemini-2.5-flash";
const fallbackModel = Deno.env.get("GEMINI_FALLBACK_MODEL") || "gemini-2.5-flash-lite";
const primaryDailyLimit = readPositiveIntEnv("GEMINI_PRIMARY_DAILY_LIMIT", 18);
const fallbackDailyLimit = readPositiveIntEnv("GEMINI_FALLBACK_DAILY_LIMIT", 18);

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
  return [
    "Gere um resumo executivo curto para enviar no grupo do cliente apos uma visita de consultoria MX.",
    "Use portugues do Brasil, tom profissional, direto e humano.",
    "Nao invente numeros, promessas, responsaveis ou datas que nao estejam nos dados.",
    "Formato obrigatorio:",
    "1. Saudacao curta com nome do cliente, se houver.",
    "2. Resumo da visita em 1 paragrafo.",
    "3. Pontos alinhados/concluidos em bullets.",
    "4. Pendencias/proximos passos em bullets.",
    "5. Fechamento curto com foco do proximo ciclo.",
    "",
    `Cliente: ${truncate(payload.clientName, 160) || "Nao informado"}`,
    `Visita: ${payload.visitNumber || "Nao informado"}`,
    `Data: ${truncate(payload.visitDate, 80) || "Nao informado"}`,
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

async function claimQuota(forceFallback = false) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("claim_ai_model_daily_quota", {
    p_provider: provider,
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

async function callGemini(model: string, prompt: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{
          text: "Voce e um assistente operacional da MX Performance. Responda somente com o texto final solicitado, sem markdown decorativo excessivo.",
        }],
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        topP: 0.9,
        maxOutputTokens: 1200,
      },
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || `Gemini request failed (${response.status})`;
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const text = body?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const auth = await requireAuthenticatedRole(req, ["administrador_geral", "administrador_mx", "consultor_mx"]);
    if (auth.response) return auth.response;

    const payload = await req.json().catch(() => ({})) as VisitGroupSummaryPayload;
    if (payload.mode && payload.mode !== "visit_group_summary") {
      return jsonResponse({ success: false, error: "Unsupported generation mode" }, 400);
    }

    let quota = await claimQuota();
    if (!quota) {
      return jsonResponse({ success: false, error: "Daily Gemini quota exhausted" }, 429);
    }

    const prompt = buildVisitGroupSummaryPrompt(payload);
    try {
      const text = await callGemini(quota.selected_model, prompt);
      return jsonResponse({
        success: true,
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
      if (status !== 429 || quota.selected_model === fallbackModel) throw error;

      quota = await claimQuota(true);
      if (!quota || quota.selected_model !== fallbackModel) throw error;

      const text = await callGemini(quota.selected_model, prompt);
      return jsonResponse({
        success: true,
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
    const status = message.includes("Missing GEMINI_API_KEY") ? 500 : 400;
    return jsonResponse({ success: false, error: message }, status);
  }
});
