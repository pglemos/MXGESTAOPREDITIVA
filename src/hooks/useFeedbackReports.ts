import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { WeeklyFeedbackReport } from '@/types/database'

export function useFeedbackReports(filters?: { storeId?: string }) {
  const { profile, storeId: authStoreId, role } = useAuth()
  const storeId = filters?.storeId || authStoreId

  const { data: reports, isLoading: loading, refetch } = useQuery({
    queryKey: ['feedback-reports', storeId, role],
    queryFn: async () => {
      if (!profile || (!storeId && role !== 'admin')) return []

      let query = supabase.from('weekly_feedback_reports').select('*')
      if (storeId) query = query.eq('store_id', storeId)
      const { data } = await query.order('week_start', { ascending: false }).limit(12)
      return (data || []) as WeeklyFeedbackReport[]
    },
    enabled: !!profile,
  })

  return {
    reports: reports || [],
    loading,
    refetch,
  }
}
