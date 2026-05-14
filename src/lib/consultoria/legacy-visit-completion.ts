export const LEGACY_PMR_VISITS = [1, 2, 3, 5, 6, 7] as const

export type LegacyVisitCompletionInput = {
  visitNumbers: number[]
  summary: string
  effectiveVisitDate: string
}

export function validateLegacyVisitCompletionInput(input: LegacyVisitCompletionInput): string | null {
  if (!input.visitNumbers.length) return 'Selecione ao menos uma visita.'
  if (input.visitNumbers.some((visitNumber) => !Number.isInteger(visitNumber) || visitNumber < 1 || visitNumber > 7)) {
    return 'Selecione apenas visitas entre V1 e V7.'
  }
  if (!input.summary.trim()) return 'Informe o resumo geral da migração.'
  if (!input.effectiveVisitDate) return 'Informe a data de referência das visitas.'
  return null
}

export function getRecommendedLegacyVisitSelection(
  visits: Array<{ visit_number: number; status?: string | null }>,
  fallbackVisitNumbers: readonly number[] = LEGACY_PMR_VISITS,
) {
  const concluded = new Set(
    visits
      .filter((visit) => visit.status === 'concluida')
      .map((visit) => visit.visit_number),
  )
  const recommendedPending = fallbackVisitNumbers.filter((visitNumber) => !concluded.has(visitNumber))
  if (recommendedPending.length > 0) return recommendedPending
  return Array.from({ length: 7 }, (_, index) => index + 1).filter((visitNumber) => !concluded.has(visitNumber))
}
