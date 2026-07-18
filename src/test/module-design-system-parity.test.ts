import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const srcRoot = fileURLToPath(new URL('../', import.meta.url))

const layout = read('../components/Layout.tsx')
const main = read('../main.tsx')
const sidebarShell = read('../components/MxSidebarShell.tsx')
const managerCanonical = read('../features/dashboard-loja/sections/ManagerSellerParityHomeCanonical.tsx')
const managerPrimitives = read('../features/manager/shared/ManagerVisualPrimitives.tsx')
const universalPrimitives = read('../components/module/MxModuleVisualPrimitives.tsx')
const button = read('../components/atoms/Button.tsx')
const painelConsultor = read('../pages/PainelConsultor.tsx')
const lojasContainer = read('../features/lojas/Lojas.container.tsx')

const legacyFiles = [
  '../design-system/internal-mx/InternalMxPageFrame.tsx',
  '../design-system/internal-mx/internal-mx-frame.css',
  '../design-system/internal-mx/internal-mx-components.css',
  '../design-system/internal-mx/internal-mx-routes.css',
]

function runtimeFiles(directory: string, files: string[] = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name)
    const relative = path.slice(srcRoot.length).replaceAll('\\', '/')
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (relative === 'test' || relative.includes('/__tests__')) continue
      runtimeFiles(path, files)
      continue
    }
    if (!/\.(ts|tsx|css)$/.test(name) || /\.(test|spec)\.(ts|tsx)$/.test(name)) continue
    files.push(path)
  }
  return files
}

describe('paridade visual dos módulos MX com o Gerente', () => {
  test('renderiza todos os perfis no mesmo shell sem frame visual paralelo', () => {
    expect(layout).toContain("from './MxSidebarShell'")
    expect(layout.split('<MxSidebarShell').length - 1).toBe(1)
    expect(layout).not.toContain('InternalMxPageFrame')
    expect(layout).not.toContain('mx-internal-workspace')
    expect(layout).toContain('{pageContent}')
  })

  test('mantém um único landmark main-content, pertencente ao shell universal', () => {
    expect(sidebarShell.split('id="main-content"').length - 1).toBe(1)

    for (const file of runtimeFiles(srcRoot)) {
      if (file.endsWith('/components/MxSidebarShell.tsx')) continue
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain('id="main-content"')
      expect(source).not.toContain("id='main-content'")
    }
  })

  test('não mantém adaptadores visuais legados no runtime', () => {
    expect(main).not.toContain('internal-mx-frame.css')
    expect(main).not.toContain('internal-mx-components.css')
    expect(main).not.toContain('internal-mx-routes.css')
    expect(main).not.toContain('../packages/mx-tokens/src/theme.css')
    for (const file of legacyFiles) {
      expect(existsSync(new URL(file, import.meta.url))).toBe(false)
    }
  })

  test('a fundação compartilhada usa a mesma matriz concreta do Gerente', () => {
    for (const marker of [
      'bg-gray-50',
      'max-w-7xl',
      'space-y-5',
      'rounded-2xl',
      'border-gray-100',
      'bg-white',
      'shadow-sm',
      'text-gray-800',
      'text-gray-500',
    ]) {
      expect(managerCanonical).toContain(marker)
      expect(universalPrimitives).toContain(marker)
    }

    expect(managerPrimitives).toContain("from '@/components/module/MxModuleVisualPrimitives'")
    expect(universalPrimitives).not.toContain('bg-surface-alt')
    expect(universalPrimitives).not.toContain('rounded-mx-xl')
    expect(universalPrimitives).not.toContain('border-border-subtle')
  })

  test('aplica variantes gerenciais por escopo sem substituir o primary do vendedor', () => {
    for (const variant of [
      'managerPrimary',
      'managerOutline',
      'managerSecondary',
      'managerGhost',
    ]) {
      expect(button).toContain(`${variant}:`)
    }
    expect(button).toContain('ButtonVisualProvider')
    expect(button).toContain("mode: ButtonVisualMode")
    expect(button).toContain("primary: 'managerPrimary'")
    expect(button).toContain("outline: 'managerSecondary'")
    expect(button).toContain('bg-emerald-600')
    expect(button).toContain('hover:bg-emerald-700')
    expect(button).toContain('border-emerald-200')
    expect(button).toContain('border-gray-200')
    expect(button).toContain('primary: "bg-mx-action')
    expect(universalPrimitives).toContain('<ButtonVisualProvider mode="manager">')
  })

  test('PainelConsultor e Lojas recebem a fundação compartilhada sem CSS corretivo por rota', () => {
    expect(painelConsultor).toContain('MxModulePage')
    expect(painelConsultor).toContain('MxModuleHeader')
    expect(painelConsultor).toContain('MxMetricCard')
    expect(lojasContainer).toContain('MxModulePage')
    expect(lojasContainer).toContain('MxStatusBanner')
    expect(painelConsultor).not.toContain('mx-internal-workspace')
    expect(lojasContainer).not.toContain('mx-internal-workspace')
  })

  test('proíbe marcadores do design antigo em todo código executável', () => {
    const forbidden = [
      'mxds-',
      'mx-internal-workspace',
      'InternalMxPageFrame',
      'internal-mx-components.css',
      'internal-mx-routes.css',
      'internal-mx-frame.css',
    ]

    for (const file of runtimeFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8')
      for (const marker of forbidden) expect(source).not.toContain(marker)
    }
  })
})
