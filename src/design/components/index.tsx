import { cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  DoorOpen,
  Flame,
  Globe,
  Info,
  MinusCircle,
  PanelLeftClose,
  PanelLeftOpen,
  TriangleAlert,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/molecules/Card'
import { DataGrid, type DataGridProps } from '@/components/organisms/DataGrid'
import { MotionCard, MotionList, MotionPage, MotionRow } from '@/design/motion'

function decorativeIcon(icon: ReactNode) {
  if (!isValidElement(icon)) return icon
  return cloneElement(icon as ReactElement<{ 'aria-hidden'?: boolean; focusable?: boolean }>, {
    'aria-hidden': true,
    focusable: false,
  })
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export type SidebarItem = {
  label: string
  href: string
  icon?: ReactNode
  badge?: ReactNode
}

export type SidebarSection = {
  label?: string
  items: SidebarItem[]
}

export type SidebarProps = {
  sections: SidebarSection[]
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export function Sidebar({ sections, collapsed = false, onToggle, className }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'hidden h-screen shrink-0 flex-col border-r border-white/10 bg-mx-navy text-white transition-[width] duration-[240ms] lg:flex',
        collapsed ? 'w-[72px]' : 'w-[260px]',
        className
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-mx-teal to-mx-action font-extrabold">
          MX
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold leading-none text-white">MX</div>
            <div className="mt-1 text-[10px] font-bold uppercase text-slate-300">Performance</div>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="ml-auto grid h-9 w-9 place-items-center rounded-[12px] text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.label ?? sectionIndex} className="space-y-2">
            {section.label && !collapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-medium text-slate-300 transition-colors duration-[120ms] hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action',
                    active && 'bg-mx-teal text-white'
                  )}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center">{decorativeIcon(item.icon)}</span>
                  {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="rounded-full bg-mx-danger px-2 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export type AppShellProps = {
  children: ReactNode
  sidebar: ReactNode
  mobileHeader?: ReactNode
  className?: string
}

export function AppShell({ children, sidebar, mobileHeader, className }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className={cn('min-h-screen bg-mx-bg text-mx-text', className)}>
      <div className="flex min-h-screen">
        {sidebar}
        <div className="min-w-0 flex-1">
          <header className="fixed inset-x-0 top-0 z-40 border-b border-mx-border bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              {mobileHeader}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="ml-auto rounded-[12px] border border-mx-border px-3 py-2 text-sm font-bold text-mx-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action"
              >
                Menu
              </button>
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] p-4 pt-20 lg:p-8">{children}</main>
        </div>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[min(320px,85vw)] bg-mx-navy shadow-modal">{sidebar}</div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-[12px] bg-white text-mx-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export type PageShellProps = {
  children: ReactNode
  loading?: boolean
  skeleton?: ReactNode
  className?: string
  contentClassName?: string
}

export function PageShell({ children, loading, skeleton, className, contentClassName }: PageShellProps) {
  return (
    <MotionPage className={cn('min-h-full bg-mx-bg px-4 py-6 sm:px-6 lg:px-8', className)}>
      <div className={cn('mx-auto flex w-full max-w-[1440px] flex-col space-y-8', contentClassName)}>
        {loading ? skeleton ?? <SkeletonPage /> : children}
      </div>
    </MotionPage>
  )
}

export type PageHeaderProps = {
  icon?: ReactNode
  title: string
  subtitle?: string
  dateLabel?: ReactNode
  actions?: ReactNode
  variant?: 'default' | 'compact' | 'hero'
  className?: string
}

export function PageHeader({
  icon,
  title,
  subtitle,
  dateLabel,
  actions,
  variant = 'default',
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        variant === 'hero' && 'py-4',
        variant === 'compact' && 'gap-3',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mx-action-light text-mx-action">
            {decorativeIcon(icon)}
          </span>
        )}
        <div className="min-w-0">
          {dateLabel && <div className="mb-1 text-[11px] font-bold uppercase text-mx-muted">{dateLabel}</div>}
          <h1
            className={cn(
              'font-extrabold tracking-tight text-mx-dark',
              variant === 'compact' ? 'text-[22px]' : 'text-[28px]',
              variant === 'hero' && 'text-[32px]'
            )}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-mx-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </header>
  )
}

export type SurfaceCardProps = {
  title?: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  actions?: ReactNode
  active?: boolean
  tone?: 'default' | 'brand' | 'action' | 'success' | 'warning' | 'danger'
  className?: string
}

