import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const lojasRoot = path.join(root, 'src/features/lojas')
const extensions = new Set(['.tsx', '.ts', '.jsx', '.js', '.css'])

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute, files)
    else if (extensions.has(path.extname(entry.name)) && !/\.(?:test|spec)\./.test(entry.name)) files.push(absolute)
  }
  return files
}

const replacements = [
  ['status-success-surface', 'emerald-50'],
  ['status-warning-surface', 'amber-50'],
  ['status-error-surface', 'red-50'],
  ['status-info-surface', 'blue-50'],
  ['text-text-primary', 'text-gray-800'],
  ['text-text-secondary', 'text-gray-600'],
  ['text-text-tertiary', 'text-gray-500'],
  ['text-text-label', 'text-gray-600'],
  ['bg-surface-default', 'bg-white'],
  ['bg-surface-elevated', 'bg-white'],
  ['bg-surface-alt', 'bg-gray-50'],
  ['bg-surface-overlay', 'bg-white'],
  ['border-border-default', 'border-gray-200'],
  ['border-border-subtle', 'border-gray-100'],
  ['border-border-strong', 'border-gray-300'],
  ['brand-primary', 'emerald-600'],
  ['brand-secondary', 'gray-900'],
  ['status-success', 'emerald-600'],
  ['status-warning', 'amber-500'],
  ['status-error', 'red-600'],
  ['status-info', 'blue-600'],
  ['bg-mx-indigo-50', 'bg-emerald-50'],
  ['border-mx-indigo-100', 'border-emerald-100'],
  ['text-mx-indigo-600', 'text-emerald-600'],
  ['border-mx-emerald-100', 'border-emerald-100'],
  ['border-mx-amber-100', 'border-amber-100'],
  ['bg-mx-black', 'bg-gray-950'],
  ['text-mx-muted', 'text-gray-500'],
  ['text-mx-text', 'text-gray-800'],
  ['bg-mx-bg', 'bg-gray-50'],
  ['border-mx-border', 'border-gray-200'],
  ['shadow-mx-glow-brand', 'shadow-lg'],
  ['shadow-mx-elite', 'shadow-xl'],
  ['shadow-mx-2xl', 'shadow-2xl'],
  ['shadow-mx-xl', 'shadow-xl'],
  ['shadow-mx-lg', 'shadow-lg'],
  ['shadow-mx-md', 'shadow-md'],
  ['shadow-mx-sm', 'shadow-sm'],
  ['rounded-mx-full', 'rounded-full'],
  ['rounded-mx-4xl', 'rounded-2xl'],
  ['rounded-mx-3xl', 'rounded-2xl'],
  ['rounded-mx-2xl', 'rounded-2xl'],
  ['rounded-mx-xl', 'rounded-xl'],
  ['rounded-mx-lg', 'rounded-xl'],
  ['rounded-mx-md', 'rounded-lg'],
  ['rounded-mx-sm', 'rounded-md'],
  ['text-mx-nano', 'text-[9px]'],
  ['text-mx-micro', 'text-[10px]'],
  ['text-mx-tiny', 'text-xs'],
  ['text-mx-huge', 'text-4xl'],
  ['tracking-mx-widest', 'tracking-widest'],
  ['tracking-mx-wide', 'tracking-wide'],
  ['min-h-mx-section-lg', 'min-h-96'],
  ['font-mono-numbers', 'font-mono tabular-nums'],
  ['xl:top-[var(--spacing-mx-layout-offset-top)]', 'xl:top-6'],
  ['h-mx-px', 'h-px'],
]

const namedSpacing = { tiny: '1', xs: '2', sm: '3', md: '4', lg: '6', xl: '8', '2xl': '12', '3xl': '16', '4xl': '20' }

function migrate(source) {
  let output = source
  for (const [legacy, canonical] of replacements) output = output.replaceAll(legacy, canonical)
  output = output.replace(
    /\b(p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|w|h|min-w|max-w|min-h|max-h|left|right|top|bottom)-mx-(\d+)\b/g,
    '$1-$2',
  )
  for (const [legacy, canonical] of Object.entries(namedSpacing)) {
    output = output.replace(
      new RegExp(`\\b(p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|w|h|min-w|max-w|min-h|max-h|left|right|top|bottom)-mx-${legacy}\\b`, 'g'),
      `$1-${canonical}`,
    )
  }
  return output
}

const changedFiles = []
for (const file of walk(lojasRoot)) {
  const before = fs.readFileSync(file, 'utf8')
  const after = migrate(before)
  if (before === after) continue
  fs.writeFileSync(file, after)
  changedFiles.push(path.relative(root, file))
}

const auditPath = path.join(root, 'scripts/audit-management-design-system.mjs')
let audit = fs.readFileSync(auditPath, 'utf8')
if (!audit.includes('MANAGEMENT_OWNED_ROOTS')) {
  audit = audit.replace(
    "const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css']",
    "const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css']\nconst MANAGEMENT_OWNED_ROOTS = ['features/lojas']",
  )
}
if (!audit.includes("id: 'legacy-css-variable'")) {
  audit = audit.replace(
    "  { id: 'legacy-action-shadow', expression: /\\bshadow-action\\b/g },",
    "  { id: 'legacy-action-shadow', expression: /\\bshadow-action\\b/g },\n  { id: 'legacy-css-variable', expression: /--(?:spacing|color|radius|shadow)-mx-[\\w-]+/g },",
  )
}
if (!audit.includes('const ownedFiles = MANAGEMENT_OWNED_ROOTS')) {
  audit = audit.replace(
    "  const exclusiveFiles = [...managementReachable].filter((file) => !sellerReachable.has(file))\n  const violations = []\n\n  for (const file of exclusiveFiles) {",
    "  const exclusiveFiles = [...managementReachable].filter((file) => !sellerReachable.has(file))\n  const ownedFiles = MANAGEMENT_OWNED_ROOTS.flatMap((ownedRoot) => {\n    const absolute = path.join(sourceRoot, ownedRoot)\n    return fs.existsSync(absolute) ? listSourceFiles(absolute) : []\n  }).filter((file) => !/\\.(?:test|spec)\\.(?:ts|tsx|js|jsx)$/.test(file))\n  const auditedFiles = [...new Set([...exclusiveFiles, ...ownedFiles])]\n  const violations = []\n\n  for (const file of auditedFiles) {",
  )
  audit = audit.replace(
    '    auditedExclusiveFiles: exclusiveFiles.length,',
    '    auditedExclusiveFiles: exclusiveFiles.length,\n    auditedOwnedFiles: ownedFiles.length,\n    auditedFiles: auditedFiles.length,',
  )
}
fs.writeFileSync(auditPath, audit)

const auditTestPath = path.join(root, 'scripts/audit-management-design-system.test.mjs')
let auditTest = fs.readFileSync(auditTestPath, 'utf8')
auditTest = auditTest.replace(
  'mxds-page-frame" />',
  'mxds-page-frame border-mx-emerald-100 [top:var(--spacing-mx-layout-offset-top)]" />',
)
if (!auditTest.includes("    'legacy-css-variable',")) {
  auditTest = auditTest.replace(
    "    'legacy-custom-utility',\n",
    "    'legacy-custom-utility',\n    'legacy-css-variable',\n",
  )
}
fs.writeFileSync(auditTestPath, auditTest)

console.log(JSON.stringify({ changedFiles, totalChanged: changedFiles.length }, null, 2))
