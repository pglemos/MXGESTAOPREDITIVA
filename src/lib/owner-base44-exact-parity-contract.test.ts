import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const referenceFiles = [
  'src/components/owner/OwnerLayout.jsx',
  'src/components/owner/OwnerSidebar.jsx',
  'src/components/owner/OwnerTopbar.jsx',
  'src/components/owner/OwnerContext.tsx',
  'src/components/owner/OwnerConsultantModal.jsx',
  'src/pages/owner/OwnerHome.jsx',
  'src/pages/owner/PlanoEstrategico.jsx',
  'src/pages/owner/PlanoDeAcao.jsx',
  'src/pages/owner/Consultoria.jsx',
  'src/pages/owner/OwnerSurfaces.jsx',
  'src/features/owner-base44/OwnerBase44Route.tsx',
  'src/styles/owner-base44-exact.css',
] as const

describe('owner Base44 exact parity contract', () => {
  it('ships the real owner shell and all Base44 owner pages', () => {
    for (const file of referenceFiles) {
      expect(existsSync(resolve(root, file)), `${file} must exist`).toBe(true)
    }
  })

  it('routes the owner store workspace through the dedicated Base44 module', () => {
    const app = read('src/App.tsx')
    expect(app).toContain("const OwnerBase44Route = lazy(() => import('@/features/owner-base44/OwnerBase44Route'))")
    expect(app).toContain('dono={<OwnerBase44Route />}')
    expect(app).toContain('path="lojas/:storeSlug/*"')
  })

  it('does not wrap the exact owner module with the universal MX sidebar', () => {
    const layout = read('src/components/Layout.tsx')
    expect(layout).toContain('isExactOwnerWorkspace')
    expect(layout).toContain("role === 'dono'")
    expect(layout).toContain("location.pathname.startsWith('/lojas/')")
    expect(layout).toContain('if (isExactOwnerWorkspace) return <Outlet />')
  })

  it('preserves the Base44 navigation and page anatomy instead of the generic cockpit', () => {
    const route = read('src/features/owner-base44/OwnerBase44Route.tsx')
    for (const segment of [
      'rotina',
      'decisoes',
      'plano-estrategico',
      'plano-acao',
      'consultoria',
      'departamentos',
      'mercado',
      'universidade',
    ]) {
      expect(route).toContain(segment)
    }

    const sidebar = read('src/components/owner/OwnerSidebar.jsx')
    for (const label of [
      'Início',
      'Rotina do Dia',
      'Central de Decisões',
      'Plano Estratégico',
      'Plano de Ação',
      'Consultoria',
      'Departamentos',
      'Mercado',
      'Universidade MX',
      'Falar com Consultor',
      'Em construção',
    ]) {
      expect(sidebar).toContain(label)
    }

    expect(sidebar).toContain('owner-base44-exact__nav-toggle')
    expect(sidebar).toContain('owner-base44-exact__consultant-button')

    expect(route).not.toContain('OwnerExecutiveCockpit')
  })

  it('scopes the exact Base44 visual tokens to the owner workspace', () => {
    const css = read('src/styles/owner-base44-exact.css')
    expect(css).toContain('.owner-base44-exact')
    expect(css).toContain('--primary: 174 100% 33%')
    expect(css).toContain('--radius: 0.625rem')
    expect(css).toContain('--sidebar-background: 0 0% 100%')
  })
})
