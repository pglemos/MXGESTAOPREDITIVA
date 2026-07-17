import { describe, expect, test } from 'bun:test'
import { calculateAppointmentTarget } from './manager-home-parity'

describe('Manager Dashboard official plan ratio', () => {
  test('derives the appointment target from the persisted official ratio', () => {
    expect(calculateAppointmentTarget(null, 4.5)).toBeNull()
    expect(calculateAppointmentTarget(2, 4.5)).toBe(9)
    expect(calculateAppointmentTarget(3, 2.25)).toBe(7)
  })

  test('keeps the legacy 3:1 fallback when no official ratio is provided', () => {
    expect(calculateAppointmentTarget(2)).toBe(6)
  })
})
