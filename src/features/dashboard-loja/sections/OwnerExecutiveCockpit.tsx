import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Bell,
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
import {
  buildCentralMxEngine,
  type CentralMxActionPlanItem,
  type CentralMxDepartmentModule,
  type CentralMxIndicatorUnit,
  type CentralMxIndicatorValue,
} from '@/lib/central-mx-engine'
import type { ExecutiveAlert, MxDepartmentCode } from '@/lib/mx-executive-foundation'
import { cn } from '@/lib/utils'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'
import {
  CentralMxPersistedAgendaPanel,
  CentralMxPersistedAlertsPanel,
  CentralMxPersistedPlanosPanel,
} from './CentralMxPersistedPanels'
import { CentralMxBenchmarkInteractive } from './CentralMxBenchmarkInteractive'
import { CentralMxPlanoSegmentadoPanel } from './CentralMxPlanoSegmentadoPanel'
import { ConsultorIaStoreSection } from '@/features/central-mx/sections/ConsultorIaStoreSection'
import { PlanejamentoEstrategico } from '@/features/central-mx/sections/PlanejamentoEstrategico'
import { CentralMxHub } from '@/features/central-mx/sections/CentralMxHub'
import { DepartamentoDashboard } from '@/features/departamentos/sections/DepartamentoDashboard'
import type { DepartamentoCode } from '@/features/departamentos/hooks/useDepartamentoDashboard'
import { MarketingModulo } from '@/features/marketing/sections/MarketingModulo'
import { UniversidadeMx } from '@/features/universidade/sections/UniversidadeMx'
import { CulturaFelicidade } from '@/features/cultura-felicidade/sections/CulturaFelicidade'

type DashboardData = ReturnType<typeof useDashboardLojaData>

type OwnerExecutiveCockpitProps = {
  data: DashboardData
  alerts: OwnerPerformanceAlert[]
}

type KpiTone = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'brand' | 'purple'
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
  code: MxDepartmentCode
  name: string
  icon: ReactNode
  score: number | null
  status: string
  detail: string
  tone: KpiTone
  path: string
  indicators: CentralMxIndicatorValue[]
  dashboardCards: CentralMxDepartmentModule['dashboardCards']
  checklist: string[]
  playbook: string[]
  strategicAgenda: string[]
  alertCount: number
}

type ActionRow = {
  id: string
  priority: 'Crítica' | 'Atenção' | 'Positiva'
  department: string
  indicator: string
  problem: string
  recommendation: string
  action: string
  how: string
  owner: string
  origin: string
  due: string
  status: string
  efficacy: string
  evidence: string
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
  purple: {
    bg: 'bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple)] border border-[var(--color-accent-purple)]/20',
    text: 'text-[var(--color-accent-purple)]',
    soft: 'bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple)] border-[var(--color-accent-purple)]/20',
    bar: 'bg-[var(--color-accent-purple)]',
    border: 'border-[var(--color-accent-purple)]/20',
  },
}

/** Vivid solid backgrounds for KPI icon bubbles (mockup mode). */
const vividIconClasses: Record<KpiTone, string> = {
  success: 'bg-status-success text-white',
  info: 'bg-status-info text-white',
  warning: 'bg-status-warning text-white',
  danger: 'bg-status-error text-white',
  muted: 'bg-surface-alt text-text-tertiary',
  brand: 'bg-brand-primary text-white',
  purple: 'bg-[var(--color-accent-purple)] text-white',
}

/** Token per tone for SVG stroke/fill in sparklines. */
const toneHex: Record<KpiTone, () => string> = {
  success: chartTokens.success,
  info: chartTokens.info,
  warning: chartTokens.warning,
  danger: chartTokens.danger,
  muted: chartTokens.axisTickMuted,
  brand: chartTokens.accent,
  purple: chartTokens.series.s6,
}

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
  // ?id= eh redundante: o slug na URL ja identifica a loja unicamente
  params.delete('id')
  params.delete('ownerSection')
  const basePath = window.location.pathname.replace(/\/consultor-ia$/, '')
  if (section === 'consultor') {
    const query = params.toString()
    return `${basePath}/consultor-ia${query ? `?${query}` : ''}`
  }
  params.set('ownerSection', section)
  return `${basePath}?${params.toString()}`
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

