import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (file: string) => readFileSync(resolve(root, file), 'utf8')

describe('Dono — contratos dos fluxos corrigidos', () => {
  test('topbar publica refresh e dashboard escuta o mesmo evento', () => {
    const context = read('src/components/owner/OwnerContext.jsx')
    const topbar = read('src/components/owner/OwnerTopbar.jsx')
    const dashboard = read('src/features/dashboard-loja/hooks/useDashboardLojaData.ts')
    expect(context).toContain('new CustomEvent("owner:reload")')
    expect(topbar).toContain('aria-label="Atualizar dados"')
    expect(topbar).toContain('aria-label="Notificações"')
    expect(topbar).toContain("navigate('/dono/alertas')")
    expect(dashboard).toContain('window.addEventListener(\'owner:reload\', onOwnerReload)')
    expect(dashboard).toContain('void handleRefresh()')
    expect(dashboard).toContain('inventory.refetch()')
    expect(dashboard).toContain('consulting.refresh()')
    expect(dashboard).toContain('refetchDRE()')
  })

  test('cockpit não esconde erro de fonte nem deixa o período só no texto', () => {
    const livePage = read('src/features/owner-base44/OwnerLiveDataPage.tsx')
    const dashboard = read('src/features/dashboard-loja/hooks/useDashboardLojaData.ts')
    const goals = read('src/hooks/useGoals.ts')
    const dre = read('src/hooks/useDRE.ts')
    expect(livePage).toContain('data.error')
    expect(dashboard).toContain('periodRange?.start')
    expect(dashboard).toContain('periodRange?.end')
    expect(dashboard).toContain('periodLabel')
    expect(dashboard).toContain('storeGoalError')
    expect(dashboard).toContain('routineExecutionError')
    expect(goals).toContain("setError('Não foi possível carregar a meta da loja.')")
    expect(dre).toContain("setError('Não foi possível localizar o vínculo financeiro da loja.')")
  })

  test('gráfico executivo recebe dimensão inicial válida antes do ResizeObserver', () => {
    const widgets = read('src/features/dashboard-loja/sections/owner-cockpit/OwnerHomeWidgets.tsx')
    expect(widgets).toContain('initialDimension={{ width: 320, height: 250 }}')
  })

  test('previsão compara ritmo diário com necessidade diária', () => {
    const home = read('src/features/dashboard-loja/sections/owner-cockpit/OwnerHome.tsx')
    expect(home).toContain('const salesRunRate = data.metrics.totalSales / elapsedDays')
    expect(home).toContain('salesRunRate >= dailyNeed')
  })

  test('DRE não reaproveita registro fora do período selecionado', () => {
    const dashboard = read('src/features/dashboard-loja/hooks/useDashboardLojaData.ts')
    expect(dashboard).toContain('inRange.length > 0 ? computeDREFn(inRange[0]) : null')
  })

  test('datas personalizadas usam calendário local e preservam intervalo válido', () => {
    const context = read('src/components/owner/OwnerContext.jsx')
    expect(context).toContain('toOwnerDateOnly(new Date())')
    expect(context).not.toContain('new Date().toISOString().slice(0, 10)')
    expect(context).toContain('currentEnd && currentEnd < nextStart ? nextStart : currentEnd')
  })

  test('benchmarking oferece apenas os recortes realmente suportados pela RPC', () => {
    const view = read('src/features/dashboard-loja/sections/owner-cockpit/BenchmarkingView.tsx')
    expect(view).toContain('Grupo de comparação do benchmarking')
    expect(view).toContain("setPeerGroup(event.target.value as CentralMxBenchmarkPeerGroup)")
    expect(view).not.toContain("'Marca / Grupo'")
    expect(view).toContain('benchmarkError')
  })
})
