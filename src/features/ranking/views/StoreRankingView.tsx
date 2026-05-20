import { Search } from 'lucide-react'
import { Input } from '@/components/atoms/Input'
import { SellerProfileModal } from '@/features/ranking/components/SellerProfileModal'
import { RankingErrorBoundary } from '@/features/ranking/components/RankingErrorBoundary'
import { RankingSkeleton } from '@/features/ranking/components/RankingSkeleton'
import { StoreRankingHeader } from '@/features/ranking/sections/StoreRankingHeader'
import { StoreStatsCards } from '@/features/ranking/sections/StoreStatsCards'
import { StoreContextCards } from '@/features/ranking/sections/StoreContextCards'
import { BattleSelector } from '@/features/ranking/sections/BattleSelector'
import { LeaderboardList } from '@/features/ranking/sections/LeaderboardList'
import { useStoreRankingPageData } from '@/features/ranking/hooks/useStoreRankingPageData'

/**
 * Container slim do Ranking por Loja (perfis vendedor/gerente/dono).
 * Orquestra header, contexto, stats, tabs (leaderboard/battle) e modal de profile
 * via aggregator hook `useStoreRankingPageData`.
 *
 * Story 2.3 — ADR-0050. Decompõe parte store de `src/pages/Ranking.tsx`.
 */
export function StoreRankingView() {
  const data = useStoreRankingPageData()

  if (data.loading) {
    return <RankingSkeleton ariaLabel="Consolidando ranking" variant="store" />
  }

  return (
    <RankingErrorBoundary sectionName="Ranking da Loja">
      <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
        <StoreRankingHeader
          rankingCount={data.sortedRanking.length}
          viewMode={data.viewMode}
          onChangeViewMode={data.setViewMode}
          onRefresh={data.handleRefresh}
          isRefetching={data.isRefetching}
          lastUpdatedAt={data.lastUpdatedAt}
        />

        <StoreContextCards role={data.role} />

        <StoreStatsCards
          storeTotalVendas={data.storeSales.storeTotalVendas}
          storeAttainment={data.storeSales.storeAttainment}
          storeTotalLeads={data.storeSales.storeTotalLeads}
          storeTotalAgd={data.storeSales.storeTotalAgd}
          storeTotalVis={data.storeSales.storeTotalVis}
        />

        {data.error && (
          <div role="alert" className="rounded-mx-2xl border border-status-error/20 bg-status-error-surface px-mx-md py-mx-sm text-sm font-bold text-status-error">
            {data.error}
          </div>
        )}

        <div className="flex-1 min-h-0 pb-32" aria-live="polite">
          {data.viewMode === 'battle' && (
            <BattleSelector
              opponents={data.battleOpponents}
              ranking={data.sortedRanking}
              onToggle={data.toggleOpponent}
              onClear={() => data.setBattleOpponents([])}
              showStoreName={false}
            />
          )}

          {data.viewMode === 'leaderboard' && (
            <LeaderboardList
              ranking={data.sortedRanking}
              podium={data.podiumOrder}
              currentUserId={data.profile?.id}
              battleOpponents={data.battleOpponents}
              showStoreName={false}
              onSelect={data.setSelectedSeller}
              onToggleOpponent={(id) => {
                data.toggleOpponent(id)
                data.setViewMode('battle')
              }}
              beforeList={
                <div className="relative group w-full max-w-sm mb-4">
                  <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                  <Input
                    id="ranking-store-search"
                    name="ranking-store-search"
                    aria-label="Localizar vendedor"
                    placeholder="LOCALIZAR VENDEDOR..."
                    value={data.searchTerm}
                    onChange={(e) => data.setSearchTerm(e.target.value)}
                    className="!pl-11 !h-mx-14 !text-mx-tiny uppercase tracking-widest font-black"
                  />
                </div>
              }
            />
          )}
        </div>

        {data.selectedSellerEntry && (
          <SellerProfileModal
            seller={data.selectedSellerEntry}
            onClose={() => data.setSelectedSeller(null)}
          />
        )}
      </main>
    </RankingErrorBoundary>
  )
}

export default StoreRankingView
