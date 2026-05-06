import { describe, it, expect } from 'bun:test'
import {
  calculateReferenceDate,
  isCheckinLate,
  canEditCurrentCheckin,
  getCheckinEditLockedAt,
  validateCheckinSubmissionDate,
} from './useCheckins'

describe('Check-in Validation Logic', () => {
  it('should calculate reference date as yesterday', () => {
    const today = new Date('2025-05-15T13:00:00.000Z')
    expect(calculateReferenceDate(today)).toBe('2025-05-14')
  })

  it('should calculate reference date using Sao Paulo calendar day near UTC midnight', () => {
    const utcMidnightBeforeSaoPauloDayChanges = new Date('2025-05-15T02:30:00.000Z')
    expect(calculateReferenceDate(utcMidnightBeforeSaoPauloDayChanges)).toBe('2025-05-13')
  })

  it('should mark check-in as late after 09:30', () => {
    const lateTime = new Date('2025-05-15T12:31:00.000Z')
    const onTime = new Date('2025-05-15T12:29:00.000Z')
    
    expect(isCheckinLate(lateTime)).toBe(true)
    expect(isCheckinLate(onTime)).toBe(false)
  })

  it('should block editing after 09:45', () => {
    const blockedTime = new Date('2025-05-15T12:46:00.000Z')
    const allowedTime = new Date('2025-05-15T12:44:00.000Z')
    
    expect(canEditCurrentCheckin(blockedTime)).toBe(false)
    expect(canEditCurrentCheckin(allowedTime)).toBe(true)
  })

  it('should expose the edit lock timestamp as the Sao Paulo cutoff instant', () => {
    expect(getCheckinEditLockedAt(new Date('2025-05-15T12:00:00.000Z'))).toBe('2025-05-15T12:45:00.000Z')
  })

  it('should reject daily backdating and future check-in dates', () => {
    expect(validateCheckinSubmissionDate('2025-05-14', '2025-05-14', 'daily')).toBeNull()
    expect(validateCheckinSubmissionDate('2025-05-13', '2025-05-14', 'daily')).toContain('Registro diário')
    expect(validateCheckinSubmissionDate('2025-05-15', '2025-05-14', 'adjustment')).toContain('data futura')
  })

  it('should allow adjustment only for valid historical references', () => {
    expect(validateCheckinSubmissionDate('2025-05-13', '2025-05-14', 'adjustment')).toBeNull()
    expect(validateCheckinSubmissionDate('13/05/2025', '2025-05-14', 'adjustment')).toContain('inválida')
  })
})
