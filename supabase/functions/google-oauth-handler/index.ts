import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type GoogleTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID),
    redirect_uri: requireEnv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI),
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

const textEncoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptToken(plaintext: string): Promise<string> {
  const secret = requireEnv("GOOGLE_TOKEN_ENCRYPTION_SECRET", Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_SECRET"));
  const key = await deriveAesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEncoder.encode(plaintext));

  return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

function parseClientId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(normalized)) {
    throw new Error("Invalid clientId");
  }

  return normalized;
}

async function getUserFromBearer(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const sessionClient = createClient(
    requireEnv("SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) {
    throw new Error("Invalid or expired session");
  }

  return data.user;
}

async function assertClientAccess(authHeader: string | null, clientId: string) {
  const sessionClient = createClient(
    requireEnv("SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY),
    {
      global: { headers: { Authorization: authHeader ?? "" } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data, error } = await sessionClient
    .from("consulting_clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Client access denied");
  }
}

function isExpired(expiresAt: string): boolean {
  return Date.parse(expiresAt) <= Date.now();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      if (req.method !== "POST") {
        return new Response("OAuth handler ready", { headers: corsHeaders });
      }

      const user = await getUserFromBearer(req.headers.get("Authorization"));
      const body = await req.json().catch(() => ({}));
      const clientId = parseClientId(body.clientId);

      if (clientId) {
        await assertClientAccess(req.headers.get("Authorization"), clientId);
      }

      const generatedState = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS).toISOString();

      const adminClient = createClient(
        requireEnv("SUPABASE_URL", SUPABASE_URL),
        requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
      );

      const { error: insertError } = await adminClient
        .from("consulting_google_oauth_states")
        .insert({
          user_id: user.id,
          client_id: clientId,
          state: generatedState,
          redirect_uri: requireEnv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI),
          expires_at: expiresAt,
        });

      if (insertError) {
        throw insertError;
      }

      return new Response(
        JSON.stringify({
          authUrl: buildGoogleAuthUrl(generatedState),
          state: generatedState,
          expiresAt,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!state) {
      throw new Error("Missing state");
    }

    const adminClient = createClient(
      requireEnv("SUPABASE_URL", SUPABASE_URL),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    );

    const { data: stateRow, error: stateError } = await adminClient
      .from("consulting_google_oauth_states")
      .select("id, user_id, client_id, redirect_uri, expires_at, consumed_at")
      .eq("state", state)
      .maybeSingle();

    if (stateError) {
      throw stateError;
    }

    if (!stateRow) {
      throw new Error("Invalid OAuth state");
    }

    if (stateRow.consumed_at) {
      throw new Error("OAuth state already consumed");
    }

    if (isExpired(stateRow.expires_at)) {
      throw new Error("OAuth state expired");
    }

    if (stateRow.redirect_uri !== requireEnv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI)) {
      throw new Error("OAuth redirect URI mismatch");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: requireEnv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID),
        client_secret: requireEnv("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET),
        redirect_uri: requireEnv("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI),
        grant_type: "authorization_code",
      }),
    });

    const tokens: GoogleTokens = await tokenResponse.json();
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null;

    const { data: existingToken, error: tokenLookupError } = await adminClient
      .from("consulting_oauth_tokens")
      .select("id")
      .eq("user_id", stateRow.user_id)
      .eq("provider", "google")
      .maybeSingle();

    if (tokenLookupError) {
      throw tokenLookupError;
    }

    const tokenPayload = {
      user_id: stateRow.user_id,
      provider: "google",
      access_token: encryptedAccessToken,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scopes: tokens.scope?.split(" ").filter(Boolean) ?? [],
    } as const;

    if (existingToken) {
      const updatePayload: Record<string, unknown> = {
        access_token: tokenPayload.access_token,
        expires_at: tokenPayload.expires_at,
        scopes: tokenPayload.scopes,
      };

      if (encryptedRefreshToken) {
        updatePayload.refresh_token = encryptedRefreshToken;
      }

      const { error: updateError } = await adminClient
        .from("consulting_oauth_tokens")
        .update(updatePayload)
        .eq("id", existingToken.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { error: insertTokenError } = await adminClient
        .from("consulting_oauth_tokens")
        .insert({
          ...tokenPayload,
          refresh_token: encryptedRefreshToken,
        });

      if (insertTokenError) {
        throw insertTokenError;
      }
    }

    const { data: existingSettings, error: settingsLookupError } = await adminClient
      .from("consulting_calendar_settings")
      .select("id, client_id")
      .eq("user_id", stateRow.user_id)
      .maybeSingle();

    if (settingsLookupError) {
      throw settingsLookupError;
    }

    const settingsPayload = {
      user_id: stateRow.user_id,
      google_calendar_id: "primary",
      sync_active: true,
      ...(stateRow.client_id ? { client_id: stateRow.client_id } : {}),
    };

    if (existingSettings) {
      const updateSettings: Record<string, unknown> = {};
      if (!existingSettings.client_id && stateRow.client_id) {
        updateSettings.client_id = stateRow.client_id;
      }
      updateSettings.google_calendar_id = "primary";
      updateSettings.sync_active = true;

      const { error: updateSettingsError } = await adminClient
        .from("consulting_calendar_settings")
        .update(updateSettings)
        .eq("id", existingSettings.id);

      if (updateSettingsError) {
        throw updateSettingsError;
      }
    } else {
      const { error: insertSettingsError } = await adminClient
        .from("consulting_calendar_settings")
        .insert(settingsPayload);

      if (insertSettingsError) {
        throw insertSettingsError;
      }
    }

    const { error: consumeError } = await adminClient
      .from("consulting_google_oauth_states")
      .delete()
      .eq("id", stateRow.id);

    if (consumeError) {
      throw consumeError;
    }

    return new Response("Agenda conectada com sucesso! Você pode fechar esta aba.", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth handler failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
