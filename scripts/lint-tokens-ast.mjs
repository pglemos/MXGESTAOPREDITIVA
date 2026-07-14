#!/usr/bin/env node
/**
 * Story 3.8 — Lint-tokens AST-driven (UX-006).
 *
 * Detecta cores hex hardcoded em código TS/TSX usando o TypeScript Compiler API.
 * Exceções devem ser explícitas e restritas a arquivos de referência visual onde
 * o valor observado é parte do contrato de paridade.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT_DIR, 'src')
const argv = process.argv.slice(2)
const WARN_ONLY = argv.includes('--warn-only')
const JSON_OUT = argv.includes('--json')

const WHITELIST_PATTERNS = [
  /\/src\/lib\/charts\/tokens\.ts$/,
  /\/src\/index\.css$/,
  /\/src\/features\/landing\//,
  /\/src\/features\/checkin\//,
  /\/src\/components\/SellerSidebar\.tsx$/,
  /\/src\/components\/NotificationBellButton\.tsx$/,
  /\/src\/components\/seller\/SellerPageHeader\.tsx$/,
  /\/src\/features\/crm\/AlterarProximoPasso\.tsx$/,
  /\/src\/features\/crm\/CentralExecucao\.container\.tsx$/,
  /\/src\/features\/crm\/CarteiraClientes\.container\.tsx$/,
  /\/src\/features\/crm\/ModoAtaqueView\.tsx$/,
  /\/src\/features\/crm\/PlanoAtaqueTab\.tsx$/,
  /\/src\/features\/remuneracao\/MinhaRemuneracaoPage\.tsx$/,
  /\/src\/lib\/observability\//,
  /\/src\/lib\/automation\/email\//,
  /\/src\/features\/consultoria\/components\/Visit(One|Report).*\.tsx$/,
  /\/src\/pages\/PDIPrint\.tsx$/,
  // Contrato visual Base44 medido: exceção limitada ao recorte em reconstrução.
  /\/src\/features\/manager\/daily-closing\/ManagerDailyClosingBase44\.tsx$/,
  /\/src\/features\/manager\/daily-closing\/ClosingDetailsModal\.tsx$/,
  /\.test\.(ts|tsx)$/,
  /\.spec\.(ts|tsx)$/,
  /\/__tests__\//,
  /\/test\//,
]

const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g
const TOKEN_MAP = {
  '#0D3B2E': 'chartTokens.primary()',
  '#22C55E': 'chartTokens.accent()',
  '#10b981': 'chartTokens.success()',
  '#f59e0b': 'chartTokens.warning()',
  '#FACC15': 'chartTokens.series.s3()',
  '#ef4444': 'chartTokens.danger()',
  '#EF4444': 'chartTokens.danger()',
  '#3b82f6': 'chartTokens.info()',
  '#2563EB': 'chartTokens.series.s4()',
  '#6B7280': 'chartTokens.axisTick()',
  '#94a3b8': 'chartTokens.axisTickMuted()',
  '#64748b': 'chartTokens.axisTickStrong()',
  '#E5E7EB': 'chartTokens.grid()',
  '#e2e8f0': 'chartTokens.gridStrong()',
  '#334155': 'chartTokens.gridDark()',
  '#ffffff': 'chartTokens.dotStroke()',
  '#FFFFFF': 'chartTokens.dotStroke()',
  '#7C3AED': 'chartTokens.series.s6()',
  '#F59E0B': 'chartTokens.series.s7()',
  '#00E5FF': 'chartTokens.series.s8()',
}

function suggestToken(hex) {
  return TOKEN_MAP[hex] || TOKEN_MAP[hex.toUpperCase()] || TOKEN_MAP[hex.toLowerCase()] || null
}

function isWhitelisted(filePath) {
  const normalized = filePath.replace(/\\/g, '/')
  return WHITELIST_PATTERNS.some((pattern) => pattern.test(normalized))
}

function walkSync(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      walkSync(full, files)
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(full)
    }
  }
  return files
}

function isFalsePositiveContext(rawText) {
  if (/data:[a-z]+\/[a-z0-9+.-]+;/i.test(rawText)) return true
  return /^#[a-zA-Z_][\w-]*$/.test(rawText.trim())
}

function collectIgnoredLines(sourceText) {
  const ignored = new Set()
  sourceText.split('\n').forEach((line, index) => {
    if (/\/\/\s*lint-tokens-ignore(-line)?/.test(line)) ignored.add(index + 1)
  })
  return ignored
}

function scanFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const ignoredLines = collectIgnoredLines(text)
  const violations = []

  function reportNode(node, rawValue) {
    if (!rawValue || typeof rawValue !== 'string' || isFalsePositiveContext(rawValue)) return
    for (const match of rawValue.matchAll(HEX_RE)) {
      const offset = node.getStart(sourceFile) + (match.index ?? 0)
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(offset)
      const lineNumber = line + 1
      if (ignoredLines.has(lineNumber)) continue
      const hex = match[0]
      violations.push({
        file: path.relative(ROOT_DIR, filePath),
        line: lineNumber,
        col: character + 1,
        hex,
        suggestion: suggestToken(hex),
        kind: ts.SyntaxKind[node.kind],
      })
    }
  }

  function visit(node) {
    switch (node.kind) {
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      case ts.SyntaxKind.TemplateHead:
      case ts.SyntaxKind.TemplateMiddle:
      case ts.SyntaxKind.TemplateTail:
      case ts.SyntaxKind.JsxText:
        reportNode(node, node.text)
        break
      default:
        break
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

const startedAt = Date.now()
const allFiles = walkSync(SRC_DIR)
let scanned = 0
const violations = []

for (const file of allFiles) {
  if (isWhitelisted(file)) continue
  scanned += 1
  violations.push(...scanFile(file))
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2)
if (JSON_OUT) {
  process.stdout.write(JSON.stringify({ violations, scanned, elapsed }, null, 2))
  process.exit(violations.length > 0 && !WARN_ONLY ? 1 : 0)
}

if (violations.length === 0) {
  console.log(`[lint-tokens-ast] OK — ${scanned} arquivos escaneados em ${elapsed}s. Nenhum hex hardcoded encontrado.`)
  process.exit(0)
}

console.error(`\n[lint-tokens-ast] ${violations.length} violação(ões) em ${scanned} arquivos (${elapsed}s):\n`)
const byFile = new Map()
for (const violation of violations) {
  if (!byFile.has(violation.file)) byFile.set(violation.file, [])
  byFile.get(violation.file).push(violation)
}
for (const [file, items] of byFile) {
  console.error(`  ${file}`)
  for (const violation of items) {
    const hint = violation.suggestion ? ` → use ${violation.suggestion}` : ''
    console.error(`    ${violation.line}:${violation.col}  ${violation.hex}${hint}`)
  }
}
console.error(`\nTotal: ${violations.length} violation(s). Use chartTokens ou adicione uma exceção estritamente escopada.\n`)
process.exit(WARN_ONLY ? 0 : 1)
