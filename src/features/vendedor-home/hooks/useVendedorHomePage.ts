import { useCallback, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useRanking } from '@/hooks/useRanking'
import { useFeedbacks, useTrainings } from '@/hooks/useData'
import { useTacticalPrescription } from '@/hooks/useTacticalPrescription'
import { useSellerMetrics } from '@/hooks/useSellerMetrics'
import { useOfficialSellerPerformance } from '@/hooks/useOfficialSellerPerformance'
import { formatWhatsAppMorningReport } from '@/lib/calculations'
import { calculateDailyRoutineDiscipline } from '@/lib/daily-routine'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import {
  useRemuneracaoEstimadaVendedor,
  useMeuNivelCarreira,
  type RemuneracaoVenda,
} from '@/features/remuneracao/hooks/useRemuneracao'

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
  const { metaRules } = useStoreMetaRules(storeId || undefined)
  const storeSales = useStoreSales({ checkins, ranking, rules: metaRules })
  const { nivel: nivelCarreira } = useMeuNivelCarreira(profile?.id || null)
  const { treinamentos, loading: trainingsLoading, refetch: refetchTrainings } = useTrainings()
  const { devolutivas, loading: feedbacksLoading, refetch: refetchFeedbacks } = useFeedbacks()
  const { oportunidades, loading: oportunidadesLoading, refetch: refetchOportunidades } = useOportunidades()
  const { perfil: vendedorPerfil, vinculoTipo, loading: perfilVendedorLoading } = useVendedorPerfil()
  const [isRefetching, setIsRefetching] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const officialPeriod = useMemo(() => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    return { start: `${today.slice(0, 7)}-01`, end: today }
  }, [])
  const {
    performance: officialPerformance,
    loading: officialPerformanceLoading,
    refetch: refetchOfficialPerformance,
  } = useOfficialSellerPerformance(officialPeriod.start, officialPeriod.end, profile?.id, storeId)

  const tacticalPrescription = useTacticalPrescription({
    checkins,
    treinamentos,
    userId: profile?.id,
  })
  const legacyMetrics = useSellerMetrics({
    checkins,
    todayCheckin,
    profile,
    sellerGoals,
    storeGoal,
    ranking,
    projectionMode: storeGoal?.projection_mode,
  })
  const metrics = useMemo(() => {
    if (!legacyMetrics || !officialPerformance) return legacyMetrics
    return {
      ...legacyMetrics,
      vendasMes: officialPerformance.vendas_realizadas,
      projecao: officialPerformance.vendas_projetadas,
      meta: officialPerformance.meta,
      atingimento: officialPerformance.atingimento,
      faltaX: Math.max(officialPerformance.meta - officialPerformance.vendas_realizadas, 0),
      vendasOntem: officialPerformance.vendas_ultimo_dia,
    }
  }, [legacyMetrics, officialPerformance])
  const vendasDetalhadasRemuneracao = useMemo<RemuneracaoVenda[]>(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    return oportunidades
      .filter(oportunidade => oportunidade.etapa === 'ganho')
      .filter((oportunidade) => {
        const reference = oportunidade.closed_at || oportunidade.updated_at || oportunidade.created_at
        return reference ? new Date(reference).getTime() >= monthStart : false
      })
      .map(oportunidade => ({
        valor: Number(oportunidade.valor_negociado || 0),
        tipo_veiculo: oportunidade.tipo_veiculo,
      }))
  }, [oportunidades])

  const {
    estimativa: remuneracaoEstimada,
    resumo: remuneracaoResumo,
    plano: remuneracaoPlano,
    regras: remuneracaoRegras,
    loading: remunerationLoading,
    error: remunerationError,
  } = useRemuneracaoEstimadaVendedor({
    lojaId: storeId,
    planoId: vendedorPerfil.remuneracao_plano_id,
    cargo: vendedorPerfil.cargo_atual || 'Vendedor',
    vendasRealizadas: metrics?.vendasMes || 0,
    vendasProjetadas: Math.max(metrics?.projecao || 0, metrics?.vendasMes || 0),
    meta: metrics?.meta || 0,
    vendasDetalhadasRealizadas: vendasDetalhadasRemuneracao,
    vinculoTipo,
    atingimentoLojaPercentual: metrics?.atingimento || 0,
    carrosVendidosLoja: storeSales.storeTotalVendas,
    nivelCarreira,
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
        refetchOportunidades?.() || Promise.resolve(),
        refetchOfficialPerformance(),
      ])
      setLastUpdatedAt(new Date())
      toast.success('Cockpit de performance atualizado!')
    } catch {
      toast.error('Não foi possível atualizar o cockpit.')
    } finally {
      setIsRefetching(false)
    }
  }, [refetchCheckins, refetchFeedbacks, refetchGoals, refetchOfficialPerformance, refetchOportunidades, refetchRanking, refetchTrainings])

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
    checkisLoading ||
    goalsLoading ||
    rankingLoading ||
    trainingsLoading ||
    feedbacksLoading ||
    oportunidadesLoading ||
    perfilVendedorLoading ||
    remunerationLoading ||
    officialPerformanceLoading ||
    !metrics

  return {
    profile,
    checkins,
    metrics,
    ranking,
    oportunidades,
    treinamentos,
    devolutivas,
    todayCheckin,
    remuneracaoEstimada,
    remuneracaoResumo,
    remuneracaoPlano,
    remuneracaoRegras,
    remuneracaoDetalhesVisiveis: metaRules?.remuneracao_detalhes_visivel ?? true,
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
