import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { StoreDeliveryRules } from '@/types/database'

export function useStoreDeliveryRules(storeIdOverride?: string) {
  const { storeId: authStoreId } = useAuth()
  const queryClient = useQueryClient()
  const storeId = storeIdOverride || authStoreId

  const { data: deliveryRules, isLoading: loading, refetch } = useQuery({
    queryKey: ['delivery-rules', storeId],
    queryFn: async () => {
      if (!storeId) return null
      const { data } = await supabase.from('store_delivery_rules').select('*').eq('store_id', storeId).maybeSingle()
      return data as StoreDeliveryRules | null
    },
    enabled: !!storeId,
  })

  const updateDeliveryRulesMut = useMutation({
    mutationFn: async (data: Partial<StoreDeliveryRules>) => {
      if (!storeId) return { error: 'Loja não identificada' }
      const { error } = await supabase.from('store_delivery_rules').upsert({
        store_id: storeId,
        ...data,
      }, { onConflict: 'store_id' })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['delivery-rules'] })
      }
    },
  })

  return {
    deliveryRules: deliveryRules ?? null,
    loading,
    refetch,
    updateDeliveryRules: (data: Partial<StoreDeliveryRules>) => updateDeliveryRulesMut.mutateAsync(data),
  }
}
