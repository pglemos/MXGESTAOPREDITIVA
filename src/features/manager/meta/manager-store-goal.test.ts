import { describe, expect, it } from 'vitest'
import {
  calculateStoreGoalMetrics,
  calculateSustainabilityPlan,
  formatStoreGoalMetric,
} from './manager-store-goal'

describe('calculateStoreGoalMetrics', () => {
  it('preserves the fractional proportional goal before deriving the pace gap', () => {
    const metrics = calculateStoreGoalMetrics(10, 3, { elapsed: 3, total: 8, remaining: 5 })

    expect(metrics.proportionalGoal).toBe(3.75)
    expect(metrics.paceGap).toBe(0.75)
    expect(metrics.projection).toBe(8)
    expect(metrics.gap).toBe(7)
    expect(metrics.dailyPace).toBe(1.4)
  })

  it('handles zero denominators without inventing a result', () => {
    expect(calculateStoreGoalMetrics(10, 2, { elapsed: 0, total: 0, remaining: 0 })).toEqual({
      proportionalGoal: 0,
      gap: 8,
      paceGap: 0,
      projection: 0,
      dailyPace: 0,
    })
  })

  it('formats only at the presentation boundary', () => {
    expect(formatStoreGoalMetric(3.75)).toBe('3,8')
    expect(formatStoreGoalMetric(4)).toBe('4')
  })
})

describe('calculateSustainabilityPlan', () => {
  const baseInput = {
    goal: 40,
    realized: 12,
    referenceDate: '2026-07-13',
    monthDays: { total: 27, elapsed: 12, remaining: 15 },
    closings: [
      { date: '2026-07-13', sales: 0, appointments: 0, visits: 0 },
    ],
    isOperationalDay: (date: Date) => date.getDay() !== 0,
  }

  it('builds the monthly plan from the official gap and remaining operational days', () => {
    const plan = calculateSustainabilityPlan({ ...baseInput, horizon: 'mes' })

    expect(plan.faltam).toBe(28)
    expect(plan.ritmo).toBeCloseTo(28 / 15)
    expect(plan.necessidadeOperacional).toBe(84)
    expect(plan.tipoOperacional).toBe('agendamentos')
    expect(plan.mensagemFoco).toContain('Foco do mês')
  })

  it('uses the horizon sales and an explicit operational conversion factor', () => {
    const plan = calculateSustainabilityPlan({
      ...baseInput,
      horizon: 'semana',
      closings: [
        { date: '2026-07-13', sales: 1, appointments: 3, visits: 1 },
      ],
      agendaPerSale: 3,
    })

    expect(plan.faltam).toBe(8)
    expect(plan.necessidadeOperacional).toBe(24)
    expect(plan.objectiveReached).toBe(false)
  })

  it('falls back to the official 3 appointments per sale reference when history has no conversion base', () => {
    const plan = calculateSustainabilityPlan({
      ...baseInput,
      horizon: 'hoje',
      closings: [],
    })

    expect(plan.necessidadeOperacional).toBe(6)
    expect(plan.tipoOperacional).toBe('agendamentos')
    expect(plan.hasStatisticalBase).toBe(false)
  })

  it('formats sub-one daily pace without rounding it to one sale per day', () => {
    const plan = calculateSustainabilityPlan({
      ...baseInput,
      horizon: 'mes',
      realized: 39,
      closings: [],
    })

    expect(plan.ritmo).toBeCloseTo(1 / 15)
    expect(plan.ritmoLabel).toBe('1 venda a cada 15 dias úteis')
  })
})
