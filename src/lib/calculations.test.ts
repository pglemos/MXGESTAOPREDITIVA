import { describe, it, expect } from 'bun:test'
import { calcularAtingimento } from './calculations'

describe('calcularAtingimento', () => {
    it('should calculate the percentage correctly for exact divisions', () => {
        expect(calcularAtingimento(50, 100)).toBe(50)
        expect(calcularAtingimento(100, 100)).toBe(100)
    })

    it('should round correctly to one decimal place', () => {
        // (33 / 100) * 100 = 33
        expect(calcularAtingimento(33, 100)).toBe(33)
        // (1 / 3) * 100 = 33.333... -> rounded to 33.3
        expect(calcularAtingimento(1, 3)).toBe(33.3)
        // (2 / 3) * 100 = 66.666... -> rounded to 66.7
        expect(calcularAtingimento(2, 3)).toBe(66.7)
    })

    it('should return 0 when meta is 0 (avoid division by zero)', () => {
        expect(calcularAtingimento(50, 0)).toBe(0)
    })

    it('should return 0 when meta is negative', () => {
        expect(calcularAtingimento(50, -10)).toBe(0)
    })

    it('should handle over-achievement (vendas > meta)', () => {
        expect(calcularAtingimento(150, 100)).toBe(150)
        expect(calcularAtingimento(200, 100)).toBe(200)
    })

    it('should handle 0 vendas', () => {
        expect(calcularAtingimento(0, 100)).toBe(0)
    })
})
