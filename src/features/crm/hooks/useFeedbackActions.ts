import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Database } from '@/types/database.generated'
import type { FeedbackActionRow, FeedbackActionStatus, FeedbackActionRecorrencia } from '@/features/gerente-feedback/lib/feedback-actions'

type FeedbackActionDbRow = Database['public']['Tables']['devolutiva_acoes']['Row']

export function useFeedbackActions() {
  const { profile } = useAuth()
  const [acoes, setAcoes] = useState<FeedbackActionRow[]>([])
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
      .from('devolutiva_acoes')
      .select('*')
      .eq('seller_id', profile.id)
      .eq('status', 'pendente')
      .order('horario_sugerido', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setAcoes([])
    } else {
      setAcoes((data ?? []).map(normalizeFeedbackAction))
    }
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { void refetch() }, [refetch])

  const concluirAcaoFeedback = useCallback(async (id: string): Promise<{ error: string | null }> => {
    if (!profile?.id) return { error: 'Sessão inválida.' }
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('devolutiva_acoes')
      .update({
        status: 'concluida',
        concluida_at: now,
        concluida_por: profile.id,
        updated_at: now,
      })
      .eq('id', id)
      .eq('seller_id', profile.id)
      .eq('status', 'pendente')

    if (updateError) return { error: updateError.message }
    await refetch()
    return { error: null }
  }, [profile?.id, refetch])

  const justificarAcoesFeedback = useCallback(async (
    ids: string[],
    justificativa: string,
  ): Promise<{ error: string | null }> => {
    if (ids.length === 0) return { error: null }
    if (!profile?.id) return { error: 'Sessão inválida.' }
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('devolutiva_acoes')
      .update({
        status: 'justificada',
        justificativa: justificativa.trim(),
        concluida_at: now,
        concluida_por: profile.id,
        updated_at: now,
      })
      .in('id', ids)
      .eq('seller_id', profile.id)
      .eq('status', 'pendente')

    if (updateError) return { error: updateError.message }
    await refetch()
    return { error: null }
  }, [profile?.id, refetch])

  return { acoes, loading, error, refetch, concluirAcaoFeedback, justificarAcoesFeedback }
}

function normalizeFeedbackAction(row: FeedbackActionDbRow): FeedbackActionRow {
  return {
    ...row,
    status: normalizeStatus(row.status),
    recorrencia: normalizeRecorrencia(row.recorrencia),
  }
}

function normalizeStatus(status: string): FeedbackActionStatus {
  if (status === 'concluida' || status === 'justificada' || status === 'cancelada') return status
  return 'pendente'
}

function normalizeRecorrencia(recorrencia: string): FeedbackActionRecorrencia {
  return recorrencia === 'unica' ? 'unica' : 'diaria'
}
