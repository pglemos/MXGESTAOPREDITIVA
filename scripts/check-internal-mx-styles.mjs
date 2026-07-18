import { readFile, readdir } from 'node:fs/promises'

const allowedHexFiles = new Set(['packages/mx-tokens/src/theme.css', 'packages/mx-tokens/src/tokens.json'])
const roots = ['src/design-system/internal-mx', 'packages/mx-ui/src']
const files = []
for (const root of roots) {
  for (const name of await readdir(root)) {
    if (/\.(tsx?|jsx?|css)$/.test(name)) files.push(`${root}/${name}`)
  }
}

for (const file of files) {
  const content = await readFile(file, 'utf8')
  if (!allowedHexFiles.has(file) && /#[0-9a-f]{3,8}\b/i.test(content)) {
    throw new Error(`Cor hexadecimal fora dos tokens: ${file}`)
  }
  if (file.includes('packages/mx-ui') && /supabase|useAuth|react-router-dom/i.test(content)) {
    throw new Error(`Pacote UI acoplado ao produto: ${file}`)
  }
}
console.log(`OK: ${files.length} arquivos internos seguem os contratos de estilo e isolamento.`)
