import { describe, expect, it } from 'vitest'
import type { CheckinWithTotals } from '@/types/database'
import { averageDiscipline, buildClosingSummary, buildDisciplineTrend, formatClosingMetric, sumNumericMetrics } from './manager-closing-metrics'

const checkin = (values: Partial<CheckinWithTotals>): CheckinWithTotals => values as CheckinWithTotals

describe('manager closing metrics', () => {
  it('calcula a disciplina diária sem inventar valor em dias vazios', () => {
    const trend = buildDisciplineTrend([
      checkin({ reference_date: '2026-07-10', pontuacao_disciplina_final: 80 }),
      checkin({ reference_date: '2026-07-10', pontuacao_disciplina_final: 100 }),
    ], '2026-07-09', '2026-07-11')

    expect(trend.map(point => point.value)).toEqual([null, 90, null])
    expect(averageDiscipline([])).toBeNull()
  })

  it('resume somente campos oficiais disponíveis por canal', () => {
    const summary = buildClosingSummary([
      checkin({
        visitas_porta_prev_day: 2,
        leads_prev_day: 3,
        visitas_cart_prev_day: 1,
        leads_net_prev_day: 4,
        visitas_net_prev_day: 2,
        vnd_porta_prev_day: 1,
        vnd_cart_prev_day: 2,
        vnd_net_prev_day: 1,
      }),
    ])

    expect(summary).toEqual({ showroomVisits: 2, carteiraLeads: 3, carteiraVisits: 1, internetLeads: 4, internetVisits: 2, sales: 4 })
  })

  it('não transforma ausência de fechamento em zero visual', () => {
    expect(formatClosingMetric(0, false)).toBe('—')
    expect(formatClosingMetric(0, true)).toBe('0')
    expect(formatClosingMetric(3, true)).toBe('3')
    expect(buildClosingSummary([])).toEqual({
      showroomVisits: null,
      carteiraLeads: null,
      carteiraVisits: null,
      internetLeads: null,
      internetVisits: null,
      sales: null,
    })
  })

  it('sanitiza campos ausentes ou não numéricos antes de somar', () => {
    expect(sumNumericMetrics(2, Number.NaN, undefined, '3')).toBe(2)
  })
})
