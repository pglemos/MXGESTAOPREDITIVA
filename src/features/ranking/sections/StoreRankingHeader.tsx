import { RefreshCw, Swords, Trophy } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { LastUpdated } from '@/components/molecules/LastUpdated'
import { cn } from '@/lib/utils'

export type StoreViewMode = 'leaderboard' | 'battle'

type Props = {
  rankingCount: number
  viewMode: StoreViewMode
  onChangeViewMode: (mode: StoreViewMode) => void
  onRefresh: () => void
  isRefetching: boolean
  lastUpdatedAt: Date | null
}

/**
 * Cabeçalho do StoreRanking — título, toggle modo (Ranking / Comparativo),
 * refresh e contador. Visual preservado do StoreRankingView original.
 */
export function StoreRankingHeader({
  rankingCount, viewMode, onChangeViewMode,
  onRefresh, isRefetching, lastUpdatedAt,
}: Props) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
      <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
          <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
          <Typography variant="h1">Ranking de <span className="text-mx-green-700">Performance</span></Typography>
        </div>
        <Typography variant="caption" className="pl-mx-md uppercase tracking-mx-wide font-black text-text-label">Performance em tempo real</Typography>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
        <div className="grid grid-cols-1 sm:flex w-full sm:w-auto bg-white p-1.5 rounded-2xl border border-border-default shadow-mx-sm mr-0 sm:mr-4 gap-mx-xs" role="tablist" aria-label="Modo da classificação da loja">
          <button type="button" role="tab" aria-selected={viewMode === 'leaderboard'} onClick={() => onChangeViewMode('leaderboard')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'leaderboard' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
            <Trophy size={14} /> Ranking
          </button>
          <button type="button" role="tab" aria-selected={viewMode === 'battle'} onClick={() => onChangeViewMode('battle')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'battle' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
            <Swords size={14} /> Comparativo
          </button>
        </div>

        <div className="flex items-center gap-mx-sm w-full sm:w-auto order-1 sm:order-none">
          <LastUpdated value={lastUpdatedAt} className="hidden xl:inline-flex" />
          <Button variant="outline" onClick={onRefresh} aria-label="Atualizar ranking da loja" className="rounded-mx-xl shadow-mx-sm h-mx-xl bg-white px-mx-md">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
            Atualizar
          </Button>
          <div className="flex-1 sm:flex-none flex items-center justify-center gap-mx-sm bg-white border border-border-default px-6 h-mx-xl rounded-mx-full shadow-mx-sm">
            <Trophy size={18} className="text-status-warning shrink-0" />
            <Typography variant="caption" className="whitespace-nowrap uppercase font-black text-mx-micro">{rankingCount} no ranking</Typography>
          </div>
        </div>
      </div>
    </header>
  )
}

export default StoreRankingHeader
