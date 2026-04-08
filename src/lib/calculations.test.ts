import { describe, it, expect } from 'bun:test'
import { calcularAtingimento, calcularProjecao } from './calculations'

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

describe('calcularProjecao', () => {
  it('should calculate standard projection correctly', () => {
    // (10 sales / 5 elapsed days) * 30 total days = 60
    expect(calcularProjecao(10, 5, 30)).toBe(60)
    // (15 sales / 10 elapsed days) * 20 total days = 30
    expect(calcularProjecao(15, 10, 20)).toBe(30)
  })

  it('should correctly round the result to the nearest integer', () => {
    // (11 / 7) * 30 = 47.14... -> 47
    expect(calcularProjecao(11, 7, 30)).toBe(47)
    // (13 / 7) * 30 = 55.71... -> 56
    expect(calcularProjecao(13, 7, 30)).toBe(56)
  })

  it('should return 0 when elapsed days are 0 (prevent division by zero)', () => {
    expect(calcularProjecao(10, 0, 30)).toBe(0)
  })

  it('should return 0 when elapsed days are negative', () => {
    expect(calcularProjecao(10, -5, 30)).toBe(0)
  })

  it('should return 0 when sales are 0', () => {
    expect(calcularProjecao(0, 15, 30)).toBe(0)
  })

  it('should return 0 when total days are 0', () => {
    expect(calcularProjecao(10, 15, 0)).toBe(0)
  })
})