export function SurfaceCard({
  title,
  subtitle,
  icon,
  children,
  actions,
  active,
  tone = 'default',
  className,
}: SurfaceCardProps) {
  return (
    <MotionCard>
      <Card
        className={cn(
          'rounded-[20px] border bg-white shadow-card transition-shadow duration-[120ms] hover:shadow-card-hover',
          active ? 'border-mx-action' : 'border-mx-border',
          tone === 'brand' && 'border-transparent bg-gradient-to-br from-mx-navy to-mx-teal text-white',
          tone === 'action' && 'border-mx-action/30',
          tone === 'success' && 'border-mx-success/30',
          tone === 'warning' && 'border-mx-warning/30',
          tone === 'danger' && 'border-mx-danger/30',
          className
        )}
      >
        {(title || subtitle || icon || actions) && (
          <CardHeader className="border-b border-mx-divider bg-transparent p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                {icon && (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px] bg-mx-teal-light text-mx-teal">
                    {decorativeIcon(icon)}
                  </span>
                )}
                <div className="min-w-0">
                  {title && <CardTitle className="text-[16px] font-bold text-inherit">{title}</CardTitle>}
                  {subtitle && (
                    <CardDescription className="mt-1 text-sm font-medium normal-case tracking-normal text-mx-muted">
                      {subtitle}
                    </CardDescription>
                  )}
                </div>
              </div>
              {actions}
            </div>
          </CardHeader>
        )}
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </MotionCard>
  )
}

