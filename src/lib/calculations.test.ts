import { describe, it, expect } from 'bun:test'
import { calcularAtingimento, calcularTotais } from './calculations'

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

describe('calcularTotais', () => {
  it('should calculate correctly for CheckinFormData (has leads)', () => {
    const formData = {
      leads: 10,
      agd_cart: 5,
      agd_net: 3,
      vnd_porta: 2,
      vnd_cart: 1,
      vnd_net: 4,
    } as any // using any to bypass full type requirement for this specific test

    const result = calcularTotais(formData)
    expect(result).toEqual({
      agd_total: 8, // 5 + 3
      vnd_total: 7, // 2 + 1 + 4
    })
  })

  it('should handle missing values for CheckinFormData', () => {
    const formData = {
      leads: 5,
      agd_cart: undefined,
      agd_net: 2,
      vnd_porta: undefined,
      vnd_cart: undefined,
      vnd_net: undefined,
    } as any

    const result = calcularTotais(formData)
    expect(result).toEqual({
      agd_total: 2,
      vnd_total: 0,
    })
  })

  it('should calculate correctly for DailyCheckin (no leads)', () => {
    const dailyCheckin = {
      agd_cart_today: 4,
      agd_net_today: 6,
      vnd_porta_prev_day: 1,
      vnd_cart_prev_day: 2,
      vnd_net_prev_day: 3,
    } as any

    const result = calcularTotais(dailyCheckin)
    expect(result).toEqual({
      agd_total: 10, // 4 + 6
      vnd_total: 6,  // 1 + 2 + 3
    })
  })

  it('should handle missing values for DailyCheckin', () => {
    const dailyCheckin = {
      agd_cart_today: undefined,
      agd_net_today: 5,
      vnd_porta_prev_day: undefined,
      vnd_cart_prev_day: undefined,
      vnd_net_prev_day: undefined,
    } as any

    const result = calcularTotais(dailyCheckin)
    expect(result).toEqual({
      agd_total: 5,
      vnd_total: 0,
    })
  })

  it('should handle empty object as DailyCheckin', () => {
    const result = calcularTotais({})
    expect(result).toEqual({
      agd_total: 0,
      vnd_total: 0,
    })
  })
})
