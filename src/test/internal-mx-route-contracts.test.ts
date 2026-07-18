import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
const layoutSource = readFileSync(new URL('../components/Layout.tsx', import.meta.url), 'utf8')
const shellSource = readFileSync(new URL('../design-system/internal-mx/MxInternalShell.tsx', import.meta.url), 'utf8')

const routes = [
  '/painel', '/lojas', '/agenda', '/consultoria', '/produtos', '/notificacoes',
  '/relatorio-matinal', '/relatorios/performance-vendas', '/relatorios/performance-vendedor',
  '/auditoria', '/configuracoes', '/configuracoes/operacional',
  '/configuracoes/consultoria-pmr', '/configuracoes/reprocessamento',
]

describe('contrato do módulo interno MX', () => {
  test('preserva a árvore de rotas existente', () => {
    for (const route of routes) {
      const fragment = route.replace(/^\//, '')
      expect(appSource).toContain(`path="${fragment}`)
    }
  })

  test('seleciona o shell único somente para perfis internos', () => {
    expect(layoutSource).toContain('isPerfilInternoMx(role)')
    expect(layoutSource).toContain('<MxInternalShell')
    expect(shellSource).not.toContain("@/lib/supabase")
  })
})
