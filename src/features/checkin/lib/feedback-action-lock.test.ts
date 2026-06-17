import { describe, expect, test } from 'bun:test'
import { resolveFeedbackActionCloseLock } from './feedback-action-lock'
import type { FeedbackActionRow } from '@/features/gerente-feedback/lib/feedback-actions'

describe('resolveFeedbackActionCloseLock', () => {
  test('does not block when there is no mandatory pending feedback action', () => {
    const result = resolveFeedbackActionCloseLock({
      actions: [
        action({ id: 'optional', obrigatoria_fechamento: false }),
        action({ id: 'done', obrigatoria_fechamento: true, status: 'concluida' }),
      ],
      note: '',
      metricScope: 'daily',
    })

    expect(result.blocked).toBe(false)
    expect(result.actionIdsToJustify).toEqual([])
  })

  test('blocks daily close when mandatory pending action lacks justification', () => {
    const result = resolveFeedbackActionCloseLock({
      actions: [action({ id: 'required', obrigatoria_fechamento: true })],
      note: 'curto',
      metricScope: 'daily',
    })

    expect(result.blocked).toBe(true)
    expect(result.message).toContain('ação obrigatória de feedback')
    expect(result.actionIdsToJustify).toEqual(['required'])
  })

  test('allows daily close and returns actions to justify when note is sufficient', () => {
    const result = resolveFeedbackActionCloseLock({
      actions: [
        action({ id: 'required-1', obrigatoria_fechamento: true }),
        action({ id: 'required-2', obrigatoria_fechamento: true }),
      ],
      note: 'Nao consegui executar porque o cliente remarcou a visita.',
      metricScope: 'daily',
    })

    expect(result.blocked).toBe(false)
    expect(result.actionIdsToJustify).toEqual(['required-1', 'required-2'])
  })

  test('does not block adjustment submissions', () => {
    const result = resolveFeedbackActionCloseLock({
      actions: [action({ id: 'required', obrigatoria_fechamento: true })],
      note: '',
      metricScope: 'adjustment',
    })

    expect(result.blocked).toBe(false)
    expect(result.actionIdsToJustify).toEqual([])
  })
})

function action(overrides: Partial<FeedbackActionRow>): FeedbackActionRow {
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
