import { describe, expect, test } from 'bun:test'
import { calcularLockStage } from './lock-stage'

// Especificação Funcional — Tela Fechamento Diário, §3.1-§3.3
describe('calcularLockStage', () => {
  const base = { selectedDate: '2026-06-25', yesterdaySP: '2026-06-25' }

  test('dentro do prazo (até 09h30) → on_time', () => {
    expect(calcularLockStage({ ...base, isPastDeadline: false, spHours: 9, spMinutes: 20 })).toBe('on_time')
  })

  test('09h31 → blocked (início da janela bloqueada)', () => {
    expect(calcularLockStage({ ...base, isPastDeadline: true, spHours: 9, spMinutes: 31 })).toBe('blocked')
  })

  test('11h59 → blocked (ainda dentro da janela bloqueada)', () => {
    expect(calcularLockStage({ ...base, isPastDeadline: true, spHours: 11, spMinutes: 59 })).toBe('blocked')
  })

  test('12h00 → blocked (limite exato ainda bloqueado, não discreto)', () => {
    expect(calcularLockStage({ ...base, isPastDeadline: true, spHours: 12, spMinutes: 0 })).toBe('blocked')
  })

  test('12h01 → discreet (spec §3.3: tela para de insistir)', () => {
    expect(calcularLockStage({ ...base, isPastDeadline: true, spHours: 12, spMinutes: 1 })).toBe('discreet')
  })

  test('18h00 (mesmo dia, bem depois do meio-dia) → discreet', () => {
    expect(calcularLockStage({ ...base, isPastDeadline: true, spHours: 18, spMinutes: 0 })).toBe('discreet')
  })

  test('mais de 1 dia de atraso (selectedDate !== yesterdaySP) → sempre discreet', () => {
    expect(
      calcularLockStage({
        isPastDeadline: true,
        selectedDate: '2026-06-20',
        yesterdaySP: '2026-06-25',
        spHours: 9,
        spMinutes: 35,
      }),
    ).toBe('discreet')
  })
})
