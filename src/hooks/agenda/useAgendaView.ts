import { useCallback, useMemo } from 'react'
import { addDays, addWeeks, format, startOfWeek } from 'date-fns'
import type {
  AgendaScheduleEvent,
  AgendaVisit,
  CalendarMonth,
  DateFilter,
} from './types'
import type { CalendarAgendaItem } from '@/components/organisms/AgendaCalendar'

export type UseAgendaViewInput = {
  filteredVisits: AgendaVisit[]
  filteredScheduleEvents: AgendaScheduleEvent[]
  dateFilter: DateFilter
  calendarMonth: CalendarMonth
  setCalendarMonth: (next: CalendarMonth | ((prev: CalendarMonth) => CalendarMonth)) => void
}

export type UseAgendaViewReturn = {
  calendarDays: { date: Date; day: number; isCurrentMonth: boolean }[]
  visitsByDate: Record<string, CalendarAgendaItem[]>
  metrics: {
    total: number
    agendadas: number
    emAndamento: number
    concluidas: number
    canceladas: number
  }
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToToday: () => void
}

/**
 * Derives the calendar grid, per-date aggregation map and aggregate metrics
 * from the already-filtered visits/events lists. `calendarMonth` is provided
 * by the caller so it can be shared with `useAgendaFilters` (which needs to
 * move the visible month when the date range changes).
 */
export function useAgendaView({
  filteredVisits,
  filteredScheduleEvents,
  dateFilter,
  calendarMonth,
  setCalendarMonth,
}: UseAgendaViewInput): UseAgendaViewReturn {

  const calendarDays = useMemo(() => {
    if (dateFilter === 'hoje') {
      const today = new Date()
      return [{ date: today, day: today.getDate(), isCurrentMonth: true }]
    }

    if (dateFilter === 'semana' || dateFilter === 'proxima_semana') {
      const base = dateFilter === 'proxima_semana' ? addWeeks(new Date(), 1) : new Date()
      const weekStart = startOfWeek(base, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index)
        return { date, day: date.getDate(), isCurrentMonth: true }
      })
    }

    const { year, month } = calendarMonth
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDow = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: { date: Date; day: number; isCurrentMonth: boolean }[] = []
    const prevMonthLast = new Date(year, month, 0).getDate()
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLast - i), day: prevMonthLast - i, isCurrentMonth: false })
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ date: new Date(year, month, d), day: d, isCurrentMonth: true })
    }
    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), day: d, isCurrentMonth: false })
    }
    return days
  }, [calendarMonth, dateFilter])

  const visitsByDate = useMemo(() => {
    const map: Record<string, CalendarAgendaItem[]> = {}
    for (const v of filteredVisits) {
      const key = format(new Date(v.scheduled_at), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push({
        id: v.id,
        status: v.status,
        title: v.client_name,
        startsAt: v.scheduled_at,
        durationHours: v.duration_hours,
        kind: 'visit',
        subtitle: `Visita ${v.visit_number}`,
      })
    }
    for (const event of filteredScheduleEvents) {
      const key = format(new Date(event.starts_at), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push({
        id: event.id,
        status: event.status === 'cancelado' ? 'cancelada' : event.status === 'concluido' ? 'concluida' : 'agendada',
        title: event.title,
        startsAt: event.starts_at,
        durationHours: event.duration_hours,
        kind: 'event',
        subtitle: event.responsible_name || event.topic,
      })
    }
    return map
  }, [filteredVisits, filteredScheduleEvents])

  const metrics = useMemo(() => {
    const total = filteredVisits.length + filteredScheduleEvents.length
    const agendadas = filteredVisits.filter((v) => v.status === 'agendada').length + filteredScheduleEvents.filter((e) => e.status === 'agendado').length
    const emAndamento = filteredVisits.filter((v) => v.status === 'em_andamento').length
    const concluidas = filteredVisits.filter((v) => v.status === 'concluida').length + filteredScheduleEvents.filter((e) => e.status === 'concluido').length
    const canceladas = filteredVisits.filter((v) => v.status === 'cancelada').length + filteredScheduleEvents.filter((e) => e.status === 'cancelado').length
    return { total, agendadas, emAndamento, concluidas, canceladas }
  }, [filteredVisits, filteredScheduleEvents])

  const goToPrevMonth = useCallback(() => {
    setCalendarMonth((prev) => {
      const m = prev.month === 0 ? 11 : prev.month - 1
      const y = prev.month === 0 ? prev.year - 1 : prev.year
      return { year: y, month: m }
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCalendarMonth((prev) => {
      const m = prev.month === 11 ? 0 : prev.month + 1
      const y = prev.month === 11 ? prev.year + 1 : prev.year
      return { year: y, month: m }
    })
  }, [])

  const goToToday = useCallback(() => {
    const now = new Date()
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() })
  }, [])

  return {
    calendarDays,
    visitsByDate,
    metrics,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
  }
}
