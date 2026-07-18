import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

function parseSource(relativePath: string) {
  const sourceText = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
  return ts.createSourceFile(
    relativePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function walk(node: ts.Node, visit: (candidate: ts.Node) => void) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function collectRoutePaths(sourceFile: ts.SourceFile) {
  const paths = new Set<string>()
  walk(sourceFile, (node) => {
    if (!ts.isJsxAttribute(node) || node.name.getText(sourceFile) !== 'path') return
    if (node.initializer && ts.isStringLiteral(node.initializer)) paths.add(node.initializer.text)
  })
  return paths
}

function hasInternalRoleGuard(sourceFile: ts.SourceFile) {
  let found = false
  walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return
    if (node.expression.text !== 'isPerfilInternoMx') return
    const [argument] = node.arguments
    found = Boolean(argument && ts.isIdentifier(argument) && argument.text === 'role')
  })
  return found
}

function hasJsxElement(sourceFile: ts.SourceFile, tagName: string) {
  let found = false
  walk(sourceFile, (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      found ||= node.tagName.getText(sourceFile) === tagName
    }
  })
  return found
}

function importSpecifiers(sourceFile: ts.SourceFile) {
  return sourceFile.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.moduleSpecifier)
    .filter(ts.isStringLiteral)
    .map((specifier) => specifier.text)
}

const appSource = parseSource('../App.tsx')
const layoutSource = parseSource('../components/Layout.tsx')
const shellSource = parseSource('../design-system/internal-mx/MxInternalShell.tsx')

const routePaths = [
  'painel',
  'lojas',
  'agenda',
  'consultoria',
  'produtos',
  'notificacoes',
  'relatorio-matinal',
  'relatorios/performance-vendas',
  'relatorios/performance-vendedor',
  'auditoria',
  'configuracoes',
  'configuracoes/operacional',
  'configuracoes/consultoria-pmr',
  'configuracoes/reprocessamento',
]

describe('contrato do módulo interno MX', () => {
  test('preserva a árvore de rotas existente pela AST do React Router', () => {
    const declaredPaths = collectRoutePaths(appSource)
    for (const path of routePaths) expect(declaredPaths.has(path)).toBe(true)
  })

  test('seleciona o shell único somente por meio do guard canônico de perfil interno', () => {
    expect(hasInternalRoleGuard(layoutSource)).toBe(true)
    expect(hasJsxElement(layoutSource, 'MxInternalShell')).toBe(true)
    expect(importSpecifiers(layoutSource)).toContain('@/design-system/internal-mx/MxInternalShell')
  })

  test('mantém o shell visual desacoplado do cliente Supabase', () => {
    expect(importSpecifiers(shellSource).some((specifier) => specifier.toLowerCase().includes('supabase'))).toBe(false)
  })
})
