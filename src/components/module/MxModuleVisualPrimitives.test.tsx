import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { Activity } from 'lucide-react'
import {
  MxEmptyState,
  MxField,
  MxLoadingState,
  MxMetricCard,
  MxModuleHeader,
  MxModulePage,
  MxSectionCard,
  MxStatusBanner,
  MxTableSurface,
  MxToolbar,
} from './MxModuleVisualPrimitives'

describe('MxModuleVisualPrimitives', () => {
  test('reproduz a anatomia canônica do módulo Gerente', () => {
    const html = renderToStaticMarkup(
      <MxModulePage>
        <MxModuleHeader title="Painel" description="Descrição operacional" />
        <MxToolbar aria-label="Filtros"><button type="button">Filtrar</button></MxToolbar>
        <MxMetricCard title="Vendas" value={10} detail="no período" icon={Activity} />
        <MxSectionCard>
          <MxField label="Loja" htmlFor="store"><input id="store" /></MxField>
          <MxTableSurface><table><tbody><tr><td>OK</td></tr></tbody></table></MxTableSurface>
        </MxSectionCard>
        <MxStatusBanner tone="warning">Atenção</MxStatusBanner>
        <MxEmptyState title="Sem dados" description="Nada encontrado" />
        <MxLoadingState label="Carregando painel" />
      </MxModulePage>,
    )

    expect(html).toContain('bg-surface-alt')
    expect(html).toContain('max-w-7xl')
    expect(html).toContain('rounded-mx-xl')
    expect(html).toContain('border-border-subtle')
    expect(html).toContain('<h1')
    expect(html).toContain('<table')
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('mxds-')
    expect(html).not.toContain('!important')
  })
})
