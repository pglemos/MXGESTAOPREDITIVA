import { describe, expect, it } from 'bun:test'
import { isAdministradorMx, isPerfilInternoMx, normalizeRole } from './roles'

describe('role normalization', () => {
  it('maps legacy aliases to canonical roles', () => {
    expect(normalizeRole('admin_master')).toBe('administrador_geral')
    expect(normalizeRole('admin')).toBe('administrador_mx')
    expect(normalizeRole('consultor')).toBe('consultor_mx')
    expect(normalizeRole('owner')).toBe('dono')
    expect(normalizeRole('manager')).toBe('gerente')
    expect(normalizeRole('seller')).toBe('vendedor')
  })

  it('does not downgrade unknown roles to vendedor', () => {
    expect(normalizeRole('financeiro')).toBeNull()
    expect(normalizeRole('')).toBeNull()
    expect(normalizeRole(null)).toBeNull()
    expect(normalizeRole(undefined)).toBeNull()
  })

  it('classifies internal and admin roles from canonical or legacy values', () => {
    expect(isPerfilInternoMx('consultor')).toBe(true)
    expect(isPerfilInternoMx('vendedor')).toBe(false)
    expect(isAdministradorMx('admin_master')).toBe(true)
    expect(isAdministradorMx('consultor_mx')).toBe(false)
  })
})
