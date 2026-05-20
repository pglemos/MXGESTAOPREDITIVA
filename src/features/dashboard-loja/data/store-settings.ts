/**
 * Constantes e helpers do formulário administrativo da loja.
 * Extraídos de DashboardLoja.tsx (Story 2.5, ADR-0050).
 */
import type { StoreSourceMode } from '@/types/database'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const SOURCE_MODE_DESCRIPTIONS: Record<StoreSourceMode, string> = {
  native_app: 'Lançamentos entram pelo app MX e alimentam painel, ranking e relatórios automaticamente.',
  legacy_forms: 'Dados vêm de formulário legado; use quando a loja ainda não opera pelo app.',
  hybrid: 'Aceita app MX e legado no mesmo período; exige conferência para evitar duplicidade.',
}

export const joinRecipients = (value?: string[] | null) => value?.join(', ') || ''

export const splitRecipients = (value: string) =>
  value.split(',').map(email => email.trim()).filter(Boolean)

export const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const toBoundedNumber = (value: string, fallback: number, min: number, max: number) => {
  const parsed = toNumber(value, fallback)
  return Math.min(max, Math.max(min, parsed))
}
