import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Blitz 48h Dia 2 — T5.
 *
 * Lê `public.eventos_agenda_executiva` para uma loja específica e expõe
 * filtros básicos por janela temporal.
 *
 * Integrações reais Google/Outlook continuam fora do Blitz — esta camada é
 * read-first; quando `integration_status = 'sincronizado'`, o componente
 * mostra apenas o status sem permitir edição.
 */

export type CentralMxAgendaSource = 'manual' | 'google' | 'outlook'

export type CentralMxAgendaIntegrationStatus =
  | 'desconectado'
  | 'pendente'
  | 'sincronizado'
  | 'erro'

export type CentralMxAgendaKind =
  | 'reuniao_loja'
  | 'reuniao_estrategica'
  | 'acao_dono'
  | 'follow_up'
  | 'evento_externo'

export type CentralMxAgendaEvent = {
  id: string
  loja_id: string
  kind: CentralMxAgendaKind
  title: string
  public_summary: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  source: CentralMxAgendaSource
  integration_status: CentralMxAgendaIntegrationStatus
  integration_error: string | null
  google_event_id: string | null
  outlook_event_id: string | null
  created_at?: string | null
}

export type UseCentralMxAgendaResult = {
  events: CentralMxAgendaEvent[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  upcomingCount: number
  todayCount: number
}

type FetchOptions = {
  windowDays?: number
  includePast?: boolean
}

export function useCentralMxAgenda(
  storeId: string | null | undefined,
  options: FetchOptions = {},
): UseCentralMxAgendaResult {
  const [events, setEvents] = useState<CentralMxAgendaEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!storeId) {
      setEvents([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const windowDays = options.windowDays ?? 30
      const now = new Date()
      const lower = options.includePast
        ? new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000)
        : now
      const upper = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000)
      const { data, error: queryError } = await supabase
        .from('eventos_agenda_executiva')
        .select(
          'id, loja_id, kind, title, public_summary, starts_at, ends_at, all_day, source, integration_status, integration_error, google_event_id, outlook_event_id, created_at',
        )
        .eq('loja_id', storeId)
        .gte('starts_at', lower.toISOString())
        .lte('starts_at', upper.toISOString())
        .order('starts_at', { ascending: true })
      if (queryError) throw queryError
      setEvents((data ?? []) as CentralMxAgendaEvent[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar agenda executiva'
      setError(message)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [storeId, options.windowDays, options.includePast])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return events.filter((event) => event.starts_at.slice(0, 10) === today).length
  }, [events])

  const upcomingCount = useMemo(() => {
    const nowIso = new Date().toISOString()
    return events.filter((event) => event.starts_at >= nowIso).length
  }, [events])

  return { events, loading, error, refresh: fetchEvents, upcomingCount, todayCount }
}
