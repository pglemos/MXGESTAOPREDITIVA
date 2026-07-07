import type { ReactNode } from 'react'
import { Bell, CalendarDays, CircleHelp, Filter, Search } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { chartTokens } from '@/lib/charts/tokens'
import { cn } from '@/lib/utils'
import { toneClasses, toneHex, vividIconClasses, type KpiTone } from './types'
import { greeting, scoreStatus } from './format'

export function OwnerCockpitHeader({
  name,
  periodLabel,
  alertCount,
  storeName,
}: {
  name: string
  periodLabel: string
  alertCount: number
  storeName: string
}) {
  return (
    <div className="flex flex-col gap-mx-md lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Typography variant="h1" className="text-3xl md:text-4xl font-black text-text-primary">
          {greeting()}, {name.split(' ')[0]}!
        </Typography>
        <Typography variant="p" tone="muted" className="mt-1 text-base font-bold">
          Aqui está o panorama da sua loja hoje.
        </Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase">
          {storeName}
        </Typography>
      </div>

      <div className="flex flex-wrap items-center gap-mx-sm">
        <Button type="button" variant="outline" className="h-mx-11 rounded-mx-xl bg-white">
          <Filter size={16} />
          Filtros
        </Button>
        <div className="h-mx-11 rounded-mx-xl border border-border-default bg-white px-mx-md shadow-mx-sm flex items-center gap-mx-sm">
          <Typography variant="tiny" tone="muted" className="font-black uppercase">Período:</Typography>
          <Typography variant="tiny" className="font-black">{periodLabel}</Typography>
          <CalendarDays size={16} className="text-text-tertiary" />
        </div>
        <button
          type="button"
          className="relative h-mx-11 w-mx-11 rounded-mx-xl border border-border-default bg-white text-text-primary shadow-mx-sm flex items-center justify-center"
          aria-label={`${alertCount} alertas importantes`}
        >
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-mx-6 h-mx-6 rounded-mx-full bg-status-error px-1 text-white text-mx-micro font-black flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className="h-mx-11 w-mx-11 rounded-mx-xl border border-border-default bg-white text-text-primary shadow-mx-sm flex items-center justify-center"
          aria-label="Ajuda da visão do dono"
        >
          <CircleHelp size={20} />
        </button>
      </div>
    </div>
  )
}

export function OwnerKpiCard({
  title,
  value,
  detail,
  icon,
  tone,
  chart = 'line',
  seed,
}: {
  title: string
  value: string
  detail: string
  icon: ReactNode
  tone: KpiTone
  /** 'line' = sparkline curva com gradient | 'bars' = mini bar chart */
  chart?: 'line' | 'bars'
  /** Seed para variar o shape do sparkline entre cards do mesmo tone */
  seed?: number
}) {
  const classes = toneClasses[tone]
  const vivid = vividIconClasses[tone]
  return (
    <Card className="min-h-[140px] rounded-mx-2xl bg-white p-mx-md shadow-mx-sm border-none">
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0 flex-1">
          <Typography variant="p" className={cn('block text-sm font-black', classes.text)}>
            {title}
          </Typography>
          <Typography variant="h2" className="mt-mx-xs text-3xl md:text-4xl font-black tabular-nums text-text-primary leading-none">
            {value}
          </Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black">
            {detail}
          </Typography>
        </div>
        <div className={cn('h-mx-10 w-mx-10 rounded-mx-full flex shrink-0 items-center justify-center shadow-mx-sm', vivid)}>
          {icon}
        </div>
      </div>
      <Sparkline tone={tone} variant={chart} seed={seed} />
    </Card>
  )
}

