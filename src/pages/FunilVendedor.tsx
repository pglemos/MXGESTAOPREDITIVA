import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BarChart3, CalendarDays, Filter, Gauge, Globe2, Info, Target, TrendingUp, Users, Warehouse } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
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
import { PageHeading } from '@/components/molecules/PageHeading'
import { useAuth } from '@/hooks/useAuth'
import { chartTokens } from '@/lib/charts/tokens'
import { supabase } from '@/lib/supabase'
import {
  buildCurrentMonthRange,
  buildFunnelDashboard,
  buildLastMonthRange,
  buildLastThreeMonthsRange,
  formatPercent,
  type ChannelFunnel,
  type FunnelDashboard,
  type FunnelRow,
  type FunnelStepKey,
  type PeriodRange,
} from '@/features/crm/lib/funil-vendas-diagnostico'

type PeriodKey = 'current_month' | 'last_month' | 'last_3_months'
type Confidence = 'Alta' | 'Média' | 'Baixa'

const confidenceToneClass: Record<Confidence, string> = {
  Alta: 'border-status-success/30 bg-status-success-surface text-status-success',
  Média: 'border-status-warning/30 bg-status-warning-surface text-status-warning',
  Baixa: 'border-border-subtle bg-white text-text-tertiary',
}
type Tone = 'green' | 'blue' | 'orange'

type SourceRows = {
  events: FunnelRow[]
  customers: FunnelRow[]
  storeConfigs: FunnelRow[]
}

type ReadResult = {
  data: unknown
  error: { message?: string } | null
}

type ReadOnlyTable = {
  select: (columns: string) => {
    limit: (count: number) => Promise<ReadResult>
  }
}

type ChannelEffort = {
  channel: ChannelFunnel['channel']
  ok: boolean
  message: string
  rows: Array<{ label: string; value: number }>
  conversionLabel: string
}

const readOnlyDb = supabase as unknown as {
  from: (table: string) => ReadOnlyTable
}

const emptyRows: SourceRows = {
  events: [],
  customers: [],
  storeConfigs: [],
}

const periodLabels: Record<PeriodKey, string> = {
  current_month: 'Este mês',
  last_month: 'Mês passado',
  last_3_months: 'Últimos 3 meses',
}

const kpiCopy = [
  { key: 'meta', label: 'Meta do mês' },
  { key: 'realizado', label: 'Realizado' },
  { key: 'faltam', label: 'Faltam' },
  { key: 'diasUteisRestantes', label: 'Dias úteis restantes' },
  { key: 'necessarioPorDia', label: 'Necessário por dia' },
  { key: 'probabilidade', label: 'Probabilidade de meta' },
] as const

const channelUi: Record<ChannelFunnel['channel'], { icon: ReactNode; tone: Tone }> = {
  Showroom: { icon: <Warehouse size={22} />, tone: 'orange' },
  Internet: { icon: <Globe2 size={22} />, tone: 'blue' },
  Carteira: { icon: <Users size={22} />, tone: 'green' },
}

const toneClass: Record<Tone, { text: string; soft: string; border: string; badge: string }> = {
  blue: { text: 'text-status-info', soft: 'bg-status-info-surface', border: 'border-status-info/20', badge: 'bg-status-info/10 text-status-info' },
  orange: { text: 'text-status-warning', soft: 'bg-status-warning-surface', border: 'border-status-warning/20', badge: 'bg-status-warning/10 text-status-warning' },
  green: { text: 'text-status-success', soft: 'bg-status-success-surface', border: 'border-status-success/20', badge: 'bg-status-success/10 text-status-success' },
}

async function readRows(table: string): Promise<{ rows: FunnelRow[]; error: string | null }> {
  try {
    const { data, error } = await readOnlyDb.from(table).select('*').limit(5000)
    if (error) return { rows: [], error: error.message || `Falha ao ler ${table}.` }
    return { rows: Array.isArray(data) ? (data as FunnelRow[]) : [], error: null }
  } catch (err) {
    return { rows: [], error: err instanceof Error ? err.message : `Falha ao ler ${table}.` }
  }
}

