import { Skeleton } from '@/components/atoms/Skeleton'

type Props = {
  ariaLabel?: string
  errorMessage?: string | null
}

export function FeedbackLoadingSkeleton({
  ariaLabel = 'Carregando devolutivas',
  errorMessage = null,
}: Props) {
  return (
    <main
      className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt"
      aria-busy="true"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
        <div className="space-y-mx-xs">
          <Skeleton className="h-mx-10 w-mx-64" />
          <Skeleton className="h-mx-xs w-mx-48" />
        </div>
      </header>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-mx-2xl border border-status-error/20 bg-status-error-surface px-mx-md py-mx-sm text-sm font-bold text-status-error"
        >
          {errorMessage}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
        <Skeleton className="h-mx-64 rounded-mx-2xl" />
        <Skeleton className="h-mx-64 rounded-mx-2xl" />
        <Skeleton className="h-mx-64 rounded-mx-2xl" />
      </div>
    </main>
  )
}

export default FeedbackLoadingSkeleton
