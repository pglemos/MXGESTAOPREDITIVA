import type { UserRole } from '@/types/database'

export const USER_ROLES = [
  'administrador_geral',
  'administrador_mx',
  'consultor_mx',
  'dono',
  'gerente',
  'vendedor',
] as const satisfies readonly UserRole[]

const ROLE_ALIASES: Record<string, UserRole> = {
  administrador_geral: 'administrador_geral',
  admin_master: 'administrador_geral',
  administrador_mx: 'administrador_mx',
  admin: 'administrador_mx',
  consultor_mx: 'consultor_mx',
  consultor: 'consultor_mx',
  dono: 'dono',
  owner: 'dono',
  gerente: 'gerente',
  manager: 'gerente',
  vendedor: 'vendedor',
  seller: 'vendedor',
}

export function normalizeRole(rawRole: string | null | undefined): UserRole | null {
  const role = (rawRole || '').toLowerCase().trim()
  return ROLE_ALIASES[role] || null
}

export function isUserRole(rawRole: string | null | undefined): rawRole is UserRole {
  return normalizeRole(rawRole) === rawRole
}

export function isPerfilInternoMx(role: UserRole | string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'administrador_geral' || normalized === 'administrador_mx' || normalized === 'consultor_mx'
}

export function isAdministradorMx(role: UserRole | string | null | undefined): boolean {
  const normalized = normalizeRole(role)
  return normalized === 'administrador_geral' || normalized === 'administrador_mx'
}
