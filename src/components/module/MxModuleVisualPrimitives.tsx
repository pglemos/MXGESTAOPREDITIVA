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

type ToneStyle = {
  icon: string
  surface: string
  value: string
  banner: string
  progress: string
}

const toneStyles: Record<Tone, ToneStyle> = {
  brand: {
    icon: 'bg-emerald-50 text-emerald-600',
    surface: 'border-gray-100',
    value: 'text-emerald-700',
    banner: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    progress: 'bg-emerald-600',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-600',
    surface: 'border-gray-100',
    value: 'text-emerald-700',
    banner: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    progress: 'bg-emerald-600',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600',
    surface: 'border-amber-200',
    value: 'text-amber-600',
    banner: 'border-amber-200 bg-amber-50 text-amber-800',
    progress: 'bg-amber-500',
  },
  danger: {
    icon: 'bg-red-50 text-red-600',
    surface: 'border-red-200',
    value: 'text-red-600',
    banner: 'border-red-200 bg-red-50 text-red-700',
    progress: 'bg-red-500',
  },
  info: {
    icon: 'bg-blue-50 text-blue-600',
    surface: 'border-blue-200',
    value: 'text-blue-600',
    banner: 'border-blue-200 bg-blue-50 text-blue-700',
    progress: 'bg-blue-500',
  },
  neutral: {
    icon: 'bg-gray-50 text-gray-500',
    surface: 'border-gray-100',
    value: 'text-gray-800',
    banner: 'border-gray-200 bg-gray-50 text-gray-700',
    progress: 'bg-gray-400',
  },
}

export function MxModulePage({
  children,
  className,
  contentClassName,
  maxWidth = '7xl',
  id,
}: ModulePageProps) {
  return (
    <main
      id={id}
      className={cn(
        'min-h-full w-full overflow-y-auto bg-gray-50 text-gray-800',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full space-y-5 px-4 py-6 pb-24',
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
        'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? (
            <Typography
              variant="tiny"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-emerald-700"
            >
              {eyebrow}
            </Typography>
          ) : null}
          <Typography
            as="h1"
            variant="h2"
            className="text-xl font-bold text-gray-800 md:text-2xl"
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="p"
              className="mt-1 max-w-3xl text-sm leading-6 text-gray-500"
            >
              {description}
            </Typography>
          ) : null}
        </div>
        {actions ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
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
        'group flex min-h-40 flex-col rounded-2xl border bg-white p-4 shadow-sm',
        styles.surface,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography
            variant="h3"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            {title}
          </Typography>
          <Typography
            variant="tiny"
            className="mt-2 block text-sm font-medium normal-case tracking-normal text-gray-500"
          >
            {detail}
          </Typography>
        </div>
        <span
          className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            styles.icon,
          )}
        >
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <div className="mt-4 flex flex-1 items-end justify-between gap-3">
        <Typography
          variant="h2"
          className={cn('text-3xl font-bold leading-none', styles.value)}
        >
          {value}
        </Typography>
        {children}
      </div>
      {actionLabel && onAction ? (
        <Button
          variant="managerGhost"
          size="sm"
          className="mt-3 min-h-10 w-full justify-between px-0 text-emerald-700"
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
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gray-100"
      style={{
        background: `conic-gradient(var(--color-emerald-600) ${normalized * 3.6}deg, var(--color-gray-100) 0deg)`,
      }}
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center">
        <strong className="text-base leading-none text-gray-800">{normalized}%</strong>
        {showLabel ? (
          <span className="max-w-12 text-[9px] font-semibold leading-tight text-gray-500">
            {label}
          </span>
        ) : null}
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
      className={cn(
        'overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function MxToolbar({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center',
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
    <label className={cn('flex min-w-0 flex-col gap-2', className)} {...props}>
      <Typography
        as="span"
        variant="caption"
        className="font-semibold text-gray-600"
      >
        {label}
      </Typography>
      {children}
      {hint ? (
        <Typography variant="tiny" className="text-gray-500">
          {hint}
        </Typography>
      ) : null}
    </label>
  )
}

export function MxTableSurface({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-2xl border border-gray-100 bg-white',
        className,
      )}
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
    <div
      className={cn(
        'flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center',
        className,
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gray-50 text-gray-400">
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <Typography variant="h3" className="mt-4 text-base text-gray-800">
        {title}
      </Typography>
      {description ? (
        <Typography
          variant="p"
          className="mt-2 max-w-md text-sm leading-6 text-gray-500"
        >
          {description}
        </Typography>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
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
      className={cn(
        'flex min-h-48 flex-col items-center justify-center gap-3 text-gray-500',
        className,
      )}
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <LoaderCircle className="animate-spin text-emerald-600" size={28} aria-hidden="true" />
      <Typography variant="caption" className="font-semibold text-gray-500">
        {label}
      </Typography>
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
      className={cn(
        'rounded-xl border px-4 py-3 text-sm font-medium',
        toneStyles[tone].banner,
        className,
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
      {...props}
    >
      {children}
    </div>
  )
}
