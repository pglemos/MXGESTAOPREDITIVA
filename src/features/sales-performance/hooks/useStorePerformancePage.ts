import { useCallback, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import {
  calcularAtingimento,
  calcularProjecao,
  getDiasInfo,
  somarVendas,
} from '@/lib/calculations'

/**
 * Hook de dados/ações da view Store (Loja única).
 * Story 3.3 reconciliada — extraído de `StorePerformance` em SalesPerformance.tsx.
 */
export function useStorePerformancePage() {
  const { checkins, loading: loadingCheckins, fetchCheckins } = useCheckins()
  const { storeGoal, loading: loadingGoals, fetchGoals } = useGoals()
  const { metaRules, fetchMetaRules } = useStoreMetaRules()
  const [isRefetching, setIsRefetching] = useState(false)
  const daysInfo = useMemo(() => getDiasInfo(), [])

  const metrics = useMemo(() => {
    const currentSales = somarVendas(checkins)
    const teamGoal = metaRules?.monthly_goal ?? storeGoal?.target ?? 0
    const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
    const reaching = calcularAtingimento(currentSales, teamGoal)
    return { currentSales, teamGoal, projection, reaching }
  }, [checkins, metaRules, storeGoal, daysInfo])

  const chartData = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const c of checkins) {
      const month = c.reference_date?.slice(0, 7)
      if (!month) continue
      byMonth[month] =
        (byMonth[month] || 0) +
        (c.vnd_porta_prev_day || 0) +
        (c.vnd_cart_prev_day || 0) +
        (c.vnd_net_prev_day || 0)
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, sales]) => ({ month, sales }))
  }, [checkins])

  const handleExport = useCallback(async () => {
    const { exportToExcel } = await import('@/lib/export')
    const rows = checkins.map((c) => ({
      Data: c.reference_date,
      Vendas:
        (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0),
      Leads: c.leads_prev_day || 0,
      Agendamentos: (c.agd_cart_prev_day || 0) + (c.agd_net_prev_day || 0),
      Visitas: c.visit_prev_day || 0,
    }))
    exportToExcel(rows, `BI_Performance_${format(new Date(), 'yyyy-MM')}`)
    toast.success('BI exportado!')
  }, [checkins])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    await Promise.all([fetchCheckins(), fetchGoals(), fetchMetaRules()])
    setIsRefetching(false)
    toast.success('Performance sincronizada!')
  }, [fetchCheckins, fetchGoals, fetchMetaRules])

  const loading = loadingCheckins || loadingGoals

  return {
    loading,
    isRefetching,
    metrics,
    chartData,
    handleExport,
    handleRefresh,
  }
}
