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
import { useAgendaAdmin } from '@/hooks/useAgendaAdmin'
import { cn } from '@/lib/utils'

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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getRelativeDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
}

function getVisitStatusBadge(status: string) {
  switch (status) {
    case 'agendada': return <Badge variant="outline" className="border-brand-primary/30 text-brand-primary">AGENDADA</Badge>
    case 'em_andamento': return <Badge variant="info">EM ANDAMENTO</Badge>
    case 'concluída': return <Badge variant="success">CONCLUÍDA</Badge>
    case 'cancelada': return <Badge variant="danger">CANCELADA</Badge>
    default: return <Badge variant="ghost">{status.toUpperCase()}</Badge>
  }
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
        <div className="flex flex-col gap-mx-tiny">
          <div className="flex items-center gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Agenda <span className="text-mx-green-700">MX</span></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md">AGENDAMENTOS E VISITAS DE CONSULTORIA</Typography>
        </div>

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-mx-md">
          <div className="flex items-center gap-mx-xs">
            <CalendarDays size={16} className="text-brand-primary" />
            <Typography variant="caption" className="font-black uppercase tracking-widest">Período</Typography>
          </div>
          <div className="flex flex-wrap gap-mx-xs">
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
          </div>

          <div className="hidden sm:block w-px h-mx-lg bg-border-default" />

          <div className="flex items-center gap-mx-xs">
            <Filter size={16} className="text-brand-primary" />
            <Typography variant="caption" className="font-black uppercase tracking-widest">Status</Typography>
          </div>
          <div className="flex flex-wrap gap-mx-xs">
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
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-mx-lg bg-status-error-surface border border-status-error/20">
          <Typography variant="p" tone="error">Falha ao carregar agenda: {error}</Typography>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-mx-lg">
        <div className="xl:col-span-2 flex flex-col gap-mx-lg">
          <Card className="border-none shadow-mx-md bg-white overflow-hidden">
            <div className="flex items-center justify-between p-mx-md border-b border-border-default">
              <button type="button" onClick={goToPrevMonth} className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border-default transition-all">
                <ChevronLeft size={18} />
              </button>

              <div className="flex items-center gap-mx-sm">
                <Typography variant="h3" className="text-sm font-black uppercase tracking-widest capitalize">
                  {monthLabel}
                </Typography>
                <button type="button" onClick={goToToday} className="px-2 py-1 rounded-mx-md bg-brand-primary/10 text-brand-primary text-mx-micro font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all">
                  Hoje
                </button>
              </div>

              <button type="button" onClick={goToNextMonth} className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border-default transition-all">
                <ChevronRightIcon size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-border-default">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-mx-sm text-center">
                  <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{d}</Typography>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((dayInfo, idx) => {
                const dateKey = format(dayInfo.date, 'yyyy-MM-dd')
                const dayVisits = visitsByDate[dateKey] || []
                const hasVisits = dayVisits.length > 0
                const isSelected = selectedDate ? isSameDay(dayInfo.date, selectedDate) : false
                const isTodayDate = isToday(dayInfo.date)

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dayInfo.isCurrentMonth ? dayInfo.date : null)
                      if (dayInfo.isCurrentMonth) handleOpenSchedule(dayInfo.date)
                    }}
                    className={cn(
                      'relative min-h-mx-4xl p-mx-xs flex flex-col items-center gap-mx-xs border-b border-r border-border-subtle transition-all',
                      !dayInfo.isCurrentMonth && 'bg-surface-alt/50 opacity-40',
                      dayInfo.isCurrentMonth && 'hover:bg-brand-primary/5',
                      isSelected && 'bg-brand-primary/10 ring-2 ring-brand-primary ring-inset',
                      isTodayDate && !isSelected && 'bg-brand-primary/5',
                    )}
                  >
                    <span className={cn(
                      'w-mx-lg h-mx-lg rounded-mx-full flex items-center justify-center text-xs font-black',
                      isTodayDate && 'bg-brand-primary text-white',
                      !isTodayDate && dayInfo.isCurrentMonth && 'text-text-primary',
                      !dayInfo.isCurrentMonth && 'text-text-tertiary',
                    )}>
                      {dayInfo.day}
                    </span>

                    {hasVisits && (
                      <div className="flex flex-col items-center gap-px w-full px-px">
                        {dayVisits.slice(0, 3).map((v, vi) => (
                          <div
                            key={vi}
                            className={cn('w-full rounded-sm h-1', getVisitDotColor(v.status))}
                          />
                        ))}
                        {dayVisits.length > 3 && (
                          <Typography variant="tiny" className="text-mx-micro text-text-tertiary leading-none">
                            +{dayVisits.length - 3}
                          </Typography>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

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
            <Card className="p-mx-2xl border-none shadow-mx-md bg-white flex flex-col items-center justify-center text-center gap-mx-md">
              <div className="w-mx-2xl h-mx-2xl rounded-mx-full bg-surface-alt flex items-center justify-center">
                <CalendarDays size={40} className="text-text-tertiary" />
              </div>
              <Typography variant="h3">Nenhuma visita encontrada</Typography>
              <Typography variant="caption" tone="muted">
                Não há agendamentos para o período selecionado.
              </Typography>
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
                    {group.visits.map((visit) => {
                      const scheduledDate = parseISO(visit.scheduled_at)
                      const isExpired = isPast(scheduledDate) && visit.status === 'agendada'

                      return (
                        <Card key={visit.id} className={cn(
                          'p-mx-md border-none shadow-mx-md bg-white hover:shadow-mx-xl transition-all group',
                          isExpired && 'border-l-4 border-l-status-warning',
                          visit.status === 'em_andamento' && 'border-l-4 border-l-status-info'
                        )}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-mx-md">
                            <Link
                              to={`/consultoria/clientes/${visit.client_id}/visitas/${visit.visit_number}`}
                              className="flex items-center gap-mx-md min-w-0 flex-1 cursor-pointer"
                            >
                              <div className={cn(
                                'w-mx-10 h-mx-10 rounded-mx-lg border flex items-center justify-center shrink-0',
                                isToday(scheduledDate) ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary' : 'bg-surface-alt border-border-default text-text-tertiary'
                              )}>
                                <Typography variant="h3" className="text-lg font-black">
                                  {format(scheduledDate, 'dd')}
                                </Typography>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-mx-xs mb-1">
                                  <Building2 size={14} className="text-brand-primary shrink-0" />
                                  <Typography variant="h3" className="text-sm truncate">{visit.client_name}</Typography>
                                </div>
                                <div className="flex items-center gap-mx-sm text-text-tertiary">
                                  <div className="flex items-center gap-mx-xs">
                                    <Clock size={12} />
                                    <Typography variant="tiny">
                                      {format(scheduledDate, 'HH:mm')} - {visit.duration_hours}h
                                    </Typography>
                                  </div>
                                  {visit.modality && (
                                    <div className="flex items-center gap-mx-xs">
                                      <MapPin size={12} />
                                      <Typography variant="tiny">{visit.modality}</Typography>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Link>

                            <div className="flex items-center gap-mx-sm sm:gap-mx-md">
                              {visit.objective && (
                                <Typography variant="tiny" tone="muted" className="hidden lg:block max-w-48 truncate">
                                  {visit.objective}
                                </Typography>
                              )}

                              <div className="flex flex-col items-end gap-mx-xs">
                                {getVisitStatusBadge(visit.status)}
                                <div className="flex items-center gap-mx-xs">
                                  <Typography variant="tiny" tone="muted">
                                    Visita {visit.visit_number}/7
                                  </Typography>
                                </div>
                              </div>

                              {visit.consultant && (
                                <div className="hidden md:flex items-center gap-mx-xs">
                                  <User size={14} className="text-text-tertiary" />
                                  <Typography variant="tiny" tone="muted">{visit.consultant.name}</Typography>
                                </div>
                              )}

                              <div className="flex items-center gap-mx-xs">
                                {visit.status === 'agendada' && (
                                  <Button variant="ghost" size="sm" className="text-status-info" onClick={() => handleStartVisit(visit.id)}>
                                    <Play size={14} />
                                  </Button>
                                )}
                                {visit.status === 'agendada' && (
                                  <Button variant="ghost" size="sm" className="text-status-error" onClick={() => handleCancelVisit(visit.id)}>
                                    <X size={14} />
                                  </Button>
                                )}
                                {visit.status === 'cancelada' && (
                                  <Button variant="ghost" size="sm" className="text-status-error" onClick={() => handleDeleteVisit(visit.id)}>
                                    <Trash2 size={14} />
                                  </Button>
                                )}
                                <Link to={`/consultoria/clientes/${visit.client_id}/visitas/${visit.visit_number}`}>
                                  <ChevronRight size={18} className="text-text-tertiary group-hover:text-brand-primary transition-colors shrink-0" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
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
                  <CalendarDays size={32} className="text-text-tertiary opacity-40" />
                  <Typography variant="tiny" tone="muted">Clique em um dia no calendário para ver os detalhes</Typography>
                </div>
              ) : selectedDayVisits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-mx-2xl text-center gap-mx-sm">
                  <CalendarDays size={32} className="text-text-tertiary opacity-40" />
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
                        to={`/consultoria/clientes/${visit.client_id}/visitas/${visit.visit_number}`}
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

      {showScheduleModal && (
        <div className="fixed inset-mx-0 bg-mx-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-mx-md" onClick={() => setShowScheduleModal(false)}>
          <Card className="w-full max-w-mx-sidebar-expanded bg-white border-none shadow-mx-xl max-h-mx-7xl overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="p-mx-lg border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
              <div className="flex items-center gap-mx-sm">
                <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <Typography variant="h3">Agendar Visita de Consultoria</Typography>
                  <Typography variant="tiny" tone="muted">Vincule a um cliente do CRM de consultoria</Typography>
                </div>
              </div>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="p-mx-lg space-y-mx-lg">
              <div className="space-y-mx-xs">
                <Typography as="label" htmlFor="agenda-client" variant="caption" className="font-black uppercase tracking-widest">Cliente da Consultoria *</Typography>
                <select
                  id="agenda-client"
                  value={scheduleForm.client_id}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full h-mx-12 px-4 bg-white border border-border-default rounded-mx-lg text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">Selecionar cliente...</option>
                  {clients.filter((c) => c.status === 'ativo').map((c) => (
                    <option key={c.id} value={c.id}>{c.name} (Etapa {c.current_visit_step || 0}/7)</option>
                  ))}
                </select>
                {selectedClientVisitNum && (
                  <Typography variant="tiny" tone="muted">
                    Será a visita {selectedClientVisitNum} deste cliente
                  </Typography>
                )}
              </div>

              <div className="grid grid-cols-2 gap-mx-md">
                <div className="space-y-mx-xs">
                  <Typography as="label" htmlFor="agenda-date" variant="caption" className="font-black uppercase tracking-widest">Data *</Typography>
                  <Input
                    id="agenda-date"
                    type="date"
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
                <div className="space-y-mx-xs">
                  <Typography as="label" htmlFor="agenda-modality" variant="caption" className="font-black uppercase tracking-widest">Modalidade</Typography>
                  <select
                    id="agenda-modality"
                    value={scheduleForm.modality}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, modality: e.target.value }))}
                    className="w-full h-mx-12 px-4 bg-white border border-border-default rounded-mx-lg text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-mx-md">
                <div className="space-y-mx-xs">
                  <Typography as="label" htmlFor="agenda-consultant" variant="caption" className="font-black uppercase tracking-widest">Consultor Responsável</Typography>
                  <select
                    id="agenda-consultant"
                    value={scheduleForm.consultant_id}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, consultant_id: e.target.value }))}
                    className="w-full h-mx-12 px-4 bg-white border border-border-default rounded-mx-lg text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Sem consultor...</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-mx-xs">
                  <Typography as="label" htmlFor="agenda-aux" variant="caption" className="font-black uppercase tracking-widest">Consultor Auxiliar</Typography>
                  <select
                    id="agenda-aux"
                    value={scheduleForm.auxiliary_consultant_id}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, auxiliary_consultant_id: e.target.value }))}
                    className="w-full h-mx-12 px-4 bg-white border border-border-default rounded-mx-lg text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Sem auxiliar...</option>
                    {consultants.filter((c) => c.id !== scheduleForm.consultant_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
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

              <div className="flex justify-end gap-mx-sm pt-mx-sm border-t border-border-default">
                <Button type="button" variant="ghost" onClick={() => setShowScheduleModal(false)}>CANCELAR</Button>
                <Button type="submit" disabled={submitting || !scheduleForm.client_id} className="bg-brand-secondary">
                  {submitting ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  )
}
