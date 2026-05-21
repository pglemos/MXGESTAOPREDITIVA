import type { CheckinCorrectionRequest } from '@/types/database'

export type RoutineTab = 'diario' | 'semanal' | 'mensal' | 'ajustes'

export type PendingCorrectionRequest = CheckinCorrectionRequest & {
  seller?: { name?: string | null; avatar_url?: string | null } | null
}

export type MetricTone = 'success' | 'warning' | 'info' | 'error' | 'brand'

export type RoutineNotice = {
  tone: 'success' | 'warning' | 'error' | 'info'
  message: string
  detail?: string
  at: Date
}

export type RoutineProgress = {
  steps: { label: string; done: boolean }[]
  doneCount: number
  total: number
  percent: number
}
