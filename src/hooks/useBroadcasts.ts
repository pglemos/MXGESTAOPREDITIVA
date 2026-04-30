import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { type Notification as AppNotification } from '@/lib/schemas/notification.schema'

export function useBroadcasts() {
  const { profile, role } = useAuth()

  const { data: broadcasts, isLoading: loading, refetch } = useQuery({
    queryKey: ['broadcasts', profile?.id, role],
    queryFn: async () => {
      if (!profile || !isPerfilInternoMx(role)) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .not('broadcast_id', 'is', null)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const unique = new Map()
        data.forEach(n => {
          if (!unique.has(n.broadcast_id)) unique.set(n.broadcast_id, n)
        })
        return Array.from(unique.values()) as AppNotification[]
      }
      return [] as AppNotification[]
    },
    enabled: !!profile && isPerfilInternoMx(role),
  })

  return {
    broadcasts: broadcasts || [],
    loading,
    refetch,
  }
}
