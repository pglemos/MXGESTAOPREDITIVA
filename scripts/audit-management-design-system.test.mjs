import assert from 'node:assert/strict'
import test from 'node:test'
import { auditManagementDesignSystem, auditText } from './audit-management-design-system.mjs'

test('detecta tokens e wrappers legados em uma superfície de gestão', () => {
  const violations = auditText(`
    <section className="rounded-mx-2xl shadow-mx-lg bg-surface-alt text-text-primary p-mx-lg mxds-page-frame" />
  `)
  assert.deepEqual(
    new Set(violations.map((violation) => violation.rule)),
    new Set([
      'legacy-radius',
      'legacy-shadow',
      'legacy-spacing',
      'legacy-text-token',
      'legacy-surface-token',
      'legacy-wrapper',
    ]),
  )
})

test('todas as dependências exclusivas das rotas de gestão estão livres de legado visual', () => {
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
