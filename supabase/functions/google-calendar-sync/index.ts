// Sync MX agenda records → Google Calendar (personal + central MX)
// POST { action: 'upsert' | 'delete', visit?: {...}, event?: {...} }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { requireEnv, encryptToken, decryptToken } from "../_shared/crypto.ts";
import {
  createSessionClient,
  refreshAccessToken,
  upsertGoogleEvent,
  deleteGoogleEvent,
  getCentralCalendarAccessToken,
  CENTRAL_CALENDAR_ID,
  CENTRAL_CALENDAR_EMAIL,
  type GoogleEventInput,
} from "../_shared/google.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TIMEZONE = "America/Sao_Paulo";

type VisitInput = {
  id: string;
  client_id?: string | null;
  client_name?: string | null;
  client_address?: string | null;
  scheduled_at: string;
  duration_hours?: number | null;
  modality?: string | null;
  status?: string | null;
  objective?: string | null;
  visit_reason?: string | null;
  target_audience?: string | null;
  product_name?: string | null;
  consultant_email?: string | null;
  google_event_id?: string | null;
  google_event_id_central?: string | null;
};

type ScheduleEventInput = {
  id: string;
  event_type?: "aula" | "evento_online" | "evento_presencial" | "bloqueio" | string | null;
  title: string;
  topic?: string | null;
  starts_at: string;
  duration_hours?: number | null;
  modality?: string | null;
  location?: string | null;
  target_audience?: string | null;
  audience_goal?: number | null;
  responsible_name?: string | null;
  responsible_email?: string | null;
  ticket_price_text?: string | null;
  visit_reason?: string | null;
  product_name?: string | null;
  google_event_id?: string | null;
  status?: string | null;
};

function buildEventPayload(visit: VisitInput, ownerEmail?: string | null): GoogleEventInput {
  const start = new Date(visit.scheduled_at);
  const durationMs = Math.max(0.5, Number(visit.duration_hours ?? 3)) * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  const summary = `MX • Visita${visit.client_name ? ` — ${visit.client_name}` : ""}`;
  const lines = [
    visit.visit_reason ? `Motivo da visita: ${visit.visit_reason}` : null,
    visit.target_audience ? `Alvo: ${visit.target_audience}` : null,
    visit.product_name ? `Produto: ${visit.product_name}` : null,
    visit.objective ? `Objetivo: ${visit.objective}` : null,
    visit.modality ? `Modalidade: ${visit.modality}` : null,
    visit.status ? `Status: ${visit.status}` : null,
    `Origem: MX Performance (visit ${visit.id})`,
  ].filter(Boolean);
  return {
    summary,
    description: lines.join("\n"),
    location: visit.client_address ?? undefined,
    start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
    attendees: ownerEmail ? [{ email: ownerEmail }] : undefined,
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }, { method: "email", minutes: 60 }] },
  };
}

function getScheduleTypeLabel(type?: string | null) {
  switch (type) {
    case "aula":
      return "Aula";
    case "evento_online":
      return "Evento online";
    case "evento_presencial":
      return "Evento presencial";
    case "bloqueio":
      return "Bloqueio de agenda";
    default:
      return "Evento";
  }
}

function buildScheduleEventPayload(event: ScheduleEventInput): GoogleEventInput {
  const start = new Date(event.starts_at);
  const durationMs = Math.max(0.5, Number(event.duration_hours ?? 1)) * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);
  const lines = [
    event.topic ? `Tema: ${event.topic}` : null,
    event.visit_reason ? `Motivo: ${event.visit_reason}` : null,
    event.target_audience ? `Publico: ${event.target_audience}` : null,
    event.audience_goal ? `Meta de publico: ${event.audience_goal}` : null,
    event.product_name ? `Produto: ${event.product_name}` : null,
    event.responsible_name ? `Responsavel: ${event.responsible_name}` : null,
    event.modality ? `Modalidade: ${event.modality}` : null,
    event.ticket_price_text ? `Ingresso: ${event.ticket_price_text}` : null,
    event.status ? `Status: ${event.status}` : null,
    `Origem: MX Performance (schedule event ${event.id})`,
  ].filter(Boolean);

  return {
    summary: `MX • ${getScheduleTypeLabel(event.event_type)} — ${event.title}`,
    description: lines.join("\n"),
    location: event.location ?? undefined,
    start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
    attendees: event.responsible_email ? [{ email: event.responsible_email, displayName: event.responsible_name ?? undefined }] : undefined,
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }, { method: "email", minutes: 60 }] },
  };
}

