import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

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

      window.location.href = result.authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao iniciar a autorização Google.')
    }
  }, [clientId, supabaseUser?.id])

  const fetchAgendaState = useCallback(async () => {
    if (!supabaseUser?.id || !clientId) {
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

    const [assignmentRes, tokenRes] = await Promise.all([
      supabase
        .from('consulting_assignments')
        .select('assignment_role, active')
        .eq('client_id', clientId)
        .eq('user_id', supabaseUser.id)
        .maybeSingle(),
      supabase
        .from('consulting_oauth_tokens')
        .select('id')
        .eq('user_id', supabaseUser.id)
        .eq('provider', 'google')
        .maybeSingle(),
    ])

    if (assignmentRes.error) {
      setError(assignmentRes.error.message)
      setHasClientLink(false)
      setAssignmentRole(null)
      setIsConnected(false)
      setEvents([])
      setIsLoading(false)
      return
    }

    if (tokenRes.error) {
      setError(tokenRes.error.message)
      setHasClientLink(false)
      setAssignmentRole(null)
      setIsConnected(false)
      setEvents([])
      setIsLoading(false)
      return
    }

    const assignment = assignmentRes.data
    setHasClientLink(Boolean(assignment?.active))
    setAssignmentRole(assignment?.assignment_role || null)
    setIsConnected(Boolean(tokenRes.data))
    setIsLoading(false)
  }, [clientId, supabaseUser?.id])

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
        title: 'Cliente indisponível',
        description: 'Não foi possível localizar o cliente atual para contextualizar a agenda.',
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
      title: role === 'admin' ? 'Agenda do consultor autenticado' : 'Sem vínculo ativo neste cliente',
      description: role === 'admin'
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
