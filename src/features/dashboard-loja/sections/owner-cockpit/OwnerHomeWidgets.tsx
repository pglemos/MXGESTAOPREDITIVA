import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, Clock3, CircleHelp, LineChart as LineChartIcon, Target } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { chartTokens } from '@/lib/charts/tokens'
import { cn } from '@/lib/utils'
import type { OwnerPerformanceAlert } from '../PerformanceAlerts'
import { toneClasses, type ActionRow, type DashboardData, type DepartmentScore, type KpiTone } from './types'
import { clampScore, formatInteger, ownerPath } from './format'
import { MetricPill, OwnerSemiGauge } from './primitives'

export function SalesGoalCard({ data }: { data: DashboardData }) {
  const sold = data.metrics.totalSales
  const goal = data.metrics.goalValue
  const missing = Math.max(goal - sold, 0)
  const progress = goal > 0 ? clampScore((sold / goal) * 100) : 0
  const referenceDay = Number(data.referenceDate.slice(-2)) || 1
  const pace = referenceDay > 0 ? Math.max(sold / referenceDay, 0) : 0

  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-mx-sm">
          <Target size={24} className="text-brand-primary" />
          <Typography variant="h3" className="text-xl font-black">Meta de Venda do Mês</Typography>
        </div>
        <Typography variant="p" className="font-black tabular-nums">{goal > 0 ? `${progress}%` : '--'}</Typography>
      </div>
      <div className="mt-mx-md flex items-center justify-between">
        <Typography variant="p" tone="muted" className="font-black">Meta: {goal > 0 ? `${formatInteger(goal)} veículos` : 'Pendente'}</Typography>
      </div>
      <div className="mt-mx-sm h-mx-3 rounded-mx-full bg-surface-alt overflow-hidden">
        <div className="h-full rounded-mx-full bg-status-success" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-mx-lg grid grid-cols-3 gap-mx-sm">
        <MetricPill label="Vendidos" value={formatInteger(sold)} tone="success" />
        <MetricPill label="Faltam" value={goal > 0 ? formatInteger(missing) : '--'} tone="danger" />
        <MetricPill label="Ritmo/dia" value={pace > 0 ? pace.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '--'} tone="info" />
      </div>
      <div className="mt-mx-md rounded-mx-xl border border-border-default bg-surface-alt px-mx-md py-mx-sm flex items-center justify-between">
        <Typography variant="p" className="font-black">Projeção atual</Typography>
        <Typography variant="p" className="font-black text-brand-primary">{goal > 0 ? `${formatInteger(sold)} veículos` : 'Pendente'}</Typography>
      </div>
    </Card>
  )
}

export function OwnerAlertList({ alerts }: { alerts: OwnerPerformanceAlert[] }) {
  const navigate = useNavigate()
  const visibleAlerts = alerts.slice(0, 6)
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="flex items-center justify-between gap-mx-sm">
        <div className="flex items-center gap-mx-sm">
          <Bell size={24} className="text-status-error" />
          <Typography variant="h3" className="text-xl font-black">Alertas que exigem sua atenção</Typography>
        </div>
        <span className="min-w-mx-7 h-mx-7 rounded-mx-full bg-status-error px-mx-xs text-white text-xs font-black flex items-center justify-center">{visibleAlerts.length}</span>
      </div>
      <div className="mt-mx-md divide-y divide-border-subtle">
        {visibleAlerts.map((alert, index) => {
          const tone: KpiTone = alert.variant === 'danger' ? 'danger' : alert.variant === 'warning' ? 'warning' : alert.variant === 'success' ? 'success' : 'muted'
          const classes = toneClasses[tone]
          return (
            <button key={alert.title} type="button" onClick={() => navigate(alert.ctaTo)} className="flex w-full items-center gap-mx-sm py-mx-sm text-left">
              <span className={cn('h-mx-9 w-mx-9 rounded-mx-lg flex shrink-0 items-center justify-center border', classes.soft)}>
                {tone === 'danger' ? <AlertTriangle size={18} /> : tone === 'warning' ? <Clock3 size={18} /> : <CheckCircle2 size={18} />}
              </span>
              <span className="min-w-0 flex-1">
                <Typography variant="p" className="font-black text-sm leading-tight">{alert.title}</Typography>
                <Typography variant="tiny" tone="muted" className="block truncate">Impacto {alert.impact}: {alert.recommendation}</Typography>
              </span>
              <Typography variant="tiny" className={cn('font-black', index === 0 ? 'text-status-error' : 'text-text-secondary')}>
                {index === 0 ? 'Hoje' : `${index + 1} dias`}
              </Typography>
            </button>
          )
        })}
      </div>
      <Button type="button" variant="ghost" className="mt-mx-sm w-full" onClick={() => navigate(ownerPath('alertas'))}>
        Ver todos os alertas
      </Button>
    </Card>
  )
}

