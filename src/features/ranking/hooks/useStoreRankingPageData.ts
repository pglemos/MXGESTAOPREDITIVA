import { useCallback, useMemo, useState } from 'react'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { buildStoreSalesRules } from '@/lib/storeSalesRules'

/**
 * Aggregator hook do StoreRanking — concentra:
 * - fetch (useRanking + useCheckins + useStoreMetaRules)
 * - processamento via useStoreSales
 * - estado de filtros (search) e modos (leaderboard | battle)
 * - oponentes selecionados
 * - métricas derivadas (podium, lista filtrada)
 *
 * Preserva comportamento idêntico ao StoreRankingView original
 * (Ranking.tsx, Story 2.3 — ADR-0050).
 */
export function useStoreRankingPageData() {
  const { profile, role } = useAuth()
  const { ranking, loading: rankingLoading, error: rankingError, refetch: refetchRanking } = useRanking()
  const { checkins, loading: checkinsLoading, fetchCheckins } = useCheckins()
  const { metaRules, fetchMetaRules } = useStoreMetaRules()

  const [viewMode, setViewMode] = useState<'leaderboard' | 'battle'>('leaderboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefetching, setIsRefetching] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
  const [battleOpponents, setBattleOpponents] = useState<string[]>([])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      await Promise.all([refetchRanking(), fetchCheckins(), fetchMetaRules()])
      setLastUpdatedAt(new Date())
    } finally {
      setIsRefetching(false)
    }
  }, [refetchRanking, fetchCheckins, fetchMetaRules])

  const storeSales = useStoreSales({
    checkins,
    ranking,
    rules: buildStoreSalesRules({ monthlyGoal: metaRules?.monthly_goal || 0, metaRules })
  })

  const sortedRanking = useMemo(() => {
    return (storeSales.processedRanking || []).filter(r => r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) && !r.is_venda_loja)
  }, [storeSales.processedRanking, searchTerm])

  const top3 = useMemo(() => [...sortedRanking].sort((a, b) => a.position - b.position).slice(0, 3), [sortedRanking])
  const podiumOrder = useMemo(() => [top3[1], top3[0], top3[2]].filter(Boolean), [top3])

  const toggleOpponent = useCallback((id: string) => {
    setBattleOpponents(prev => {
      if (prev.includes(id)) return prev.filter(oid => oid !== id)
      if (prev.length < 2) return [...prev, id]
      return [prev[0], id]
    })
  }, [])

  const selectedSellerEntry = selectedSeller
    ? sortedRanking.find(s => s.user_id === selectedSeller) || (storeSales.processedRanking || []).find(s => s.user_id === selectedSeller) || null
    : null

  return {
    profile,
    role,
    loading: rankingLoading || checkinsLoading,
    error: rankingError,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    isRefetching,
    lastUpdatedAt,
    handleRefresh,
    storeSales,
    sortedRanking,
    podiumOrder,
    battleOpponents,
    setBattleOpponents,
    toggleOpponent,
    selectedSeller,
    setSelectedSeller,
    selectedSellerEntry,
  }
}

export type StoreRankingPageData = ReturnType<typeof useStoreRankingPageData>
