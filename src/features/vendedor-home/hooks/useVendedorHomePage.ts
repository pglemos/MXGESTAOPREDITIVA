import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useFeedbacks, useTrainings } from '@/hooks/useData'
import { useTacticalPrescription } from '@/hooks/useTacticalPrescription'
import { useSellerMetrics } from '@/hooks/useSellerMetrics'
import { formatWhatsAppMorningReport } from '@/lib/calculations'
import { calculateDailyRoutineDiscipline } from '@/lib/daily-routine'
import { useRemuneracaoEstimadaVendedor } from '@/features/remuneracao/hooks/useRemuneracao'

/**
 * Hook agregador do VendedorHome — centraliza fetching, metrics derivadas,
 * estados de loading/refetch e ações (refresh, share WhatsApp).
 *
 * Story 3.4 reconciliada — decomposição de `src/pages/VendedorHome.tsx`
 * (UX-001) seguindo ADR-0050.
 */
export function useVendedorHomePage() {
  const { profile, storeId } = useAuth()
  const {
    checkins,
    todayCheckin,
    loading: checkisLoading,
    fetchCheckins: refetchCheckins,
    referenceDate,
  } = useCheckins()
  const {
    storeGoal,
    sellerGoals,
    loading: goalsLoading,
    fetchGoals: refetchGoals,
  } = useGoals()
  const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
  const { treinamentos, loading: trainingsLoading, refetch: refetchTrainings } = useTrainings()
  const { devolutivas, loading: feedbacksLoading, refetch: refetchFeedbacks } = useFeedbacks()
  const [isRefetching, setIsRefetching] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const tacticalPrescription = useTacticalPrescription({
    checkins,
    treinamentos,
    userId: profile?.id,
  })
  const metrics = useSellerMetrics({
    checkins,
    todayCheckin,
    profile,
    sellerGoals,
    storeGoal,
    ranking,
    projectionMode: storeGoal?.projection_mode,
  })
  const {
    estimativa: remuneracaoEstimada,
    resumo: remuneracaoResumo,
    plano: remuneracaoPlano,
    regras: remuneracaoRegras,
    loading: remunerationLoading,
    error: remunerationError,
  } = useRemuneracaoEstimadaVendedor({
    lojaId: storeId,
    cargo: 'Vendedor',
    vendasRealizadas: metrics?.vendasMes || 0,
    vendasProjetadas: Math.max(metrics?.projecao || 0, metrics?.vendasMes || 0),
    meta: metrics?.meta || 0,
  })

  const referenceDateLabel = useMemo(() => {
    if (!referenceDate) return 'Referência D-1'
    return new Date(`${referenceDate}T12:00:00`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }, [referenceDate])

  const discipline = useMemo(() => {
    if (!profile?.id || !referenceDate) return null
    const end = new Date(`${referenceDate}T12:00:00`)
    const referenceDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(end)
      date.setDate(end.getDate() - (6 - index))
      return date.toISOString().slice(0, 10)
    })
    return calculateDailyRoutineDiscipline({ referenceDates, checkins, sellerId: profile.id })
  }, [checkins, profile?.id, referenceDate])

  const referenceCheckin = useMemo(() => {
    if (!profile?.id || !referenceDate) return null
    return (
      checkins.find(
        c => c.seller_user_id === profile.id && c.reference_date === referenceDate,
      ) || null
    )
  }, [checkins, profile?.id, referenceDate])

  const isLancamentoGateLocked = !referenceCheckin

  const weeklyProgressPct = useMemo(() => {
    if (!metrics?.meta) return 0
    const weeklyGoal = Math.max(Math.round(metrics.meta / 4), 1)
    return Math.min(100, Math.round((metrics.vendasSemana / weeklyGoal) * 100))
  }, [metrics?.meta, metrics?.vendasSemana])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      await Promise.all([
        refetchCheckins(),
        refetchGoals(),
        refetchRanking?.() || Promise.resolve(),
        refetchTrainings?.() || Promise.resolve(),
        refetchFeedbacks?.() || Promise.resolve(),
      ])
      setLastUpdatedAt(new Date())
      toast.success('Cockpit de performance atualizado!')
    } catch {
      toast.error('Não foi possível atualizar o cockpit.')
    } finally {
      setIsRefetching(false)
    }
  }, [refetchCheckins, refetchFeedbacks, refetchGoals, refetchRanking, refetchTrainings])

  const handleShareWhatsApp = useCallback(() => {
    if (!metrics || !profile) return
    const text = formatWhatsAppMorningReport(
      profile.name || 'Especialista',
      referenceDateLabel,
      {
        teamGoal: metrics.meta || 0,
        currentSales: metrics.vendasOntem,
        reaching: metrics.atingimento,
        projection: metrics.projecao,
        gap: Math.max((metrics.meta || 0) - metrics.vendasOntem, 0),
        vnd_total: metrics.vendasOntem,
        leads: referenceCheckin?.leads_prev_day || 0,
        visitas: referenceCheckin?.visit_prev_day || 0,
        agd_total: metrics.agendamentosHoje,
        pendingSellers: [],
      },
      [],
    )
    const opened = window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer',
    )
    if (!opened) toast.error('Não foi possível abrir o WhatsApp.')
  }, [metrics, profile, referenceCheckin, referenceDateLabel])

  const isLoading =
    checkisLoading || goalsLoading || rankingLoading || trainingsLoading || feedbacksLoading || remunerationLoading || !metrics

  return {
    profile,
    checkins,
    metrics,
    ranking,
    treinamentos,
    devolutivas,
    todayCheckin,
    remuneracaoEstimada,
    remuneracaoResumo,
    remuneracaoPlano,
    remuneracaoRegras,
    remunerationError,
    isLancamentoGateLocked,
    tacticalPrescription,
    discipline,
    referenceDate,
    referenceDateLabel,
    weeklyProgressPct,
    isLoading,
    isRefetching,
    lastUpdatedAt,
    handleRefresh,
    handleShareWhatsApp,
  }
}

export type UseVendedorHomePageReturn = ReturnType<typeof useVendedorHomePage>