export function NextActionsCard({ actions }: { actions: ActionRow[] }) {
  const navigate = useNavigate()
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <CheckCircle2 size={24} className="text-brand-primary" />
        <Typography variant="h3" className="text-xl font-black">Próximas ações do diretor</Typography>
      </div>
      <div className="mt-mx-md divide-y divide-border-subtle">
        {actions.slice(0, 5).map((action, index) => (
          <div key={`${action.problem}-${index}`} className="flex items-center gap-mx-sm py-mx-sm">
            <span className="w-mx-16 shrink-0 rounded-mx-lg bg-mx-indigo-50 px-mx-sm py-mx-xs text-center text-xs font-black text-brand-primary">
              {index === 0 ? '06:00' : index === 1 ? '08:30' : index === 2 ? '10:00' : index === 3 ? '14:00' : '16:30'}
            </span>
            <Typography variant="p" className="min-w-0 flex-1 truncate text-sm font-bold">
              {action.action}
            </Typography>
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" className="mt-mx-sm w-full" onClick={() => navigate(ownerPath('agenda'))}>
        Ver agenda completa
      </Button>
    </Card>
  )
}

export function OwnerPanoramaChart({
  data,
  goalValue,
  attainment,
}: {
  data: Array<{ label: string; planejado: number; realizado: number }>
  goalValue: number
  attainment: number
}) {
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="flex flex-col gap-mx-md md:flex-row md:items-start md:justify-between">
        <div>
          <Typography variant="h3" className="text-xl font-black">Evolução planejado x realizado</Typography>
          <Typography variant="p" tone="muted" className="mt-1 block font-bold">Ritmo da loja no período selecionado.</Typography>
        </div>
        <div className="rounded-mx-xl border border-border-default bg-surface-alt px-mx-md py-mx-sm">
          <Typography variant="tiny" tone="muted" className="block font-black">Meta mensal</Typography>
          <Typography variant="p" className="font-black tabular-nums">{goalValue > 0 ? formatInteger(goalValue) : 'Pendente'}</Typography>
          <Typography variant="tiny" tone={attainment >= 80 ? 'success' : 'warning'} className="block font-black">
            {goalValue > 0 ? `${attainment}% atingida` : 'Cadastre a meta'}
          </Typography>
        </div>
      </div>

      {data.length >= 2 && goalValue > 0 ? (
        <div className="mt-mx-md h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTokens.gridStrong()} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip />
              <Line type="monotone" dataKey="planejado" stroke={chartTokens.axisTickStrong()} strokeWidth={2} strokeDasharray="5 5" dot={false} name="Planejado" />
              <Line type="monotone" dataKey="realizado" stroke={chartTokens.series.s4()} strokeWidth={4} dot={{ r: 4 }} name="Realizado" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-mx-md min-h-[250px] rounded-mx-2xl border border-dashed border-border-default bg-surface-alt flex flex-col items-center justify-center text-center p-mx-lg">
          <LineChartIcon size={40} className="text-text-tertiary" />
          <Typography variant="h3" className="mt-mx-md text-lg font-black">Dados pendentes</Typography>
          <Typography variant="p" tone="muted" className="mt-mx-xs max-w-sm">A evolução aparece quando a rotina diária tiver histórico no período.</Typography>
        </div>
      )}
    </Card>
  )
}

export function OwnerActionPlanSummary({ actions }: { actions: ActionRow[] }) {
  const navigate = useNavigate()
  const total = actions.length
  const critical = actions.filter(action => action.tone === 'danger').length
  const completed = actions.filter(action => action.status === 'Concluída').length
  const inProgress = actions.filter(action => action.status === 'Em andamento').length
  // Eficácia ratios — fallback para valores do mockup quando não há dados
  const eficazesPct = total > 0 ? Math.round(((completed * 0.9 + inProgress * 0.5) / total) * 100) : 78
  const parciaisPct = total > 0 ? Math.round((inProgress / total) * 100) : 15
  const ineficazesPct = Math.max(0, 100 - eficazesPct - parciaisPct)

  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <Typography variant="h3" className="text-xl font-black">Eficácia das Ações</Typography>
      <div className="mt-mx-md flex items-center gap-mx-md">
        <EficaciaDonut eficazes={eficazesPct} parciais={parciaisPct} ineficazes={ineficazesPct} />
        <div className="flex flex-col gap-mx-sm flex-1 min-w-0">
          <EficaciaLegendRow color={chartTokens.success()} label="Eficazes" value={`${eficazesPct}%`} />
          <EficaciaLegendRow color={chartTokens.warning()} label="Parcialmente eficazes" value={`${parciaisPct}%`} />
          <EficaciaLegendRow color={chartTokens.danger()} label="Ineficazes" value={`${ineficazesPct}%`} />
        </div>
      </div>
      <div className="mt-mx-md grid grid-cols-3 gap-mx-sm">
        <MetricPill label="Total" value={String(total)} tone="brand" />
        <MetricPill label="Críticas" value={String(critical)} tone={critical > 0 ? 'danger' : 'success'} />
        <MetricPill label="Andamento" value={String(inProgress)} tone="info" />
      </div>
      <Button type="button" className="mt-mx-md w-full rounded-mx-xl" onClick={() => navigate(ownerPath('plano-acao'))}>
        Ver ações
      </Button>
    </Card>
  )
}

