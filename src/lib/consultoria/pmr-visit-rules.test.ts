import { describe, expect, test } from 'bun:test'
import {
  getPmrVisitDisplayLabel,
  isPmrFollowUpVisitNumber,
  isPmrMainCycleVisitNumber,
  isPmrSchedulableVisitNumber,
  PMR_FOLLOW_UP_VISIT,
  PMR_MAIN_VISITS_MAX,
} from './pmr-visit-rules'

describe('pmr visit rules', () => {
  test('keeps the main PMR cycle limited to visits 1 to 7', () => {
    expect(PMR_MAIN_VISITS_MAX).toBe(7)
    expect(isPmrMainCycleVisitNumber(1)).toBe(true)
    expect(isPmrMainCycleVisitNumber(7)).toBe(true)
    expect(isPmrMainCycleVisitNumber(8)).toBe(false)
  })

  test('allows visit 8 only as monthly follow-up', () => {
    expect(PMR_FOLLOW_UP_VISIT).toBe(8)
    expect(isPmrFollowUpVisitNumber(8)).toBe(true)
    expect(isPmrSchedulableVisitNumber(8)).toBe(true)
    expect(isPmrSchedulableVisitNumber(9)).toBe(false)
  })

  test('labels follow-up without showing 8/7', () => {
    expect(getPmrVisitDisplayLabel(3)).toBe('Visita 3/7')
    expect(getPmrVisitDisplayLabel(8)).toBe('Acompanhamento Mensal')
  })
})
