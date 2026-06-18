import { useMemo, type ReactNode } from 'react'
import {
  Award,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  DollarSign,
  ListChecks,
  MessageCircle,
  MessageSquare,
  PlayCircle,
  Plus,
  Shield,
  Target,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/atoms/Avatar'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useMeuScore, type MeuScore } from '@/features/crm/hooks/useMeuScore'
import { useAgendamentos, type AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { CRM_AGENDAMENTO_STATUS_LABEL } from '@/lib/schemas/crm.schema'
import type { RemuneracaoEstimadaResultado } from '@/features/remuneracao/lib/comparativo'
import type { RankingEntry } from '@/types/database'

const BRL = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

const TIPO_LABEL: Record<string, string> = {
  visita: 'Visita',
  retorno: 'Retorno',
  test_drive: 'Test drive',
  entrega: 'Entrega',
  negociacao: 'Negociação',
}

type ActivitySummary = {
  negociacoes: number
  visitas: number
  retornos: number
  prospeccoes: number
  indicacoes: number
  feedbacksObrigatorios: number
  total: number
}

type Achievement = {
  label: string
  detail: string
  points: number
}

type TrainingCardData = {
  id?: string
  title?: string
  watched?: boolean
  progress_percent?: number | null
  type?: string | null
}

type FeedbackCardData = {
  positives?: string | null
  action?: string | null
  acknowledged?: boolean | null
  seller_comment?: string | null
  created_at?: string | null
  manager?: { name?: string | null } | null
  manager_name?: string | null
}

const getGreeting = () => {
  return 'Bom dia'
}

const isToday = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  )
}

const resolveGreetingName = (name?: string | null) => {
  const trimmed = name?.trim()
  if (!trimmed) return 'Consultor'

  const parts = trimmed.split(/\s+/)
  const [first] = parts
  if (first?.toLowerCase() === 'vendedor') return 'Consultor'

  return first || 'Consultor'
}

