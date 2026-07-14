import type { FeedbackFormData } from '@/types/database'

export type ManagerFeedbackDraft = {
  sellerId: string
  date: string
  type: 'positive' | 'development' | ''
  competency: string
  origin: string
  situation: string
  impact: string
  orientation: string
  commitment: string
  deadline: string
  nextConversation: string
  useAsPdiEvidence: boolean
}

export function buildManagerFeedbackFormData(
  draft: ManagerFeedbackDraft,
  base: FeedbackFormData,
): FeedbackFormData {
  const situation = draft.situation.trim()
  const impact = draft.impact.trim()
  const orientation = draft.orientation.trim()
  const commitment = draft.commitment.trim()
  const notes = [
    commitment && `Compromisso: ${commitment}`,
    draft.deadline && `Prazo: ${draft.deadline}`,
    draft.nextConversation && `Próxima conversa: ${draft.nextConversation}`,
  ].filter(Boolean).join('\n')

  return {
    ...base,
    seller_id: draft.sellerId,
    week_reference: draft.date,
    positives: draft.type === 'positive' ? [situation, orientation].filter(Boolean).join('\n') : '',
    attention_points: draft.type === 'development' ? [situation, impact].filter(Boolean).join('\n') : '',
    caso_motivo: situation,
    action: orientation || commitment,
    notes: [base.notes?.trim(), notes].filter(Boolean).join('\n'),
    diagnostic_json: {
      ...(base.diagnostic_json || {}),
      competencia: draft.competency,
      origem: draft.origin,
      impacto: impact,
      prazo: draft.deadline,
      proxima_conversa: draft.nextConversation,
      usar_no_pdi: draft.useAsPdiEvidence,
    },
  }
}
