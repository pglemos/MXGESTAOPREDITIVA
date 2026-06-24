#!/usr/bin/env node
/**
 * Story 3.8 — Lint-tokens AST-driven (UX-006).
 *
 * Detecta cores hex (#RRGGBB / #RGB / #RRGGBBAA) hardcoded em código TS/TSX
 * usando o TypeScript Compiler API. Substitui o regex-based `lint-tokens.js`
 * (mantido como `lint-tokens.legacy.js` para referência).
 *
 * Regras de detecção:
 *  - String literals          → "#0D3B2E"
 *  - No-substitution templates → `#0D3B2E`
 *  - Template heads/spans     → `color: #abc; bg: ${x}`
 *  - JSX attribute strings    → stroke="#0D3B2E"
 *
 * Exclusões:
 *  - Comentários (trivia) — pulam automaticamente (não há nó AST)
 *  - Paths whitelisted (charts/tokens.ts, index.css, landing-css.ts, web-vitals.ts, *.test.*)
 *  - Linha com `// lint-tokens-ignore` ou `// lint-tokens-ignore-line`
 *  - data URI (`data:image/...`) e fragmentos de URL (`#section-id` sem hex válido)
 *
 * Whitelist resolvida em arquivos onde hex é legítimo (definição de tokens).
 *
 * Uso:
 *   node scripts/lint-tokens-ast.mjs            # report + exit 1 se violations
 *   node scripts/lint-tokens-ast.mjs --warn-only
 *   node scripts/lint-tokens-ast.mjs --json
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT_DIR, 'src')

// ---------------------------------------------------------------------------
// Configuração
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2)
const WARN_ONLY = argv.includes('--warn-only')
const JSON_OUT = argv.includes('--json')

/**
 * Paths onde hex é legítimo:
 *  - Definição canônica de tokens (charts/tokens.ts, index.css)
 *  - Landing pages (preservar visual histórico — UX-001)
 *  - Templates de email/print HTML (CSS vars não resolvem em clientes de email)
 *  - Observability (Sentry, web-vitals — não são design)
 *  - Testes
 */
const WHITELIST_PATTERNS = [
    /\/src\/lib\/charts\/tokens\.ts$/,
    /\/src\/index\.css$/,
    /\/src\/features\/landing\//, // preserve visual UX-001
    /\/src\/features\/checkin\//, // daily checkin UI redesign 20260624
    /\/src\/components\/SellerSidebar\.tsx$/, // seller sidebar navy redesign
    /\/src\/lib\/observability\//, // Sentry / web-vitals
    /\/src\/lib\/automation\/email\//, // email HTML (sem CSS vars)
    /\/src\/features\/consultoria\/components\/Visit(One|Report).*\.tsx$/, // print/PDF templates
    /\/src\/pages\/PDIPrint\.tsx$/, // print template
    /\.test\.(ts|tsx)$/,
    /\.spec\.(ts|tsx)$/,
    /\/__tests__\//,
    /\/test\//,
]

/** Regex hex completo (válido como cor): #RGB, #RRGGBB, #RRGGBBAA. */
const HEX_RE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g

/** Token canônico → hex (para sugerir substituição). */
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
    return WHITELIST_PATTERNS.some((re) => re.test(normalized))
}

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Lint engine (AST visitor)
// ---------------------------------------------------------------------------

/**
 * Decide se o conteúdo textual deve ser ignorado (data URI, URL fragment, etc).
 */
function isFalsePositiveContext(rawText) {
    // data:image/png;base64,...#... pouco provável carry hex significativo
    if (/data:[a-z]+\/[a-z0-9+.-]+;/i.test(rawText)) return true
    // URLs de SVG fragment (xlink:href="#gradient")
    if (/^#[a-zA-Z_][\w-]*$/.test(rawText.trim())) return true
    return false
}

/**
 * Coleta linhas que possuem `// lint-tokens-ignore` ou `// lint-tokens-ignore-line`.
 */
function collectIgnoredLines(sourceText) {
    const ignored = new Set()
    const lines = sourceText.split('\n')
    lines.forEach((line, idx) => {
        if (/\/\/\s*lint-tokens-ignore(-line)?/.test(line)) {
            ignored.add(idx + 1)
        }
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
        filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    )

    const ignoredLines = collectIgnoredLines(text)
    const violations = []

    function reportNode(node, rawValue) {
        if (!rawValue || typeof rawValue !== 'string') return
        if (isFalsePositiveContext(rawValue)) return

        const matches = rawValue.matchAll(HEX_RE)
        for (const m of matches) {
            const hex = m[0]
            const offset = node.getStart(sourceFile) + (m.index ?? 0)
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(offset)
            const lineNumber = line + 1
            if (ignoredLines.has(lineNumber)) continue

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
                reportNode(node, node.text)
                break
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                reportNode(node, node.text)
                break
            case ts.SyntaxKind.TemplateHead:
            case ts.SyntaxKind.TemplateMiddle:
            case ts.SyntaxKind.TemplateTail:
                reportNode(node, node.text)
                break
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

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

const t0 = Date.now()
const allFiles = walkSync(SRC_DIR)
let scanned = 0
const allViolations = []

for (const file of allFiles) {
    if (isWhitelisted(file)) continue
    scanned++
    const v = scanFile(file)
    if (v.length) allViolations.push(...v)
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(2)

if (JSON_OUT) {
    process.stdout.write(JSON.stringify({ violations: allViolations, scanned, elapsed }, null, 2))
    process.exit(allViolations.length > 0 && !WARN_ONLY ? 1 : 0)
}

if (allViolations.length === 0) {
    console.log(`[lint-tokens-ast] OK — ${scanned} arquivos escaneados em ${elapsed}s. Nenhum hex hardcoded encontrado.`)
    process.exit(0)
}

// Output legível
console.error(`\n[lint-tokens-ast] ${allViolations.length} violação(ões) em ${scanned} arquivos (${elapsed}s):\n`)

const byFile = new Map()
for (const v of allViolations) {
    if (!byFile.has(v.file)) byFile.set(v.file, [])
    byFile.get(v.file).push(v)
}

for (const [file, items] of byFile) {
    console.error(`  ${file}`)
    for (const v of items) {
        const hint = v.suggestion ? ` → use ${v.suggestion}` : ''
        console.error(`    ${v.line}:${v.col}  ${v.hex}${hint}`)
    }
}

// Top 5 ofensores
const top = [...byFile.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
console.error('\nTop 5 ofensores:')
for (const [file, items] of top) {
    console.error(`  ${items.length.toString().padStart(3)}  ${file}`)
}

console.error(`\nTotal: ${allViolations.length} violation(s). Use chartTokens (src/lib/charts/tokens.ts) ou adicione \`// lint-tokens-ignore-line\` se necessário.\n`)

process.exit(WARN_ONLY ? 0 : 1)
