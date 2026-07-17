export const CENTRAL_ACTIVITY_TYPES = [
  'atendimento',
  'visita',
  'retorno',
  'documentacao',
  'entrega',
  'pos_venda',
  'aniversario',
  'garantia',
  'comercial',
  'test_drive',
  'negociacao',
  'pdi',
  'feedback',
  'funil',
] as const

export type CentralActivityType = (typeof CENTRAL_ACTIVITY_TYPES)[number]

export const CENTRAL_ACTION_STATUSES = [
  'pendente',
  'em_andamento',
  'concluida',
  'justificada',
  'reagendada',
  'cancelada',
] as const

export type CentralActionStatus = (typeof CENTRAL_ACTION_STATUSES)[number]

export const CENTRAL_RESULT_CODES = [
  'confirmed',
  'attended',
  'no_show',
  'contacted',
  'no_answer',
  'no_response',
  'reschedule',
  'advanced',
  'manager_required',
  'sale_completed',
  'sale_lost',
  'documentation_completed',
  'documentation_pending',
  'delivery_completed',
  'delivery_confirmed',
  'client_absent',
  'waiting_workshop',
  'waiting_part',
  'warranty_resolved',
  'post_sale_satisfied',
  'post_sale_question',
  'complaint',
  'repurchase',
  'referral',
  'task_completed',
  'task_justified',
  'cancelled',
] as const

export type CentralResultCode = (typeof CENTRAL_RESULT_CODES)[number]

export type CentralPriority = 'low' | 'medium' | 'high' | 'urgent'
export type CentralAlertTone = 'info' | 'warning' | 'error'

export interface CentralResultOption {
  code: CentralResultCode
  label: string
  description?: string
  requiresNote?: boolean
  requiresSchedule?: boolean
  requiresOpportunity?: boolean
  destructive?: boolean
}

export interface CentralClientSummary {
  id: string
  nome: string
  telefone: string | null
  canal_origem?: string | null
  status?: string | null
  proxima_acao?: string | null
  proxima_acao_em?: string | null
}

export interface CentralOpportunitySummary {
  id: string
  cliente_id: string
  veiculo_interesse: string | null
  valor_negociado: number
  etapa: string
  financiamento: string
  carro_avaliado: boolean
  sinal: number
  motivo_perda?: string | null
}

export interface CentralAppointmentSummary {
  id: string
  cliente_id: string | null
  oportunidade_id: string | null
  data_hora: string
  tipo: string
  status: string
  canal: string | null
  observacoes: string | null
}

export interface CentralActionSnapshots {
  name: string | null
  phone: string | null
  vehicle: string | null
}

export interface CentralExecutionAction {
  id: string
  storeId: string | null
  sellerId: string
  sourceType: string
  sourceId: string | null
  clientId: string | null
  opportunityId: string | null
  appointmentId: string | null
  eventId: string | null
  activityType: CentralActivityType
  title: string
  description: string | null
  objective: string | null
  dueAt: string
  status: CentralActionStatus
  priority: CentralPriority
  priorityRank: number
  alertTone: CentralAlertTone
  resultCode: CentralResultCode | null
  resultNote: string | null
  originModule: string
  active: boolean
  automatic: boolean
  managerRequired: boolean
  escalationReason: string | null
  managerId: string | null
  escalatedAt: string | null
  completedAt: string | null
  snapshots: CentralActionSnapshots
  metadata: Record<string, unknown>
  client: CentralClientSummary | null
  opportunity: CentralOpportunitySummary | null
  appointment: CentralAppointmentSummary | null
  createdAt: string
  updatedAt: string
}

export interface CreateManualActionInput {
  activityType: CentralActivityType
  title: string
  description?: string | null
  objective?: string | null
  dueAt: string
  clientId?: string | null
  opportunityId?: string | null
  nameSnapshot?: string | null
  phoneSnapshot?: string | null
  vehicleSnapshot?: string | null
  priority?: CentralPriority
  priorityRank?: number
  idempotencyKey: string
}

export interface ResolveActionInput {
  actionId: string
  resultCode: CentralResultCode
  note?: string | null
  payload?: Record<string, unknown>
  idempotencyKey: string
}

export interface RescheduleActionInput {
  actionId: string
  dueAt: string
  note?: string | null
  idempotencyKey: string
}

export interface EscalateActionInput {
  actionId: string
  reason: string
  idempotencyKey: string
}

export interface CentralMutationResult<T = unknown> {
  data: T | null
  error: string | null
}
