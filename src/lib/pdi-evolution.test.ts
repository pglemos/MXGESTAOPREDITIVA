import { describe, expect, test } from 'bun:test'
import { buildPDIEvolution } from './pdi-evolution'
import type { PDIAvaliacao360, PDISessionSummary } from '@/hooks/usePDI_MX'

function avaliacao(input: Partial<PDIAvaliacao360> & { competencia_id: string; competencia: string; nota: number }): PDIAvaliacao360 {
  return {
    alvo: 10,
    gap: 10 - input.nota,
    tipo: 'tecnica',
    ...input,
  }
}

function session(id: string, date: string, avaliacoes: PDIAvaliacao360[]): PDISessionSummary {
  return {
    id,
    colaborador_id: 'seller-1',
    gerente_id: 'manager-1',
    loja_id: 'store-1',
    status: 'concluida',
    created_at: `${date}T10:00:00.000Z`,
    data_realizacao: date,
    seller_name: 'Ana',
    manager_name: 'Bruno',
    metas: [],
    avaliacoes,
    plano_acao: [],
    top_5_gaps: [],
    meta_6m: '',
    meta_12m: '',
    meta_24m: '',
  }
}

describe('PDI evolution helper', () => {
  test('orders PDI sessions and classifies improving and stagnant competencies', () => {
    const result = buildPDIEvolution([
      session('pdi-2', '2026-03-10', [
        avaliacao({ competencia_id: 'planejamento', competencia: 'Planejamento', nota: 8 }),
        avaliacao({ competencia_id: 'atendimento', competencia: 'Atendimento', nota: 7 }),
        avaliacao({ competencia_id: 'urgencia', competencia: 'Urgencia', nota: 6 }),
      ]),
      session('pdi-1', '2026-01-10', [
        avaliacao({ competencia_id: 'planejamento', competencia: 'Planejamento', nota: 6 }),
        avaliacao({ competencia_id: 'atendimento', competencia: 'Atendimento', nota: 7 }),
        avaliacao({ competencia_id: 'urgencia', competencia: 'Urgencia', nota: 7 }),
      ]),
    ])

    expect(result.comparavel).toBe(true)
    expect(result.totalSessoes).toBe(2)
    expect(result.items.map(item => [item.competencia, item.status, item.delta])).toEqual([
      ['Planejamento', 'evoluindo', 2],
      ['Atendimento', 'estagnado', 0],
      ['Urgencia', 'queda', -1],
    ])
    expect(result.items[0].pontos.map(point => [point.sessaoId, point.nota])).toEqual([
      ['pdi-1', 6],
      ['pdi-2', 8],
    ])
    expect(result.highlights.evoluindo.map(item => item.competencia)).toEqual(['Planejamento'])
    expect(result.highlights.estagnadas.map(item => item.competencia)).toEqual(['Atendimento'])
  })

  test('returns a compact empty state when there are not two comparable assessments', () => {
    const result = buildPDIEvolution([
      session('pdi-2', '2026-03-10', [
        avaliacao({ competencia_id: 'planejamento', competencia: 'Planejamento', nota: 8 }),
      ]),
      session('pdi-1', '2026-01-10', [
        avaliacao({ competencia_id: 'atendimento', competencia: 'Atendimento', nota: 7 }),
      ]),
    ])

    expect(result.comparavel).toBe(false)
    expect(result.items).toEqual([])
    expect(result.totalSessoes).toBe(2)
  })
})
