import { describe, expect, it } from 'bun:test'
import { canAccessPath, getRouteAccessRule } from './routeAccess'

describe('route access matrix', () => {
  it('keeps admin-only modules closed to store roles', () => {
    for (const route of ['/painel', '/agenda', '/consultoria/clientes', '/configuracoes/reprocessamento']) {
      expect(canAccessPath(route, 'administrador_geral')).toBe(true)
      expect(canAccessPath(route, 'vendedor')).toBe(false)
      expect(canAccessPath(route, 'gerente')).toBe(false)
      expect(canAccessPath(route, 'dono')).toBe(false)
    }
  })

  it('keeps simulation routes routable after a role switch is activated', () => {
    for (const role of ['administrador_mx', 'vendedor', 'gerente', 'dono'] as const) {
      expect(canAccessPath('/simulacao/vendedor', role)).toBe(true)
      expect(canAccessPath('/simulacao/gerente', role)).toBe(true)
      expect(canAccessPath('/simulacao/dono', role)).toBe(true)
    }
  })

  it('allows gerente to access a scoped store dashboard but not the store index', () => {
    expect(canAccessPath('/lojas/acertt', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas/acertt?tab=equipe', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas', 'gerente')).toBe(false)
  })

  it('keeps daily launch restricted to the vendedor operating flow', () => {
    expect(canAccessPath('/home', 'vendedor')).toBe(true)
    expect(canAccessPath('/lancamento-diario', 'vendedor')).toBe(true)
    expect(canAccessPath('/historico', 'vendedor')).toBe(true)
    expect(canAccessPath('/home', 'gerente')).toBe(false)
    expect(canAccessPath('/historico', 'gerente')).toBe(false)
    expect(canAccessPath('/lancamento-diario', 'gerente')).toBe(false)
    expect(canAccessPath('/historico', 'dono')).toBe(false)
    expect(canAccessPath('/lancamento-diario', 'dono')).toBe(false)
    expect(canAccessPath('/historico', 'administrador_mx')).toBe(false)
    expect(canAccessPath('/lancamento-diario', 'administrador_mx')).toBe(false)
    expect(canAccessPath('/relatorio-matinal', 'vendedor')).toBe(false)
    expect(canAccessPath('/relatorios/performance-vendedor?id=abc', 'vendedor')).toBe(false)
  })

  it('matches known role redirects for the audit diagnostics route', () => {
    expect(canAccessPath('/auditoria', 'administrador_mx')).toBe(true)
    expect(canAccessPath('/auditoria', 'consultor_mx')).toBe(true)
    expect(canAccessPath('/auditoria', 'gerente')).toBe(true)
    expect(canAccessPath('/auditoria', 'dono')).toBe(false)
    expect(canAccessPath('/auditoria', 'vendedor')).toBe(false)
  })

  it('keeps unknown routes available for the NotFound route after authentication', () => {
    expect(getRouteAccessRule('/rota-inexistente')).toBeNull()
    expect(canAccessPath('/rota-inexistente', 'vendedor')).toBe(true)
  })
})
