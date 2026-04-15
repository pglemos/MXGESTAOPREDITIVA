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
    requireEnv("SUPABASE_SESSION_KEY", SUPABASE_ANON_KEY ?? undefined),
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export async function assertClientAccess(sessionClient: any, clientId: string) {
  const { data, error } = await sessionClient
    .from("consulting_clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Client access denied");
}
