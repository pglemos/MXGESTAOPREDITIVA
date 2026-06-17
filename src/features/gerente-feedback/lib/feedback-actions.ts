export type FeedbackActionStatus = 'pendente' | 'concluida' | 'justificada' | 'cancelada'
export type FeedbackActionRecorrencia = 'diaria' | 'unica'

export type FeedbackActionPayload = {
  devolutiva_id: string
  store_id: string
  seller_id: string
  manager_id: string | null
  action_text: string
  status: 'pendente'
  recorrencia: 'diaria'
  data_inicio: string
  horario_sugerido: string
  obrigatoria_fechamento: boolean
}

export type FeedbackActionRow = {
  id: string
  devolutiva_id: string
  store_id: string
  seller_id: string
  manager_id: string | null
  action_text: string
  status: FeedbackActionStatus
  recorrencia: FeedbackActionRecorrencia
  data_inicio: string
  horario_sugerido: string
  obrigatoria_fechamento: boolean
  concluida_at: string | null
  concluida_por: string | null
  justificativa: string | null
  created_at: string
  updated_at: string
}

export type FeedbackAgendaItem = {
  id: string
  origem: 'feedback'
  data_hora: string
  canal: null
  status: 'feedback_pendente'
  statusLabel: 'Feedback'
  proxima_acao: string
  cliente: { nome: string; telefone: null }
  oportunidade: null
  tipo: 'feedback'
  etapa: null
  feedbackAction: FeedbackActionRow
  alertTone: 'error'
}

type FeedbackActionPayloadInput = {
  devolutivaId: string
  storeId: string
  sellerId: string
  managerId: string | null
  action: string
  obrigatoriaFechamento?: boolean
}

export function buildFeedbackActionPayload(
  input: FeedbackActionPayloadInput,
  now = new Date(),
): FeedbackActionPayload {
  const actionText = input.action.trim()

  return {
    devolutiva_id: input.devolutivaId,
    store_id: input.storeId,
    seller_id: input.sellerId,
    manager_id: input.managerId,
    action_text: actionText,
    status: 'pendente',
    recorrencia: 'diaria',
    data_inicio: toDateKey(now),
    horario_sugerido: extractSuggestedTime(actionText) || '09:00',
    obrigatoria_fechamento: input.obrigatoriaFechamento ?? false,
  }
}

export function mapFeedbackActionToAgendaItem(
  action: FeedbackActionRow,
  referenceDate = new Date(),
): FeedbackAgendaItem | null {
  if (action.status !== 'pendente') return null
  if (action.data_inicio > toDateKey(referenceDate)) return null

  return {
    id: `feedback-action-${action.id}`,
    origem: 'feedback',
    data_hora: buildReferenceDateTime(referenceDate, action.horario_sugerido),
    canal: null,
    status: 'feedback_pendente',
    statusLabel: 'Feedback',
    proxima_acao: action.action_text,
    cliente: { nome: action.manager_id ? 'Ação do gestor' : 'Ação do sistema', telefone: null },
    oportunidade: null,
    tipo: 'feedback',
    etapa: null,
    feedbackAction: action,
    alertTone: 'error',
  }
}

function extractSuggestedTime(action: string): string | null {
  const match = action.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function buildReferenceDateTime(referenceDate: Date, suggestedTime: string): string {
  const [hours, minutes] = suggestedTime.split(':').map(Number)
  const year = referenceDate.getUTCFullYear()
  const month = referenceDate.getUTCMonth()
  const day = referenceDate.getUTCDate()
  return new Date(Date.UTC(year, month, day, hours || 0, minutes || 0)).toISOString()
}
