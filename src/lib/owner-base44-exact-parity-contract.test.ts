import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

// Módulo do Dono portado 1:1 do export Base44 (paths /dono/*).
const referenceFiles = [
  'src/components/owner/OwnerLayout.jsx',
  'src/components/owner/OwnerSidebar.jsx',
  'src/components/owner/OwnerTopbar.jsx',
  'src/components/owner/OwnerContext.jsx',
  'src/components/owner/ConsultantRequestModal.jsx',
  'src/pages/owner/OwnerHome.jsx',
  'src/pages/owner/PlanoEstrategico.jsx',
  'src/pages/owner/PlanoDeAcao.jsx',
  'src/pages/owner/Consultoria.jsx',
  'src/pages/owner/Placeholders.jsx',
  'src/features/owner-base44/OwnerModule.tsx',
  'src/styles/owner-base44-exact.css',
] as const

describe('owner Base44 exact parity contract', () => {
  it('ships the real owner shell and all Base44 owner pages', () => {
    for (const file of referenceFiles) {
      expect(existsSync(resolve(root, file)), `${file} must exist`).toBe(true)
    }
  })

  it('mounts the dedicated Base44 owner module at /dono', () => {
    const app = read('src/App.tsx')
    expect(app).toContain("const OwnerModule = lazy(() => import('@/features/owner-base44/OwnerModule'))")
    expect(app).toContain('path="/dono/*"')
    expect(app).toContain('<OwnerModule />')
  })

  it('routes every Base44 owner surface through the module', () => {
    const route = read('src/features/owner-base44/OwnerModule.tsx')
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
    expect(route).toContain('OwnerLayout')
    expect(route).not.toContain('OwnerExecutiveCockpit')
  })

  it('preserves the Base44 navigation anatomy', () => {
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
  })
})
