import type { CheckinFormData, CheckinWithTotals } from '@/types/database'

/**
 * Corrigir Leads (gerente): somente os campos de leads por canal podem mudar.
 * Vendas, atendimentos, agendamentos, qualificados e garantia nunca são
 * enviados — a RPC canônica preserva os valores originais das chaves ausentes.
 */
export const LEAD_FIELDS = [
  { key: 'leads_prev_day', label: 'Leads Showroom/Carteira' },
  { key: 'leads_net_prev_day', label: 'Leads Internet' },
] as const
export type LeadFieldKey = (typeof LEAD_FIELDS)[number]['key']

export interface LeadCorrectionInput {
  leads_prev_day: number
  leads_net_prev_day: number
  motivo: string
  observacao: string
}

export interface LeadCorrectionDiff {
  key: LeadFieldKey
  label: string
  anterior: number
  novo: number
  diferenca: number
}

export function getLeadOriginals(checkin: Pick<CheckinWithTotals, 'leads_prev_day' | 'leads_net_prev_day'>): Record<LeadFieldKey, number> {
  return {
    leads_prev_day: checkin.leads_prev_day || 0,
    leads_net_prev_day: checkin.leads_net_prev_day || 0,
  }
}

export function computeLeadDiff(originals: Record<LeadFieldKey, number>, input: Pick<LeadCorrectionInput, LeadFieldKey>): LeadCorrectionDiff[] {
  return LEAD_FIELDS
    .map(field => ({
      key: field.key,
      label: field.label,
      anterior: originals[field.key],
      novo: input[field.key],
      diferenca: input[field.key] - originals[field.key],
    }))
    .filter(diff => diff.diferenca !== 0)
}

export function validateLeadCorrection(originals: Record<LeadFieldKey, number>, input: LeadCorrectionInput): string | null {
  for (const field of LEAD_FIELDS) {
    const value = input[field.key]
    if (!Number.isInteger(value) || value < 0) return `${field.label}: informe um número inteiro maior ou igual a zero.`
  }
  if (computeLeadDiff(originals, input).length === 0) return 'Nenhum lead foi alterado.'
  if (input.motivo.trim().length < 8) return 'Informe um motivo com pelo menos 8 caracteres.'
  return null
}

/** Payload restrito: apenas chaves de leads. A RPC preserva o restante. */
export function buildLeadCorrectionPayload(input: Pick<LeadCorrectionInput, LeadFieldKey>): CheckinFormData {
  return {
    leads_prev_day: input.leads_prev_day,
    leads_net_prev_day: input.leads_net_prev_day,
  }
}

/** Motivo auditável combinando motivo + observação do gerente. */
export function buildLeadCorrectionReason(input: Pick<LeadCorrectionInput, 'motivo' | 'observacao'>): string {
  const motivo = input.motivo.trim()
  const observacao = input.observacao.trim()
  return observacao ? `${motivo} — Obs.: ${observacao}` : motivo
}
