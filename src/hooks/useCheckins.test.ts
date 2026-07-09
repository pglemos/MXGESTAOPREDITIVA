import { describe, it, expect } from 'bun:test'
import {
  calculateReferenceDate,
  isCheckinLate,
  canEditCurrentCheckin,
  getCheckinEditLockedAt,
  validateCheckinSubmissionDate,
} from './useCheckins'
import { canCreateAdjustment } from '@/lib/auth/capabilities'

describe('Check-in Validation Logic', () => {
  it('should calculate reference date as yesterday before the 12h00 operational rollover', () => {
    const today = new Date('2025-05-15T13:00:00.000Z') // 10h00 em São Paulo
    expect(calculateReferenceDate(today)).toBe('2025-05-14')
  })

  it('should calculate reference date using Sao Paulo calendar day near UTC midnight', () => {
    const utcMidnightBeforeSaoPauloDayChanges = new Date('2025-05-15T02:30:00.000Z') // 23h30 em São Paulo (dia 14, já depois das 12h)
    expect(calculateReferenceDate(utcMidnightBeforeSaoPauloDayChanges)).toBe('2025-05-14')
  })

  it('should roll the operational day forward at 12h00 São Paulo, not at midnight', () => {
    const beforeNoon = new Date('2025-05-15T14:59:00.000Z') // 11h59 em São Paulo
    const atNoon = new Date('2025-05-15T15:00:00.000Z') // 12h00 em São Paulo
    expect(calculateReferenceDate(beforeNoon)).toBe('2025-05-14')
    expect(calculateReferenceDate(atNoon)).toBe('2025-05-15')
  })

  it('should mark check-in as late after 09:30', () => {
    const lateTime = new Date('2025-05-15T12:31:00.000Z')
    const exactDeadline = new Date('2025-05-15T12:30:00.000Z')
    const onTime = new Date('2025-05-15T12:29:00.000Z')
    
    expect(isCheckinLate(lateTime)).toBe(true)
    expect(isCheckinLate(exactDeadline)).toBe(false)
    expect(isCheckinLate(onTime)).toBe(false)
  })

  it('should block editing after 09:45', () => {
    const blockedTime = new Date('2025-05-15T12:46:00.000Z')
    const exactLimit = new Date('2025-05-15T12:45:00.000Z')
    const allowedTime = new Date('2025-05-15T12:44:00.000Z')
    
    expect(canEditCurrentCheckin(blockedTime)).toBe(false)
    expect(canEditCurrentCheckin(exactLimit)).toBe(true)
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

  it('should allow technical adjustments from the seller terminal and leadership roles', () => {
    expect(canCreateAdjustment('vendedor')).toBe(true)
    expect(canCreateAdjustment('gerente')).toBe(true)
    expect(canCreateAdjustment('administrador_mx')).toBe(true)
  })
})
