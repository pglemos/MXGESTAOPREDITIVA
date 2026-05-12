const DEFAULT_ADMIN_MASTER_EMAILS = [
  'gestao@mxconsultoria.com.br',
  'joseroberto20161@gmail.com',
  'marianedcs@gmail.com',
  'gedson.freire.localiza@gmail.com',
  'synvollt@gmail.com',
  'camarajoaoaugusto@gmail.com',
]

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

  return Array.from(new Set([...DEFAULT_ADMIN_MASTER_EMAILS, ...configured]))
}

export function isAdminMasterMxProfile(
  profile: AdminMasterProfile | null | undefined,
  rawEmails?: string | null,
): boolean {
  if (!profile || profile.role !== 'administrador_geral') return false

  const email = profile.email?.trim().toLowerCase()
  if (email && parseAdminMasterEmails(rawEmails).includes(email)) return true

  return false
}
