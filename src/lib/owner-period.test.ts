import { describe, expect, test } from 'bun:test'
import { countOwnerProjectionDays, resolveOwnerPeriodGoal, resolveOwnerPeriodRange } from './owner-period'

describe('Dono — intervalos do seletor de período', () => {
  const now = new Date(2026, 6, 22, 12, 0, 0)

  test('mês começa no primeiro dia local e termina na data de referência', () => {
    expect(resolveOwnerPeriodRange('month', now)).toEqual({ start: '2026-07-01', end: '2026-07-22' })
  })

  test('trimestre e ano usam o início correto sem deslocamento UTC', () => {
    expect(resolveOwnerPeriodRange('quarter', now)).toEqual({ start: '2026-07-01', end: '2026-07-22' })
    expect(resolveOwnerPeriodRange('year', now)).toEqual({ start: '2026-01-01', end: '2026-07-22' })
  })

  test('período personalizado preserva exatamente as datas informadas', () => {
    expect(resolveOwnerPeriodRange('custom', now, '2026-07-05', '2026-07-10')).toEqual({
      start: '2026-07-05',
      end: '2026-07-10',
    })
  })

  test('intervalo personalizado inválido recua para mês seguro', () => {
    expect(resolveOwnerPeriodRange('custom', now, '2026-07-10', '2026-07-05')).toEqual({
      start: '2026-07-01',
      end: '2026-07-22',
    })
  })

  test('conta dias corridos ou operacionais de segunda a sábado', () => {
    expect(countOwnerProjectionDays('2026-07-05', '2026-07-10', 'calendar')).toBe(6)
    expect(countOwnerProjectionDays('2026-07-05', '2026-07-10', 'business')).toBe(5)
    expect(countOwnerProjectionDays('2026-07-10', '2026-07-05', 'business')).toBe(0)
  })

  test('dimensiona a meta mensal para trimestre, ano e recorte personalizado', () => {
    expect(resolveOwnerPeriodGoal(100, 'month')).toBe(100)
    expect(resolveOwnerPeriodGoal(100, 'quarter')).toBe(300)
    expect(resolveOwnerPeriodGoal(100, 'year')).toBe(1200)
    expect(resolveOwnerPeriodGoal(31, 'custom', { start: '2026-07-01', end: '2026-07-15' }, 'calendar')).toBe(15)
    expect(resolveOwnerPeriodGoal(27, 'custom', { start: '2026-07-01', end: '2026-07-15' }, 'business')).toBe(13)
  })
})
