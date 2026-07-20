import { describe, expect, it } from 'vitest'
import { canAccessPath } from '@/lib/auth/routeAccess'

describe('owner Base44 nested route access', () => {
  it('allows only the owner profile to access nested owner workspace routes', () => {
    const path = '/lojas/mx-consultoria/plano-acao'

    expect(canAccessPath(path, 'dono')).toBe(true)
    expect(canAccessPath(path, 'gerente')).toBe(false)
    expect(canAccessPath(path, 'vendedor')).toBe(false)
  })
})
