import {
  type ManagerRoutineSourceData,
} from './manager-day-routine'
import {
  executionActionToManualSource,
  extractResolvedAutomaticTaskIds,
  managerRoutineDateTimeParts,
  readManagerRoutineMetadata,
  type ManagerRoutineExecutionActionRow,
} from './manager-day-routine-adapter'

export type ManagerRoutineClosingRow = {
  id: string
  seller_user_id: string
  reference_date: string
  submission_status: string
  vnd_porta_prev_day: number
  vnd_cart_prev_day: number
  vnd_net_prev_day: number
}

export type ManagerRoutineRegularizationRow = {
  vendedor_id: string
  data_competencia: string
  status_solicitacao: string
  enviado_para_aprovacao: boolean
}

export type ManagerRoutineSellerExecutionRow = ManagerRoutineExecutionActionRow & {
  seller_id: string
  source_type: string
}

export type ManagerRoutineAgendaEventRow = {
  id: string
  kind: string
  starts_at: string
  title: string
  public_summary: string | null
  metadata: unknown
  private_payload: unknown
}

export type ManagerRoutineCanonicalSources = {
  now: Date
  referenceDate: string
  yesterdayDate: string
  monthlyGoal: number | null
  businessDays: number | null
  sellers: Array<{ id: string; name: string }>
  closings: ManagerRoutineClosingRow[]
  regularizations: ManagerRoutineRegularizationRow[]
  appointments: Array<{ id: string; status: string }>
  sellerExecutionActions: ManagerRoutineSellerExecutionRow[]
  centralOpenings: Array<{ seller_user_id: string; created_at: string }>
  prospectingSchedules: Array<{ quantidade: number | null }>
  qualificationEvents: Array<{ seller_user_id: string; tipo_evento: string }>
  feedbackActions: Array<{ id: string; status: string; data_inicio: string }>
  pdiActions: Array<{ id: string; status: string; data_conclusao: string }>
  pdiSessions: Array<{ id: string; status: string; proxima_revisao_data: string | null }>
  agendaEvents: ManagerRoutineAgendaEventRow[]
  managerActions: ManagerRoutineExecutionActionRow[]
}

export function composeManagerRoutineSourceData(
  input: ManagerRoutineCanonicalSources,
): ManagerRoutineSourceData {
  const closingSource = input.closings.map(row => ({
    sellerId: row.seller_user_id,
    date: row.reference_date,
    status: closingStatus(row, input.regularizations),
    sales: row.vnd_porta_prev_day + row.vnd_cart_prev_day + row.vnd_net_prev_day,
  }))
  const dailyProspectingNeed = input.prospectingSchedules.reduce(
    (sum, row) => sum + Math.max(0, row.quantidade || 0),
    0,
  )

  return {
    now: input.now,
    referenceDate: input.referenceDate,
    store: {
      monthlyGoal: input.monthlyGoal,
      businessDays: input.businessDays,
    },
    sellers: input.sellers,
    todayClosings: closingSource.filter(row => row.date === input.referenceDate),
    yesterdayClosings: closingSource.filter(row => row.date === input.yesterdayDate),
    todayAppointments: input.appointments,
    todayRoutines: input.sellers.map(seller => {
      const actions = input.sellerExecutionActions.filter(row => row.seller_id === seller.id)
      const opening = input.centralOpenings.find(row => row.seller_user_id === seller.id)
      const executed = actions.filter(row => row.status === 'concluida' || row.status === 'justificada').length
      const qualifiedGenerated = input.qualificationEvents.filter(row => (
        row.seller_user_id === seller.id && row.tipo_evento === 'cliente_qualificado'
      )).length
      const updateActions = actions.filter(row => (
        readManagerRoutineMetadata(row.metadata).requires_customer_update === true
      ))
      const updatesDone = updateActions.filter(row => (
        readManagerRoutineMetadata(row.metadata).customer_updated === true
      )).length

      return {
        sellerId: seller.id,
        eligible: true,
        planStatus: actions.length > 0 ? 'CALCULAVEL' : 'SEM_DADOS',
        firstAccess: Boolean(opening),
        firstAccessAt: opening?.created_at || null,
        planPlanned: actions.length,
        planExecuted: executed,
        planPoints: actions.length > 0 ? Math.round((executed / actions.length) * 100) : 0,
        prospectingStatus: dailyProspectingNeed > 0 ? 'CALCULAVEL' : 'SEM_PLANEJAMENTO',
        prospectingPlanned: dailyProspectingNeed,
        qualifiedGenerated,
        updateStatus: updateActions.length > 0 ? 'CALCULAVEL' : 'NAO_APLICAVEL',
        updatesRequired: updateActions.length,
        updatesDone,
      }
    }),
    feedbacks: input.feedbackActions.map(row => ({
      id: row.id,
      status: row.status,
      dueDate: row.data_inicio,
    })),
    pdiActions: input.pdiActions.map(row => ({
      id: row.id,
      status: row.status,
      dueDate: row.data_conclusao,
    })),
    pdiMeetings: input.pdiSessions
      .filter(row => row.proxima_revisao_data === input.referenceDate)
      .filter(row => row.status !== 'concluida' && row.status !== 'concluido' && row.status !== 'cancelada' && row.status !== 'cancelado')
      .map(row => ({
        id: row.id,
        status: 'agendada',
        date: input.referenceDate,
        time: null,
      })),
    agendaItems: input.agendaEvents.flatMap(event => {
      const metadata = {
        ...readManagerRoutineMetadata(event.private_payload),
        ...readManagerRoutineMetadata(event.metadata),
      }
      const declaredType = typeof metadata.type === 'string' ? metadata.type : event.kind
      const type = declaredType === 'conferencia' ? 'conferencia' : event.kind
      if (type !== 'compromisso' && type !== 'reuniao' && type !== 'conferencia') return []
      const due = managerRoutineDateTimeParts(event.starts_at)
      return [{
        id: event.id,
        status: 'agendado',
        type,
        date: due.date,
        time: due.time,
        description: event.title,
        relatedSellerId: stringMetadata(metadata.related_seller_id),
        relatedSellerName: stringMetadata(metadata.related_seller_name),
      }]
    }),
    manualTasks: input.managerActions
      .filter(row => readManagerRoutineMetadata(row.metadata).manager_daily === true)
      .filter(row => !stringMetadata(readManagerRoutineMetadata(row.metadata).automatic_key))
      .map(executionActionToManualSource),
    resolvedAutomaticTaskIds: extractResolvedAutomaticTaskIds(input.managerActions),
    salesToday: closingSource
      .filter(row => row.date === input.referenceDate)
      .reduce((sum, row) => sum + row.sales, 0),
  }
}

function closingStatus(
  row: ManagerRoutineClosingRow,
  regularizations: ManagerRoutineRegularizationRow[],
): string {
  const awaitingApproval = regularizations.some(regularization => (
    regularization.vendedor_id === row.seller_user_id
      && regularization.data_competencia === row.reference_date
      && regularization.enviado_para_aprovacao
      && regularization.status_solicitacao === 'Pendente'
  ))
  if (awaitingApproval) return 'aguardando_aprovacao'
  if (row.submission_status === 'draft') return 'pendente'
  return 'finalizado'
}

function stringMetadata(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}
