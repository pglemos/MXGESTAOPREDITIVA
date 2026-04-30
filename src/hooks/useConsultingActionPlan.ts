import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  parseConsultingActionItemArray,
  type ConsultingActionItem,
} from '@/lib/schemas/consulting-client.schema'

export type ActionItemInput = {
  strategic_plan_id?: string | null
  metric_key?: string | null
  action: string
  how?: string
  owner_name?: string
  due_date?: string
  status?: ConsultingActionItem['status']
  efficacy?: string
  priority?: 1 | 2 | 3
  visit_number?: number | null
}

export function useConsultingActionPlan(clientId?: string) {
  const { profile } = useAuth()
  const [items, setItems] = useState<ConsultingActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!clientId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('itens_plano_acao')
      .select('*, metric:consulting_metric_catalog(*)')
      .eq('client_id', clientId)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setItems([])
    } else {
      setItems(parseConsultingActionItemArray(data || []))
    }
    setLoading(false)
  }, [clientId])

  const createItem = useCallback(async (input: ActionItemInput) => {
    if (!clientId) return { error: 'Cliente nao informado.' }
    const { error: insertError } = await supabase.from('itens_plano_acao').insert({
      client_id: clientId,
      strategic_plan_id: input.strategic_plan_id || null,
      metric_key: input.metric_key || null,
      action: input.action.trim(),
      how: input.how?.trim() || null,
      owner_name: input.owner_name?.trim() || null,
      due_date: input.due_date || null,
      status: input.status || 'nao_iniciado',
      efficacy: input.efficacy?.trim() || null,
      priority: input.priority || 2,
      visit_number: input.visit_number || null,
      created_by: profile?.id || null,
    })
    if (insertError) return { error: insertError.message }
    await fetchItems()
    return { error: null }
  }, [clientId, fetchItems, profile?.id])

  const updateItem = useCallback(async (id: string, patch: Partial<ActionItemInput> & { completed_at?: string | null }) => {
    const { error: updateError } = await supabase
      .from('itens_plano_acao')
      .update(patch)
      .eq('id', id)
    if (updateError) return { error: updateError.message }
    await fetchItems()
    return { error: null }
  }, [fetchItems])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return { items, loading, error, createItem, updateItem, refetch: fetchItems }
}

