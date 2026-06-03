import { describe, expect, it } from 'bun:test'
import { canAccessPath, getRouteAccessRule } from './routeAccess'

describe('route access matrix', () => {
  it('keeps admin-only modules closed to store roles', () => {
    for (const route of ['/painel', '/agenda', '/consultoria/clientes', '/configuracoes/operacional', '/configuracoes/reprocessamento']) {
      expect(canAccessPath(route, 'administrador_geral')).toBe(true)
      expect(canAccessPath(route, 'vendedor')).toBe(false)
      expect(canAccessPath(route, 'gerente')).toBe(false)
      expect(canAccessPath(route, 'dono')).toBe(false)
    }
  })

  it('keeps simulation routes restricted to internal MX profiles', () => {
    for (const role of ['administrador_mx', 'consultor_mx', 'administrador_geral'] as const) {
      expect(canAccessPath('/simulacao/vendedor', role)).toBe(true)
      expect(canAccessPath('/simulacao/gerente', role)).toBe(true)
      expect(canAccessPath('/simulacao/dono', role)).toBe(true)
    }
    for (const role of ['vendedor', 'gerente', 'dono'] as const) {
      expect(canAccessPath('/simulacao/vendedor', role)).toBe(false)
      expect(canAccessPath('/simulacao/gerente', role)).toBe(false)
      expect(canAccessPath('/simulacao/dono', role)).toBe(false)
    }
  })

  it('allows gerente to access a scoped store dashboard but not the store index', () => {
    expect(canAccessPath('/lojas/acertt', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas/acertt?tab=equipe', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas/acertt/consultor-ia', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas', 'gerente')).toBe(false)
  })

  it('allows leaders to manage remuneration while keeping sellers out', () => {
    expect(canAccessPath('/configuracoes/remuneracao', 'administrador_mx')).toBe(true)
    expect(canAccessPath('/configuracoes/remuneracao', 'dono')).toBe(true)
    expect(canAccessPath('/configuracoes/remuneracao', 'gerente')).toBe(true)
    expect(canAccessPath('/configuracoes/remuneracao', 'vendedor')).toBe(false)
    expect(getRouteAccessRule('/remuneracao')).toBeNull()
  })

  it('keeps the personal remuneration detail exclusive to sellers', () => {
    expect(canAccessPath('/minha-remuneracao', 'vendedor')).toBe(true)
    expect(canAccessPath('/minha-remuneracao', 'gerente')).toBe(false)
    expect(canAccessPath('/minha-remuneracao', 'dono')).toBe(false)
    expect(canAccessPath('/minha-remuneracao', 'administrador_mx')).toBe(false)
    expect(canAccessPath('/configuracoes/remuneracao', 'vendedor')).toBe(false)
  })

  it('keeps daily launch restricted to the vendedor operating flow while allowing /home as role entrypoint', () => {
    expect(canAccessPath('/home', 'vendedor')).toBe(true)
    expect(canAccessPath('/home', 'administrador_geral')).toBe(false)
    expect(canAccessPath('/home', 'gerente')).toBe(true)
    expect(canAccessPath('/home', 'dono')).toBe(true)
    expect(canAccessPath('/lojas/acertt/consultor-ia', 'vendedor')).toBe(true)
    expect(canAccessPath('/lojas/acertt/consultor-ia', 'dono')).toBe(true)
    expect(canAccessPath('/lojas/acertt/consultor-ia', 'administrador_mx')).toBe(true)
    expect(canAccessPath('/lancamento-diario', 'vendedor')).toBe(true)
    expect(canAccessPath('/historico', 'vendedor')).toBe(true)
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

  it('denies unknown authenticated routes by default', () => {
    expect(getRouteAccessRule('/rota-inexistente')).toBeNull()
    expect(canAccessPath('/rota-inexistente', 'vendedor')).toBe(false)
  })

  it('gates configurations and PDI print by capability-level role groups', () => {
    expect(canAccessPath('/configuracoes', 'administrador_mx')).toBe(true)
    expect(canAccessPath('/configuracoes', 'dono')).toBe(true)
    expect(canAccessPath('/configuracoes', 'gerente')).toBe(true)
    expect(canAccessPath('/configuracoes', 'vendedor')).toBe(false)
    expect(canAccessPath('/settings', 'dono')).toBe(true)
    expect(canAccessPath('/settings', 'vendedor')).toBe(false)
    expect(canAccessPath('/produtos', 'gerente')).toBe(true)
    expect(canAccessPath('/produtos', 'vendedor')).toBe(false)
    expect(canAccessPath('/pdi/abc/print', 'gerente')).toBe(true)
    expect(canAccessPath('/pdi/abc/print', 'vendedor')).toBe(false)
  })

  it('keeps the legacy team alias capability scoped', () => {
    expect(canAccessPath('/team', 'administrador_mx')).toBe(true)
    expect(canAccessPath('/team', 'dono')).toBe(false)
    expect(canAccessPath('/team', 'gerente')).toBe(true)
    expect(canAccessPath('/team', 'vendedor')).toBe(false)
  })

  it('stores capability metadata on sensitive route rules', () => {
    expect(getRouteAccessRule('/simulacao/vendedor')?.capability).toBe('simulate_role')
    expect(getRouteAccessRule('/produtos')?.capability).toBe('view_products')
    expect(getRouteAccessRule('/configuracoes')?.capability).toBe('view_configurations')
    expect(getRouteAccessRule('/pdi/abc/print')?.capability).toBe('print_pdi')
  })
})
