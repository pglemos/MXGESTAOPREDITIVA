import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import type { WeeklyFeedbackReport } from '@/types/database'

const WEEKLY_FEEDBACK_REPORT_SELECT = 'id, store_id, week_start, week_end, weekly_goal, team_avg_json, email_status, recipients, summary_json, created_at, updated_at'

export function useFeedbackReports(filters?: { storeId?: string }) {
  const { profile, storeId: authStoreId, role } = useAuth()
  const storeId = filters?.storeId || authStoreId

  const { data: reports, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['feedback-reports', storeId, role],
    queryFn: async () => {
      if (!profile) return []

      let query = supabase.from('relatorios_devolutivas_semanais').select(WEEKLY_FEEDBACK_REPORT_SELECT)
      if (!isPerfilInternoMx(role) && storeId) query = query.eq('store_id', storeId)
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
