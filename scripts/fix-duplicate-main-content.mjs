import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const srcRoot = join(root, 'src')
const changed = []

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path)
      continue
    }
    if (!path.endsWith('.tsx')) continue
    if (/\.(test|spec)\.tsx$/.test(path)) continue
    if (path.endsWith(join('components', 'MxSidebarShell.tsx'))) continue

    const before = readFileSync(path, 'utf8')
    let after = before
      .replace(/\s+id=(['"])main-content\1/g, '')
      .replace(/id\s*=\s*(['"])main-content\1\s*,/g, 'id,')

    if (after === before) continue
    writeFileSync(path, after)
    changed.push(relative(root, path).replaceAll('\\', '/'))
  }
}

walk(srcRoot)

if (changed.length === 0) {
  console.log('Nenhum landmark main-content duplicado encontrado.')
  process.exit(0)
}

console.log(`Landmarks duplicados removidos de ${changed.length} arquivo(s):`)
for (const file of changed) console.log(`- ${file}`)
