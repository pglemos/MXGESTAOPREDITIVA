export const PMR_MAIN_VISITS_MAX = 7
export const PMR_FOLLOW_UP_VISIT = 8

export function isPmrMainCycleVisitNumber(visitNumber: number) {
  return Number.isInteger(visitNumber) && visitNumber >= 1 && visitNumber <= PMR_MAIN_VISITS_MAX
}

export function isPmrFollowUpVisitNumber(visitNumber: number) {
  return visitNumber === PMR_FOLLOW_UP_VISIT
}

export function isPmrSchedulableVisitNumber(visitNumber: number) {
  return isPmrMainCycleVisitNumber(visitNumber) || isPmrFollowUpVisitNumber(visitNumber)
}

export function getPmrVisitDisplayLabel(visitNumber: number) {
  if (isPmrFollowUpVisitNumber(visitNumber)) return 'Acompanhamento Mensal'
  return `Visita ${visitNumber}/${PMR_MAIN_VISITS_MAX}`
}
