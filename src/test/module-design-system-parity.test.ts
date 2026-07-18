import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const layout = read('../components/Layout.tsx')
const main = read('../main.tsx')
const legacyFiles = [
  '../design-system/internal-mx/InternalMxPageFrame.tsx',
  '../design-system/internal-mx/internal-mx-frame.css',
  '../design-system/internal-mx/internal-mx-components.css',
  '../design-system/internal-mx/internal-mx-routes.css',
]

const targetEntryPoints = [
  '../pages/PainelConsultor.tsx',
  '../pages/Lojas.tsx',
  '../pages/AgendaAdmin.tsx',
  '../pages/Consultoria.tsx',
  '../pages/ConsultoriaClientes.tsx',
  '../pages/ConsultoriaClienteDetalhe.tsx',
  '../pages/ConsultoriaVisitaExecucao.tsx',
  '../pages/ProdutosDigitais.tsx',
  '../pages/ConsultorTreinamentos.tsx',
  '../pages/Configuracoes.tsx',
  '../pages/OperationalSettings.tsx',
  '../pages/ConsultoriaParametros.tsx',
  '../pages/Reprocessamento.tsx',
  '../pages/AiDiagnostics.tsx',
  '../pages/MorningReport.tsx',
  '../pages/SalesPerformance.tsx',
  '../pages/SellerPerformance.tsx',
  '../pages/Simulacao.tsx',
  '../features/dono/FalarConsultorDono.tsx',
  '../features/organograma/OrganogramaPage.tsx',
  '../features/comportamental/ComportamentalPage.tsx',
]

describe('paridade visual dos módulos MX com o Gerente', () => {
  test('não mantém adaptadores visuais legados no runtime', () => {
    expect(layout).not.toContain('InternalMxPageFrame')
    expect(layout).not.toContain('mx-internal-workspace')
    expect(main).not.toContain('internal-mx-frame.css')
    expect(main).not.toContain('internal-mx-components.css')
    expect(main).not.toContain('internal-mx-routes.css')
    expect(main).not.toContain("../packages/mx-tokens/src/theme.css")
    for (const file of legacyFiles) {
      expect(existsSync(new URL(file, import.meta.url))).toBe(false)
    }
  })

  test('todas as entradas exclusivas de Admin, Consultoria e Dono usam a fundação canônica', () => {
    for (const path of targetEntryPoints) {
      const source = read(path)
      expect(source).toMatch(/MxModulePage|MxModuleSection|@deprecated|export \{.*default.*\}/s)
      expect(source).not.toContain('mxds-')
      expect(source).not.toContain('mx-internal-workspace')
    }
  })
})
