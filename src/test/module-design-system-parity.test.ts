import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const srcRoot = fileURLToPath(new URL('../', import.meta.url))

const layout = read('../components/Layout.tsx')
const main = read('../main.tsx')
const managerPrimitives = read('../features/manager/shared/ManagerVisualPrimitives.tsx')
const universalPrimitives = read('../components/module/MxModuleVisualPrimitives.tsx')
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

  test('não mantém adaptadores visuais legados no runtime', () => {
    expect(main).not.toContain('internal-mx-frame.css')
    expect(main).not.toContain('internal-mx-components.css')
    expect(main).not.toContain('internal-mx-routes.css')
    expect(main).not.toContain("../packages/mx-tokens/src/theme.css")
    for (const file of legacyFiles) {
      expect(existsSync(new URL(file, import.meta.url))).toBe(false)
    }
  })

  test('Gerente, Admin, Consultoria e Dono compartilham a mesma origem de primitivas', () => {
    expect(managerPrimitives).toContain("from '@/components/module/MxModuleVisualPrimitives'")
    for (const component of [
      'MxModulePage',
      'MxModuleHeader',
      'MxMetricCard',
      'MxSectionCard',
      'MxToolbar',
      'MxField',
      'MxTableSurface',
      'MxEmptyState',
      'MxLoadingState',
      'MxStatusBanner',
    ]) {
      expect(universalPrimitives).toContain(`export function ${component}`)
    }
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
