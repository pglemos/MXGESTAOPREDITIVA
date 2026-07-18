import assert from 'node:assert/strict'
import test from 'node:test'
import { auditManagementDesignSystem, auditText } from './audit-management-design-system.mjs'

test('detecta tokens e wrappers legados em uma superfície de gestão', () => {
  const violations = auditText(`
    <section className="rounded-mx-2xl shadow-mx-lg bg-surface-alt text-text-primary p-mx-lg mxds-page-frame border-mx-emerald-100 [top:var(--spacing-mx-layout-offset-top)]" />
  `)
  const rules = new Set(violations.map((violation) => violation.rule))
  for (const expectedRule of [
    'legacy-radius',
    'legacy-shadow',
    'legacy-spacing',
    'legacy-text-token',
    'legacy-surface-token',
    'legacy-wrapper',
    'legacy-custom-utility',
    'legacy-css-variable',
  ]) {
    assert.equal(rules.has(expectedRule), true, `Regra ausente: ${expectedRule}`)
  }
})

test('ignora somente o ramo vendedor explicitamente delimitado', () => {
  const violations = auditText(`
    /* management-audit:seller-only-start */
    const seller = 'rounded-mx-2xl bg-brand-primary p-mx-lg'
    /* management-audit:seller-only-end */
    const manager = 'rounded-2xl bg-emerald-600 p-4'
  `)
  assert.deepEqual(violations, [])
})

test('continua detectando legado fora do ramo vendedor delimitado', () => {
  const violations = auditText(`
    /* management-audit:seller-only-start */
    const seller = 'rounded-mx-2xl'
    /* management-audit:seller-only-end */
    const manager = 'bg-brand-primary'
  `)
  assert.equal(violations.some((violation) => violation.rule === 'legacy-brand-action'), true)
})

test('todas as dependências das rotas de gestão estão livres de legado visual ativo', () => {
  const report = auditManagementDesignSystem()
  assert.equal(
    report.violations.length,
    0,
    `Foram encontradas ${report.violations.length} violações. Primeiras ocorrências:\n${report.violations
      .slice(0, 30)
      .map((violation) => `${violation.file}:${violation.line} ${violation.rule} ${violation.token}`)
      .join('\n')}`,
  )
})
