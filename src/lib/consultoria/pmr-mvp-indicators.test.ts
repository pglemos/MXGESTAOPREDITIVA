import { describe, expect, test } from 'bun:test'
import {
  buildLatestTargetByMetric,
  buildPreviousYearResultByMetric,
  getPmrMvpIndicator,
  isPmrMvpIndicator,
  PMR_MVP_INDICATORS,
  sortByPmrMvpOrder,
} from './pmr-mvp-indicators'

describe('pmr mvp indicators', () => {
  test('defines the MVP indicator cut with required meeting topics', () => {
    const keys = PMR_MVP_INDICATORS.map((indicator) => indicator.metric_key)

    expect(keys).toContain('sales_total')
    expect(keys).toContain('leads_received')
    expect(keys).toContain('appointments')
    expect(keys).toContain('visits')
    expect(keys).toContain('internet_cost_per_sale')
    expect(keys).toContain('stock_total')
    expect(keys).toContain('trade_in_volume')
    expect(PMR_MVP_INDICATORS.length).toBe(16)
  })

  test('sorts rows by MVP order and identifies backlog source', () => {
    expect(isPmrMvpIndicator('avg_margin')).toBe(true)
    expect(isPmrMvpIndicator('random_metric')).toBe(false)
    expect(getPmrMvpIndicator('trade_in_volume')?.mvp_status).toBe('backlog')
    expect(sortByPmrMvpOrder([{ metric_key: 'avg_margin' }, { metric_key: 'sales_total' }])[0].metric_key).toBe('sales_total')
  })

  test('selects latest target by metric', () => {
    const targets = buildLatestTargetByMetric([
      { id: '1', client_id: 'c', metric_key: 'sales_total', reference_month: '2026-03-01', target_value: 20, source: 'manual' },
      { id: '2', client_id: 'c', metric_key: 'sales_total', reference_month: '2026-04-01', target_value: 25, source: 'manual' },
    ])

    expect(targets.get('sales_total')?.target_value).toBe(25)
  })

  test('finds previous year result for the same metric and month-day', () => {
    const previous = buildPreviousYearResultByMetric([
      { id: '1', client_id: 'c', metric_key: 'sales_total', reference_date: '2025-04-01', result_value: 18, source: 'manual', source_payload: {} },
      { id: '2', client_id: 'c', metric_key: 'sales_total', reference_date: '2026-04-01', result_value: 25, source: 'manual', source_payload: {} },
    ])

    expect(previous.get('sales_total')?.result_value).toBe(18)
  })
})
