import { useState } from 'react'
import {
  useAgendaCRUD,
  useAgendaEvents,
  useAgendaFilters,
  useAgendaView,
  type CalendarMonth,
} from '@/hooks/agenda'

/**
 * Aggregator hook específico da page AgendaAdmin — compõe os 4 sub-hooks
 * (`useAgendaEvents`, `useAgendaFilters`, `useAgendaView`, `useAgendaCRUD`)
 * diretamente, sem passar pelo shim deprecated `useAgendaAdmin`.
 *
 * Mantém o mesmo formato de retorno consumido pela page (Story 2.6, ADR-0050/0051).
 */
export function useAgendaAdminPage() {
  const events = useAgendaEvents()

  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const filters = useAgendaFilters({
    visits: events.visits,
    scheduleEvents: events.scheduleEvents,
    calendarMonth,
    setCalendarMonth,
    canViewAllAgendas: events.canViewAllAgendas,
  })

  const view = useAgendaView({
    filteredVisits: filters.filteredVisits,
    filteredScheduleEvents: filters.filteredScheduleEvents,
    dateFilter: filters.dateFilter,
    calendarMonth,
    setCalendarMonth,
  })

  const crud = useAgendaCRUD({
    visits: events.visits,
    refetch: events.refetch,
    canViewAllAgendas: events.canViewAllAgendas,
  })

  return {
    visits: filters.filteredVisits,
    scheduleEvents: filters.filteredScheduleEvents,
    clients: events.clients,
    consultants: events.consultants,
    products: events.products,
    canViewAllAgendas: events.canViewAllAgendas,
    metrics: view.metrics,
    loading: events.loading,
    error: events.error,
    dateFilter: filters.dateFilter,
    setDateFilter: filters.setDateFilter,
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,
    consultantFilter: filters.consultantFilter,
    setConsultantFilter: filters.setConsultantFilter,
    activeFilters: filters.activeFilters,
    clearFilters: filters.clearFilters,
    refetch: events.refetch,
    calendarMonth,
    calendarDays: view.calendarDays,
    visitsByDate: view.visitsByDate,
    goToPrevMonth: view.goToPrevMonth,
    goToNextMonth: view.goToNextMonth,
    goToToday: view.goToToday,
    createVisit: crud.createVisit,
    updateVisit: crud.updateVisit,
    updateVisitStatus: crud.updateVisitStatus,
    deleteVisit: crud.deleteVisit,
    createScheduleEvent: crud.createScheduleEvent,
    updateScheduleEvent: crud.updateScheduleEvent,
    deleteScheduleEvent: crud.deleteScheduleEvent,
    getNextVisitNumber: crud.getNextVisitNumber,
  }
}

export type UseAgendaAdminPageReturn = ReturnType<typeof useAgendaAdminPage>
