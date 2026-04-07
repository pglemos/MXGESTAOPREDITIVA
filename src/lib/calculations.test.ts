import { describe, it, expect } from 'bun:test'
import { calcularAtingimento } from './calculations'

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