function departmentIcon(code: MxDepartmentCode) {
  if (code === 'marketing') return <Megaphone size={20} />
  if (code === 'produto') return <Package size={20} />
  if (code === 'financeiro') return <DollarSign size={20} />
  if (code === 'operacional') return <Gauge size={20} />
  return <Users size={20} />
}

function departmentDetail(department: CentralMxDepartmentModule) {
  const complete = department.indicators.filter(item => item.status === 'completo').length
  const partial = department.indicators.filter(item => item.status === 'parcial').length
  return `${complete} completos, ${partial} parciais, ${department.alertCount} críticos`
}

function buildCentralMx(data: DashboardData, marginPercent: number | null) {
  return buildCentralMxEngine({
    storeId: data.operationalStore?.id || data.metrics.storeName || 'loja-mx',
    storeName: data.metrics.storeName,
    period: data.referenceDate.slice(0, 7),
    metrics: {
      totalSales: data.metrics.totalSales,
      totalLeads: data.metrics.totalLeads,
      totalAgd: data.metrics.totalAgd,
      totalVis: data.metrics.totalVis,
      attainment: data.metrics.attainment,
      goalValue: data.metrics.goalValue,
      checkedInCount: data.metrics.checkedInCount,
      sellerCount: data.sellers?.length || 0,
    },
    funnel: {
      leadToSchedule: data.funilData.tx_lead_agd,
      scheduleToVisit: data.funilData.tx_agd_visita,
      visitToSale: data.funilData.tx_visita_vnd,
    },
    benchmarks: {
      leadToSchedule: data.funnelBenchmarks.leadAgd,
      scheduleToVisit: data.funnelBenchmarks.agdVisita,
      visitToSale: data.funnelBenchmarks.visitaVnd,
    },
    financial: data.latestDRE
      ? {
        grossProfit: data.latestDRE.gross_profit,
        grossMarginPct: marginPercent,
        netProfit: data.latestDRE.net_profit,
        costPerSale: data.latestDRE.cac,
      }
      : null,
    ranking: data.metrics.ranking.map(row => ({
      userId: row.user_id,
      name: row.user_name,
      attainment: row.atingimento,
      sales: row.vnd_total,
      goal: row.meta,
      checkedIn: row.checked_in,
    })),
  })
}

function departmentFromEngine(department: CentralMxDepartmentModule): DepartmentScore {
  return {
    code: department.code,
    name: department.name,
    icon: departmentIcon(department.code),
    score: department.score,
    status: department.status,
    detail: departmentDetail(department),
    tone: scoreTone(department.score),
    path: ownerPath(`departamentos-${department.code}`),
    indicators: department.indicators,
    dashboardCards: department.dashboardCards,
    checklist: department.checklist,
    playbook: department.playbook,
    strategicAgenda: department.strategicAgenda,
    alertCount: department.alertCount,
  }
}

function alertFromEngine(alert: ExecutiveAlert): OwnerPerformanceAlert {
  const variant: OwnerPerformanceAlert['variant'] =
    alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : alert.type === 'positive' ? 'success' : 'outline'
  return {
    title: alert.problem,
    description: alert.impact,
    recommendation: alert.recommendation,
    action: alert.quickActionLabel,
    variant,
    impact: alert.type === 'critical' ? 'Alto' : alert.type === 'warning' ? 'Médio' : 'Baixo',
    ctaLabel: alert.quickActionLabel,
    ctaTo: ownerPath('plano-acao'),
  }
}

function actionPriorityLabel(priority: CentralMxActionPlanItem['priority']): ActionRow['priority'] {
  if (priority === 'critica') return 'Crítica'
  if (priority === 'alta') return 'Atenção'
  return 'Positiva'
}

