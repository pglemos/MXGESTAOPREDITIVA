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

  it('allows gerente to access a scoped store dashboard but not the store index', () => {
    expect(canAccessPath('/lojas/acertt', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas/acertt?tab=equipe', 'gerente')).toBe(true)
    expect(canAccessPath('/lojas', 'gerente')).toBe(false)
  })

  it('allows vendedor only on vendedor-safe operational modules', () => {
    expect(canAccessPath('/home', 'vendedor')).toBe(true)
    expect(canAccessPath('/lancamento-diario', 'vendedor')).toBe(true)
    expect(canAccessPath('/historico', 'vendedor')).toBe(true)
    expect(canAccessPath('/lancamento-diario', 'administrador_mx')).toBe(true)
    expect(canAccessPath('/relatorio-matinal', 'vendedor')).toBe(false)
    expect(canAccessPath('/relatorios/performance-vendedor?id=abc', 'vendedor')).toBe(false)
  })

  it('keeps unknown routes available for the NotFound route after authentication', () => {
    expect(getRouteAccessRule('/rota-inexistente')).toBeNull()
    expect(canAccessPath('/rota-inexistente', 'vendedor')).toBe(true)
  })
})
