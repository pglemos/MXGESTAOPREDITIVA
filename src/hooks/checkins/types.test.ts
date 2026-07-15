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

describe('isCheckinLateForReferenceDate', () => {
  // America/Sao_Paulo é UTC-3 o ano todo (sem horário de verão): 12:00 SP = 15:00 UTC.
  test('11:59 SP de reference_date + 1 dia ainda é no prazo', async () => {
    const { isCheckinLateForReferenceDate } = await import('./types.ts?cb=4')
    const submittedAt = new Date('2026-07-10T14:59:00.000Z')
    expect(isCheckinLateForReferenceDate('2026-07-09', submittedAt)).toBe(false)
  })

  test('exatamente 12:00 SP de reference_date + 1 dia ainda é no prazo', async () => {
    const { isCheckinLateForReferenceDate } = await import('./types.ts?cb=5')
    const submittedAt = new Date('2026-07-10T15:00:00.000Z')
    expect(isCheckinLateForReferenceDate('2026-07-09', submittedAt)).toBe(false)
  })

  test('12:01 SP de reference_date + 1 dia já é tardio', async () => {
    const { isCheckinLateForReferenceDate } = await import('./types.ts?cb=6')
    const submittedAt = new Date('2026-07-10T15:01:00.000Z')
    expect(isCheckinLateForReferenceDate('2026-07-09', submittedAt)).toBe(true)
  })

  test('09:31 SP do próprio reference_date não é tardio (09:30 é só o snapshot da Agenda D+1)', async () => {
    const { isCheckinLateForReferenceDate } = await import('./types.ts?cb=7')
    const submittedAt = new Date('2026-07-09T12:31:00.000Z')
    expect(isCheckinLateForReferenceDate('2026-07-09', submittedAt)).toBe(false)
  })

  test('atravessa virada de mês corretamente (31/07 + 1 dia = 01/08)', async () => {
    const { isCheckinLateForReferenceDate } = await import('./types.ts?cb=8')
    const onTime = new Date('2026-08-01T14:59:00.000Z')
    const late = new Date('2026-08-01T15:01:00.000Z')
    expect(isCheckinLateForReferenceDate('2026-07-31', onTime)).toBe(false)
    expect(isCheckinLateForReferenceDate('2026-07-31', late)).toBe(true)
  })
})

// MX-22.5 (AC-7/AC-8; Spec §11.2 "às 09:31 é criado o snapshot oficial da
// agenda e da Disciplina"): mesma régua de 09:30 (CHECKIN_DEADLINE_MINUTES)
// já usada para o Fechamento, sem inventar um segundo corte de horário.
describe('isAfterAgendaD1SnapshotCutoff', () => {
  // America/Sao_Paulo é UTC-3 o ano todo: 09:30 SP = 12:30 UTC.
  test('09:30 SP ainda permite ajuste livre da Agenda D+1', async () => {
    const { isAfterAgendaD1SnapshotCutoff } = await import('./types.ts?cb=9')
    expect(isAfterAgendaD1SnapshotCutoff(new Date('2026-07-10T12:30:00.000Z'))).toBe(false)
  })

  test('09:31 SP já é depois do snapshot oficial', async () => {
    const { isAfterAgendaD1SnapshotCutoff } = await import('./types.ts?cb=10')
    expect(isAfterAgendaD1SnapshotCutoff(new Date('2026-07-10T12:31:00.000Z'))).toBe(true)
  })

  test('12:00 SP (limite do Fechamento) também é depois do snapshot da Agenda', async () => {
    const { isAfterAgendaD1SnapshotCutoff } = await import('./types.ts?cb=11')
    expect(isAfterAgendaD1SnapshotCutoff(new Date('2026-07-10T15:00:00.000Z'))).toBe(true)
  })
})
