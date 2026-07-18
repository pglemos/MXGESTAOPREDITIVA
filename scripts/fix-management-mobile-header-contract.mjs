import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'src/test/module-design-system-authenticated-visual.playwright.ts')
const before = fs.readFileSync(file, 'utf8')

const legacyContract = `  if (profile.key !== 'gerente') {
    expect(metrics.pageHeader).toMatchObject({
      backgroundColor: 'rgb(255, 255, 255)',
      borderRadius: '16px',
    })
    expect(metrics.pageHeader?.borderColor).not.toBe('rgba(0, 0, 0, 0)')
    expect(metrics.pageHeader?.boxShadow).not.toBe('none')
  }`

const responsiveContract = `  expect(metrics.pageHeader).toMatchObject({
    backgroundColor: 'rgb(255, 255, 255)',
    borderRadius: viewport.name === 'mobile' ? '0px' : '16px',
  })
  expect(metrics.pageHeader?.borderColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(metrics.pageHeader?.boxShadow).not.toBe('none')`

if (!before.includes(legacyContract)) {
  if (before.includes(responsiveContract)) {
    console.log('Responsive management header contract is already applied.')
    process.exit(0)
  }
  throw new Error('Expected legacy mobile header contract was not found.')
}

fs.writeFileSync(file, before.replace(legacyContract, responsiveContract))
console.log('Responsive management header contract applied.')
