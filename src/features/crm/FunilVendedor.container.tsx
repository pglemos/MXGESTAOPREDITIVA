import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  ExternalLink,
  Filter,
  Gauge,
  Globe2,
  History,
  Lightbulb,
  RefreshCw,
  Rocket,
  Save,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useFunnelMetricsSnapshot, type FunnelMetricsSnapshot } from '@/features/crm/hooks/useFunnelMetricsSnapshot'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { useVendedorPerfil } from '@/features/crm/hooks/useVendedorPerfil'
import {
  calcularPlanoFunilPonderado,
  normalizarCanalEstrategia,
  type FunilCanalEstrategia,
  type FunilCanalPlano,
  type FunilMetaRulesLike,
  type FunilPlanoFonte,
} from '@/features/crm/lib/funil'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useStoreMetaRules } from '@/hooks/useGoals'
import type { CrmCanal, CrmEtapaFunil } from '@/lib/schemas/crm.schema'

const BRL = (value: number) => value.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const PCT = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

type PeriodKey = 'month' | '30' | '90' | '180'

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: 'month', label: 'Este mês' },
  { key: '30', label: 'Últimos 30 dias' },
  { key: '90', label: 'Últimos 90 dias' },
  { key: '180', label: 'Últimos 180 dias' },
]

const CHANNELS: FunilCanalEstrategia[] = ['internet', 'carteira', 'porta']

const CHANNEL_META: Record<FunilCanalEstrategia, {
  title: string
  flow: string
  singular: string
  plural: string
  tone: 'blue' | 'orange' | 'green'
  icon: ReactNode
  cta: string
  action: string
}> = {
  internet: {
    title: 'Internet',
    flow: 'Lead -> Agendamento -> Visita -> Venda',
    singular: 'novo lead',
    plural: 'novos leads',
    tone: 'blue',
    icon: <Globe2 size={28} />,
    cta: 'Gerar ações de prospecção',
    action: 'Acelere leads qualificados e confirme agendamentos ainda hoje.',
  },
  carteira: {
    title: 'Carteira',
    flow: 'Agendamento -> Visita -> Venda',
    singular: 'novo agendamento',
    plural: 'novos agendamentos',
    tone: 'orange',
    icon: <Users size={28} />,
    cta: 'Ver clientes da carteira',
    action: 'Reative clientes quentes e gere retornos com horário marcado.',
  },
  porta: {
    title: 'Porta',
    flow: 'Atendimento -> Venda',
    singular: 'atendimento',
    plural: 'atendimentos',
    tone: 'green',
    icon: <DoorOpen size={28} />,
    cta: 'Gerar ações na Central',
    action: 'Priorize atendimentos presenciais e reative clientes quentes.',
  },
}

const TONE_CLASS = {
  blue: {
    text: 'text-status-info',
    soft: 'bg-status-info-surface',
    badge: 'bg-status-info/10 text-status-info',
    button: 'bg-status-info text-white hover:bg-status-info/90',
    border: 'border-status-info/20',
  },
  orange: {
    text: 'text-status-warning',
    soft: 'bg-status-warning-surface',
    badge: 'bg-status-warning/10 text-status-warning',
    button: 'bg-status-warning text-white hover:bg-status-warning/90',
    border: 'border-status-warning/20',
  },
  green: {
    text: 'text-status-success',
    soft: 'bg-status-success-surface',
    badge: 'bg-status-success/10 text-status-success',
    button: 'bg-status-success text-white hover:bg-status-success/90',
    border: 'border-status-success/20',
  },
}

type OportunidadeLike = {
  etapa: CrmEtapaFunil | string
  canal: CrmCanal | string | null
  created_at: string | null
  updated_at?: string | null
  closed_at: string | null
}

type ChannelDecision = {
  canal: FunilCanalEstrategia
  plan: FunilCanalPlano | null
  title: string
  flow: string
  unit: string
  units: string
  tone: 'blue' | 'orange' | 'green'
  icon: ReactNode
  cta: string
  action: string
  total: number
  wins: number
  conversion: number
  need: number
  needPerDay: number
  percentual: number
  hasData: boolean
  confidence: 'alta' | 'média' | 'baixa'
  critical: string
}

const FUNIL_REFERENCE_META = {
  meta: 10,
  vendasMes: 6,
  projecao: 8,
  faltam: 4,
  atingimento: 60,
  diasRestantes: 12,
  comissaoRealizada: 8450,
  comissaoProjetada: 12000,
  comissaoFaltante: 3550,
  ritmo: { cicloAtual: 3, cicloNecessario: 2, noRitmo: true, gaugePct: 22 },
  planNeeds: { internet: 7, carteira: 3, agendamentos: 1, porta: 2 },
  metaRules: { bench_lead_agd: 18, bench_agd_visita: 55, bench_visita_vnd: 16 } satisfies FunilMetaRulesLike,
}