function actionStatusLabel(status: CentralMxActionPlanItem['status']) {
  const labels: Record<CentralMxActionPlanItem['status'], string> = {
    pendente: 'Pendente',
    em_andamento: 'Em andamento',
    atrasado: 'Atrasada',
    concluido: 'Concluída',
    validando_eficacia: 'Validando eficácia',
  }
  return labels[status]
}

function actionOriginLabel(origin: CentralMxActionPlanItem['origin']) {
  const labels: Record<CentralMxActionPlanItem['origin'], string> = {
    alertas: 'Alerta',
    score: 'Score',
    consultor: 'Consultor MX',
    manual: 'Manual',
  }
  return labels[origin]
}

function actionFromEngine(action: CentralMxActionPlanItem): ActionRow {
  return {
    id: action.id,
    priority: actionPriorityLabel(action.priority),
    department: departmentLabel(action.department),
    indicator: action.indicator,
    problem: action.problem,
    recommendation: action.how,
    action: action.action,
    how: action.how,
    owner: action.responsibleLabel,
    origin: actionOriginLabel(action.origin),
    due: action.dueLabel,
    status: actionStatusLabel(action.status),
    efficacy: action.efficacyScore == null ? 'Pendente' : `${action.efficacyScore}%`,
    evidence: action.evidenceLabel,
    tone: action.priority === 'critica' ? 'danger' : action.priority === 'alta' ? 'warning' : action.status === 'validando_eficacia' ? 'success' : 'info',
  }
}

