import { Skeleton } from '@/components/atoms/Skeleton'
import { cn } from '@/lib/utils'

export interface SkeletonTableProps {
  rows?: number
  cols?: number
  className?: string
  showHeader?: boolean
}

/**
 * SkeletonTable — Placeholder para tabelas/listas estruturadas.
 * Renderiza N linhas x M colunas com header opcional.
 */
export function SkeletonTable({ rows = 5, cols = 4, className, showHeader = true }: SkeletonTableProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      {showHeader && (
        <div className="grid gap-4 pb-2 border-b border-gray-100" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`h-${i}`} variant="text" className="h-4" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} variant="table-row" />
          ))}
        </div>
      ))}
    </div>
  )
}
