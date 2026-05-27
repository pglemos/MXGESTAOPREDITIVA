/**
 * MX Performance — Tokens semânticos de cor (espelho TS de src/index.css).
 *
 * Story: docs/stories/story-MX-01-20260527-tokens-cores.md
 * ADR:   docs/adr/ADR-MX-002-branding-color-decision.md (Opção B — marca verde mantida)
 * PRD:   docs/prd/prd-mx-performance-visao-estrutural-2026-05-27.md §4.6 / §4.7 / §5.2
 *
 * Padrão de resolução: igual a `src/lib/charts/tokens.ts` — lê `--color-*` via
 * `getComputedStyle()` em runtime, com fallback hardcoded sincronizado com
 * `src/index.css` @theme. Funções (não constantes) garantem avaliação preguiçosa.
 */

function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback
  }
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
  } catch {
    return fallback
  }
}

/** Tipos semânticos de alerta — PRD §4.6 FR-ALERT-1 / .docx §225–§228 */
export type AlertSemantic = 'critical' | 'warning' | 'positive' | 'consultive'

/** Faixas do MX Score — PRD §4.7 FR-SCORE-2 / .docx §244–§249 */
export type ScoreBandSemantic =
  | 'elite' // 90–100
  | 'excellent' // 80–89
  | 'good' // 70–79
  | 'attention' // 60–69
  | 'critical' // <60

/**
 * Cores semânticas de alerta (lazy, lê CSS var em runtime).
 *
 * Aproveita os 3 tokens de status existentes (`success`, `warning`, `error`)
 * e adiciona o 4º tipo `consultive` (MX-1.1).
 */
export const alertTokens = {
  critical: () => ({
    fg: cssVar('--color-status-error', '#ef4444'),
    surface: cssVar('--color-status-error-surface', 'rgba(239, 68, 68, 0.05)'),
  }),
  warning: () => ({
    fg: cssVar('--color-status-warning', '#f59e0b'), // lint-tokens-ignore-line
    surface: cssVar('--color-status-warning-surface', 'rgba(245, 158, 11, 0.05)'),
  }),
  positive: () => ({
    fg: cssVar('--color-status-success', '#10b981'), // lint-tokens-ignore-line
    surface: cssVar('--color-status-success-surface', 'rgba(16, 185, 129, 0.05)'),
  }),
  consultive: () => ({
    fg: cssVar('--color-alert-consultive', '#6366f1'), // lint-tokens-ignore-line
    surface: cssVar('--color-alert-consultive-surface', 'rgba(99, 102, 241, 0.05)'),
  }),
} as const

/**
 * Cores semânticas das 5 faixas do MX Score (lazy).
 * `elite` consolida marca verde `#22C55E` (ADR-MX-002 Opção B).
 */
export const scoreBandTokens = {
  elite: () => cssVar('--color-score-elite', '#22C55E'), // lint-tokens-ignore-line
  excellent: () => cssVar('--color-score-excellent', '#4ade80'), // lint-tokens-ignore-line
  good: () => cssVar('--color-score-good', '#3b82f6'), // lint-tokens-ignore-line
  attention: () => cssVar('--color-score-attention', '#f59e0b'), // lint-tokens-ignore-line
  critical: () => cssVar('--color-score-critical', '#ef4444'),
} as const

/**
 * Classifica um valor 0–100 na faixa correspondente.
 *
 * @example
 *   classifyScore(95) // 'elite'
 *   classifyScore(72) // 'good'
 *   classifyScore(45) // 'critical'
 */
export function classifyScore(value: number): ScoreBandSemantic {
  if (value >= 90) return 'elite'
  if (value >= 80) return 'excellent'
  if (value >= 70) return 'good'
  if (value >= 60) return 'attention'
  return 'critical'
}
