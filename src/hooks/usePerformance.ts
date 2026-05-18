import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin } from '@/types/database'
import { startOfWeek } from 'date-fns'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { parseTeamProgressEntryArray, type TeamProgressEntry } from '@/lib/schemas/performance.schema'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'

const TODAY_ISO = () => new Date().toISOString().slice(0, 10)

export function usePerformance() {
  const { role, storeId, vinculos_loja } = useAuth()
  const ownerStoreIds = role === 'dono' ? vinculos_loja.map(m => m.store_id) : []
  const scopedStoreIds = role === 'dono' ? ownerStoreIds : storeId ? [storeId] : []

  const { data: teamProgress, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['team-treinamentos', role === 'dono' ? ownerStoreIds.join(',') : storeId],
    queryFn: async () => {
      if (!scopedStoreIds.length) return []

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
      const checkinsPromise = isLancamentosViaRpcEnabled() && scopedStoreIds.length === 1
        ? supabase.rpc('get_lancamentos_por_loja_periodo', {
            p_store_id: scopedStoreIds[0],
            p_start_date: weekStart,
            p_end_date: TODAY_ISO(),
            p_scope: 'daily',
        })
        : supabase.from('lancamentos_diarios')
            .select('seller_user_id, store_id, reference_date, metric_scope, leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day')
            .in('store_id', scopedStoreIds)
            .gte('reference_date', weekStart)
      const [{ data: members }, { data: treinamentos }, { data: checkins }] = await Promise.all([
        supabase.from('vinculos_loja').select('user_id, store_id, users:usuarios(name, avatar_url)').in('store_id', scopedStoreIds).eq('role', 'vendedor'),
        supabase.from('treinamentos').select('id, type, store_id, target_audience').eq('active', true).in('target_audience', ['todos', 'vendedor']),
        checkinsPromise,
      ])

      const totalTrainings = treinamentos?.length || 0
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id)
        const { data: progress } = await supabase.from('progresso_treinamentos').select('user_id, training_id').in('user_id', userIds)
        const stats = (members as { user_id: string; store_id: string; users?: { name?: string; avatar_url?: string | null } }[]).map(m => {
          const p = (progress || []).filter(pr => pr.user_id === m.user_id)
          const watchedIds = p.map(pr => pr.training_id)
          const percentage = totalTrainings > 0 ? (p.length / totalTrainings) * 100 : 0
          const sellerCheckins = ((checkins || []) as DailyCheckin[]).filter((c) => c.seller_user_id === m.user_id && c.store_id === m.store_id)
          const funil = calcularFunil(sellerCheckins)
          const diag = gerarDiagnosticoMX(funil)
          const categoryMap: Record<string, string> = { 'LEAD_AGD': 'prospeccao', 'AGD_VISITA': 'atendimento', 'VISITA_VND': 'fechamento' }
          const gapCategory = diag.gargalo ? categoryMap[diag.gargalo] : null
          const gapTrainings = (treinamentos || []).filter(t => t.type === gapCategory)
          const gapCompleted = gapTrainings.length > 0 ? gapTrainings.every(t => watchedIds.includes(t.id)) : true
          return { seller_id: m.user_id, seller_name: m.users?.name || 'Vendedor', avatar_url: m.users?.avatar_url || null, watched: watchedIds, total_trainings: totalTrainings, percentage, current_gap: diag.gargalo, gap_training_completed: gapCompleted }
        }).sort((a, b) => b.percentage - a.percentage)
        return parseTeamProgressEntryArray(stats)
      }
      return [] as TeamProgressEntry[]
    },
    enabled: scopedStoreIds.length > 0,
  })

  return {
    teamProgress: teamProgress || [],
    loading,
    error: queryError?.message || null,
    refetch,
  }
}