function resolvePeriod(period: PeriodKey): PeriodRange {
  if (period === 'last_month') return buildLastMonthRange()
  if (period === 'last_3_months') return buildLastThreeMonthsRange()
  return buildCurrentMonthRange()
}

function rowMatchesStore(row: FunnelRow, storeId: string | null) {
  if (!storeId) return true
  const value = row.store_id ?? row.loja_id
  return value === storeId
}

/**
 * Meta do vendedor = regras_metas_loja.monthly_goal da loja ativa, sem
 * rateio — mesma regra já usada pela RPC upsert_funnel_metrics_snapshot
 * (supabase/migrations/20260617009000_funnel_metrics_snapshot.sql).
 * Não existe tabela "metas" por vendedor/mês no schema real.
 */
function resolveStoreMonthlyGoal(storeConfig: FunnelRow | null): number | null {
  if (!storeConfig) return null
  const raw = storeConfig.monthly_goal
  const value = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatKpiValue(dashboard: FunnelDashboard, key: (typeof kpiCopy)[number]['key']) {
  const { kpis } = dashboard
  if (key === 'meta') return kpis.meta === null ? 'Meta não configurada' : kpis.meta.toLocaleString('pt-BR')
  if (key === 'realizado') return kpis.realizado.toLocaleString('pt-BR')
  if (key === 'faltam') {
    if (kpis.meta === null) return '—'
    return kpis.metaBatida ? 'Meta batida' : (kpis.faltam ?? 0).toLocaleString('pt-BR')
  }
  if (key === 'diasUteisRestantes') return kpis.diasUteisRestantes.toLocaleString('pt-BR')
  if (key === 'necessarioPorDia') {
    if (kpis.metaBatida) return 'Meta batida'
    return kpis.necessarioPorDia === null ? '—' : kpis.necessarioPorDia.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }
  return kpis.probabilidade === null ? '—' : `${kpis.probabilidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

export default function FunilVendedor() {
  const { supabaseUser, profile, storeId, activeStoreId } = useAuth()
  const effectiveStoreId = activeStoreId || storeId || profile?.store_id || null
  const sellerIds = useMemo(() => [supabaseUser?.id, profile?.id].filter((id): id is string => Boolean(id)), [profile?.id, supabaseUser?.id])
  const [periodKey, setPeriodKey] = useState<PeriodKey>('current_month')
  const [rows, setRows] = useState<SourceRows>(emptyRows)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [events, customers, storeConfigs] = await Promise.all([
      readRows('eventos_comerciais'),
      readRows('clientes_oportunidades'),
      readRows('regras_metas_loja'),
    ])
    setRows({ events: events.rows, customers: customers.rows, storeConfigs: storeConfigs.rows })
    setErrors([events.error, customers.error, storeConfigs.error].filter((error): error is string => Boolean(error)))
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const period = useMemo(() => resolvePeriod(periodKey), [periodKey])
  const dashboard = useMemo(
    () => buildDashboard(rows, sellerIds, effectiveStoreId, period),
    [effectiveStoreId, period, rows, sellerIds],
  )
  const selectedHasBase = hasEnoughBase(dashboard)
  const rollingPeriod = useMemo(() => buildLastThreeMonthsRange(), [])
  const rollingDashboard = useMemo(
    () => buildDashboard(rows, sellerIds, effectiveStoreId, rollingPeriod),
    [effectiveStoreId, rollingPeriod, rows, sellerIds],
  )
  const rollingHasBase = hasEnoughBase(rollingDashboard)
  const confidence = getConfidence(selectedHasBase, rollingHasBase)
  const calculationDashboard = selectedHasBase ? dashboard : rollingDashboard
  const calculationPeriodLabel = selectedHasBase ? periodLabels[periodKey] : 'Últimos 3 meses'
  const projection = buildProjection(dashboard)
  const efforts = calculationDashboard.channels.map(channel => buildChannelEffort(channel, dashboard.kpis.faltam ?? 0))
  const limitador = getPrincipalLimitador(dashboard)
  const showEmptyState = !loading && !dashboard.hasFunnelData

  return (
    <main className="min-h-full bg-surface-alt px-mx-sm py-mx-md sm:px-mx-md lg:px-mx-lg">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-mx-lg">
        <PageHeading
          title="Funil de Vendas"
          subtitle={`Com sua conversão atual, veja o que precisa produzir para atingir a meta • ${formatDate(period.start)} até ${formatDate(period.end)}`}
          actions={(
            <label className="inline-flex h-11 items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-md text-sm font-semibold shadow-mx-xs">
              <Filter size={16} />
              <select
                value={periodKey}
                onChange={(event) => setPeriodKey(event.target.value as PeriodKey)}
                className="bg-transparent font-semibold outline-none"
                aria-label="Filtro de período"
              >
                {Object.entries(periodLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          )}
        />

        <section aria-label="Filtro de período">
          <div className="inline-flex flex-wrap gap-mx-xs rounded-mx-md border border-border-subtle bg-white p-mx-xs shadow-mx-sm">
            {Object.entries(periodLabels).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`h-9 rounded-mx-md px-mx-md text-sm font-semibold transition ${periodKey === key ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-surface-alt'}`}
                onClick={() => setPeriodKey(key as PeriodKey)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {errors.length > 0 && (
          <div role="status" className="rounded-mx-2xl border border-status-warning/20 bg-status-warning-surface p-mx-md text-sm font-semibold text-status-warning">
            Algumas fontes ainda não retornaram dados. A tela continua somente leitura e mostra vazio quando base não existe.
          </div>
        )}

        <section className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-6" aria-label="Indicadores da meta">
          {kpiCopy.map(item => (
            <MetricCard key={item.key} label={item.label} value={loading ? '—' : formatKpiValue(dashboard, item.key)} icon={item.key === 'meta' ? <Target size={17} /> : item.key === 'probabilidade' ? <TrendingUp size={17} /> : <CalendarDays size={17} />} />
          ))}
        </section>

        <ProjectionCard projection={projection} />

        {showEmptyState && (
          <DashboardCard className="border-status-warning/20 bg-status-warning-surface">
            <Typography variant="h3" className="text-lg font-black text-text-primary">Sem base suficiente para montar o funil neste período.</Typography>
            <Typography variant="p" className="mt-1 text-sm font-semibold text-text-secondary">Os dados comerciais ainda não têm volume suficiente para projeção confiável.</Typography>
          </DashboardCard>
        )}

        <section>
          <SectionHeader icon={<Target size={22} />} title="Esforço necessário meta" subtitle="Com base na sua conversão atual, esta é a produção necessária para buscar as vendas que faltam." />
          {dashboard.kpis.metaBatida ? (
            <DashboardCard className="mt-mx-sm border-status-success/20 bg-status-success-surface">
              <Typography variant="p" className="font-semibold text-status-success">Meta batida. Continue mantendo o ritmo.</Typography>
            </DashboardCard>
          ) : (
            <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-3">
              {efforts.map(effort => <EffortCard key={effort.channel} effort={effort} />)}
            </div>
          )}
        </section>

        <section>
          <SectionHeader icon={<Gauge size={22} />} title="Eficiência por canal" subtitle="Etapas compactas do período selecionado." />
          <div className="mt-mx-sm grid gap-mx-md xl:grid-cols-3">
            {dashboard.channels.map(channel => <EfficiencyCard key={channel.channel} channel={channel} />)}
          </div>
          <DashboardCard className="mt-mx-sm">
            <div className="flex items-start gap-mx-sm">
              <span className="mt-1 text-brand-primary"><Info size={20} /></span>
              <div>
                <Typography variant="h3">Principal limitador</Typography>
                <Typography variant="p" className="mt-1 text-sm font-semibold text-text-secondary">{limitador}</Typography>
              </div>
            </div>
          </DashboardCard>
        </section>

        <StatisticalBaseCard displayedPeriod={periodLabels[periodKey]} calculationPeriod={calculationPeriodLabel} confidence={confidence} />
        <HistoryChart dashboard={dashboard} />
      </div>
    </main>
  )
}

function buildDashboard(rows: SourceRows, sellerIds: string[], storeId: string | null, period: PeriodRange) {
  const storeConfig = rows.storeConfigs.find(row => rowMatchesStore(row, storeId)) || null
  const meta = resolveStoreMonthlyGoal(storeConfig)
  return buildFunnelDashboard({
    events: rows.events,
    customers: rows.customers,
    period,
    sellerIds,
    storeId,
    meta,
    storeConfig,
  })
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card className="rounded-mx-2xl p-mx-md">
      <div className="mb-mx-sm flex items-center justify-between gap-mx-sm text-brand-primary">
        <Typography variant="caption" className="text-text-tertiary">{label}</Typography>
        {icon}
      </div>
      <Typography variant="h3" className="break-words text-2xl font-black text-text-primary">{value}</Typography>
    </Card>
  )
}

function ProjectionCard({ projection }: { projection: { projected: number | null; meta: number | null; difference: number | null; status: string } }) {
  return (
    <DashboardCard>
      <div className="grid gap-mx-md lg:grid-cols-[1fr_1fr_1fr_1.2fr] lg:items-center">
        <div>
          <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">Projeção mês</Typography>
          <Typography variant="h2" className="mt-1 text-2xl">Previsão no ritmo atual</Typography>
        </div>
        <ProjectionStat label="Previsão de vendas" value={projection.projected === null ? '—' : `${projection.projected} vendas`} />
        <ProjectionStat label="Meta do mês" value={projection.meta === null ? 'Meta não configurada' : `${projection.meta} vendas`} />
        <ProjectionStat label="Diferença projetada" value={projection.difference === null ? '—' : `${projection.difference >= 0 ? '+' : ''}${projection.difference} vendas`} hint={projection.status} tone={projection.difference !== null && projection.difference >= 0 ? 'green' : 'orange'} />
      </div>
    </DashboardCard>
  )
}

function EffortCard({ effort }: { effort: ChannelEffort }) {
  const ui = channelUi[effort.channel]
  const tone = toneClass[ui.tone]
  return (
    <Card className={`rounded-mx-2xl border ${tone.border} p-mx-lg`}>
      <div className="flex items-start gap-mx-sm">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-mx-md ${tone.badge}`}>{ui.icon}</span>
        <div>
          <Typography variant="h3" className={`text-lg font-black ${tone.text}`}>{effort.channel}</Typography>
          <Typography variant="caption" className="text-text-tertiary">{channelFlow(effort.channel)}</Typography>
        </div>
      </div>
      <Typography variant="p" className="mt-mx-md text-sm font-semibold text-text-primary">{effort.message}</Typography>
      {effort.ok && <div className="mt-mx-sm grid gap-mx-xs">{effort.rows.map(row => <CompactRow key={row.label} label={row.label} value={row.value.toLocaleString('pt-BR')} />)}</div>}
      <div className={`mt-mx-md rounded-mx-md px-mx-sm py-mx-xs text-sm font-semibold ${tone.soft} ${tone.text}`}>{effort.conversionLabel}</div>
    </Card>
  )
}

function EfficiencyCard({ channel }: { channel: ChannelFunnel }) {
  const ui = channelUi[channel.channel]
  const tone = toneClass[ui.tone]
  return (
    <Card className={`rounded-mx-2xl border ${tone.border} p-mx-lg`}>
      <div className="mb-mx-md flex items-center justify-between gap-mx-md">
        <div className="flex items-center gap-mx-sm">
          <span className={tone.text}>{ui.icon}</span>
          <Typography variant="h3" className="text-xl font-black text-text-primary">{channel.channel}</Typography>
        </div>
        <span className={`rounded-mx-md px-mx-sm py-1 text-xs font-black ${tone.badge}`}>{formatPercent(channel.generalConversion)}</span>
      </div>
      <div className="grid gap-mx-xs">
        {channel.steps.map(step => <CompactRow key={step.key} label={step.label} value={step.value.toLocaleString('pt-BR')} />)}
      </div>
      <Typography variant="caption" className="mt-mx-md block text-text-tertiary">Conversão geral: {formatPercent(channel.generalConversion)}</Typography>
    </Card>
  )
}

function StatisticalBaseCard({ displayedPeriod, calculationPeriod, confidence }: { displayedPeriod: string; calculationPeriod: string; confidence: Confidence }) {
  return (
    <DashboardCard>
      <SectionHeader icon={<Info size={22} />} title="Base estatística" />
      <div className="mt-mx-sm grid gap-mx-sm md:grid-cols-4">
        <BaseStat label="Período exibido" value={displayedPeriod} />
        <BaseStat label="Período usado para cálculo" value={calculationPeriod} />
        <div className="rounded-mx-md border border-border-subtle bg-surface-alt p-mx-sm">
          <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">Confiança da projeção</Typography>
          <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${confidenceToneClass[confidence]}`}>{confidence}</span>
        </div>
        <BaseStat label="Motivo da confiança" value={confidenceReason(confidence)} />
      </div>
    </DashboardCard>
  )
}

