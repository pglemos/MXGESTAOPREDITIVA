import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import type { FeedbackFormData } from '@/types/database'
import { parseFeedback, type Feedback } from '@/lib/schemas/feedback.schema'

export function useFeedbacks(filters?: { storeId?: string; sellerId?: string }) {
  const { profile, storeId: authStoreId, role } = useAuth()
  const queryClient = useQueryClient()
  const storeId = filters?.storeId || authStoreId

  const { data: devolutivas, isLoading: loading, refetch } = useQuery({
    queryKey: ['devolutivas', storeId, role, profile?.id, filters?.storeId, filters?.sellerId],
    queryFn: async () => {
      if (!profile || (!storeId && !isPerfilInternoMx(role))) return []

      let query = supabase.from('devolutivas').select('*, seller:usuarios!devolutivas_vendedor_id_fkey(name), manager:usuarios!devolutivas_gerente_id_fkey(name)')

      if (role === 'vendedor') {
        query = query.eq('seller_id', profile.id)
      } else if (role === 'gerente' || role === 'dono') {
        if (storeId) query = query.eq('store_id', storeId)
        if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId)
      } else if (isPerfilInternoMx(role)) {
        if (filters?.storeId) query = query.eq('store_id', filters.storeId)
        if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId)
      }

      const { data } = await query.order('created_at', { ascending: false })
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
    mutationFn: async (data: FeedbackFormData) => {
      if (!profile || !storeId) return { error: 'Não autenticado' }
      if (!isPerfilInternoMx(role) && role !== 'gerente') return { error: 'Seu papel permite acompanhar devolutivas, mas não criar ou editar.' }

      const { error } = await supabase.from('devolutivas').upsert({
        store_id: storeId,
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
      }, { onConflict: 'seller_id, week_reference' })

      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['devolutivas'] })
      }
    },
  })

  const acknowledgeMut = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('devolutivas').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devolutivas'] })
    },
  })

  return {
    devolutivas: devolutivas || [],
    loading,
    createFeedback: (data: FeedbackFormData) => createFeedbackMut.mutateAsync(data),
    acknowledge: (id: string) => acknowledgeMut.mutateAsync(id),
    acknowledgeFeedback: (id: string) => acknowledgeMut.mutateAsync(id),
    refetch,
  }
}
