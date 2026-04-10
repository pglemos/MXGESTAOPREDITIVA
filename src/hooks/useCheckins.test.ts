import { describe, it, expect, mock } from 'bun:test'
import { calculateReferenceDate, isCheckinLate, canEditCurrentCheckin } from './useCheckins'

describe('Check-in Validation Logic', () => {
  it('should calculate reference date as yesterday', () => {
    const today = new Date('2025-05-15T10:00:00')
    expect(calculateReferenceDate(today)).toBe('2025-05-14')
  })

  it('should mark check-in as late after 09:30', () => {
    const lateTime = new Date('2025-05-15T09:31:00')
    const onTime = new Date('2025-05-15T09:29:00')
    
    expect(isCheckinLate(lateTime)).toBe(true)
    expect(isCheckinLate(onTime)).toBe(false)
  })

  it('should block editing after 09:45', () => {
    const blockedTime = new Date('2025-05-15T09:46:00')
    const allowedTime = new Date('2025-05-15T09:44:00')
    
    expect(canEditCurrentCheckin(blockedTime)).toBe(false)
    expect(canEditCurrentCheckin(allowedTime)).toBe(true)
  })
})
