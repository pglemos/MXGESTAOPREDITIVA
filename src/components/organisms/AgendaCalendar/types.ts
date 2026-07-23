import type { AgendaItemKind } from './layout'

export interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
}

export interface CalendarAgendaItem {
  id: string
  status: string
  title: string
  startsAt: string
  durationHours: number
  kind: AgendaItemKind
  subtitle?: string | null
}

export type CalendarViewMode = 'day' | 'week' | 'month'

export interface AgendaQuickActions {
  onEdit?: (item: CalendarAgendaItem) => void
  /** Visits only — events don't have em_andamento/concluida in this popover. */
  onStatusChange?: (item: CalendarAgendaItem, status: string) => void
  onDelete?: (item: CalendarAgendaItem) => void
}
