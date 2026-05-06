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
  CENTRAL_CALENDAR_EMAIL,
} from "../_shared/google.ts";
import {
  centralEventMatchesUser,
  collectUserCalendarEmails,
  isAdminMasterMx,
} from "../_shared/google_calendar_privacy.ts";

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

async function fetchAllowedCentralEventIds(sessionClient: any): Promise<Set<string>> {
  const allowedIds = new Set<string>();

  const { data: visits } = await sessionClient
    .from("visitas_consultoria")
    .select("google_event_id_central")
    .not("google_event_id_central", "is", null);
  for (const visit of visits || []) {
    if (visit.google_event_id_central) allowedIds.add(visit.google_event_id_central);
  }

  const { data: scheduleEvents } = await sessionClient
    .from("eventos_agenda_consultoria")
    .select("google_event_id")
    .not("google_event_id", "is", null);
  for (const event of scheduleEvents || []) {
    if (event.google_event_id) allowedIds.add(event.google_event_id);
  }

  return allowedIds;
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
    const wantsCentral = body?.includeCentral !== false;

    const { data: userProfile } = await sessionClient
      .from("usuarios")
      .select("role, email, name")
      .eq("id", authData.user.id)
      .maybeSingle();
    const canReadAllCentral = isAdminMasterMx(userProfile, Deno.env.get("GOOGLE_CALENDAR_ADMIN_MASTER_EMAILS"));

    // Personal token
    let personalEvents: any[] = [];
    let personalConnected = false;
    let personalError: string | null = null;
    const { data: tokenRow } = await sessionClient
      .from("tokens_oauth_consultoria")
      .select("id, access_token, refresh_token, expires_at, google_email")
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
    if (wantsCentral && centralToken) {
      centralConnected = true;
      try {
        const fetchedCentralEvents = await fetchEvents(centralToken, CENTRAL_CALENDAR_ID, timeMin, timeMax, maxResults);
        if (canReadAllCentral) {
          centralEvents = fetchedCentralEvents;
        } else {
          const allowedGoogleEventIds = await fetchAllowedCentralEventIds(sessionClient);
          const userEmails = collectUserCalendarEmails(userProfile, tokenRow?.google_email ?? null);
          centralEvents = fetchedCentralEvents.filter((event: any) => centralEventMatchesUser(event, {
            userId: authData.user.id,
            userEmails,
            allowedGoogleEventIds,
          }));
        }
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
        personalGoogleEmail: tokenRow?.google_email ?? null,
        centralGoogleEmail: centralConnected ? CENTRAL_CALENDAR_EMAIL : null,
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
