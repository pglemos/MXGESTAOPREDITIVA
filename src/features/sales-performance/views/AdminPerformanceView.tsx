import { RefreshCw } from 'lucide-react'
import { Typography } from '@/components/atoms/Typography'
import { useAdminPerformancePage } from '../hooks/useAdminPerformancePage'
import { AdminHeader } from '../sections/AdminHeader'
import { AdminKpiCards } from '../sections/AdminKpiCards'
import { AdminSellOutEvolution } from '../sections/AdminSellOutEvolution'
import { AdminHealthCard } from '../sections/AdminHealthCard'
import { AdminTopStoresList } from '../sections/AdminTopStoresList'
import { AdminGoalCompareChart } from '../sections/AdminGoalCompareChart'
import { AdminFunnelChart } from '../sections/AdminFunnelChart'
import { AdminPeopleChart } from '../sections/AdminPeopleChart'
import { AdminConsultingCard } from '../sections/AdminConsultingCard'
import { AdminStoreMatrixTable } from '../sections/AdminStoreMatrixTable'
import { SalesPerformanceErrorBoundary } from '../components/SalesPerformanceErrorBoundary'

export function AdminPerformanceView() {
  const {
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
  } = useAdminPerformancePage()

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
        <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
        <Typography variant="caption" tone="muted" className="animate-pulse">
          Carregando matriz executiva da rede...
        </Typography>
      </div>
    )
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md sm:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      <AdminHeader
        metrics={metrics}
        isRefetching={isRefetching}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      <SalesPerformanceErrorBoundary sectionName="KPIs">
        <AdminKpiCards metrics={metrics} />
      </SalesPerformanceErrorBoundary>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg shrink-0">
        <section className="xl:col-span-8">
          <SalesPerformanceErrorBoundary sectionName="Evolução Sell-out">
            <AdminSellOutEvolution metrics={metrics} hasHistoricalData={hasHistoricalData} />
          </SalesPerformanceErrorBoundary>
        </section>
        <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
          <AdminHealthCard metrics={metrics} />
        </aside>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg shrink-0">
        <SalesPerformanceErrorBoundary sectionName="Top Lojas">
          <AdminTopStoresList topStores={topStores} onStoreClick={handleStoreClick} />
        </SalesPerformanceErrorBoundary>
        <SalesPerformanceErrorBoundary sectionName="Comparativo Meta">
          <AdminGoalCompareChart topStores={topStores} />
        </SalesPerformanceErrorBoundary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-mx-lg shrink-0">
        <SalesPerformanceErrorBoundary sectionName="Funil">
          <AdminFunnelChart funnelData={funnelData} metrics={metrics} />
        </SalesPerformanceErrorBoundary>
        <SalesPerformanceErrorBoundary sectionName="Pessoas">
          <AdminPeopleChart roleData={roleData} metrics={metrics} />
        </SalesPerformanceErrorBoundary>
        <SalesPerformanceErrorBoundary sectionName="Consultoria">
          <AdminConsultingCard consultingData={consultingData} metrics={metrics} />
        </SalesPerformanceErrorBoundary>
      </div>

      <SalesPerformanceErrorBoundary sectionName="Matriz de Lojas">
        <AdminStoreMatrixTable metrics={metrics} onStoreClick={handleStoreClick} />
      </SalesPerformanceErrorBoundary>
    </main>
  )
}

export default AdminPerformanceView
