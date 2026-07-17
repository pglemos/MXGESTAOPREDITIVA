import {
  CENTRAL_ACTION_STATUSES,
  CENTRAL_ACTIVITY_TYPES,
  CENTRAL_RESULT_CODES,
  type CentralActionStatus,
  type CentralActivityType,
  type CentralAlertTone,
  type CentralAppointmentSummary,
  type CentralClientSummary,
  type CentralExecutionAction,
  type CentralOpportunitySummary,
  type CentralPriority,
  type CentralResultCode,
} from '@/features/central-execucao/types/central-execucao.types'

export interface ExecutionActionHydratedRow {
  id: string
  store_id: string | null
  seller_id: string
  source_type: string
  source_id: string | null
  cliente_id: string | null
  oportunidade_id: string | null
  agendamento_id: string | null
  evento_id: string | null
  activity_type: string | null
  title: string
  description: string | null
  objective: string | null
  due_at: string
  status: string
  priority: string
  priority_rank: number | null
  alert_tone: string
  result_code: string | null
  result_note: string | null
  origin_module: string | null
  active: boolean | null
  automatic: boolean | null
  manager_required: boolean | null
  escalation_reason: string | null
  manager_id: string | null
  escalated_at: string | null
  completed_at: string | null
  client_name_snapshot: string | null
  phone_snapshot: string | null
  vehicle_snapshot: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  cliente: CentralClientSummary | CentralClientSummary[] | null
  oportunidade: CentralOpportunitySummary | CentralOpportunitySummary[] | null
  agendamento: CentralAppointmentSummary | CentralAppointmentSummary[] | null
}

const ACTIVITY_TYPES = new Set<string>(CENTRAL_ACTIVITY_TYPES)
const ACTION_STATUSES = new Set<string>(CENTRAL_ACTION_STATUSES)
const RESULT_CODES = new Set<string>(CENTRAL_RESULT_CODES)

function firstRelated<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function inferActivityType(row: Pick<ExecutionActionHydratedRow, 'activity_type' | 'source_type'>): CentralActivityType {
  if (row.activity_type && ACTIVITY_TYPES.has(row.activity_type)) {
    return row.activity_type as CentralActivityType
  }

  if (row.source_type === 'pdi' || row.source_type === 'feedback' || row.source_type === 'funil') {
    return row.source_type
  }

  if (row.source_type === 'agendamento') return 'atendimento'
  return 'comercial'
}

function normalizeStatus(status: string): CentralActionStatus {
  return ACTION_STATUSES.has(status) ? status as CentralActionStatus : 'pendente'
}

function normalizePriority(priority: string): CentralPriority {
  if (priority === 'low' || priority === 'medium' || priority === 'high' || priority === 'urgent') {
    return priority
  }
  return 'medium'
}

function normalizeAlertTone(tone: string): CentralAlertTone {
  if (tone === 'info' || tone === 'warning' || tone === 'error') return tone
  return 'warning'
}

function normalizeResultCode(code: string | null): CentralResultCode | null {
  return code && RESULT_CODES.has(code) ? code as CentralResultCode : null
}

export function mapExecutionActionRow(row: ExecutionActionHydratedRow): CentralExecutionAction {
  return {
    id: row.id,
    storeId: row.store_id,
    sellerId: row.seller_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    clientId: row.cliente_id,
    opportunityId: row.oportunidade_id,
    appointmentId: row.agendamento_id,
    eventId: row.evento_id,
    activityType: inferActivityType(row),
    title: row.title,
    description: row.description,
    objective: row.objective,
    dueAt: row.due_at,
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    priorityRank: row.priority_rank ?? 5,
    alertTone: normalizeAlertTone(row.alert_tone),
    resultCode: normalizeResultCode(row.result_code),
    resultNote: row.result_note,
    originModule: row.origin_module ?? 'central_execucao',
    active: row.active ?? true,
    automatic: row.automatic ?? false,
    managerRequired: row.manager_required ?? false,
    escalationReason: row.escalation_reason,
    managerId: row.manager_id,
    escalatedAt: row.escalated_at,
    completedAt: row.completed_at,
    snapshots: {
      name: row.client_name_snapshot,
      phone: row.phone_snapshot,
      vehicle: row.vehicle_snapshot,
    },
    metadata: row.metadata ?? {},
    client: firstRelated(row.cliente),
    opportunity: firstRelated(row.oportunidade),
    appointment: firstRelated(row.agendamento),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapExecutionActionRows(rows: readonly ExecutionActionHydratedRow[]): CentralExecutionAction[] {
  return rows.map(mapExecutionActionRow)
}