function Sparkline({ tone, variant = 'line', seed = 0 }: { tone: KpiTone; variant?: 'line' | 'bars'; seed?: number }) {
  const color = toneHex[tone]()
  const gradId = `mx-spark-${tone}-${seed}-${variant}`
  if (variant === 'bars') {
    const heights = [12, 18, 14, 22, 16, 24, 20, 28, 18, 30, 24, 32]
    const max = Math.max(...heights)
    return (
      <svg viewBox="0 0 120 36" width="100%" height="42" preserveAspectRatio="none" aria-hidden="true" className="mt-mx-md">
        {heights.map((h, i) => {
          const x = i * (120 / heights.length)
          const w = (120 / heights.length) - 2
          const barH = (h / max) * 32
          const y = 36 - barH
          return <rect key={i} x={x} y={y} width={w} height={barH} fill={color} rx={1.5} opacity={0.85} />
        })}
      </svg>
    )
  }
  // Line sparkline with gradient fill below
  // Simple pseudo-random varied curve seeded by `seed`
  const points = Array.from({ length: 12 }, (_, i) => {
    const base = 14 + Math.sin((i + seed) * 0.9) * 6 + Math.cos((i + seed) * 0.4) * 4
    return Math.max(4, Math.min(28, base + (seed % 2 ? i * 0.7 : -i * 0.3)))
  })
  const path = points.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * 120} ${32 - y}`).join(' ')
  const area = `${path} L 120 36 L 0 36 Z`
  return (
    <svg viewBox="0 0 120 36" width="100%" height="42" preserveAspectRatio="none" aria-hidden="true" className="mt-mx-md">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={120} cy={32 - points[points.length - 1]} r={2.5} fill={color} />
    </svg>
  )
}

export function MXScoreCompact({ score }: { score: number | null }) {
  const safeScore = Math.min(Math.max(Math.round(score ?? 0), 0), 100)
  const status = scoreStatus(score)
  const statusColor = safeScore >= 75 ? 'text-status-success' : safeScore >= 60 ? 'text-status-warning' : 'text-status-error'
  // Semicircular pointer angle (mockup): 180deg (left, score=0) → 0deg (right, score=100)
  const cx = 70
  const cy = 70
  const radius = 58
  const strokeWidth = 12
  const pointerAngleDeg = 180 - (safeScore / 100) * 180
  const pointerRad = (pointerAngleDeg * Math.PI) / 180
  const pointerX = cx + (radius - strokeWidth / 2) * Math.cos(pointerRad)
  const pointerY = cy - (radius - strokeWidth / 2) * Math.sin(pointerRad)
  return (
    <Card className="min-h-[140px] rounded-mx-2xl p-mx-md text-white" style={{ background: 'linear-gradient(160deg, var(--color-sidebar-bg) 0%, var(--color-sidebar-bg-strong) 100%)', border: 'none' }}>
      <div className="flex items-center justify-between">
        <Typography variant="tiny" tone="white" className="font-black uppercase tracking-widest opacity-90">
          MX Score da Loja
        </Typography>
        <CircleHelp size={14} className="text-white/50" />
      </div>
      <div className="mt-mx-sm flex flex-col items-center">
        <svg viewBox="0 0 140 85" width="140" height="85" role="img" aria-label={`MX Score ${safeScore}: ${status}`}>
          <defs>
            <linearGradient id="owner-mx-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={chartTokens.danger()} />
              <stop offset="50%" stopColor={chartTokens.warning()} />
              <stop offset="100%" stopColor={chartTokens.success()} />
            </linearGradient>
          </defs>
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#owner-mx-gauge-grad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle cx={pointerX} cy={pointerY} r={5} fill="var(--color-pure-white)" />
          <circle cx={pointerX} cy={pointerY} r={2.5} fill="var(--color-sidebar-bg)" />
        </svg>
        <div className="-mt-mx-sm flex flex-col items-center">
          <div className="text-3xl font-black font-mono-numbers leading-none">{score ?? '--'}</div>
          <Typography variant="tiny" className={cn('mt-mx-tiny block font-black uppercase tracking-widest', statusColor)}>{status}</Typography>
        </div>
      </div>
      <Typography variant="tiny" tone="white" className="mt-mx-xs block text-center opacity-75 normal-case tracking-normal">
        ▲ Score automático
      </Typography>
    </Card>
  )
}

export function MetricPill({ label, value, tone }: { label: string; value: string; tone: KpiTone }) {
  const classes = toneClasses[tone]
  return (
    <div className={cn('rounded-mx-xl border p-mx-sm text-center', classes.soft)}>
      <Typography variant="tiny" className="block font-black">{label}</Typography>
      <div className="mt-mx-xs text-2xl font-black tabular-nums">{value}</div>
    </div>
  )
}

export function OwnerSemiGauge({ value }: { value: number }) {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100)
  const cx = 50
  const cy = 50
  const radius = 40
  const strokeWidth = 9
  const pointerAngleDeg = 180 - (clamped / 100) * 180
  const pointerRad = (pointerAngleDeg * Math.PI) / 180
  const pointerX = cx + (radius - strokeWidth / 2) * Math.cos(pointerRad)
  const pointerY = cy - (radius - strokeWidth / 2) * Math.sin(pointerRad)
  return (
    <svg viewBox="0 0 100 60" width="100" height="60" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="owner-dept-gauge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={chartTokens.danger()} />
          <stop offset="50%" stopColor={chartTokens.warning()} />
          <stop offset="100%" stopColor={chartTokens.success()} />
        </linearGradient>
      </defs>
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="url(#owner-dept-gauge)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <circle cx={pointerX} cy={pointerY} r={4} fill="var(--color-mx-black)" />
      <circle cx={pointerX} cy={pointerY} r={2} fill="var(--color-pure-white)" />
    </svg>
  )
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <Typography variant="h2" className="text-2xl md:text-3xl font-black text-text-primary">{title}</Typography>
      <Typography variant="p" tone="muted" className="mt-1 font-bold">{subtitle}</Typography>
    </div>
  )
}

export function SideList({ title, items, className }: { title: string; items: string[]; className?: string }) {
  return (
    <Card className={cn('rounded-mx-2xl p-mx-lg', className)}>
      <Typography variant="h3" className="text-lg font-black">{title}</Typography>
      <div className="mt-mx-md space-y-mx-sm">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-mx-sm">
            <span className="flex h-mx-7 w-mx-7 shrink-0 items-center justify-center rounded-mx-full bg-mx-indigo-50 text-xs font-black text-brand-primary">{index + 1}</span>
            <Typography variant="p" className="text-sm font-bold">{item}</Typography>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ToolbarPlaceholder({ searchPlaceholder }: { searchPlaceholder: string }) {
  return (
    <div className="flex flex-col gap-mx-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="grid grid-cols-1 gap-mx-sm sm:grid-cols-4">
        {['Todos os departamentos', 'Todas as origens', 'Todos os status', 'Todas as prioridades'].map(label => (
          <button key={label} type="button" className="h-mx-10 rounded-mx-lg border border-border-default bg-white px-mx-sm text-left text-xs font-black text-text-secondary">
            {label}
          </button>
        ))}
      </div>
      <label className="relative min-w-0 lg:w-[320px]">
        <span className="sr-only">{searchPlaceholder}</span>
        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input className="h-mx-10 w-full rounded-mx-lg border border-border-default bg-white pl-mx-xl pr-mx-sm text-sm font-bold outline-none focus:border-brand-primary" placeholder={searchPlaceholder} />
      </label>
    </div>
  )
}

export function SummaryCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string
  value: string | number
  detail: string
  icon: ReactNode
  tone: KpiTone
}) {
  const classes = toneClasses[tone]
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="flex items-start gap-mx-sm">
        <span className={cn('h-mx-12 w-mx-12 rounded-mx-xl flex shrink-0 items-center justify-center', classes.bg)}>{icon}</span>
        <div>
          <Typography variant="p" className="font-black">{title}</Typography>
          <div className={cn('mt-mx-xs text-3xl font-black tabular-nums', classes.text)}>{value}</div>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold">{detail}</Typography>
        </div>
      </div>
    </Card>
  )
}
