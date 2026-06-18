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
  link: typeof TERMINAL_MX_PATH
}

export const TERMINAL_MX_PATH = '/vendedor/terminal-mx' as const

export type DailyRoutineAutoSlotKey =
  | 'mentalidade'
  | 'organizacao'
  | 'novos_leads'
  | 'prospeccao'
  | 'atendimento'
  | 'lista_quente'
  | 'fechamento'

export type DailyRoutineAutoSlotState = 'done' | 'pending' | 'not_required'

export type DailyRoutineAutoSlot = {
  key: DailyRoutineAutoSlotKey
  time: string
  title: string
  desc: string
  state: DailyRoutineAutoSlotState
  required: boolean
  progress: string
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
    link: TERMINAL_MX_PATH,
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
    link: TERMINAL_MX_PATH,
  }
}

const DEFAULT_ROUTINE_TIMES = ['08:00', '08:15', '08:55', '11:00', '13:00', '16:00', '17:00'] as const

const AUTO_ROUTINE_DEFINITIONS: Array<Omit<DailyRoutineAutoSlot, 'time' | 'state' | 'progress'>> = [
  { key: 'mentalidade', title: 'Motivação', desc: 'Energia para atingir seus objetivos.', required: false },
  { key: 'organizacao', title: 'Organização do Dia', desc: 'Atualize clientes e organize prioridades reais.', required: true },
  { key: 'novos_leads', title: 'Contato com Novos Leads', desc: 'Cadastre clientes ou agende novos contatos.', required: true },
  { key: 'prospeccao', title: 'Prospecção de Novos Clientes', desc: 'Aumente sua carteira com novos clientes.', required: true },
  { key: 'atendimento', title: 'Atendimento', desc: 'Registre atendimentos do dia por canal.', required: true },
  { key: 'lista_quente', title: 'Lista Quente', desc: 'Trabalhe ações de negociação e proposta.', required: true },
  { key: 'fechamento', title: 'Fechamento do Dia', desc: 'Conclua o Fechamento Diário.', required: true },
]

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null
  const match = time.match(/^(\d{1,2}):([0-5]\d)/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || hours < 0 || hours > 23) return null
  return hours * 60 + minutes
}

function formatMinutesAsTime(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)))
  const hours = Math.floor(bounded / 60).toString().padStart(2, '0')
  const minutes = (bounded % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function resolveRoutineTimesFromWorkday(input: {
  workStartTime?: string | null
  workEndTime?: string | null
  slotCount?: number
}): string[] {
  const slotCount = input.slotCount || AUTO_ROUTINE_DEFINITIONS.length
  const start = parseTimeToMinutes(input.workStartTime)
  const end = parseTimeToMinutes(input.workEndTime)

  if (start === null || end === null || end <= start || slotCount <= 1) {
    return DEFAULT_ROUTINE_TIMES.slice(0, slotCount)
  }

  const interval = (end - start) / (slotCount - 1)
  return Array.from({ length: slotCount }, (_, index) => formatMinutesAsTime(start + interval * index))
}

export function deriveDailyRoutineSlots(input: {
  workStartTime?: string | null
  workEndTime?: string | null
  atendimentosHoje: number
  minimumAtendimentos?: number
  clientesCriadosHoje: number
  clientesAtualizadosHoje: number
  agendamentosCriadosHoje: number
  acoesListaQuenteHoje?: number
  fechamentoDiarioFeito: boolean
}): DailyRoutineAutoSlot[] {
  const minimumAtendimentos = Math.max(1, input.minimumAtendimentos || 5)
  const novosLeadsTotal = input.clientesCriadosHoje + input.agendamentosCriadosHoje
  const times = resolveRoutineTimesFromWorkday({
    workStartTime: input.workStartTime,
    workEndTime: input.workEndTime,
    slotCount: AUTO_ROUTINE_DEFINITIONS.length,
  })

  const stateFor = (key: DailyRoutineAutoSlotKey): Pick<DailyRoutineAutoSlot, 'state' | 'progress'> => {
    switch (key) {
      case 'mentalidade':
        return { state: 'not_required', progress: 'Sem fonte obrigatória' }
      case 'organizacao':
        return {
          state: input.clientesAtualizadosHoje > 0 ? 'done' : 'pending',
          progress: `${input.clientesAtualizadosHoje} cliente${input.clientesAtualizadosHoje === 1 ? '' : 's'} atualizado${input.clientesAtualizadosHoje === 1 ? '' : 's'}`,
        }
      case 'novos_leads':
        return {
          state: novosLeadsTotal > 0 ? 'done' : 'pending',
          progress: `${novosLeadsTotal} novo${novosLeadsTotal === 1 ? '' : 's'} contato${novosLeadsTotal === 1 ? '' : 's'}`,
        }
      case 'prospeccao':
        return {
          state: input.clientesCriadosHoje > 0 ? 'done' : 'pending',
          progress: `${input.clientesCriadosHoje} cliente${input.clientesCriadosHoje === 1 ? '' : 's'} criado${input.clientesCriadosHoje === 1 ? '' : 's'}`,
        }
      case 'atendimento':
        return {
          state: input.atendimentosHoje >= minimumAtendimentos ? 'done' : 'pending',
          progress: `${input.atendimentosHoje}/${minimumAtendimentos} atendimento${minimumAtendimentos === 1 ? '' : 's'}`,
        }
      case 'lista_quente':
        return {
          state: (input.acoesListaQuenteHoje || 0) > 0 ? 'done' : 'pending',
          progress: `${input.acoesListaQuenteHoje || 0} ação${(input.acoesListaQuenteHoje || 0) === 1 ? '' : 'es'} quente${(input.acoesListaQuenteHoje || 0) === 1 ? '' : 's'}`,
        }
      case 'fechamento':
        return {
          state: input.fechamentoDiarioFeito ? 'done' : 'pending',
          progress: input.fechamentoDiarioFeito ? 'Fechamento concluído' : 'Fechamento pendente',
        }
    }
  }

  return AUTO_ROUTINE_DEFINITIONS.map((definition, index) => ({
    ...definition,
    time: times[index] || DEFAULT_ROUTINE_TIMES[index] || '09:00',
    ...stateFor(definition.key),
  }))
}
