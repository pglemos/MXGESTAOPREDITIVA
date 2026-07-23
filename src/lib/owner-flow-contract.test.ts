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
    expect(topbar).toContain('As notificações persistidas aparecem na Central de Decisões.')
    expect(dashboard).toContain('window.addEventListener(\'owner:reload\', onOwnerReload)')
    expect(dashboard).toContain('void handleRefresh()')
  })

  test('cockpit não esconde erro de fonte nem deixa o período só no texto', () => {
    const livePage = read('src/features/owner-base44/OwnerLiveDataPage.tsx')
    const dashboard = read('src/features/dashboard-loja/hooks/useDashboardLojaData.ts')
    expect(livePage).toContain('data.error')
    expect(dashboard).toContain('periodRange?.start')
    expect(dashboard).toContain('periodRange?.end')
    expect(dashboard).toContain('periodLabel')
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
})