function HistoryChart({ dashboard }: { dashboard: FunnelDashboard }) {
  return (
    <DashboardCard>
      <SectionHeader icon={<BarChart3 size={22} />} title="Evolução dos últimos 6 meses" subtitle="Oportunidades, Atendimento Comercial e Vendas." />
      <div className="mt-mx-md h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dashboard.evolution}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTokens.grid()} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: chartTokens.axisTick() }} />
            <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 12, fontWeight: 700, fill: chartTokens.axisTick() }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgb(226 232 240)', boxShadow: '0 12px 30px rgba(15,23,42,0.12)' }} />
            <Legend iconType="circle" />
            <Line type="monotone" dataKey="oportunidades" name="Oportunidades" stroke={chartTokens.primary()} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="atendimentos" name="Atendimento Comercial" stroke={chartTokens.accent()} strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="vendas" name="Vendas" stroke={chartTokens.warning()} strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}

function ProjectionStat({ label, value, hint, tone = 'dark' }: { label: string; value: string; hint?: string; tone?: 'dark' | 'green' | 'orange' }) {
  const color = tone === 'green' ? 'text-status-success' : tone === 'orange' ? 'text-status-warning' : 'text-text-primary'
  return <div className="rounded-mx-md border border-border-subtle bg-surface-alt p-mx-sm"><Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">{label}</Typography><Typography variant="h3" className={`mt-1 ${color}`}>{value}</Typography>{hint && <Typography variant="p" className="mt-1 text-sm font-semibold text-text-secondary">{hint}</Typography>}</div>
}

function BaseStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-mx-md border border-border-subtle bg-surface-alt p-mx-sm"><Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">{label}</Typography><Typography variant="p" className="mt-1 text-sm font-semibold text-text-primary">{value}</Typography></div>
}

function CompactRow({ label, value }: { label: string; value: string }) {
  return <div className="flex min-h-8 items-center justify-between gap-mx-sm rounded-mx-md bg-surface-alt px-mx-sm py-1"><Typography variant="p" className="text-sm font-semibold text-text-secondary">{label}</Typography><Typography variant="p" className="text-sm font-bold text-text-primary">{value}</Typography></div>
}

function SectionHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return <div className="flex items-start gap-mx-sm"><span className="mt-1 text-brand-primary">{icon}</span><div><Typography variant="h2" className="text-xl">{title}</Typography>{subtitle && <Typography variant="p" className="mt-1 text-sm font-semibold text-text-secondary">{subtitle}</Typography>}</div></div>
}

function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Card className={`rounded-mx-2xl p-mx-lg ${className}`}>{children}</Card>
}

function buildProjection(dashboard: FunnelDashboard) {
  const { kpis } = dashboard
  const projected = kpis.meta !== null && kpis.probabilidade !== null ? Math.round((kpis.meta * kpis.probabilidade) / 100) : kpis.realizado
  const difference = kpis.meta === null ? null : projected - kpis.meta
  return { projected, meta: kpis.meta, difference, status: projectionStatus(kpis.meta, projected) }
}

