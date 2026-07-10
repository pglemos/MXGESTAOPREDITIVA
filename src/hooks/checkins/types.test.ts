import { describe, expect, test } from 'bun:test'

describe('validateCheckinSubmissionDate', () => {
  test('aceita D0 antes de 12h quando o contexto ativo já liberou D0', async () => {
    const { validateCheckinSubmissionDate } = await import('./types.ts?cb=1')
    expect(validateCheckinSubmissionDate('2026-07-10', '2026-07-10', 'daily', '2026-07-10')).toBeNull()
  })

  test('rejeita D0 enquanto D-1 ainda é a data operacional ativa', async () => {
    const { validateCheckinSubmissionDate } = await import('./types.ts?cb=2')
    expect(validateCheckinSubmissionDate('2026-07-10', '2026-07-09', 'daily', '2026-07-10')).toBe(
      'Registro diário aceita somente a data operacional ativa. Use o histórico para datas retroativas.',
    )
  })

  test('rejeita qualquer data futura', async () => {
    const { validateCheckinSubmissionDate } = await import('./types.ts?cb=3')
    expect(validateCheckinSubmissionDate('2026-07-11', '2026-07-10', 'daily', '2026-07-10')).toBe(
      'Lançamentos não podem usar data futura.',
    )
  })
})
