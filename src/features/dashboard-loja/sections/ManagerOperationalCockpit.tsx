import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckSquare,
  Gauge,
  MessageSquare,
  Target,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { calcularProjecao, getDiasInfo } from '@/lib/calculations'
import { cn } from '@/lib/utils'
import type { RankingEntry } from '@/types/database'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'

type DashboardData = ReturnType<typeof useDashboardLojaData>
type ManagerTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

type ManagerOperationalCockpitProps = {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
}

export function ManagerOperationalCockpit({ data, alerts }: ManagerOperationalCockpitProps) {
  const navigate = useNavigate()
  const days = getDiasInfo(data.referenceDate, data.operationalMetaRules?.projection_mode || 'calendar')
  const projection = calcularProjecao(data.metrics.totalSales, days.decorridos, days.total)
  const idealPace = data.metrics.goalValue > 0 && days.total > 0 ? data.metrics.goalValue / days.total : 0
  const currentPace = days.decorridos > 0 ? data.metrics.totalSales / days.decorridos : 0
  const sellersTotal = data.sellers?.length || 0
  const disciplinePct = sellersTotal > 0 ? Math.round((data.metrics.checkedInCount / sellersTotal) * 100) : 0
  const conversionScore = data.funnelBenchmarks.visitaVnd > 0
    ? Math.min(100, Math.round((data.funilData.tx_visita_vnd / data.funnelBenchmarks.visitaVnd) * 100))
    : 0
  const mxScore = Math.round((Math.min(data.metrics.attainment, 100) * 0.45) + (conversionScore * 0.35) + (disciplinePct * 0.2))
  const gap = Math.max(data.metrics.goalValue - data.metrics.totalSales, 0)
  const visibleRanking = data.metrics.ranking.slice(0, 5)
  const pendingNames = data.pendingDisciplineSellers.map(seller => seller.name).filter(Boolean)

  const teamEngagement = Math.round((disciplinePct * 0.45) + (Math.min(data.metrics.attainment, 100) * 0.35) + (conversionScore * 0.2))
  const funnelRows = [
    {
      label: 'Leads',
      value: data.funilData.leads,
      next: data.funilData.agd_total,
      pct: data.funilData.tx_lead_agd,
      benchmark: data.funnelBenchmarks.leadAgd,
      tone: data.funilData.tx_lead_agd >= data.funnelBenchmarks.leadAgd ? 'success' : 'warning' as ManagerTone,
    },
    {
      label: 'Agendamentos',
      value: data.funilData.agd_total,
      next: data.funilData.visitas,
      pct: data.funilData.tx_agd_visita,
      benchmark: data.funnelBenchmarks.agdVisita,
      tone: data.funilData.tx_agd_visita >= data.funnelBenchmarks.agdVisita ? 'success' : 'warning' as ManagerTone,
    },
    {
      label: 'Visitas',
      value: data.funilData.visitas,
      next: data.funilData.vnd_total,
      pct: data.funilData.tx_visita_vnd,
      benchmark: data.funnelBenchmarks.visitaVnd,
      tone: data.funilData.tx_visita_vnd >= data.funnelBenchmarks.visitaVnd ? 'success' : 'danger' as ManagerTone,
    },
  ]

  return (
    <div className="flex flex-col gap-mx-lg pb-28">
      <ManagerHeader storeName={data.metrics.storeName} periodLabel={formatPeriodLabel(data.referenceDate)} />

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg" aria-label="Indicadores gerenciais">
        <Card className="lg:col-span-4 border-none bg-white p-mx-lg shadow-mx-lg">
          <div className="flex items-center gap-mx-sm">
            <MetricIcon tone="brand"><Target size={22} /></MetricIcon>
            <Typography variant="h3" className="uppercase tracking-tight">Meta do Mês</Typography>
          </div>
          <div className="mt-mx-lg grid grid-cols-3 divide-x divide-border-subtle text-center">
            <MiniStat label="Meta" value={formatInteger(data.metrics.goalValue)} detail="veículos" />
            <MiniStat label="Realizado" value={formatInteger(data.metrics.totalSales)} detail="veículos" />
            <MiniStat label="Projeção" value={formatInteger(projection)} detail="veículos" />
          </div>
          <ProgressBar value={data.metrics.attainment} className="mt-mx-lg" tone={data.metrics.attainment >= 80 ? 'success' : 'brand'} />
          <div className="mt-mx-sm flex flex-col gap-mx-xs sm:flex-row sm:items-center sm:justify-between">
            <Typography variant="tiny" tone="muted" className="font-black">{data.metrics.attainment}% da meta alcançada</Typography>
            <Typography variant="tiny" tone={gap > 0 ? 'warning' : 'success'} className="font-black">{gap > 0 ? `Faltam ${gap} veículos` : 'Meta atingida'}</Typography>
          </div>
        </Card>

        <ManagerKpiCard
          title="Ritmo Diário"
          value={formatDecimal(currentPace)}
          detail={`Ideal ${formatDecimal(idealPace)} veic/dia`}
          status={currentPace >= idealPace ? 'Dentro do ritmo' : 'Abaixo do ritmo ideal'}
          icon={<BarChart3 size={22} />}
          tone={currentPace >= idealPace ? 'success' : 'danger'}
        />
        <ManagerKpiCard
          title="Conversão Geral"
          value={`${data.funilData.tx_visita_vnd}%`}
          detail={`Meta ${data.funnelBenchmarks.visitaVnd}% visita > venda`}
          status={data.funilData.tx_visita_vnd >= data.funnelBenchmarks.visitaVnd ? 'Conversão saudável' : `${data.funnelBenchmarks.visitaVnd - data.funilData.tx_visita_vnd} p.p. abaixo`}
          icon={<Gauge size={22} />}
          tone={data.funilData.tx_visita_vnd >= data.funnelBenchmarks.visitaVnd ? 'success' : 'danger'}
        />
        <ManagerKpiCard
          title="Agendamentos Hoje"
          value={formatInteger(data.metrics.totalAgd)}
          detail="agenda comercial registrada"
          status={data.metrics.totalAgd > 0 ? 'Com movimento no dia' : 'Sem agendamentos lançados'}
          icon={<CalendarDays size={22} />}
          tone={data.metrics.totalAgd > 0 ? 'success' : 'warning'}
        />
        <Card className="lg:col-span-2 border-none bg-mx-black p-mx-lg text-white shadow-mx-xl">
          <div className="flex items-center justify-between gap-mx-sm">
            <Typography variant="tiny" tone="white" className="font-black uppercase tracking-widest opacity-70">MX Score da Loja</Typography>
            <Gauge size={18} className="opacity-60" />
          </div>
          <div className="mt-mx-lg flex items-end gap-mx-sm">
            <Typography variant="h1" tone="white" className="text-5xl leading-none font-mono-numbers">{mxScore}</Typography>
            <Typography variant="h3" tone={mxScore >= 75 ? 'success' : mxScore >= 60 ? 'warning' : 'error'} className="mb-1">{scoreLabel(mxScore)}</Typography>
          </div>
          <ProgressBar value={mxScore} className="mt-mx-md" tone={mxScore >= 75 ? 'success' : mxScore >= 60 ? 'warning' : 'danger'} />
          <Typography variant="tiny" tone="white" className="mt-mx-sm block font-black uppercase tracking-widest opacity-70">
            Meta, conversão e disciplina
          </Typography>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg" aria-label="Operação da equipe">
        <Card className="xl:col-span-5 border-none bg-white shadow-mx-lg">
          <PanelHeader title="Desempenho da Equipe" action="Ver equipe" onAction={() => navigate('?tab=equipe')} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="bg-surface-alt/60">
                <tr>
                  {['Vendedor', 'Vendas', 'Meta', 'Agenda', 'Disciplina', 'Status'].map(header => (
                    <th key={header} className="px-mx-md py-mx-sm text-left text-mx-tiny font-black uppercase tracking-widest text-text-tertiary">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {visibleRanking.length > 0 ? visibleRanking.map(row => (
                  <TeamRow key={row.user_id} row={row} />
                )) : (
                  <tr>
                    <td colSpan={6} className="px-mx-md py-mx-lg text-center">
                      <Typography variant="p" tone="muted">Equipe sem lançamentos no período selecionado.</Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="xl:col-span-4 border-none bg-white p-mx-lg shadow-mx-lg">
          <div className="flex items-center justify-between gap-mx-md">
            <div>
              <Typography variant="h3" className="uppercase tracking-tight">Funil de Vendas da Equipe</Typography>
              <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-black uppercase tracking-widest">Leads, agenda, visitas e vendas</Typography>
            </div>
            <Badge variant="outline" className="shrink-0 rounded-mx-full">Mês atual</Badge>
          </div>
          <div className="mt-mx-lg space-y-mx-md">
            {funnelRows.map(row => (
              <div key={row.label} className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md">
                <div className="flex items-center justify-between gap-mx-md">
                  <Typography variant="tiny" className="font-black uppercase tracking-widest">{row.label}</Typography>
                  <Badge variant={row.tone === 'success' ? 'success' : row.tone === 'danger' ? 'danger' : 'warning'} className="rounded-mx-full px-2 py-0.5">
                    {row.pct}% / {row.benchmark}%
                  </Badge>
                </div>
                <div className="mt-mx-sm grid grid-cols-3 items-center gap-mx-sm">
                  <MiniStat label="Entrada" value={formatInteger(row.value)} />
                  <MiniStat label="Próxima etapa" value={formatInteger(row.next)} />
                  <MiniStat label="Conversão" value={`${row.pct}%`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-mx-lg flex items-center justify-between rounded-mx-xl bg-mx-indigo-50 px-mx-md py-mx-sm">
            <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">Conversão geral</Typography>
            <Typography variant="h3" tone={data.funilData.tx_visita_vnd >= data.funnelBenchmarks.visitaVnd ? 'success' : 'error'}>{data.funilData.tx_visita_vnd}%</Typography>
          </div>
        </Card>

        <Card className="xl:col-span-3 border-none bg-white shadow-mx-lg">
          <PanelHeader title="Alertas Importantes" badge={alerts.length} action="Ver todos" onAction={() => navigate('/rotina')} />
          <div className="space-y-mx-sm p-mx-lg pt-0">
            {alerts.slice(0, 6).map(alert => (
              <AlertItem key={alert.title} alert={alert} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg" aria-label="Agenda e engajamento">
        <Card className="xl:col-span-6 border-none bg-white p-mx-lg shadow-mx-lg">
          <div className="flex items-center justify-between gap-mx-md">
            <Typography variant="h3" className="uppercase tracking-tight">Engajamento da Equipe</Typography>
            <Badge variant={teamEngagement >= 75 ? 'success' : teamEngagement >= 60 ? 'warning' : 'danger'} className="rounded-mx-full">{teamEngagement}%</Badge>
          </div>
          <div className="mt-mx-lg grid grid-cols-2 gap-mx-md md:grid-cols-5">
            <EngagementMetric label="Fechamento diário" value={disciplinePct} icon={<CheckSquare size={18} />} />
            <EngagementMetric label="Agenda cumprida" value={data.metrics.totalAgd > 0 ? 100 : 0} icon={<CalendarDays size={18} />} />
            <EngagementMetric label="Treinamentos" value={null} icon={<Target size={18} />} />
            <EngagementMetric label="Feedbacks" value={null} icon={<MessageSquare size={18} />} />
            <EngagementMetric label="Participação" value={teamEngagement} icon={<Users size={18} />} />
          </div>
        </Card>

        <Card className="xl:col-span-3 border-none bg-white p-mx-lg shadow-mx-lg">
          <div className="flex items-center justify-between gap-mx-md">
            <Typography variant="h3" className="uppercase tracking-tight">Ranking da Loja</Typography>
            <button type="button" onClick={() => navigate('/classificacao')} className="text-mx-tiny font-black uppercase tracking-widest text-brand-primary">Ver ranking</button>
          </div>
          <div className="mt-mx-lg space-y-mx-sm">
            {visibleRanking.slice(0, 3).map((row, index) => (
              <div key={row.user_id} className="flex items-center justify-between gap-mx-sm rounded-mx-xl bg-surface-alt px-mx-md py-mx-sm">
                <div className="flex min-w-0 items-center gap-mx-sm">
                  <span className="w-mx-8 text-center text-lg font-black text-status-warning">{index + 1}º</span>
                  <Avatar src={row.avatar_url || undefined} alt={`Avatar de ${row.user_name}`} fallback={row.user_name} size="sm" className="rounded-mx-lg" />
                  <Typography variant="p" className="truncate font-black">{row.user_name}</Typography>
                </div>
                <Typography variant="mono" tone="brand">{row.vnd_total}</Typography>
              </div>
            ))}
            {visibleRanking.length === 0 && <Typography variant="p" tone="muted">Ranking pendente de lançamentos.</Typography>}
          </div>
        </Card>

        <Card className="xl:col-span-3 border-none bg-white shadow-mx-lg">
          <PanelHeader title="Agenda de Hoje" action="Abrir rotina" onAction={() => navigate('/rotina')} />
          <div className="space-y-mx-sm p-mx-lg pt-0">
            {data.metrics.totalAgd > 0 ? (
              <>
                <AgendaItem time="Hoje" title={`${data.metrics.totalAgd} agendamentos registrados`} detail="Baseado nos lançamentos da equipe." />
                <AgendaItem time="Agora" title="Cobrar pendências de rotina" detail={pendingNames.length ? pendingNames.slice(0, 3).join(', ') : 'Equipe com rotina sincronizada.'} />
              </>
            ) : (
              <div className="rounded-mx-xl border border-dashed border-border-default bg-surface-alt p-mx-md">
                <Typography variant="p" tone="muted">Agenda operacional pendente de integração ou lançamentos do dia.</Typography>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}

function ManagerHeader({ storeName, periodLabel }: { storeName: string; periodLabel: string }) {
  return (
    <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <Typography variant="h1" className="text-3xl md:text-4xl">Bom dia, Gerente!</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs">Aqui está o desempenho da sua equipe hoje.</Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black uppercase tracking-widest">{storeName}</Typography>
      </div>
      <div className="flex flex-wrap gap-mx-sm">
        <Badge variant="outline" className="h-mx-11 rounded-mx-xl px-mx-md">Período: {periodLabel}</Badge>
        <Button type="button" variant="outline" size="sm" className="h-mx-11 rounded-mx-xl bg-white">
          Filtros
        </Button>
      </div>
    </header>
  )
}

function ManagerKpiCard({
  title,
  value,
  detail,
  status,
  icon,
  tone,
}: {
  title: string
  value: string
  detail: string
  status: string
  icon: ReactNode
  tone: ManagerTone
}) {
  return (
    <Card className="lg:col-span-2 min-h-[190px] border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-center justify-between gap-mx-sm">
        <MetricIcon tone={tone}>{icon}</MetricIcon>
        <Badge variant={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'outline'} className="rounded-mx-full px-2 py-0.5">
          {tone === 'danger' ? 'Crítico' : tone === 'warning' ? 'Atenção' : tone === 'success' ? 'Bom' : 'Info'}
        </Badge>
      </div>
      <Typography variant="tiny" tone="muted" className="mt-mx-lg block font-black uppercase tracking-widest">{title}</Typography>
      <Typography variant="h1" className="mt-mx-xs text-4xl font-mono-numbers">{value}</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">{detail}</Typography>
      <div className={cn('mt-mx-md rounded-mx-xl px-mx-md py-mx-sm text-center text-mx-tiny font-black uppercase tracking-widest', toneSurface(tone))}>
        {status}
      </div>
    </Card>
  )
}

function TeamRow({ row }: { row: RankingEntry }) {
  const discipline = row.checked_in ? 100 : 0
  const statusTone: ManagerTone = row.vnd_total > 0 && row.checked_in ? 'success' : row.checked_in ? 'warning' : 'danger'
  return (
    <tr className="bg-white">
      <td className="px-mx-md py-mx-sm">
        <div className="flex min-w-0 items-center gap-mx-sm">
          <Avatar src={row.avatar_url || undefined} alt={`Avatar de ${row.user_name}`} fallback={row.user_name} size="sm" className="rounded-mx-lg" />
          <Typography variant="p" className="truncate font-black">{row.user_name}</Typography>
        </div>
      </td>
      <td className="px-mx-md py-mx-sm text-center"><Typography variant="mono" tone="brand">{row.vnd_total}</Typography></td>
      <td className="px-mx-md py-mx-sm text-center"><Typography variant="mono">{row.meta || '-'}</Typography></td>
      <td className="px-mx-md py-mx-sm text-center"><Typography variant="mono" tone="info">{row.agd_total}</Typography></td>
      <td className="px-mx-md py-mx-sm">
        <ProgressBar value={discipline} tone={discipline >= 100 ? 'success' : 'danger'} />
      </td>
      <td className="px-mx-md py-mx-sm">
        <Badge variant={statusTone === 'success' ? 'success' : statusTone === 'warning' ? 'warning' : 'danger'} className="rounded-mx-full px-2 py-0.5">
          {statusTone === 'success' ? 'Excelente' : statusTone === 'warning' ? 'Atenção' : 'Crítico'}
        </Badge>
      </td>
    </tr>
  )
}

function PanelHeader({
  title,
  badge,
  action,
  onAction,
}: {
  title: string
  badge?: number
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-mx-md p-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <Typography variant="h3" className="uppercase tracking-tight">{title}</Typography>
        {typeof badge === 'number' && <Badge variant={badge > 0 ? 'danger' : 'success'} className="rounded-mx-full px-2 py-0.5">{badge}</Badge>}
      </div>
      {action && onAction && (
        <button type="button" onClick={onAction} className="text-mx-tiny font-black uppercase tracking-widest text-brand-primary">
          {action}
        </button>
      )}
    </div>
  )
}

function AlertItem({ alert }: { alert: OwnerPerformanceAlert }) {
  const tone = alert.variant === 'danger' ? 'danger' : alert.variant === 'warning' ? 'warning' : alert.variant === 'success' ? 'success' : 'info'
  return (
    <div className="flex gap-mx-sm rounded-mx-xl border border-border-subtle bg-surface-alt p-mx-sm">
      <MetricIcon tone={tone} className="h-mx-9 w-mx-9"><AlertTriangle size={16} /></MetricIcon>
      <div className="min-w-0">
        <Typography variant="p" className="font-black leading-tight">{alert.title}</Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case tracking-normal">{alert.description}</Typography>
        <Typography variant="tiny" tone="brand" className="mt-mx-xs block font-black normal-case tracking-normal">{alert.recommendation}</Typography>
        <Typography variant="tiny" className="mt-mx-xs block font-black uppercase tracking-tight">{alert.action}</Typography>
      </div>
    </div>
  )
}

function EngagementMetric({ label, value, icon }: { label: string; value: number | null; icon: ReactNode }) {
  const tone: ManagerTone = value == null ? 'neutral' : value >= 75 ? 'success' : value >= 60 ? 'warning' : 'danger'
  return (
    <div className="rounded-mx-xl border border-border-default bg-surface-alt p-mx-md text-center">
      <div className="mx-auto flex h-mx-10 w-mx-10 items-center justify-center rounded-mx-lg bg-white text-brand-primary shadow-mx-sm">
        {icon}
      </div>
      <Typography variant="tiny" tone="muted" className="mt-mx-sm block min-h-[32px] font-black uppercase tracking-tight">{label}</Typography>
      <Typography variant="h3" tone={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'error' : 'muted'} className="mt-mx-xs">
        {value == null ? 'Pendente' : `${value}%`}
      </Typography>
    </div>
  )
}

function AgendaItem({ time, title, detail }: { time: string; title: string; detail: string }) {
  return (
    <div className="flex gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-sm">
      <div className="flex h-mx-10 w-mx-12 shrink-0 items-center justify-center rounded-mx-lg bg-white text-mx-tiny font-black uppercase text-brand-primary shadow-mx-sm">
        {time}
      </div>
      <div className="min-w-0">
        <Typography variant="p" className="font-black leading-tight">{title}</Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case tracking-normal">{detail}</Typography>
      </div>
    </div>
  )
}

function MiniStat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="min-w-0 px-mx-xs">
      <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-tight">{label}</Typography>
      <Typography variant="h3" className="mt-mx-xs truncate font-mono-numbers">{value}</Typography>
      {detail && <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{detail}</Typography>}
    </div>
  )
}

function MetricIcon({ tone, className, children }: { tone: ManagerTone; className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex h-mx-12 w-mx-12 shrink-0 items-center justify-center rounded-mx-xl border shadow-mx-inner', toneBorder(tone), className)}>
      {children}
    </div>
  )
}

function ProgressBar({ value, tone = 'brand', className }: { value: number; tone?: ManagerTone; className?: string }) {
  return (
    <div className={cn('h-mx-xs w-full overflow-hidden rounded-mx-full bg-surface-alt', className)}>
      <div className={cn('h-full rounded-mx-full transition-all', toneFill(tone))} style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}

function toneBorder(tone: ManagerTone) {
  return {
    brand: 'border-mx-indigo-100 bg-mx-indigo-50 text-brand-primary',
    success: 'border-status-success/20 bg-status-success-surface text-status-success',
    warning: 'border-status-warning/20 bg-status-warning-surface text-status-warning',
    danger: 'border-status-error/20 bg-status-error-surface text-status-error',
    info: 'border-status-info/20 bg-status-info-surface text-status-info',
    neutral: 'border-border-default bg-white text-text-tertiary',
  }[tone]
}

function toneSurface(tone: ManagerTone) {
  return {
    brand: 'bg-mx-indigo-50 text-brand-primary',
    success: 'bg-status-success-surface text-status-success',
    warning: 'bg-status-warning-surface text-status-warning',
    danger: 'bg-status-error-surface text-status-error',
    info: 'bg-status-info-surface text-status-info',
    neutral: 'bg-surface-alt text-text-tertiary',
  }[tone]
}

function toneFill(tone: ManagerTone) {
  return {
    brand: 'bg-brand-primary',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-error',
    info: 'bg-status-info',
    neutral: 'bg-text-tertiary',
  }[tone]
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Bom'
  if (score >= 60) return 'Atenção'
  return 'Crítico'
}

function formatInteger(value: number) {
  return Math.round(value || 0).toLocaleString('pt-BR')
}

function formatDecimal(value: number) {
  return Number.isFinite(value) ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'
}

function formatPeriodLabel(referenceDate: string) {
  const [year, month] = referenceDate.split('-')
  if (!year || !month) return 'Mês atual'
  return `${month}/${year}`
}

export default ManagerOperationalCockpit
