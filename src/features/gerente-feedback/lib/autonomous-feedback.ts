import type { CadenciaAnalytics, CadenciaGargalo } from '@/features/crm/lib/cadencia-analytics'
import type { VendedorVinculoTipo } from '@/features/crm/lib/vinculo-vendedor'
import type { FeedbackActionPayload } from '@/features/gerente-feedback/lib/feedback-actions'

export type AutonomousFeedbackPayload = {
  store_id: string
  manager_id: null
  seller_id: string
  week_reference: string
  leads_week: number
  agd_week: number
  visit_week: number
  vnd_week: number
  tx_lead_agd: number
  tx_agd_visita: number
  tx_visita_vnd: number
  meta_compromisso: number
  team_avg_json: Record<string, unknown>
  diagnostic_json: Record<string, unknown>
  commitment_suggested: number
  positives: string
  attention_points: string
  action: string
  caso_motivo: string
  notes: string
  acknowledged: false
  acknowledged_at: null
}

type BuildAutonomousFeedbackInput = {
  analytics: CadenciaAnalytics
  sellerId: string
  storeId: string | null
  vinculoTipo: VendedorVinculoTipo
  referenceDate?: Date
}

type BuildAutonomousFeedbackActionInput = {
  devolutivaId: string
  feedback: AutonomousFeedbackPayload
  now?: Date
}

export function buildAutonomousFeedbackFromCadencia({
  analytics,
  sellerId,
  storeId,
  vinculoTipo,
  referenceDate = new Date(),
}: BuildAutonomousFeedbackInput): AutonomousFeedbackPayload | null {
  if (vinculoTipo !== 'autonomo' || !storeId || analytics.totalEstados <= 0) return null

  const gargalo = findMainBottleneck(analytics.gargalos)
  if (!gargalo || bottleneckScore(gargalo) <= 0) return null

  const conversion = analytics.conversaoPorFluxo[0]
  const suggestedCommitment = Math.max(1, Math.min(6, gargalo.pendentes + gargalo.semSucesso + gargalo.reagendamentosSemSucesso))
  const completedShare = percentage(gargalo.concluidos, gargalo.total)

  return {
    store_id: storeId,
    manager_id: null,
    seller_id: sellerId,
    week_reference: toWeekReference(referenceDate),
    leads_week: analytics.totalEstados,
    agd_week: gargalo.total,
    visit_week: gargalo.concluidos,
    vnd_week: conversion?.ganhos || 0,
    tx_lead_agd: percentage(gargalo.total, analytics.totalEstados),
    tx_agd_visita: completedShare,
    tx_visita_vnd: conversion?.taxaConversao || 0,
    meta_compromisso: suggestedCommitment,
    team_avg_json: {},
    diagnostic_json: {
      origem: 'sistema',
      rule_id: 'cadencia_gargalo_principal',
      generated_at: referenceDate.toISOString(),
      etapa_gargalo: gargalo.etapa,
      gargalo,
      total_estados: analytics.totalEstados,
      fluxo_principal: conversion ? {
        fluxo_id: conversion.fluxo_id,
        fluxo_version: conversion.fluxo_version,
        taxa_conversao: conversion.taxaConversao,
        ganhos: conversion.ganhos,
      } : null,
    },
    commitment_suggested: suggestedCommitment,
    positives: `Voce tem ${analytics.totalEstados} cliente(s) em cadencia e base suficiente para agir hoje.`,
    attention_points: `Gargalo principal identificado em ${gargalo.etapa}: ${gargalo.pendentes} pendente(s), ${gargalo.semSucesso} sem sucesso e ${gargalo.reagendamentosSemSucesso} reagendamento(s) sem sucesso.`,
    action: `Hoje as 09:00, retomar ${suggestedCommitment} cliente(s) parados em ${gargalo.etapa} e registrar o resultado da acao.`,
    caso_motivo: `Sistema MX identificou gargalo em ${gargalo.etapa} pela cadencia do vendedor autonomo.`,
    notes: 'Feedback automatico gerado por regra explicavel de cadencia; sem responsavel humano.',
    acknowledged: false,
    acknowledged_at: null,
  }
}

export function buildAutonomousFeedbackActionPayload({
  devolutivaId,
  feedback,
  now = new Date(),
}: BuildAutonomousFeedbackActionInput): FeedbackActionPayload {
  return {
    devolutiva_id: devolutivaId,
    store_id: feedback.store_id,
    seller_id: feedback.seller_id,
    manager_id: null,
    action_text: feedback.action,
    status: 'pendente',
    recorrencia: 'diaria',
    data_inicio: toDateKey(now),
    horario_sugerido: '09:00',
    obrigatoria_fechamento: true,
  }
}

function findMainBottleneck(gargalos: CadenciaGargalo[]): CadenciaGargalo | null {
  return [...gargalos].sort((a, b) => {
    return bottleneckScore(b) - bottleneckScore(a) ||
      b.total - a.total ||
      a.etapa.localeCompare(b.etapa)
  })[0] || null
}

function bottleneckScore(gargalo: CadenciaGargalo): number {
  return gargalo.pendentes * 2 +
    gargalo.semSucesso * 3 +
    gargalo.reagendamentosSemSucesso * 2 +
    gargalo.aguardando
}

function percentage(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((part / total) * 1000) / 10
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toWeekReference(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() - day + 1)
  return toDateKey(utc)
}
