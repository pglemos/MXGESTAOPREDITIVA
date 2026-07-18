import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'src/test/management-design-system-route-matrix.playwright.ts')
const before = fs.readFileSync(file, 'utf8')

const helperMarker = `async function auditRenderedSurface(page: Page) {`
const helper = `async function installSyntheticSupabaseMocks(page: Page) {
  await page.route(/https:\\/\\/[^/]+\\.supabase\\.co\\/rest\\/v1\\/.*/, async (route) => {
    const request = route.request()
    const accept = request.headers()['accept'] || ''
    const expectsObject = accept.includes('application/vnd.pgrst.object+json')
    const isHead = request.method() === 'HEAD'

    await route.fulfill({
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-range': '0-0/0',
      },
      body: isHead ? '' : expectsObject ? '{}' : '[]',
    })
  })

  await page.route(/https:\\/\\/[^/]+\\.supabase\\.co\\/functions\\/v1\\/.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    })
  })
}

`

const callMarker = `  await installProfile(page, role)
  await page.goto(route.path, { waitUntil: 'domcontentloaded' })`
const callReplacement = `  await installSyntheticSupabaseMocks(page)
  await installProfile(page, role)
  await page.goto(route.path, { waitUntil: 'domcontentloaded' })`

let after = before
if (!after.includes('async function installSyntheticSupabaseMocks')) {
  if (!after.includes(helperMarker)) throw new Error('Route-matrix helper marker not found.')
  after = after.replace(helperMarker, helper + helperMarker)
}
if (!after.includes('await installSyntheticSupabaseMocks(page)')) {
  if (!after.includes(callMarker)) throw new Error('Route-matrix audit call marker not found.')
  after = after.replace(callMarker, callReplacement)
}

if (after === before) {
  console.log('Synthetic Supabase visual mocks are already installed.')
  process.exit(0)
}

fs.writeFileSync(file, after)
console.log('Synthetic Supabase visual mocks installed.')
