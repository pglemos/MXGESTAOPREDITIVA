import { describe, expect, test } from 'bun:test'
import { buildStoreSalesRules } from './storeSalesRules'

describe('buildStoreSalesRules', () => {
  test('normalizes partial store meta rules with explicit monthly goal', () => {
    const rules = buildStoreSalesRules({
      storeId: 'store-1',
      monthlyGoal: 42,
      metaRules: {
        projection_mode: 'business',
        individual_goal_mode: 'weighted',
        bench_lead_agd: 25,
      },
    })

    expect(rules.store_id).toBe('store-1')
    expect(rules.monthly_goal).toBe(42)
    expect(rules.projection_mode).toBe('business')
    expect(rules.individual_goal_mode).toBe('weighted')
    expect(rules.bench_lead_agd).toBe(25)
    expect(rules.bench_agd_visita).toBe(60)
    expect(rules.bench_visita_vnd).toBe(33)
  })

  test('uses safe defaults when no persisted meta rules are available', () => {
    const rules = buildStoreSalesRules({ monthlyGoal: 0 })

    expect(rules.store_id).toBe('')
    expect(rules.monthly_goal).toBe(0)
    expect(rules.projection_mode).toBe('calendar')
    expect(rules.individual_goal_mode).toBe('even')
  })
})
