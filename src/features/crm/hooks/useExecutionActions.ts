import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { ExecutionActionHydratedRow } from '@/features/central-execucao/lib/activity-mappers'

export type ExecutionActionStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'justificada'
  | 'reagendada'
  | 'cancelada'

export type ExecutionActionSource =
  | 'pdi'
  | 'feedback'
  | 'funil'
  | 'manual'
  | 'agendamento'
  | 'cliente'
  | 'sistema'

export type ExecutionActionPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ExecutionActionTone = 'info' | 'warning' | 'error'
export type ExecutionActionRow = ExecutionActionHydratedRow

const EXECUTION_ACTION_SELECT = `
  id,
  store_id,
  seller_id,
  source_type,
  source_id,
  cliente_id,
  oportunidade_id,
  agendamento_id,
  evento_id,
  activity_type,
  title,
  description,
  objective,
  due_at,
  status,
  priority,
  priority_rank,
  alert_tone,
  result_code,
  result_note,
  origin_module,
  active,
  automatic,
  manager_required,
  escalation_reason,
  manager_id,
  escalated_at,
  completed_at,
  client_name_snapshot,
  phone_snapshot,
  vehicle_snapshot,
  metadata,
  created_at,
  updated_at,
  cliente:clientes (
    id,
    nome,
    telefone,
    canal_origem,
    status,
    proxima_acao,
    proxima_acao_em
  ),
  oportunidade:oportunidades (
    id,
    cliente_id,
    veiculo_interesse,
    valor_negociado,
    etapa,
    financiamento,
    carro_avaliado,
    sinal,
    motivo_perda
  ),
  agendamento:agendamentos (
    id,
    cliente_id,
    oportunidade_id,
    data_hora,
    tipo,
    status,
    canal,
    observacoes
  )
`

export function useExecutionActions() {
  const { profile } = useAuth()
  const [acoes, setAcoes] = useState<ExecutionActionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!profile?.id) {
      setAcoes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('execution_actions')
      .select(EXECUTION_ACTION_SELECT)
      .eq('seller_id', profile.id)
      .in('status', ['pendente', 'em_andamento', 'reagendada'])
      .order('due_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setAcoes([])
    } else {
      const rows = (data ?? []) as unknown as ExecutionActionRow[]
      setAcoes(rows.filter(row => row.active !== false))
    }

    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const concluirExecutionAction = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!profile?.id) return { error: 'Sessão inválida.' }

    const { error: updateError } = await supabase.rpc('vendedor_concluir_execution_action', {
      p_action_id: id,
    })
    if (updateError) return { error: updateError.message }

    await refetch()
    return { error: null }
  }, [profile?.id, refetch])

  return { acoes, loading, error, refetch, concluirExecutionAction }
}
