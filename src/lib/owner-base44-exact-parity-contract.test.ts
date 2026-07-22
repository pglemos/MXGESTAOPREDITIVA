import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

function getJsxAttribute(
  attributes: ts.JsxAttributes,
  name: string,
): ts.JsxAttribute | undefined {
  return attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  )
}

function getStringAttribute(attributes: ts.JsxAttributes, name: string) {
  const attribute = getJsxAttribute(attributes, name)
  return attribute?.initializer && ts.isStringLiteral(attribute.initializer)
    ? attribute.initializer.text
    : undefined
}

function attributeContainsTag(attributes: ts.JsxAttributes, name: string, tagName: string) {
  const attribute = getJsxAttribute(attributes, name)
  if (!attribute?.initializer || !ts.isJsxExpression(attribute.initializer)) return false

  let found = false
  const visit = (node: ts.Node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText() === tagName
    ) {
      found = true
    }
    node.forEachChild(visit)
  }
  attribute.initializer.forEachChild(visit)
  return found
}

// Módulo do Dono portado 1:1 do export Base44 (paths /dono/*).
const referenceFiles = [
  'src/components/Layout.tsx',
  'src/components/MxSidebarShell.tsx',
  'src/components/owner/OwnerLayout.jsx',
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
  it('ships the universal MX shell and all Base44 owner pages', () => {
    for (const file of referenceFiles) {
      expect(existsSync(resolve(root, file)), `${file} must exist`).toBe(true)
    }
  })

  it('mounts the Base44 owner module inside the universal authenticated layout', () => {
    const app = read('src/App.tsx')
    const source = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    expect(app).toContain("const OwnerModule = lazy(() => import('@/features/owner-base44/OwnerModule'))")

    let authenticatedRoot: ts.JsxElement | undefined
    source.forEachChild(function visit(node) {
      if (
        ts.isJsxElement(node) &&
        node.openingElement.tagName.getText(source) === 'Route' &&
        getStringAttribute(node.openingElement.attributes, 'path') === '/' &&
        attributeContainsTag(node.openingElement.attributes, 'element', 'ProtectedRoute') &&
        attributeContainsTag(node.openingElement.attributes, 'element', 'Layout')
      ) {
        authenticatedRoot = node
      }
      node.forEachChild(visit)
    })

    expect(authenticatedRoot, 'authenticated root Route must exist').toBeDefined()
    const ownerRoute = authenticatedRoot?.children.find(
      (child): child is ts.JsxSelfClosingElement =>
        ts.isJsxSelfClosingElement(child) &&
        child.tagName.getText(source) === 'Route' &&
        getStringAttribute(child.attributes, 'path') === '/dono/*',
    )
    expect(ownerRoute, 'owner Route must be a direct child of the authenticated Layout').toBeDefined()
    expect(attributeContainsTag(ownerRoute!.attributes, 'element', 'Suspense')).toBe(true)
    expect(attributeContainsTag(ownerRoute!.attributes, 'element', 'OwnerModule')).toBe(true)
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
    expect(route).toContain('OwnerLiveDataPage')
    expect(route).not.toContain("@/pages/owner/OwnerHome")
    expect(route).not.toContain("@/pages/owner/PlanoEstrategico")
    expect(route).not.toContain("@/pages/owner/PlanoDeAcao")
    expect(route).not.toContain("@/pages/owner/Consultoria")
  })

  it('preserves the Base44 navigation anatomy in the universal sidebar', () => {
    const layout = read('src/components/Layout.tsx')
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
    ]) {
      expect(layout).toContain(label)
    }
    expect(layout).toContain('path: ownerNavigationCanonicalPath(item)')
    expect(existsSync(resolve(root, 'src/components/owner/OwnerSidebar.jsx'))).toBe(false)
  })

  it('exposes one universal main landmark and a dedicated owner content region', () => {
    const module = read('src/features/owner-base44/OwnerModule.tsx')
    const appLayout = read('src/components/Layout.tsx')
    const ownerLayout = read('src/components/owner/OwnerLayout.jsx')
    const shell = read('src/components/MxSidebarShell.tsx')
    const topbar = read('src/components/owner/OwnerTopbar.jsx')
    expect(module).toContain('owner-base44-exact')
    expect(appLayout).toContain('<MxSidebarShell')
    expect(shell).toContain('id="main-content"')
    expect(ownerLayout).toContain('id="owner-main-content"')
    expect(ownerLayout).toContain('role="region"')
    expect(ownerLayout).not.toContain('<aside')
    expect(ownerLayout).not.toContain('<main')
    expect(topbar).toContain('owner-base44-exact__topbar')
    expect(topbar).not.toContain('onOpenSidebar')
  })

  it('keeps owner scope and consultation refresh boundaries explicit', () => {
    const appLayout = read('src/components/Layout.tsx')
    const ownerLiveData = read('src/features/owner-base44/OwnerLiveDataPage.tsx')
    const styles = read('src/styles/owner-base44-exact.css')
    expect(appLayout).toContain("location.pathname === '/dono' || location.pathname.startsWith('/dono/')")
    expect(ownerLiveData).toContain('useDashboardLojaData')
    expect(ownerLiveData).toContain('OwnerExecutiveCockpit')
    for (let index = 1; index <= 5; index += 1) {
      expect(styles).toContain(`--color-chart-${index}: hsl(var(--chart-${index}))`)
    }
  })

  it('binds consultant requests exclusively to the authenticated session', () => {
    const adapter = read('src/features/owner-base44/b44adapter.js')
    expect(adapter).toContain('const { data: auth, error: authError } = await supabase.auth.getUser()')
    expect(adapter).toContain("if (authError || !userId) throw new Error('Usuário não identificado')")
    expect(adapter).not.toContain('payload.created_by')
  })
})