const kpiToneVariants = cva(
  'rounded-[20px] border bg-white p-5 shadow-card transition-all duration-[120ms] hover:-translate-y-0.5 hover:shadow-card-hover',
  {
    variants: {
      tone: {
        neutral: 'border-mx-border text-mx-text',
        action: 'border-mx-action/20 text-mx-text',
        teal: 'border-mx-teal/20 text-mx-text',
        success: 'border-mx-success/20 text-mx-text',
        warning: 'border-mx-warning/20 text-mx-text',
        danger: 'border-mx-danger/20 text-mx-text',
      },
      active: {
        true: 'border-mx-action ring-2 ring-mx-action/10',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      active: false,
    },
  }
)

const kpiIconToneClasses = {
  neutral: 'bg-mx-bg text-mx-muted',
  action: 'bg-mx-action-light text-mx-action',
  teal: 'bg-mx-teal-light text-mx-teal',
  success: 'bg-mx-success-light text-mx-success',
  warning: 'bg-mx-warning-light text-mx-warning',
  danger: 'bg-mx-danger-light text-mx-danger',
}

export type KpiCardProps = VariantProps<typeof kpiToneVariants> & {
  label: string
  value: string | number
  sublabel?: string
  icon?: ReactNode
  progress?: number
  onClick?: () => void
  className?: string
  children?: ReactNode
}

export function KpiCard({ label, value, sublabel, icon, tone, progress, active, onClick, className, children }: KpiCardProps) {
  const Component = onClick ? 'button' : 'article'
  return (
    <MotionCard>
      <Component
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        className={cn(kpiToneVariants({ tone, active }), onClick && 'w-full text-left', className)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wide text-mx-muted">{label}</div>
            <div className="mt-2 text-[28px] font-extrabold leading-none tracking-tight text-mx-text tabular-nums">
              {value}
            </div>
          </div>
          {icon && (
            <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', kpiIconToneClasses[tone ?? 'neutral'])}>
              {decorativeIcon(icon)}
            </span>
          )}
        </div>
        {typeof progress === 'number' && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-mx-divider">
            <div className="h-full rounded-full bg-mx-action" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        )}
        {sublabel && <p className="mt-3 text-sm text-mx-muted">{sublabel}</p>}
        {children && <div className="mt-3">{children}</div>}
      </Component>
    </MotionCard>
  )
}

export type SegmentedControlOption = {
  label: string
  value: string
}

export type SegmentedControlProps = {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn('inline-flex h-10 rounded-full border border-mx-border bg-white p-1', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-4 text-sm font-bold text-mx-muted transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action',
              active && 'bg-mx-action text-white'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const statusToneByLabel: Record<string, StatusTone> = {
  quente: 'danger',
  morno: 'warning',
  frio: 'action',
  vendido: 'success',
  'em negociação': 'action',
  perdido: 'danger',
  pendente: 'warning',
  resolvida: 'success',
  reagendada: 'action',
  cancelada: 'danger',
  concluída: 'success',
  concluida: 'success',
  preparando: 'neutral',
  'enviando mensagens': 'action',
  'aguardando respostas': 'warning',
}

type StatusTone = 'success' | 'warning' | 'danger' | 'action' | 'neutral' | 'teal'

const statusPillVariants = cva(
  'inline-flex items-center rounded-full border font-bold uppercase leading-none',
  {
    variants: {
      tone: {
        neutral: 'border-mx-border bg-mx-bg text-mx-muted',
        action: 'border-mx-action/20 bg-mx-action-light text-mx-action',
        success: 'border-mx-success/20 bg-mx-success-light text-mx-success',
        warning: 'border-mx-warning/30 bg-mx-warning-light text-amber-700',
        danger: 'border-mx-danger/25 bg-mx-danger-light text-mx-danger',
        teal: 'border-mx-teal/20 bg-mx-teal-soft text-mx-teal',
      },
      size: {
        sm: 'min-h-6 px-2 text-[10px]',
        md: 'min-h-7 px-3 text-[11px]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
    },
  }
)

export type StatusPillProps = {
  status: string
  tone?: StatusTone
  size?: 'sm' | 'md'
  className?: string
}

export function StatusPill({ status, tone, size, className }: StatusPillProps) {
  const mappedTone = tone ?? statusToneByLabel[status.toLowerCase()] ?? 'neutral'
  return <span className={cn(statusPillVariants({ tone: mappedTone, size }), className)}>{status}</span>
}

type PriorityTone = 'danger' | 'warning' | 'action' | 'neutral'

const priorityToneByLabel: Record<string, PriorityTone> = {
  máxima: 'danger',
  maxima: 'danger',
  alta: 'warning',
  média: 'warning',
  media: 'warning',
  baixa: 'neutral',
  hoje: 'action',
  amanhã: 'neutral',
  amanha: 'neutral',
  vencido: 'danger',
}

const priorityBadgeVariants = cva(
  'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase leading-none',
  {
    variants: {
      tone: {
        neutral: 'border-mx-border bg-mx-bg text-mx-muted',
        action: 'border-mx-action/20 bg-mx-action-light text-mx-action',
        warning: 'border-mx-warning/30 bg-mx-warning-light text-amber-700',
        danger: 'border-mx-danger/25 bg-mx-danger-light text-mx-danger',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
)

const priorityIcons = {
  neutral: MinusCircle,
  action: Info,
  warning: TriangleAlert,
  danger: AlertCircle,
}

export type PriorityBadgeProps = {
  priority: string
  tone?: PriorityTone
  className?: string
}

export function PriorityBadge({ priority, tone, className }: PriorityBadgeProps) {
  const mappedTone = tone ?? priorityToneByLabel[priority.toLowerCase()] ?? 'neutral'
  const Icon = priorityIcons[mappedTone]
  return (
    <span className={cn(priorityBadgeVariants({ tone: mappedTone }), className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {priority}
    </span>
  )
}

export type EmptyStateProps = {
  icon: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  tone?: 'action' | 'teal' | 'neutral'
  className?: string
}

export function EmptyState({ icon, title, description, actions, tone = 'neutral', className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-[24px] border border-mx-border bg-white px-6 py-10 text-center shadow-card', className)}>
      <div
        className={cn(
          'mx-auto grid h-12 w-12 place-items-center rounded-full',
          tone === 'action' && 'bg-mx-action-light text-mx-action',
          tone === 'teal' && 'bg-mx-teal-light text-mx-teal',
          tone === 'neutral' && 'bg-mx-bg text-mx-muted'
        )}
      >
        {decorativeIcon(icon)}
      </div>
      <h3 className="mt-4 text-[16px] font-bold text-mx-text">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-mx-muted">{description}</p>}
      {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <Skeleton className="h-20 w-full rounded-[24px]" />
      <SkeletonKpiGrid />
      <SkeletonTable />
    </div>
  )
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-[20px]" />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-[20px] border border-mx-border bg-white p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-[12px]" />
      ))}
    </div>
  )
}

export function SkeletonClientList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-24 rounded-[20px]" />
      ))}
    </div>
  )
}

export function SkeletonForm({ fields = 6 }: { fields?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: fields }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-[16px]" />
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return <Skeleton className="h-72 rounded-[24px]" />
}

export function DataTable<T extends { id: string | number }>(props: DataGridProps<T>) {
  return <DataGrid {...props} />
}

export type ClientActionRowProps = {
  name: string
  origin?: string
  vehicle?: string
  priority: string
  status: string
  goal: string
  nextStep: string
  notes?: string
  onPrimaryAction?: () => void
  onOpenProfile?: () => void
}

export function ClientActionRow({
  name,
  origin,
  vehicle,
  priority,
  status,
  goal,
  nextStep,
  notes,
  onPrimaryAction,
  onOpenProfile,
}: ClientActionRowProps) {
  return (
    <MotionRow className="rounded-[20px] border border-mx-border bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mx-action-light text-sm font-extrabold text-mx-action">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold text-mx-text">{name}</div>
            <div className="mt-1 truncate text-sm text-mx-muted">
              {[origin, vehicle].filter(Boolean).join(' - ')}
            </div>
            {notes && <div className="mt-2 line-clamp-2 text-sm text-mx-muted">{notes}</div>}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
          <PriorityBadge priority={priority} />
          <StatusPill status={status} />
          <div className="truncate text-sm font-medium text-mx-text" title={goal}>
            {goal}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button type="button" variant="primary" onClick={onPrimaryAction}>
            {nextStep}
          </Button>
          <Button type="button" variant="outline" onClick={onOpenProfile}>
            Abrir ficha
          </Button>
        </div>
      </div>
    </MotionRow>
  )
}

export type RoutineStepCardProps = {
  icon: ReactNode
  time: string
  title: string
  description?: string
  state?: 'future' | 'current' | 'done' | 'late'
  onClick?: () => void
}

export function RoutineStepCard({ icon, time, title, description, state = 'future', onClick }: RoutineStepCardProps) {
  return (
    <MotionCard>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-4 rounded-[20px] border bg-white p-5 text-left shadow-card transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mx-action',
          state === 'future' && 'border-mx-border',
          state === 'current' && 'border-mx-action',
          state === 'done' && 'border-mx-success/30 opacity-85',
          state === 'late' && 'border-mx-warning'
        )}
      >
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mx-bg text-mx-muted',
            state === 'current' && 'bg-mx-action-light text-mx-action',
            state === 'done' && 'bg-mx-success-light text-mx-success',
            state === 'late' && 'bg-mx-warning-light text-amber-700'
          )}
        >
          {decorativeIcon(icon)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={state === 'current' ? 'AGORA' : time} tone={state === 'current' ? 'action' : 'neutral'} size="sm" />
            <div className="truncate text-[15px] font-bold text-mx-text">{title}</div>
          </div>
          {description && <p className="mt-1 line-clamp-2 text-sm text-mx-muted">{description}</p>}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-mx-muted" aria-hidden="true" />
      </button>
    </MotionCard>
  )
}