function departmentLabel(code: MxDepartmentCode) {
  const labels: Record<MxDepartmentCode, string> = {
    comercial: 'Comercial',
    marketing: 'Marketing',
    produto: 'Produto',
    financeiro: 'Financeiro',
    rh: 'RH',
    operacional: 'Operacional',
  }
  return labels[code]
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

function getOwnerDepartmentCode(search: string): MxDepartmentCode | null {
  const value = new URLSearchParams(search).get('ownerSection')
  const code = value?.startsWith('departamentos-') ? value.replace('departamentos-', '') : null
  if (
    code === 'comercial' ||
    code === 'marketing' ||
    code === 'produto' ||
    code === 'financeiro' ||
    code === 'rh' ||
    code === 'operacional'
  ) {
    return code
  }
  return null
}

export function OwnerExecutiveCockpit({ data, alerts }: OwnerExecutiveCockpitProps) {
  const { profile } = useAuth()
  const location = useLocation()
  const [planCreateRequest, setPlanCreateRequest] = useState(0)
  const periodLabel = currentPeriodLabel(data.referenceDate)
  const panoramaData = useMemo(() => buildPanoramaData(data), [data])
  const marginPercent = data.latestDRE && data.latestDRE.gross_margin > 0
    ? (data.latestDRE.net_sales_margin / data.latestDRE.gross_margin) * 100
    : null
  const centralMx = useMemo(() => buildCentralMx(data, marginPercent), [data, marginPercent])
  const departments = useMemo(() => centralMx.departments.map(departmentFromEngine), [centralMx.departments])
  const ownerAlerts = useMemo(() => {
    const generated = centralMx.alerts.map(alertFromEngine)
    return generated.length ? generated : alerts
  }, [alerts, centralMx.alerts])
  const actions = useMemo(() => centralMx.actionPlanItems.map(actionFromEngine), [centralMx.actionPlanItems])
  const mxScore = centralMx.scores.store.value
  const criticalAlerts = ownerAlerts.filter((alert) => alert.variant === 'danger' || alert.variant === 'warning')
  const section = getOwnerSection(location.search)
  const selectedDepartmentCode = getOwnerDepartmentCode(location.search)

  return (
    <section className="min-h-full bg-surface-alt p-mx-sm md:p-mx-lg space-y-mx-md">
      <OwnerCockpitHeader
        name={profile?.name || 'Diretor'}
        periodLabel={periodLabel}
        alertCount={criticalAlerts.length}
        storeName={data.metrics.storeName}
      />

      {section === 'home' && (
        <>
          <CentralMxHub storeId={data.operationalStore?.id || null} ownerPath={ownerPath} />
          <OwnerHome
            data={data}
            alerts={ownerAlerts}
            actions={actions}
            departments={departments}
            panoramaData={panoramaData}
            mxScore={mxScore}
            marginPercent={marginPercent}
          />
        </>
      )}
      {section === 'planejamento' && (
        <>
          <StrategicPlanningView data={data} planningIndicators={centralMx.planningIndicators} />
          <PlanejamentoEstrategico planningIndicators={centralMx.planningIndicators} periodLabel={periodLabel} />
        </>
      )}
      {section === 'resultados' && <ResultsView data={data} alerts={ownerAlerts} panoramaData={panoramaData} mxScore={mxScore} />}
      {section === 'plano-acao' && (
        <>
          <ActionPlanView
            actions={actions}
            onNewAction={() => setPlanCreateRequest((current) => current + 1)}
            disableNewAction={!data.operationalStore?.id}
          />
          <CentralMxPlanoSegmentadoPanel
            storeId={data.operationalStore?.id || null}
            createRequest={planCreateRequest}
          />
          <CentralMxPersistedPlanosPanel storeId={data.operationalStore?.id || null} />
        </>
      )}
      {section === 'alertas' && (
        <>
          <AlertsView alerts={ownerAlerts} />
          <CentralMxPersistedAlertsPanel storeId={data.operationalStore?.id || null} />
        </>
      )}
      {section === 'benchmarking' && (
        <>
          <BenchmarkingView data={data} mxScore={mxScore} marginPercent={marginPercent} />
          <CentralMxBenchmarkInteractive storeId={data.operationalStore?.id || null} />
        </>
      )}
      {section === 'agenda' && (
        <>
          <AgendaView alerts={ownerAlerts} />
          <CentralMxPersistedAgendaPanel storeId={data.operationalStore?.id || null} />
        </>
      )}
      {section === 'departamentos' && (
        <>
          <DepartmentsView departments={departments} selectedDepartmentCode={selectedDepartmentCode} />
          <DepartamentoDashboard
            storeId={data.operationalStore?.id || null}
            code={(selectedDepartmentCode ?? 'comercial') as DepartamentoCode}
            periodLabel={periodLabel}
          />
          {selectedDepartmentCode === 'marketing' && (
            <MarketingModulo storeId={data.operationalStore?.id || null} />
          )}
          {selectedDepartmentCode === 'rh' && (
            <CulturaFelicidade storeId={data.operationalStore?.id || null} />
          )}
        </>
      )}
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
        <>
          <UniversidadeMx userId={profile?.id ?? null} />
          <OwnerModuleGrid
            title="Biblioteca"
            subtitle="Conteúdos, playbooks e trilhas da Universidade MX."
            items={[
              { title: 'Playbooks comerciais', detail: 'Abordagem, follow-up e fechamento.', icon: <Target size={20} />, tone: 'brand' },
              { title: 'Treinamentos liberados', detail: 'Conteúdos para gerente e equipe.', icon: <Users size={20} />, tone: 'info' },
              { title: 'Materiais da consultoria', detail: 'Modelos e documentos de apoio.', icon: <ShieldCheck size={20} />, tone: 'success' },
            ]}
          />
        </>
      )}
      {section === 'consultor' && (
        <ConsultorIaStoreSection storeId={data.operationalStore?.id || null} />
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
        <OwnerKpiCard
          title="Lucro Bruto"
          value={formatCurrency(grossProfit)}
          detail={grossProfit === undefined ? 'DRE pendente' : '▲ vs mês anterior'}
          icon={<DollarSign size={20} />}
          tone={grossProfit === undefined ? 'muted' : 'success'}
          chart="line"
          seed={1}
        />
        <OwnerKpiCard
          title="% Margem"
          value={formatPercent(marginPercent)}
          detail={marginPercent === null ? 'DRE pendente' : '▲ 1,9 p.p.'}
          icon={<Gauge size={20} />}
          tone={marginPercent === null ? 'muted' : 'info'}
          chart="line"
          seed={2}
        />
        <OwnerKpiCard
          title="Volume de Vendas"
          value={`${formatInteger(data.metrics.totalSales)} ${data.metrics.totalSales === 1 ? 'veículo' : 'veículos'}`}
          detail={data.metrics.goalValue > 0 ? `${data.metrics.attainment}% da meta` : '▲ vs mês anterior'}
          icon={<ShoppingCart size={20} />}
          tone="purple"
          chart="bars"
          seed={3}
        />
        <OwnerKpiCard
          title="Estoque (Unid.)"
          value="Pendente"
          detail="Aguardando fonte"
          icon={<Box size={20} />}
          tone="warning"
          chart="line"
          seed={4}
        />
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

function MXScoreCompact({ score }: { score: number | null }) {
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

function OwnerSemiGauge({ value }: { value: number }) {
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

function StrategicPlanningView({
  data,
  planningIndicators,
}: {
  data: DashboardData
  planningIndicators: CentralMxIndicatorValue[]
}) {
  const complete = planningIndicators.filter(indicator => indicator.status === 'completo').length
  const partial = planningIndicators.filter(indicator => indicator.status === 'parcial').length
  const pending = planningIndicators.filter(indicator => indicator.status === 'pendente').length

  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Planejamento Estratégico" subtitle="45 indicadores com Meta, Realizado e Ano Anterior por departamento." />
      <div className="grid grid-cols-1 gap-mx-md md:grid-cols-2 xl:grid-cols-5">
        <OwnerKpiCard title="Indicadores" value={formatInteger(planningIndicators.length)} detail="matriz estratégica" icon={<BarChart3 size={22} />} tone="brand" />
        <OwnerKpiCard title="Completos" value={formatInteger(complete)} detail="meta, realizado e ano anterior" icon={<CheckCircle2 size={22} />} tone={complete > 0 ? 'success' : 'muted'} />
        <OwnerKpiCard title="Parciais" value={formatInteger(partial)} detail="faltam campos de planejamento" icon={<Clock3 size={22} />} tone={partial > 0 ? 'warning' : 'muted'} />
        <OwnerKpiCard title="Pendentes" value={formatInteger(pending)} detail="precisam de fonte ou meta" icon={<AlertTriangle size={22} />} tone={pending > 0 ? 'danger' : 'success'} />
        <OwnerKpiCard title="Loja" value={data.metrics.storeName} detail={currentPeriodLabel(data.referenceDate)} icon={<Target size={22} />} tone="info" />
      </div>
      <Card className="rounded-mx-2xl p-mx-lg">
        <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
          <Typography variant="h3" className="text-xl font-black">Matriz Meta / Realizado / Ano Anterior</Typography>
          <Button type="button" variant="outline" className="h-mx-10 rounded-mx-xl bg-white"><Download size={16} /> Exportar</Button>
        </div>
        <div className="mt-mx-md overflow-x-auto">
          <table className="min-w-[1080px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                <th className="border border-border-subtle px-mx-sm py-mx-sm">Departamento</th>
                <th className="border border-border-subtle px-mx-sm py-mx-sm">Indicador</th>
                <th className="border border-border-subtle px-mx-sm py-mx-sm text-center">Meta</th>
                <th className="border border-border-subtle px-mx-sm py-mx-sm text-center">Realizado</th>
                <th className="border border-border-subtle px-mx-sm py-mx-sm text-center">Ano Anterior</th>
                <th className="border border-border-subtle px-mx-sm py-mx-sm text-center">Score</th>
                <th className="border border-border-subtle px-mx-sm py-mx-sm text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {planningIndicators.map((indicator) => (
                <tr key={indicator.code}>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm font-black">{departmentLabel(indicator.department)}</td>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm font-black">{indicator.label}</td>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm text-center font-bold tabular-nums">{formatPlanningValue(indicator.meta, indicator.unit)}</td>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm text-center font-bold tabular-nums">{formatPlanningValue(indicator.realizado, indicator.unit)}</td>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm text-center font-bold tabular-nums">{formatPlanningValue(indicator.anoAnterior, indicator.unit)}</td>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm text-center font-black tabular-nums">{indicator.score ?? '--'}</td>
                  <td className="border border-border-subtle px-mx-sm py-mx-sm text-center">
                    <span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', planningStatusTone(indicator.status))}>
                      {indicator.status === 'completo' ? 'Completo' : indicator.status === 'parcial' ? 'Parcial' : 'Pendente'}
                    </span>
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

function planningStatusTone(status: CentralMxIndicatorValue['status']) {
  if (status === 'completo') return toneClasses.success.soft
  if (status === 'parcial') return toneClasses.warning.soft
  return toneClasses.muted.soft
}

function formatPlanningValue(value: number | null | undefined, unit?: CentralMxIndicatorUnit) {
  if (value === null || typeof value === 'undefined' || Number.isNaN(value)) return '--'
  if (unit === 'currency') return formatCurrency(value)
  if (unit === 'percent') return formatPercent(value)
  if (unit === 'days') return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`
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

function ActionPlanView({
  actions,
  onNewAction,
  disableNewAction,
}: {
  actions: ActionRow[]
  onNewAction: () => void
  disableNewAction: boolean
}) {
  const handleExport = () => {
    const headers = [
      'Prioridade',
      'Departamento',
      'Indicador',
      'Problema',
      'Ação',
      'Como',
      'Responsável',
      'Prazo',
      'Status',
      'Eficácia',
      'Origem',
      'Evidência',
    ]
    const rows = actions.map((action) => [
      action.priority,
      action.department,
      action.indicator,
      action.problem,
      action.action,
      action.how,
      action.owner,
      action.due,
      action.status,
      action.efficacy,
      action.origin,
      action.evidence,
    ])
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(';')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'plano-de-acao.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-mx-md">
      <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Plano de Ação" subtitle="Transforme problemas em execução e acompanhe eficácia." />
        <div className="flex gap-mx-sm">
          <Button type="button" className="rounded-mx-xl" onClick={onNewAction} disabled={disableNewAction}>
            <Plus size={16} /> Nova Ação
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-mx-xl bg-white"
            onClick={handleExport}
            disabled={actions.length === 0}
          >
            <Download size={16} /> Exportar
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-mx-2xl p-mx-lg">
          <ToolbarPlaceholder searchPlaceholder="Buscar ação, problema ou indicador..." />
          <div className="mt-mx-md overflow-x-auto">
            <table className="min-w-[1480px] w-full text-sm">
              <thead className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                <tr>
                  <th className="px-mx-sm py-mx-sm">Prioridade</th>
                  <th className="px-mx-sm py-mx-sm">Departamento</th>
                  <th className="px-mx-sm py-mx-sm">Indicador</th>
                  <th className="px-mx-sm py-mx-sm">Problema</th>
                  <th className="px-mx-sm py-mx-sm">Ação</th>
                  <th className="px-mx-sm py-mx-sm">Como</th>
                  <th className="px-mx-sm py-mx-sm">Responsável</th>
                  <th className="px-mx-sm py-mx-sm">Prazo</th>
                  <th className="px-mx-sm py-mx-sm">Status</th>
                  <th className="px-mx-sm py-mx-sm">Eficácia</th>
                  <th className="px-mx-sm py-mx-sm">Origem</th>
                  <th className="px-mx-sm py-mx-sm">Evidência</th>
                  <th className="px-mx-sm py-mx-sm">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {actions.map((action, index) => {
                  const classes = toneClasses[action.tone]
                  return (
                    <tr key={`${action.id}-${index}`}>
                      <td className="px-mx-sm py-mx-sm"><span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{action.priority}</span></td>
                      <td className="px-mx-sm py-mx-sm font-black">{action.department}</td>
                      <td className="px-mx-sm py-mx-sm text-text-secondary">{action.indicator}</td>
                      <td className="px-mx-sm py-mx-sm font-black">{action.problem}</td>
                      <td className="px-mx-sm py-mx-sm text-text-secondary">{action.action}</td>
                      <td className="px-mx-sm py-mx-sm text-text-secondary">{action.how}</td>
                      <td className="px-mx-sm py-mx-sm font-bold">{action.owner}</td>
                      <td className={cn('px-mx-sm py-mx-sm font-black', classes.text)}>{action.due}</td>
                      <td className="px-mx-sm py-mx-sm"><span className={cn('rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', classes.soft)}>{action.status}</span></td>
                      <td className="px-mx-sm py-mx-sm font-bold">{action.efficacy}</td>
                      <td className="px-mx-sm py-mx-sm">{action.origin}</td>
                      <td className="px-mx-sm py-mx-sm text-text-secondary">{action.evidence}</td>
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

function DepartmentsView({
  departments,
  selectedDepartmentCode,
}: {
  departments: DepartmentScore[]
  selectedDepartmentCode: MxDepartmentCode | null
}) {
  const selectedDepartment = departments.find(department => department.code === selectedDepartmentCode) || departments[0]
  return (
    <div className="space-y-mx-md">
      <SectionTitle title="Departamentos" subtitle="Marketing, produto, financeiro, RH, operações e comercial com indicadores, rotina e playbook." />
      <OwnerDepartmentScoreGrid departments={departments} />
      {selectedDepartment && (
        <div className="grid grid-cols-1 gap-mx-md xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-mx-2xl p-mx-lg">
            <div className="flex flex-col gap-mx-sm md:flex-row md:items-start md:justify-between">
              <div>
                <Typography variant="h3" className="text-xl font-black">{selectedDepartment.name}</Typography>
                <Typography variant="p" tone="muted" className="mt-1 font-bold">{selectedDepartment.detail}</Typography>
              </div>
              <span className={cn('w-fit rounded-mx-md border px-mx-sm py-mx-xs text-mx-tiny font-black', toneClasses[selectedDepartment.tone].soft)}>
                Score {selectedDepartment.score ?? '--'} · {selectedDepartment.status}
              </span>
            </div>
            <div className="mt-mx-md grid grid-cols-1 gap-mx-sm md:grid-cols-2 xl:grid-cols-4">
              {selectedDepartment.dashboardCards.map(card => (
                <div key={card.label} className="rounded-mx-xl border border-border-default bg-white p-mx-md">
                  <Typography variant="tiny" tone="muted" className="block font-black uppercase">{card.label}</Typography>
                  <Typography variant="h3" className="mt-mx-xs font-black tabular-nums">{formatPlanningValue(card.value, card.unit)}</Typography>
                  <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold">
                    {card.status === 'completo' ? 'Completo' : card.status === 'parcial' ? 'Parcial' : 'Pendente'}
                  </Typography>
                </div>
              ))}
            </div>
            <div className="mt-mx-lg overflow-x-auto">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-surface-alt text-left text-mx-tiny font-black uppercase text-text-secondary">
                  <tr>
                    <th className="px-mx-sm py-mx-sm">Indicador</th>
                    <th className="px-mx-sm py-mx-sm">Meta</th>
                    <th className="px-mx-sm py-mx-sm">Realizado</th>
                    <th className="px-mx-sm py-mx-sm">Ano anterior</th>
                    <th className="px-mx-sm py-mx-sm">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {selectedDepartment.indicators.map(indicator => (
                    <tr key={indicator.code}>
                      <td className="px-mx-sm py-mx-sm font-black">{indicator.label}</td>
                      <td className="px-mx-sm py-mx-sm font-bold tabular-nums">{formatPlanningValue(indicator.meta, indicator.unit)}</td>
                      <td className="px-mx-sm py-mx-sm font-bold tabular-nums">{formatPlanningValue(indicator.realizado, indicator.unit)}</td>
                      <td className="px-mx-sm py-mx-sm font-bold tabular-nums">{formatPlanningValue(indicator.anoAnterior, indicator.unit)}</td>
                      <td className="px-mx-sm py-mx-sm font-black tabular-nums">{indicator.score ?? '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="space-y-mx-md">
            <SideList title="Checklist do Departamento" items={selectedDepartment.checklist} />
            <SideList title="Playbook Operacional" items={selectedDepartment.playbook} />
            <SideList title="Agenda Estratégica" items={selectedDepartment.strategicAgenda} />
          </div>
        </div>
      )}
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
