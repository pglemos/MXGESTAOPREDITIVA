import type { ReactNode } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'

export function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm overflow-visible ${className}`}>
      {children}
    </Card>
  )
}

export function CardTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-mx-sm">
      <span className="text-brand-primary">{icon}</span>
      <Typography variant="h3" className="text-sm uppercase tracking-normal">
        {title}
      </Typography>
    </div>
  )
}

export function PanelTitle({
  title,
  subtitle,
  action,
  to,
}: {
  title: string
  subtitle?: string
  action?: string
  to?: string
}) {
  return (
    <div className="flex items-start justify-between gap-mx-md">
      <div className="min-w-0">
        <Typography variant="h3" className="text-sm uppercase tracking-normal">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
            {subtitle}
          </Typography>
        )}
      </div>
      {action && to && (
        <Link to={to} className="shrink-0 text-xs font-semibold text-brand-primary">
          {action}
        </Link>
      )}
    </div>
  )
}

export function SmallPanel({ title, action, to, children }: { title: string; action: string; to: string; children: ReactNode }) {
  return (
    <DashboardCard>
      <PanelTitle title={title} action={action} to={to} />
      {children}
    </DashboardCard>
  )
}

export function InlineStat({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-mx-sm">
      <span className="text-text-secondary">{label}</span>
      <strong className={success ? 'font-semibold text-status-success' : 'font-semibold text-text-primary'}>{value}</strong>
    </div>
  )
}

export function MiniMetric({ label, value, hint, className = '' }: { label: string; value: string; hint: string; className?: string }) {
  return (
    <div className={className}>
      <Typography variant="tiny" tone="muted" className="block font-semibold normal-case tracking-normal">
        {label}
      </Typography>
      <Typography variant="h2" className="text-2xl">
        {value}
      </Typography>
      <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
        {hint}
      </Typography>
    </div>
  )
}

export function MiniBar({ value, className = '', label = 'Progresso' }: { value: number; className?: string; label?: string }) {
  const normalized = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalized)}
      className={`h-2 rounded-full bg-surface-alt ${className}`}
    >
      <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${normalized}%` }} />
    </div>
  )
}

export function ProgressRing({ value, label, large = false }: { value: number; label: string; large?: boolean }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      className={`${large ? 'h-28 w-28' : 'h-24 w-24'} grid shrink-0 place-items-center rounded-full`}
      style={{ background: `conic-gradient(var(--color-brand-primary) ${normalized * 3.6}deg, var(--color-border-subtle) 0deg)` }}
    >
      <div className={`${large ? 'h-20 w-20' : 'h-16 w-16'} grid place-items-center rounded-full bg-white text-center`}>
        <span className="text-xl font-semibold leading-none">{normalized}%</span>
        <span className="px-1 text-[10px] font-semibold leading-tight text-text-secondary">{label}</span>
      </div>
    </div>
  )
}

export function CheckRow({ label, value, done = false }: { label: string; value: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-mx-sm text-sm">
      <span className="flex min-w-0 items-center gap-mx-xs text-text-secondary">
        {done ? <CheckCircle2 size={16} className="shrink-0 text-status-success" /> : <Circle size={16} className="shrink-0 text-text-tertiary" />}
        <span className="min-w-0 leading-snug">{label}</span>
      </span>
      {value && <strong className="shrink-0 font-semibold text-text-primary">{value}</strong>}
    </div>
  )
}
