import {
  normalizeEmail,
  type GoogleCalendarLikeEvent,
} from "./google_calendar_privacy.ts";

export type SourceKind = "visit" | "schedule_event";

export type CalendarSyncSource = {
  id: string;
  status?: string | null;
};

export type UserMirrorCandidate = {
  userId: string;
  name?: string | null;
  googleEmail?: string | null;
  profileEmail?: string | null;
  role?: string | null;
};

export type ExistingMirrorRow = {
  user_id: string;
  google_event_id?: string | null;
};

export type GoogleCalendarAttendee = {
  email: string;
  displayName?: string;
};

export function isCanceledCalendarStatus(sourceKind: SourceKind, status?: string | null): boolean {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) return false;
  if (sourceKind === "visit") return ["cancelada", "cancelado", "canceled", "cancelled"].includes(normalized);
  return ["cancelado", "cancelada", "canceled", "cancelled"].includes(normalized);
}

export function getEffectiveCalendarAction(
  action: "upsert" | "delete",
  sourceKind: SourceKind,
  status?: string | null,
): "upsert" | "delete" {
  if (action === "delete") return "delete";
  return isCanceledCalendarStatus(sourceKind, status) ? "delete" : "upsert";
}

export function uniqueMirrorCandidates(candidates: UserMirrorCandidate[]): UserMirrorCandidate[] {
  const seenUsers = new Set<string>();
  const seenGoogleEmails = new Set<string>();
  const unique: UserMirrorCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.userId || seenUsers.has(candidate.userId)) continue;
    const googleEmail = normalizeEmail(candidate.googleEmail);
    if (googleEmail && seenGoogleEmails.has(googleEmail)) continue;
    seenUsers.add(candidate.userId);
    if (googleEmail) seenGoogleEmails.add(googleEmail);
    unique.push(candidate);
  }

  return unique;
}

export function filterPersonalMirrorCandidates(
  candidates: UserMirrorCandidate[],
  rawAdminMasterEmails?: string | null,
): UserMirrorCandidate[] {
  void rawAdminMasterEmails;
  return uniqueMirrorCandidates(candidates);
}

export function filterCentralAttendeesForPersonalMirrors(
  attendees: GoogleCalendarAttendee[],
  mirrorCandidates: UserMirrorCandidate[],
): GoogleCalendarAttendee[] {
  const mirroredEmails = new Set<string>();
  for (const candidate of mirrorCandidates) {
    const profileEmail = normalizeEmail(candidate.profileEmail);
    const googleEmail = normalizeEmail(candidate.googleEmail);
    if (profileEmail) mirroredEmails.add(profileEmail);
    if (googleEmail) mirroredEmails.add(googleEmail);
  }

  return attendees.filter((attendee) => {
    const email = normalizeEmail(attendee.email);
    return Boolean(email && !mirroredEmails.has(email));
  });
}

export function shouldInviteScheduleEventCreator(eventType?: string | null): boolean {
  return eventType !== "bloqueio";
}

export function getStaleMirrorRows(
  existingRows: ExistingMirrorRow[],
  desiredUserIds: string[],
): ExistingMirrorRow[] {
  const desired = new Set(desiredUserIds);
  return existingRows.filter((row) => row.user_id && !desired.has(row.user_id));
}

export function getGoogleCalendarSourceKey(event: GoogleCalendarLikeEvent): string | null {
  const privateProps = event.extendedProperties?.private ?? {};
  const sharedProps = event.extendedProperties?.shared ?? {};
  const sourceKind = privateProps.mx_source_kind ?? sharedProps.mx_source_kind ?? null;
  const sourceId = privateProps.mx_source_id ?? sharedProps.mx_source_id ?? null;
  if (!sourceKind || !sourceId) return null;
  return `${sourceKind}:${sourceId}`;
}

export function selectCanonicalGoogleEventId(events: GoogleCalendarLikeEvent[], preferredIds: Set<string>): string | null {
  for (const event of events) {
    if (event.id && preferredIds.has(event.id)) return event.id;
  }
  for (const event of events) {
    if (event.iCalUID && preferredIds.has(event.iCalUID)) return event.id ?? event.iCalUID;
  }
  return events[0]?.id ?? events[0]?.iCalUID ?? null;
}

export function getDuplicateGoogleEventIds(events: GoogleCalendarLikeEvent[], preferredIds: Set<string>): string[] {
  if (events.length <= 1) return [];
  const canonical = selectCanonicalGoogleEventId(events, preferredIds);
  return events
    .map((event) => event.id ?? null)
    .filter((id): id is string => Boolean(id && id !== canonical));
}

export function mergeGoogleCalendarEventsBySource<T extends GoogleCalendarLikeEvent>(
  personalEvents: T[],
  centralEvents: T[],
): Array<T & { _source: "personal" | "central" }> {
  const personalSourceKeys = new Set<string>();
  const merged: Array<T & { _source: "personal" | "central" }> = [];

  for (const event of personalEvents) {
    const sourceKey = getGoogleCalendarSourceKey(event);
    if (sourceKey) personalSourceKeys.add(sourceKey);
    merged.push({ ...event, _source: "personal" });
  }

  for (const event of centralEvents) {
    const sourceKey = getGoogleCalendarSourceKey(event);
    if (sourceKey && personalSourceKeys.has(sourceKey)) continue;
    merged.push({ ...event, _source: "central" });
  }

  return merged;
}
