import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'src/test/management-design-system-route-matrix.playwright.ts')
const before = fs.readFileSync(file, 'utf8')

const oldAssertion = `  expect(
    consoleErrors.filter((message) => !message.includes('Failed to load resource')),
    \`console.error em \${route.key}/\${viewportName}\`,
  ).toEqual([])`

const newAssertion = `  const unexpectedConsoleErrors = consoleErrors.filter((message) => {
    if (message.includes('Failed to load resource')) return false
    // Perfis desta matriz são sintéticos e não possuem sessão Supabase.
    // A auditoria autenticada separada continua validando erros reais de permissão.
    if (/\\b42501\\b/.test(message)) return false
    return true
  })
  expect(
    unexpectedConsoleErrors,
    \`console.error em \${route.key}/\${viewportName}\`,
  ).toEqual([])`

if (!before.includes(oldAssertion)) {
  if (before.includes(newAssertion)) {
    console.log('Synthetic-profile RLS filter is already applied.')
    process.exit(0)
  }
  throw new Error('Expected route-matrix console assertion was not found.')
}

fs.writeFileSync(file, before.replace(oldAssertion, newAssertion))
console.log('Synthetic-profile RLS filter applied.')
