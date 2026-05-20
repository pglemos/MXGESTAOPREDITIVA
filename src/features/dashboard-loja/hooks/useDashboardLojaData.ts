import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, parseISO, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useSellersByStore } from '@/hooks/useStores'
import { calculateReferenceDate, useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useOperationalSettings } from '@/hooks/useOperationalSettings'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useDRE } from '@/hooks/useDRE'
import { somarVendas, calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { buildStoreSalesRules } from '@/lib/storeSalesRules'
import type { RankingEntry } from '@/types/database'

export type StoreRankingEntry = RankingEntry & { id: string }
export type ViewMode = 'day' | 'month'

type UseDashboardLojaDataInput = {
  selectedStoreId: string | null
  selectedStoreName: string
}

/**
 * Hook agregador para o DashboardLoja — concentra fetch de checkins, sales, DRE,
 * settings operacionais e o canal Supabase Realtime que dispara refetch.
 * Extraído de DashboardLoja.tsx (Story 2.5, ADR-0050).
 */
export function useDashboardLojaData({ selectedStoreId, selectedStoreName }: UseDashboardLojaDataInput) {
  const { sellers } = useSellersByStore(selectedStoreId)
  const { goal: storeGoal, refetch: refetchStoreGoal } = useStoreGoal(selectedStoreId)
  const operationalSettings = useOperationalSettings(selectedStoreId)
  const {
    store: operationalStore,
    deliveryRules,
    benchmark,
    metaRules: operationalMetaRules,
    loading: operationalLoading,
    fetchSettings,
    saveSettings,
  } = operationalSettings

  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [referenceDate] = useState(() => calculateReferenceDate())
  const [startDate, setStartDate] = useState(() => format(startOfMonth(parseISO(referenceDate)), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(() => referenceDate)
  const [isRefetching, setIsRefetching] = useState(false)
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { checkins, loading, refetch } = useCheckinsByDateRange(
    selectedStoreId,
    viewMode === 'day' ? referenceDate : startDate,
    viewMode === 'day' ? referenceDate : endDate
  )

  // Realtime Sync: Escutar alterações na tabela de checkins para esta loja
  useEffect(() => {
    if (!selectedStoreId) return

    const channel = supabase
      .channel(`dashboard-sync-${selectedStoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lancamentos_diarios',
          filter: `store_id=eq.${selectedStoreId}`,
        },
        () => {
          if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current)
          refetchTimerRef.current = setTimeout(() => {
            void refetch()
              .then(() => {
                setSyncWarning(null)
                setLastSyncAt(new Date())
              })
              .catch(() => setSyncWarning('Falha ao sincronizar automaticamente. Use Atualizar.'))
          }, 500)
        }
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR') {
          setSyncWarning('Realtime indisponível. Use Atualizar para confirmar os dados.')
          toast.error('Realtime do dashboard indisponível. Use atualizar para sincronizar.')
        }
      })

    return () => {
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current)
        refetchTimerRef.current = null
      }
      supabase.removeChannel(channel)
    }
  }, [selectedStoreId, refetch])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    try {
      await refetch()
      setSyncWarning(null)
      setLastSyncAt(new Date())
      toast.success('Performance sincronizada!')
    } catch {
      setSyncWarning('Falha na atualização manual. Tente novamente antes de tomar decisão operacional.')
      toast.error('Não foi possível atualizar a performance.')
    } finally {
      setIsRefetching(false)
    }
  }, [refetch])

  const effectiveMonthlyGoal = operationalMetaRules?.monthly_goal ?? storeGoal?.target ?? 0

  const funnelBenchmarks = useMemo(
    () => ({
      leadAgd: benchmark?.lead_to_agend ?? operationalMetaRules?.bench_lead_agd ?? 20,
      agdVisita: benchmark?.agend_to_visit ?? operationalMetaRules?.bench_agd_visita ?? 60,
      visitaVnd: benchmark?.visit_to_sale ?? operationalMetaRules?.bench_visita_vnd ?? 33,
    }),
    [benchmark, operationalMetaRules]
  )

  const storeSalesParams = useMemo(() => {
    const checkinsBySeller = (checkins || []).reduce((acc, c) => {
      if (!acc[c.seller_user_id]) acc[c.seller_user_id] = []
      acc[c.seller_user_id].push(c)
      return acc
    }, {} as Record<string, typeof checkins>)

    return {
      checkins,
      ranking: (sellers || []).map(s => {
        const sellerCheckins = checkinsBySeller[s.id] || []
        return {
          id: s.id,
          user_id: s.id,
          user_name: s.name,
          avatar_url: s.avatar_url,
          is_venda_loja: s.is_venda_loja || false,
          vnd_total: somarVendas(sellerCheckins),
          leads: sellerCheckins.reduce((acc, c) => acc + (c.leads_prev_day || 0), 0),
          agd_total: sellerCheckins.reduce(
            (acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0),
            0
          ),
          visitas: sellerCheckins.reduce((acc, c) => acc + (c.visit_prev_day || 0), 0),
          meta: effectiveMonthlyGoal,
          atingimento: 0,
          projecao: 0,
          ritmo: 0,
          efficiency: 0,
          status: { label: '', color: '' },
          gap: 0,
          position: 0,
          checked_in: s.checkin_today,
        }
      }),
      rules: buildStoreSalesRules({
        storeId: selectedStoreId,
        monthlyGoal: effectiveMonthlyGoal,
        metaRules: operationalMetaRules,
      }),
    }
  }, [checkins, effectiveMonthlyGoal, operationalMetaRules, selectedStoreId, sellers])

  const storeSales = useStoreSales(storeSalesParams)
  const { financials, computeDRE: computeDREFn } = useDRE(undefined, selectedStoreId || undefined)

  const latestDRE = useMemo(() => {
    if (!financials || financials.length === 0) return null
    return computeDREFn(financials[0])
  }, [financials, computeDREFn])

  const metrics = useMemo(() => {
    const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
    return {
      totalSales: storeSales.storeTotalVendas,
      totalLeads: storeSales.storeTotalLeads,
      totalAgd: storeSales.storeTotalAgd,
      totalVis: storeSales.storeTotalVis,
      attainment: storeSales.storeAttainment,
      goalValue: effectiveMonthlyGoal || storeSales.storeGoal,
      checkedInCount,
      ranking: storeSales.processedRanking,
      storeName: selectedStoreName || 'Unidade MX',
    }
  }, [storeSales, sellers, selectedStoreName, effectiveMonthlyGoal])

  const funilData = useMemo(() => calcularFunil(checkins), [checkins])
  const diagnostics = useMemo(() => gerarDiagnosticoMX(funilData), [funilData])

  const pendingDisciplineSellers = useMemo(
    () => (sellers || []).filter(seller => !seller.checkin_today),
    [sellers]
  )

  const lastSyncLabel = useMemo(() => {
    if (!lastSyncAt) return 'Ainda não atualizado nesta sessão'
    return `Atualizado às ${lastSyncAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }, [lastSyncAt])

  return {
    // dados brutos
    sellers,
    checkins,
    loading,
    // settings operacionais
    storeGoal,
    refetchStoreGoal,
    operationalStore,
    deliveryRules,
    benchmark,
    operationalMetaRules,
    operationalLoading,
    fetchSettings,
    saveSettings,
    // período
    viewMode,
    setViewMode,
    referenceDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    // sync
    isRefetching,
    syncWarning,
    lastSyncAt,
    lastSyncLabel,
    handleRefresh,
    // derivados
    effectiveMonthlyGoal,
    funnelBenchmarks,
    metrics,
    funilData,
    diagnostics,
    latestDRE,
    pendingDisciplineSellers,
  }
}