export type TimelineItem = {
  label: string
  active?: boolean
  done?: boolean
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="flex gap-4 overflow-x-auto md:block md:space-y-4">
      {items.map((item, index) => (
        <li key={`${item.label}-${index}`} className="flex min-w-max items-center gap-3 md:min-w-0">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full bg-mx-subtle',
              item.done && 'bg-mx-success',
              item.active && 'h-4 w-4 bg-mx-action'
            )}
          />
          <span className={cn('text-sm text-mx-muted', item.active && 'font-bold text-mx-dark')}>{item.label}</span>
        </li>
      ))}
    </ol>
  )
}

export type FunnelChannelCardProps = {
  channel: 'Internet' | 'Carteira' | 'Porta'
  steps: Array<{ label: string; value: number; tone?: StatusTone }>
  insight: string
}

const channelIcons = {
  Internet: Globe,
  Carteira: Users,
  Porta: DoorOpen,
}

export function FunnelChannelCard({ channel, steps, insight }: FunnelChannelCardProps) {
  const Icon = channelIcons[channel]
  const mainMetric = steps[steps.length - 1]?.value ?? 0
  return (
    <SurfaceCard title={channel} icon={<Icon size={18} />}>
      <div className="text-[32px] font-extrabold tracking-tight text-mx-text tabular-nums">{mainMetric}%</div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`} className="flex items-center gap-2">
            <StatusPill status={`${step.label}: ${step.value}%`} tone={step.tone ?? 'action'} />
            {index < steps.length - 1 && <ChevronRight className="h-4 w-4 text-mx-muted" aria-hidden="true" />}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-mx-muted">{insight}</p>
    </SurfaceCard>
  )
}

export type FormSectionCardProps = {
  title: string
  icon: ReactNode
  columns?: 1 | 2
  children: ReactNode
  className?: string
}

export function FormSectionCard({ title, icon, columns = 2, children, className }: FormSectionCardProps) {
  return (
    <Card className={cn('rounded-[24px] border border-mx-border bg-white shadow-card', className)}>
      <CardHeader className="border-b border-mx-divider p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[16px] bg-mx-teal-light text-mx-teal">
            {decorativeIcon(icon)}
          </span>
          <CardTitle className="text-[16px] font-bold text-mx-text">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className={cn('grid gap-4 p-6', columns === 2 && 'md:grid-cols-2')}>{children}</CardContent>
    </Card>
  )
}

export function MotionStagger({ children, className }: { children: ReactNode; className?: string }) {
  return <MotionList className={className}>{children}</MotionList>
}

export const DesignSystemReadyIcon = CheckCircle2
export const PriorityIcon = Flame
export const RoutineTimeIcon = Clock
