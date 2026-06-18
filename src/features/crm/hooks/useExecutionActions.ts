import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export type ExecutionActionStatus = 'pendente' | 'em_andamento' | 'concluida' | 'justificada' | 'cancelada'
export type ExecutionActionSource = 'pdi' | 'feedback' | 'funil' | 'manual'
export type ExecutionActionPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ExecutionActionTone = 'info' | 'warning' | 'error'

export type ExecutionActionRow = {
  id: string
  store_id: string | null
  seller_id: string
  source_type: ExecutionActionSource
  source_id: string | null
  title: string
  description: string | null
  due_at: string
  status: ExecutionActionStatus
  priority: ExecutionActionPriority
  alert_tone: ExecutionActionTone
  created_by: string | null
  completed_at: string | null
  completed_by: string | null
  justificativa: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

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
      .select('*')
      .eq('seller_id', profile.id)
      .in('status', ['pendente', 'em_andamento'])
      .order('due_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setAcoes([])
    } else {
      setAcoes((data ?? []) as ExecutionActionRow[])
    }
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { void refetch() }, [refetch])

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
