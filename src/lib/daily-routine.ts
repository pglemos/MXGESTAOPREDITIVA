import type { DailyCheckin, User } from '@/types/database'

export type DailyRoutineFieldScope = 'previous_day' | 'today'

export type DailyRoutineMvpField = {
  key:
    | 'leads_prev_day'
    | 'agd_cart_prev_day'
    | 'agd_net_prev_day'
    | 'agd_cart_today'
    | 'agd_net_today'
    | 'visit_prev_day'
    | 'vnd_porta_prev_day'
    | 'vnd_cart_prev_day'
    | 'vnd_net_prev_day'
    | 'note'
    | 'zero_reason'
  label: string
  scope: DailyRoutineFieldScope
  required: boolean
  source: 'lancamentos_diarios'
}

export type DailyRoutineDiscipline = {
  expected_days: number
  submitted_days: number
  pending_days: number
  percentage: number
  status: 'no_data' | 'attention' | 'consistent'
  label: string
}

export type CloseDayReminderSchedule = {
  enabled: boolean
  time: string | null
  workDays: string[]
  link: '/lancamento-diario'
}

export const DAILY_ROUTINE_MVP_FIELDS: DailyRoutineMvpField[] = [
  { key: 'leads_prev_day', label: 'Leads do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'agd_cart_prev_day', label: 'Agendamentos carteira do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'agd_net_prev_day', label: 'Agendamentos internet do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'agd_cart_today', label: 'Agendamentos carteira para hoje', scope: 'today', required: true, source: 'lancamentos_diarios' },
  { key: 'agd_net_today', label: 'Agendamentos internet para hoje', scope: 'today', required: true, source: 'lancamentos_diarios' },
  { key: 'visit_prev_day', label: 'Visitas do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'vnd_porta_prev_day', label: 'Vendas porta do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'vnd_cart_prev_day', label: 'Vendas carteira do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'vnd_net_prev_day', label: 'Vendas internet do dia anterior', scope: 'previous_day', required: true, source: 'lancamentos_diarios' },
  { key: 'note', label: 'Observacao operacional', scope: 'today', required: false, source: 'lancamentos_diarios' },
  { key: 'zero_reason', label: 'Justificativa de producao zero', scope: 'previous_day', required: false, source: 'lancamentos_diarios' },
]

export function isProductionZero(input: Pick<DailyCheckin, 'leads_prev_day' | 'agd_cart_today' | 'agd_net_today' | 'visit_prev_day' | 'vnd_porta_prev_day' | 'vnd_cart_prev_day' | 'vnd_net_prev_day'>) {
  return (
    input.leads_prev_day === 0
    && input.agd_cart_today + input.agd_net_today === 0
    && input.visit_prev_day === 0
    && input.vnd_porta_prev_day + input.vnd_cart_prev_day + input.vnd_net_prev_day === 0
  )
}

export function calculateDailyRoutineDiscipline(input: {
  referenceDates: string[]
  checkins: Array<Pick<DailyCheckin, 'seller_user_id' | 'reference_date' | 'metric_scope'>>
  sellerId: string
}): DailyRoutineDiscipline {
  const expectedDates = Array.from(new Set(input.referenceDates.filter(Boolean)))
  const submittedDates = new Set(
    input.checkins
      .filter((checkin) => checkin.seller_user_id === input.sellerId && checkin.metric_scope === 'daily')
      .map((checkin) => checkin.reference_date),
  )
  const submittedDays = expectedDates.filter((date) => submittedDates.has(date)).length
  const expectedDays = expectedDates.length
  const percentage = expectedDays > 0 ? Math.round((submittedDays / expectedDays) * 100) : 0
  const status = expectedDays === 0 ? 'no_data' : percentage >= 90 ? 'consistent' : 'attention'

  return {
    expected_days: expectedDays,
    submitted_days: submittedDays,
    pending_days: Math.max(expectedDays - submittedDays, 0),
    percentage,
    status,
    label: status === 'consistent' ? 'Disciplina consistente' : status === 'attention' ? 'Disciplina em atencao' : 'Sem periodo comparavel',
  }
}

export function buildDailyRoutineReminder(input: {
  seller: Pick<User, 'id' | 'name'>
  storeId: string
  referenceDate: string
}) {
  return {
    dedupe_key: `daily-routine:${input.storeId}:${input.seller.id}:${input.referenceDate}`,
    title: 'Puxada diaria pendente',
    message: `${input.seller.name}, registre sua producao de ${input.referenceDate} para manter sua rotina MX em dia.`,
    type: 'discipline',
    priority: 'high',
    recipient_id: input.seller.id,
    store_id: input.storeId,
    link: '/lancamento-diario',
  }
}

export function resolveCloseDayReminderSchedule(input: {
  enabled: boolean
  reminderTime?: string | null
  workEndTime?: string | null
  workDays?: string[] | null
}): CloseDayReminderSchedule {
  const time = input.reminderTime || input.workEndTime || null
  const workDays = input.workDays?.filter(Boolean) || []

  return {
    enabled: input.enabled && Boolean(time) && workDays.length > 0,
    time: time ? time.slice(0, 5) : null,
    workDays,
    link: '/lancamento-diario',
  }
}
