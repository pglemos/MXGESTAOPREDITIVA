import { describe, expect, test } from 'bun:test'
import {
  buildDailyRoutineReminder,
  calculateDailyRoutineDiscipline,
  DAILY_ROUTINE_MVP_FIELDS,
  isProductionZero,
} from './daily-routine'

describe('daily routine helpers', () => {
  test('keeps the MVP fields tied to lancamentos_diarios', () => {
    expect(DAILY_ROUTINE_MVP_FIELDS.map((field) => field.key)).toEqual([
      'leads_prev_day',
      'agd_cart_prev_day',
      'agd_net_prev_day',
      'agd_cart_today',
      'agd_net_today',
      'visit_prev_day',
      'vnd_porta_prev_day',
      'vnd_cart_prev_day',
      'vnd_net_prev_day',
      'note',
      'zero_reason',
    ])
    expect(DAILY_ROUTINE_MVP_FIELDS.every((field) => field.source === 'lancamentos_diarios')).toBe(true)
  })

  test('detects production zero without mixing it with discipline', () => {
    expect(isProductionZero({
      leads_prev_day: 0,
      agd_cart_today: 0,
      agd_net_today: 0,
      visit_prev_day: 0,
      vnd_porta_prev_day: 0,
      vnd_cart_prev_day: 0,
      vnd_net_prev_day: 0,
    })).toBe(true)

    expect(isProductionZero({
      leads_prev_day: 1,
      agd_cart_today: 0,
      agd_net_today: 0,
      visit_prev_day: 0,
      vnd_porta_prev_day: 0,
      vnd_cart_prev_day: 0,
      vnd_net_prev_day: 0,
    })).toBe(false)
  })

  test('calculates seller discipline by daily submissions only', () => {
    const discipline = calculateDailyRoutineDiscipline({
      sellerId: 'seller-1',
      referenceDates: ['2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14'],
      checkins: [
        { seller_user_id: 'seller-1', reference_date: '2026-05-11', metric_scope: 'daily' },
        { seller_user_id: 'seller-1', reference_date: '2026-05-12', metric_scope: 'adjustment' },
        { seller_user_id: 'seller-1', reference_date: '2026-05-13', metric_scope: 'daily' },
        { seller_user_id: 'seller-2', reference_date: '2026-05-14', metric_scope: 'daily' },
      ],
    })

    expect(discipline).toEqual({
      expected_days: 4,
      submitted_days: 2,
      pending_days: 2,
      percentage: 50,
      status: 'attention',
      label: 'Disciplina em atencao',
    })
  })

  test('builds a stable reminder payload for one seller and date', () => {
    const reminder = buildDailyRoutineReminder({
      seller: { id: 'seller-1', name: 'Ana' },
      storeId: 'store-1',
      referenceDate: '2026-05-14',
    })

    expect(reminder.dedupe_key).toBe('daily-routine:store-1:seller-1:2026-05-14')
    expect(reminder.recipient_id).toBe('seller-1')
    expect(reminder.link).toBe('/lancamento-diario')
  })
})