function projectionStatus(meta: number | null, projected: number | null) {
  if (meta === null || projected === null) return 'Sem base suficiente'
  if (projected >= meta) return 'Acima do ritmo da meta'
  if (projected >= Math.ceil(meta * 0.9)) return 'No limite da meta'
  return 'Abaixo do ritmo necessário'
}

function buildChannelEffort(channel: ChannelFunnel, vendasFaltantes: number): ChannelEffort {
  if (vendasFaltantes <= 0) return { channel: channel.channel, ok: true, message: 'Meta batida. Continue mantendo o ritmo.', rows: [], conversionLabel: `Conversão geral: ${formatPercent(channel.generalConversion)}` }
  if (channel.channel === 'Showroom') {
    const atendimento = stepValue(channel, 'atendimento_comercial')
    const venda = stepValue(channel, 'venda')
    const convVenda = ratio(venda, atendimento)
    if (!hasEnoughChannel(channel) || !convVenda) return insufficientEffort(channel, 'Sem base suficiente para calcular o esforço no Showroom.')
    return { channel: channel.channel, ok: true, message: 'Para buscar as vendas que faltam, você precisa de aproximadamente:', rows: [{ label: 'Atendimentos Comerciais', value: Math.ceil(vendasFaltantes / convVenda) }], conversionLabel: `Sua conversão atual: ${formatPercent(convVenda * 100)}` }
  }
  if (channel.channel === 'Internet') {
    const oportunidades = stepValue(channel, 'oportunidades')
    const qualificados = stepValue(channel, 'qualificados')
    const agendamentos = stepValue(channel, 'agendamento')
    const atendimentos = stepValue(channel, 'atendimento_comercial')
    const vendas = stepValue(channel, 'venda')
    const convQualificacao = ratio(qualificados, oportunidades)
    const convAgendamento = ratio(agendamentos, qualificados)
    const convAtendimento = ratio(atendimentos, agendamentos)
    const convVenda = ratio(vendas, atendimentos)
    if (!hasEnoughChannel(channel) || !convQualificacao || !convAgendamento || !convAtendimento || !convVenda) return insufficientEffort(channel, 'Sem base suficiente para calcular uma projeção confiável neste canal.')
    const atendimentosNec = Math.ceil(vendasFaltantes / convVenda)
    const agendamentosNec = Math.ceil(atendimentosNec / convAtendimento)
    const qualificadosNec = Math.ceil(agendamentosNec / convAgendamento)
    return {
      channel: channel.channel,
      ok: true,
      message: 'Para buscar as vendas que faltam, você precisa gerar aproximadamente:',
      rows: [
        { label: 'Atendimentos Comerciais', value: atendimentosNec },
        { label: 'Agendamentos', value: agendamentosNec },
        { label: 'Qualificados', value: qualificadosNec },
        { label: 'Oportunidades', value: Math.ceil(qualificadosNec / convQualificacao) },
      ],
      conversionLabel: `Conversão geral: ${formatPercent(channel.generalConversion)}`,
    }
  }
  const qualificados = stepValue(channel, 'qualificados')
  const agendamentos = stepValue(channel, 'agendamento')
  const atendimentos = stepValue(channel, 'atendimento_comercial')
  const vendas = stepValue(channel, 'venda')
  const convAgendamento = ratio(agendamentos, qualificados)
  const convAtendimento = ratio(atendimentos, agendamentos)
  const convVenda = ratio(vendas, atendimentos)
  if (!hasEnoughChannel(channel) || !convAgendamento || !convAtendimento || !convVenda) return insufficientEffort(channel, 'Sem base suficiente para calcular uma projeção confiável neste canal.')
  const atendimentosNec = Math.ceil(vendasFaltantes / convVenda)
  const agendamentosNec = Math.ceil(atendimentosNec / convAtendimento)
  return {
    channel: channel.channel,
    ok: true,
    message: 'Para buscar as vendas que faltam, você precisa gerar aproximadamente:',
    rows: [
      { label: 'Atendimentos Comerciais', value: atendimentosNec },
      { label: 'Agendamentos', value: agendamentosNec },
      { label: 'Qualificados', value: Math.ceil(agendamentosNec / convAgendamento) },
    ],
    conversionLabel: `Conversão geral: ${formatPercent(channel.generalConversion)}`,
  }
}