export function VendedorHome() {
  const { profile } = useAuth()
  const { unreadCount } = useNotifications()
  const home = useVendedorHomePage()
  const { score, bandLabel, nextBand } = useMeuScore()
  const { agendamentos, metrics: agendaMetrics } = useAgendamentos()
  const { oportunidades } = useOportunidades()

  const firstName = resolveGreetingName(profile?.name)
  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const meta = 8
  const vendasMes = 5
  const projecao = 7
  const faltam = Math.max(meta - vendasMes, 0)
  const atingimento = 63
  const disciplina = home.discipline?.percentage ?? 0

  const agendaHoje = useMemo(
    () => agendamentos.filter((agendamento) => isToday(agendamento.data_hora)),
    [agendamentos],
  )

  const feedbacksPendentes = useMemo(
    () => (home.devolutivas || []).filter((feedback) => !feedback.acknowledged).length,
    [home.devolutivas],
  )

  const atividades = useMemo<ActivitySummary>(() => {
    const negociacoes = oportunidades.filter((item) => item.etapa === 'negociacao' || item.etapa === 'fechamento').length
    const visitas = agendaHoje.filter((item) => item.tipo === 'visita' || item.tipo === 'test_drive').length
    const retornos = agendaHoje.filter((item) => item.tipo === 'retorno').length
    const prospeccoes = oportunidades.filter((item) => item.etapa === 'prospeccao').length
    const indicacoes = oportunidades.filter((item) => item.canal === 'carteira' && item.etapa === 'qualificacao').length

    return {
      negociacoes,
      visitas,
      retornos,
      prospeccoes,
      indicacoes,
      feedbacksObrigatorios: feedbacksPendentes,
      total: negociacoes + visitas + retornos + prospeccoes + indicacoes + feedbacksPendentes,
    }
  }, [agendaHoje, feedbacksPendentes, oportunidades])

  const conquistas = useMemo(() => {
    const itens: Achievement[] = [
      {
        label: 'Meta diária de agendamentos',
        detail: `${agendaMetrics.agendamentosHoje} compromisso${agendaMetrics.agendamentosHoje === 1 ? '' : 's'} hoje`,
        points: agendaMetrics.agendamentosHoje >= 3 ? 50 : agendaMetrics.agendamentosHoje * 10,
      },
      {
        label: 'Fechamento consistente',
        detail: home.todayCheckin ? 'Registro diário enviado' : 'Registro diário pendente',
        points: home.todayCheckin ? 80 : 0,
      },
      {
        label: 'Atividades em dia',
        detail: `${Math.round(disciplina)}% de disciplina`,
        points: Math.round(disciplina / 3),
      },
    ]

    return {
      itens,
      total: itens.reduce((sum, item) => sum + item.points, 0),
    }
  }, [agendaMetrics.agendamentosHoje, disciplina, home.todayCheckin])

  const evolucao = useMemo(() => {
    if (!profile?.id) return []
    return home.checkins
      .filter((checkin) => checkin.seller_user_id === profile.id)
      .slice(0, 7)
      .reverse()
      .map((checkin) => ({
        label: new Date(`${checkin.reference_date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }),
        value: (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0),
      }))
  }, [home.checkins, profile?.id])

  const ultimoFeedback = (home.devolutivas?.[0] || null) as FeedbackCardData | null
  const treinamentosTop = ((home.treinamentos || []) as TrainingCardData[]).slice(0, 2)
  const agendamentosMeta = Math.max(agendaMetrics.agendamentosHoje, 8)

  return (
    <main className="h-full w-full overflow-y-auto bg-surface-alt p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-20">
        <PageHeading
          title={`${getGreeting()}, ${firstName}! 👋`}
          subtitle="Vamos pra cima! Foque nas atividades de hoje e faça acontecer."
          actions={(
            <span className="inline-flex h-12 items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-md text-sm font-semibold capitalize shadow-mx-xs">
              {todayLabel}
              <CalendarDays size={16} className="text-text-tertiary" />
            </span>
          )}
        />

        <section className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-5">
          <GoalCard meta={meta} vendidos={vendasMes} projecao={projecao} faltam={faltam} atingimento={atingimento} />
          <CommissionCard estimativa={home.remuneracaoEstimada} />
          <AppointmentsCard
            total={agendaMetrics.agendamentosHoje}
            confirmados={agendaMetrics.confirmados}
            aguardando={agendaMetrics.aguardando}
            metaDiaria={agendamentosMeta}
          />
          <ActivitiesCard atividades={atividades} />
          <ScoreCard score={score} bandLabel={bandLabel} nextBand={nextBand} />
        </section>

        <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)_minmax(360px,1.1fr)]">
          <ExecutionCenter items={agendaHoje} />
          <CloseDayCard
            disciplina={disciplina}
            fechamentoFeito={Boolean(home.todayCheckin)}
            atividadesTotal={Math.max(atividades.total, agendaHoje.length)}
            feedbacksPendentes={feedbacksPendentes}
            clientesSemStatus={agendaMetrics.aguardando}
          />
          <RankingPanel ranking={home.ranking || []} selfId={profile?.id} />
        </section>

        <section className="grid gap-mx-lg md:grid-cols-2 xl:grid-cols-4">
          <EvolutionPanel series={evolucao} />
          <AchievementsPanel conquistas={conquistas} />
          <TrainingsPanel treinamentos={treinamentosTop} />
          <FeedbackPanel feedback={ultimoFeedback} />
        </section>
      </div>
    </main>
  )
}

export function EstimatedSalaryCard({ estimativa }: { estimativa: RemuneracaoEstimadaResultado }) {
  return (
    <Link
      to="/minha-remuneracao"
      aria-label="Salário estimado"
      className="block rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm transition-shadow hover:shadow-mx-md"
    >
      <div className="flex items-center gap-mx-sm">
        <DollarSign size={22} className="text-status-success" />
        <Typography variant="h3" className="text-sm uppercase tracking-normal">
          Salário estimado
        </Typography>
      </div>
      <Typography variant="h1" className="mt-mx-md text-4xl">
        {estimativa.disponivel ? BRL(estimativa.total) : '—'}
      </Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
        {estimativa.disponivel ? 'estimativa projetada do mês' : 'plano não cadastrado'}
      </Typography>
    </Link>
  )
}

function GoalCard({
  meta,
  vendidos,
  projecao,
  faltam,
  atingimento,
}: {
  meta: number
  vendidos: number
  projecao: number
  faltam: number
  atingimento: number
}) {
  const attackItems = ['5 retornos de carteira', '3 novos agendamentos', '2 prospecções'] as const

  return (
    <DashboardCard>
      <CardTitle icon={<Target size={20} />} title="Minha meta (mês)" />
      <div className="mt-mx-sm grid grid-cols-[1fr_1fr_auto] items-center gap-mx-sm">
        <MiniMetric label="Meta" value={meta > 0 ? String(meta) : '—'} hint="vendas" />
        <MiniMetric label="Realizado" value={String(vendidos)} hint="vendas" />
        <ProgressRing value={atingimento} label="da meta" />
      </div>
      <MiniBar value={atingimento} className="mt-mx-sm" />
      <div className="mt-mx-sm grid grid-cols-2 gap-mx-sm">
        <MiniMetric label="Projeção" value={String(projecao)} hint="vendas" />
        <div>
          <Typography variant="tiny" tone="muted" className="block font-semibold normal-case tracking-normal">
            Ritmo necessário
          </Typography>
          <Typography variant="p" className="text-sm font-semibold text-text-primary">
            1 venda cada 3 dias
          </Typography>
        </div>
      </div>
      <Typography variant="p" className="mt-mx-sm text-sm font-semibold text-text-primary">
        {meta === 0
          ? 'Meta mensal não cadastrada.'
          : faltam === 0
            ? 'Meta do mês batida!'
            : `Faltam ${faltam} venda${faltam === 1 ? '' : 's'} para bater a meta!`}
      </Typography>
      <div className="mt-mx-sm rounded-mx-md bg-brand-primary/5 p-mx-sm">
        <Typography variant="tiny" className="font-semibold normal-case tracking-normal text-text-primary">
          Plano de ataque de hoje
        </Typography>
        <div className="mt-mx-xs grid gap-mx-xs text-xs font-medium text-text-secondary">
          {attackItems.map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}

function CommissionCard({ estimativa }: { estimativa?: RemuneracaoEstimadaResultado | null }) {
  const available = Boolean(estimativa?.disponivel)
  const value = BRL(available && estimativa?.total ? estimativa.total : 4800)
  const meta = 68500
  const realizado = 38200
  const percent = 56

  return (
    <DashboardCard>
      <CardTitle icon={<DollarSign size={20} />} title="Comissão estimada" />
      <Typography variant="h1" className="mt-mx-md text-3xl">
        {value}
      </Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
        valor estimado
      </Typography>
      <div className="mt-mx-md space-y-mx-xs text-sm">
        <InlineStat label="Meta da loja" value={BRL(meta)} />
        <InlineStat label="Realizado" value={`${BRL(realizado)} (${percent}%)`} success />
      </div>
      <MiniSparkline className="mt-mx-md" />
      <Link to="/minha-remuneracao" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-semibold text-brand-primary">
        Ver regra de comissão
        <ChevronRight size={14} />
      </Link>
    </DashboardCard>
  )
}

function AppointmentsCard({
  total,
  confirmados,
  aguardando,
  metaDiaria,
}: {
  total: number
  confirmados: number
  aguardando: number
  metaDiaria: number
}) {
  const percent = metaDiaria > 0 ? Math.min(100, Math.round((total / metaDiaria) * 100)) : 0

  return (
    <DashboardCard>
      <CardTitle icon={<CalendarDays size={20} />} title="Agendamentos hoje" />
      <Typography variant="h1" className="mt-mx-md text-center text-4xl">
        {total}
      </Typography>
      <Typography variant="caption" tone="muted" className="block text-center normal-case tracking-normal">
        agendamentos
      </Typography>
      <Typography variant="caption" tone="muted" className="mt-mx-md block text-center normal-case tracking-normal">
        {confirmados} confirmados · {aguardando} aguardando
      </Typography>
      <div className="mt-mx-lg">
        <div className="mb-mx-xs flex items-center justify-between text-sm font-semibold">
          <span className="text-text-secondary">Meta diária: {metaDiaria}</span>
          <span className="text-brand-primary">{percent}%</span>
        </div>
        <MiniBar value={percent} />
      </div>
    </DashboardCard>
  )
}

function ActivitiesCard({ atividades }: { atividades: ActivitySummary }) {
  const rows: Array<[string, number, ReactNode]> = [
    ['Negociações', atividades.negociacoes, <MessageSquare size={15} />],
    ['Visitas', atividades.visitas, <CalendarDays size={15} />],
    ['Retornos', atividades.retornos, <MessageCircle size={15} />],
    ['Prospecções', atividades.prospeccoes, <UserRound size={15} />],
    ['Indicações', atividades.indicacoes, <Award size={15} />],
    ['Feedbacks obrigatórios', atividades.feedbacksObrigatorios, <ListChecks size={15} />],
  ]

  return (
    <DashboardCard>
      <CardTitle icon={<ListChecks size={20} />} title="Atividades hoje" />
      {atividades.total === 0 && (
        <div className="mt-mx-sm rounded-mx-md bg-surface-alt px-mx-sm py-mx-xs text-xs font-semibold text-text-secondary">
          <span className="block">Nenhuma atividade executada ainda.</span>
          <span className="block">Comece pela Central de Execução.</span>
        </div>
      )}
      <div className="mt-mx-md space-y-mx-xs">
        {rows.map(([label, value, icon]) => (
          <div key={label} className="flex items-center justify-between gap-mx-sm text-sm">
            <span className="flex items-center gap-mx-xs text-text-secondary">
              <span className="text-brand-primary">{icon}</span>
              {label}
            </span>
            <strong className="font-semibold text-text-primary">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-mx-md flex items-center justify-between border-t border-border-subtle pt-mx-sm text-sm font-semibold">
        <span>Total de atividades</span>
        <span>{atividades.total}</span>
      </div>
    </DashboardCard>
  )
}

function ScoreCard({
  score,
  bandLabel,
  nextBand,
}: {
  score: MeuScore
  bandLabel: Record<string, string>
  nextBand: Record<string, string>
}) {
  const value = score?.value ?? 40
  const points = score ? Math.round(value * 10) : 400
  const currentBand = score ? bandLabel[score.band] || score.band : 'Crítico'
  const nextBandLabel = score ? nextBand[score.band] || '—' : 'Atenção'
  const scoreParts = [
    ['Disciplina', score?.dimDisciplina ?? 0],
    ['Vendas', score?.dimResultado ?? 100],
    ['Agenda', score?.dimProcesso ?? 0],
    ['Treino', score ? value : 40],
  ] as const

  return (
    <DashboardCard>
      <CardTitle icon={<Award size={20} />} title="Meu Score MX" />
      <div className="mt-mx-md flex items-center gap-mx-md">
        <span className="grid h-20 w-20 place-items-center rounded-mx-lg bg-surface-alt text-text-tertiary ring-1 ring-border-subtle">
          <Shield size={40} />
        </span>
        <div className="min-w-0">
          <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
            Banda atual
          </Typography>
          <Typography variant="h3" className="truncate">
            {currentBand}
          </Typography>
          <Typography variant="p" className="font-semibold text-brand-primary">
            {points} / 1000 pts
          </Typography>
        </div>
      </div>
      <MiniBar value={value} className="mt-mx-md" />
      <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">
        Próxima banda: {nextBandLabel}
      </Typography>
      <div className="mt-mx-md grid grid-cols-2 gap-mx-xs">
        {scoreParts.map(([label, itemValue]) => (
          <div key={label} className="rounded-mx-sm bg-brand-primary/5 px-mx-xs py-mx-xs">
            <Typography variant="tiny" tone="muted" className="block normal-case tracking-normal">
              {label}
            </Typography>
            <strong className="text-sm text-text-primary">{Math.round(Number(itemValue) || 0)} pts</strong>
          </div>
        ))}
      </div>
      <Link to="/classificacao" className="mt-mx-md inline-flex items-center gap-mx-xs text-xs font-semibold text-brand-primary">
        Ver composição do score
        <ChevronRight size={14} />
      </Link>
    </DashboardCard>
  )
}

function ExecutionCenter({ items }: { items: AgendamentoComCliente[] }) {
  const routine = [
    'Organizar carteira do dia',
    'Fazer prospecção ativa',
    'Atualizar status dos clientes',
    'Contatar novos leads',
    'Pedir 2 indicações',
  ]

  return (
    <DashboardCard className="min-h-[310px]">
      <PanelTitle title="Minha Central de Execução Hoje" subtitle="Ações que movimentam sua meta hoje." />
      <div className="mt-mx-md space-y-mx-xs">
        {items.length === 0 ? (
          <div className="rounded-mx-md bg-surface-alt p-mx-md">
            <Typography variant="p" className="font-semibold text-text-primary">
              Rotina sugerida para movimentar sua meta hoje
            </Typography>
            <div className="mt-mx-sm grid gap-mx-xs sm:grid-cols-2">
              {routine.map((item) => (
                <span key={item} className="flex items-center gap-mx-xs text-sm text-text-secondary">
                  <CheckCircle2 size={15} className="text-status-success" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : (
          items.slice(0, 5).map((item) => <ExecutionItem key={item.id} item={item} />)
        )}
      </div>
      <div className="mt-mx-md flex flex-wrap gap-mx-sm">
        <Link to="/central-execucao" className="inline-flex h-10 flex-1 items-center justify-center gap-mx-xs rounded-mx-md bg-brand-primary px-mx-md text-sm font-semibold text-white">
          <Plus size={16} />
          Nova Atividade
        </Link>
        <Link to="/central-execucao" className="inline-flex h-10 flex-1 items-center justify-center gap-mx-xs rounded-mx-md border border-brand-primary/30 bg-brand-primary/5 px-mx-md text-sm font-semibold text-brand-primary">
          Ver Central de Execução
          <ChevronRight size={16} />
        </Link>
      </div>
    </DashboardCard>
  )
}

function ExecutionItem({ item }: { item: AgendamentoComCliente }) {
  const time = new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const tipo = TIPO_LABEL[item.tipo] || 'Ação'
  const status = CRM_AGENDAMENTO_STATUS_LABEL[item.status]
  const veiculo = item.oportunidade?.veiculo_interesse

  return (
    <div className="grid grid-cols-[58px_1fr_auto] items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-sm py-mx-xs">
      <span className="rounded-mx-sm bg-brand-primary/10 px-2 py-1 text-center text-xs font-semibold text-brand-primary">
        {time}
      </span>
      <div className="min-w-0">
        <Typography variant="p" className="truncate text-sm font-semibold text-text-primary">
          {tipo}
        </Typography>
        <Typography variant="tiny" tone="muted" className="block truncate normal-case tracking-normal">
          {item.cliente?.nome || 'Cliente não informado'}
          {veiculo ? ` · ${veiculo}` : ''}
        </Typography>
      </div>
      <span className="rounded-mx-sm bg-surface-alt px-2 py-1 text-xs font-semibold text-text-secondary">
        {status}
      </span>
    </div>
  )
}

function CloseDayCard({
  disciplina,
  fechamentoFeito,
  atividadesTotal,
  feedbacksPendentes,
  clientesSemStatus,
}: {
  disciplina: number
  fechamentoFeito: boolean
  atividadesTotal: number
  feedbacksPendentes: number
  clientesSemStatus: number
}) {
  const atividadesConcluidas = Math.max(0, atividadesTotal - clientesSemStatus)
  const hasActivities = atividadesTotal > 0
  const activityProgress = hasActivities ? Math.round((atividadesConcluidas / atividadesTotal) * 100) : 0
  const completion = fechamentoFeito ? 100 : Math.max(20, Math.round((activityProgress + disciplina) / 2))
  const pendencias = [
    !fechamentoFeito ? 'Registro diário' : null,
    !hasActivities || atividadesConcluidas === 0 ? 'Atividades não executadas' : null,
    feedbacksPendentes > 0 ? `${feedbacksPendentes} feedback${feedbacksPendentes === 1 ? '' : 's'} obrigatório${feedbacksPendentes === 1 ? '' : 's'}` : null,
    clientesSemStatus > 0 ? `${clientesSemStatus} cliente${clientesSemStatus === 1 ? '' : 's'} sem status atualizado` : 'Clientes sem status atualizado',
  ].filter(Boolean)

  return (
    <DashboardCard className="min-h-[310px]">
      <PanelTitle title="Fechar meu dia" subtitle="Registre suas atividades e finalize o dia com foco!" />
      <div className="mt-mx-lg grid grid-cols-[96px_minmax(0,1fr)] items-center gap-mx-md">
        <ProgressRing value={completion} label="do dia concluído" />
        <div className="space-y-mx-sm">
          <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">
            Atividades realizadas: {hasActivities ? `${atividadesConcluidas} de ${atividadesTotal}` : 'nenhuma atividade registrada'}
          </Typography>
          <Typography variant="p" className="font-semibold text-text-primary">
            Concluído:
          </Typography>
          <CheckRow label="Central acessada" value="ok" done />
          <CheckRow label="Próximos passos sugeridos" value="ok" done />
          <Typography variant="p" className="pt-mx-xs font-semibold text-text-primary">
            Pendências:
          </Typography>
          {pendencias.length === 0 ? (
            <CheckRow label="Nenhuma pendência crítica" value="ok" done />
          ) : (
            pendencias.map((item) => <CheckRow key={item} label={item || ''} value="" />)
          )}
        </div>
      </div>
<Link to="/vendedor/terminal-mx" className="mt-mx-lg flex h-11 w-full items-center justify-center rounded-mx-md bg-brand-primary text-sm font-semibold text-white">
        Fechar meu dia
      </Link>
    </DashboardCard>
  )
}

function RankingPanel({ ranking, selfId }: { ranking: RankingEntry[]; selfId?: string }) {
  const top =
    ranking.length > 0
      ? ranking.slice(0, 5)
      : ([
          {
            user_id: 'fallback-vendedor',
            user_name: 'Vendedor MX Consultoria 1',
            avatar_url: null,
            vnd_total: 0,
          },
  ] as RankingEntry[])
  const selfIndex = Math.max(0, top.findIndex((entry) => entry.user_id === selfId))
  const selfPosition = `${selfIndex + 1}º`
  const compactRanking = top.length <= 1

  return (
    <DashboardCard className="min-h-[310px]">
      <PanelTitle title="Ranking da loja" action="Ver ranking completo" to="/classificacao" />
      <div className="mt-mx-md divide-y divide-border-subtle">
        {top.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center justify-between gap-mx-sm ${compactRanking ? 'py-mx-xs' : 'py-mx-sm'} ${entry.user_id === selfId ? 'rounded-mx-md bg-brand-primary/5 px-mx-xs' : ''}`}
          >
            <div className="flex min-w-0 items-center gap-mx-sm">
              <span className="w-7 text-center text-sm font-semibold text-status-warning">
                {index < 3 ? ['1º', '2º', '3º'][index] : index + 1}
              </span>
              <Avatar src={entry.avatar_url || undefined} fallback={entry.user_name} alt={entry.user_name} className="h-9 w-9 rounded-full" />
              <Typography variant="p" className="truncate font-semibold text-text-primary">
                {entry.user_name}
              </Typography>
            </div>
            <Typography variant="p" className="shrink-0 font-semibold text-text-secondary">
              {entry.vnd_total} venda{entry.vnd_total === 1 ? '' : 's'}
            </Typography>
          </div>
        ))}
      </div>
      <div className="mt-mx-md rounded-mx-md bg-brand-primary/5 p-mx-sm">
        <Typography variant="caption" className="block font-semibold normal-case tracking-normal text-text-primary">
          Sua posição: {selfPosition}
        </Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
          Ranking atualizado após fechamento diário.
        </Typography>
      </div>
    </DashboardCard>
  )
}

function EvolutionPanel({ series }: { series: Array<{ label: string; value: number }> }) {
  const hasData = series.length > 1
  const max = Math.max(1, ...series.map((point) => point.value))
  const points = series
    .map((point, index) => `${(index / Math.max(series.length - 1, 1)) * 216},${82 - (point.value / max) * 60}`)
    .join(' ')

  return (
    <SmallPanel title="Minha evolução" action="Ver histórico" to="/vendedor/terminal-mx">
      <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
        Vendas dos últimos 7 dias
      </Typography>
      <div className="mt-mx-md h-36 rounded-mx-md bg-surface-alt p-mx-md">
        {hasData ? (
          <svg viewBox="0 0 220 90" className="h-full w-full" role="img" aria-label="Vendas dos últimos lançamentos">
            <polyline points={points} fill="none" stroke="var(--color-brand-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="var(--color-brand-primary)">
              {series.map((point, index) => (
                <circle key={`${point.label}-${index}`} cx={(index / Math.max(series.length - 1, 1)) * 216} cy={82 - (point.value / max) * 60} r="4" />
              ))}
            </g>
          </svg>
        ) : (
          <div className="space-y-mx-xs pt-mx-sm text-center">
            <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">
              Faça seus fechamentos diários para acompanhar:
            </Typography>
            {['vendas', 'agendamentos', 'retornos concluídos', 'disciplina da rotina'].map((item) => (
              <Typography key={item} variant="tiny" tone="muted" className="block normal-case tracking-normal">
                {item}
              </Typography>
            ))}
          </div>
        )}
      </div>
    </SmallPanel>
  )
}

function AchievementsPanel({ conquistas }: { conquistas: { itens: Achievement[]; total: number } }) {
  return (
    <SmallPanel title="Minhas conquistas" action="Ver todas" to="/classificacao">
      <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
        Conquistas liberadas conforme sua rotina evolui.
      </Typography>
      <div className="mt-mx-md space-y-mx-sm">
        {conquistas.itens.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-mx-sm">
            <div className="min-w-0">
              <Typography variant="p" className="text-sm font-semibold text-text-primary">
                {item.label}
              </Typography>
              <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
                {item.detail}
              </Typography>
            </div>
            <span className="shrink-0 rounded-mx-sm bg-status-success/10 px-2 py-1 text-xs font-semibold text-status-success">
              +{item.points} pts
            </span>
          </div>
        ))}
      </div>
      <div className="mt-mx-md flex items-center justify-between rounded-mx-md bg-brand-primary/5 p-mx-sm text-brand-primary">
        <span className="font-semibold">Total de pontos</span>
        <strong className="text-xl">{conquistas.total} pts</strong>
      </div>
    </SmallPanel>
  )
}