async function getUserAccessToken(sessionClient: any, userId: string): Promise<{ token: string | null; tokenRowId?: string }> {
  const { data: tokenRow, error } = await sessionClient
    .from("tokens_oauth_consultoria")
    .select("id, access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();
  if (error) throw error;
  if (!tokenRow) return { token: null };

  const expiresAt = tokenRow.expires_at ? Date.parse(tokenRow.expires_at) : 0;
  let accessToken = await decryptToken(tokenRow.access_token);
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
  return { token: accessToken, tokenRowId: tokenRow.id };
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
    const authHeader = req.headers.get("Authorization");
    const serviceRoleBearer = `Bearer ${requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)}`;
    const adminSyncToken = Deno.env.get("GOOGLE_CALENDAR_SYNC_ADMIN_TOKEN");
    const adminSyncHeader = req.headers.get("x-google-calendar-sync-admin-token");
    const isServiceRoleCall = authHeader === serviceRoleBearer || (adminSyncToken ? adminSyncHeader === adminSyncToken : false);
    let sessionClient: any = null;
    let authUserId: string | null = null;

    if (!isServiceRoleCall) {
      sessionClient = createSessionClient(authHeader);
      const { data: authData, error: authError } = await sessionClient.auth.getUser();
      if (authError || !authData.user) {
        return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      authUserId = authData.user.id;
    }

    const body = await req.json();
    const action: "upsert" | "delete" = body?.action === "delete" ? "delete" : "upsert";
    const visit: VisitInput | null = body?.visit ?? null;
    const scheduleEvent: ScheduleEventInput | null = body?.event ?? body?.scheduleEvent ?? null;
    const syncKind = scheduleEvent ? "schedule_event" : "visit";

    if (syncKind === "visit" && (!visit?.id || !visit?.scheduled_at)) {
      return new Response(JSON.stringify({ error: "visit.id and visit.scheduled_at are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (syncKind === "schedule_event" && (!scheduleEvent?.id || !scheduleEvent?.starts_at || !scheduleEvent?.title)) {
      return new Response(JSON.stringify({ error: "event.id, event.title and event.starts_at are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(
      requireEnv("SUPABASE_URL", SUPABASE_URL),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY),
    );

    const { token: userToken } = syncKind === "visit" && sessionClient && authUserId
      ? await getUserAccessToken(sessionClient, authUserId)
      : { token: null };
    const centralToken = await getCentralCalendarAccessToken();

    let personalEventId = visit?.google_event_id ?? null;
    let centralEventId = syncKind === "schedule_event"
      ? scheduleEvent?.google_event_id ?? null
      : visit?.google_event_id_central ?? null;
    const errors: { calendar: "personal" | "central"; message: string }[] = [];

    if (action === "delete") {
      if (userToken && personalEventId) {
        try {
          await deleteGoogleEvent(userToken, "primary", personalEventId);
          personalEventId = null;
        } catch (e) {
          errors.push({ calendar: "personal", message: e instanceof Error ? e.message : "delete failed" });
        }
      }
      if (centralToken && centralEventId) {
        try {
          await deleteGoogleEvent(centralToken, CENTRAL_CALENDAR_ID, centralEventId);
          centralEventId = null;
        } catch (e) {
          errors.push({ calendar: "central", message: e instanceof Error ? e.message : "delete failed" });
        }
      } else if (!centralToken && centralEventId) {
        errors.push({ calendar: "central", message: "Agenda Central MX nao conectada" });
      }
    } else {
      if (syncKind === "visit" && visit && userToken) {
        try {
          const userPayload = buildEventPayload(visit, visit.consultant_email);
          personalEventId = await upsertGoogleEvent(userToken, "primary", userPayload, personalEventId);
        } catch (e) {
          errors.push({ calendar: "personal", message: e instanceof Error ? e.message : "upsert failed" });
        }
      }
      if (centralToken) {
        try {
          const centralPayload = scheduleEvent
            ? buildScheduleEventPayload(scheduleEvent)
            : buildEventPayload(visit!, CENTRAL_CALENDAR_EMAIL);
          centralEventId = await upsertGoogleEvent(centralToken, CENTRAL_CALENDAR_ID, centralPayload, centralEventId);
        } catch (e) {
          errors.push({ calendar: "central", message: e instanceof Error ? e.message : "upsert failed" });
        }
      } else {
        errors.push({ calendar: "central", message: "Agenda Central MX nao conectada" });
      }
    }

    const centralError = errors.find((item) => item.calendar === "central");
    if (syncKind === "schedule_event" && scheduleEvent) {
      const { error: eventUpdateError } = await adminClient
        .from("eventos_agenda_consultoria")
        .update({
          google_event_id: centralEventId,
          google_synced_at: centralError ? null : new Date().toISOString(),
          google_sync_error: centralError?.message ?? null,
        })
        .eq("id", scheduleEvent.id);
      if (eventUpdateError) {
        await adminClient
          .from("eventos_agenda_consultoria")
          .update({ google_event_id: centralEventId })
          .eq("id", scheduleEvent.id);
      }
    } else if (visit) {
      // Persist event IDs back into visitas_consultoria
      const { error: updateError } = await adminClient
        .from("visitas_consultoria")
        .update({
          google_event_id: personalEventId,
          google_event_id_central: centralEventId,
          google_synced_at: centralError ? null : new Date().toISOString(),
        })
        .eq("id", visit.id);
      if (updateError && updateError.code !== "PGRST204") {
        // Column google_event_id_central may not exist yet — fall back to legacy update
        await adminClient
          .from("visitas_consultoria")
          .update({ google_event_id: personalEventId })
          .eq("id", visit.id);
      }
    }

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        kind: syncKind,
        personalEventId,
        centralEventId,
        errors,
        userConnected: Boolean(userToken),
        centralConnected: Boolean(centralToken),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "sync failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
