export const DEFAULT_ADMIN_MASTER_EMAILS = ["danieljsvendas@gmail.com"];

export type AgendaUserProfile = {
  role?: string | null;
  email?: string | null;
  name?: string | null;
};

export type GoogleCalendarLikeEvent = {
  id?: string | null;
  iCalUID?: string | null;
  attendees?: { email?: string | null }[] | null;
  organizer?: { email?: string | null } | null;
  creator?: { email?: string | null } | null;
  extendedProperties?: {
    private?: Record<string, string | null | undefined> | null;
    shared?: Record<string, string | null | undefined> | null;
  } | null;
};

export function normalizeEmail(email?: string | null): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : null;
}

export function parseAdminMasterEmails(rawEmails?: string | null): Set<string> {
  const configured = (rawEmails || "")
    .split(",")
    .map(normalizeEmail)
    .filter((email): email is string => Boolean(email));
  return new Set(configured.length > 0 ? configured : DEFAULT_ADMIN_MASTER_EMAILS);
}

export function isAdminMasterMx(
  profile?: AgendaUserProfile | null,
  rawEmails?: string | null,
): boolean {
  if (profile?.role !== "administrador_geral") return false;
  const email = normalizeEmail(profile.email);
  if (email && parseAdminMasterEmails(rawEmails).has(email)) return true;
  return (profile.name || "").trim().toLowerCase().startsWith("daniel");
}

export function collectUserCalendarEmails(
  profile?: AgendaUserProfile | null,
  googleEmail?: string | null,
): Set<string> {
  return new Set([normalizeEmail(profile?.email), normalizeEmail(googleEmail)].filter((email): email is string => Boolean(email)));
}

export function buildRelatedUserIds(ids: Array<string | null | undefined>): string {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id)))).join(",");
}

export function centralEventMatchesUser(
  event: GoogleCalendarLikeEvent,
  options: {
    userId: string;
    userEmails?: Set<string>;
    allowedGoogleEventIds?: Set<string>;
  },
): boolean {
  const allowedIds = options.allowedGoogleEventIds ?? new Set<string>();
  if ((event.id && allowedIds.has(event.id)) || (event.iCalUID && allowedIds.has(event.iCalUID))) return true;

  const privateProps = event.extendedProperties?.private ?? {};
  const sharedProps = event.extendedProperties?.shared ?? {};
  const relatedIds = `${privateProps.mx_related_user_ids || ""},${sharedProps.mx_related_user_ids || ""}`
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (relatedIds.includes(options.userId)) return true;

  const emails = options.userEmails ?? new Set<string>();
  if (emails.size === 0) return false;

  const eventEmails = [
    event.organizer?.email,
    event.creator?.email,
    ...(event.attendees || []).map((attendee) => attendee.email),
  ].map(normalizeEmail).filter((email): email is string => Boolean(email));

  return eventEmails.some((email) => emails.has(email));
}
