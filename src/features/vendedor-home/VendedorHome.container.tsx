import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { Card } from '@/components/molecules/Card'
import { PageHeading } from '@/components/molecules/PageHeading'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useMeuScore } from '@/features/crm/hooks/useMeuScore'
import { useAgendamentos } from '@/features/crm/hooks/useAgendamentos'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { GoalCard } from './sections/GoalCard'
import { CommissionCard } from './sections/CommissionCard'
import { AppointmentsCard } from './sections/AppointmentsCard'
import { ActivitiesCard, type ActivitySummary } from './sections/ActivitiesCard'
import { ScoreCard } from './sections/ScoreCard'
import { ExecutionCenter } from './sections/ExecutionCenterCard'
import { CloseDayCard } from './sections/CloseDayCard'
import { RankingPanel } from './sections/HomeRankingPanel'
import { EvolutionPanel } from './sections/EvolutionPanel'
import { AchievementsPanel, type Achievement } from './sections/AchievementsPanel'
import { TrainingsPanel, type TrainingCardData } from './sections/TrainingsPanel'
import { FeedbackPanel, type FeedbackCardData } from './sections/FeedbackPanel'

export { EstimatedSalaryCard } from './sections/EstimatedSalaryCard'

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
  if (!trimmed) return 'Vendedor'

  const parts = trimmed.split(/\s+/)
  const [first] = parts
  if (first?.toLowerCase() === 'vendedor') return 'Vendedor'

  return first || 'Vendedor'
}

export function VendedorHome() {
  const { profile } = useAuth()
  const { unreadCount } = useNotifications()
  const home = useVendedorHomePage()
  const { score, loading: scoreLoading, bandLabel, nextBand } = useMeuScore()
  const { agendamentos, metrics: agendaMetrics } = useAgendamentos()
  const { oportunidades } = useOportunidades()

  const firstName = resolveGreetingName(profile?.name)
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
  const metrics = home.metrics
  const hasMetrics = Boolean(metrics)
  const meta = metrics?.meta ?? 0
  const vendasMes = metrics?.vendasMes ?? 0
  const projecao = metrics?.projecao ?? 0
  const faltam = metrics?.faltaX ?? Math.max(meta - vendasMes, 0)
  const atingimento = metrics?.atingimento ?? 0
  const disciplina = home.discipline?.percentage ?? 0
  const isInitialLoading = home.isLoading && !hasMetrics
  const agendamentosMeta = 8

  const agendaHoje = useMemo(
    () => agendamentos.filter((agendamento) => isToday(agendamento.data_hora)),
    [agendamentos],
  )

  const feedbacksPendentes = useMemo(
    () => (home.devolutivas || []).filter((feedback) => !feedback.acknowledged).length,
    [home.devolutivas],
  )
  const attackItems = [
    agendaMetrics.agendamentosHoje === 0
      ? 'Criar novos agendamentos na Central'
      : `${agendaMetrics.agendamentosHoje} agendamento${agendaMetrics.agendamentosHoje === 1 ? '' : 's'} para executar hoje`,
    faltam > 0
      ? `Priorizar ${faltam} venda${faltam === 1 ? '' : 's'} restante${faltam === 1 ? '' : 's'} para a meta`
      : 'Proteger carteira e manter qualidade pós-meta',
    feedbacksPendentes > 0
      ? `Responder ${feedbacksPendentes} feedback${feedbacksPendentes === 1 ? '' : 's'} obrigatório${feedbacksPendentes === 1 ? '' : 's'}`
      : 'Atualizar status dos clientes movimentados',
  ]

  const atividades = useMemo<ActivitySummary>(() => {
    const oportunidadesHoje = oportunidades.filter((item) => {
      const reference = item.updated_at || item.created_at
      return reference ? isToday(reference) : false
    })
    const negociacoes = oportunidadesHoje.filter((item) => item.etapa === 'negociacao' || item.etapa === 'fechamento').length
    const visitas = agendaHoje.filter((item) => item.tipo === 'visita' || item.tipo === 'test_drive').length
    const retornos = agendaHoje.filter((item) => item.tipo === 'retorno').length
    const prospeccoes = oportunidadesHoje.filter((item) => item.etapa === 'prospeccao').length
    const indicacoes = oportunidadesHoje.filter((item) => item.canal === 'carteira' && item.etapa === 'qualificacao').length

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
  return (
    <div className="h-full w-full overflow-y-auto bg-surface-alt p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-20">
        <PageHeading
          title={`${getGreeting()}, ${firstName}! 👋`}
          subtitle="Organize sua rotina, execute as ações certas e registre o Fechamento Diário."
          actions={(
            <span className="inline-flex h-12 items-center gap-mx-sm rounded-mx-md border border-border-subtle bg-white px-mx-md text-sm font-semibold normal-case shadow-mx-xs">
              {todayLabel}
              <CalendarDays size={16} className="text-text-tertiary" />
            </span>
          )}
        />

        <section className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-5">
          <GoalCard meta={meta} vendidos={vendasMes} projecao={projecao} faltam={faltam} atingimento={atingimento} hasMetrics={!isInitialLoading} attackItems={attackItems} />
          <CommissionCard estimativa={home.remuneracaoEstimada} />
          <AppointmentsCard
            total={agendaMetrics.agendamentosHoje}
            confirmados={agendaMetrics.confirmados}
            aguardando={agendaMetrics.aguardando}
            metaDiaria={agendamentosMeta}
          />
          <ActivitiesCard atividades={atividades} />
          <ScoreCard score={score} loading={scoreLoading} bandLabel={bandLabel} nextBand={nextBand} />
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
    </div>
  )
}

export default VendedorHome
