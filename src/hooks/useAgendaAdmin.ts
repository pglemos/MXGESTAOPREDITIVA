import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addDays,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import type { ConsultingVisit } from '@/features/consultoria/types'

type CalendarSyncResult = {
  ok: boolean
  kind?: 'visit' | 'schedule_event'
  personalEventId: string | null
  centralEventId: string | null
  errors: { calendar: 'personal' | 'central'; message: string }[]
  userConnected: boolean
  centralConnected: boolean
}

const SAO_PAULO_OFFSET = '-03:00'

export function buildSaoPauloDateTime(date: string, time: string) {
  return `${date}T${time}:00${SAO_PAULO_OFFSET}`
}

function getCentralSyncError(result: CalendarSyncResult | null) {
  if (!result) return 'Agendamento salvo no sistema, mas não foi possível confirmar a sincronização com a Agenda Central MX.'
  const centralError = result.errors.find((item) => item.calendar === 'central')
  if (centralError) return `Agendamento salvo no sistema, mas não sincronizou com a Agenda Central MX: ${centralError.message}`
  if (!result.centralConnected) return 'Agendamento salvo no sistema, mas a Agenda Central MX não está conectada.'
  return null
}

async function syncVisitToGoogle(
  visitId: string,
  action: 'upsert' | 'delete' = 'upsert',
): Promise<CalendarSyncResult | null> {
  try {
    const { data: visit } = await supabase
      .from('visitas_consultoria')
      .select(`
        id,
        client_id,
        scheduled_at,
        duration_hours,
        modality,
        status,
        objective,
        visit_reason,
        target_audience,
        product_name,
        google_event_id,
        google_event_id_central,
        consultant:usuarios!visitas_consultoria_consultor_id_fkey(email),
        client:clientes_consultoria!client_id(name)
      `)
      .eq('id', visitId)
      .maybeSingle() as { data: any }
    if (!visit) return null
    const payload = {
      id: visit.id,
      client_id: visit.client_id,
      client_name: visit.client?.name ?? null,
      client_address: null,
      scheduled_at: visit.scheduled_at,
      duration_hours: visit.duration_hours,
      modality: visit.modality,
      status: visit.status,
      objective: visit.objective,
      visit_reason: visit.visit_reason ?? null,
      target_audience: visit.target_audience ?? null,
      product_name: visit.product_name ?? null,
      consultant_email: visit.consultant?.email ?? null,
      google_event_id: visit.google_event_id ?? null,
      google_event_id_central: visit.google_event_id_central ?? null,
    }
    const { data, error } = await supabase.functions.invoke<CalendarSyncResult>('google-calendar-sync', { body: { action, visit: payload } })
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}

async function syncScheduleEventToGoogle(
  eventId: string,
  action: 'upsert' | 'delete' = 'upsert',
): Promise<CalendarSyncResult | null> {
  try {
    const { data: event } = await supabase
      .from('eventos_agenda_consultoria')
      .select(`
        id,
        event_type,
        title,
        topic,
        starts_at,
        duration_hours,
        modality,
        location,
        target_audience,
        audience_goal,
        responsible_name,
        ticket_price_text,
        visit_reason,
        product_name,
        google_event_id,
        status,
        responsible:usuarios!eventos_agenda_consultoria_responsavel_usuario_id_fkey(email)
      `)
      .eq('id', eventId)
      .maybeSingle() as { data: any }
    if (!event) return null

    const payload = {
      id: event.id,
      event_type: event.event_type,
      title: event.title,
      topic: event.topic ?? null,
      starts_at: event.starts_at,
      duration_hours: event.duration_hours,
      modality: event.modality,
      location: event.location ?? null,
      target_audience: event.target_audience ?? null,
      audience_goal: event.audience_goal ?? null,
      responsible_name: event.responsible_name ?? null,
      responsible_email: event.responsible?.email ?? null,
      ticket_price_text: event.ticket_price_text ?? null,
      visit_reason: event.visit_reason ?? null,
      product_name: event.product_name ?? null,
      google_event_id: event.google_event_id ?? null,
      status: event.status,
    }
    const { data, error } = await supabase.functions.invoke<CalendarSyncResult>('google-calendar-sync', {
      body: { action, event: payload },
    })
    if (error) throw error
    return data ?? null
  } catch {
    return null
  }
}

export type AgendaVisit = ConsultingVisit & {
  client_name: string
  client_slug: string
  client_status: string
  client_modality: string | null
  source_visit_code?: string | null
}

export type AgendaScheduleEvent = {
  id: string
  event_type: 'aula' | 'evento_online' | 'evento_presencial' | 'bloqueio'
  title: string
  topic: string | null
  starts_at: string
  duration_hours: number
  modality: string
  location: string | null
  target_audience: string | null
  audience_goal: number | null
  responsible_user_id: string | null
  responsible_name: string | null
  ticket_price_text: string | null
  visit_reason: string | null
  product_name: string | null
  google_event_id: string | null
  status: 'agendado' | 'cancelado' | 'concluido'
  source_sheet: string | null
  created_at: string
  updated_at: string
  responsible?: { name: string; email: string } | null
}

export type AgendaClient = {
  id: string
  name: string
  status: string
  current_visit_step: number
}

export type AgendaConsultant = {
  id: string
  name: string
  email: string
}

export type AgendaProduct = {
  id: string
  name: string
  status?: string | null
  sort_order?: number | null
}

const DATE_FILTERS = ['hoje', 'semana', 'mes', 'proxima_semana', 'todos'] as const
type DateFilter = typeof DATE_FILTERS[number]
type UrlFilterKey = 'range' | 'status' | 'consultant'

function getDateFilterInterval(
  dateFilter: DateFilter,
  calendarMonth: { year: number; month: number },
) {
  const now = new Date()

  switch (dateFilter) {
    case 'hoje':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'semana':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      }
    case 'proxima_semana': {
      const nextWeekBase = addWeeks(now, 1)
      return {
        start: startOfWeek(nextWeekBase, { weekStartsOn: 1 }),
        end: endOfWeek(nextWeekBase, { weekStartsOn: 1 }),
      }
    }
    case 'mes': {
      const visibleMonth = new Date(calendarMonth.year, calendarMonth.month, 1)
      return {
        start: startOfMonth(visibleMonth),
        end: endOfMonth(visibleMonth),
      }
    }
    default:
      return null
  }
}

