import { Card } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { MXScoreCard } from '@/components/molecules/MXScoreCard'

/**
 * Skeleton loading da página VendedorHome.
 * Story 3.4 reconciliada (ADR-0050).
 */
export function VendedorHomeSkeleton() {
  return (
    <main
      className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500 overflow-hidden"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando painel do vendedor"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
        <div className="space-y-mx-xs">
          <Skeleton className="h-mx-10 w-mx-64" />
          <Skeleton className="h-mx-xs w-mx-48" />
        </div>
        <div className="flex gap-mx-sm">
          <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
          <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
        <MXScoreCard.Skeleton />
        <MXScoreCard.Skeleton />
        <MXScoreCard.Skeleton />
        <MXScoreCard.Skeleton />
      </div>

      <Card className="p-mx-lg md:p-mx-xl bg-white/50 border-dashed border-2 border-border-default rounded-mx-4xl">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-mx-xs w-mx-48" />
          <Skeleton className="h-mx-xs w-mx-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
          <Skeleton className="h-mx-64 rounded-mx-3xl" />
          <Skeleton className="h-mx-96 rounded-mx-3xl" />
          <Skeleton className="h-mx-64 rounded-mx-3xl" />
        </div>
      </Card>
    </main>
  )
}

export default VendedorHomeSkeleton
