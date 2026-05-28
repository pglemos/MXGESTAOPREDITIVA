import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Box,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  DollarSign,
  Download,
  Filter,
  Gauge,
  LineChart as LineChartIcon,
  Megaphone,
  MoreVertical,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
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
import { useAuth } from '@/hooks/useAuth'
import { chartTokens } from '@/lib/charts/tokens'
import { cn } from '@/lib/utils'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'

type DashboardData = ReturnType<typeof useDashboardLojaData>

type OwnerExecutiveCockpitProps = {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
}

type KpiTone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'brand'
type OwnerSection =
  | 'home'
  | 'planejamento'
  | 'resultados'
  | 'plano-acao'
  | 'alertas'
  | 'benchmarking'
  | 'agenda'
  | 'visitas'
  | 'departamentos'
  | 'consultor'
  | 'biblioteca'

type DepartmentScore = {
  name: string
  icon: ReactNode
  score: number | null
  status: string
  detail: string
  tone: KpiTone
  path: string
}

type ActionRow = {
  priority: 'Crítica' | 'Atenção' | 'Positiva'
  problem: string
  recommendation: string
  action: string
  owner: string
  origin: string
  due: string
  status: string
  tone: KpiTone
}

const toneClasses: Record<KpiTone, { bg: string; text: string; soft: string; bar: string; border: string }> = {
  success: {
    bg: 'bg-status-success-surface text-status-success border border-status-success/20',
    text: 'text-status-success',
    soft: 'bg-status-success-surface text-status-success border-status-success/20',
    bar: 'bg-status-success',
    border: 'border-status-success/20',
  },
  info: {
    bg: 'bg-status-info-surface text-status-info border border-status-info/20',
    text: 'text-status-info',
    soft: 'bg-status-info-surface text-status-info border-status-info/20',
    bar: 'bg-status-info',
    border: 'border-status-info/20',
  },
  warning: {
    bg: 'bg-status-warning-surface text-status-warning border border-status-warning/20',
    text: 'text-status-warning',
    soft: 'bg-status-warning-surface text-status-warning border-status-warning/20',
    bar: 'bg-status-warning',
    border: 'border-status-warning/20',
  },
  danger: {
    bg: 'bg-status-error-surface text-status-error border border-status-error/20',
    text: 'text-status-error',
    soft: 'bg-status-error-surface text-status-error border-status-error/20',
    bar: 'bg-status-error',
    border: 'border-status-error/20',
  },
  muted: {
    bg: 'bg-surface-alt text-text-tertiary border border-border-default',
    text: 'text-text-tertiary',
    soft: 'bg-surface-alt text-text-tertiary border-border-default',
    bar: 'bg-border-default',
    border: 'border-border-default',
  },
  brand: {
    bg: 'bg-mx-indigo-50 text-brand-primary border border-mx-indigo-100',
    text: 'text-brand-primary',
    soft: 'bg-mx-indigo-50 text-brand-primary border-mx-indigo-100',
    bar: 'bg-brand-primary',
    border: 'border-mx-indigo-100',
  },
}

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function currentPeriodLabel(referenceDate: string) {
  const date = new Date(`${referenceDate}T12:00:00`)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1).replace(' de ', '/')
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatInteger(value: number) {
  return Math.round(value || 0).toLocaleString('pt-BR')
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || typeof value === 'undefined') return 'Pendente'
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return 'Pendente'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`
}

function scoreTone(score: number | null): KpiTone {
  if (score === null) return 'muted'
  if (score >= 85) return 'success'
  if (score >= 75) return 'info'
  if (score >= 60) return 'warning'
  return 'danger'
}

function scoreStatus(score: number | null) {
  if (score === null) return 'Pendente'
  if (score >= 85) return 'Excelente'
  if (score >= 75) return 'Bom'
  if (score >= 60) return 'Atenção'
  return 'Crítico'
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function ownerPath(section: string) {
  const params = new URLSearchParams(window.location.search)
  params.set('ownerSection', section)
  return `${window.location.pathname}?${params.toString()}`
}

function buildPanoramaData(data: DashboardData) {
  const byDate = new Map<string, number>()
  for (const checkin of data.checkins || []) {
    const current = byDate.get(checkin.reference_date) || 0
    const sales =
      (checkin.vnd_porta_prev_day || 0) +
      (checkin.vnd_cart_prev_day || 0) +
      (checkin.vnd_net_prev_day || 0)
    byDate.set(checkin.reference_date, current + sales)
  }

  const dates = Array.from(byDate.keys()).sort()
  if (dates.length === 0) return []

  let cumulative = 0
  const plannedStep = data.metrics.goalValue > 0 ? data.metrics.goalValue / dates.length : 0

  return dates.map((date, index) => {
    cumulative += byDate.get(date) || 0
    const day = Number(date.slice(-2))
    return {
      label: `${day}`,
      planejado: Math.round(plannedStep * (index + 1)),
      realizado: cumulative,
    }
  })
}

function buildDepartments(data: DashboardData): DepartmentScore[] {
  const sellersTotal = data.sellers?.length || 0
  const disciplineScore = sellersTotal > 0 ? clampScore((data.metrics.checkedInCount / sellersTotal) * 100) : null
  const leadConversionScore = data.funnelBenchmarks.leadAgd > 0
    ? clampScore((data.funilData.tx_lead_agd / data.funnelBenchmarks.leadAgd) * 100)
    : null
  const visitConversionScore = data.funnelBenchmarks.visitaVnd > 0
    ? clampScore((data.funilData.tx_visita_vnd / data.funnelBenchmarks.visitaVnd) * 100)
    : null
  const salesScore = data.metrics.goalValue > 0 ? clampScore(data.metrics.attainment) : null
  const commercialValues = [salesScore, leadConversionScore, visitConversionScore].filter((score): score is number => score !== null)
  const commercialScore = commercialValues.length
    ? clampScore(commercialValues.reduce((sum, score) => sum + score, 0) / commercialValues.length)
    : null
  const marketingScore = leadConversionScore
  const financeScore = data.latestDRE ? (data.latestDRE.net_profit >= 0 ? 85 : 55) : null

  return [
    {
      name: 'Comercial',
      icon: <Users size={20} />,
      score: commercialScore,
      status: scoreStatus(commercialScore),
      detail: commercialScore === null ? 'Sem meta/funil suficiente' : 'Meta, leads e visita > venda',
      tone: scoreTone(commercialScore),
      path: ownerPath('departamentos-comercial'),
    },
    {
      name: 'Marketing',
      icon: <Megaphone size={20} />,
      score: marketingScore,
      status: scoreStatus(marketingScore),
      detail: marketingScore === null ? 'Benchmark pendente' : 'Lead > agendamento',
      tone: scoreTone(marketingScore),
      path: ownerPath('departamentos-marketing'),
    },
    {
      name: 'Produto',
      icon: <Package size={20} />,
      score: null,
      status: 'Pendente',
      detail: 'Estoque e giro aguardam fonte',
      tone: 'warning',
      path: ownerPath('departamentos-produto'),
    },
    {
      name: 'Financeiro',
      icon: <DollarSign size={20} />,
      score: financeScore,
      status: scoreStatus(financeScore),
      detail: data.latestDRE ? 'DRE financeiro conectado' : 'DRE pendente',
      tone: scoreTone(financeScore),
      path: ownerPath('departamentos-financeiro'),
    },
    {
      name: 'Operacional',
      icon: <Gauge size={20} />,
      score: disciplineScore,
      status: scoreStatus(disciplineScore),
      detail: sellersTotal > 0 ? 'Disciplina de lançamento' : 'Equipe pendente',
      tone: scoreTone(disciplineScore),
      path: ownerPath('departamentos-operacional'),
    },
    {
      name: 'RH',
      icon: <Users size={20} />,
      score: null,
      status: 'Pendente',
      detail: 'PDI, feedback e clima',
      tone: 'muted',
      path: ownerPath('departamentos-rh'),
    },
  ]
}

function buildActions(alerts: OwnerPerformanceAlert[]): ActionRow[] {
  if (!alerts.length) {
    return [{
      priority: 'Positiva',
      problem: 'Operação sem alerta crítico',
      recommendation: 'Manter cadência e usar benchmark para buscar ganho incremental.',
      action: 'Manter cadência e acompanhar a rotina semanal.',
      owner: 'Diretor',
      origin: 'Score',
      due: 'Contínuo',
      status: 'Acompanhando',
      tone: 'success',
    }]
  }

  return alerts.map((alert, index) => ({
    priority: alert.variant === 'danger' ? 'Crítica' : alert.variant === 'warning' ? 'Atenção' : 'Positiva',
    problem: alert.title,
    recommendation: alert.recommendation,
    action: alert.action,
    owner: index % 2 === 0 ? 'Gerente comercial' : 'Diretor',
    origin: alert.variant === 'success' ? 'Score' : 'Alerta',
    due: index === 0 ? 'Hoje' : `${index + 1} dias`,
    status: alert.variant === 'success' ? 'Acompanhando' : index === 0 ? 'Atrasada' : 'Em andamento',
    tone: alert.variant === 'danger' ? 'danger' : alert.variant === 'warning' ? 'warning' : 'success',
  }))
}

function getOwnerSection(search: string): OwnerSection {
  const value = new URLSearchParams(search).get('ownerSection')
  if (value?.startsWith('departamentos')) return 'departamentos'
  if (
    value === 'planejamento' ||
    value === 'resultados' ||
    value === 'plano-acao' ||
    value === 'alertas' ||
    value === 'benchmarking' ||
    value === 'agenda' ||
    value === 'visitas' ||
    value === 'departamentos' ||
    value === 'consultor' ||
    value === 'biblioteca'
  ) {
    return value
  }
  return 'home'
}

export function OwnerExecutiveCockpit({ data, alerts }: OwnerExecutiveCockpitProps) {
  const { profile } = useAuth()
  const location = useLocation()
  const periodLabel = currentPeriodLabel(data.referenceDate)
  const panoramaData = useMemo(() => buildPanoramaData(data), [data])
  const departments = useMemo(() => buildDepartments(data), [data])
  const actions = useMemo(() => buildActions(alerts), [alerts])
  const scoredDepartments = departments.filter((department) => department.score !== null)
  const mxScore = scoredDepartments.length
    ? clampScore(scoredDepartments.reduce((sum, department) => sum + (department.score || 0), 0) / scoredDepartments.length)
    : null
  const criticalAlerts = alerts.filter((alert) => alert.variant === 'danger' || alert.variant === 'warning')
  const marginPercent = data.latestDRE && data.latestDRE.gross_margin > 0
    ? (data.latestDRE.net_sales_margin / data.latestDRE.gross_margin) * 100
    : null
  const section = getOwnerSection(location.search)

  return (
    <section className="min-h-full bg-surface-alt p-mx-sm md:p-mx-lg space-y-mx-md">
      <OwnerCockpitHeader
        name={profile?.name || 'Diretor'}
        periodLabel={periodLabel}
        alertCount={criticalAlerts.length}
        storeName={data.metrics.storeName}
      />

      {section === 'home' && (
        <OwnerHome
          data={data}
          alerts={alerts}
          actions={actions}
          departments={departments}
          panoramaData={panoramaData}
          mxScore={mxScore}
          marginPercent={marginPercent}
        />
      )}
      {section === 'planejamento' && <StrategicPlanningView data={data} marginPercent={marginPercent} />}
      {section === 'resultados' && <ResultsView data={data} alerts={alerts} panoramaData={panoramaData} mxScore={mxScore} />}
      {section === 'plano-acao' && <ActionPlanView actions={actions} />}
      {section === 'alertas' && <AlertsView alerts={alerts} />}
      {section === 'benchmarking' && <BenchmarkingView data={data} mxScore={mxScore} marginPercent={marginPercent} />}
      {section === 'agenda' && <AgendaView alerts={alerts} />}
      {section === 'departamentos' && <DepartmentsView departments={departments} />}
      {section === 'visitas' && (
        <OwnerModuleGrid
          title="Visitas"
          subtitle="Acompanhamento PMR, PMR Plus, PPA e evidências."
          items={[
            { title: 'Checklist da visita', detail: 'Roteiro, observações e execução.', icon: <CalendarDays size={20} />, tone: 'brand' },
            { title: 'Relatório e ata', detail: 'Resumo da visita e próximos passos.', icon: <LineChartIcon size={20} />, tone: 'info' },
            { title: 'Evidências', detail: 'Fotos, anexos e validações.', icon: <Package size={20} />, tone: 'warning' },
          ]}
        />
      )}
      {section === 'biblioteca' && (
        <OwnerModuleGrid
          title="Biblioteca"
          subtitle="Conteúdos, playbooks e trilhas da Universidade MX."
          items={[
            { title: 'Playbooks comerciais', detail: 'Abordagem, follow-up e fechamento.', icon: <Target size={20} />, tone: 'brand' },
            { title: 'Treinamentos liberados', detail: 'Conteúdos para gerente e equipe.', icon: <Users size={20} />, tone: 'info' },
            { title: 'Materiais da consultoria', detail: 'Modelos e documentos de apoio.', icon: <ShieldCheck size={20} />, tone: 'success' },
          ]}
        />
      )}
      {section === 'consultor' && (
        <OwnerModuleGrid
          title="Consultor IA"
          subtitle="Leitura consultiva baseada em regras, contexto e prioridades."
          items={[
            { title: 'Perguntar ao Consultor MX', detail: 'Use alertas e indicadores como contexto.', icon: <Bot size={20} />, tone: 'brand' },
            { title: 'Orientações registradas', detail: 'Histórico consultivo da unidade.', icon: <Bell size={20} />, tone: 'info' },
            { title: 'Recomendações de ação', detail: 'Sugestões ligadas ao plano de ação.', icon: <CheckCircle2 size={20} />, tone: 'success' },
          ]}
        />
      )}
    </section>
  )
}

function OwnerCockpitHeader({
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

function OwnerHome({
  data,
  alerts,
  actions,
  departments,
  panoramaData,
  mxScore,
  marginPercent,
}: {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
  actions: ActionRow[]
  departments: DepartmentScore[]
  panoramaData: Array<{ label: string; planejado: number; realizado: number }>
  mxScore: number | null
  marginPercent: number | null
}) {
  const grossProfit = data.latestDRE?.gross_profit
  return (
    <>
      <div className="grid grid-cols-1 gap-mx-md sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_220px]">
        <OwnerKpiCard title="Lucro Bruto" value={formatCurrency(grossProfit)} detail={grossProfit === undefined ? 'DRE pendente' : 'DRE atualizado'} icon={<DollarSign size={22} />} tone={grossProfit === undefined ? 'muted' : 'success'} />
        <OwnerKpiCard title="% Margem" value={formatPercent(marginPercent)} detail={marginPercent === null ? 'DRE pendente' : 'Margem DRE'} icon={<Gauge size={22} />} tone={marginPercent === null ? 'muted' : marginPercent >= 18 ? 'info' : 'warning'} />
        <OwnerKpiCard title="Volume de Vendas" value={formatInteger(data.metrics.totalSales)} detail={data.metrics.goalValue > 0 ? `${data.metrics.attainment}% da meta` : 'Meta pendente'} icon={<ShoppingCart size={22} />} tone="brand" />
        <OwnerKpiCard title="Estoque (Unid.)" value="Pendente" detail="Aguardando fonte" icon={<Box size={22} />} tone="warning" />
        <MXScoreCompact score={mxScore} />
      </div>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)_minmax(340px,0.9fr)]">
        <SalesGoalCard data={data} />
        <OwnerAlertList alerts={alerts} />
        <NextActionsCard actions={actions} />
      </div>

      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <OwnerPanoramaChart data={panoramaData} goalValue={data.metrics.goalValue} attainment={data.metrics.attainment} />
        <OwnerActionPlanSummary actions={actions} />
      </div>

      <OwnerDepartmentScoreGrid departments={departments} />
    </>
  )
}

function OwnerKpiCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string
  value: string
  detail: string
  icon: ReactNode
  tone: KpiTone
}) {
  const classes = toneClasses[tone]
  return (
    <Card className="min-h-[140px] rounded-mx-2xl p-mx-md">
      <div className="flex items-start justify-between gap-mx-sm">
        <div className="min-w-0">
          <Typography variant="p" className={cn('block font-black', classes.text)}>
            {title}
          </Typography>
          <Typography variant="h2" className="mt-mx-xs text-2xl md:text-3xl font-black tabular-nums text-text-primary">
            {value}
          </Typography>
          <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-black">
            {detail}
          </Typography>
        </div>
        <div className={cn('h-mx-12 w-mx-12 rounded-mx-xl flex shrink-0 items-center justify-center shadow-mx-sm', classes.bg)}>
          {icon}
        </div>
      </div>
      <Sparkline tone={tone} />
    </Card>
  )
}

function Sparkline({ tone }: { tone: KpiTone }) {
  const heights = [28, 31, 30, 38, 34, 43, 39, 48]
  const classes = toneClasses[tone]
  return (
    <div className="mt-mx-md flex h-mx-12 items-end gap-1" aria-hidden="true">
      {heights.map((height, index) => (
        <span key={`${height}-${index}`} className={cn('w-full rounded-mx-full opacity-80', classes.bar)} style={{ height }} />
      ))}
    </div>
  )
}

function MXScoreCompact({ score }: { score: number | null }) {
  const safeScore = score ?? 0
  return (
    <Card className="min-h-[140px] rounded-mx-2xl bg-mx-black p-mx-md text-white">
      <div className="flex items-center justify-between">
        <Typography variant="tiny" tone="white" className="font-black uppercase">
          MX Score da Loja
        </Typography>
        <CircleHelp size={16} className="text-white/60" />
      </div>
      <div className="mt-mx-sm flex items-end justify-between gap-mx-sm">
        <div>
          <div className="text-5xl font-black tabular-nums">{score ?? '--'}</div>
          <Typography variant="p" className="font-black text-brand-primary">{scoreStatus(score)}</Typography>
          <Typography variant="tiny" tone="white" className="mt-mx-xs block opacity-70">Score automático</Typography>
        </div>
        <div
          className="h-[92px] w-[92px] rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${chartTokens.accent()} ${safeScore * 3.6}deg, ${chartTokens.warning()} ${safeScore * 3.6}deg 300deg, ${chartTokens.danger()} 300deg)` }}
          aria-hidden="true"
        >
          <div className="h-[64px] w-[64px] rounded-full bg-mx-black" />
        </div>
      </div>
    </Card>
  )
}

