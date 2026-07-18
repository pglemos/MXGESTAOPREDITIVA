import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'

const required = [
  'packages/mx-tokens/package.json',
  'packages/mx-tokens/src/theme.css',
  'packages/mx-tailwind-preset/package.json',
  'packages/mx-interactions/package.json',
  'packages/mx-ui/package.json',
  'packages/mx-ui/src/index.jsx',
  'src/design-system/internal-mx/MxInternalShell.tsx',
  'src/design-system/internal-mx/internalMxNavigation.tsx',
]

for (const file of required) await access(file)

const manifests = await Promise.all([
  'packages/mx-tokens/package.json',
  'packages/mx-tailwind-preset/package.json',
  'packages/mx-interactions/package.json',
  'packages/mx-ui/package.json',
].map(async (file) => JSON.parse(await readFile(file, 'utf8'))))

if (manifests.some((manifest) => manifest.version !== '1.1.1')) {
  throw new Error('Todos os pacotes MX devem permanecer na versão 1.1.1.')
}

const source = await Promise.all(required.map((file) => readFile(file)))
const digest = createHash('sha256').update(Buffer.concat(source)).digest('hex')
console.log(JSON.stringify({
  ok: true,
  manifests: manifests.map(({ name, version }) => `${name}@${version}`),
  digest,
}, null, 2))
