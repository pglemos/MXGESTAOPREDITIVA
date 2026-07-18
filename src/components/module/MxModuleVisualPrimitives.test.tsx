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
  test('reproduz a anatomia visual concreta do módulo Gerente', () => {
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

    expect(html).toContain('bg-gray-50')
    expect(html).toContain('max-w-7xl')
    expect(html).toContain('space-y-5')
    expect(html).toContain('px-4')
    expect(html).toContain('py-6')
    expect(html).toContain('rounded-2xl')
    expect(html).toContain('border-gray-100')
    expect(html).toContain('bg-white')
    expect(html).toContain('shadow-sm')
    expect(html).toContain('text-gray-800')
    expect(html).toContain('text-gray-500')
    expect(html).toContain('<h1')
    expect(html).toContain('<table')
    expect(html).toContain('aria-busy="true"')

    expect(html).not.toContain('bg-surface-alt')
    expect(html).not.toContain('rounded-mx-xl')
    expect(html).not.toContain('border-border-subtle')
    expect(html).not.toContain('mxds-')
    expect(html).not.toContain('!important')
  })
})