function SalesGoalCard({ data }: { data: DashboardData }) {
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

function MetricPill({ label, value, tone }: { label: string; value: string; tone: KpiTone }) {
  const classes = toneClasses[tone]
  return (
    <div className={cn('rounded-mx-xl border p-mx-sm text-center', classes.soft)}>
      <Typography variant="tiny" className="block font-black">{label}</Typography>
      <div className="mt-mx-xs text-2xl font-black tabular-nums">{value}</div>
    </div>
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

function NextActionsCard({ actions }: { actions: ActionRow[] }) {
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
  const critical = actions.filter(action => action.tone === 'danger').length
  const progress = actions.length > 0 ? clampScore(((actions.length - critical) / actions.length) * 100) : 0
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <Typography variant="h3" className="text-xl font-black">Plano de Ação</Typography>
      <div className="mt-mx-md flex items-center justify-center">
        <div
          className="h-[150px] w-[150px] rounded-full flex items-center justify-center"
          style={{ background: `conic-gradient(${chartTokens.success()} ${progress * 3.6}deg, ${chartTokens.gridStrong()} 0deg)` }}
          aria-label={`Eficácia estimada ${progress}%`}
        >
          <div className="h-[108px] w-[108px] rounded-full bg-white shadow-inner flex flex-col items-center justify-center">
            <span className="text-3xl font-black tabular-nums text-text-primary">{progress}%</span>
            <span className="text-mx-tiny font-black uppercase text-text-tertiary">eficácia</span>
          </div>
        </div>
      </div>
      <div className="mt-mx-md grid grid-cols-3 gap-mx-sm">
        <MetricPill label="Total" value={String(actions.length)} tone="brand" />
        <MetricPill label="Críticas" value={String(critical)} tone={critical > 0 ? 'danger' : 'success'} />
        <MetricPill label="Andamento" value={String(actions.filter(action => action.status === 'Em andamento').length)} tone="info" />
      </div>
      <Button type="button" className="mt-mx-md w-full rounded-mx-xl" onClick={() => navigate(ownerPath('plano-acao'))}>
        Ver ações
      </Button>
    </Card>
  )
}

export function OwnerDepartmentScoreGrid({ departments }: { departments: DepartmentScore[] }) {
  const navigate = useNavigate()
  return (
    <Card className="rounded-mx-2xl p-mx-lg">
      <div className="mb-mx-md flex items-center justify-between gap-mx-md">
        <div>
          <Typography variant="h3" className="text-xl font-black">Desempenho por Departamento</Typography>
          <Typography variant="p" tone="muted" className="mt-1 font-bold">Comercial, marketing, produto, financeiro, operacional e RH.</Typography>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(ownerPath('departamentos'))}>Ver todas</Button>
      </div>
      <div className="grid grid-cols-1 gap-mx-sm sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {departments.map((department) => {
          const classes = toneClasses[department.tone]
          const progress = department.score ?? 0
          return (
            <button key={department.name} type="button" onClick={() => navigate(department.path)} className="rounded-mx-2xl border border-border-default bg-white p-mx-md text-left hover:bg-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
              <div className="flex items-center gap-mx-sm">
                <span className={cn('h-mx-11 w-mx-11 rounded-mx-xl flex shrink-0 items-center justify-center shadow-mx-sm', classes.bg)}>{department.icon}</span>
                <Typography variant="p" className="font-black">{department.name}</Typography>
              </div>
              <div className="mt-mx-sm flex items-end gap-mx-xs">
                <span className="text-4xl font-black tabular-nums text-text-primary">{department.score ?? '--'}</span>
                <span className={cn('pb-1 text-mx-tiny font-black uppercase', classes.text)}>{department.status}</span>
              </div>
              <Typography variant="tiny" tone="muted" className="mt-mx-xs block min-h-mx-8 font-bold">{department.detail}</Typography>
              <div className="mt-mx-sm h-2 rounded-full bg-surface-alt overflow-hidden">
                <div className={cn('h-full rounded-full', classes.bar)} style={{ width: `${progress}%` }} />
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function StrategicPlanningView({ data, marginPercent }: { data: DashboardData; marginPercent: number | null }) {
  const rows = [
    { group: 'VENDAS', metric: 'Vendas Total', value: data.metrics.goalValue || null, actual: data.metrics.totalSales },
    { group: 'VENDAS', metric: 'Conversão Lead > Agendamento (%)', value: data.funnelBenchmarks.leadAgd, actual: data.funilData.tx_lead_agd },
    { group: 'ESTOQUE', metric: 'Estoque Total (Unid.)', value: null, actual: null },
    { group: 'FINANCEIRO', metric: 'Margem Média de Venda (%)', value: marginPercent, actual: marginPercent },
    { group: 'FINANCEIRO', metric: 'Lucro Líquido', value: data.latestDRE?.net_profit ?? null, actual: data.latestDRE?.net_profit ?? null },
    { group: 'OPERACIONAL', metric: 'Disciplina de Rotina (%)', value: 100, actual: data.sellers?.length ? (data.metrics.checkedInCount / data.sellers.length) * 100 : null },
  ]

  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Planejamento Estratégico" subtitle="Visão anual Meta / Realizado / Ano Anterior, sem excesso de gráficos." />
      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-5">
        <OwnerKpiCard title="Lucro Líquido" value={formatCurrency(data.latestDRE?.net_profit)} detail={data.latestDRE ? 'DRE conectado' : 'DRE pendente'} icon={<DollarSign size={22} />} tone={data.latestDRE ? 'success' : 'muted'} />
        <OwnerKpiCard title="Volume de Vendas" value={formatInteger(data.metrics.totalSales)} detail={data.metrics.goalValue > 0 ? `${data.metrics.attainment}% da meta` : 'Meta pendente'} icon={<BarChart3 size={22} />} tone="brand" />
        <OwnerKpiCard title="Custo p/ Venda" value={formatCurrency(data.latestDRE?.cac)} detail={data.latestDRE ? 'DRE conectado' : 'DRE pendente'} icon={<ShoppingCart size={22} />} tone="warning" />
        <OwnerKpiCard title="Estoque Total" value="Pendente" detail="Fonte não conectada" icon={<Box size={22} />} tone="muted" />
        <OwnerKpiCard title="Funcionários" value={formatInteger(data.sellers?.length || 0)} detail="Equipe ativa" icon={<Users size={22} />} tone="info" />
      </div>
      <Card className="rounded-mx-2xl p-mx-lg">
        <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
          <Typography variant="h3" className="text-xl font-black">Indicadores Estratégicos</Typography>
          <Button type="button" variant="outline" className="h-mx-10 rounded-mx-xl bg-white"><Download size={16} /> Exportar</Button>
        </div>
        <div className="mt-mx-md overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                <th className="border border-border-subtle px-mx-sm py-mx-sm">Indicador</th>
                {monthLabels.map(month => <th key={month} className="border border-border-subtle px-mx-sm py-mx-sm text-center">{month}</th>)}
                <th className="border border-border-subtle px-mx-sm py-mx-sm text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.group}-${row.metric}`}>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm">
                    <Typography variant="tiny" tone="brand" className="block font-black">{row.group}</Typography>
                    <Typography variant="p" className="text-sm font-black">{row.metric}</Typography>
                  </td>
                  {monthLabels.map((month, index) => (
                    <td key={`${row.metric}-${month}`} className={cn('border border-border-subtle px-mx-sm py-mx-sm text-center font-bold tabular-nums', index === new Date(`${data.referenceDate}T12:00:00`).getMonth() && 'bg-mx-indigo-50 text-brand-primary')}>
                      {index === new Date(`${data.referenceDate}T12:00:00`).getMonth() ? formatPlanningValue(row.actual) : formatPlanningValue(row.value)}
                    </td>
                  ))}
                  <td className="border border-border-subtle px-mx-sm py-mx-sm text-center font-black tabular-nums">
                    {formatPlanningValue(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function formatPlanningValue(value: number | null | undefined) {
  if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return '--'
  if (Math.abs(value) >= 1000) return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

function ResultsView({
  data,
  alerts,
  panoramaData,
  mxScore,
}: {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
  panoramaData: Array<{ label: string; planejado: number; realizado: number }>
  mxScore: number | null
}) {
  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Resultados" subtitle="Metas, realizado, ano anterior e leitura executiva." />
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_340px]">
        <OwnerPanoramaChart data={panoramaData} goalValue={data.metrics.goalValue} attainment={data.metrics.attainment} />
        <div className="space-y-mx-md">
          <MXScoreCompact score={mxScore} />
          <OwnerAlertList alerts={alerts} />
        </div>
      </div>
    </div>
  )
}

function ActionPlanView({ actions }: { actions: ActionRow[] }) {
  return (
    <div className="space-y-mx-md">
      <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Plano de Ação" subtitle="Transforme problemas em execução e acompanhe eficácia." />
        <div className="flex gap-mx-sm">
          <Button type="button" className="rounded-mx-xl"><Plus size={16} /> Nova Ação</Button>
          <Button type="button" variant="outline" className="rounded-mx-xl bg-white"><Download size={16} /> Exportar</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <ToolbarPlaceholder searchPlaceholder="Buscar ação, problema ou indicador..." />
          <div className="mt-mx-md overflow-x-auto">
            <table className="min-w-[1080px] w-full text-sm">
              <thead className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                <tr>
                  <th className="px-mx-sm py-mx-sm">Prioridade</th>
                  <th className="px-mx-sm py-mx-sm">Problema / Indicador</th>
                  <th className="px-mx-sm py-mx-sm">Recomendação</th>
                  <th className="px-mx-sm py-mx-sm">Ação Rápida</th>
                  <th className="px-mx-sm py-mx-sm">Responsável</th>
                  <th className="px-mx-sm py-mx-sm">Origem</th>
                  <th className="px-mx-sm py-mx-sm">Prazo</th>
                  <th className="px-mx-sm py-mx-sm">Status</th>
                  <th className="px-mx-sm py-mx-sm">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {actions.map((action, index) => {
                  const classes = toneClasses[action.tone]
                  return (
                    <tr key={`${action.problem}-${index}`}>
                      <td className="px-mx-sm py-mx-sm"><span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{action.priority}</span></td>
                      <td className="px-mx-sm py-mx-sm font-black">{action.problem}</td>
                      <td className="px-mx-sm py-mx-sm text-text-secondary">{action.recommendation}</td>
                      <td className="px-mx-sm py-mx-sm text-text-secondary">{action.action}</td>
                      <td className="px-mx-sm py-mx-sm font-bold">{action.owner}</td>
                      <td className="px-mx-sm py-mx-sm">{action.origin}</td>
                      <td className={cn('px-mx-sm py-mx-sm font-black', classes.text)}>{action.due}</td>
                      <td className="px-mx-sm py-mx-sm"><span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{action.status}</span></td>
                      <td className="px-mx-sm py-mx-sm"><MoreVertical size={18} className="text-text-tertiary" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-mx-md">
          <OwnerActionPlanSummary actions={actions} />
          <SideList title="Gargalos Principais" items={actions.slice(0, 3).map(action => action.problem)} />
        </div>
      </div>
    </div>
  )
}

function AlertsView({ alerts }: { alerts: OwnerPerformanceAlert[] }) {
  const critical = alerts.filter(alert => alert.variant === 'danger').length
  const warning = alerts.filter(alert => alert.variant === 'warning').length
  const positive = alerts.filter(alert => alert.variant === 'success').length
  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Alertas Inteligentes" subtitle="Monitore riscos, desvios e oportunidades em tempo real." />
      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Críticos" value={critical} detail="exigem ação imediata" icon={<AlertTriangle size={22} />} tone="danger" />
        <SummaryCard title="Atenção" value={warning} detail="precisam de atenção" icon={<Clock3 size={22} />} tone="warning" />
        <SummaryCard title="Informativos" value={Math.max(alerts.length - critical - warning - positive, 0)} detail="para acompanhamento" icon={<Bell size={22} />} tone="info" />
        <SummaryCard title="Positivos" value={positive} detail="pontos positivos" icon={<CheckCircle2 size={22} />} tone="success" />
        <SummaryCard title="Tendência de Risco" value={critical + warning > 0 ? 'Alta' : 'Baixa'} detail="atenção redobrada" icon={<TrendingUp size={22} />} tone={critical + warning > 0 ? 'danger' : 'success'} />
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <ToolbarPlaceholder searchPlaceholder="Buscar alerta..." />
          <div className="mt-mx-md divide-y divide-border-subtle">
            {alerts.map((alert, index) => {
              const tone: KpiTone = alert.variant === 'danger' ? 'danger' : alert.variant === 'warning' ? 'warning' : alert.variant === 'success' ? 'success' : 'info'
              const classes = toneClasses[tone]
              return (
                <div key={`${alert.title}-${index}`} className="grid grid-cols-1 gap-mx-sm py-mx-md lg:grid-cols-[120px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_90px_80px_40px] lg:items-center">
                  <span className={cn('w-fit rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{tone === 'danger' ? 'Crítico' : tone === 'warning' ? 'Atenção' : tone === 'success' ? 'Positivo' : 'Informativo'}</span>
                  <div>
                    <Typography variant="p" className="font-black">{alert.title}</Typography>
                    <Typography variant="tiny" tone="muted" className="block">{alert.description}</Typography>
                  </div>
                  <Typography variant="p" tone="brand" className="font-black">{alert.recommendation}</Typography>
                  <Typography variant="p" className="font-bold text-text-secondary">{alert.action}</Typography>
                  <Typography variant="tiny" className={cn('font-black', classes.text)}>Impacto {alert.impact}</Typography>
                  <Typography variant="tiny" className={cn('font-black', classes.text)}>Sistema</Typography>
                  <MoreVertical size={18} className="text-text-tertiary" />
                </div>
              )
            })}
          </div>
        </Card>
        <div className="space-y-mx-md">
          <SideList title="Indicadores mais críticos" items={alerts.slice(0, 5).map(alert => alert.title)} />
          <Card className="rounded-mx-2xl bg-mx-indigo-50 p-mx-lg">
            <Typography variant="h3" className="font-black text-brand-primary">Dica do Consultor MX</Typography>
            <Typography variant="p" tone="muted" className="mt-mx-sm font-bold">Foque nas ações críticas para evitar impacto no resultado do mês.</Typography>
          </Card>
        </div>
      </div>
    </div>
  )
}

function BenchmarkingView({
  data,
  mxScore,
  marginPercent,
}: {
  data: DashboardData
  mxScore: number | null
  marginPercent: number | null
}) {
  const rows = [
    { label: 'Vendas Totais (Unid.)', store: data.metrics.totalSales, group: data.metrics.goalValue || null, best: null, status: data.metrics.goalValue && data.metrics.totalSales >= data.metrics.goalValue ? 'Bom' : 'Atenção' },
    { label: 'Margem Média de Venda (%)', store: marginPercent, group: null, best: null, status: marginPercent === null ? 'Pendente' : marginPercent >= 18 ? 'Bom' : 'Atenção' },
    { label: 'Conversão Leads > Agendamento (%)', store: data.funilData.tx_lead_agd, group: data.funnelBenchmarks.leadAgd, best: null, status: data.funilData.tx_lead_agd >= data.funnelBenchmarks.leadAgd ? 'Bom' : 'Atenção' },
    { label: 'Custo por Venda', store: data.latestDRE?.cac ?? null, group: null, best: null, status: data.latestDRE ? 'Acompanhar' : 'Pendente' },
    { label: 'MX Score', store: mxScore, group: null, best: null, status: scoreStatus(mxScore) },
  ]

  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Benchmarking" subtitle="Compare sua loja com metas, benchmarks configurados e melhores práticas." />
      <Card className="rounded-mx-2xl p-mx-lg">
        <div className="grid grid-cols-1 gap-mx-sm md:grid-cols-4">
          {['Região', 'Porte da Loja', 'Marca / Grupo', 'Segmento'].map((label, index) => (
            <div key={label} className="rounded-mx-xl border border-border-default bg-white px-mx-md py-mx-sm">
              <Typography variant="tiny" tone="muted" className="block font-black uppercase">{label}</Typography>
              <Typography variant="p" className="mt-mx-xs font-black">{index === 0 ? 'Sul' : index === 1 ? 'Médio' : index === 2 ? 'Todas' : 'Multimarcas'}</Typography>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">Indicadores Comparados</Typography>
          <div className="mt-mx-md overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                <tr>
                  <th className="px-mx-sm py-mx-sm">Indicador</th>
                  <th className="px-mx-sm py-mx-sm">Sua Loja</th>
                  <th className="px-mx-sm py-mx-sm">Benchmark</th>
                  <th className="px-mx-sm py-mx-sm">Melhor Grupo</th>
                  <th className="px-mx-sm py-mx-sm">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map(row => (
                  <tr key={row.label}>
                    <td className="px-mx-sm py-mx-sm font-black">{row.label}</td>
                    <td className="px-mx-sm py-mx-sm font-bold">{formatPlanningValue(row.store)}</td>
                    <td className="px-mx-sm py-mx-sm font-bold">{formatPlanningValue(row.group)}</td>
                    <td className="px-mx-sm py-mx-sm font-bold">{formatPlanningValue(row.best)}</td>
                    <td className="px-mx-sm py-mx-sm"><span className="rounded-mx-md border border-status-warning/20 bg-status-warning-surface px-mx-sm py-mx-xs text-mx-tiny font-black text-status-warning">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="space-y-mx-md">
          <MXScoreCompact score={mxScore} />
          <SideList title="Principais Oportunidades" items={['Reduzir estoque acima de 90 dias', 'Melhorar conversão de visitas em vendas', 'Aumentar giro de estoque']} />
        </div>
      </div>
    </div>
  )
}

function AgendaView({ alerts }: { alerts: OwnerPerformanceAlert[] }) {
  const agenda = [
    { time: '07:30', title: 'Revisão de Indicadores Diários', detail: 'Análise dos principais indicadores da loja', tone: 'info' as KpiTone },
    { time: '08:00', title: 'Reunião Matinal - Comercial', detail: 'Alinhamento de metas e ações da equipe comercial', tone: 'success' as KpiTone },
    { time: '09:00', title: 'Avaliação de Veículos', detail: 'Avaliação de estoque e precificação', tone: 'brand' as KpiTone },
    { time: '13:30', title: 'Revisão de Planos de Ação', detail: 'Acompanhamento das ações em andamento', tone: 'info' as KpiTone },
    { time: '16:00', title: alerts[0]?.title || 'Follow-up Clientes Prioritários', detail: alerts[0]?.action || 'Contato com clientes e negociações ativas', tone: alerts[0]?.variant === 'danger' ? 'danger' : 'warning' as KpiTone },
  ]

  return (
    <div className="space-y-mx-md">
      <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Agenda Executiva" subtitle="Visão diária, semanal e mensal dos compromissos e prioridades." />
        <div className="flex gap-mx-sm">
          <Button type="button" className="rounded-mx-xl"><Plus size={16} /> Novo Compromisso</Button>
          <Button type="button" variant="outline" className="rounded-mx-xl bg-white">Sincronizar Google</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">Maio 2026</Typography>
          <div className="mt-mx-md grid grid-cols-7 gap-mx-xs text-center text-xs font-black">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`} className="text-text-tertiary">{day}</span>)}
            {Array.from({ length: 35 }, (_, index) => (
              <span key={index} className={cn('rounded-mx-lg py-mx-xs', index === 18 ? 'bg-brand-primary text-white' : 'text-text-primary')}>{index + 1 <= 31 ? index + 1 : ''}</span>
            ))}
          </div>
          <SideList className="mt-mx-lg" title="Calendários" items={['Agenda Executiva', 'Reuniões', 'Visitas / Avaliações', 'Lembretes']} />
        </Card>
        <Card className="rounded-mx-2xl p-mx-lg">
          <Typography variant="h3" className="text-xl font-black">Segunda-feira, 19 de Maio</Typography>
          <div className="mt-mx-md space-y-mx-sm">
            {agenda.map(item => {
              const classes = toneClasses[item.tone]
              return (
                <div key={`${item.time}-${item.title}`} className={cn('grid grid-cols-[64px_minmax(0,1fr)] gap-mx-sm rounded-mx-xl border p-mx-md', classes.soft)}>
                  <Typography variant="p" className="font-black tabular-nums">{item.time}</Typography>
                  <div className="min-w-0">
                    <Typography variant="p" className="font-black">{item.title}</Typography>
                    <Typography variant="tiny" className="mt-mx-xs block font-bold opacity-80">{item.detail}</Typography>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        <div className="space-y-mx-md">
          <SideList title="Prioridades do Dia" items={agenda.slice(0, 3).map(item => item.title)} />
          <SideList title="Próximos Compromissos" items={['Reunião Diretores', 'Visita a Concessionária', 'Treinamento Equipe', 'Reunião Conselho']} />
          <SideList title="Lembretes" items={['Enviar relatório semanal', 'Renovar seguro dos veículos', 'Revisar contratos de financiamento']} />
        </div>
      </div>
    </div>
  )
}

function DepartmentsView({ departments }: { departments: DepartmentScore[] }) {
  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Departamentos" subtitle="Score por área e direcionamento de atenção." />
      <OwnerDepartmentScoreGrid departments={departments} />
    </div>
  )
}

function SummaryCard({
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

function ToolbarPlaceholder({ searchPlaceholder }: { searchPlaceholder: string }) {
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

function SideList({ title, items, className }: { title: string; items: string[]; className?: string }) {
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

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <Typography variant="h2" className="text-2xl md:text-3xl font-black text-text-primary">{title}</Typography>
      <Typography variant="p" tone="muted" className="mt-1 font-bold">{subtitle}</Typography>
    </div>
  )
}

function OwnerModuleGrid({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: Array<{ title: string; detail: string; icon: ReactNode; tone: KpiTone }>
}) {
  return (
    <div className="space-y-mx-md">
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-3">
        {items.map((item) => {
          const classes = toneClasses[item.tone]
          return (
            <Card key={item.title} className="min-h-[180px] rounded-mx-2xl p-mx-lg">
              <div className={cn('h-mx-12 w-mx-12 rounded-mx-xl flex items-center justify-center shadow-mx-sm', classes.bg)}>
                {item.icon}
              </div>
              <Typography variant="h3" className="mt-mx-md text-lg font-black">{item.title}</Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs text-sm font-bold">{item.detail}</Typography>
              <div className="mt-mx-md flex items-center gap-mx-xs text-brand-primary">
                <Typography variant="tiny" className="font-black uppercase">Abrir</Typography>
                <ChevronRight size={16} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default OwnerExecutiveCockpit
