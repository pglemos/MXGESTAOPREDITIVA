import type { ElementType, HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

type ModulePageProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  maxWidth?: 'full' | '7xl'
  id?: string
}

const toneStyles: Record<Tone, { icon: string; surface: string; text: string; banner: string }> = {
  brand: {
    icon: 'bg-accent-blue-soft text-brand-primary',
    surface: 'border-brand-primary/20',
    text: 'text-brand-primary',
    banner: 'border-brand-primary/20 bg-brand-primary/5 text-brand-primary',
  },
  success: {
    icon: 'bg-status-success-surface text-status-success',
    surface: 'border-status-success/20',
    text: 'text-status-success',
    banner: 'border-status-success/20 bg-status-success-surface text-status-success',
  },
  warning: {
    icon: 'bg-status-warning-surface text-status-warning',
    surface: 'border-status-warning/20',
    text: 'text-status-warning',
    banner: 'border-status-warning/20 bg-status-warning-surface text-status-warning',
  },
  danger: {
    icon: 'bg-status-error-surface text-status-error',
    surface: 'border-status-error/20',
    text: 'text-status-error',
    banner: 'border-status-error/20 bg-status-error-surface text-status-error',
  },
  info: {
    icon: 'bg-status-info-surface text-status-info',
    surface: 'border-status-info/20',
    text: 'text-status-info',
    banner: 'border-status-info/20 bg-status-info-surface text-status-info',
  },
  neutral: {
    icon: 'bg-surface-alt text-text-secondary',
    surface: 'border-border-subtle',
    text: 'text-text-secondary',
    banner: 'border-border-subtle bg-surface-alt text-text-secondary',
  },
}

export function MxModulePage({
  children,
  className,
  contentClassName,
  maxWidth = '7xl',
  id = 'main-content',
}: ModulePageProps) {
  return (
    <main
      id={id}
      className={cn(
        'min-h-full w-full overflow-y-auto bg-surface-alt px-mx-sm py-mx-md sm:px-mx-md lg:px-mx-lg',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-mx-md pb-mx-20',
          maxWidth === '7xl' ? 'max-w-7xl' : 'max-w-none',
          contentClassName,
        )}
      >
        {children}
      </div>
    </main>
  )
}

export function MxModuleHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-mx-md rounded-mx-xl border border-border-subtle bg-white p-mx-md shadow-mx-sm lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? (
          <Typography variant="tiny" tone="brand" className="mb-mx-xs block font-bold uppercase tracking-mx-wide">
            {eyebrow}
          </Typography>
        ) : null}
        <Typography as="h1" variant="h2" className="text-xl font-bold text-text-primary md:text-2xl">
          {title}
        </Typography>
        {description ? (
          <Typography variant="p" className="mt-mx-xs max-w-3xl text-sm text-text-secondary">
            {description}
          </Typography>
        ) : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-mx-sm">{actions}</div> : null}
    </header>
  )
}

export function MxMetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'brand',
  actionLabel,
  onAction,
  children,
  className,
}: {
  title: string
  value: string | number
  detail: string
  icon: LucideIcon
  tone?: Tone
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
  className?: string
}) {
  const styles = toneStyles[tone]
  return (
    <Card
      className={cn(
        'group flex min-h-mx-32 flex-col overflow-hidden rounded-mx-xl border bg-white p-mx-md shadow-mx-sm sm:min-h-mx-40',
        styles.surface,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0">
          <Typography variant="h3" className="text-sm normal-case tracking-normal">
            {title}
          </Typography>
          <Typography variant="tiny" tone="muted" className="mt-1 block normal-case tracking-normal">
            {detail}
          </Typography>
        </div>
        <span className={cn('grid h-mx-10 w-mx-10 shrink-0 place-items-center rounded-mx-lg', styles.icon)}>
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-mx-sm flex flex-1 items-end justify-between gap-mx-sm sm:mt-mx-md">
        <Typography variant="h2" className={cn('text-3xl leading-none', styles.text)}>
          {value}
        </Typography>
        {children}
      </div>
      {actionLabel && onAction ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-mx-sm min-h-11 w-full justify-between px-0 text-brand-primary"
          onClick={onAction}
        >
          {actionLabel}<span aria-hidden="true">→</span>
        </Button>
      ) : null}
    </Card>
  )
}

export function MxStatusGauge({
  value,
  label,
  ariaLabel,
  showLabel = true,
}: {
  value: number
  label: string
  ariaLabel: string
  showLabel?: boolean
}) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      className="grid h-mx-20 w-mx-20 shrink-0 place-items-center rounded-full bg-border-subtle"
      style={{ background: `conic-gradient(var(--color-brand-primary) ${normalized * 3.6}deg, var(--color-border-subtle) 0deg)` }}
    >
      <div className="grid h-mx-14 w-mx-14 place-items-center rounded-full bg-white text-center">
        <strong className="text-base leading-none text-text-primary">{normalized}%</strong>
        {showLabel ? <span className="max-w-mx-12 text-[9px] font-semibold leading-tight text-text-secondary">{label}</span> : null}
      </div>
    </div>
  )
}

export function MxSectionCard({
  as: Component = 'section',
  children,
  className,
  ...props
}: {
  as?: ElementType
  children: ReactNode
  className?: string
} & HTMLAttributes<HTMLElement>) {
  return (
    <Component
      className={cn('overflow-hidden rounded-mx-xl border border-border-subtle bg-white shadow-mx-sm', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export function MxToolbar({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'flex flex-col gap-mx-sm rounded-mx-xl border border-border-subtle bg-white p-mx-sm shadow-mx-sm sm:flex-row sm:flex-wrap sm:items-center',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export function MxField({
  label,
  hint,
  children,
  className,
  ...props
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
} & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-mx-xs', className)} {...props}>
      <Typography as="span" variant="caption" className="font-semibold text-text-secondary">
        {label}
      </Typography>
      {children}
      {hint ? <Typography variant="tiny" tone="muted">{hint}</Typography> : null}
    </label>
  )
}

export function MxTableSurface({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('w-full overflow-x-auto rounded-mx-xl border border-border-subtle bg-white', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function MxEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex min-h-mx-48 flex-col items-center justify-center px-mx-md py-mx-xl text-center', className)}>
      <span className="grid h-mx-14 w-mx-14 place-items-center rounded-mx-xl bg-surface-alt text-text-tertiary">
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <Typography variant="h3" className="mt-mx-md text-base">{title}</Typography>
      {description ? <Typography variant="p" className="mt-mx-xs max-w-md text-sm">{description}</Typography> : null}
      {action ? <div className="mt-mx-md">{action}</div> : null}
    </div>
  )
}

export function MxLoadingState({
  label = 'Carregando',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn('flex min-h-mx-48 flex-col items-center justify-center gap-mx-sm text-text-secondary', className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <LoaderCircle className="animate-spin text-brand-primary" size={28} aria-hidden="true" />
      <Typography variant="caption" className="font-semibold">{label}</Typography>
    </div>
  )
}

export function MxStatusBanner({
  tone = 'neutral',
  children,
  className,
  ...props
}: {
  tone?: Tone
  children: ReactNode
  className?: string
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-mx-lg border px-mx-md py-mx-sm text-sm font-medium', toneStyles[tone].banner, className)}
      role={tone === 'danger' ? 'alert' : 'status'}
      {...props}
    >
      {children}
    </div>
  )
}