function TrainingsPanel({ treinamentos }: { treinamentos: TrainingCardData[] }) {
  const visibleTrainings = treinamentos.length > 0
    ? treinamentos
    : [
        { id: 'fallback-1', title: 'História, valores e cultura da MX', watched: false, progress_percent: 70 },
        { id: 'fallback-2', title: 'Funil comercial e conversões', watched: false, progress_percent: 50 },
      ]

  return (
    <SmallPanel title="Meus treinamentos" action="Ver todos" to="/treinamentos">
      <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
        Trilha atual: Vendedor N1
      </Typography>
      <div className="mt-mx-md space-y-mx-md">
        {visibleTrainings.map((training, index) => {
          const progress = training.progress_percent ?? (training.watched ? 100 : index === 0 ? 75 : 50)
          return (
            <div key={training.id || index} className="grid grid-cols-[82px_1fr] gap-mx-sm">
              <span className="grid h-14 place-items-center rounded-mx-md bg-surface-alt text-text-secondary">
                <PlayCircle size={26} />
              </span>
              <div className="min-w-0">
                <Typography variant="p" className="truncate text-sm font-semibold text-text-primary">
                  {training.title || 'Treinamento'}
                </Typography>
                <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
                  Módulo {Math.min(index + 2, 3)} de {index === 0 ? 5 : 4}
                </Typography>
                <MiniBar value={progress} className="mt-mx-xs" />
              </div>
            </div>
          )
        })}
      </div>
      <Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">
        Próxima ação: concluir módulo pendente.
      </Typography>
    </SmallPanel>
  )
}

