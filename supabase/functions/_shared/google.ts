import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireEnv, encryptToken, decryptToken } from "./crypto.ts";

export function parseClientId(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const normalized = value.trim();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(normalized)) throw new Error("Invalid clientId");
  return normalized;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_CLIENT_ID", Deno.env.get("GOOGLE_CLIENT_ID")),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET", Deno.env.get("GOOGLE_CLIENT_SECRET")),
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(`Token refresh failed: ${data.error_description || data.error}`);
  return { access_token: data.access_token, expires_in: data.expires_in };
}

export function createSessionClient(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing bearer token");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  return createClient(
    requireEnv("SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY ?? undefined),
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export async function assertClientAccess(sessionClient: any, clientId: string) {
  const { data, error } = await sessionClient
    .from("clientes_consultoria")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Client access denied");
}

/**
 * Returns access_token for the central MX calendar (gestao@mxconsultoria.com.br).
 * Uses GOOGLE_CENTRAL_REFRESH_TOKEN when configured, otherwise falls back to
 * the encrypted google_central OAuth token saved by an admin connection.
 */
export async function getCentralCalendarAccessToken(): Promise<string | null> {
  const refreshToken = Deno.env.get("GOOGLE_CENTRAL_REFRESH_TOKEN");
  if (refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);
      return refreshed.access_token;
    } catch {
      return null;
    }
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const adminClient = createClient(
    requireEnv("SUPABASE_URL", SUPABASE_URL),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: tokenRow } = await adminClient
    .from("consulting_oauth_tokens")
    .select("id, access_token, refresh_token, expires_at")
    .eq("provider", "google_central")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tokenRow) return null;

  try {
    let accessToken = await decryptToken(tokenRow.access_token);
    const expiresAt = tokenRow.expires_at ? Date.parse(tokenRow.expires_at) : 0;
    if (expiresAt && Date.now() >= expiresAt - 60_000 && tokenRow.refresh_token) {
      const refreshTok = await decryptToken(tokenRow.refresh_token);
      const refreshed = await refreshAccessToken(refreshTok);
      const encrypted = await encryptToken(refreshed.access_token);
      await adminClient
        .from("consulting_oauth_tokens")
        .update({ access_token: encrypted, expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString() })
        .eq("id", tokenRow.id);
      accessToken = refreshed.access_token;
    }
    return accessToken;
  } catch {
    return null;
  }
}

export const CENTRAL_CALENDAR_ID = Deno.env.get("GOOGLE_CENTRAL_CALENDAR_ID") || "primary";
export const CENTRAL_CALENDAR_EMAIL = Deno.env.get("GOOGLE_CENTRAL_CALENDAR_EMAIL") || "gestao@mxconsultoria.com.br";

export async function googleApiRequest(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`https://www.googleapis.com${path}`, { ...init, headers });
}

export type GoogleEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: { email: string; displayName?: string }[];
  reminders?: { useDefault?: boolean; overrides?: { method: string; minutes: number }[] };
};

export async function upsertGoogleEvent(
  accessToken: string,
  calendarId: string,
  payload: GoogleEventInput,
  existingEventId?: string | null,
): Promise<string> {
  const path = existingEventId
    ? `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingEventId)}`
    : `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const method = existingEventId ? "PATCH" : "POST";
  const res = await googleApiRequest(accessToken, path, { method, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Google API error (${res.status})`);
  }
  return data.id as string;
}

export async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const res = await googleApiRequest(accessToken, `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Failed to delete event (${res.status})`);
  }
}