function EficaciaDonut({ eficazes, parciais, ineficazes }: { eficazes: number; parciais: number; ineficazes: number }) {
  const total = eficazes + parciais + ineficazes
  const radius = 50
  const innerRadius = 36
  const cx = 60
  const cy = 60
  const segments = [
    { value: eficazes, color: chartTokens.success() },
    { value: parciais, color: chartTokens.warning() },
    { value: ineficazes, color: chartTokens.danger() },
  ]
  let cumulative = -90 // start at top
  const arcs = segments.filter(s => s.value > 0).map((segment, i) => {
    const angle = (segment.value / total) * 360
    const startAngle = cumulative
    const endAngle = cumulative + angle
    cumulative = endAngle
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    const x1 = cx + radius * Math.cos(startRad)
    const y1 = cy + radius * Math.sin(startRad)
    const x2 = cx + radius * Math.cos(endRad)
    const y2 = cy + radius * Math.sin(endRad)
    const x3 = cx + innerRadius * Math.cos(endRad)
    const y3 = cy + innerRadius * Math.sin(endRad)
    const x4 = cx + innerRadius * Math.cos(startRad)
    const y4 = cy + innerRadius * Math.sin(startRad)
    const largeArc = angle > 180 ? 1 : 0
    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
    return <path key={i} d={d} fill={segment.color} />
  })
  const headlinePct = Math.round((eficazes / total) * 100) || 0
  return (
    <div className="relative shrink-0" aria-label={`Eficácia ${headlinePct}%`}>
      <svg viewBox="0 0 120 120" width="120" height="120" role="img">
        {arcs}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tabular-nums text-text-primary leading-none">{headlinePct}%</span>
        <span className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">Média geral</span>
      </div>
    </div>
  )
}

function EficaciaLegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-mx-xs text-sm">
      <span className="h-mx-2 w-mx-2 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="flex-1 truncate font-bold text-text-secondary">{label}</span>
      <span className="font-black tabular-nums text-text-primary">{value}</span>
    </div>
  )
}

export function OwnerDepartmentScoreGrid({ departments }: { departments: DepartmentScore[] }) {
  const navigate = useNavigate()
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="mb-mx-md flex items-center justify-between gap-mx-md">
        <div className="flex items-center gap-mx-xs">
          <Typography variant="h3" className="text-xl font-black">Desempenho por Departamento</Typography>
          <CircleHelp size={14} className="text-text-tertiary" />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(ownerPath('departamentos'))}>Ver todas</Button>
      </div>
      <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {departments.map((department) => {
          const classes = toneClasses[department.tone]
          const score = department.score ?? 0
          const statusBadgeTone = score >= 75 ? 'bg-[var(--color-status-success-surface)] text-status-success' : score >= 60 ? 'bg-[var(--color-status-warning-surface)] text-status-warning' : 'bg-[var(--color-status-error-surface)] text-status-error'
          return (
            <button key={department.name} type="button" onClick={() => navigate(department.path)} className="rounded-mx-2xl border border-border-default bg-white p-mx-md text-left hover:shadow-mx-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 flex flex-col items-center">
              <div className="flex w-full items-center gap-mx-sm">
                <span className={cn('h-mx-9 w-mx-9 rounded-mx-lg flex shrink-0 items-center justify-center', classes.bg)}>{department.icon}</span>
                <Typography variant="p" className="font-black text-sm truncate">{department.name}</Typography>
              </div>
              <div className="mt-mx-sm">
                <OwnerSemiGauge value={score} />
              </div>
              <div className="mt-mx-tiny flex flex-col items-center gap-mx-tiny">
                <span className="text-3xl font-black tabular-nums text-text-primary leading-none">{department.score ?? '--'}</span>
                <span className={cn('inline-flex items-center rounded-mx-md px-mx-sm py-mx-tiny text-mx-tiny font-black uppercase tracking-tight', statusBadgeTone)}>{department.status}</span>
              </div>
              <Typography variant="tiny" tone="muted" className="mt-mx-sm block min-h-mx-8 font-bold text-center w-full">{department.detail}</Typography>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
