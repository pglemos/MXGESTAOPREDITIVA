import { describe, expect, it } from 'bun:test'
import { buildManagerFeedbackFormData, type ManagerFeedbackDraft } from './manager-feedback-draft'

const base = {
  seller_id: '',
  week_reference: '2026-07-13',
  leads_week: 0,
  agd_week: 0,
  visit_week: 0,
  vnd_week: 0,
  tx_lead_agd: 0,
  tx_agd_visita: 0,
  tx_visita_vnd: 0,
  meta_compromisso: 0,
  positives: '',
  attention_points: '',
  action: '',
  caso_motivo: '',
  notes: '',
}

describe('buildManagerFeedbackFormData', () => {
  it('maps a positive Base44 feedback into the canonical MX devolutivas payload', () => {
    const draft: ManagerFeedbackDraft = {
      sellerId: 'seller-1',
      date: '2026-07-13',
      type: 'positive',
      competency: 'Planejamento',
      origin: 'Rotina da Equipe',
      situation: 'Atualizou a carteira no prazo.',
      impact: 'Maior organização do atendimento',
      orientation: 'Mantenha a cadência de atualização.',
      commitment: 'Repetir o ritual na próxima semana.',
      deadline: '2026-07-20',
      nextConversation: '2026-07-27',
      useAsPdiEvidence: true,
      sendToSeller: true,
    }

    const result = buildManagerFeedbackFormData(draft, base)

    expect(result.seller_id).toBe('seller-1')
    expect(result.week_reference).toBe('2026-07-13')
    expect(result.positives).toContain('Atualizou a carteira no prazo.')
    expect(result.attention_points).toBe('')
    expect(result.action).toBe('Mantenha a cadência de atualização.')
    expect(result.diagnostic_json).toEqual(expect.objectContaining({
      competencia: 'Planejamento',
      origem: 'Rotina da Equipe',
      impacto: 'Maior organização do atendimento',
      prazo: '2026-07-20',
      proxima_conversa: '2026-07-27',
      usar_no_pdi: true,
      feedback_type: 'positive',
    }))
    expect(result.visible_to_seller).toBe(true)
  })

  it('keeps a development feedback distinguishable in the canonical fields', () => {
    const draft: ManagerFeedbackDraft = {
      sellerId: 'seller-2', date: '2026-07-13', type: 'development', competency: '', origin: 'Observação do gerente',
      situation: 'Não atualizou os clientes prioritários.', impact: 'Clientes sem acompanhamento', orientation: 'Atualizar a carteira até amanhã.',
      commitment: '', deadline: '', nextConversation: '', useAsPdiEvidence: false,
      sendToSeller: false,
    }

    const result = buildManagerFeedbackFormData(draft, base)

    expect(result.positives).toBe('')
    expect(result.attention_points).toContain('Não atualizou os clientes prioritários.')
    expect(result.caso_motivo).toBe('Não atualizou os clientes prioritários.')
    expect(result.diagnostic_json).toEqual(expect.objectContaining({ feedback_type: 'development' }))
    expect(result.visible_to_seller).toBe(false)
  })
})
