/**
 * MX Performance Design System — entry point
 *
 * Story: docs/stories/story-MX-01-20260527-tokens-cores.md
 * EPIC:  docs/stories/epics/epic-mx-01-design-system-2026-05-27.md
 */

export * from './tokens/colors'
export * from '@/design/tokens'
export * from '@/design/motion'
export * from '@/design/components'
export { AlertCard, type AlertCardProps } from '@/components/molecules/AlertCard'
export { ScoreBandBadge, type ScoreBandBadgeProps } from '@/components/molecules/ScoreBandBadge'
// NOTE: StatusBadge (genérico) é re-exportado do path original, não daqui — APIs distintas.
