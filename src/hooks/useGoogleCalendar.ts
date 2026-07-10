import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

export type GoogleCalendarEvent = {
  id: string
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  htmlLink?: string
  _source?: 'personal' | 'central'
}

type MergedResponse = {
  events: GoogleCalendarEvent[]
  personalConnected: boolean
  centralConnected: boolean
  centralMeetCohostsAuthorized: boolean
  personalGoogleEmail?: string | null
  centralGoogleEmail?: string | null
  personalError?: string | null
  centralError?: string | null
}

type SyncResult = {
  ok: boolean
  personalEventId: string | null
  centralEventId: string | null
  errors: { calendar: 'personal' | 'central'; message: string }[]
  userConnected: boolean
  centralConnected: boolean
}

function getGoogleCalendarErrorMessage(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : ''
  if (
    message.includes('non-2xx') ||
    message.includes('401') ||
    message.toLowerCase().includes('unauthorized') ||
    message.toLowerCase().includes('jwt')
  ) {
    return 'Não foi possível verificar a conexão com o Google Calendar. Atualize a agenda ou conecte a conta novamente.'
  }
  return message || fallback
}

export type SyncableVisit = {
  id: string
  client_id?: string | null
  client_name?: string | null
  client_address?: string | null
  scheduled_at: string
  duration_hours?: number | null
  modality?: string | null
  status?: string | null
  objective?: string | null
  consultant_email?: string | null
  google_event_id?: string | null
  google_event_id_central?: string | null
  google_meet_link?: string | null
}

export function useGoogleCalendar(opts?: { timeMin?: string; timeMax?: string; maxResults?: number; autoFetch?: boolean; includeCentral?: boolean }) {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [personalConnected, setPersonalConnected] = useState(false)
  const [centralConnected, setCentralConnected] = useState(false)
  const [centralMeetCohostsAuthorized, setCentralMeetCohostsAuthorized] = useState(false)
  const [personalGoogleEmail, setPersonalGoogleEmail] = useState<string | null>(null)
  const [centralGoogleEmail, setCentralGoogleEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMerged = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setEvents([])
        setPersonalConnected(false)
        setCentralConnected(false)
        setCentralMeetCohostsAuthorized(false)
        setPersonalGoogleEmail(null)
        setCentralGoogleEmail(null)
        return
      }
      const { data, error: invokeError } = await supabase.functions.invoke<MergedResponse>('google-calendar-merged', {
        body: {
          timeMin: opts?.timeMin,
          timeMax: opts?.timeMax,
          maxResults: opts?.maxResults ?? 100,
          includeCentral: opts?.includeCentral ?? true,
        },
      })
      if (invokeError) throw invokeError
      if (!data) throw new Error('Resposta vazia da função')
      setEvents(data.events || [])
      setPersonalConnected(data.personalConnected)
      setCentralConnected(data.centralConnected)
      setCentralMeetCohostsAuthorized(Boolean(data.centralMeetCohostsAuthorized))
      setPersonalGoogleEmail(data.personalGoogleEmail ?? null)
      setCentralGoogleEmail(data.centralGoogleEmail ?? null)
    } catch (err) {
      setError(getGoogleCalendarErrorMessage(err, 'Falha ao consultar Google Calendar'))
    } finally {
      setLoading(false)
    }
  }, [opts?.timeMin, opts?.timeMax, opts?.maxResults, opts?.includeCentral])

  useEffect(() => {
    if (opts?.autoFetch !== false) fetchMerged()
  }, [fetchMerged, opts?.autoFetch])

  const connectPersonal = useCallback(async (clientId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão autenticada obrigatória para conectar Google Calendar')
      const { data, error: invokeError } = await supabase.functions.invoke<{ authUrl: string }>('google-oauth-handler', {
        body: clientId ? { clientId } : {},
      })
      if (invokeError) throw invokeError
      if (!data?.authUrl) throw new Error('authUrl não retornada')
      window.location.href = data.authUrl
    } catch (err) {
      toast.error(getGoogleCalendarErrorMessage(err, 'Falha ao iniciar OAuth Google'))
    }
  }, [])

  const connectCentral = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão autenticada obrigatória para conectar Agenda Central MX')
      const { data, error: invokeError } = await supabase.functions.invoke<{ authUrl: string }>('google-oauth-handler', {
        body: { central: true },
      })
      if (invokeError) throw invokeError
      if (!data?.authUrl) throw new Error('authUrl não retornada')
      window.location.href = data.authUrl
    } catch (err) {
      toast.error(getGoogleCalendarErrorMessage(err, 'Falha ao conectar Agenda Central MX'))
    }
  }, [])

  const syncVisit = useCallback(async (visit: SyncableVisit, action: 'upsert' | 'delete' = 'upsert'): Promise<SyncResult | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão autenticada obrigatória para sincronizar Google Calendar')
      const { data, error: invokeError } = await supabase.functions.invoke<SyncResult>('google-calendar-sync', {
        body: { action, visit },
      })
      if (invokeError) throw invokeError
      if (!data) return null
      if (data.ok) {
        toast.success(action === 'delete' ? 'Visita removida do Google Calendar' : 'Visita sincronizada com Google Calendar')
      } else if (data.errors.length > 0) {
        toast.warning(`Sincronização parcial: ${data.errors.map(e => `${e.calendar} (${e.message})`).join('; ')}`)
      }
      return data
    } catch (err) {
      toast.error(getGoogleCalendarErrorMessage(err, 'Falha ao sincronizar visita'))
      return null
    }
  }, [])

  return {
    events,
    personalConnected,
    centralConnected,
    centralMeetCohostsAuthorized,
    personalGoogleEmail,
    centralGoogleEmail,
    loading,
    error,
    refetch: fetchMerged,
    connectPersonal,
    connectCentral,
    syncVisit,
  }
}
