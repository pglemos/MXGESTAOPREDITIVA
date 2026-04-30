import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { DailyCheckin } from '@/types/database'
import { startOfWeek } from 'date-fns'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { parseTeamProgressEntryArray, type TeamProgressEntry } from '@/lib/schemas/performance.schema'

export function usePerformance() {
  const { storeId } = useAuth()

  const { data: teamProgress, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['team-treinamentos', storeId],
    queryFn: async () => {
      if (!storeId) return []

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
      const [{ data: members }, { data: treinamentos }, { data: checkins }] = await Promise.all([
        supabase.from('vinculos_loja').select('user_id, users:usuarios(name)').eq('store_id', storeId).eq('role', 'vendedor'),
        supabase.from('treinamentos').select('*').eq('active', true).in('target_audience', ['todos', 'vendedor']),
        supabase.from('lancamentos_diarios').select('*').eq('store_id', storeId).gte('reference_date', weekStart),
      ])

      const totalTrainings = treinamentos?.length || 0
      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id)
        const { data: progress } = await supabase.from('progresso_treinamentos').select('user_id, training_id').in('user_id', userIds)
        const stats = (members as { user_id: string; users?: { name?: string } }[]).map(m => {
          const p = (progress || []).filter(pr => pr.user_id === m.user_id)
          const watchedIds = p.map(pr => pr.training_id)
          const percentage = totalTrainings > 0 ? (p.length / totalTrainings) * 100 : 0
          const sellerCheckins = (checkins || []).filter(c => c.seller_user_id === m.user_id) as DailyCheckin[]
          const funil = calcularFunil(sellerCheckins)
          const diag = gerarDiagnosticoMX(funil)
          const categoryMap: Record<string, string> = { 'LEAD_AGD': 'prospeccao', 'AGD_VISITA': 'atendimento', 'VISITA_VND': 'fechamento' }
          const gapCategory = diag.gargalo ? categoryMap[diag.gargalo] : null
          const gapTrainings = (treinamentos || []).filter(t => t.type === gapCategory)
          const gapCompleted = gapTrainings.length > 0 ? gapTrainings.every(t => watchedIds.includes(t.id)) : true
          return { seller_id: m.user_id, seller_name: m.users?.name || 'Vendedor', watched: watchedIds, total_trainings: totalTrainings, percentage, current_gap: diag.gargalo, gap_training_completed: gapCompleted }
        }).sort((a, b) => b.percentage - a.percentage)
        return parseTeamProgressEntryArray(stats)
      }
      return [] as TeamProgressEntry[]
    },
    enabled: !!storeId,
  })

  return {
    teamProgress: teamProgress || [],
    loading,
    error: queryError?.message || null,
    refetch,
  }
}
