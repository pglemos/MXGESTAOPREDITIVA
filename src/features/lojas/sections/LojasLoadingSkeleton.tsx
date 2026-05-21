import { Skeleton } from '@/components/atoms/Skeleton'

/**
 * Skeleton de loading inicial da page Lojas.
 *
 * Extraído de `src/pages/Lojas.tsx` (Story 3.5 reconciliada, ADR-0050).
 */
export function LojasLoadingSkeleton() {
  return (
    <main
      className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando lojas"
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
        <div className="space-y-mx-xs text-center lg:text-left">
          <Skeleton className="h-mx-10 w-mx-64 mx-auto lg:mx-0" />
          <Skeleton className="h-mx-xs w-mx-48 mx-auto lg:mx-0" />
        </div>
        <div className="flex justify-center gap-mx-sm">
          <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
          <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-mx-64 rounded-mx-2xl" />
        ))}
      </div>
    </main>
  )
}