function getInitialSearchParam(key: UrlFilterKey, fallback: string, allowedValues?: readonly string[]) {
  if (typeof window === 'undefined') return fallback
  const value = new URLSearchParams(window.location.search).get(key) || fallback
  return allowedValues && !allowedValues.includes(value) ? fallback : value
}

export type CreateVisitInput = {
  client_id: string
  visit_number: number
  scheduled_at: string
  duration_hours: number
  modality: string
  consultant_id: string | null
  auxiliary_consultant_id: string | null
  objective: string | null
  visit_reason: string | null
  target_audience: string | null
  product_name: string | null
}

export type UpdateVisitInput = CreateVisitInput & {
  id: string
  status: string
}

export type ScheduleEventInput = {
  event_type: AgendaScheduleEvent['event_type']
  title: string
  topic: string | null
  starts_at: string
  duration_hours: number
  modality: string
  location: string | null
  target_audience: string | null
  audience_goal: number | null
  responsible_user_id: string | null
  responsible_name: string | null
  ticket_price_text: string | null
  visit_reason: string | null
  product_name: string | null
  google_event_id?: string | null
  status?: AgendaScheduleEvent['status']
}

export function useAgendaAdmin() {
  const { supabaseUser, role } = useAuth()
  const [visits, setVisits] = useState<AgendaVisit[]>([])
  const [scheduleEvents, setScheduleEvents] = useState<AgendaScheduleEvent[]>([])
  const [clients, setClients] = useState<AgendaClient[]>([])
  const [consultants, setConsultants] = useState<AgendaConsultant[]>([])
  const [products, setProducts] = useState<AgendaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilterState] = useState<DateFilter>(() => getInitialSearchParam('range', 'semana', DATE_FILTERS) as DateFilter)
  const [statusFilter, setStatusFilterState] = useState<string>(() => getInitialSearchParam('status', 'todos'))
  const [consultantFilter, setConsultantFilterState] = useState<string>(() => getInitialSearchParam('consultant', 'todos'))
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const fetchVisits = useCallback(async () => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      setVisits([])
      setScheduleEvents([])
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [visitsRes, eventsRes, clientsRes, usersRes, productsRes] = await Promise.all([
      supabase
        .from('visitas_consultoria')
        .select(`
          *,
          consultant:usuarios!visitas_consultoria_consultor_id_fkey(name, email),
          auxiliary_consultant:usuarios!visitas_consultoria_consultor_auxiliar_id_fkey(name, email),
          client:clientes_consultoria!client_id(name, slug, status, modality)
        `)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('eventos_agenda_consultoria')
        .select('*, responsible:usuarios!eventos_agenda_consultoria_responsavel_usuario_id_fkey(name, email)')
        .order('starts_at', { ascending: true }),
      supabase
        .from('clientes_consultoria')
        .select('id, name, slug, status, current_visit_step')
        .order('name', { ascending: true }),
      supabase
        .from('usuarios')
        .select('id, name, email')
        .in('role', ['administrador_geral', 'administrador_mx', 'consultor_mx'])
        .eq('active', true)
        .order('name', { ascending: true }),
      supabase
        .from('produtos_digitais')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (visitsRes.error) {
      setError(visitsRes.error.message)
      setVisits([])
    } else {
      const mapped = (visitsRes.data || []).map((v: any) => ({
        ...v,
        client_name: v.client?.name || 'Desconhecido',
        client_slug: v.client?.slug || v.client_id || 'cliente',
        client_status: v.client?.status || 'ativo',
        client_modality: v.client?.modality || null,
      }))
      setVisits(mapped as AgendaVisit[])
    }

    if (eventsRes.error) {
      setError((current) => current || eventsRes.error.message)
      setScheduleEvents([])
    } else {
      setScheduleEvents((eventsRes.data || []) as AgendaScheduleEvent[])
    }

    setClients((clientsRes.data || []) as AgendaClient[])
    setConsultants((usersRes.data || []) as AgendaConsultant[])

    if (productsRes.error) {
      setProducts([])
    } else {
      setProducts(((productsRes.data || []) as AgendaProduct[])
        .filter((product) => !product.status || product.status === 'ativo')
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
    }
    setLoading(false)
  }, [supabaseUser, role])

  useEffect(() => {
    fetchVisits()
  }, [fetchVisits])

  const syncSearchParams = useCallback((updates: Partial<Record<UrlFilterKey, string>>) => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'todos') params.delete(key)
      else params.set(key, value)
    }
    const search = params.toString()
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', nextUrl)
  }, [])

  const setDateFilter = useCallback((value: DateFilter) => {
    if (value !== 'todos') {
      const base = value === 'proxima_semana' ? addWeeks(new Date(), 1) : new Date()
      setCalendarMonth({ year: base.getFullYear(), month: base.getMonth() })
    }
    setDateFilterState(value)
    syncSearchParams({ range: value })
  }, [syncSearchParams])

  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterState(value)
    syncSearchParams({ status: value })
  }, [syncSearchParams])

  const setConsultantFilter = useCallback((value: string) => {
    setConsultantFilterState(value)
    syncSearchParams({ consultant: value })
  }, [syncSearchParams])

  const clearFilters = useCallback(() => {
    setDateFilterState('todos')
    setStatusFilterState('todos')
    setConsultantFilterState('todos')
    syncSearchParams({ range: 'todos', status: 'todos', consultant: 'todos' })
  }, [syncSearchParams])

  const createVisit = useCallback(async (input: CreateVisitInput) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem agendar visitas.' }
    }

    const { data: insertedVisit, error: insertError } = await supabase
      .from('visitas_consultoria')
      .insert({
        client_id: input.client_id,
        visit_number: input.visit_number,
        scheduled_at: input.scheduled_at,
        duration_hours: input.duration_hours,
        modality: input.modality,
        consultant_id: input.consultant_id || null,
        auxiliary_consultant_id: input.auxiliary_consultant_id || null,
        objective: input.objective || null,
        visit_reason: input.visit_reason || null,
        target_audience: input.target_audience || null,
        product_name: input.product_name || null,
        status: 'agendada',
      })
      .select('id')
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    if (insertedVisit?.id) {
      const syncResult = await syncVisitToGoogle(insertedVisit.id, 'upsert')
      const syncError = getCentralSyncError(syncResult)
      if (syncError) {
        await fetchVisits()
        return { error: syncError }
      }
    }
    await fetchVisits()
    return { error: null }
  }, [supabaseUser, role, fetchVisits])

  const updateVisitStatus = useCallback(async (visitId: string, status: string) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem alterar status.' }
    }

    const { error: updateError } = await supabase
      .from('visitas_consultoria')
      .update({ status })
      .eq('id', visitId)

    if (updateError) {
      return { error: updateError.message }
    }

    const syncResult = await syncVisitToGoogle(visitId, 'upsert')
    const syncError = getCentralSyncError(syncResult)
    await fetchVisits()
    return { error: syncError }
  }, [supabaseUser, role, fetchVisits])

  const updateVisit = useCallback(async (input: UpdateVisitInput) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem editar visitas.' }
    }

    const { error: updateError } = await supabase
      .from('visitas_consultoria')
      .update({
        client_id: input.client_id,
        visit_number: input.visit_number,
        scheduled_at: input.scheduled_at,
        duration_hours: input.duration_hours,
        modality: input.modality,
        consultant_id: input.consultant_id || null,
        auxiliary_consultant_id: input.auxiliary_consultant_id || null,
        objective: input.objective || null,
        visit_reason: input.visit_reason || null,
        target_audience: input.target_audience || null,
        product_name: input.product_name || null,
        status: input.status,
      })
      .eq('id', input.id)

    if (updateError) return { error: updateError.message }

    const syncResult = await syncVisitToGoogle(input.id, 'upsert')
    const syncError = getCentralSyncError(syncResult)
    await fetchVisits()
    return { error: syncError }
  }, [supabaseUser, role, fetchVisits])

  const deleteVisit = useCallback(async (visitId: string) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem cancelar visitas.' }
    }

    const syncResult = await syncVisitToGoogle(visitId, 'delete')
    const syncError = getCentralSyncError(syncResult)
    if (syncError) return { error: syncError }

    const { error: deleteError } = await supabase
      .from('visitas_consultoria')
      .delete()
      .eq('id', visitId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    await fetchVisits()
    return { error: null }
  }, [supabaseUser, role, fetchVisits])

  const createScheduleEvent = useCallback(async (input: ScheduleEventInput) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem criar eventos e aulas.' }
    }

    const { data: insertedEvent, error: insertError } = await supabase
      .from('eventos_agenda_consultoria')
      .insert({
        ...input,
        status: input.status || 'agendado',
        created_by: supabaseUser.id,
      })
      .select('id')
      .single()

    if (insertError) return { error: insertError.message }
    if (insertedEvent?.id) {
      const syncResult = await syncScheduleEventToGoogle(insertedEvent.id, 'upsert')
      const syncError = getCentralSyncError(syncResult)
      if (syncError) {
        await fetchVisits()
        return { error: syncError }
      }
    }
    await fetchVisits()
    return { error: null }
  }, [fetchVisits, role, supabaseUser])

  const updateScheduleEvent = useCallback(async (eventId: string, input: ScheduleEventInput) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem editar eventos e aulas.' }
    }

    const { error: updateError } = await supabase
      .from('eventos_agenda_consultoria')
      .update({
        ...input,
        status: input.status || 'agendado',
      })
      .eq('id', eventId)

    if (updateError) return { error: updateError.message }
    const syncResult = await syncScheduleEventToGoogle(eventId, 'upsert')
    const syncError = getCentralSyncError(syncResult)
    await fetchVisits()
    return { error: syncError }
  }, [fetchVisits, role, supabaseUser])

  const deleteScheduleEvent = useCallback(async (eventId: string) => {
    if (!supabaseUser || !isPerfilInternoMx(role)) {
      return { error: 'Apenas perfis MX podem excluir eventos e aulas.' }
    }

    const syncResult = await syncScheduleEventToGoogle(eventId, 'delete')
    const syncError = getCentralSyncError(syncResult)
    if (syncError) return { error: syncError }

    const { error: deleteError } = await supabase
      .from('eventos_agenda_consultoria')
      .delete()
      .eq('id', eventId)

    if (deleteError) return { error: deleteError.message }
    await fetchVisits()
    return { error: null }
  }, [fetchVisits, role, supabaseUser])

  const filteredVisits = useMemo(() => {
    let filtered = visits

    if (consultantFilter !== 'todos') {
      filtered = filtered.filter((v) => (
        v.consultant_id === consultantFilter ||
        v.auxiliary_consultant_id === consultantFilter
      ))
    }

    const dateInterval = getDateFilterInterval(dateFilter, calendarMonth)
    if (dateInterval) {
      filtered = filtered.filter((v) => {
        const d = new Date(v.scheduled_at)
        return isWithinInterval(d, dateInterval)
      })
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter((v) => v.status === statusFilter)
    }

    return filtered
  }, [visits, consultantFilter, dateFilter, statusFilter, calendarMonth])

  const filteredScheduleEvents = useMemo(() => {
    let filtered = scheduleEvents

    if (consultantFilter !== 'todos') {
      filtered = filtered.filter((event) => event.responsible_user_id === consultantFilter)
    }

    const dateInterval = getDateFilterInterval(dateFilter, calendarMonth)
    if (dateInterval) {
      filtered = filtered.filter((event) => {
        const d = new Date(event.starts_at)
        return isWithinInterval(d, dateInterval)
      })
    }

    if (statusFilter !== 'todos') {
      if (statusFilter === 'em_andamento') return []
      const eventStatus = statusFilter === 'cancelada'
        ? 'cancelado'
        : statusFilter === 'concluida'
          ? 'concluido'
          : 'agendado'
      filtered = filtered.filter((event) => event.status === eventStatus)
    }

    return filtered
  }, [scheduleEvents, consultantFilter, dateFilter, statusFilter, calendarMonth])

  const calendarDays = useMemo(() => {
    if (dateFilter === 'hoje') {
      const today = new Date()
      return [{
        date: today,
        day: today.getDate(),
        isCurrentMonth: true,
      }]
    }

    if (dateFilter === 'semana' || dateFilter === 'proxima_semana') {
      const base = dateFilter === 'proxima_semana' ? addWeeks(new Date(), 1) : new Date()
      const weekStart = startOfWeek(base, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, index) => {
        const date = addDays(weekStart, index)
        return {
          date,
          day: date.getDate(),
          isCurrentMonth: true,
        }
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
      days.push({
        date: new Date(year, month - 1, prevMonthLast - i),
        day: prevMonthLast - i,
        isCurrentMonth: false,
      })
    }

    for (let d = 1; d <= totalDays; d++) {
      days.push({
        date: new Date(year, month, d),
        day: d,
        isCurrentMonth: true,
      })
    }

    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        day: d,
        isCurrentMonth: false,
      })
    }

    return days
  }, [calendarMonth, dateFilter])

  const visitsByDate = useMemo(() => {
    const map: Record<string, Array<{ status: string }>> = {}
    for (const v of filteredVisits) {
      const key = format(new Date(v.scheduled_at), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(v)
    }
    for (const event of filteredScheduleEvents) {
      const key = format(new Date(event.starts_at), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push({ status: event.status === 'cancelado' ? 'cancelada' : event.status === 'concluido' ? 'concluida' : 'agendada' })
    }
    return map
  }, [filteredVisits, filteredScheduleEvents])

  const metrics = useMemo(() => {
    const total = filteredVisits.length + filteredScheduleEvents.length
    const agendadas = filteredVisits.filter((v) => v.status === 'agendada').length + filteredScheduleEvents.filter((event) => event.status === 'agendado').length
    const emAndamento = filteredVisits.filter((v) => v.status === 'em_andamento').length
    const concluidas = filteredVisits.filter((v) => v.status === 'concluida').length + filteredScheduleEvents.filter((event) => event.status === 'concluido').length
    const canceladas = filteredVisits.filter((v) => v.status === 'cancelada').length + filteredScheduleEvents.filter((event) => event.status === 'cancelado').length
    return { total, agendadas, emAndamento, concluidas, canceladas }
  }, [filteredVisits, filteredScheduleEvents])

  const activeFilters = useMemo(() => {
    return [
      consultantFilter !== 'todos',
      dateFilter !== 'todos',
      statusFilter !== 'todos',
    ].filter(Boolean).length
  }, [consultantFilter, dateFilter, statusFilter])

  const getNextVisitNumber = useCallback((clientId: string) => {
    const clientVisits = visits.filter((v) => v.client_id === clientId)
    const maxNum = clientVisits.reduce((max, v) => Math.max(max, v.visit_number), 0)
    return Math.min(maxNum + 1, 7)
  }, [visits])

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
    visits: filteredVisits,
    allVisits: visits,
    scheduleEvents: filteredScheduleEvents,
    allScheduleEvents: scheduleEvents,
    clients,
    consultants,
    products,
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
    refetch: fetchVisits,
    calendarMonth,
    calendarDays,
    visitsByDate,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    createVisit,
    updateVisit,
    updateVisitStatus,
    deleteVisit,
    createScheduleEvent,
    updateScheduleEvent,
    deleteScheduleEvent,
    getNextVisitNumber,
  }
}
