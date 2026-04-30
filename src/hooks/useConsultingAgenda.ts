import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export interface ConsultingAgendaEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
  htmlLink?: string
}

interface ConsultingAgendaContext {
  title: string
  description: string
  linkedToClient: boolean
}

export function useConsultingAgenda(clientId?: string) {
  const { supabaseUser, role } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [events, setEvents] = useState<ConsultingAgendaEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasClientLink, setHasClientLink] = useState(false)
  const [assignmentRole, setAssignmentRole] = useState<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connectGoogleCalendar = useCallback(async () => {
    if (!supabaseUser?.id) {
      setError('Faça login para conectar a agenda Google.')
      return
    }

    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-handler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ clientId }),
      })

      const result = await response.json()
      if (!response.ok || !result.authUrl) {
        throw new Error(result.error || 'Não foi possível iniciar a autorização Google.')
      }

      const width = 500
      const height = 600
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      const popup = window.open(
        result.authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes`,
      )

      if (!popup) {
        window.location.href = result.authUrl
        return
      }

      const pollInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollInterval)
            if (pollIntervalRef.current === pollInterval) pollIntervalRef.current = null
            setIsLoading(true)
            supabase
              .from('consulting_oauth_tokens')
              .select('id')
              .eq('user_id', supabaseUser!.id)
              .eq('provider', 'google')
              .maybeSingle()
              .then((tokenRes) => {
                if (tokenRes.data) {
                  setIsConnected(true)
                  toast.success('Google Calendar conectado com sucesso!')
                }
                setIsLoading(false)
              })
          }
        } catch {
          clearInterval(pollInterval)
          if (pollIntervalRef.current === pollInterval) pollIntervalRef.current = null
        }
      }, 500)
      pollIntervalRef.current = pollInterval

      pollTimeoutRef.current = setTimeout(() => {
        clearInterval(pollInterval)
        if (pollIntervalRef.current === pollInterval) pollIntervalRef.current = null
        if (!popup.closed) popup.close()
      }, 120000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar a autorização Google.')
    }
  }, [clientId, supabaseUser?.id])

  const fetchAgendaState = useCallback(async () => {
    if (!supabaseUser?.id) {
      setHasClientLink(false)
      setAssignmentRole(null)
      setIsConnected(false)
      setEvents([])
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const tokenQuery = supabase
      .from('consulting_oauth_tokens')
      .select('id')
      .eq('user_id', supabaseUser.id)
      .eq('provider', 'google')
      .maybeSingle()

    const assignmentQuery = clientId
      ? supabase
          .from('consulting_assignments')
          .select('assignment_role, active')
          .eq('client_id', clientId)
          .eq('user_id', supabaseUser.id)
          .maybeSingle()
      : null

    const [tokenRes, assignmentRes] = await Promise.all([
      tokenQuery,
      assignmentQuery ?? Promise.resolve({ data: null, error: null }),
    ])

    if (tokenRes.error) {
      setError(tokenRes.error.message)
      setHasClientLink(false)
      setAssignmentRole(null)
      setIsConnected(false)
      setEvents([])
      setIsLoading(false)
      return
    }

    if (assignmentRes?.error) {
      setError(assignmentRes.error.message)
      setHasClientLink(false)
      setAssignmentRole(null)
      setIsConnected(false)
      setEvents([])
      setIsLoading(false)
      return
    }

    const assignment = assignmentRes?.data
    const isAdminUser = isPerfilInternoMx(role)
    setHasClientLink(Boolean(assignment?.active) || (isAdminUser && Boolean(clientId)))
    setAssignmentRole(assignment?.assignment_role || (isAdminUser && clientId ? 'admin' : null))
    setIsConnected(Boolean(tokenRes.data))
    setIsLoading(false)
  }, [clientId, supabaseUser?.id, role])

  const fetchEvents = useCallback(async () => {
    if (!supabaseUser?.id) {
      setEvents([])
      setError('Faça login para consultar a agenda.')
      return
    }

    setIsRefreshing(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Sessão inválida. Faça login novamente.')
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          clientId,
          maxResults: 15,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao buscar eventos.')
      }

      setEvents(result.events || [])
    } catch (err) {
      setEvents([])
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a agenda.')
    } finally {
      setIsRefreshing(false)
    }
  }, [clientId, supabaseUser?.id])

  useEffect(() => {
    fetchAgendaState()
  }, [fetchAgendaState])

  useEffect(() => {
    if (isConnected) {
      fetchEvents()
      return
    }

    setEvents([])
  }, [fetchEvents, isConnected])

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    }
  }, [])

  const context = useMemo<ConsultingAgendaContext>(() => {
    if (!supabaseUser?.id) {
      return {
        title: 'Agenda indisponível',
        description: 'Faça login para ver a sua agenda Google neste cliente.',
        linkedToClient: false,
      }
    }

    if (!clientId) {
      return {
        title: isPerfilInternoMx(role) ? 'Agenda do administrador' : 'Cliente indisponível',
        description: isPerfilInternoMx(role)
          ? 'Sua agenda Google está disponível abaixo como referência operacional.'
          : 'Não foi possível localizar o cliente atual para contextualizar a agenda.',
        linkedToClient: false,
      }
    }

    if (hasClientLink) {
      const roleLabel = assignmentRole ? assignmentRole.toUpperCase() : 'VINCULADO'
      return {
        title: 'Agenda do consultor no contexto deste cliente',
        description: `Seu vínculo com este cliente está ativo como ${roleLabel}.`,
        linkedToClient: true,
      }
    }

    return {
      title: isPerfilInternoMx(role) ? 'Agenda do consultor autenticado' : 'Sem vínculo ativo neste cliente',
      description: isPerfilInternoMx(role)
        ? 'Você está autenticado. A agenda mostrada abaixo usa sua conta Google e pode ser usada como referência operacional.'
        : 'Seu login está ativo, mas este consultor não tem vínculo direto com o cliente selecionado.',
      linkedToClient: false,
    }
  }, [assignmentRole, clientId, hasClientLink, role, supabaseUser?.id])

  return {
    isConnected,
    isLoading,
    isRefreshing,
    events,
    error,
    context,
    connectGoogleCalendar,
    refreshEvents: fetchEvents,
  }
}
