import { Skeleton } from '@/components/atoms/Skeleton'
import { cn } from '@/lib/utils'

export interface SkeletonChartProps {
  className?: string
  height?: string
}

/**
 * SkeletonChart — Placeholder para gráficos (bar/line).
 * Renderiza "barras" verticais com alturas variadas para sugerir um gráfico.
 */
export function SkeletonChart({ className, height = 'h-64' }: SkeletonChartProps) {
  const bars = [60, 80, 45, 95, 70, 55, 88, 40, 75, 65, 90, 50]
  return (
    <div className={cn('w-full rounded-2xl border border-gray-100/40 p-6', height, className)}>
      <div className="flex items-end justify-between gap-2 h-full pb-4">
        {bars.map((h, i) => (
          <Skeleton key={i} variant="rect" className="flex-1 rounded-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
