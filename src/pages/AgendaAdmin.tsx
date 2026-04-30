import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Clock, MapPin, RefreshCw, Filter,
  Building2, User, ChevronRight, Calendar,
  ChevronLeft, ChevronRightIcon, X, Plus, Trash2, Play,
  Pencil,
} from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isPast, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { Skeleton } from '@/components/atoms/Skeleton'
import { FilterBar } from '@/components/molecules/FilterBar'
import { useAgendaAdmin } from '@/hooks/useAgendaAdmin'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/organisms/Modal'
import { AgendaCalendar } from '@/components/organisms/AgendaCalendar'
import { VisitCard } from '@/components/organisms/VisitCard'
import { PageHeader } from '@/components/molecules/PageHeader'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Select } from '@/components/atoms/Select'
import { DatePicker } from '@/components/atoms/DatePicker'
import { GoogleCalendarStatus } from '@/features/agenda/components/GoogleCalendarStatus'
import type { AgendaScheduleEvent, AgendaVisit } from '@/hooks/useAgendaAdmin'

type DateFilter = 'hoje' | 'semana' | 'proxima_semana' | 'mes' | 'todos'

const dateFilters: { key: DateFilter; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Semana' },
  { key: 'proxima_semana', label: 'Próx. Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'todos', label: 'Todos' },
]

const statusFilters = [
  { key: 'todos', label: 'Todos' },
  { key: 'agendada', label: 'Agendadas' },
  { key: 'em_andamento', label: 'Em Andamento' },
  { key: 'concluída', label: 'Concluídas' },
  { key: 'cancelada', label: 'Canceladas' },
]

function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

function getVisitDotColor(status: string) {
  switch (status) {
    case 'agendada': return 'bg-brand-primary'
    case 'em_andamento': return 'bg-status-info'
    case 'concluída': return 'bg-status-success'
    case 'cancelada': return 'bg-status-error'
    default: return 'bg-text-tertiary'
  }
}

function getEventTypeLabel(type: AgendaScheduleEvent['event_type']) {
  switch (type) {
    case 'aula': return 'AULA'
    case 'evento_online': return 'EVENTO ONLINE'
    case 'evento_presencial': return 'EVENTO PRESENCIAL'
    case 'bloqueio': return 'BLOQUEIO'
    default: return 'EVENTO'
  }
}

function ScheduleEventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: AgendaScheduleEvent
  onEdit: (event: AgendaScheduleEvent) => void
  onDelete: (id: string) => void
}) {
  const date = parseISO(event.starts_at)
  return (
    <Card className="p-mx-md border-none shadow-mx-md bg-white hover:shadow-mx-xl transition-all group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-mx-md">
        <div className="flex items-center gap-mx-md min-w-0 flex-1">
          <div className={cn(
            'w-mx-10 h-mx-10 rounded-mx-lg border flex items-center justify-center shrink-0',
            event.event_type === 'aula' ? 'bg-status-info/10 border-status-info/20 text-status-info' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
          )}>
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-mx-xs mb-1">
              <Badge variant="outline" className="text-mx-micro">{getEventTypeLabel(event.event_type)}</Badge>
              <Typography variant="h3" className="text-sm truncate">{event.title}</Typography>
            </div>
            <div className="flex flex-wrap items-center gap-mx-sm text-text-tertiary">
              <div className="flex items-center gap-mx-xs">
                <Clock size={12} />
                <Typography variant="tiny">{format(date, 'HH:mm')} - {event.duration_hours}h</Typography>
              </div>
              {event.location && (
                <div className="flex items-center gap-mx-xs">
                  <MapPin size={12} />
                  <Typography variant="tiny">{event.location}</Typography>
                </div>
              )}
              {event.responsible_name && (
                <div className="flex items-center gap-mx-xs">
                  <User size={12} />
                  <Typography variant="tiny">{event.responsible_name}</Typography>
                </div>
              )}
            </div>
            {event.topic && (
              <Typography variant="tiny" tone="muted" className="block mt-1 truncate">{event.topic}</Typography>
            )}
          </div>
        </div>

        <div className="flex items-center gap-mx-xs">
          <Button variant="ghost" size="sm" className="text-text-secondary" onClick={() => onEdit(event)}>
            <Pencil size={14} />
          </Button>
          <Button variant="ghost" size="sm" className="text-status-error" onClick={() => onDelete(event.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function AgendaAdmin() {
  const {
    visits,
    clients,
    consultants,
    metrics,
    loading,
    error,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    consultantFilter,
    setConsultantFilter,
    activeFilters,
    clearFilters,
    refetch,
    calendarMonth,
    calendarDays,
    visitsByDate,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    createVisit,
    updateVisitStatus,
    deleteVisit,
    updateVisit,
    scheduleEvents,
    createScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    getNextVisitNumber,
  } = useAgendaAdmin()

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    client_id: '',
    visit_number: '',
    status: 'agendada',
    scheduled_at: '',
    scheduled_time: '09:00',
    duration_hours: '3',
    modality: 'Presencial',
    consultant_id: '',
    auxiliary_consultant_id: '',
    objective: '',
  })
  const [eventForm, setEventForm] = useState({
    event_type: 'aula' as AgendaScheduleEvent['event_type'],
    title: '',
    topic: '',
    starts_at: '',
    starts_time: '20:00',
    duration_hours: '2',
    modality: 'Online',
    location: 'ZOOM',
    target_audience: '',
    audience_goal: '',
    responsible_user_id: '',
    responsible_name: '',
    ticket_price_text: '',
    google_event_id: '',
    status: 'agendado' as AgendaScheduleEvent['status'],
  })

  const monthLabel = format(
    new Date(calendarMonth.year, calendarMonth.month, 1),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  )

  const selectedDayVisits = useMemo(() => {
    if (!selectedDate) return []
    return visits.filter((visit) => isSameDay(parseISO(visit.scheduled_at), selectedDate))
  }, [selectedDate, visits])

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    return scheduleEvents.filter((event) => isSameDay(parseISO(event.starts_at), selectedDate))
  }, [selectedDate, scheduleEvents])

  const groupedVisits = useMemo(() => {
    const groups: Record<string, { date: Date; label: string; visits: typeof visits; events: typeof scheduleEvents }> = {}

    for (const visit of visits) {
      const date = parseISO(visit.scheduled_at)
      const key = format(date, 'yyyy-MM-dd')
      if (!groups[key]) {
        groups[key] = {
          date,
          label: getRelativeDateLabel(date),
          visits: [],
          events: [],
        }
      }
      groups[key].visits.push(visit)
    }

    for (const event of scheduleEvents) {
      const date = parseISO(event.starts_at)
      const key = format(date, 'yyyy-MM-dd')
      if (!groups[key]) {
        groups[key] = {
          date,
          label: getRelativeDateLabel(date),
          visits: [],
          events: [],
        }
      }
      groups[key].events.push(event)
    }

    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [visits, scheduleEvents])

  const handleOpenSchedule = (presetDate?: Date) => {
    const dateStr = presetDate ? format(presetDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    setEditingVisitId(null)
    setScheduleForm((prev) => ({
      ...prev,
      client_id: '',
      visit_number: '',
      status: 'agendada',
      scheduled_at: dateStr,
      scheduled_time: '09:00',
      duration_hours: '3',
      modality: 'Presencial',
      consultant_id: '',
      auxiliary_consultant_id: '',
      objective: '',
    }))
    setShowScheduleModal(true)
  }

  const handleOpenEditVisit = (visitId: string) => {
    const visit = visits.find((item) => item.id === visitId)
    if (!visit) return
    const scheduled = parseISO(visit.scheduled_at)
    setEditingVisitId(visit.id)
    setScheduleForm({
      client_id: visit.client_id,
      visit_number: String(visit.visit_number),
      status: visit.status,
      scheduled_at: format(scheduled, 'yyyy-MM-dd'),
      scheduled_time: format(scheduled, 'HH:mm'),
      duration_hours: String(visit.duration_hours || 3),
      modality: visit.modality || 'Presencial',
      consultant_id: visit.consultant_id || '',
      auxiliary_consultant_id: visit.auxiliary_consultant_id || '',
      objective: visit.objective || '',
    })
    setShowScheduleModal(true)
  }

  const handleOpenEvent = (presetDate?: Date) => {
    const dateStr = presetDate ? format(presetDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    setEditingEventId(null)
    setEventForm({
      event_type: 'aula',
      title: '',
      topic: '',
      starts_at: dateStr,
      starts_time: '20:00',
      duration_hours: '2',
      modality: 'Online',
      location: 'ZOOM',
      target_audience: '',
      audience_goal: '',
      responsible_user_id: '',
      responsible_name: '',
      ticket_price_text: '',
      google_event_id: '',
      status: 'agendado',
    })
    setShowEventModal(true)
  }

  const handleOpenEditEvent = (event: AgendaScheduleEvent) => {
    const startsAt = parseISO(event.starts_at)
    setEditingEventId(event.id)
    setEventForm({
      event_type: event.event_type,
      title: event.title,
      topic: event.topic || '',
      starts_at: format(startsAt, 'yyyy-MM-dd'),
      starts_time: format(startsAt, 'HH:mm'),
      duration_hours: String(event.duration_hours || 1),
      modality: event.modality || 'Online',
      location: event.location || '',
      target_audience: event.target_audience || '',
      audience_goal: event.audience_goal ? String(event.audience_goal) : '',
      responsible_user_id: event.responsible_user_id || '',
      responsible_name: event.responsible_name || '',
      ticket_price_text: event.ticket_price_text || '',
      google_event_id: event.google_event_id || '',
      status: event.status || 'agendado',
    })
    setShowEventModal(true)
  }

  const handleSelectClient = (clientId: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      client_id: clientId,
    }))
  }

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleForm.client_id) {
      toast.error('Selecione um cliente da consultoria.')
      return
    }
    if (!scheduleForm.scheduled_at || !scheduleForm.scheduled_time) {
      toast.error('Informe data e horário.')
      return
    }

    const visitNumber = editingVisitId
      ? Number(scheduleForm.visit_number) || 0
      : getNextVisitNumber(scheduleForm.client_id)
    const scheduledAt = `${scheduleForm.scheduled_at}T${scheduleForm.scheduled_time}:00`

    setSubmitting(true)
    const payload = {
      client_id: scheduleForm.client_id,
      visit_number: visitNumber,
      scheduled_at: scheduledAt,
      duration_hours: Number(scheduleForm.duration_hours) || 3,
      modality: scheduleForm.modality,
      consultant_id: scheduleForm.consultant_id || null,
      auxiliary_consultant_id: scheduleForm.auxiliary_consultant_id || null,
      objective: scheduleForm.objective || null,
    }
    const { error: createError } = editingVisitId
      ? await updateVisit({ ...payload, id: editingVisitId, status: scheduleForm.status })
      : await createVisit(payload)
    setSubmitting(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success(editingVisitId ? `Visita ${visitNumber} atualizada.` : `Visita ${visitNumber} agendada com sucesso!`)
    setShowScheduleModal(false)
    setEditingVisitId(null)
  }

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventForm.title.trim()) {
      toast.error('Informe o nome do evento ou aula.')
      return
    }
    if (!eventForm.starts_at || !eventForm.starts_time) {
      toast.error('Informe data e horario.')
      return
    }

    const responsible = consultants.find((item) => item.id === eventForm.responsible_user_id)
    const payload = {
      event_type: eventForm.event_type,
      title: eventForm.title.trim(),
      topic: eventForm.topic.trim() || null,
      starts_at: `${eventForm.starts_at}T${eventForm.starts_time}:00`,
      duration_hours: Number(eventForm.duration_hours) || 1,
      modality: eventForm.modality,
      location: eventForm.location.trim() || null,
      target_audience: eventForm.target_audience.trim() || null,
      audience_goal: eventForm.audience_goal ? Number(eventForm.audience_goal) : null,
      responsible_user_id: eventForm.responsible_user_id || null,
      responsible_name: responsible?.name || eventForm.responsible_name.trim() || null,
      ticket_price_text: eventForm.ticket_price_text.trim() || null,
      google_event_id: eventForm.google_event_id.trim() || null,
      status: eventForm.status,
    }

    setSubmitting(true)
    const { error: eventError } = editingEventId
      ? await updateScheduleEvent(editingEventId, payload)
      : await createScheduleEvent(payload)
    setSubmitting(false)

    if (eventError) {
      toast.error(eventError)
      return
    }

    toast.success(editingEventId ? 'Evento/aula atualizado.' : 'Evento/aula criado.')
    setShowEventModal(false)
    setEditingEventId(null)
  }

  const handleCancelVisit = async (visitId: string) => {
    const { error: updateError } = await updateVisitStatus(visitId, 'cancelada')
    if (updateError) {
      toast.error(updateError)
      return
    }
    toast.success('Visita cancelada.')
  }

  const handleStartVisit = async (visitId: string) => {
    const { error: updateError } = await updateVisitStatus(visitId, 'em_andamento')
    if (updateError) {
      toast.error(updateError)
      return
    }
    toast.success('Visita iniciada.')
  }

  const handleDeleteVisit = async (visitId: string) => {
    const { error: deleteError } = await deleteVisit(visitId)
    if (deleteError) {
      toast.error(deleteError)
      return
    }
    toast.success('Visita removida.')
  }

  const handleDeleteEvent = async (eventId: string) => {
    const { error: deleteError } = await deleteScheduleEvent(eventId)
    if (deleteError) {
      toast.error(deleteError)
      return
    }
    toast.success('Evento/aula removido.')
  }

  const selectedClientVisitNum = useMemo(() => {
    if (!scheduleForm.client_id) return null
    return getNextVisitNumber(scheduleForm.client_id)
  }, [scheduleForm.client_id, getNextVisitNumber])

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <PageHeader
          title="Agenda MX"
          description="AGENDAMENTOS E VISITAS DE CONSULTORIA"
        />

        <div className="flex flex-wrap items-center gap-mx-sm">
          <div className="grid grid-cols-5 gap-mx-xs">
            <Card className="p-mx-md border-none shadow-mx-md bg-white text-center">
              <Typography variant="tiny" tone="muted">TOTAL</Typography>
              <Typography variant="h2">{metrics.total}</Typography>
            </Card>
            <Card className="p-mx-md border-none shadow-mx-md bg-white text-center">
              <Typography variant="tiny" tone="muted">AGENDADAS</Typography>
              <Typography variant="h2" className="text-brand-primary">{metrics.agendadas}</Typography>
            </Card>
            <Card className="p-mx-md border-none shadow-mx-md bg-white text-center">
              <Typography variant="tiny" tone="muted">EM ANDAMENTO</Typography>
              <Typography variant="h2" className="text-status-info">{metrics.emAndamento}</Typography>
            </Card>
            <Card className="p-mx-md border-none shadow-mx-md bg-white text-center">
              <Typography variant="tiny" tone="muted">CONCLUÍDAS</Typography>
              <Typography variant="h2" className="text-status-success">{metrics.concluidas}</Typography>
            </Card>
            <Card className="p-mx-md border-none shadow-mx-md bg-white text-center">
              <Typography variant="tiny" tone="muted">CANCELADAS</Typography>
              <Typography variant="h2" className="text-status-error">{metrics.canceladas}</Typography>
            </Card>
          </div>

          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Atualizar" className="rounded-mx-xl bg-white">
            <RefreshCw size={18} />
          </Button>

          <Button className="bg-brand-secondary" onClick={() => handleOpenSchedule()}>
            <Plus size={18} className="mr-2" />
            AGENDAR VISITA
          </Button>
          <Button variant="outline" className="bg-white" onClick={() => handleOpenEvent()}>
            <Plus size={18} className="mr-2" />
            EVENTO/AULA
          </Button>
        </div>
      </header>

      <Card className="p-mx-md border-none shadow-mx-md bg-white">
        <div className="flex flex-col gap-mx-sm">
          <FilterBar label="Período" icon={<CalendarDays size={16} className="text-brand-primary" />}>
            {dateFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setDateFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-mx-lg text-xs font-black uppercase tracking-widest transition-all',
                  dateFilter === f.key
                    ? 'bg-brand-primary text-white shadow-mx-sm'
                    : 'bg-surface-alt text-text-secondary hover:bg-border-default'
                )}
              >
                {f.label}
              </button>
            ))}
          </FilterBar>
          <FilterBar label="Consultor" icon={<User size={16} className="text-brand-primary" />}>
            <div className="w-full sm:w-mx-64">
              <Select
                id="agenda-consultant-filter"
                value={consultantFilter}
                onChange={(event) => setConsultantFilter(event.target.value)}
                className="!h-mx-10 !py-1.5 text-xs uppercase tracking-widest"
                aria-label="Filtrar por consultor"
              >
                <option value="todos">Todos</option>
                {consultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>{consultant.name}</option>
                ))}
              </Select>
            </div>
          </FilterBar>
          <FilterBar label="Status" icon={<Filter size={16} className="text-brand-primary" />}>
            {statusFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-mx-lg text-xs font-black uppercase tracking-widest transition-all',
                  statusFilter === f.key
                    ? 'bg-brand-primary text-white shadow-mx-sm'
                    : 'bg-surface-alt text-text-secondary hover:bg-border-default'
                )}
              >
                {f.label}
              </button>
            ))}
            {activeFilters > 0 && (
              <>
                <Badge variant="brand" className="ml-mx-xs text-mx-micro font-black uppercase">
                  {activeFilters} {activeFilters === 1 ? 'filtro' : 'filtros'}
                </Badge>
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-mx-10 px-3 text-xs font-black uppercase">
                  LIMPAR
                </Button>
              </>
            )}
          </FilterBar>
        </div>
      </Card>

      {error && (
        <Card className="p-mx-lg bg-status-error-surface border border-status-error/20">
          <Typography variant="p" tone="error">Falha ao carregar agenda: {error}</Typography>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
        <div className="xl:col-span-2 flex flex-col gap-mx-lg">
          <AgendaCalendar
            calendarDays={calendarDays}
            visitsByDate={visitsByDate}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onDateClick={handleOpenSchedule}
            monthLabel={monthLabel}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
            onToday={goToToday}
            getVisitDotColor={getVisitDotColor}
          />

          {loading ? (
            <div className="space-y-mx-md">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-mx-lg border-none shadow-mx-md bg-white">
                  <Skeleton className="h-mx-10 w-mx-sidebar-expanded mb-mx-md" />
                  <div className="space-y-mx-md">
                    <Skeleton className="h-mx-2xl w-full" />
                    <Skeleton className="h-mx-2xl w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : groupedVisits.length === 0 ? (
            <Card className="border-none shadow-mx-md bg-white">
              <EmptyState
                size="lg"
                icon={<CalendarDays />}
                title="Nenhuma visita encontrada"
                description="Não há agendamentos para o período selecionado."
              />
            </Card>
          ) : (
            <div className="space-y-mx-lg">
              {groupedVisits.map((group) => (
                <div key={format(group.date, 'yyyy-MM-dd')}>
                  <div className={cn(
                    'flex items-center gap-mx-sm mb-mx-sm px-mx-xs',
                    isToday(group.date) && 'text-brand-primary'
                  )}>
                    <Calendar size={16} />
                    <Typography variant="caption" className="font-black uppercase tracking-widest">
                      {group.label}
                    </Typography>
                    <div className="flex-1 h-px bg-border-default" />
                    <Typography variant="tiny" tone="muted">
                      {group.visits.length + group.events.length} itens
                    </Typography>
                  </div>

                  <div className="space-y-mx-xs">
                    {group.visits.map((visit) => (
                      <VisitCard
                        key={visit.id}
                        visit={visit}
                        onStart={handleStartVisit}
                        onCancel={handleCancelVisit}
                        onDelete={handleDeleteVisit}
                        onEdit={handleOpenEditVisit}
                        linkTo={`/consultoria/clientes/${visit.client_slug}/visitas/${visit.visit_number}`}
                      />
                    ))}
                    {group.events.map((event) => (
                      <ScheduleEventCard
                        key={event.id}
                        event={event}
                        onEdit={handleOpenEditEvent}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-mx-0 xl:self-start space-y-mx-lg">
          <GoogleCalendarStatus compact />

          <Card className="border-none shadow-mx-md bg-white overflow-hidden">
            <div className="p-mx-md border-b border-border-default flex items-center justify-between">
              <Typography variant="caption" className="font-black uppercase tracking-widest">
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                  : 'Selecione um dia'}
              </Typography>
              {selectedDate && (
                <button type="button" onClick={() => setSelectedDate(null)} className="w-mx-lg h-mx-lg rounded-mx-md hover:bg-surface-alt flex items-center justify-center text-text-tertiary transition-all">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="p-mx-md max-h-mx-6xl overflow-y-auto no-scrollbar">
              {!selectedDate ? (
                <div className="flex flex-col items-center justify-center py-mx-2xl text-center gap-mx-sm">
                  <CalendarDays size={32} className="text-text-label" />
                  <Typography variant="tiny" tone="muted">Clique em um dia no calendário para ver os detalhes</Typography>
                </div>
              ) : selectedDayVisits.length === 0 && selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-mx-2xl text-center gap-mx-sm">
                  <CalendarDays size={32} className="text-text-label" />
                  <Typography variant="tiny" tone="muted">Nenhum item neste dia</Typography>
                  <Button variant="secondary" size="sm" className="mt-mx-sm" onClick={() => handleOpenSchedule(selectedDate)}>
                    <Plus size={14} className="mr-2" /> AGENDAR
                  </Button>
                </div>
              ) : (
                <div className="space-y-mx-sm">
                  {selectedDayVisits.map((visit) => {
                    const scheduledDate = parseISO(visit.scheduled_at)
                    return (
                      <Link
                        key={visit.id}
                        to={`/consultoria/clientes/${visit.client_slug}/visitas/${visit.visit_number}`}
                        className="block"
                      >
                        <div className="p-mx-sm rounded-mx-lg border border-border-default hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all group">
                          <div className="flex items-center gap-mx-xs mb-1">
                            <div className={cn('w-2 h-2 rounded-mx-full', getVisitDotColor(visit.status))} />
                            <Typography variant="tiny" className="font-black">
                              {format(scheduledDate, 'HH:mm')}
                            </Typography>
                            <Typography variant="tiny" tone="muted">• {visit.duration_hours}h</Typography>
                          </div>
                          <div className="flex items-center gap-mx-xs mb-1">
                            <Building2 size={12} className="text-brand-primary shrink-0" />
                            <Typography variant="tiny" className="font-bold truncate">{visit.client_name}</Typography>
                          </div>
                          {visit.consultant && (
                            <div className="flex items-center gap-mx-xs">
                              <User size={10} className="text-text-tertiary shrink-0" />
                              <Typography variant="tiny" tone="muted" className="truncate">{visit.consultant.name}</Typography>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <Typography variant="tiny" tone="muted">Visita {visit.source_visit_code || visit.visit_number}/7</Typography>
                            <ChevronRight size={14} className="text-text-tertiary group-hover:text-brand-primary transition-colors" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                  {selectedDayEvents.map((event) => {
                    const startsAt = parseISO(event.starts_at)
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleOpenEditEvent(event)}
                        className="w-full text-left p-mx-sm rounded-mx-lg border border-border-default hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all group"
                      >
                        <div className="flex items-center gap-mx-xs mb-1">
                          <CalendarDays size={12} className="text-brand-primary shrink-0" />
                          <Typography variant="tiny" className="font-black">{format(startsAt, 'HH:mm')}</Typography>
                          <Badge variant="outline" className="text-mx-nano">{getEventTypeLabel(event.event_type)}</Badge>
                        </div>
                        <Typography variant="tiny" className="font-bold truncate block">{event.title}</Typography>
                        {event.responsible_name && (
                          <Typography variant="tiny" tone="muted" className="truncate block mt-1">{event.responsible_name}</Typography>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setEditingVisitId(null)
        }}
        title={editingVisitId ? 'Editar Visita de Consultoria' : 'Agendar Visita de Consultoria'}
        description="Vincule a um cliente do CRM de consultoria"
        size="xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => {
              setShowScheduleModal(false)
              setEditingVisitId(null)
            }}>CANCELAR</Button>
            <Button type="submit" form="agenda-schedule-form" disabled={submitting || !scheduleForm.client_id} className="bg-brand-secondary">
              {submitting ? 'SALVANDO...' : editingVisitId ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR AGENDAMENTO'}
            </Button>
          </>
        }
      >
        <form id="agenda-schedule-form" onSubmit={handleSubmitSchedule} className="space-y-mx-lg">
          <div className="space-y-mx-xs">
            <Select
              id="agenda-client"
              label="Cliente da Consultoria *"
              value={scheduleForm.client_id}
              onChange={(e) => handleSelectClient(e.target.value)}
            >
              <option value="">Selecionar cliente...</option>
              {clients.filter((c) => c.status === 'ativo').map((c) => (
                <option key={c.id} value={c.id}>{c.name} (Etapa {c.current_visit_step || 0}/7)</option>
              ))}
            </Select>
            {selectedClientVisitNum && (
              <Typography variant="tiny" tone="muted">
                Será a visita {selectedClientVisitNum} deste cliente
              </Typography>
            )}
          </div>

          {editingVisitId && (
            <div className="grid grid-cols-2 gap-mx-md">
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="agenda-visit-number" variant="caption" className="font-black uppercase tracking-widest">Número da visita</Typography>
                <Input
                  id="agenda-visit-number"
                  type="number"
                  min="0"
                  value={scheduleForm.visit_number}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, visit_number: e.target.value }))}
                />
              </div>
              <Select
                id="agenda-visit-status"
                label="Status"
                value={scheduleForm.status}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="agendada">Agendada</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluída">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-date" variant="caption" className="font-black uppercase tracking-widest">Data *</Typography>
              <DatePicker
                id="agenda-date"
                value={scheduleForm.scheduled_at}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-time" variant="caption" className="font-black uppercase tracking-widest">Horário *</Typography>
              <Input
                id="agenda-time"
                type="time"
                value={scheduleForm.scheduled_time}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-duration" variant="caption" className="font-black uppercase tracking-widest">Duração (horas)</Typography>
              <Input
                id="agenda-duration"
                type="number"
                min="1"
                max="12"
                value={scheduleForm.duration_hours}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, duration_hours: e.target.value }))}
              />
            </div>
            <Select
              id="agenda-modality"
              label="Modalidade"
              value={scheduleForm.modality}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, modality: e.target.value }))}
            >
              <option value="Presencial">Presencial</option>
              <option value="Online">Online</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-mx-md">
            <Select
              id="agenda-consultant"
              label="Consultor Responsável"
              value={scheduleForm.consultant_id}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, consultant_id: e.target.value }))}
            >
              <option value="">Sem consultor...</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select
              id="agenda-aux"
              label="Consultor Auxiliar"
              value={scheduleForm.auxiliary_consultant_id}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, auxiliary_consultant_id: e.target.value }))}
            >
              <option value="">Sem auxiliar...</option>
              {consultants.filter((c) => c.id !== scheduleForm.consultant_id).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="agenda-objective" variant="caption" className="font-black uppercase tracking-widest">Objetivo da Visita</Typography>
            <Textarea
              id="agenda-objective"
              value={scheduleForm.objective}
              onChange={(e) => setScheduleForm((prev) => ({ ...prev, objective: e.target.value }))}
              placeholder="Descreva o objetivo principal desta visita..."
              className="min-h-mx-24"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          setEditingEventId(null)
        }}
        title={editingEventId ? 'Editar Evento/Aula' : 'Novo Evento/Aula'}
        description="Cadastre aulas, eventos online e eventos presenciais do cronograma MX"
        size="xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => {
              setShowEventModal(false)
              setEditingEventId(null)
            }}>CANCELAR</Button>
            <Button type="submit" form="agenda-event-form" disabled={submitting || !eventForm.title.trim()} className="bg-brand-secondary">
              {submitting ? 'SALVANDO...' : 'SALVAR EVENTO/AULA'}
            </Button>
          </>
        }
      >
        <form id="agenda-event-form" onSubmit={handleSubmitEvent} className="space-y-mx-lg">
          <div className="grid grid-cols-2 gap-mx-md">
            <Select
              id="agenda-event-type"
              label="Tipo"
              value={eventForm.event_type}
              onChange={(e) => setEventForm((prev) => ({
                ...prev,
                event_type: e.target.value as AgendaScheduleEvent['event_type'],
                modality: e.target.value === 'evento_presencial' ? 'Presencial' : 'Online',
                location: e.target.value === 'evento_presencial' ? '' : 'ZOOM',
              }))}
            >
              <option value="aula">Aula</option>
              <option value="evento_online">Evento online</option>
              <option value="evento_presencial">Evento presencial</option>
              <option value="bloqueio">Bloqueio</option>
            </Select>
            <Select
              id="agenda-event-status"
              label="Status"
              value={eventForm.status}
              onChange={(e) => setEventForm((prev) => ({ ...prev, status: e.target.value as AgendaScheduleEvent['status'] }))}
            >
              <option value="agendado">Agendado</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </div>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="agenda-event-title" variant="caption" className="font-black uppercase tracking-widest">Evento/Aula *</Typography>
            <Input
              id="agenda-event-title"
              value={eventForm.title}
              onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Formação de Vendedores"
            />
          </div>

          <div className="space-y-mx-xs">
            <Typography as="label" htmlFor="agenda-event-topic" variant="caption" className="font-black uppercase tracking-widest">Tema</Typography>
            <Input
              id="agenda-event-topic"
              value={eventForm.topic}
              onChange={(e) => setEventForm((prev) => ({ ...prev, topic: e.target.value }))}
              placeholder="Tema ou pauta principal"
            />
          </div>

          <div className="grid grid-cols-3 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-date" variant="caption" className="font-black uppercase tracking-widest">Data *</Typography>
              <DatePicker
                id="agenda-event-date"
                value={eventForm.starts_at}
                onChange={(e) => setEventForm((prev) => ({ ...prev, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-time" variant="caption" className="font-black uppercase tracking-widest">Horário *</Typography>
              <Input
                id="agenda-event-time"
                type="time"
                value={eventForm.starts_time}
                onChange={(e) => setEventForm((prev) => ({ ...prev, starts_time: e.target.value }))}
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-duration" variant="caption" className="font-black uppercase tracking-widest">Duração</Typography>
              <Input
                id="agenda-event-duration"
                type="number"
                min="1"
                max="24"
                value={eventForm.duration_hours}
                onChange={(e) => setEventForm((prev) => ({ ...prev, duration_hours: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-mx-md">
            <Select
              id="agenda-event-responsible"
              label="Responsável"
              value={eventForm.responsible_user_id}
              onChange={(e) => {
                const selected = consultants.find((item) => item.id === e.target.value)
                setEventForm((prev) => ({
                  ...prev,
                  responsible_user_id: e.target.value,
                  responsible_name: selected?.name || '',
                }))
              }}
            >
              <option value="">Sem responsável...</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-location" variant="caption" className="font-black uppercase tracking-widest">Local</Typography>
              <Input
                id="agenda-event-location"
                value={eventForm.location}
                onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="ZOOM, Online, Lagoa Santa / MG..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-target" variant="caption" className="font-black uppercase tracking-widest">Público alvo</Typography>
              <Input
                id="agenda-event-target"
                value={eventForm.target_audience}
                onChange={(e) => setEventForm((prev) => ({ ...prev, target_audience: e.target.value }))}
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-goal" variant="caption" className="font-black uppercase tracking-widest">Meta de público</Typography>
              <Input
                id="agenda-event-goal"
                type="number"
                min="0"
                value={eventForm.audience_goal}
                onChange={(e) => setEventForm((prev) => ({ ...prev, audience_goal: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-mx-md">
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-ticket" variant="caption" className="font-black uppercase tracking-widest">Valor do ingresso</Typography>
              <Input
                id="agenda-event-ticket"
                value={eventForm.ticket_price_text}
                onChange={(e) => setEventForm((prev) => ({ ...prev, ticket_price_text: e.target.value }))}
                placeholder="R$ 297,00"
              />
            </div>
            <div className="space-y-mx-xs">
              <Typography as="label" htmlFor="agenda-event-google-id" variant="caption" className="font-black uppercase tracking-widest">ID Google</Typography>
              <Input
                id="agenda-event-google-id"
                value={eventForm.google_event_id}
                onChange={(e) => setEventForm((prev) => ({ ...prev, google_event_id: e.target.value }))}
              />
            </div>
          </div>
        </form>
      </Modal>
    </main>
  )
}
