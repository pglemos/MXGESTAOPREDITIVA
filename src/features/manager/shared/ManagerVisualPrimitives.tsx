import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneStyles: Record<Tone, { icon: string; surface: string; text: string }> = {
  brand: { icon: 'bg-accent-blue-soft text-brand-primary', surface: 'border-brand-primary/20', text: 'text-brand-primary' },
  success: { icon: 'bg-status-success-surface text-status-success', surface: 'border-status-success/20', text: 'text-status-success' },
  warning: { icon: 'bg-status-warning-surface text-status-warning', surface: 'border-status-warning/20', text: 'text-status-warning' },
  danger: { icon: 'bg-status-error-surface text-status-error', surface: 'border-status-error/20', text: 'text-status-error' },
  info: { icon: 'bg-status-info-surface text-status-info', surface: 'border-status-info/20', text: 'text-status-info' },
  neutral: { icon: 'bg-surface-alt text-text-secondary', surface: 'border-border-subtle', text: 'text-text-secondary' },
}

export function ManagerMetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'brand',
  actionLabel,
  onAction,
  children,
}: {
  title: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone?: Tone
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}) {
  const styles = toneStyles[tone]
  return (
    <Card className={cn('group flex min-h-mx-32 flex-col overflow-hidden rounded-mx-xl border bg-white p-mx-md shadow-mx-sm sm:min-h-mx-40', styles.surface)}>
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0">
          <Typography variant="h3" className="text-sm normal-case tracking-normal">{title}</Typography>
          <Typography variant="tiny" tone="muted" className="mt-1 block normal-case tracking-normal">{detail}</Typography>
        </div>
        <span className={cn('grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-mx-lg', styles.icon)}>
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-mx-sm flex flex-1 items-end justify-between gap-mx-sm sm:mt-mx-md">
        <Typography variant="h2" className={cn('text-3xl leading-none', styles.text)}>{value}</Typography>
        {children}
      </div>
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" className="mt-mx-sm min-h-11 w-full justify-between px-0 text-brand-primary" onClick={onAction}>
          {actionLabel}<span aria-hidden="true">→</span>
        </Button>
      )}
    </Card>
  )
}

export function ManagerStatusGauge({ value, label, ariaLabel }: { value: number; label: string; ariaLabel: string }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      className="grid h-mx-20 w-mx-20 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--color-brand-primary) ${normalized * 3.6}deg, var(--color-border-subtle) 0deg)` }}
    >
      <div className="grid h-mx-14 w-mx-14 place-items-center rounded-full bg-white text-center">
        <strong className="text-base leading-none text-text-primary">{normalized}%</strong>
        <span className="max-w-mx-12 text-[9px] font-semibold leading-tight text-text-secondary">{label}</span>
      </div>
    </div>
  )
}

export function ManagerSectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn('overflow-hidden rounded-mx-xl border border-border-subtle bg-white shadow-mx-sm', className)}>{children}</Card>
}