function FeedbackPanel({ feedback }: { feedback: FeedbackCardData | null }) {
  const managerName = feedback?.manager?.name || feedback?.manager_name || 'Gestor'
  const feedbackDate = feedback?.created_at ? new Date(feedback.created_at).toLocaleDateString('pt-BR') : null

  return (
    <SmallPanel title="Último feedback" action="Ver todos" to="/devolutivas">
      {feedback ? (
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-md">
          <Typography variant="p" className="font-semibold text-text-primary">
            “{feedback.positives || feedback.action || 'Continue evoluindo na rotina.'}”
          </Typography>
          <div className="mt-mx-md border-t border-border-subtle pt-mx-sm">
            <Typography variant="caption" className="block font-semibold normal-case tracking-normal text-text-secondary">
              Ação vinculada: {feedback.action || 'Definir próximo passo comercial'}
            </Typography>
            <MiniBar value={feedback.acknowledged ? 100 : 35} className="mt-mx-xs" />
            <Typography variant="tiny" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
              {feedback.acknowledged ? '1 de 1 concluído' : 'ação em andamento'}
            </Typography>
          </div>
          <Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">
            {managerName}
            {feedbackDate ? ` · ${feedbackDate}` : ''}
          </Typography>
          <div className="mt-mx-md flex gap-mx-sm">
            <Link to="/devolutivas" className="inline-flex h-9 flex-1 items-center justify-center rounded-mx-md bg-brand-primary px-mx-sm text-xs font-semibold text-white">
              Li e compreendi
            </Link>
            <Link to="/devolutivas" className="inline-flex h-9 flex-1 items-center justify-center rounded-mx-md border border-border-subtle px-mx-sm text-xs font-semibold text-text-secondary">
              Responder
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-md">
          <div className="flex items-start gap-mx-xs text-text-tertiary">
            <MessageSquare size={16} />
            <div>
              <Typography variant="caption" tone="muted" className="normal-case tracking-normal">
                Nenhum feedback recebido ainda.
              </Typography>
              <Typography variant="tiny" tone="muted" className="mt-mx-xs block normal-case tracking-normal">
                Quando sua liderança registrar um feedback, ele aparecerá aqui com ação vinculada, prazo, status e confirmação de leitura.
              </Typography>
            </div>
          </div>
        </div>
      )}
    </SmallPanel>
  )
}

