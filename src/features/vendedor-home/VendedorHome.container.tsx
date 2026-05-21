import { useVendedorHomePage } from './hooks/useVendedorHomePage'
import { VendedorHomeErrorBoundary } from './components/VendedorHomeErrorBoundary'
import { VendedorHomeSkeleton } from './sections/VendedorHomeSkeleton'
import { VendedorHomeHeader } from './sections/VendedorHomeHeader'
import { RitualHojeCard } from './sections/RitualHojeCard'
import { DailyCheckinBanner } from './sections/DailyCheckinBanner'
import { TacticalPrescriptionBanner } from './sections/TacticalPrescriptionBanner'
import { MetricsCardsGrid } from './sections/MetricsCardsGrid'
import { DisciplineCard } from './sections/DisciplineCard'
import { RankingSection } from './sections/RankingSection'
import { ChannelsMatrixCard } from './sections/ChannelsMatrixCard'
import { DailyRoutineCard } from './sections/DailyRoutineCard'
import { WeeklySprintAside } from './sections/WeeklySprintAside'

/**
 * Container raiz do VendedorHome — composição de seções via ADR-0050.
 *
 * Story 3.4 reconciliada — decomposição de `src/pages/VendedorHome.tsx`
 * (UX-001). Cada seção é envelopada em ErrorBoundary local para isolar falhas.
 */
export function VendedorHome() {
  const home = useVendedorHomePage()

  if (home.isLoading || !home.metrics) {
    return <VendedorHomeSkeleton />
  }

  const { metrics, profile, todayCheckin, tacticalPrescription, discipline } = home
  const firstName = profile?.name?.split(' ')[0] ?? ''
  const rankPosition = metrics.myRank?.position ?? '--'

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
      <VendedorHomeErrorBoundary sectionName="Header">
        <VendedorHomeHeader
          firstName={firstName}
          rankPosition={rankPosition}
          lastUpdatedAt={home.lastUpdatedAt}
          isRefetching={home.isRefetching}
          onShareWhatsApp={home.handleShareWhatsApp}
          onRefresh={home.handleRefresh}
        />
      </VendedorHomeErrorBoundary>

      <VendedorHomeErrorBoundary sectionName="Ritual de hoje">
        <RitualHojeCard hasTodayCheckin={!!todayCheckin} />
      </VendedorHomeErrorBoundary>

      {!todayCheckin && (
        <VendedorHomeErrorBoundary sectionName="Lançamento Diário">
          <DailyCheckinBanner referenceDateLabel={home.referenceDateLabel} />
        </VendedorHomeErrorBoundary>
      )}

      <VendedorHomeErrorBoundary sectionName="Reciclagem">
        <TacticalPrescriptionBanner prescription={tacticalPrescription} />
      </VendedorHomeErrorBoundary>

      <VendedorHomeErrorBoundary sectionName="KPIs">
        <MetricsCardsGrid
          vendasOntem={metrics.vendasOntem}
          agendamentosHoje={metrics.agendamentosHoje}
          projecao={metrics.projecao}
          meta={metrics.meta}
          atingimento={metrics.atingimento}
        />
      </VendedorHomeErrorBoundary>

      <VendedorHomeErrorBoundary sectionName="Disciplina">
        <DisciplineCard discipline={discipline} />
      </VendedorHomeErrorBoundary>

      <VendedorHomeErrorBoundary sectionName="Ranking">
        <RankingSection
          position={metrics.myRank?.position}
          vendasMes={metrics.vendasMes}
          atingimento={metrics.atingimento}
          competitorAbove={metrics.competitors?.above}
          competitorBelow={metrics.competitors?.below}
        />
      </VendedorHomeErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32 relative z-10">
        <div className="lg:col-span-8 space-y-mx-lg">
          <VendedorHomeErrorBoundary sectionName="Matrix de Canais">
            <ChannelsMatrixCard
              porCanal={metrics.porCanal}
              vendasMes={metrics.vendasMes}
            />
          </VendedorHomeErrorBoundary>
          <VendedorHomeErrorBoundary sectionName="Rotina MX">
            <DailyRoutineCard />
          </VendedorHomeErrorBoundary>
        </div>
        <VendedorHomeErrorBoundary sectionName="Weekly Sprint">
          <WeeklySprintAside
            vendasSemana={metrics.vendasSemana}
            weeklyProgressPct={home.weeklyProgressPct}
          />
        </VendedorHomeErrorBoundary>
      </div>
    </main>
  )
}

export default VendedorHome
