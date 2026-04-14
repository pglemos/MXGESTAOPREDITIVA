import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
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

async function decryptToken(payload: string): Promise<string> {
  if (!payload.startsWith("v1.")) {
    return payload;
  }

  const [, ivPart, cipherPart] = payload.split(".");
  if (!ivPart || !cipherPart) {
    throw new Error("Invalid encrypted token payload");
  }

  const secret = requireEnv("GOOGLE_TOKEN_ENCRYPTION_SECRET", Deno.env.get("GOOGLE_TOKEN_ENCRYPTION_SECRET"));
  const key = await deriveAesKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(ivPart) },
    key,
    fromBase64Url(cipherPart),
  );

  return textDecoder.decode(plaintext);
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET),
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  }

  return { access_token: data.access_token, expires_in: data.expires_in };
}

function parseClientId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const clientId = value.trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(clientId)) {
    throw new Error("Invalid clientId");
  }

  return clientId;
}

function createSessionClient(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const sessionKey = SUPABASE_ANON_KEY ?? SUPABASE_SERVICE_ROLE_KEY;
  const client = createClient(
    requireEnv("SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_SESSION_KEY", sessionKey),
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  return client;
}

async function assertClientAccess(sessionClient: ReturnType<typeof createSessionClient>, clientId: string) {
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

async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string,
  maxResults: number,
) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return response;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sessionClient = createSessionClient(req.headers.get("Authorization"));
    const { data: authData, error: authError } = await sessionClient.auth.getUser();

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const requestedClientId = parseClientId(body.clientId);

    const maxResults = Number.isFinite(Number(body.maxResults))
      ? Math.min(Math.max(Number(body.maxResults), 1), 50)
      : 10;
    const timeMin = typeof body.timeMin === "string" && body.timeMin.trim() !== ""
      ? body.timeMin.trim()
      : new Date().toISOString();
    const timeMax = typeof body.timeMax === "string" && body.timeMax.trim() !== ""
      ? body.timeMax.trim()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (requestedClientId) {
      await assertClientAccess(sessionClient, requestedClientId);
    }

    const { data: tokenRow, error: tokenError } = await sessionClient
      .from("consulting_oauth_tokens")
      .select("id, access_token, refresh_token, expires_at")
      .eq("user_id", authData.user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (tokenError) {
      throw tokenError;
    }

    if (!tokenRow) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settingsRow, error: settingsError } = await sessionClient
      .from("consulting_calendar_settings")
      .select("id, client_id, google_calendar_id, sync_active, last_sync_at")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (settingsError) {
      throw settingsError;
    }

    let calendarSettings = settingsRow;
    if (!calendarSettings) {
      const { data: insertedSettings, error: insertSettingsError } = await sessionClient
        .from("consulting_calendar_settings")
        .insert({
          user_id: authData.user.id,
          google_calendar_id: "primary",
          sync_active: true,
          ...(requestedClientId ? { client_id: requestedClientId } : {}),
        })
        .select("id, client_id, google_calendar_id, sync_active, last_sync_at")
        .single();

      if (insertSettingsError) {
        throw insertSettingsError;
      }

      calendarSettings = insertedSettings;
    }

    if (requestedClientId) {
      if (calendarSettings.client_id && calendarSettings.client_id !== requestedClientId) {
        return new Response(JSON.stringify({ error: "Calendar settings belong to a different client" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!calendarSettings.client_id) {
        const { error: attachClientError } = await sessionClient
          .from("consulting_calendar_settings")
          .update({ client_id: requestedClientId })
          .eq("id", calendarSettings.id);

        if (attachClientError) {
          throw attachClientError;
        }

        calendarSettings.client_id = requestedClientId;
      }
    }

    if (!calendarSettings.sync_active) {
      return new Response(JSON.stringify({ error: "Google Calendar sync is disabled for this account" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const calendarId = calendarSettings.google_calendar_id || "primary";
    const expiresAt = tokenRow.expires_at ? Date.parse(tokenRow.expires_at) : 0;
    let accessToken = await decryptToken(tokenRow.access_token);
    const refreshToken = tokenRow.refresh_token ? await decryptToken(tokenRow.refresh_token) : null;

    if (expiresAt && Date.now() >= expiresAt - 60_000) {
      if (!refreshToken) {
        return new Response(JSON.stringify({ error: "Google Calendar token expired and no refresh token is available" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
      const encryptedAccessToken = await encryptToken(refreshed.access_token);

      const { error: updateTokenError } = await sessionClient
        .from("consulting_oauth_tokens")
        .update({
          access_token: encryptedAccessToken,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("id", tokenRow.id);

      if (updateTokenError) {
        throw updateTokenError;
      }
    }

    const calendarRes = await fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax, maxResults);

    if (calendarRes.status === 401) {
      if (!refreshToken) {
        return new Response(JSON.stringify({ error: "Google Calendar authorization expired" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshed = await refreshAccessToken(refreshToken);
      accessToken = refreshed.access_token;
      const encryptedAccessToken = await encryptToken(refreshed.access_token);

      const { error: updateTokenError } = await sessionClient
        .from("consulting_oauth_tokens")
        .update({
          access_token: encryptedAccessToken,
          expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("id", tokenRow.id);

      if (updateTokenError) {
        throw updateTokenError;
      }

      const retryRes = await fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax, maxResults);
      const retryData = await retryRes.json();

      if (!retryRes.ok) {
        throw new Error(retryData.error?.message || retryData.error || "Google Calendar API error");
      }

      const { error: syncError } = await sessionClient
        .from("consulting_calendar_settings")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", calendarSettings.id);

      if (syncError) {
        throw syncError;
      }

      return new Response(JSON.stringify({ events: retryData.items || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const calendarData = await calendarRes.json();
    if (!calendarRes.ok) {
      throw new Error(calendarData.error?.message || calendarData.error || "Google Calendar API error");
    }

    const { error: syncError } = await sessionClient
      .from("consulting_calendar_settings")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", calendarSettings.id);

    if (syncError) {
      throw syncError;
    }

    return new Response(JSON.stringify({ events: calendarData.items || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
