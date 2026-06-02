import {
  isAdminMasterMx,
  normalizeEmail,
  type AgendaUserProfile,
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
  return uniqueMirrorCandidates(candidates).filter((candidate) => {
    if (candidate.role === "administrador_geral" || candidate.role === "administrador_mx") return false;

    const profileBySystemEmail: AgendaUserProfile = {
      role: candidate.role ?? null,
      email: candidate.profileEmail ?? null,
      name: candidate.name ?? null,
    };
    const profileByGoogleEmail: AgendaUserProfile = {
      role: candidate.role ?? null,
      email: candidate.googleEmail ?? null,
      name: candidate.name ?? null,
    };
    return !isAdminMasterMx(profileBySystemEmail, rawAdminMasterEmails) && !isAdminMasterMx(profileByGoogleEmail, rawAdminMasterEmails);
  });
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
