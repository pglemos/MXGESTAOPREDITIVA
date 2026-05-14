import { describe, expect, it } from 'bun:test'
import {
  getRecommendedLegacyVisitSelection,
  validateLegacyVisitCompletionInput,
} from './legacy-visit-completion'

describe('legacy visit completion validation', () => {
  it('requires at least one visit', () => {
    expect(validateLegacyVisitCompletionInput({
      visitNumbers: [],
      summary: 'Resumo geral',
      effectiveVisitDate: '2026-05-14',
    })).toBe('Selecione ao menos uma visita.')
  })

  it('rejects visits outside PMR 1 to 7', () => {
    expect(validateLegacyVisitCompletionInput({
      visitNumbers: [1, 8],
      summary: 'Resumo geral',
      effectiveVisitDate: '2026-05-14',
    })).toBe('Selecione apenas visitas entre V1 e V7.')
  })

  it('requires a summary', () => {
    expect(validateLegacyVisitCompletionInput({
      visitNumbers: [1, 2],
      summary: '   ',
      effectiveVisitDate: '2026-05-14',
    })).toBe('Informe o resumo geral da migração.')
  })

  it('defaults to recommended legacy visits still pending', () => {
    expect(getRecommendedLegacyVisitSelection([
      { visit_number: 1, status: 'concluida' },
      { visit_number: 2, status: 'agendada' },
      { visit_number: 4, status: 'agendada' },
    ])).toEqual([2, 3, 5, 6, 7])
  })
})
