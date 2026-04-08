import { describe, it, expect } from 'bun:test'
import { calcularAtingimento, calcularFunil } from './calculations'
import type { DailyCheckin } from '@/types/database'

describe('calcularAtingimento', () => {
  it('should calculate standard attainment percentage', () => {
    expect(calcularAtingimento(50, 100)).toBe(50)
    expect(calcularAtingimento(25, 100)).toBe(25)
  })

  it('should round to 1 decimal place', () => {
    // 1 / 3 = 0.3333... -> 33.333...% -> rounded to 33.3
    expect(calcularAtingimento(1, 3)).toBe(33.3)
    // 2 / 3 = 0.6666... -> 66.666...% -> rounded to 66.7
    expect(calcularAtingimento(2, 3)).toBe(66.7)
  })

  it('should handle overachievement (sales > target)', () => {
    expect(calcularAtingimento(150, 100)).toBe(150)
    expect(calcularAtingimento(200, 100)).toBe(200)
  })

  it('should return 0 when sales are 0', () => {
    expect(calcularAtingimento(0, 100)).toBe(0)
  })

  it('should return 0 when target is 0 (prevent division by zero)', () => {
    expect(calcularAtingimento(50, 0)).toBe(0)
  })

  it('should return 0 when target is negative', () => {
    expect(calcularAtingimento(50, -10)).toBe(0)
  })
})

describe('calcularFunil', () => {
  it('should return all zeros for an empty array of checkins', () => {
    const result = calcularFunil([])
    expect(result).toEqual({
      leads: 0,
      agd_total: 0,
      visitas: 0,
      vnd_total: 0,
      tx_lead_agd: 0,
      tx_agd_visita: 0,
      tx_visita_vnd: 0,
    })
  })

  it('should correctly calculate funnel metrics for a single checkin', () => {
    const checkin = {
      leads_prev_day: 10,
      agd_cart_prev_day: 2,
      agd_net_prev_day: 3,
      visit_prev_day: 4,
      vnd_porta_prev_day: 1,
      vnd_cart_prev_day: 0,
      vnd_net_prev_day: 1,
    } as DailyCheckin

    const result = calcularFunil([checkin])
    expect(result).toEqual({
      leads: 10,
      agd_total: 5,     // 2 + 3
      visitas: 4,       // 4
      vnd_total: 2,     // 1 + 0 + 1
      tx_lead_agd: 50,  // (5 / 10) * 100
      tx_agd_visita: 80,// (4 / 5) * 100
      tx_visita_vnd: 50,// (2 / 4) * 100
    })
  })

  it('should sum up values from multiple checkins correctly', () => {
    const checkin1 = {
      leads_prev_day: 10,
      agd_cart_prev_day: 2,
      agd_net_prev_day: 2,
      visit_prev_day: 3,
      vnd_porta_prev_day: 1,
    } as DailyCheckin

    const checkin2 = {
      leads_prev_day: 15,
      agd_cart_prev_day: 1,
      agd_net_prev_day: 5,
      visit_prev_day: 5,
      vnd_net_prev_day: 3,
    } as DailyCheckin

    const result = calcularFunil([checkin1, checkin2])
    expect(result).toEqual({
      leads: 25,          // 10 + 15
      agd_total: 10,      // (2+2) + (1+5)
      visitas: 8,         // 3 + 5
      vnd_total: 4,       // 1 + 3
      tx_lead_agd: 40,    // (10 / 25) * 100
      tx_agd_visita: 80,  // (8 / 10) * 100
      tx_visita_vnd: 50,  // (4 / 8) * 100
    })
  })

  it('should handle undefined properties without NaN', () => {
    // A checkin missing some numeric properties should default to 0 for them.
    const partialCheckin = {
      leads_prev_day: 20,
      visit_prev_day: 5,
    } as DailyCheckin

    const result = calcularFunil([partialCheckin])
    expect(result).toEqual({
      leads: 20,
      agd_total: 0,
      visitas: 5,
      vnd_total: 0,
      tx_lead_agd: 0,
      tx_agd_visita: 0,
      tx_visita_vnd: 0,
    })
  })

  it('should correctly round conversion rates to the nearest integer', () => {
    const checkin = {
      leads_prev_day: 3,
      agd_cart_prev_day: 1, // 1/3 = 33.33...
      visit_prev_day: 1,    // 1/1 = 100 (but to make fraction: agd=3, visit=2 => 66.6...)
      vnd_porta_prev_day: 1,
    } as DailyCheckin

    const result1 = calcularFunil([checkin])
    expect(result1.tx_lead_agd).toBe(33) // Math.round(33.333...) = 33

    const checkin2 = {
      leads_prev_day: 10,
      agd_net_prev_day: 7, // tx_lead_agd = 70%
      visit_prev_day: 4,   // 4/7 = 57.14... -> 57%
      vnd_net_prev_day: 3, // 3/4 = 75%
    } as DailyCheckin

    const result2 = calcularFunil([checkin2])
    expect(result2.tx_agd_visita).toBe(57) // Math.round(57.14...)
    expect(result2.tx_visita_vnd).toBe(75)

    const checkin3 = {
      leads_prev_day: 20,
      agd_net_prev_day: 13, // 13/20 = 65%
      visit_prev_day: 11,   // 11/13 = 84.6... -> 85%
      vnd_net_prev_day: 0,  // 0%
    } as DailyCheckin

    const result3 = calcularFunil([checkin3])
    expect(result3.tx_agd_visita).toBe(85) // math.round(84.6...)
  })

  it('should handle division by zero safely when denominators are zero but numerators are somehow positive', () => {
    // If we have visits but 0 agendamentos, tx_agd_visita should be 0 because agd_total is 0
    const checkin = {
      leads_prev_day: 0,
      agd_cart_prev_day: 0,
      visit_prev_day: 5,
      vnd_porta_prev_day: 2,
    } as DailyCheckin

    const result = calcularFunil([checkin])
    expect(result.tx_lead_agd).toBe(0) // leads = 0
    expect(result.tx_agd_visita).toBe(0) // agd = 0
    // But tx_visita_vnd should work because visitas is 5
    expect(result.tx_visita_vnd).toBe(40) // (2 / 5) * 100
  })
})
