import type { ReactNode } from 'react'
import { Card } from './Card'
import { Typography } from '../atoms/Typography'
import { cn } from '@/lib/utils'
import { useManagementVisualMode } from '@/components/visual/ManagementVisualContext'

export type StatTone = 'green' | 'red' | 'orange' | 'blue' | 'brand'

const DEFAULT_TONE_CHIP: Record<StatTone, string> = {
  green: 'bg-status-success/10 text-status-success',
  red: 'bg-status-error/10 text-status-error',
  orange: 'bg-status-warning/10 text-status-warning',
  blue: 'bg-status-info/10 text-status-info',
  brand: 'bg-brand-primary/10 text-brand-primary',
}

const MANAGER_TONE_CHIP: Record<StatTone, string> = {
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
  brand: 'bg-emerald-50 text-emerald-600',
}

type StatCardProps = {
  icon?: ReactNode
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: StatTone
  action?: ReactNode
}

export function StatCard({ icon, label, value, detail, tone = 'brand', action }: StatCardProps) {
  const visualMode = useManagementVisualMode()
  const manager = visualMode === 'manager'
  const toneChip = manager ? MANAGER_TONE_CHIP[tone] : DEFAULT_TONE_CHIP[tone]

  return (
    <Card className={manager
      ? 'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'
      : 'rounded-mx-2xl border border-border-subtle bg-white p-mx-lg shadow-mx-md'}
    >
      {(icon || action) ? (
        <div className={manager ? 'flex items-start justify-between gap-3' : 'flex items-start justify-between gap-mx-sm'}>
          {icon ? (
            <span className={cn(
              manager
                ? 'grid h-10 w-10 shrink-0 place-items-center rounded-xl'
                : 'grid h-mx-12 w-mx-12 shrink-0 place-items-center rounded-mx-2xl',
              toneChip,
            )}>
              {icon}
            </span>
          ) : <span />}
          {action}
        </div>
      ) : null}
      <Typography
        variant="caption"
        tone="muted"
        className={manager
          ? 'mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500'
          : 'mt-mx-md block break-words font-black uppercase leading-tight tracking-wide'}
      >
        {label}
      </Typography>
      <Typography variant="h2" className={manager ? 'mt-2 text-3xl font-bold leading-none text-gray-800 tabular-nums' : 'mt-mx-xs leading-tight tabular-nums'}>
        {value}
      </Typography>
      {detail ? (
        <Typography variant="p" tone="muted" className={manager ? 'mt-2 block text-sm text-gray-500' : 'mt-mx-xs block'}>
          {detail}
        </Typography>
      ) : null}
    </Card>
  )
}
