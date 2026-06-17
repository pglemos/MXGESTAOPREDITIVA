import { describe, expect, test } from 'bun:test'
import {
  buildFeedbackActionPayload,
  mapFeedbackActionToAgendaItem,
  type FeedbackActionRow,
} from './feedback-actions'

describe('feedback actions', () => {
  test('builds a traceable daily action payload from manager feedback', () => {
    const payload = buildFeedbackActionPayload({
      devolutivaId: 'feedback-1',
      storeId: 'store-1',
      sellerId: 'seller-1',
      managerId: 'manager-1',
      action: '  Agendar 3 retornos/dia às 16:30  ',
    }, new Date('2026-06-16T12:00:00Z'))

    expect(payload).toEqual({
      devolutiva_id: 'feedback-1',
      store_id: 'store-1',
      seller_id: 'seller-1',
      manager_id: 'manager-1',
      action_text: 'Agendar 3 retornos/dia às 16:30',
      status: 'pendente',
      recorrencia: 'diaria',
      data_inicio: '2026-06-16',
      horario_sugerido: '16:30',
      obrigatoria_fechamento: false,
    })
  })

  test('maps pending feedback action into a red agenda item for today', () => {
    const item = mapFeedbackActionToAgendaItem(actionRow({
      action_text: 'Cadastrar 2 clientes antes das 10:00',
      horario_sugerido: '10:00',
      data_inicio: '2026-06-01',
      status: 'pendente',
    }), new Date('2026-06-16T12:00:00Z'))

    expect(item).toMatchObject({
      id: 'feedback-action-action-1',
      origem: 'feedback',
      status: 'feedback_pendente',
      statusLabel: 'Feedback',
      proxima_acao: 'Cadastrar 2 clientes antes das 10:00',
      cliente: { nome: 'Ação do gestor', telefone: null },
      tipo: 'feedback',
      feedbackAction: expect.objectContaining({ id: 'action-1', devolutiva_id: 'feedback-1' }),
      alertTone: 'error',
    })
    expect(item?.data_hora).toBe('2026-06-16T10:00:00.000Z')
  })

  test('does not map completed or not-started feedback actions as pending agenda work', () => {
    expect(mapFeedbackActionToAgendaItem(actionRow({ status: 'concluida' }), new Date('2026-06-16T12:00:00Z'))).toBeNull()
    expect(mapFeedbackActionToAgendaItem(actionRow({ data_inicio: '2026-06-17' }), new Date('2026-06-16T12:00:00Z'))).toBeNull()
  })
})

function actionRow(overrides: Partial<FeedbackActionRow> = {}): FeedbackActionRow {
  return {
    id: 'action-1',
    devolutiva_id: 'feedback-1',
    store_id: 'store-1',
    seller_id: 'seller-1',
    manager_id: 'manager-1',
    action_text: 'Agendar 3 retornos/dia',
    status: 'pendente',
    recorrencia: 'diaria',
    data_inicio: '2026-06-16',
    horario_sugerido: '09:00',
    obrigatoria_fechamento: false,
    concluida_at: null,
    concluida_por: null,
    justificativa: null,
    created_at: '2026-06-16T09:00:00Z',
    updated_at: '2026-06-16T09:00:00Z',
    ...overrides,
  }
}
