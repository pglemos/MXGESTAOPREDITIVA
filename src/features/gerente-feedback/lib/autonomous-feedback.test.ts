import { describe, expect, test } from 'bun:test'
import {
  buildAutonomousFeedbackActionPayload,
  buildAutonomousFeedbackFromCadencia,
} from './autonomous-feedback'
import type { CadenciaAnalytics } from '@/features/crm/lib/cadencia-analytics'

const analytics: CadenciaAnalytics = {
  totalEstados: 12,
  gargalos: [
    {
      etapa: 'Agendamento',
      total: 8,
      pendentes: 5,
      concluidos: 1,
      cancelados: 0,
      semSucesso: 3,
      aguardando: 2,
      reagendamentosSemSucesso: 2,
    },
    {
      etapa: 'Confirmacao',
      total: 4,
      pendentes: 1,
      concluidos: 2,
      cancelados: 0,
      semSucesso: 1,
      aguardando: 0,
      reagendamentosSemSucesso: 0,
    },
  ],
  demandaVeiculos: [{ tipo_veiculo: 'seminovo', quantidade: 6, valorTotal: 720000 }],
  conversaoPorFluxo: [{ fluxo_id: 'internet', fluxo_version: 2, totalClientes: 12, ganhos: 1, taxaConversao: 8.3, valorGanho: 120000 }],
}

describe('autonomous feedback from cadence analytics', () => {
  test('generates traceable system feedback for autonomous seller bottleneck', () => {
    const feedback = buildAutonomousFeedbackFromCadencia({
      analytics,
      sellerId: 'seller-1',
      storeId: 'store-1',
      vinculoTipo: 'autonomo',
      referenceDate: new Date('2026-06-16T12:00:00.000Z'),
    })

    expect(feedback).not.toBeNull()
    expect(feedback?.manager_id).toBeNull()
    expect(feedback?.seller_id).toBe('seller-1')
    expect(feedback?.store_id).toBe('store-1')
    expect(feedback?.week_reference).toBe('2026-06-15')
    expect(feedback?.attention_points).toContain('Agendamento')
    expect(feedback?.action).toContain('Agendamento')
    expect(feedback?.diagnostic_json).toMatchObject({
      origem: 'sistema',
      rule_id: 'cadencia_gargalo_principal',
      etapa_gargalo: 'Agendamento',
    })
  })

  test('does not generate autonomous feedback for store seller', () => {
    const feedback = buildAutonomousFeedbackFromCadencia({
      analytics,
      sellerId: 'seller-1',
      storeId: 'store-1',
      vinculoTipo: 'loja',
      referenceDate: new Date('2026-06-16T12:00:00.000Z'),
    })

    expect(feedback).toBeNull()
  })

  test('builds central action payload without human manager', () => {
    const feedback = buildAutonomousFeedbackFromCadencia({
      analytics,
      sellerId: 'seller-1',
      storeId: 'store-1',
      vinculoTipo: 'autonomo',
      referenceDate: new Date('2026-06-16T12:00:00.000Z'),
    })

    expect(feedback).not.toBeNull()
    const action = buildAutonomousFeedbackActionPayload({
      devolutivaId: 'feedback-1',
      feedback: feedback!,
      now: new Date('2026-06-16T12:00:00.000Z'),
    })

    expect(action).toMatchObject({
      devolutiva_id: 'feedback-1',
      store_id: 'store-1',
      seller_id: 'seller-1',
      manager_id: null,
      status: 'pendente',
      recorrencia: 'diaria',
      data_inicio: '2026-06-16',
      horario_sugerido: '09:00',
      obrigatoria_fechamento: true,
    })
    expect(action.action_text).toContain('Agendamento')
  })
})
