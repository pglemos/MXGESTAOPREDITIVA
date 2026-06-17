import { describe, expect, test } from 'bun:test'
import { buildPDISelfAssessmentPayload, PDI_ORIGEM_NOTA } from './pdi-self-assessment'

describe('PDI self assessment payload', () => {
  test('builds an autonomous PDI bundle without store and marks grades as self assessment', () => {
    const payload = buildPDISelfAssessmentPayload({
      sellerId: 'seller-1',
      cargoId: 'cargo-1',
      lojaId: null,
      proximaRevisaoData: '2026-07-16',
      competencias: [
        { id: 'comp-1', alvo: 10 },
        { id: 'comp-2', alvo: 9 },
      ],
      avaliacoes: {
        'comp-1': 8,
        'comp-2': 7,
      },
    })

    expect(payload).toEqual({
      colaborador_id: 'seller-1',
      loja_id: null,
      cargo_id: 'cargo-1',
      proxima_revisao_data: '2026-07-16',
      metas: [],
      plano_acao: [],
      avaliacoes: [
        { competencia_id: 'comp-1', nota_atribuida: 8, alvo: 10, origem_nota: PDI_ORIGEM_NOTA.AUTOAVALIACAO },
        { competencia_id: 'comp-2', nota_atribuida: 7, alvo: 9, origem_nota: PDI_ORIGEM_NOTA.AUTOAVALIACAO },
      ],
    })
  })

  test('rejects incomplete autonomous assessment before persisting', () => {
    expect(() => buildPDISelfAssessmentPayload({
      sellerId: 'seller-1',
      cargoId: 'cargo-1',
      lojaId: null,
      proximaRevisaoData: '2026-07-16',
      competencias: [{ id: 'comp-1', alvo: 10 }],
      avaliacoes: {},
    })).toThrow('Informe a nota de todas as competencias.')
  })
})
