import { describe, expect, it } from 'bun:test'
import { parseFeedback } from './feedback.schema'

const feedbackRow = {
  id: '11111111-1111-4111-8111-111111111111',
  store_id: 'store-1',
  manager_id: 'manager-1',
  seller_id: 'seller-1',
  week_reference: '2026-06-15',
  leads_week: 10,
  agd_week: 6,
  visit_week: 4,
  vnd_week: 2,
  tx_lead_agd: 60,
  tx_agd_visita: 66,
  tx_visita_vnd: 50,
  meta_compromisso: 3,
  positives: 'Bom volume de contatos.',
  attention_points: 'Melhorar qualificação.',
  action: 'Registrar três retornos por dia.',
  notes: null,
  team_avg_json: {},
  diagnostic_json: {},
  commitment_suggested: 3,
  acknowledged: false,
  acknowledged_at: null,
  seller_comment: null,
  seller_comment_at: null,
  created_at: '2026-06-16T12:00:00.000Z',
}

describe('FeedbackSchema', () => {
  it('aceita caso_motivo preenchido', () => {
    const parsed = parseFeedback({ ...feedbackRow, caso_motivo: 'Negociação X travou no financiamento.' })

    expect(parsed.caso_motivo).toBe('Negociação X travou no financiamento.')
  })

  it('mantem compatibilidade com devolutivas antigas sem caso', () => {
    const parsed = parseFeedback(feedbackRow)

    expect(parsed.caso_motivo).toBeNull()
  })

  it('aceita devolutiva sistemica sem gerente humano', () => {
    const parsed = parseFeedback({
      ...feedbackRow,
      manager_id: null,
      diagnostic_json: { origem: 'sistema', rule_id: 'cadencia_gargalo_principal' },
    })

    expect(parsed.manager_id).toBeNull()
    expect(parsed.diagnostic_json).toMatchObject({ origem: 'sistema' })
  })
})
