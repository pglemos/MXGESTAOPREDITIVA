import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import type { WeeklyFeedbackReport } from '@/types/database'

const WEEKLY_FEEDBACK_REPORT_SELECT = 'id, store_id, week_start, week_end, weekly_goal, team_avg_json, email_status, recipients, created_at, updated_at'

export function useFeedbackReports(filters?: { storeId?: string }) {
  const { profile, storeId: authStoreId, role, vinculos_loja } = useAuth()
  const requestedStoreId = filters?.storeId
  const storeId = role === 'dono' ? requestedStoreId : requestedStoreId || authStoreId
  const ownerStoreIds = role === 'dono' ? vinculos_loja.map(m => m.store_id) : []

  const { data: reports, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['feedback-reports', requestedStoreId || (role === 'dono' ? ownerStoreIds.join(',') : storeId), role],
    queryFn: async () => {
      if (!profile) return []

      let query = supabase.from('relatorios_devolutivas_semanais').select(WEEKLY_FEEDBACK_REPORT_SELECT)
      if (role === 'dono') {
        if (requestedStoreId) query = query.eq('store_id', requestedStoreId)
        else if (ownerStoreIds.length) query = query.in('store_id', ownerStoreIds)
        else return []
      } else if (!isPerfilInternoMx(role) && storeId) query = query.eq('store_id', storeId)
      const { data, error: queryError } = await query.order('week_start', { ascending: false }).limit(isPerfilInternoMx(role) ? 50 : 12)
      if (queryError) throw queryError
      return (data || []) as WeeklyFeedbackReport[]
    },
    enabled: !!profile,
  })

  return {
    reports: reports || [],
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}
