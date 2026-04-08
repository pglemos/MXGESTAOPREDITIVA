import { describe, expect, test } from 'bun:test'
import { calculateReferenceDate, canEditCurrentCheckin, isCheckinLate } from './useCheckins'

describe('MX check-in temporal rules', () => {
    test('uses previous day as reference before deadline', () => {
        expect(calculateReferenceDate(new Date(2026, 3, 7, 9, 0))).toBe('2026-04-06')
    })

    test('uses previous day as reference after correction window', () => {
        expect(calculateReferenceDate(new Date(2026, 3, 7, 12, 0))).toBe('2026-04-06')
    })

    test('marks submissions after 09:30 as late', () => {
        expect(isCheckinLate(new Date(2026, 3, 7, 9, 30))).toBe(false)
        expect(isCheckinLate(new Date(2026, 3, 7, 9, 31))).toBe(true)
    })

    test('allows correction only until 09:45', () => {
        expect(canEditCurrentCheckin(new Date(2026, 3, 7, 9, 45))).toBe(true)
        expect(canEditCurrentCheckin(new Date(2026, 3, 7, 9, 46))).toBe(false)
    })
})
