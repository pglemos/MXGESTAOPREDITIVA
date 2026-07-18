import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { managementSourceEntries } from '../src/design-system/management/managementRouteManifest.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '..')
const sourceRoot = path.join(projectRoot, 'src')

const SELLER_ENTRIES = [
  'features/checkin/Checkin.container.tsx',
  'pages/Ranking.tsx',
  'pages/VendedorDesenvolvimento.tsx',
  'pages/VendedorTreinamentos.tsx',
  'pages/VendedorAjuda.tsx',
  'pages/VendedorConfiguracoes.tsx',
  'pages/MinhaRemuneracao.tsx',
  'pages/CarteiraClientes.tsx',
  'pages/FunilVendedor.tsx',
  'pages/CentralExecucao.tsx',
  'pages/MeuPerfilVendedor.tsx',
  'pages/RelatoriosVendedor.tsx',
  'pages/StoreConsultorIa.tsx',
]

const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css']
const IMPORT_PATTERN = /(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]|import\(\s*['\"]([^'\"]+)['\"]\s*\)/g

export const forbiddenManagementPatterns = [
  { id: 'legacy-radius', expression: /\brounded-mx-[\w\[\]\/.-]+/g },
  { id: 'legacy-shadow', expression: /\bshadow-mx-[\w\[\]\/.-]+/g },
  { id: 'legacy-spacing', expression: /\b(?:p[trblxy]?|m[trblxy]?|gap|space-[xy]|w|h|min-w|max-w|min-h|max-h)-mx-[\w\[\]\/.-]+/g },
  { id: 'legacy-font-size', expression: /\btext-mx-(?:nano|micro|tiny|huge)\b/g },
  { id: 'legacy-text-token', expression: /\btext-text-(?:primary|secondary|tertiary|label)\b/g },
  { id: 'legacy-surface-token', expression: /\bbg-surface-(?:default|alt|elevated|overlay)\b/g },
  { id: 'legacy-border-token', expression: /\bborder-border-(?:default|subtle|strong)\b/g },
  { id: 'legacy-brand-action', expression: /\b(?:bg|text|border|ring|from|to|via)-(?:brand-primary|mx-action|mx-teal)(?:-[\w]+)?(?:\/[0-9]+)?\b/g },
  { id: 'legacy-mx-palette', expression: /\b(?:bg|text|border|ring|from|to|via)-mx-(?:pink|navy|dark|black|bg|surface|border|divider|text|muted|subtle)(?:-[\w]+)?(?:\/[0-9]+)?\b/g },
  { id: 'legacy-wrapper', expression: /\b(?:mxds-[\w-]+|mx-internal-[\w-]+)\b/g },
  { id: 'legacy-custom-utility', expression: /\b(?!mx-auto\b)[A-Za-z][\w-]*-mx-[\w\[\]\/.-]+\b/g },
  { id: 'legacy-status-token', expression: /\b(?:bg|text|border|ring|from|to|via)-status-(?:success|warning|error|info)(?:-[\w]+)?(?:\/[0-9]+)?\b/g },
  { id: 'legacy-secondary-brand', expression: /\b(?:bg|text|border|ring|from|to|via)-(?:brand-secondary|pure-black)(?:\/[0-9]+)?\b/g },
  { id: 'legacy-mono-token', expression: /\bfont-mono-numbers\b/g },
  { id: 'legacy-action-shadow', expression: /\bshadow-action\b/g },
]

function listSourceFiles(directory) {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...listSourceFiles(absolute))
    else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) files.push(absolute)
  }
  return files
}

function resolveImport(importer, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null
  const unresolved = specifier.startsWith('@/')
    ? path.join(sourceRoot, specifier.slice(2))
    : path.resolve(path.dirname(importer), specifier)
  const candidates = path.extname(unresolved)
    ? [unresolved]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${unresolved}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => path.join(unresolved, `index${extension}`)),
      ]
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

function buildGraph() {
  const graph = new Map()
  for (const file of listSourceFiles(sourceRoot)) {
    if (path.extname(file) === '.css') {
      graph.set(file, [])
      continue
    }
    const source = fs.readFileSync(file, 'utf8')
    const imports = []
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const resolved = resolveImport(file, match[1] ?? match[2])
      if (resolved) imports.push(resolved)
    }
    graph.set(file, imports)
  }
  return graph
}

function collectReachable(graph, entries) {
  const reachable = new Set()
  const stack = entries
    .map((entry) => path.join(sourceRoot, entry))
    .filter((entry) => fs.existsSync(entry))
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || reachable.has(current)) continue
    reachable.add(current)
    for (const dependency of graph.get(current) ?? []) stack.push(dependency)
  }
  return reachable
}

export function auditManagementDesignSystem({ root = projectRoot } = {}) {
  if (root !== projectRoot) {
    throw new Error('A auditoria de fixtures deve usar auditText; root alternativo não é suportado.')
  }
  const graph = buildGraph()
  const managementReachable = collectReachable(graph, managementSourceEntries)
  const sellerReachable = collectReachable(graph, SELLER_ENTRIES)
  const exclusiveFiles = [...managementReachable].filter((file) => !sellerReachable.has(file))
  const violations = []

  for (const file of exclusiveFiles) {
    if (!['.tsx', '.jsx', '.css'].includes(path.extname(file))) continue
    const source = fs.readFileSync(file, 'utf8')
    const relativeFile = path.relative(sourceRoot, file).split(path.sep).join('/')
    for (const pattern of forbiddenManagementPatterns) {
      for (const match of source.matchAll(pattern.expression)) {
        const prefix = source.slice(0, match.index)
        const line = prefix.split('\n').length
        violations.push({
          file: relativeFile,
          line,
          rule: pattern.id,
          token: match[0],
        })
      }
    }
  }

  return {
    entries: managementSourceEntries.length,
    reachableFiles: managementReachable.size,
    sellerSharedFiles: [...managementReachable].filter((file) => sellerReachable.has(file)).length,
    auditedExclusiveFiles: exclusiveFiles.length,
    violations,
  }
}

export function auditText(source) {
  const violations = []
  for (const pattern of forbiddenManagementPatterns) {
    for (const match of source.matchAll(pattern.expression)) {
      violations.push({ rule: pattern.id, token: match[0] })
    }
  }
  return violations
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = auditManagementDesignSystem()
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.violations.length > 0) process.exitCode = 1
}
