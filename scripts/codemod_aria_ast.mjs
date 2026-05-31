// Codemod a11y via TypeScript Compiler API (parser real de JSX).
// Para cada <Input/Select/Textarea/input/select/textarea> sem nome acessível,
// extrai o rótulo do elemento-irmão anterior (Typography/span/label/p/hN) e
// insere aria-label="<rótulo>" de forma cirúrgica (sem reformatar o arquivo).
// Uso: node scripts/codemod_aria_ast.mjs [--write]
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import ts from 'typescript'

const WRITE = process.argv.includes('--write')
const files = execSync("grep -rln -E '<(Input|Select|Textarea|input|select|textarea)[ >]' src --include='*.tsx'", { encoding: 'utf8' }).trim().split('\n').filter(Boolean)

const CONTROLS = new Set(['Input', 'Select', 'Textarea', 'input', 'select', 'textarea'])
const LABELS = new Set(['Typography', 'span', 'label', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'])
let applied = 0, skipped = 0
const samples = []

function tagText(node) {
  const t = node.tagName
  return t && ts.isIdentifier(t) ? t.text : ''
}
function attrNames(opening) {
  return opening.attributes.properties.map(p => (p.name && ts.isIdentifier(p.name) ? p.name.text : '')).filter(Boolean)
}
function typeAttrValue(opening) {
  for (const p of opening.attributes.properties) {
    if (ts.isJsxAttribute(p) && p.name.text === 'type' && p.initializer && ts.isStringLiteral(p.initializer)) return p.initializer.text
  }
  return null
}
// extrai texto puro de um JSXElement de label (só JSXText, ignora {expr} e ícones)
function extractLabel(node) {
  if (!node || !(ts.isJsxElement(node))) return null
  let txt = ''
  for (const c of node.children) {
    if (ts.isJsxText(c)) txt += c.text
    else if (ts.isJsxElement(c) || ts.isJsxSelfClosingElement(c)) continue // ícone/aninhado: ignora
    else if (ts.isJsxExpression(c)) return null // tem {expr}: rótulo dinâmico, não usar
  }
  txt = txt.replace(/\s+/g, ' ').trim()
  if (txt.length < 2 || /^[\d\W]+$/.test(txt) || txt.length > 50) return null
  return txt
}

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const inserts = [] // {pos, text}
  const visit = (node) => {
    let opening = null, isSelf = false
    if (ts.isJsxSelfClosingElement(node)) { opening = node; isSelf = true }
    else if (ts.isJsxElement(node)) opening = node.openingElement
    if (opening && CONTROLS.has(tagText(opening))) {
      const names = attrNames(opening)
      const ty = typeAttrValue(opening)
      const hasName = names.includes('aria-label') || names.includes('aria-labelledby') || names.includes('placeholder')
      const skipType = ty && ['hidden', 'checkbox', 'radio', 'submit'].includes(ty)
      if (!hasName && !skipType) {
        // achar irmão anterior label-like
        const target = isSelf ? node : node
        const parent = target.parent
        let label = null
        if (parent && (ts.isJsxElement(parent) || ts.isJsxFragment(parent))) {
          const kids = parent.children
          const idx = kids.indexOf(target)
          for (let i = idx - 1; i >= 0; i--) {
            const k = kids[i]
            if (ts.isJsxText(k) && !k.text.trim()) continue
            if (ts.isJsxElement(k) && LABELS.has(tagText(k.openingElement))) { label = extractLabel(k); break }
            break
          }
        }
        if (label) {
          // posição: logo após o nome da tag (tagName.end)
          inserts.push({ pos: opening.tagName.end, text: ` aria-label="${label.replace(/"/g, '')}"` })
          applied++
          if (samples.length < 10) samples.push(`${f.split('/').pop()}: "${label}"`)
        } else skipped++
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  if (inserts.length && WRITE) {
    let out = src
    inserts.sort((a, b) => b.pos - a.pos) // do fim para o início
    for (const ins of inserts) out = out.slice(0, ins.pos) + ins.text + out.slice(ins.pos)
    writeFileSync(f, out)
  }
}
console.log(`${WRITE ? 'APLICADO' : 'DRY-RUN'}: ${applied} aria-labels, ${skipped} pulados (sem rótulo estático)`)
samples.forEach(s => console.log('  ' + s))
