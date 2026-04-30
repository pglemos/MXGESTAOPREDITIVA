import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ConsultingVisit } from '@/features/consultoria/types'

async function syncVisitToGoogle(
  visitId: string,
  action: 'upsert' | 'delete' = 'upsert',
): Promise<void> {
  try {
    const { data: visit } = await supabase
      .from('consulting_visits')
      .select(`
        id,
        client_id,
        scheduled_at,
        duration_hours,
        modality,
        status,
        objective,
        google_event_id,
        google_event_id_central,
        consultant:users!consulting_visits_consultant_id_fkey(email),
        client:consulting_clients!client_id(name)
      `)
      .eq('id', visitId)
      .maybeSingle() as { data: any }
    if (!visit) return
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
      consultant_email: visit.consultant?.email ?? null,
      google_event_id: visit.google_event_id ?? null,
      google_event_id_central: visit.google_event_id_central ?? null,
    }
    await supabase.functions.invoke('google-calendar-sync', { body: { action, visit: payload } })
  } catch {
    // Sync silencioso: não bloqueia operação principal
  }
}

export type AgendaVisit = ConsultingVisit & {
  client_name: string
  client_slug: string
  client_status: string
  client_modality: string | null
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

const DATE_FILTERS = ['hoje', 'semana', 'mes', 'proxima_semana', 'todos'] as const
type DateFilter = typeof DATE_FILTERS[number]
type UrlFilterKey = 'range' | 'status' | 'consultant'

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
}

export function useAgendaAdmin() {
  const { supabaseUser, role } = useAuth()
  const [visits, setVisits] = useState<AgendaVisit[]>([])
  const [clients, setClients] = useState<AgendaClient[]>([])
  const [consultants, setConsultants] = useState<AgendaConsultant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilterState] = useState<DateFilter>(() => getInitialSearchParam('range', 'semana', DATE_FILTERS) as DateFilter)
  const [statusFilter, setStatusFilterState] = useState<string>(() => getInitialSearchParam('status', 'todos'))
  const [consultantFilter, setConsultantFilterState] = useState<string>(() => getInitialSearchParam('consultant', 'todos'))
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Na função renderizadora da AgendaAdmin.tsx, precisa buscar o slug.
  // Como aqui no hook só temos o ID, vamos precisar buscar o slug correspondente.
  const fetchVisits = useCallback(async () => {
    if (!supabaseUser || role !== 'admin') {
      setVisits([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [visitsRes, clientsRes, usersRes] = await Promise.all([
      supabase
        .from('consulting_visits')
        .select(`
          *,
          consultant:users!consulting_visits_consultant_id_fkey(name, email),
          auxiliary_consultant:users!consulting_visits_auxiliary_consultant_id_fkey(name, email),
          client:consulting_clients!client_id(name, slug, status, modality)
        `)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('consulting_clients')
        .select('id, name, slug, status, current_visit_step')
        .order('name', { ascending: true }),
      supabase
        .from('users')
        .select('id, name, email')
        .in('role', ['admin'])
        .eq('active', true)
        .order('name', { ascending: true }),
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

    setClients((clientsRes.data || []) as AgendaClient[])
    setConsultants((usersRes.data || []) as AgendaConsultant[])
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
    if (!supabaseUser || role !== 'admin') {
      return { error: 'Apenas admin pode agendar visitas.' }
    }

    const { data: insertedVisit, error: insertError } = await supabase
      .from('consulting_visits')
      .insert({
        client_id: input.client_id,
        visit_number: input.visit_number,
        scheduled_at: input.scheduled_at,
        duration_hours: input.duration_hours,
        modality: input.modality,
        consultant_id: input.consultant_id || null,
        auxiliary_consultant_id: input.auxiliary_consultant_id || null,
        objective: input.objective || null,
        status: 'agendada',
      })
      .select('id')
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    if (insertedVisit?.id) {
      await syncVisitToGoogle(insertedVisit.id, 'upsert')
    }
    await fetchVisits()
    return { error: null }
  }, [supabaseUser, role, fetchVisits])

  const updateVisitStatus = useCallback(async (visitId: string, status: string) => {
    if (!supabaseUser || role !== 'admin') {
      return { error: 'Apenas admin pode alterar status.' }
    }

    const { error: updateError } = await supabase
      .from('consulting_visits')
      .update({ status })
      .eq('id', visitId)

    if (updateError) {
      return { error: updateError.message }
    }

    await syncVisitToGoogle(visitId, 'upsert')
    await fetchVisits()
    return { error: null }
  }, [supabaseUser, role, fetchVisits])

  const deleteVisit = useCallback(async (visitId: string) => {
    if (!supabaseUser || role !== 'admin') {
      return { error: 'Apenas admin pode cancelar visitas.' }
    }

    await syncVisitToGoogle(visitId, 'delete')

    const { error: deleteError } = await supabase
      .from('consulting_visits')
      .delete()
      .eq('id', visitId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    await fetchVisits()
    return { error: null }
  }, [supabaseUser, role, fetchVisits])

  const filteredVisits = useMemo(() => {
    const now = new Date()
    const todayInterval = { start: startOfDay(now), end: endOfDay(now) }
    const weekInterval = {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    }
    const nextWeekBase = addWeeks(now, 1)
    const nextWeekInterval = {
      start: startOfWeek(nextWeekBase, { weekStartsOn: 1 }),
      end: endOfWeek(nextWeekBase, { weekStartsOn: 1 }),
    }
    const monthInterval = { start: startOfMonth(now), end: endOfMonth(now) }

    let filtered = visits

    if (consultantFilter !== 'todos') {
      filtered = filtered.filter((v) => (
        v.consultant_id === consultantFilter ||
        v.auxiliary_consultant_id === consultantFilter
      ))
    }

    if (dateFilter !== 'todos') {
      filtered = filtered.filter((v) => {
        const d = new Date(v.scheduled_at)
        switch (dateFilter) {
          case 'hoje':
            return isWithinInterval(d, todayInterval)
          case 'semana':
            return isWithinInterval(d, weekInterval)
          case 'proxima_semana':
            return isWithinInterval(d, nextWeekInterval)
          case 'mes':
            return isWithinInterval(d, monthInterval)
          default:
            return true
        }
      })
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter((v) => v.status === statusFilter)
    }

    return filtered
  }, [visits, consultantFilter, dateFilter, statusFilter])

  const calendarDays = useMemo(() => {
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
  }, [calendarMonth])

  const visitsByDate = useMemo(() => {
    const map: Record<string, AgendaVisit[]> = {}
    for (const v of filteredVisits) {
      const key = new Date(v.scheduled_at).toISOString().slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(v)
    }
    return map
  }, [filteredVisits])

  const metrics = useMemo(() => {
    const total = filteredVisits.length
    const agendadas = filteredVisits.filter((v) => v.status === 'agendada').length
    const emAndamento = filteredVisits.filter((v) => v.status === 'em_andamento').length
    const concluidas = filteredVisits.filter((v) => v.status === 'concluída').length
    const canceladas = filteredVisits.filter((v) => v.status === 'cancelada').length
    return { total, agendadas, emAndamento, concluidas, canceladas }
  }, [filteredVisits])

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
    refetch: fetchVisits,
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
  }
}
