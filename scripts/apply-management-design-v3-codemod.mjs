import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '..')
const lojasRoot = path.join(projectRoot, 'src/features/lojas')

const sourceExtensions = new Set(['.tsx', '.ts', '.jsx', '.js', '.css'])

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute, files)
    else if (sourceExtensions.has(path.extname(entry.name)) && !/\.(?:test|spec)\./.test(entry.name)) files.push(absolute)
  }
  return files
}

const replacements = [
  ['bg-status-success-surface', 'bg-emerald-50'],
  ['border-status-success-surface', 'border-emerald-100'],
  ['bg-status-warning-surface', 'bg-amber-50'],
  ['border-status-warning-surface', 'border-amber-100'],
  ['bg-status-error-surface', 'bg-red-50'],
  ['border-status-error-surface', 'border-red-100'],
  ['bg-status-info-surface', 'bg-blue-50'],
  ['border-status-info-surface', 'border-blue-100'],
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

const namedSpacing = {
  tiny: '1',
  xs: '2',
  sm: '3',
  md: '4',
  lg: '6',
  xl: '8',
  '2xl': '12',
  '3xl': '16',
  '4xl': '20',
}

function migrateSource(source) {
  let migrated = source
  for (const [legacy, canonical] of replacements) migrated = migrated.replaceAll(legacy, canonical)

  migrated = migrated.replace(
    /\b(p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|w|h|min-w|max-w|min-h|max-h|left|right|top|bottom)-mx-(\d+)\b/g,
    '$1-$2',
  )

  for (const [legacy, canonical] of Object.entries(namedSpacing)) {
    migrated = migrated.replace(
      new RegExp(`\\b(p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|w|h|min-w|max-w|min-h|max-h|left|right|top|bottom)-mx-${legacy}\\b`, 'g'),
      `$1-${canonical}`,
    )
  }

  return migrated
}

const changedFiles = []
for (const file of walk(lojasRoot)) {
  const source = fs.readFileSync(file, 'utf8')
  const migrated = migrateSource(source)
  if (source === migrated) continue
  fs.writeFileSync(file, migrated)
  changedFiles.push(path.relative(projectRoot, file))
}

const auditPath = path.join(projectRoot, 'scripts/audit-management-design-system.mjs')
let auditSource = fs.readFileSync(auditPath, 'utf8')
if (!auditSource.includes('MANAGEMENT_OWNED_ROOTS')) {
  auditSource = auditSource.replace(
    "const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css']",
    "const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css']\nconst MANAGEMENT_OWNED_ROOTS = ['features/lojas']",
  )
}
if (!auditSource.includes("id: 'legacy-css-variable'")) {
  auditSource = auditSource.replace(
    "  { id: 'legacy-action-shadow', expression: /\\bshadow-action\\b/g },",
    "  { id: 'legacy-action-shadow', expression: /\\bshadow-action\\b/g },\n  { id: 'legacy-css-variable', expression: /--(?:spacing|color|radius|shadow)-mx-[\\w-]+/g },",
  )
}
if (!auditSource.includes('const ownedFiles = MANAGEMENT_OWNED_ROOTS')) {
  auditSource = auditSource.replace(
    "  const exclusiveFiles = [...managementReachable].filter((file) => !sellerReachable.has(file))\n  const violations = []\n\n  for (const file of exclusiveFiles) {",
    "  const exclusiveFiles = [...managementReachable].filter((file) => !sellerReachable.has(file))\n  const ownedFiles = MANAGEMENT_OWNED_ROOTS.flatMap((root) => {\n    const absolute = path.join(sourceRoot, root)\n    return fs.existsSync(absolute) ? listSourceFiles(absolute) : []\n  }).filter((file) => !/\\.(?:test|spec)\\.(?:ts|tsx|js|jsx)$/.test(file))\n  const auditedFiles = [...new Set([...exclusiveFiles, ...ownedFiles])]\n  const violations = []\n\n  for (const file of auditedFiles) {",
  )
  auditSource = auditSource.replace(
    '    auditedExclusiveFiles: exclusiveFiles.length,',
    '    auditedExclusiveFiles: exclusiveFiles.length,\n    auditedOwnedFiles: ownedFiles.length,\n    auditedFiles: auditedFiles.length,',
  )
}
fs.writeFileSync(auditPath, auditSource)

const auditTestPath = path.join(projectRoot, 'scripts/audit-management-design-system.test.mjs')
let auditTestSource = fs.readFileSync(auditTestPath, 'utf8')
auditTestSource = auditTestSource.replace(
  'mxds-page-frame" />',
  'mxds-page-frame border-mx-emerald-100 [top:var(--spacing-mx-layout-offset-top)]" />',
)
if (!auditTestSource.includes("      'legacy-css-variable',")) {
  auditTestSource = auditTestSource.replace(
    "      'legacy-wrapper',\n",
    "      'legacy-wrapper',\n      'legacy-custom-utility',\n      'legacy-css-variable',\n",
  )
}
fs.writeFileSync(auditTestPath, auditTestSource)

const visualWorkflowPath = path.join(projectRoot, '.github/workflows/module-design-system-authenticated-visual.yml')
let workflowSource = fs.readFileSync(visualWorkflowPath, 'utf8')
if (!workflowSource.includes("src/test/management-design-system-route-matrix.playwright.ts'")) {
  workflowSource = workflowSource.replace(
    "      - 'src/test/module-design-system-authenticated-visual.playwright.ts'",
    "      - 'src/test/module-design-system-authenticated-visual.playwright.ts'\n      - 'src/test/management-design-system-route-matrix.playwright.ts'",
  )
}
if (!workflowSource.includes('Run full management route matrix')) {
  workflowSource = workflowSource.replace(
    "      - name: Detect authenticated audit credentials",
    "      - name: Run full management route matrix\n        run: >\n          npx playwright test\n          src/test/management-design-system-route-matrix.playwright.ts\n          --project=chromium --workers=1\n      - name: Detect authenticated audit credentials",
  )
}
fs.writeFileSync(visualWorkflowPath, workflowSource)

console.log(JSON.stringify({ changedFiles, totalChanged: changedFiles.length }, null, 2))