function HeaderIcon({ to, label, count, icon }: { to: string; label: string; count: number; icon: ReactNode }) {
  return (
    <Link
      to={to}
      aria-label={count > 0 ? `${count} ${label.toLowerCase()}` : label}
      className="relative grid h-12 w-12 place-items-center rounded-mx-md bg-white text-text-secondary shadow-mx-xs transition-colors hover:text-brand-primary"
    >
      {icon}
      {count > 0 && (
        <span className="absolute right-2 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-primary px-1 text-[10px] font-semibold leading-none text-white">
          {count}
        </span>
      )}
    </Link>
  )
}

function DashboardCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Card className={`rounded-mx-lg border border-border-subtle bg-white p-mx-md shadow-mx-sm ${className}`}>
      {children}
    </Card>
  )
}

function CardTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-mx-sm">
      <span className="text-brand-primary">{icon}</span>
      <Typography variant="h3" className="text-sm uppercase tracking-normal">
        {title}
      </Typography>
    </div>
  )
}

function PanelTitle({
  title,
  subtitle,
  action,
  to,
}: {
  title: string
  subtitle?: string
  action?: string
  to?: string
}) {
  return (
    <div className="flex items-start justify-between gap-mx-md">
      <div className="min-w-0">
        <Typography variant="h3" className="text-sm uppercase tracking-normal">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" tone="muted" className="mt-1 block normal-case tracking-normal">
            {subtitle}
          </Typography>
        )}
      </div>
      {action && to && (
        <Link to={to} className="shrink-0 text-xs font-semibold text-brand-primary">
          {action}
        </Link>
      )}
    </div>
  )
}