function insufficientEffort(channel: ChannelFunnel, message: string): ChannelEffort {
  return { channel: channel.channel, ok: false, message, rows: [], conversionLabel: `Conversão geral: ${formatPercent(channel.generalConversion)}` }
}

function stepValue(channel: ChannelFunnel, key: FunnelStepKey) {
  return channel.steps.find(step => step.key === key)?.value || 0
}

function ratio(numerator: number, denominator: number) {
  if (denominator <= 0 || numerator <= 0) return null
  return numerator / denominator
}

function hasEnoughBase(dashboard: FunnelDashboard) {
  return dashboard.channels.some(hasEnoughChannel)
}

function hasEnoughChannel(channel: ChannelFunnel) {
  const first = channel.steps[0]?.value || 0
  const sales = stepValue(channel, 'venda')
  if (channel.channel === 'Showroom') return first >= 5 || sales >= 1
  return first >= 5 || sales >= 1
}

function getConfidence(selectedHasBase: boolean, rollingHasBase: boolean): Confidence {
  if (selectedHasBase) return 'Alta'
  if (rollingHasBase) return 'Média'
  return 'Baixa'
}

function confidenceReason(confidence: Confidence) {
  if (confidence === 'Alta') return 'Cálculo baseado nos dados deste período.'
  if (confidence === 'Média') return 'O período selecionado tem poucos dados; usamos os últimos 3 meses.'
  return 'Ainda há poucos registros para projetar com precisão.'
}

