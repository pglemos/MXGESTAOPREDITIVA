export const DEFAULT_GOOGLE_MEET_COHOST_EMAILS = [
  "danieljsvendas@gmail.com",
  "joseroberto20161@gmail.com",
  "marianedcs@gmail.com",
  "camarajoaoaugusto@gmail.com",
];

export type GoogleMeetMember = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type GoogleMeetCohostActions = {
  createEmails: string[];
  replaceMembers: { name: string; email: string }[];
  configuredEmails: string[];
};

function normalizeEmail(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

export function getGoogleMeetCohostEmails(rawEmails?: string | null): string[] {
  const values = rawEmails?.trim() ? rawEmails.split(",") : DEFAULT_GOOGLE_MEET_COHOST_EMAILS;
  return [...new Set(values.map(normalizeEmail).filter((email): email is string => Boolean(email)))];
}

export function getGoogleMeetSpaceName(meetLink?: string | null): string | null {
  if (!meetLink) return null;
  try {
    const url = new URL(meetLink);
    if (url.hostname !== "meet.google.com") return null;
    const meetingCode = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    if (!meetingCode || !/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingCode)) return null;
    return `spaces/${meetingCode}`;
  } catch {
    return null;
  }
}

export function getGoogleMeetCohostActions(
  existingMembers: GoogleMeetMember[],
  desiredEmails: string[],
): GoogleMeetCohostActions {
  const existingByEmail = new Map<string, GoogleMeetMember>();
  for (const member of existingMembers) {
    const email = normalizeEmail(member.email);
    if (email && !existingByEmail.has(email)) existingByEmail.set(email, member);
  }

  const createEmails: string[] = [];
  const replaceMembers: { name: string; email: string }[] = [];
  const configuredEmails: string[] = [];

  for (const email of getGoogleMeetCohostEmails(desiredEmails.join(","))) {
    const member = existingByEmail.get(email);
    if (!member) {
      createEmails.push(email);
    } else if (member.role === "COHOST") {
      configuredEmails.push(email);
    } else if (member.name) {
      replaceMembers.push({ name: member.name, email });
    } else {
      createEmails.push(email);
    }
  }

  return { createEmails, replaceMembers, configuredEmails };
}
