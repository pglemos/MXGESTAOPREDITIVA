import type {
  CentralActivityType,
  CentralResultCode,
  CentralResultOption,
} from '@/features/central-execucao/types/central-execucao.types'

const COMMON_COMMERCIAL_RESULTS: CentralResultOption[] = [
  { code: 'sale_completed', label: 'Venda realizada', requiresOpportunity: true },
  { code: 'sale_lost', label: 'Venda perdida', requiresOpportunity: true, requiresNote: true, destructive: true },
  { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
  { code: 'manager_required', label: 'Precisa de gerente', requiresNote: true },
]

const RESULT_OPTIONS: Partial<Record<CentralActivityType, readonly CentralResultOption[]>> = {
  atendimento: [
    { code: 'confirmed', label: 'Confirmado' },
    { code: 'attended', label: 'Compareceu' },
    { code: 'no_show', label: 'Não compareceu', requiresNote: true },
    ...COMMON_COMMERCIAL_RESULTS,
  ],
  visita: [
    { code: 'confirmed', label: 'Confirmado' },
    { code: 'attended', label: 'Compareceu' },
    { code: 'no_show', label: 'Não compareceu', requiresNote: true },
    ...COMMON_COMMERCIAL_RESULTS,
  ],
  test_drive: [
    { code: 'attended', label: 'Test-drive realizado' },
    { code: 'no_show', label: 'Cliente não compareceu', requiresNote: true },
    { code: 'advanced', label: 'Avançou para negociação' },
    ...COMMON_COMMERCIAL_RESULTS,
  ],
  negociacao: [
    { code: 'contacted', label: 'Negociação realizada' },
    { code: 'advanced', label: 'Avançou no funil' },
    { code: 'no_response', label: 'Cliente não respondeu' },
    ...COMMON_COMMERCIAL_RESULTS,
  ],
  retorno: [
    { code: 'contacted', label: 'Falei com o cliente' },
    { code: 'no_answer', label: 'Não atendeu' },
    { code: 'no_response', label: 'Não respondeu' },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
    { code: 'advanced', label: 'Avançou para negociação' },
    { code: 'manager_required', label: 'Precisa de gerente', requiresNote: true },
  ],
  documentacao: [
    { code: 'documentation_completed', label: 'Documentação concluída' },
    { code: 'documentation_pending', label: 'Documentação pendente', requiresNote: true },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
    { code: 'manager_required', label: 'Precisa de gerente', requiresNote: true },
  ],
  entrega: [
    { code: 'delivery_completed', label: 'Entrega realizada' },
    { code: 'delivery_confirmed', label: 'Entrega confirmada' },
    { code: 'reschedule', label: 'Entrega remarcada', requiresSchedule: true },
    { code: 'documentation_pending', label: 'Documentação pendente', requiresNote: true },
    { code: 'client_absent', label: 'Cliente não compareceu', requiresNote: true },
  ],
  garantia: [
    { code: 'contacted', label: 'Retorno realizado' },
    { code: 'waiting_workshop', label: 'Aguardando oficina', requiresNote: true },
    { code: 'waiting_part', label: 'Aguardando peça', requiresNote: true },
    { code: 'warranty_resolved', label: 'Resolvido' },
    { code: 'manager_required', label: 'Precisa de gerente', requiresNote: true },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
  ],
  pos_venda: [
    { code: 'post_sale_satisfied', label: 'Cliente satisfeito' },
    { code: 'post_sale_question', label: 'Cliente com dúvida', requiresNote: true },
    { code: 'complaint', label: 'Reclamação', requiresNote: true },
    { code: 'repurchase', label: 'Recompra' },
    { code: 'referral', label: 'Indicação recebida' },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
  ],
  aniversario: [
    { code: 'contacted', label: 'Contato realizado' },
    { code: 'no_answer', label: 'Não atendeu' },
    { code: 'no_response', label: 'Não respondeu' },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
  ],
  comercial: [
    { code: 'task_completed', label: 'Atividade concluída' },
    { code: 'task_justified', label: 'Justificar impedimento', requiresNote: true },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
    { code: 'manager_required', label: 'Precisa de gerente', requiresNote: true },
  ],
  pdi: [
    { code: 'task_completed', label: 'Ação concluída' },
    { code: 'task_justified', label: 'Justificar impedimento', requiresNote: true },
    { code: 'reschedule', label: 'Reagendar', requiresSchedule: true },
  ],
  feedback: [
    { code: 'task_completed', label: 'Ação concluída' },
    { code: 'task_justified', label: 'Justificar impedimento', requiresNote: true },
    { code: 'manager_required', label: 'Precisa de gerente', requiresNote: true },
  ],
  funil: [
    { code: 'advanced', label: 'Avançou no funil' },
    { code: 'contacted', label: 'Contato realizado' },
    ...COMMON_COMMERCIAL_RESULTS,
  ],
}

export function getResultOptions(activityType: CentralActivityType): CentralResultOption[] {
  return [...(RESULT_OPTIONS[activityType] ?? [])]
}

export function isResultAllowedForActivity(activityType: CentralActivityType, resultCode: CentralResultCode): boolean {
  return (RESULT_OPTIONS[activityType] ?? []).some(option => option.code === resultCode)
}

export function getResultOption(activityType: CentralActivityType, resultCode: CentralResultCode): CentralResultOption | null {
  return (RESULT_OPTIONS[activityType] ?? []).find(option => option.code === resultCode) ?? null
}
