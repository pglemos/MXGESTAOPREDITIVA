import { useCallback, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNetworkPerformance } from '@/hooks/useNetworkPerformance'
import { chartTokens } from '@/lib/charts/tokens'
import { slugify } from '@/lib/utils'
import { roleLabels } from '../data/formatters'

/**
 * Hook de dados/ações da view Admin (BI Executivo da Rede).
 * Story 3.3 reconciliada — extraído de `AdminPerformanceV2` em SalesPerformance.tsx.
 */
export function useAdminPerformancePage() {
  const { metrics, loading, refetch } = useNetworkPerformance()
  const { setActiveStoreId } = useAuth()
  const navigate = useNavigate()
  const [isRefetching, setIsRefetching] = useState(false)

  const topStores = useMemo(() => metrics.byStore.slice(0, 10), [metrics.byStore])

  const roleData = useMemo(
    () =>
      metrics.roleBreakdown.map((item) => ({
        name: roleLabels[item.role] || item.role,
        value: item.total,
        active: item.active,
      })),
    [metrics.roleBreakdown],
  )

  const funnelData = useMemo(
    () => [
      { name: 'Leads', value: metrics.totalLeads, color: chartTokens.series.s4() },
      { name: 'Agend.', value: metrics.totalAgd, color: chartTokens.series.s7() },
      { name: 'Visitas', value: metrics.totalVis, color: chartTokens.series.s6() },
      { name: 'Vendas', value: metrics.totalSales, color: chartTokens.series.s2() },
    ],
    [metrics.totalAgd, metrics.totalLeads, metrics.totalSales, metrics.totalVis],
  )

  const consultingData = useMemo(
    () =>
      metrics.consultingStatus.length > 0
        ? metrics.consultingStatus.map((item) => ({
            name: item.status.replace(/_/g, ' '),
            value: item.total,
          }))
        : [{ name: 'Sem status', value: 0 }],
    [metrics.consultingStatus],
  )

  const hasHistoricalData = metrics.historicalCheckins > 0

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    await refetch()
    setIsRefetching(false)
    toast.success('Matriz executiva sincronizada!')
  }, [refetch])

  const handleExport = useCallback(async () => {
    const { exportToExcel } = await import('@/lib/export')
    const rows = metrics.byStore.map((s) => ({
      Loja: s.storeName,
      Ativa: s.active ? 'Sim' : 'Nao',
      'Vendas historicas': s.sales,
      'Vendas mes atual': s.currentMonthSales,
      Meta: s.goal,
      'Atingimento %': s.reaching,
      Leads: s.leads,
      Agendamentos: s.agd,
      Visitas: s.vis,
      'Conv Lead Venda %': s.convLeadVnd,
      'Conv Agenda Venda %': s.convAgdVnd,
      'Conv Visita Venda %': s.convVisVnd,
      'Dias com lancamento': s.checkinDays,
      Vendedores: s.sellers,
      Gerentes: s.managers,
      Donos: s.owners,
      'Ultima atividade': s.lastActivity || '',
    }))
    exportToExcel(rows, `BI_Executivo_Rede_${format(new Date(), 'yyyy-MM-dd')}`)
    toast.success('BI executivo exportado!')
  }, [metrics.byStore])

  const handleStoreClick = useCallback(
    (storeId: string, storeName: string) => {
      setActiveStoreId(storeId)
      navigate(`/lojas/${slugify(storeName)}`)
    },
    [setActiveStoreId, navigate],
  )

  return {
    metrics,
    loading,
    isRefetching,
    topStores,
    roleData,
    funnelData,
    consultingData,
    hasHistoricalData,
    handleRefresh,
    handleExport,
    handleStoreClick,
  }
}
