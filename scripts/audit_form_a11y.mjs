// Auditoria de a11y de formulários: encontra controles (Input/Select/Textarea e
// nativos) sem nome acessível (aria-label / aria-labelledby / placeholder) na
// própria tag. Heurística estática — candidatos a revisão, não veredito final.
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { execSync } from 'node:child_process'

const files = execSync("grep -rln -E '<(Input|Select|Textarea|input|select|textarea)[ >]' src --include='*.tsx'", { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean)

const TAG = /<(Input|Select|Textarea|input|select|textarea)(\s[^>]*?)?\/?>/gs
let total = 0
const perFile = {}
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  let m
  while ((m = TAG.exec(src)) !== null) {
    const attrs = m[2] || ''
    // tem nome acessível?
    const hasName = /aria-label[=}]|aria-labelledby[=}]|placeholder[=}]|type=["']hidden["']|type=["']checkbox["']|type=["']radio["']|type=["']submit["']/.test(attrs)
    if (!hasName) {
      perFile[f] = (perFile[f] || 0) + 1
      total++
    }
  }
}
const sorted = Object.entries(perFile).sort((a, b) => b[1] - a[1])
console.log(`Controles sem nome acessível (candidatos): ${total} em ${sorted.length} arquivos`)
console.log('Top 15 arquivos:')
for (const [f, n] of sorted.slice(0, 15)) console.log(`  ${n}\t${f}`)
