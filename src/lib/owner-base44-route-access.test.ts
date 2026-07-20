import { describe, expect, it } from 'vitest'
import { canAccessPath } from '@/lib/auth/routeAccess'

describe('owner Base44 nested route access', () => {
  it('allows only the owner profile to access nested owner workspace routes', () => {
    const path = '/lojas/mx-consultoria/plano-acao'

    expect(canAccessPath(path, 'dono')).toBe(true)
    expect(canAccessPath(path, 'gerente')).toBe(false)
    expect(canAccessPath(path, 'vendedor')).toBe(false)
  })

  it('preserves the canonical store dashboard access for leaders', () => {
    const path = '/lojas/mx-consultoria'

    expect(canAccessPath(path, 'dono')).toBe(true)
    expect(canAccessPath(path, 'gerente')).toBe(true)
    expect(canAccessPath(path, 'administrador_mx')).toBe(true)
  })

  it('preserves the dedicated store consultant route for existing profiles', () => {
    const path = '/lojas/mx-consultoria/consultor-ia'

    expect(canAccessPath(path, 'vendedor')).toBe(true)
    expect(canAccessPath(path, 'gerente')).toBe(true)
    expect(canAccessPath(path, 'dono')).toBe(true)
    expect(canAccessPath(path, 'administrador_mx')).toBe(true)
  })
})
