import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ClientSheetClient {
  id: string
  nome: string
  telefone: string | null
  canal_origem: string | null
  status: string
  relacionamento: string
  ultima_interacao: string | null
  proxima_acao: string | null
  proxima_acao_em: string | null
  potencial_negocio: number
  observacoes: string | null
}

export interface ClientSheetOpportunity {
  id: string
  veiculo_interesse: string | null
  valor_negociado: number
  etapa: string
  financiamento: string
  carro_avaliado: boolean
  sinal: number
  motivo_perda: string | null
  created_at: string
  closed_at: string | null
}

export interface ClientTimelineItem {
  id: string
  kind: 'evento' | 'agendamento' | 'execucao'
  title: string
  description: string | null
  date: string
  status: string | null
}

export interface ClientSheetData {
  client: ClientSheetClient | null
  opportunity: ClientSheetOpportunity | null
  timeline: ClientTimelineItem[]
}

export function useClientSheetData(clientId: string | null, open: boolean) {
  const [data, setData] = useState<ClientSheetData>({ client: null, opportunity: null, timeline: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!clientId || !open) return
    setLoading(true)
    setError(null)

    const [clientResult, opportunitiesResult, appointmentsResult, eventsResult, actionsResult] = await Promise.all([
      supabase.from('clientes').select('id,nome,telefone,canal_origem,status,relacionamento,ultima_interacao,proxima_acao,proxima_acao_em,potencial_negocio,observacoes').eq('id', clientId).maybeSingle(),
      supabase.from('oportunidades').select('id,veiculo_interesse,valor_negociado,etapa,financiamento,carro_avaliado,sinal,motivo_perda,created_at,closed_at').eq('cliente_id', clientId).order('created_at', { ascending: false }).limit(10),
      supabase.from('agendamentos').select('id,tipo,status,data_hora,observacoes').eq('cliente_id', clientId).order('data_hora', { ascending: false }).limit(30),
      supabase.from('eventos_comerciais').select('id,tipo_evento,data_evento,observacao').eq('cliente_id', clientId).order('data_evento', { ascending: false }).limit(30),
      supabase.from('execution_actions').select('id,title,result_code,result_note,status,due_at,completed_at,created_at,activity_type').filter('cliente_id' as never, 'eq', clientId).order('created_at', { ascending: false }).limit(30),
    ])

    const firstError = clientResult.error
      || opportunitiesResult.error
      || appointmentsResult.error
      || eventsResult.error
      || actionsResult.error

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    const client = clientResult.data as ClientSheetClient | null
    const opportunities = (opportunitiesResult.data ?? []) as ClientSheetOpportunity[]
    const appointments = (appointmentsResult.data ?? []) as Array<{
      id: string
      tipo: string
      status: string
      data_hora: string
      observacoes: string | null
    }>
    const events = (eventsResult.data ?? []) as Array<{
      id: string
      tipo_evento: string
      data_evento: string
      observacao: string | null
    }>
    const actions = (actionsResult.data ?? []) as unknown as Array<{
      id: string
      title: string
      result_code: string | null
      result_note: string | null
      status: string
      due_at: string
      completed_at: string | null
      created_at: string
      activity_type: string | null
    }>

    const timeline: ClientTimelineItem[] = [
      ...events.map(event => ({
        id: `event-${event.id}`,
        kind: 'evento' as const,
        title: event.tipo_evento.replaceAll('_', ' '),
        description: event.observacao,
        date: event.data_evento,
        status: null,
      })),
      ...appointments.map(appointment => ({
        id: `appointment-${appointment.id}`,
        kind: 'agendamento' as const,
        title: appointment.tipo.replaceAll('_', ' '),
        description: appointment.observacoes,
        date: appointment.data_hora,
        status: appointment.status,
      })),
      ...actions.filter(action => action.result_code || action.completed_at).map(action => ({
        id: `action-${action.id}`,
        kind: 'execucao' as const,
        title: action.title,
        description: action.result_note,
        date: action.completed_at || action.due_at || action.created_at,
        status: action.result_code || action.status,
      })),
    ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()).slice(0, 30)

    setData({
      client,
      opportunity: opportunities[0] ?? null,
      timeline,
    })
    setLoading(false)
  }, [clientId, open])

  useEffect(() => { void refetch() }, [refetch])

  return { ...data, loading, error, refetch }
}
