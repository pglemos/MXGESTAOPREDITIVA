import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Clock, MapPin, RefreshCw, Filter,
  Building2, User, ChevronRight, Calendar,
  ChevronLeft, ChevronRightIcon, X, Plus, Trash2, Play,
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
    getNextVisitNumber,
  } = useAgendaAdmin()

  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    client_id: '',
    scheduled_at: '',
    scheduled_time: '09:00',
    duration_hours: '3',
    modality: 'Presencial',
    consultant_id: '',
    auxiliary_consultant_id: '',
    objective: '',
  })

  const monthLabel = format(
    new Date(calendarMonth.year, calendarMonth.month, 1),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  )

  const selectedDayVisits = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return visitsByDate[key] || []
  }, [selectedDate, visitsByDate])

  const groupedVisits = useMemo(() => {
    const groups: Record<string, { date: Date; label: string; visits: typeof visits }> = {}

    for (const visit of visits) {
      const date = parseISO(visit.scheduled_at)
      const key = format(date, 'yyyy-MM-dd')
      if (!groups[key]) {
        groups[key] = {
          date,
          label: getRelativeDateLabel(date),
          visits: [],
        }
      }
      groups[key].visits.push(visit)
    }

    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [visits])

  const handleOpenSchedule = (presetDate?: Date) => {
    const dateStr = presetDate ? format(presetDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    setScheduleForm((prev) => ({
      ...prev,
      client_id: '',
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

    const visitNumber = getNextVisitNumber(scheduleForm.client_id)
    const scheduledAt = `${scheduleForm.scheduled_at}T${scheduleForm.scheduled_time}:00`

    setSubmitting(true)
    const { error: createError } = await createVisit({
      client_id: scheduleForm.client_id,
      visit_number: visitNumber,
      scheduled_at: scheduledAt,
      duration_hours: Number(scheduleForm.duration_hours) || 3,
      modality: scheduleForm.modality,
      consultant_id: scheduleForm.consultant_id || null,
      auxiliary_consultant_id: scheduleForm.auxiliary_consultant_id || null,
      objective: scheduleForm.objective || null,
    })
    setSubmitting(false)

    if (createError) {
      toast.error(createError)
      return
    }

    toast.success(`Visita ${visitNumber} agendada com sucesso!`)
    setShowScheduleModal(false)
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
                      {group.visits.length} {group.visits.length === 1 ? 'visita' : 'visitas'}
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
                        linkTo={`/consultoria/clientes/${visit.client_slug}/visitas/${visit.visit_number}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-mx-0 xl:self-start">
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
              ) : selectedDayVisits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-mx-2xl text-center gap-mx-sm">
                  <CalendarDays size={32} className="text-text-label" />
                  <Typography variant="tiny" tone="muted">Nenhuma visita neste dia</Typography>
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
                            <Typography variant="tiny" tone="muted">Visita {visit.visit_number}/7</Typography>
                            <ChevronRight size={14} className="text-text-tertiary group-hover:text-brand-primary transition-colors" />
                          </div>
                        </div>
                      </Link>
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
        onClose={() => setShowScheduleModal(false)}
        title="Agendar Visita de Consultoria"
        description="Vincule a um cliente do CRM de consultoria"
        size="xl"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setShowScheduleModal(false)}>CANCELAR</Button>
            <Button type="submit" form="agenda-schedule-form" disabled={submitting || !scheduleForm.client_id} className="bg-brand-secondary">
              {submitting ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
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
    </main>
  )
}
