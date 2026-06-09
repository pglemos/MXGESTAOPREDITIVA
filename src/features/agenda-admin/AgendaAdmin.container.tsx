import { useEffect, useMemo, useState } from 'react'
import { addWeeks, endOfWeek, format, isSameDay, parseISO, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { mergeAgendaOptionLabels, useAgendaOptions } from '@/hooks/useAgendaOptions'
import { GoogleCalendarStatus } from '@/features/agenda/components/GoogleCalendarStatus'
import { useAgendaAdminPage } from './hooks/useAgendaAdminPage'
import { useAgendaAdminForms } from './hooks/useAgendaAdminForms'
import { AgendaHeader } from './sections/AgendaHeader'
import { AgendaFiltersBar } from './sections/AgendaFiltersBar'
import { AgendaCalendarView } from './sections/AgendaCalendarView'
import { AgendaListView } from './sections/AgendaListView'
import { VisitaDetailPanel } from './sections/VisitaDetailPanel'
import { VisitaModal } from './modals/VisitaModal'
import { EventoModal } from './modals/EventoModal'
import { AgendaErrorBoundary } from './components/AgendaErrorBoundary'
import { getRelativeDateLabel } from './data/agendaHelpers'

export function AgendaAdmin() {
  const {
    visitReasonOptions: agendaVisitReasonOptions,
    targetAudienceOptions: agendaTargetAudienceOptions,
  } = useAgendaOptions()
  const page = useAgendaAdminPage()
  const {
    visits, clients, consultants, products, scheduleEvents,
    metrics, loading, error,
    dateFilter, setDateFilter, statusFilter, setStatusFilter,
    consultantFilter, setConsultantFilter,
    activeFilters, clearFilters, refetch,
    calendarMonth, calendarDays, visitsByDate,
    goToPrevMonth, goToNextMonth, goToToday,
    createVisit, updateVisit, updateVisitStatus, deleteVisit,
    createScheduleEvent, updateScheduleEvent, deleteScheduleEvent,
    getNextVisitNumber, canViewAllAgendas,
  } = page

  const forms = useAgendaAdminForms({
    visits, consultants, canViewAllAgendas,
    createVisit, updateVisit, updateVisitStatus, deleteVisit,
    createScheduleEvent, updateScheduleEvent, deleteScheduleEvent,
    getNextVisitNumber,
  })

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const calendarViewMode = dateFilter === 'hoje'
    ? 'day'
    : dateFilter === 'semana' || dateFilter === 'proxima_semana'
      ? 'week'
      : 'month'

  const monthLabel = useMemo(() => {
    if (dateFilter === 'hoje') {
      return `Hoje · ${format(new Date(), "dd 'de' MMMM", { locale: ptBR })}`
    }
    if (dateFilter === 'semana' || dateFilter === 'proxima_semana') {
      const base = dateFilter === 'proxima_semana' ? addWeeks(new Date(), 1) : new Date()
      const start = startOfWeek(base, { weekStartsOn: 1 })
      const end = endOfWeek(base, { weekStartsOn: 1 })
      const prefix = dateFilter === 'proxima_semana' ? 'Próxima semana' : 'Semana'
      return `${prefix} · ${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`
    }
    return format(new Date(calendarMonth.year, calendarMonth.month, 1), "MMMM 'de' yyyy", { locale: ptBR })
  }, [calendarMonth, dateFilter])

  useEffect(() => {
    setSelectedDate(dateFilter === 'hoje' ? new Date() : null)
  }, [dateFilter])

  const selectedDayVisits = useMemo(
    () => !selectedDate ? [] : visits.filter((v) => isSameDay(parseISO(v.scheduled_at), selectedDate)),
    [selectedDate, visits],
  )
  const selectedDayEvents = useMemo(
    () => !selectedDate ? [] : scheduleEvents.filter((e) => isSameDay(parseISO(e.starts_at), selectedDate)),
    [selectedDate, scheduleEvents],
  )

  const productSelectOptions = useMemo(() => {
    const names = new Set(products.map((p) => p.name).filter(Boolean))
    if (forms.scheduleForm.product_name) names.add(forms.scheduleForm.product_name)
    if (forms.eventForm.product_name) names.add(forms.eventForm.product_name)
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [forms.eventForm.product_name, products, forms.scheduleForm.product_name])

  const visitReasonSelectOptions = useMemo(
    () => mergeAgendaOptionLabels(agendaVisitReasonOptions, forms.scheduleForm.visit_reason, forms.eventForm.visit_reason),
    [agendaVisitReasonOptions, forms.eventForm.visit_reason, forms.scheduleForm.visit_reason],
  )
  const targetAudienceSelectOptions = useMemo(
    () => mergeAgendaOptionLabels(agendaTargetAudienceOptions, forms.scheduleForm.target_audience, forms.eventForm.target_audience),
    [agendaTargetAudienceOptions, forms.eventForm.target_audience, forms.scheduleForm.target_audience],
  )

  const groupedVisits = useMemo(() => {
    const groups: Record<string, { date: Date; label: string; visits: typeof visits; events: typeof scheduleEvents }> = {}
    for (const visit of visits) {
      const date = parseISO(visit.scheduled_at)
      const key = format(date, 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = { date, label: getRelativeDateLabel(date), visits: [], events: [] }
      groups[key].visits.push(visit)
    }
    for (const event of scheduleEvents) {
      const date = parseISO(event.starts_at)
      const key = format(date, 'yyyy-MM-dd')
      if (!groups[key]) groups[key] = { date, label: getRelativeDateLabel(date), visits: [], events: [] }
      groups[key].events.push(event)
    }
    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [visits, scheduleEvents])

  return (
    <main className="w-full h-full flex flex-col gap-mx-md sm:gap-mx-lg p-mx-sm sm:p-mx-lg overflow-y-auto no-scrollbar bg-white relative">
      <AgendaErrorBoundary sectionName="header">
        <AgendaHeader
          metrics={metrics}
          onRefresh={() => refetch()}
          onCreateVisit={() => forms.handleOpenSchedule()}
          onCreateEvent={() => forms.handleOpenEvent()}
          onCreateBlock={() => forms.handleOpenBlock()}
        />
      </AgendaErrorBoundary>

      <AgendaErrorBoundary sectionName="filters">
        <AgendaFiltersBar
          dateFilter={dateFilter} setDateFilter={setDateFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          consultantFilter={consultantFilter} setConsultantFilter={setConsultantFilter}
          activeFilters={activeFilters} clearFilters={clearFilters}
          consultants={consultants} canViewAllAgendas={canViewAllAgendas}
        />
      </AgendaErrorBoundary>

      {error && (
        <Card className="p-mx-lg bg-status-error-surface border border-status-error/20">
          <Typography variant="p" tone="error">Falha ao carregar agenda: {error}</Typography>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
        <div className="xl:col-span-2 flex flex-col gap-mx-lg">
          <AgendaErrorBoundary sectionName="calendar">
            <AgendaCalendarView
              calendarDays={calendarDays} visitsByDate={visitsByDate}
              selectedDate={selectedDate} onDateSelect={setSelectedDate}
              monthLabel={monthLabel}
              onPrevMonth={goToPrevMonth} onNextMonth={goToNextMonth}
              onTodayClick={() => { goToToday(); setDateFilter('hoje') }}
              calendarViewMode={calendarViewMode} dateFilter={dateFilter}
            />
          </AgendaErrorBoundary>

          <AgendaErrorBoundary sectionName="list">
            <AgendaListView
              loading={loading} groupedVisits={groupedVisits}
              onStartVisit={forms.handleStartVisit}
              onCancelVisit={forms.handleCancelVisit}
              onDeleteVisit={forms.handleDeleteVisit}
              onEditVisit={forms.handleOpenEditVisit}
              onEditEvent={forms.handleOpenEditEvent}
              onDeleteEvent={forms.handleDeleteEvent}
            />
          </AgendaErrorBoundary>
        </div>

        <div className="xl:sticky xl:top-mx-0 xl:self-start space-y-mx-lg">
          <GoogleCalendarStatus compact />
          <AgendaErrorBoundary sectionName="detail">
            <VisitaDetailPanel
              selectedDate={selectedDate}
              selectedDayVisits={selectedDayVisits}
              selectedDayEvents={selectedDayEvents}
              onClearSelection={() => setSelectedDate(null)}
              onScheduleVisit={forms.handleOpenSchedule}
              onBlockDate={forms.handleOpenBlock}
              onEditEvent={forms.handleOpenEditEvent}
            />
          </AgendaErrorBoundary>
        </div>
      </div>

      <VisitaModal
        open={forms.showScheduleModal} onClose={forms.closeScheduleModal}
        editingVisitId={forms.editingVisitId}
        scheduleForm={forms.scheduleForm} setScheduleForm={forms.setScheduleForm}
        submitting={forms.submitting} onSubmit={forms.handleSubmitSchedule}
        clients={clients} consultants={consultants}
        visitReasonSelectOptions={visitReasonSelectOptions}
        targetAudienceSelectOptions={targetAudienceSelectOptions}
        productSelectOptions={productSelectOptions}
        getNextVisitNumber={getNextVisitNumber}
      />

      <EventoModal
        open={forms.showEventModal} onClose={forms.closeEventModal}
        editingEventId={forms.editingEventId}
        eventForm={forms.eventForm} setEventForm={forms.setEventForm}
        submitting={forms.submitting} onSubmit={forms.handleSubmitEvent}
        consultants={consultants}
        visitReasonSelectOptions={visitReasonSelectOptions}
        targetAudienceSelectOptions={targetAudienceSelectOptions}
        productSelectOptions={productSelectOptions}
      />
    </main>
  )
}

export default AgendaAdmin
