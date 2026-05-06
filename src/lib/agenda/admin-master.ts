const DEFAULT_ADMIN_MASTER_EMAILS = ['danieljsvendas@gmail.com']

export type AdminMasterProfile = {
  email?: string | null
  name?: string | null
  role?: string | null
}

export function parseAdminMasterEmails(rawEmails?: string | null): string[] {
  const configured = (rawEmails || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  return configured.length > 0 ? configured : DEFAULT_ADMIN_MASTER_EMAILS
}

export function isAdminMasterMxProfile(
  profile: AdminMasterProfile | null | undefined,
  rawEmails?: string | null,
): boolean {
  if (!profile || profile.role !== 'administrador_geral') return false

  const email = profile.email?.trim().toLowerCase()
  if (email && parseAdminMasterEmails(rawEmails).includes(email)) return true

  return (profile.name || '').trim().toLowerCase().startsWith('daniel')
}