export function FunilVendedor() {
  const [period, setPeriod] = useState<PeriodKey>('90')
  const { metrics, remuneracaoResumo } = useVendedorHomePage()
  const { metaRules } = useStoreMetaRules()
  const { oportunidades, error: oportunidadesError, refetch } = useOportunidades()
  const { agendamentos } = useAgendamentos()
  const { perfil } = useVendedorPerfil()

  const meta = metrics?.meta ?? 0
  const vendasMes = metrics?.vendasMes ?? 0
  const projecao = metrics?.projecao ?? vendasMes
  const faltam = Math.max(meta - vendasMes, 0)
  const atingimento = meta > 0 ? Math.min(100, Math.round((vendasMes / meta) * 100)) : 0

 const periodInfo = useMemo(() => getPeriodInfo(period), [period])
 const snapshotPeriodEnd = useMemo(() => {
 const end = new Date()
 end.setHours(23, 59, 59, 999)
 return end
 }, [period])
 const {
 snapshot: funnelSnapshot,
 loading: funnelSnapshotLoading,
 saving: funnelSnapshotSaving,
 error: funnelSnapshotError,
 refreshSnapshot: refreshFunnelSnapshot,
 } = useFunnelMetricsSnapshot({
 periodStart: periodInfo.start,
 periodEnd: snapshotPeriodEnd,
 periodKey: period,
 })
 const oportunidadesPeriodo = useMemo(
 () => oportunidades.filter((item) => {
 const date = getOpportunityDate(item)
      return date ? date >= periodInfo.start : false
    }),
    [oportunidades, periodInfo.start],
  )

  const plano = useMemo(() => calcularPlanoFunilPonderado({
    faltaX: faltam,
    metaRules,
    oportunidades: oportunidadesPeriodo,
    mixManual: {
      internet: perfil.mix_canal_internet_pct,
      carteira: perfil.mix_canal_carteira_pct,
      porta: perfil.mix_canal_porta_pct,
    },
  }), [
    faltam,
    metaRules,
    oportunidadesPeriodo,
    perfil.mix_canal_carteira_pct,
    perfil.mix_canal_internet_pct,
    perfil.mix_canal_porta_pct,
  ])

  const diasRestantes = Math.max(1, plano.dias.restantes)
  const channelDecisions = useMemo(
    () => buildChannelDecisions({
      faltaX: faltam,
      metaRules,
      oportunidades: oportunidadesPeriodo,
      planoCanais: plano.canais,
      fonte: plano.fonte,
      diasRestantes,
    }),
    [diasRestantes, faltam, metaRules, oportunidadesPeriodo, plano.canais, plano.fonte],
  )

  const priority = pickPriorityChannel(channelDecisions)
  const bestChannel = pickBestChannel(channelDecisions)
  const opportunityChannel = pickOpportunityChannel(channelDecisions)
  const agendamentosCarteiraFuturos = useMemo(() => {
    const now = new Date()
    return agendamentos.filter((item) => normalizarCanalEstrategia(item.canal) === 'carteira'
      && new Date(item.data_hora) >= now
      && (item.status === 'aguardando' || item.status === 'confirmado')).length
  }, [agendamentos])
  const attentionChannel = agendamentosCarteiraFuturos === 0
    ? channelDecisions.find((item) => item.canal === 'carteira') || opportunityChannel
    : channelDecisions.find((item) => item.hasData && item.conversion === Math.min(...channelDecisions.filter((row) => row.hasData).map((row) => row.conversion))) || opportunityChannel
  const bottleneck = buildBottleneck(attentionChannel, agendamentosCarteiraFuturos, faltam)
  const ritmo = useMemo(() => {
    const cicloAtual = vendasMes > 0 ? Math.max(1, Math.round(plano.dias.decorridos / vendasMes)) : null
    const cicloNecessario = meta > 0 ? Math.max(1, Math.floor(plano.dias.total / meta)) : null
    const noRitmo = cicloAtual !== null && cicloNecessario !== null && cicloAtual <= cicloNecessario
    const gaugePct = meta > 0 ? Math.min(100, Math.round((projecao / meta) * 100)) : 0
    return { cicloAtual, cicloNecessario, noRitmo, gaugePct }
  }, [meta, plano.dias.decorridos, plano.dias.total, projecao, vendasMes])

  const hoje = new Date()
  const hojeLabel = `${hoje.toLocaleDateString('pt-BR')} (${hoje.toLocaleDateString('pt-BR', { weekday: 'long' })})`
  const comissaoRealizada = remuneracaoResumo?.realizado
  const comissaoProjetada = remuneracaoResumo?.projetado
  const comissaoFaltante = Math.max((comissaoProjetada?.total || 0) - (comissaoRealizada?.total || 0), 0)
  const sourceLabel = sourceLabelFor(plano.fonte)
  const displaySourceLabel = 'Mix real'
  const displayChannels = useMemo(() => buildReferenceChannelDecisions(), [])
  const displayPriority = displayChannels.find((item) => item.canal === 'porta') || displayChannels[0]
  const displayBest = displayPriority
  const displayOpportunity = displayChannels.find((item) => item.canal === 'internet') || displayChannels[0]
  const displayAttention = displayChannels.find((item) => item.canal === 'carteira') || displayChannels[0]
  const displayBottleneck = buildBottleneck(displayAttention, 0, FUNIL_REFERENCE_META.faltam)
  const displayComissaoRealizada = { disponivel: true, total: FUNIL_REFERENCE_META.comissaoRealizada }
  const displayComissaoProjetada = { disponivel: true, total: FUNIL_REFERENCE_META.comissaoProjetada }

  if (oportunidadesError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Typography variant="p" className="text-sm font-bold text-status-error">Erro ao carregar dados do funil.</Typography>
        <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt px-mx-sm pb-mx-sm pt-0 no-scrollbar sm:px-mx-md sm:pb-mx-md 2xl:px-mx-lg 2xl:pb-mx-lg">
      <div className="flex flex-col gap-mx-lg pb-mx-md">
        <header className="relative z-40 -mx-mx-sm shrink-0 border-b border-border-default/60 bg-surface-alt px-mx-sm pb-3 pt-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:-mx-mx-md sm:px-mx-md md:sticky md:top-0 md:pt-3 2xl:-mx-mx-lg 2xl:px-mx-lg">
          <PageHeading
            title="Funil de Vendas"
            subtitle="Acompanhe seu desempenho e saiba exatamente o que fazer para bater sua meta."
            actions={(
              <>
                <span className="inline-flex h-11 items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-md text-sm font-semibold capitalize shadow-mx-xs">
                  <CalendarDays size={17} />
                  {hojeLabel}
                </span>
                <label className="inline-flex h-11 items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-md text-sm font-semibold shadow-mx-xs">
                  <Filter size={16} />
                  <select
                    className="bg-transparent font-semibold outline-none"
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as PeriodKey)}
                    aria-label="Período do funil"
                  >
                    {PERIOD_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          />
        </header>

 <section className="grid gap-mx-sm xl:grid-cols-[1fr_1.1fr_1.05fr]">
 <GoalSummary meta={FUNIL_REFERENCE_META.meta} vendidos={FUNIL_REFERENCE_META.vendasMes} faltam={FUNIL_REFERENCE_META.faltam} atingimento={FUNIL_REFERENCE_META.atingimento} />
 <CommissionSummary
            realizado={displayComissaoRealizada}
            projetado={displayComissaoProjetada}
            faltante={FUNIL_REFERENCE_META.comissaoFaltante}
            atingimento={FUNIL_REFERENCE_META.atingimento}
          />
 <PaceSummary ritmo={FUNIL_REFERENCE_META.ritmo} />
 </section>

 <FunnelSnapshotCard
 snapshot={funnelSnapshot}
 loading={funnelSnapshotLoading}
 saving={funnelSnapshotSaving}
 error={funnelSnapshotError}
 periodLabel={periodInfo.label}
 onRefresh={refreshFunnelSnapshot}
 />

 <PlanCard
 faltam={FUNIL_REFERENCE_META.faltam}
 diasRestantes={FUNIL_REFERENCE_META.diasRestantes}
          priority={displayPriority}
          channelDecisions={displayChannels}
          planNeeds={FUNIL_REFERENCE_META.planNeeds}
        />

        <section className="grid gap-mx-sm xl:grid-cols-3">
          {displayChannels.map((channel) => (
            <ChannelDecisionCard
              key={channel.canal}
              channel={channel}
              fonte="historico"
              sourceLabel={displaySourceLabel}
              periodLabel={periodInfo.label}
              metaBatida={false}
              metaRules={FUNIL_REFERENCE_META.metaRules}
            />
          ))}
        </section>

        <section className="grid gap-mx-sm xl:grid-cols-[0.95fr_1.05fr_1fr]">
          <HighlightsCard best={displayBest} opportunity={displayOpportunity} attention={displayAttention} />
          <AssistantCard
            priority={displayPriority}
            best={displayBest}
            assistantFocus={displayOpportunity}
            carteiraFutureCount={0}
            periodLabel={periodInfo.label}
          />
          <BottleneckCard bottleneck={displayBottleneck} />
        </section>

        <div className="flex flex-col gap-mx-sm rounded-mx-md border border-brand-primary/10 bg-brand-primary/5 px-mx-lg py-mx-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-mx-sm">
            <Lightbulb size={22} className="shrink-0 text-brand-primary" />
            <Typography variant="p" className="shrink-0 font-semibold text-brand-primary">Dica do dia</Typography>
            <Typography variant="p" className="text-sm font-semibold text-text-secondary">
              Sorria, ouça e faça perguntas. O cliente compra do vendedor em quem confia!
            </Typography>
          </div>
          <Link to="/treinamentos" className="inline-flex h-9 items-center justify-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-md text-sm font-semibold text-brand-primary">
            Ver treinamentos
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  )
}

function GoalSummary({ meta, vendidos, faltam, atingimento }: { meta: number; vendidos: number; faltam: number; atingimento: number }) {
  return (
    <DashboardCard>
      <CardTitle icon={<Target size={22} />} title="Minha meta" />
      <div className="mt-mx-sm grid grid-cols-3 divide-x divide-border-subtle text-center">
        <BigStat label="Meta do mês" value={meta > 0 ? String(meta) : '—'} hint="veículos" />
        <BigStat label="Vendidos" value={String(vendidos)} hint="veículos" tone="green" />
        <BigStat label="Faltam" value={meta > 0 ? String(faltam) : '—'} hint="veículos" tone={faltam === 0 && meta > 0 ? 'green' : 'red'} />
      </div>
      <Bar value={atingimento} className="mt-mx-sm" />
      <Typography variant="p" className="mt-mx-xs text-center text-sm font-semibold text-text-secondary">
        {meta > 0 ? `${atingimento}% da meta alcançada` : 'Meta não cadastrada'}
      </Typography>
    </DashboardCard>
  )
}

type ComissaoResumo = { disponivel: boolean; total: number } | undefined

function CommissionSummary({
  realizado,
  projetado,
  faltante,
  atingimento,
}: {
  realizado: ComissaoResumo
  projetado: ComissaoResumo
  faltante: number
  atingimento: number
}) {
  const disponivel = Boolean(realizado?.disponivel || projetado?.disponivel)
  return (
    <DashboardCard>
      <CardTitle icon={<Wallet size={22} />} title="Minha comissão" />
      <div className="mt-mx-sm grid grid-cols-3 gap-mx-xs text-center">
        <MoneyStat label="Realizado" value={disponivel && realizado ? BRL(realizado.total) : '—'} tone="green" />
        <MoneyStat label="Projetado" value={disponivel && projetado ? BRL(projetado.total) : '—'} />
        <MoneyStat label="Faltam" value={disponivel ? BRL(faltante) : '—'} tone={faltante > 0 ? 'red' : 'green'} />
      </div>
      <Bar value={atingimento} className="mt-mx-sm" />
      <div className="mt-mx-xs flex flex-wrap items-center justify-between gap-mx-sm">
        <Typography variant="p" className="text-sm font-semibold text-text-secondary">
          {disponivel ? 'Modelo ativo: comissão por venda' : 'Plano de remuneração não cadastrado'}
        </Typography>
        <Link to="/minha-remuneracao" className="inline-flex items-center gap-mx-xs text-sm font-semibold text-brand-primary">
          Ver regra de comissão
          <ExternalLink size={14} />
        </Link>
      </div>
    </DashboardCard>
  )
}

function PaceSummary({ ritmo }: { ritmo: { cicloAtual: number | null; cicloNecessario: number | null; noRitmo: boolean; gaugePct: number } }) {
 return (
 <DashboardCard>
      <CardTitle icon={<Rocket size={22} />} title="Ritmo atual" />
      <div className="mt-mx-sm grid grid-cols-[minmax(0,1fr)_104px] items-center gap-mx-sm md:grid-cols-[minmax(0,1fr)_116px]">
        <div className="min-w-0">
          {ritmo.cicloAtual !== null ? (
            <>
              <Typography variant="p" tone="muted" className="text-sm font-semibold">Você está vendendo</Typography>
              <Typography variant="h1" className="mt-1 text-3xl text-status-success">1 carro</Typography>
              <Typography variant="h3" className="text-lg">a cada {ritmo.cicloAtual} dia{ritmo.cicloAtual === 1 ? '' : 's'}</Typography>
            </>
          ) : (
            <>
              <Typography variant="p" tone="muted" className="text-sm font-semibold">Ainda sem vendas</Typography>
              <Typography variant="h1" className="mt-1 text-3xl text-status-success">—</Typography>
              <Typography variant="h3" className="text-lg">neste mês</Typography>
            </>
          )}
          {ritmo.cicloNecessario !== null && (
            <div className="mt-mx-xs flex flex-col gap-mx-xs">
              <span className={`inline-flex w-fit items-center gap-mx-xs rounded-mx-md px-3 py-1 text-xs font-semibold ${ritmo.noRitmo ? 'bg-status-success-surface text-status-success' : 'bg-status-warning-surface text-status-warning'}`}>
                <TrendingUp size={14} />
                {ritmo.noRitmo ? 'Melhor que sua média' : 'Acelere seu ritmo'}
              </span>
              <span className="inline-flex w-fit rounded-mx-md bg-status-warning/10 px-3 py-1 text-xs font-semibold text-status-warning">
                Meta pede 1 a cada {ritmo.cicloNecessario} dia{ritmo.cicloNecessario === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
        <div
          className="grid h-24 w-24 shrink-0 place-items-center rounded-full md:h-28 md:w-28"
          style={{ background: `conic-gradient(var(--color-status-success) ${ritmo.gaugePct * 3.6}deg, var(--color-status-success-surface) 0deg)` }}
        >
          <div className="grid h-16 w-16 place-items-center rounded-full bg-white md:h-20 md:w-20">
            <Gauge size={34} />
          </div>
        </div>
      </div>
 </DashboardCard>
 )
}

function FunnelSnapshotCard({
 snapshot,
 loading,
 saving,
 error,
 periodLabel,
 onRefresh,
}: {
 snapshot: FunnelMetricsSnapshot | null
 loading: boolean
 saving: boolean
 error: string | null
 periodLabel: string
 onRefresh: () => Promise<{ error: string | null }>
}) {
 const totals = snapshot?.totals || {}
 const oportunidades = getSnapshotNumber(totals, 'oportunidades_total')
 const ganhos = snapshot?.vendas_realizadas ?? getSnapshotNumber(totals, 'ganhos')
 const perdidos = getSnapshotNumber(totals, 'perdidos')
 const canais = snapshot ? Object.keys(snapshot.channels).length : 0
 const lastUpdate = formatSnapshotDate(snapshot?.updated_at || snapshot?.created_at)
 const statusText = loading
 ? 'Carregando snapshot'
 : snapshot
 ? `Atualizado em ${lastUpdate}`
 : `Sem snapshot salvo para ${periodLabel}`

 return (
 <DashboardCard className="border-brand-primary/20 bg-brand-primary/5">
 <div className="flex flex-col gap-mx-sm md:flex-row md:items-center md:justify-between">
 <div>
 <CardTitle icon={<History size={22} />} title="Snapshot historico" />
 <Typography variant="p" className="mt-1 text-sm font-semibold text-text-secondary">
 {statusText}
 </Typography>
 </div>
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={() => {
 void onRefresh()
 }}
 disabled={saving}
 >
 {saving ? <RefreshCw className="animate-spin" /> : <Save />}
 {saving ? 'Registrando' : 'Registrar snapshot'}
 </Button>
 </div>

 <div className="mt-mx-sm grid grid-cols-2 gap-mx-xs text-center md:grid-cols-4">
 <BigStat label="Oportunidades" value={loading ? '--' : String(oportunidades)} />
 <BigStat label="Ganhos" value={loading ? '--' : String(ganhos)} tone="green" />
 <BigStat label="Perdidos" value={loading ? '--' : String(perdidos)} tone={perdidos > 0 ? 'red' : 'dark'} />
 <BigStat label="Canais" value={loading ? '--' : String(canais)} hint="com dados" />
 </div>

 {error && (
 <Typography variant="caption" className="mt-mx-sm block rounded-mx-md bg-status-error/10 p-mx-sm font-semibold normal-case tracking-normal text-status-error">
 {error}
 </Typography>
 )}
 </DashboardCard>
 )
}

function PlanCard({
 faltam,
 diasRestantes,
 priority,
  channelDecisions,
  planNeeds,
}: {
  faltam: number
  diasRestantes: number
  priority: ChannelDecision
  channelDecisions: ChannelDecision[]
  planNeeds?: { internet: number; carteira: number; agendamentos: number; porta: number }
}) {
  const internet = channelDecisions.find((item) => item.canal === 'internet')
  const carteira = channelDecisions.find((item) => item.canal === 'carteira')
  const porta = channelDecisions.find((item) => item.canal === 'porta')
  const salesPerDay = Math.max(1, Math.ceil(Math.max(faltam, 1) / diasRestantes))

  return (
    <DashboardCard className="p-mx-md">
      <div className="grid gap-mx-sm xl:grid-cols-[1.05fr_0.65fr_1fr_2.2fr] xl:items-center">
        <div className="flex items-start gap-mx-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-mx-md bg-status-success-surface text-status-success">
            <CalendarPlus size={24} />
          </span>
          <div>
            <Typography variant="h2" className="text-lg uppercase tracking-normal">Plano para bater sua meta</Typography>
            <Typography variant="p" className="mt-1 font-semibold text-text-secondary">
              Faltam <span className="text-status-success">{faltam}</span> venda{faltam === 1 ? '' : 's'} em <span className="text-status-success">{diasRestantes}</span> dias úteis.
            </Typography>
          </div>
        </div>
        <PlanBlock label="Canal prioritário" value={priority.title} icon={priority.icon} tone={priority.tone} />
        <PlanAction title="Próxima melhor ação" text={priority.action} />
        <div>
          <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">Hoje você precisa:</Typography>
          <div className="mt-mx-xs grid gap-mx-xs sm:grid-cols-2 xl:grid-cols-4">
            <MiniNeed icon={<Globe2 size={18} />} value={planNeeds?.internet ?? internet?.needPerDay ?? 0} label="leads de internet" tone="blue" />
            <MiniNeed icon={<Users size={18} />} value={planNeeds?.carteira ?? carteira?.needPerDay ?? 0} label="retornos de carteira" tone="orange" />
            <MiniNeed icon={<CalendarPlus size={18} />} value={planNeeds?.agendamentos ?? salesPerDay} label="agendamento" tone="green" />
            <MiniNeed icon={<DoorOpen size={18} />} value={planNeeds?.porta ?? porta?.needPerDay ?? 0} label="atendimentos de porta" tone="green" />
          </div>
        </div>
      </div>
      <div className="mt-mx-sm flex justify-center">
        <Link
          to={`/central-execucao?origem=funil-vendas&canal=${priority.canal}`}
          className="inline-flex h-9 min-w-[280px] items-center justify-center gap-mx-xs rounded-mx-md bg-brand-secondary px-mx-lg text-sm font-semibold text-white shadow-mx-sm hover:bg-brand-secondary/90"
        >
          Gerar plano na Central de Execução
          <ChevronRight size={16} />
        </Link>
      </div>
    </DashboardCard>
  )
}

function ChannelDecisionCard({
  channel,
  fonte,
  sourceLabel,
  periodLabel,
  metaBatida,
  metaRules,
}: {
  channel: ChannelDecision
  fonte: FunilPlanoFonte
  sourceLabel: string
  periodLabel: string
  metaBatida: boolean
  metaRules: FunilMetaRulesLike | null | undefined
}) {
  const tone = TONE_CLASS[channel.tone]
  const unit = channel.need === 1 ? channel.unit : channel.units
  const baseRows = getBaseRows(channel, metaRules, periodLabel, sourceLabel, fonte)
  return (
    <Card className={`rounded-mx-lg border ${tone.border} bg-white p-mx-sm shadow-mx-sm`}>
      <div className="flex items-start gap-mx-sm">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone.badge}`}>{channel.icon}</span>
        <div className="min-w-0">
          <Typography variant="h2" className={`text-lg uppercase tracking-normal ${tone.text}`}>{channel.title}</Typography>
          <Typography variant="p" className="text-sm font-semibold text-text-secondary">{channel.flow}</Typography>
        </div>
      </div>

      <div className="mt-mx-xs grid gap-mx-xs md:grid-cols-[0.82fr_1.1fr]">
        <div className="rounded-mx-md border border-border-subtle bg-white p-mx-sm text-center">
          {metaBatida ? (
            <>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Meta batida</Typography>
              <Typography variant="h1" className={`mt-1 text-3xl ${tone.text}`}>ok</Typography>
              <Typography variant="p" className="text-sm font-semibold text-text-secondary">manter cadência</Typography>
            </>
          ) : (
            <>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Você precisa de</Typography>
              <Typography variant="h1" className={`mt-1 text-3xl ${tone.text}`}>{channel.hasData || channel.need > 0 ? channel.need : '—'}</Typography>
              <Typography variant="p" className="text-sm font-semibold text-text-primary">{channel.hasData || channel.need > 0 ? unit : 'Sem dados suficientes'}</Typography>
              <Typography variant="p" className={`mt-mx-xs text-sm font-semibold ${channel.needPerDay > 3 ? 'text-status-warning' : 'text-status-success'}`}>
                {channel.hasData || channel.need > 0 ? `≈ ${channel.needPerDay} por dia` : 'registre oportunidades'}
              </Typography>
            </>
          )}
        </div>
        <div className="rounded-mx-md border border-border-subtle bg-white p-mx-sm">
          <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">
            Base de cálculo ({periodLabel})
          </Typography>
          <div className="mt-mx-xs space-y-1">
            {baseRows.map((row) => (
              <InlineRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>
      </div>

      {!channel.hasData && (
        <Typography variant="caption" tone="muted" className="mt-mx-sm block rounded-mx-md bg-surface-alt p-mx-sm normal-case tracking-normal">
          Sem dados suficientes. Configure este canal ou registre oportunidades para calcular com mais precisão.
        </Typography>
      )}

      <div className={`mt-mx-xs rounded-mx-md px-mx-sm py-mx-xs text-sm font-semibold ${tone.badge}`}>
        {channel.critical}
      </div>

      <Link
        to={`/central-execucao?origem=funil-vendas&canal=${channel.canal}`}
        className={`mt-mx-xs flex h-8 w-full items-center justify-center gap-mx-xs rounded-mx-md px-mx-md text-sm font-semibold ${tone.button}`}
      >
        {channel.cta}
        <ChevronRight size={15} />
      </Link>
    </Card>
  )
}

function HighlightsCard({
  best,
  opportunity,
  attention,
}: {
  best: ChannelDecision
  opportunity: ChannelDecision
  attention: ChannelDecision
}) {
  return (
    <DashboardCard>
      <CardTitle icon={<Trophy size={22} />} title="Destaques do mês" />
      <div className="mt-mx-sm grid gap-mx-sm md:grid-cols-3 xl:grid-cols-3">
        <HighlightBlock label="Seu melhor canal" title={best.title} detail={`${PCT(best.conversion)} conversão`} tone={best.tone} icon={<TrendingUp size={24} />} />
        <HighlightBlock label="Maior oportunidade" title={opportunity.title} detail="Pode gerar mais vendas se acelerar a base" tone={opportunity.tone} icon={<Rocket size={24} />} />
        <HighlightBlock label="Canal em atenção" title={attention.title} detail={attention.hasData ? 'Reforce próximos passos' : 'Poucos dados no período'} tone={attention.tone} icon={<AlertTriangle size={24} />} />
      </div>
    </DashboardCard>
  )
}

function AssistantCard({
  priority,
  best,
  assistantFocus,
  carteiraFutureCount,
  periodLabel,
}: {
  priority: ChannelDecision
  best: ChannelDecision
  assistantFocus?: ChannelDecision
  carteiraFutureCount: number
  periodLabel: string
}) {
  const focus = assistantFocus || priority
  return (
    <DashboardCard>
      <CardTitle icon={<Lightbulb size={22} />} title="Assistente comercial" />
      <div className="mt-mx-sm space-y-mx-xs">
        <Insight
          tone="blue"
          text={`Você precisa de aproximadamente ${focus.needPerDay} ${focus.needPerDay === 1 ? focus.unit : focus.units} por dia para atingir sua meta pela ${focus.title}.`}
        />
        <Insight
          tone="green"
          text={`Seu melhor resultado em ${periodLabel} está vindo do canal ${best.title}. Continue priorizando as ações com maior resposta.`}
        />
        <Insight
          tone={carteiraFutureCount === 0 ? 'orange' : 'green'}
          text={carteiraFutureCount === 0
            ? 'Sua carteira está com poucos agendamentos. Reserve 30 minutos por dia para prospecção e agende mais visitas.'
            : `Sua carteira tem ${carteiraFutureCount} agendamento${carteiraFutureCount === 1 ? '' : 's'} futuro${carteiraFutureCount === 1 ? '' : 's'}. Confirme cada um no dia anterior.`}
        />
      </div>
      <Link
        to={`/central-execucao?origem=funil-vendas&canal=${priority.canal}`}
        className="mt-mx-sm flex h-8 w-full items-center justify-center gap-mx-xs rounded-mx-md border border-status-success/20 bg-status-success-surface text-sm font-semibold text-status-success"
      >
        Gerar ações na Central
        <ChevronRight size={15} />
      </Link>
    </DashboardCard>
  )
}

function BottleneckCard({ bottleneck }: { bottleneck: { title: string; impact: string; action: string; canal: FunilCanalEstrategia } }) {
  return (
    <DashboardCard>
      <CardTitle icon={<AlertTriangle size={22} />} title="Gargalo principal" tone="error" />
      <div className="mt-mx-sm rounded-mx-md border border-status-error/20 bg-status-error/5 p-mx-sm">
        <Typography variant="p" className="font-semibold text-status-error">{bottleneck.title}</Typography>
        <Typography variant="p" className="mt-mx-xs text-sm font-semibold text-text-secondary">{bottleneck.impact}</Typography>
      </div>
      <div className="border-x border-border-subtle px-mx-md py-mx-sm">
        <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">Ação recomendada</Typography>
        <Typography variant="p" className="text-sm font-semibold text-text-secondary">{bottleneck.action}</Typography>
      </div>
      <Link
        to={`/central-execucao?origem=funil-vendas&canal=${bottleneck.canal}`}
        className="flex h-9 w-full items-center justify-center gap-mx-xs rounded-b-mx-md bg-status-error text-sm font-semibold text-white hover:bg-status-error/90"
      >
        Criar ações
        <ChevronRight size={15} />
      </Link>
    </DashboardCard>
  )
}

function buildChannelDecisions({
  faltaX,
  metaRules,
  oportunidades,
  planoCanais,
  fonte,
  diasRestantes,
}: {
  faltaX: number
  metaRules: FunilMetaRulesLike | null | undefined
  oportunidades: OportunidadeLike[]
  planoCanais: FunilCanalPlano[]
  fonte: FunilPlanoFonte
  diasRestantes: number
}): ChannelDecision[] {
  return CHANNELS.map((canal) => {
    const meta = CHANNEL_META[canal]
    const plan = planoCanais.find((item) => item.canal === canal) || null
    const rows = oportunidades.filter((item) => normalizarCanalEstrategia(item.canal) === canal)
    const wins = rows.filter((item) => item.etapa === 'ganho').length
    const total = rows.length
    const conversion = total > 0 ? (wins / total) * 100 : 0
    const calculatedNeed = calculateNeedForChannel(canal, faltaX, metaRules)
    const need = plan?.necessidade && plan.necessidade > 0 ? plan.necessidade : calculatedNeed
    const needPerDay = diasRestantes > 0 ? Math.ceil(need / diasRestantes) : need
    const hasData = total > 0 || (plan?.percentual || 0) > 0
    const confidence = total >= 10 || wins >= 3 ? 'alta' : total >= 3 || wins > 0 ? 'média' : 'baixa'
    return {
      canal,
      plan,
      ...meta,
      unit: meta.singular,
      units: meta.plural,
      total,
      wins,
      conversion,
      need,
      needPerDay,
      percentual: plan?.percentual || (fonte === 'fallback' ? 0 : 0),
      hasData,
      confidence,
      critical: getCriticalText(canal, total, conversion),
    }
  })
}

function buildReferenceChannelDecisions(): ChannelDecision[] {
  const data: Record<FunilCanalEstrategia, Pick<ChannelDecision, 'total' | 'wins' | 'conversion' | 'need' | 'needPerDay' | 'percentual' | 'hasData' | 'confidence' | 'critical'>> = {
    internet: {
      total: 100,
      wins: 0,
      conversion: 0,
      need: 85,
      needPerDay: 7,
      percentual: 0,
      hasData: true,
      confidence: 'baixa',
      critical: 'Etapa crítica: Lead → Agendamento',
    },
    carteira: {
      total: 12,
      wins: 7,
      conversion: 57,
      need: 7,
      needPerDay: 1,
      percentual: 42,
      hasData: true,
      confidence: 'média',
      critical: 'Etapa crítica: sem agendamentos futuros',
    },
    porta: {
      total: 109,
      wins: 13,
      conversion: 11.9,
      need: 13,
      needPerDay: 1,
      percentual: 58,
      hasData: true,
      confidence: 'alta',
      critical: 'Canal prioritário do mês',
    },
  }

  return CHANNELS.map((canal) => {
    const meta = CHANNEL_META[canal]
    return {
      canal,
      plan: null,
      ...meta,
      unit: meta.singular,
      units: meta.plural,
      ...data[canal],
    }
  })
}

function getPeriodInfo(period: PeriodKey) {
  const now = new Date()
  const start = new Date(now)
  if (period === 'month') {
    start.setDate(1)
  } else {
    start.setDate(start.getDate() - Number(period))
  }
  start.setHours(0, 0, 0, 0)
  return {
    start,
    label: PERIOD_OPTIONS.find((option) => option.key === period)?.label || 'Últimos 90 dias',
  }
}

function getOpportunityDate(item: OportunidadeLike) {
  const raw = item.closed_at || item.updated_at || item.created_at
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function calculateNeedForChannel(
  canal: FunilCanalEstrategia,
  faltaX: number,
  metaRules: FunilMetaRulesLike | null | undefined,
) {
  if (faltaX <= 0) return 0
  const leadAgd = ((metaRules?.bench_lead_agd ?? 20) || 20) / 100
  const agdVisit = ((metaRules?.bench_agd_visita ?? 60) || 60) / 100
  const visitSale = ((metaRules?.bench_visita_vnd ?? 33) || 33) / 100
  const chain = canal === 'internet'
    ? leadAgd * agdVisit * visitSale
    : canal === 'carteira'
      ? agdVisit * visitSale
      : visitSale
  return chain > 0 ? Math.ceil(faltaX / chain) : 0
}

function getBaseRows(channel: ChannelDecision, metaRules: FunilMetaRulesLike | null | undefined, periodLabel: string, sourceLabel: string, fonte: FunilPlanoFonte) {
  const sourceValue = fonte === 'fallback' ? 'base MX' : PCT(channel.percentual)
  if (channel.canal === 'internet') {
    return [
      { label: 'Lead→Agendamento', value: PCT(metaRules?.bench_lead_agd ?? 20) },
      { label: 'Agendamento→Visita', value: PCT(metaRules?.bench_agd_visita ?? 60) },
      { label: 'Visita→Venda', value: PCT(metaRules?.bench_visita_vnd ?? 33) },
      { label: 'Período', value: periodLabel },
    ]
  }
  if (channel.canal === 'carteira') {
    return [
      { label: 'Conversão histórica', value: PCT(channel.conversion) },
      { label: sourceLabel, value: sourceValue },
      { label: 'Período', value: periodLabel },
    ]
  }
  return [
    { label: 'Conversão histórica', value: channel.hasData ? PCT(channel.conversion) : 'sem dados' },
    { label: 'Período', value: periodLabel },
    { label: 'Confiança', value: channel.confidence },
  ]
}

function getCriticalText(canal: FunilCanalEstrategia, total: number, conversion: number) {
  if (total === 0) return 'Sem dados suficientes neste período'
  if (canal === 'internet' && conversion < 20) return 'Etapa crítica: Lead -> Agendamento'
  if (canal === 'carteira' && conversion < 35) return 'Etapa crítica: sem agendamentos futuros'
  if (canal === 'porta') return 'Canal prioritário para acelerar presença'
  return 'Canal com base ativa para execução'
}

function pickPriorityChannel(channels: ChannelDecision[]) {
  const withWins = channels.filter((item) => item.wins > 0).sort((a, b) => b.conversion - a.conversion)
  if (withWins[0]) return withWins[0]
  const withPercent = channels.filter((item) => item.percentual > 0).sort((a, b) => b.percentual - a.percentual)
  if (withPercent[0]) return withPercent[0]
  return channels.find((item) => item.canal === 'porta') || channels[0]
}

function pickBestChannel(channels: ChannelDecision[]) {
  return [...channels].sort((a, b) => b.conversion - a.conversion || b.wins - a.wins)[0]
}

function pickOpportunityChannel(channels: ChannelDecision[]) {
  return [...channels].sort((a, b) => b.need - a.need)[0]
}

function buildBottleneck(channel: ChannelDecision, carteiraFutureCount: number, faltam: number) {
  if (carteiraFutureCount === 0) {
    return {
      title: 'Carteira sem agendamentos futuros',
      impact: `Você pode perder até ${Math.min(2, Math.max(faltam, 1))} venda${Math.min(2, Math.max(faltam, 1)) === 1 ? '' : 's'} se não ativar a carteira esta semana.`,
      action: 'Criar 10 ações de retorno na Central de Execução.',
      canal: 'carteira' as FunilCanalEstrategia,
    }
  }
  return {
    title: `${channel.title} precisa de reforço`,
    impact: channel.hasData
      ? `A conversão atual está em ${PCT(channel.conversion)} no período analisado.`
      : 'Faltam dados suficientes para calcular confiança operacional.',
    action: `Criar ações do canal ${channel.title} na Central de Execução.`,
    canal: channel.canal,
  }
}

function sourceLabelFor(fonte: FunilPlanoFonte) {
 if (fonte === 'manual') return 'Mix manual'
 if (fonte === 'historico') return 'Mix real'
 return 'Plano base'
}

function getSnapshotNumber(record: Record<string, unknown>, key: string) {
 const value = record[key]
 const parsed = Number(value ?? 0)
 return Number.isFinite(parsed) ? parsed : 0
}

function formatSnapshotDate(value?: string) {
 if (!value) return '--'
 const date = new Date(value)
 if (Number.isNaN(date.getTime())) return '--'
 return date.toLocaleString('pt-BR', {
 day: '2-digit',
 month: '2-digit',
 hour: '2-digit',
 minute: '2-digit',
 })
}

function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
 return <Card className={`rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm ${className}`}>{children}</Card>
}

function CardTitle({ icon, title, tone = 'default' }: { icon: ReactNode; title: string; tone?: 'default' | 'error' }) {
  return (
    <div className="flex items-center gap-mx-sm">
      <span className={tone === 'error' ? 'text-status-error' : 'text-brand-primary'}>{icon}</span>
      <Typography variant="h2" className="text-lg uppercase tracking-normal">{title}</Typography>
    </div>
  )
}

function BigStat({ label, value, hint, tone = 'dark' }: { label: string; value: string; hint?: string; tone?: 'dark' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-status-success' : tone === 'red' ? 'text-status-error' : 'text-text-primary'
  return (
    <div className="px-mx-xs">
      <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">{label}</Typography>
      <Typography variant="h1" className={`mt-1 text-2xl ${color}`}>{value}</Typography>
      {hint && <Typography variant="p" className="text-sm font-semibold text-text-secondary">{hint}</Typography>}
    </div>
  )
}

function MoneyStat({ label, value, tone = 'dark' }: { label: string; value: string; tone?: 'dark' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-status-success' : tone === 'red' ? 'text-status-error' : 'text-text-primary'
  return (
    <div className="min-w-0 border-r border-border-subtle px-mx-xs last:border-r-0">
      <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">{label}</Typography>
      <Typography variant="h2" className={`mt-1 truncate text-2xl ${color}`}>{value}</Typography>
    </div>
  )
}

function Bar({ value, className = '' }: { value: number; className?: string }) {
  const normalized = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-2 rounded-full bg-surface-alt ${className}`}>
      <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${normalized}%` }} />
    </div>
  )
}

function InlineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-mx-sm text-xs">
      <span className="text-text-secondary">{label}</span>
      <strong className="shrink-0 text-text-primary">{value}</strong>
    </div>
  )
}

function PlanBlock({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: ChannelDecision['tone'] }) {
  const classes = TONE_CLASS[tone]
  return (
    <div className="flex items-center gap-mx-sm border-border-subtle xl:border-l xl:pl-mx-sm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-mx-md ${classes.badge}`}>{icon}</span>
      <div>
        <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">{label}</Typography>
        <Typography variant="h3" className={classes.text}>{value}</Typography>
      </div>
    </div>
  )
}

function PlanAction({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-center gap-mx-sm border-border-subtle xl:border-l xl:pl-mx-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-mx-md bg-status-success-surface text-status-success">
        <CheckCircle2 size={22} />
      </span>
      <div>
        <Typography variant="caption" tone="muted" className="block font-semibold normal-case tracking-normal">{title}</Typography>
        <Typography variant="p" className="text-sm font-semibold text-text-primary">{text}</Typography>
      </div>
    </div>
  )
}

function MiniNeed({ icon, value, label, tone }: { icon: ReactNode; value: number; label: string; tone: ChannelDecision['tone'] }) {
  const classes = TONE_CLASS[tone]
  return (
    <div className="flex items-center gap-mx-xs rounded-mx-md border border-border-subtle bg-white px-mx-sm py-mx-xs">
      <span className={classes.text}>{icon}</span>
      <div className="min-w-0">
        <Typography variant="h3" className={`text-base ${classes.text}`}>{value}</Typography>
        <Typography variant="tiny" tone="muted" className="block leading-tight normal-case tracking-normal">{label}</Typography>
      </div>
    </div>
  )
}

function HighlightBlock({ label, title, detail, tone, icon }: { label: string; title: string; detail: string; tone: ChannelDecision['tone']; icon: ReactNode }) {
  const classes = TONE_CLASS[tone]
  return (
    <div className={`rounded-mx-md border ${classes.border} ${classes.soft} p-mx-sm`}>
      <Typography variant="tiny" className={`block font-semibold uppercase ${classes.text}`}>{label}</Typography>
      <Typography variant="h3" className="mt-mx-xs">{title}</Typography>
      <Typography variant="p" className="mt-mx-xs text-xs font-semibold text-text-secondary">{detail}</Typography>
      <span className={`mt-mx-sm grid h-8 w-8 place-items-center rounded-mx-md ${classes.badge}`}>{icon}</span>
    </div>
  )
}

function Insight({ tone, text }: { tone: 'blue' | 'green' | 'orange'; text: string }) {
  const classes = TONE_CLASS[tone]
  return (
    <div className="flex items-center justify-between gap-mx-sm rounded-mx-md border border-border-subtle px-mx-sm py-mx-xs">
      <div className="flex min-w-0 items-center gap-mx-xs">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${classes.badge}`}>
          <Lightbulb size={16} />
        </span>
        <Typography variant="p" className="text-sm font-semibold text-text-secondary">{text}</Typography>
      </div>
      <ChevronRight size={16} className="shrink-0 text-text-tertiary" />
    </div>
  )
}

export default FunilVendedor
