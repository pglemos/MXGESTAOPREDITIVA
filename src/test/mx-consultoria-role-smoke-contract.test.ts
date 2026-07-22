import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { canAccessPath } from '@/lib/auth/routeAccess'
import { REAL_DATA_ROUTES_BY_ROLE } from './e2e-helpers/real-data-role-routes'

const source = readFileSync('src/test/mx-consultoria-role-smoke.playwright.ts', 'utf8')

describe('smoke autenticado multi-role — contratos de limpeza', () => {
  test('fecha o contexto do perfil mesmo quando login ou validação falham', () => {
    expect(source).toMatch(/try\s*\{[\s\S]*?await login\([\s\S]*?finally\s*\{\s*await context\.close\(\)/)
  })

  test('registra cada identidade imediatamente após a criação', () => {
    expect(source).toMatch(/const trackCreatedUser\s*=\s*async/)
    expect(source).toMatch(/createdUsers\.push\(user\)/)
    expect(source).toMatch(/trackCreatedUser\(\(\)\s*=>\s*createE2EStoreUser/)
    expect(source).toMatch(/trackCreatedUser\(\(\)\s*=>\s*createE2EAdminUser/)
  })

  test('mantém listas distintas e autorizadas para os seis perfis', () => {
    expect(Object.keys(REAL_DATA_ROUTES_BY_ROLE).sort()).toEqual([
      'administrador_geral', 'administrador_mx', 'consultor_mx', 'dono', 'gerente', 'vendedor',
    ])
    for (const [role, routes] of Object.entries(REAL_DATA_ROUTES_BY_ROLE)) {
      expect(new Set(routes).size, `${role}: rotas duplicadas`).toBe(routes.length)
      expect(routes.length, `${role}: cobertura insuficiente`).toBeGreaterThan(25)
      for (const route of routes) expect(canAccessPath(route, role as keyof typeof REAL_DATA_ROUTES_BY_ROLE), `${role}: ${route}`).toBe(true)
    }
    expect(REAL_DATA_ROUTES_BY_ROLE.administrador_mx).toContain('/team')
    expect(REAL_DATA_ROUTES_BY_ROLE.consultor_mx).not.toContain('/team')
  })

  test('exige Supabase por rota, Loja MX real e isolamento de consultoria', () => {
    expect(source).toContain('successfulBusinessRequestsByRoute')
    expect(source).toMatch(/successfulBusinessRequestsByRoute\.get\(route\)[\s\S]*?toBeGreaterThan\(0\)/)
    expect(source).toContain("!request.url().includes('/realtime/v1/')")
    expect(source).toContain("name: 'MX CONSULTORIA'")
    expect(source).toContain('createE2EConsultingClient')
    expect(source).toContain('hiddenConsultingClientNames')
    expect(source).toContain('deleteE2EConsultingData(consultingClientIds)')
  })
})
