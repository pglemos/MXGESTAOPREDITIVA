import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { canManageFeedback } from '@/lib/auth/capabilities'
import type { FeedbackFormData } from '@/types/database'
import { parseFeedback, type Feedback } from '@/lib/schemas/feedback.schema'

const FEEDBACK_SELECT = 'id, store_id, manager_id, seller_id, week_reference, leads_week, agd_week, visit_week, vnd_week, tx_lead_agd, tx_agd_visita, tx_visita_vnd, meta_compromisso, team_avg_json, diagnostic_json, commitment_suggested, positives, attention_points, action, notes, acknowledged, acknowledged_at, seller_comment, seller_comment_at, created_at, seller:usuarios!devolutivas_vendedor_id_fkey(name), manager:usuarios!devolutivas_gerente_id_fkey(name)'

export function useFeedbacks(filters?: { storeId?: string; sellerId?: string }) {
  const { profile, storeId: authStoreId, role, vinculos_loja } = useAuth()
  const queryClient = useQueryClient()
  const requestedStoreId = filters?.storeId
  const storeId = role === 'dono' ? requestedStoreId : requestedStoreId || authStoreId
  const ownerStoreIds = role === 'dono' ? vinculos_loja.map(m => m.store_id) : []

  const { data: devolutivas, isLoading: loading, refetch } = useQuery({
    queryKey: ['devolutivas', requestedStoreId || (role === 'dono' ? ownerStoreIds.join(',') : storeId), role, profile?.id, filters?.sellerId],
    queryFn: async () => {
      if (!profile || (!storeId && !isPerfilInternoMx(role) && role !== 'dono')) return []

      let query = supabase.from('devolutivas').select(FEEDBACK_SELECT)

      if (role === 'vendedor') {
        query = query.eq('seller_id', profile.id)
      } else if (role === 'gerente') {
        if (storeId) query = query.eq('store_id', storeId)
        if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId)
      } else if (role === 'dono') {
        if (requestedStoreId) query = query.eq('store_id', requestedStoreId)
        else if (ownerStoreIds.length) query = query.in('store_id', ownerStoreIds)
        else return []
        if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId)
      } else if (isPerfilInternoMx(role)) {
        if (filters?.storeId) query = query.eq('store_id', filters.storeId)
        if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      if (data) {
        return (data as (Record<string, unknown> & { seller?: { name?: string }; manager?: { name?: string } })[]).map((f) => {
          const { seller, manager, ...rest } = f
          try {
            const validated = parseFeedback(rest)
            return {
              ...validated,
              seller_name: seller?.name,
              manager_name: manager?.name,
            }
          } catch {
            return null
          }
        }).filter(Boolean) as (Feedback & { seller_name?: string; manager_name?: string })[]
      }
      return []
    },
    enabled: !!profile,
  })

  const createFeedbackMut = useMutation({
    mutationFn: async (data: FeedbackFormData & { store_id?: string }) => {
      const targetStoreId = data.store_id || storeId
      if (!profile || !targetStoreId) return { error: 'Não autenticado' }
      if (!canManageFeedback(role)) return { error: 'Seu papel permite acompanhar devolutivas, mas não criar ou editar.' }

      const { data: saved, error } = await supabase.from('devolutivas').upsert({
        store_id: targetStoreId,
        manager_id: profile.id,
        seller_id: data.seller_id,
        week_reference: data.week_reference,
        leads_week: data.leads_week,
        agd_week: data.agd_week,
        visit_week: data.visit_week,
        vnd_week: data.vnd_week,
        tx_lead_agd: data.tx_lead_agd,
        tx_agd_visita: data.tx_agd_visita,
        tx_visita_vnd: data.tx_visita_vnd,
        meta_compromisso: data.meta_compromisso,
        team_avg_json: data.team_avg_json || {},
        diagnostic_json: data.diagnostic_json || {},
        commitment_suggested: data.commitment_suggested ?? data.meta_compromisso,
        positives: data.positives,
        attention_points: data.attention_points,
        action: data.action,
        notes: data.notes || null,
        acknowledged: false,
        acknowledged_at: null,
      }, { onConflict: 'store_id,manager_id,seller_id,week_reference' }).select('id').maybeSingle()

      if (!error && saved?.id) {
        await supabase.rpc('gerar_recomendacoes_desenvolvimento_feedback', { p_feedback_id: saved.id })
      }

      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['devolutivas'] })
      }
    },
  })

  const acknowledgeMut = useMutation({
    mutationFn: async (input: string | { id: string; sellerComment?: string }) => {
      const id = typeof input === 'string' ? input : input.id
      const sellerComment = typeof input === 'string' ? undefined : input.sellerComment?.trim()
      const target = devolutivas?.find(item => item.id === id)
      if (role !== 'vendedor' || !target || target.seller_id !== profile?.id) {
        return { error: 'Apenas o vendedor destinatário pode confirmar ciência da devolutiva.' }
      }

      const { error } = await supabase
        .from('devolutivas')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          ...(sellerComment ? { seller_comment: sellerComment, seller_comment_at: new Date().toISOString() } : {}),
        })
        .eq('id', id)
        .eq('seller_id', profile.id)

      return { error: error?.message || null }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devolutivas'] })
    },
  })

  return {
    devolutivas: devolutivas || [],
    loading,
    createFeedback: (data: FeedbackFormData & { store_id?: string }) => createFeedbackMut.mutateAsync(data),
    acknowledge: (input: string | { id: string; sellerComment?: string }) => acknowledgeMut.mutateAsync(input),
    acknowledgeFeedback: (id: string) => acknowledgeMut.mutateAsync(id),
    refetch,
  }
}