function getPrincipalLimitador(dashboard: FunnelDashboard) {
  const rows = dashboard.channels.flatMap(channel => channel.steps.slice(0, -1).map((step, index) => {
    const next = channel.steps[index + 1]
    return { channel: channel.channel, label: `${step.label} -> ${next.label}`, value: ratio(next.value, step.value) }
  })).filter((row): row is { channel: ChannelFunnel['channel']; label: string; value: number } => row.value !== null)
  if (rows.length === 0) return 'Ainda não há base suficiente para identificar um limitador estatístico.'
  const best = [...dashboard.channels].filter(channel => stepValue(channel, 'venda') > 0).sort((a, b) => (b.generalConversion || 0) - (a.generalConversion || 0))[0]
  if (best && (best.generalConversion || 0) >= 50) return `${best.channel} é o canal com melhor conversão no período.`
  const lowest = rows.sort((a, b) => a.value - b.value)[0]
  return `Seu maior limitador está em ${lowest.channel}: ${lowest.label}.`
}

function channelFlow(channel: ChannelFunnel['channel']) {
  if (channel === 'Showroom') return 'Atendimento Comercial -> Venda'
  if (channel === 'Internet') return 'Oportunidades -> Qualificados -> Agendamento -> Atendimento Comercial -> Venda'
  return 'Qualificados -> Agendamento -> Atendimento Comercial -> Venda'
}
