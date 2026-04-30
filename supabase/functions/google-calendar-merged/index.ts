// Returns merged events: user's personal calendar + central MX calendar
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { decryptToken, encryptToken } from "../_shared/crypto.ts";
import {
  createSessionClient,
  refreshAccessToken,
  googleApiRequest,
  getCentralCalendarAccessToken,
  CENTRAL_CALENDAR_ID,
} from "../_shared/google.ts";

async function fetchEvents(accessToken: string, calendarId: string, timeMin: string, timeMax: string, maxResults = 50) {
  const res = await googleApiRequest(
    accessToken,
    `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Calendar fetch failed (${res.status})`);
  }
  const data = await res.json();
  return data.items || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sessionClient = createSessionClient(req.headers.get("Authorization"));
    const { data: authData, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const timeMin = body?.timeMin ?? new Date().toISOString();
    const timeMax = body?.timeMax ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = Math.min(250, Math.max(1, Number(body?.maxResults ?? 50)));

    // Personal token
    let personalEvents: any[] = [];
    let personalConnected = false;
    let personalError: string | null = null;
    const { data: tokenRow } = await sessionClient
      .from("tokens_oauth_consultoria")
      .select("id, access_token, refresh_token, expires_at")
      .eq("user_id", authData.user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (tokenRow) {
      personalConnected = true;
      try {
        let accessToken = await decryptToken(tokenRow.access_token);
        const expiresAt = tokenRow.expires_at ? Date.parse(tokenRow.expires_at) : 0;
        if (expiresAt && Date.now() >= expiresAt - 60_000 && tokenRow.refresh_token) {
          const refreshTok = await decryptToken(tokenRow.refresh_token);
          const refreshed = await refreshAccessToken(refreshTok);
          const encrypted = await encryptToken(refreshed.access_token);
          await sessionClient
            .from("tokens_oauth_consultoria")
            .update({ access_token: encrypted, expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString() })
            .eq("id", tokenRow.id);
          accessToken = refreshed.access_token;
        }
        personalEvents = await fetchEvents(accessToken, "primary", timeMin, timeMax, maxResults);
      } catch (e) {
        personalError = e instanceof Error ? e.message : "personal fetch failed";
      }
    }

    // Central token
    let centralEvents: any[] = [];
    let centralConnected = false;
    let centralError: string | null = null;
    const centralToken = await getCentralCalendarAccessToken();
    if (centralToken) {
      centralConnected = true;
      try {
        centralEvents = await fetchEvents(centralToken, CENTRAL_CALENDAR_ID, timeMin, timeMax, maxResults);
      } catch (e) {
        centralError = e instanceof Error ? e.message : "central fetch failed";
      }
    }

    const merged = [
      ...personalEvents.map((e: any) => ({ ...e, _source: "personal" as const })),
      ...centralEvents.map((e: any) => ({ ...e, _source: "central" as const })),
    ].sort((a, b) => {
      const da = Date.parse(a.start?.dateTime || a.start?.date || "");
      const db = Date.parse(b.start?.dateTime || b.start?.date || "");
      return da - db;
    });

    return new Response(
      JSON.stringify({
        events: merged,
        personalConnected,
        centralConnected,
        personalError,
        centralError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "merge failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
