export const FEEDBACK_ACTION_CATALOG_VERSION = 1

export type FeedbackActionTemplateId =
  | 'retornos_qualificados_diarios'
  | 'confirmacao_visita'
  | 'argumentacao_financiamento'
  | 'retomar_clientes_parados'

export type FeedbackActionTemplate = {
  id: FeedbackActionTemplateId
  version: number
  title: string
  description: string
  actionTemplate: string
  suggestedTime: string
  flowMetadata: {
    recorrencia: 'diaria' | 'unica'
    obrigatoriaFechamento: boolean
    centralAlertTone: 'error'
  }
}

export type FeedbackActionTemplateContext = {
  sellerName: string
  weekReference: string
}

export const FEEDBACK_ACTIONS_CATALOG: FeedbackActionTemplate[] = [
  {
    id: 'retornos_qualificados_diarios',
    version: FEEDBACK_ACTION_CATALOG_VERSION,
    title: '3 retornos qualificados por dia',
    description: 'Rotina diaria para recuperar clientes parados na cadencia.',
    actionTemplate: '09:00 - {{sellerName}} deve executar 3 retornos qualificados por dia na semana {{weekReference}} e registrar o resultado no CRM.',
    suggestedTime: '09:00',
    flowMetadata: { recorrencia: 'diaria', obrigatoriaFechamento: true, centralAlertTone: 'error' },
  },
  {
    id: 'confirmacao_visita',
    version: FEEDBACK_ACTION_CATALOG_VERSION,
    title: 'Confirmar visitas do dia seguinte',
    description: 'Fluxo para reduzir furo entre agendamento e visita.',
    actionTemplate: '08:30 - {{sellerName}} deve confirmar todas as visitas do dia seguinte na semana {{weekReference}} e reagendar quem nao responder.',
    suggestedTime: '08:30',
    flowMetadata: { recorrencia: 'diaria', obrigatoriaFechamento: true, centralAlertTone: 'error' },
  },
  {
    id: 'argumentacao_financiamento',
    version: FEEDBACK_ACTION_CATALOG_VERSION,
    title: 'Treinar argumentacao de financiamento',
    description: 'Fluxo para corrigir perda por proposta, taxa ou financiamento.',
    actionTemplate: '10:00 - {{sellerName}} deve revisar 2 casos de financiamento da semana {{weekReference}} e praticar a argumentacao antes do proximo contato.',
    suggestedTime: '10:00',
    flowMetadata: { recorrencia: 'diaria', obrigatoriaFechamento: true, centralAlertTone: 'error' },
  },
  {
    id: 'retomar_clientes_parados',
    version: FEEDBACK_ACTION_CATALOG_VERSION,
    title: 'Retomar clientes parados',
    description: 'Fluxo para clientes sem avanco na etapa atual.',
    actionTemplate: '11:00 - {{sellerName}} deve retomar clientes parados na semana {{weekReference}}, atualizar etapa e marcar proxima acao no CRM.',
    suggestedTime: '11:00',
    flowMetadata: { recorrencia: 'diaria', obrigatoriaFechamento: true, centralAlertTone: 'error' },
  },
]

export function findFeedbackActionTemplate(actionId: string): FeedbackActionTemplate | null {
  return FEEDBACK_ACTIONS_CATALOG.find(action => action.id === actionId) || null
}

export function applyFeedbackActionTemplate(
  actionId: string,
  context: FeedbackActionTemplateContext,
): string | null {
  const template = findFeedbackActionTemplate(actionId)
  if (!template) return null
  return template.actionTemplate
    .replaceAll('{{sellerName}}', context.sellerName.trim() || 'Nome não informado')
    .replaceAll('{{weekReference}}', context.weekReference)
}