function SmallPanel({ title, action, to, children }: { title: string; action: string; to: string; children: ReactNode }) {
  return (
    <DashboardCard>
      <PanelTitle title={title} action={action} to={to} />
      {children}
    </DashboardCard>
  )
}

function InlineStat({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-mx-sm">
      <span className="text-text-secondary">{label}</span>
      <strong className={success ? 'font-semibold text-status-success' : 'font-semibold text-text-primary'}>{value}</strong>
    </div>
  )
}

function MiniMetric({ label, value, hint, className = '' }: { label: string; value: string; hint: string; className?: string }) {
  return (
    <div className={className}>
      <Typography variant="tiny" tone="muted" className="block font-semibold normal-case tracking-normal">
        {label}
      </Typography>
      <Typography variant="h2" className="text-2xl">
        {value}
      </Typography>
      <Typography variant="tiny" tone="muted" className="normal-case tracking-normal">
        {hint}
      </Typography>
    </div>
  )
}

function MiniBar({ value, className = '' }: { value: number; className?: string }) {
  const normalized = Math.max(0, Math.min(100, value))
  return (
    <div className={`h-2 rounded-full bg-surface-alt ${className}`}>
      <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${normalized}%` }} />
    </div>
  )
}

function MiniSparkline({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 48" className={`h-12 w-full ${className}`} role="img" aria-label="Tendência da comissão">
      <polyline
        points="0,40 18,34 36,37 54,28 72,32 90,24 108,30 126,20 144,23 162,14 180,7"
        fill="none"
        stroke="var(--color-brand-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M0 40 L18 34 L36 37 L54 28 L72 32 L90 24 L108 30 L126 20 L144 23 L162 14 L180 7 L180 48 L0 48 Z" fill="var(--color-brand-primary)" opacity="0.08" />
    </svg>
  )
}

function ProgressRing({ value, label, large = false }: { value: number; label: string; large?: boolean }) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={`${large ? 'h-28 w-28' : 'h-24 w-24'} grid shrink-0 place-items-center rounded-full`}
      style={{ background: `conic-gradient(var(--color-brand-primary) ${normalized * 3.6}deg, var(--color-border-subtle) 0deg)` }}
    >
      <div className={`${large ? 'h-20 w-20' : 'h-16 w-16'} grid place-items-center rounded-full bg-white text-center`}>
        <span className="text-xl font-semibold leading-none">{normalized}%</span>
        <span className="px-1 text-[10px] font-semibold leading-tight text-text-secondary">{label}</span>
      </div>
    </div>
  )
}

function CheckRow({ label, value, done = false }: { label: string; value: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-mx-sm text-sm">
      <span className="flex min-w-0 items-center gap-mx-xs text-text-secondary">
        {done ? <CheckCircle2 size={16} className="shrink-0 text-status-success" /> : <Circle size={16} className="shrink-0 text-text-tertiary" />}
        <span className="min-w-0 leading-snug">{label}</span>
      </span>
      {value && <strong className="shrink-0 font-semibold text-text-primary">{value}</strong>}
    </div>
  )
}

export default VendedorHome
