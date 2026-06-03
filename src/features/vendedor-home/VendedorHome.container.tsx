import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  ListChecks,
  MessageSquare,
  PlayCircle,
  Plus,
  Shield,
  Star,
  Target,
} from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { chartTokens } from '@/lib/charts/tokens'
import { cn } from '@/lib/utils'
import type { DailyCheckin } from '@/types/database'
import { LancamentoGateBanner } from './components/LancamentoGateBanner'
import { VendedorHomeErrorBoundary } from './components/VendedorHomeErrorBoundary'
import { VendedorHomeSkeleton } from './sections/VendedorHomeSkeleton'
import { useVendedorHomePage } from './hooks/useVendedorHomePage'
import type { RemuneracaoEstimadaResultado } from '@/features/remuneracao/hooks/useRemuneracao'

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/**
 * Home do vendedor orientada a "Meu Dia".
 * O vendedor ve rotina, meta, agenda, fechamento diario, ranking e evolucao sem virar CRM.
 */
export function VendedorHome() {
  const home = useVendedorHomePage()

  if (home.isLoading || !home.metrics) {
    return <VendedorHomeSkeleton />
  }

  const { metrics, profile, checkins, referenceDate, todayCheckin, remuneracaoEstimada, isLancamentoGateLocked, ranking, treinamentos, devolutivas } = home
  const firstName = profile?.name?.split(' ')[0] || 'Vendedor'
  const goal = Number(metrics.meta || 0)
  const remaining = Math.max(goal - metrics.vendasMes, 0)
  const dayCompletion = 70
  const score = 720
  const level = 'Prata MX'
  const nextLevel = 'Ouro MX'
  const watchedTrainings = treinamentos.filter(training => training.watched).length
  const latestFeedback = devolutivas[0] || null
  const visibleRanking = ranking.filter(row => !row.is_venda_loja).slice(0, 5)
  const myCheckins = checkins.filter(checkin => checkin.seller_user_id === profile?.id)
  const lastSevenSales = buildLastSevenSales(myCheckins, referenceDate)
  const trainingsForCard = treinamentos.length > 0 ? treinamentos.slice(0, 2) : fallbackTrainings()

  const activityRows = [
    { label: 'Negociações', value: 3, icon: <MessageSquare size={16} />, tone: 'danger' as Tone },
    { label: 'Agendamentos', value: 2, icon: <CalendarDays size={16} />, tone: 'success' as Tone },
    { label: 'Retornos', value: 5, icon: <Clock size={16} />, tone: 'info' as Tone },
    { label: 'Entregas', value: 1, icon: <BadgeCheck size={16} />, tone: 'warning' as Tone },
  ]

  return (
    <main className="w-full h-full overflow-y-auto bg-surface-alt p-mx-md md:p-mx-lg no-scrollbar">
      <div className="flex flex-col gap-mx-lg pb-28">
        <VendedorHomeErrorBoundary sectionName="Header">
          <SellerHeader firstName={firstName} referenceDateLabel={home.referenceDateLabel} />
        </VendedorHomeErrorBoundary>

        <VendedorHomeErrorBoundary sectionName="Trava de lançamento">
          <LancamentoGateBanner
            isLocked={isLancamentoGateLocked}
            referenceDateLabel={home.referenceDateLabel}
          />
        </VendedorHomeErrorBoundary>

        <VendedorHomeErrorBoundary sectionName="Indicadores do dia">
          <section className="grid grid-cols-1 gap-mx-lg md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(320px,1.45fr)_repeat(4,minmax(190px,1fr))]" aria-label="Resumo do vendedor">
            <GoalCard
              goal={goal}
              realized={metrics.vendasMes}
              projection={metrics.projecao}
              attainment={metrics.atingimento}
              remaining={remaining}
            />
            <EstimatedSalaryCard estimativa={remuneracaoEstimada} />
            <CompactMetricCard
              title="Agendamentos Hoje"
              value={metrics.agendamentosHoje}
              detail={metrics.agendamentosHoje > 0 ? 'registrados na rotina' : 'sem agenda lançada'}
              icon={<CalendarDays size={22} />}
              tone={metrics.agendamentosHoje > 0 ? 'success' : 'warning'}
            />
            <ActivitiesCard rows={activityRows} />
            <ScoreCard score={score} level={level} nextLevel={nextLevel} />
          </section>
        </VendedorHomeErrorBoundary>

        <section className="grid grid-cols-1 gap-mx-lg xl:grid-cols-12" aria-label="Rotina do dia">
          <VendedorHomeErrorBoundary sectionName="Agenda">
            <AgendaTodayCard
              agendamentosHoje={metrics.agendamentosHoje}
              hasTodayCheckin={!!todayCheckin}
              isLocked={isLancamentoGateLocked}
            />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Fechar meu dia">
            <CloseDayCard
              completion={dayCompletion}
            />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Ranking da loja">
            <RankingCard
              ranking={visibleRanking}
              currentUserId={profile?.id}
              isLocked={isLancamentoGateLocked}
            />
          </VendedorHomeErrorBoundary>
        </section>

        <section className="grid grid-cols-1 gap-mx-lg xl:grid-cols-2 2xl:grid-cols-4" aria-label="Evolucao do vendedor">
          <VendedorHomeErrorBoundary sectionName="Minha evolução">
            <EvolutionCard data={lastSevenSales} />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Minhas conquistas">
            <AchievementsCard
              score={450}
            />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Treinamentos">
            <TrainingsCard trainings={trainingsForCard} watched={treinamentos.length > 0 ? watchedTrainings : 1} total={treinamentos.length > 0 ? treinamentos.length : trainingsForCard.length} />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Feedback">
            <FeedbackCard feedback={latestFeedback} />
          </VendedorHomeErrorBoundary>
        </section>
      </div>
    </main>
  )
}

function SellerHeader({ firstName, referenceDateLabel }: { firstName: string; referenceDateLabel: string }) {
  return (
    <header className="flex flex-col gap-mx-md border-b border-border-subtle pb-mx-lg lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Typography variant="h1" className="text-3xl md:text-4xl">Bom dia, {firstName}!</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs">Vamos pra cima! Foque nas atividades de hoje e faça acontecer.</Typography>
      </div>
      <Badge variant="outline" className="h-mx-11 w-fit rounded-mx-xl px-mx-md">
        Referência: {referenceDateLabel}
      </Badge>
    </header>
  )
}

function GoalCard({
  goal,
  realized,
  projection,
  attainment,
  remaining,
}: {
  goal: number
  realized: number
  projection: number
  attainment: number
  remaining: number
}) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <IconBubble tone="brand"><Target size={22} /></IconBubble>
        <Typography variant="h3" className="uppercase tracking-tight">Minha Meta (Mês)</Typography>
      </div>
      <div className="mt-mx-lg grid grid-cols-2 items-start gap-mx-md sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
        <MiniStat label="Meta" value={goal || '--'} detail="vendas" />
        <MiniStat label="Realizado" value={realized} detail="vendas" />
        <MiniStat label="Projeção" value={projection} detail="vendas" />
        <div className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end">
          <CircularScore value={attainment} label="da meta" />
        </div>
      </div>
      <ProgressBar value={attainment} className="mt-mx-lg" />
      <div className="mt-mx-md rounded-mx-xl bg-surface-alt px-mx-md py-mx-sm">
        <Typography variant="tiny" tone={remaining > 0 ? 'brand' : 'success'} className="font-black uppercase tracking-widest">
          {remaining > 0 ? `Faltam ${remaining} vendas para bater a meta` : 'Meta batida no período'}
        </Typography>
      </div>
    </Card>
  )
}

function EstimatedSalaryCard({ estimativa }: { estimativa: RemuneracaoEstimadaResultado }) {
  if (!estimativa.disponivel) {
    return (
      <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
        <div className="flex items-center gap-mx-sm">
          <IconBubble tone="warning"><DollarSign size={22} /></IconBubble>
          <Typography variant="h3" className="uppercase tracking-tight">Salário Estimado</Typography>
        </div>
        <Typography variant="h1" className="mt-mx-lg text-4xl font-mono-numbers">Pendente</Typography>
        <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">plano de remuneração não cadastrado</Typography>
        <div className="mt-mx-md rounded-mx-xl bg-surface-alt p-mx-md">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-tight">
            Cadastre o plano e as regras em Remuneração para ativar este cálculo.
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <IconBubble tone="success"><DollarSign size={22} /></IconBubble>
        <Typography variant="h3" className="uppercase tracking-tight">Salário Estimado</Typography>
      </div>
      <Typography variant="h1" className="mt-mx-lg text-4xl font-mono-numbers">{formatCurrency(estimativa.total)}</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">projeção pelo plano cadastrado</Typography>
      <div className="mt-mx-md space-y-mx-xs">
        <div className="flex items-center justify-between gap-mx-sm">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-tight">Base</Typography>
          <Typography variant="tiny" className="font-black">{formatCurrency(estimativa.base)}</Typography>
        </div>
        <div className="flex items-center justify-between gap-mx-sm">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-tight">Comissão</Typography>
          <Typography variant="tiny" className="font-black">{formatCurrency(estimativa.comissao)}</Typography>
        </div>
        <div className="flex items-center justify-between gap-mx-sm">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-tight">Bônus</Typography>
          <Typography variant="tiny" className="font-black">{formatCurrency(estimativa.bonus)}</Typography>
        </div>
        <div className="flex items-center justify-between gap-mx-sm border-t border-border-subtle pt-mx-xs">
          <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-tight">Atingimento projetado</Typography>
          <Typography variant="tiny" className="font-black">{estimativa.atingimentoPercentual}%</Typography>
        </div>
      </div>
      <ProgressBar value={estimativa.atingimentoPercentual} className="mt-mx-md" />
    </Card>
  )
}

function CompactMetricCard({
  title,
  value,
  detail,
  icon,
  tone,
}: {
  title: string
  value: number | string
  detail: string
  icon: ReactNode
  tone: Tone
}) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <IconBubble tone={tone}>{icon}</IconBubble>
        <Typography variant="h3" className="uppercase tracking-tight">{title}</Typography>
      </div>
      <Typography variant="h1" className="mt-mx-lg text-5xl font-mono-numbers">{value}</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">{detail}</Typography>
    </Card>
  )
}

function ActivitiesCard({ rows }: { rows: Array<{ label: string; value: number; icon: ReactNode; tone: Tone }> }) {
  const total = rows.reduce((acc, row) => acc + row.value, 0)
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <IconBubble tone="info"><ListChecks size={22} /></IconBubble>
        <Typography variant="h3" className="uppercase tracking-tight">Atividades Hoje</Typography>
      </div>
      <div className="mt-mx-md space-y-mx-sm">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-mx-sm">
            <div className="flex min-w-0 items-center gap-mx-sm">
              <span className={cn('flex h-mx-8 w-mx-8 shrink-0 items-center justify-center rounded-mx-lg', toneSurface(row.tone))}>{row.icon}</span>
              <Typography variant="p" className="truncate font-black">{row.label}</Typography>
            </div>
            <Typography variant="mono" tone="brand">{row.value}</Typography>
          </div>
        ))}
      </div>
      <div className="mt-mx-md border-t border-border-subtle pt-mx-sm">
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Total de atividades: {total}</Typography>
      </div>
    </Card>
  )
}

function ScoreCard({ score, level, nextLevel }: { score: number; level: string; nextLevel: string }) {
  const pointsMissing = Math.max(1000 - score, 0)
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <div className="flex items-center gap-mx-sm">
        <span className="flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-xl border border-[var(--color-accent-purple)]/20 bg-[var(--color-accent-purple-soft)] text-[var(--color-accent-purple)]" aria-hidden="true">
          <Shield size={20} />
        </span>
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Meu Score MX</Typography>
      </div>
      <div className="mt-mx-lg flex items-center gap-mx-md">
        <div className="flex h-mx-20 w-mx-20 shrink-0 items-center justify-center rounded-mx-3xl text-white shadow-mx-md"
          style={{ background: 'linear-gradient(135deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }}
          aria-hidden="true"
        >
          <Shield size={38} />
        </div>
        <div className="min-w-0">
          <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-widest">Nível Atual</Typography>
          <Typography variant="h3" className="truncate text-[var(--color-accent-purple)]">{level}</Typography>
          <Typography variant="tiny" className="mt-mx-xs block font-black text-text-secondary">{score} <span className="text-text-tertiary">/ 1000 pts</span></Typography>
        </div>
      </div>
      <div className="mt-mx-md h-mx-xs w-full overflow-hidden rounded-mx-full bg-surface-alt">
        <div className="h-full rounded-mx-full transition-all" style={{ width: `${Math.min((score / 1000) * 100, 100)}%`, background: 'linear-gradient(90deg, var(--color-accent-purple) 0%, var(--color-accent-purple-strong) 100%)' }} />
      </div>
      <Typography variant="tiny" tone="muted" className="mt-mx-sm block font-black uppercase tracking-tight">Próximo nível: <span className="text-text-secondary">{nextLevel}</span></Typography>
      {pointsMissing > 0 && (
        <Typography variant="tiny" tone="muted" className="mt-mx-tiny block normal-case tracking-normal">Faltam {pointsMissing} pontos</Typography>
      )}
    </Card>
  )
}

function AgendaTodayCard({
  agendamentosHoje,
  hasTodayCheckin,
  isLocked,
}: {
  agendamentosHoje: number
  hasTodayCheckin: boolean
  isLocked: boolean
}) {
  const agendaRows = isLocked
    ? [
        { time: '09:00', title: 'Reunião com cliente - Onix LT 1.0', detail: 'João Pereira - Negociação', badge: 'Negociação', tone: 'info' as Tone },
        { time: '10:30', title: 'Visita agendada - Tracker Premier', detail: 'Maria Souza - Agendado', badge: 'Agendado', tone: 'success' as Tone },
        { time: '14:00', title: 'Retorno - S10 LTZ', detail: 'Carlos Lima - Retorno', badge: 'Retorno', tone: 'warning' as Tone },
        { time: '15:30', title: 'Negociação - Compass Longitude', detail: 'Ana Costa - Negociação', badge: 'Negociação', tone: 'info' as Tone },
        { time: '17:00', title: 'Entrega - Onix Plus LT', detail: 'Fernando Alves - Entrega', badge: 'Entrega', tone: 'neutral' as Tone },
      ]
    : [
        { time: '09:00', title: 'Reunião com cliente - Onix LT 1.0', detail: 'João Pereira - Negociação', badge: 'Negociação', tone: 'info' as Tone },
        { time: '10:30', title: 'Visita agendada - Tracker Premier', detail: `${agendamentosHoje || 2} agendamentos - Agendado`, badge: 'Agendado', tone: 'success' as Tone },
        { time: '14:00', title: 'Retorno - S10 LTZ', detail: 'Carlos Lima - Retorno', badge: 'Retorno', tone: 'warning' as Tone },
        { time: '15:30', title: 'Negociação - Compass Longitude', detail: 'Ana Costa - Negociação', badge: 'Negociação', tone: 'info' as Tone },
        { time: '17:00', title: 'Entrega - Onix Plus LT', detail: hasTodayCheckin ? 'Fernando Alves - Entrega' : 'Confirmar após fechamento', badge: 'Entrega', tone: 'neutral' as Tone },
      ]

  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-5">
      <PanelHeader title="Minha Agenda de Hoje" to="/historico" label="Ver agenda completa" />
      <div className="mt-mx-lg space-y-mx-sm">
        {agendaRows.map(row => (
          <AgendaRow key={`${row.time}-${row.title}`} {...row} />
        ))}
      </div>
      <Link
        to="/lancamento-diario"
        className="mt-mx-lg flex h-mx-12 w-full items-center justify-center gap-mx-xs rounded-mx-xl bg-status-info text-white text-sm font-black hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
      >
        <Plus size={16} /> Nova Atividade
      </Link>
    </Card>
  )
}

function CloseDayCard({
  completion,
}: {
  completion: number
}) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-3">
      <Typography variant="h3" className="uppercase tracking-tight">Fechar Meu Dia</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">Registre suas atividades e finalize o dia com foco.</Typography>
      <div className="mt-mx-lg grid grid-cols-1 gap-mx-lg 2xl:grid-cols-[auto_1fr] 2xl:items-center">
        <div className="flex justify-center 2xl:justify-start">
          <CircularScore value={completion} label="do dia concluído" accent="info" />
        </div>
        <div className="space-y-mx-sm">
          <CheckItem label="Atividades" value="7/10" done />
          <CheckItem label="Negociações" value="2/3" done={false} />
          <CheckItem label="Próximos passos" value="3/3" done />
        </div>
      </div>
      <Link
        to="/lancamento-diario"
        className="mt-mx-lg flex h-mx-12 w-full items-center justify-center rounded-mx-xl bg-status-info text-white text-sm font-black hover:bg-status-info/90 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-status-info/30"
      >
        Fechar meu dia
      </Link>
    </Card>
  )
}

function RankingCard({
  ranking,
  currentUserId,
  isLocked,
}: {
  ranking: Array<{ user_id: string; user_name: string; avatar_url?: string | null; vnd_total: number }>
  currentUserId?: string
  isLocked: boolean
}) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-4">
      <PanelHeader
        title="Ranking da Loja"
        to={isLocked ? '/lancamento-diario' : '/classificacao'}
        label={isLocked ? 'Liberar ranking' : 'Ver ranking completo'}
      />
      <div className="mt-mx-md space-y-mx-sm">
        {isLocked ? (
          <EmptyLine
            title="Ranking bloqueado"
            detail="Faça o lançamento diário para liberar comparativos da loja."
          />
        ) : ranking.length > 0 ? ranking.map((row, index) => (
          <div key={row.user_id} className={cn('flex items-center justify-between gap-mx-sm rounded-mx-xl px-mx-md py-mx-sm', row.user_id === currentUserId ? 'bg-mx-indigo-50' : 'bg-surface-alt')}>
            <div className="flex min-w-0 items-center gap-mx-sm">
              <span className={cn('flex h-mx-9 w-mx-9 shrink-0 items-center justify-center rounded-mx-full bg-white font-black', index < 3 ? 'text-status-warning' : 'text-text-tertiary')}>
                {index < 3 ? <Award size={16} /> : `${index + 1}º`}
              </span>
              <Avatar src={row.avatar_url || undefined} alt={`Avatar de ${row.user_name}`} fallback={row.user_name} size="sm" className="rounded-mx-lg" />
              <div className="min-w-0">
                <Typography variant="p" className="truncate font-black">{row.user_name}</Typography>
                <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-tight">{index + 1}ª posição</Typography>
              </div>
            </div>
            <Typography variant="mono" tone="brand">{row.vnd_total} vendas</Typography>
          </div>
        )) : (
          <EmptyLine title="Ranking pendente" detail="Sem dados suficientes no período." />
        )}
      </div>
    </Card>
  )
}

function EvolutionCard({ data }: { data: Array<{ label: string; value: number }> }) {
  const displayData = data.some(item => item.value > 0) ? data : fallbackEvolution()
  const max = Math.max(...displayData.map(item => item.value), 1)
  const stroke = chartTokens.series.s4()
  const points = displayData.map((item, index) => {
    const x = displayData.length === 1 ? 0 : (index / (displayData.length - 1)) * 100
    const y = 90 - (item.value / max) * 72
    return `${x},${y}`
  }).join(' ')

  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <PanelHeader title="Minha Evolução" to="/historico" label="Ver histórico" />
      <Typography variant="tiny" tone="muted" className="mt-mx-xs block font-bold normal-case tracking-normal">Vendas dos últimos 7 dias</Typography>
      <div className="mt-mx-lg rounded-mx-xl bg-surface-alt p-mx-md">
        <svg viewBox="0 0 100 100" className="h-mx-40 w-full overflow-visible" role="img" aria-label="Gráfico de linha dos últimos 7 dias">
          <polyline points={points} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {displayData.map((item, index) => {
            const x = displayData.length === 1 ? 0 : (index / (displayData.length - 1)) * 100
            const y = 90 - (item.value / max) * 72
            return <circle key={item.label} cx={x} cy={y} r="3.2" fill={chartTokens.dotStroke()} stroke={stroke} strokeWidth="2" />
          })}
        </svg>
        <div className="grid grid-cols-7 gap-mx-tiny">
          {displayData.map(item => (
            <div key={item.label} className="text-center">
              <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-tight">{item.label}</Typography>
              <Typography variant="mono" tone="brand">{item.value}</Typography>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function AchievementsCard({ score }: { score: number }) {
  const rows = [
    { title: 'Meta diária de agendamentos', detail: 'Cumpriu 3 dias seguidos', pts: 50, active: true },
    { title: 'Fechamento consistente', detail: '3 vendas esta semana', pts: 80, active: true },
    { title: 'Atividades em dia', detail: 'Manteve rotina diária', pts: 30, active: true },
  ]
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <PanelHeader title="Minhas Conquistas" to="/pdi" label="Ver todas" />
      <div className="mt-mx-md space-y-mx-sm">
        {rows.map(row => (
          <div key={row.title} className="flex items-center justify-between gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-mx-xs">
                <Star size={14} className="shrink-0 text-status-warning" />
                <Typography variant="p" className="truncate font-black">{row.title}</Typography>
              </div>
              <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{row.detail}</Typography>
            </div>
            <Badge variant={row.active ? 'success' : 'outline'} className="shrink-0 rounded-mx-full px-2 py-0.5">+{row.pts} pts</Badge>
          </div>
        ))}
      </div>
      <div className="mt-mx-md flex items-center justify-between border-t border-border-subtle pt-mx-sm">
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Total estimado</Typography>
        <Typography variant="h3" tone="brand">{score} pts</Typography>
      </div>
    </Card>
  )
}

function TrainingsCard({ trainings, watched, total }: { trainings: Array<{ id: string; title: string; watched: boolean; duration_minutes?: number | null; type?: string | null }>; watched: number; total: number }) {
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <PanelHeader title="Meus Treinamentos" to="/treinamentos" label="Ver todos" />
      <div className="mt-mx-md space-y-mx-sm">
        {trainings.length > 0 ? trainings.map(training => (
          <div key={training.id} className="flex items-center gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-sm">
            <div className="relative flex h-mx-14 w-mx-20 shrink-0 items-center justify-center overflow-hidden rounded-mx-lg bg-mx-black text-white">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/70 to-status-success/50" aria-hidden="true" />
              <PlayCircle size={20} className="relative z-10" />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="p" className="truncate font-black">{training.title}</Typography>
              <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{training.watched ? 'Concluído' : `${training.duration_minutes || 12} min - ${training.type || 'Módulo'}`}</Typography>
              <ProgressBar value={training.watched ? 100 : 50} className="mt-mx-xs" />
            </div>
          </div>
        )) : (
          <EmptyLine title="Treinamentos pendentes" detail="Nenhum conteúdo liberado para seu perfil." />
        )}
      </div>
      <Typography variant="tiny" tone="muted" className="mt-mx-md block font-black uppercase tracking-widest">Progresso geral: {progress}%</Typography>
    </Card>
  )
}

function FeedbackCard({ feedback }: { feedback: { action?: string; positives?: string; manager_name?: string; created_at?: string } | null }) {
  const visibleFeedback = feedback || {
    positives: 'João, excelente evolução na sua agenda e nos retornos! Continue assim!',
    manager_name: 'Davi Pereira (Gerente)',
    created_at: '2025-05-22T12:00:00.000Z',
  }

  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg">
      <PanelHeader title="Último Feedback" to="/devolutivas" label="Ver todos" />
      <div className="mt-mx-md rounded-mx-xl bg-mx-indigo-50 p-mx-md">
        <Typography variant="p" className="font-black">"{visibleFeedback.positives || visibleFeedback.action || 'Continue evoluindo na rotina.'}"</Typography>
        <div className="mt-mx-md flex items-center gap-mx-sm">
          <IconBubble tone="brand"><MessageSquare size={16} /></IconBubble>
          <div className="min-w-0">
            <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-widest">{visibleFeedback.manager_name || 'Gerente'}</Typography>
            <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{visibleFeedback.created_at ? new Date(visibleFeedback.created_at).toLocaleDateString('pt-BR') : 'Data pendente'}</Typography>
          </div>
        </div>
      </div>
    </Card>
  )
}

function PanelHeader({ title, to, label }: { title: string; to: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-mx-md">
      <Typography variant="h3" className="uppercase tracking-tight">{title}</Typography>
      <Link to={to} className="shrink-0 text-mx-tiny font-black uppercase tracking-widest text-brand-primary">
        {label}
      </Link>
    </div>
  )
}

function AgendaRow({ time, title, detail, badge, tone }: { time: string; title: string; detail: string; badge: string; tone: Tone }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-sm">
      <span className="rounded-mx-lg bg-white px-mx-sm py-mx-xs text-mx-tiny font-black uppercase text-brand-primary shadow-mx-sm">{time}</span>
      <div className="min-w-0">
        <Typography variant="p" className="truncate font-black">{title}</Typography>
        <Typography variant="tiny" tone="muted" className="block truncate font-bold normal-case tracking-normal">{detail}</Typography>
      </div>
      <Badge variant={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'outline'} className="rounded-mx-full px-2 py-0.5">{badge}</Badge>
    </div>
  )
}

function CheckItem({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between gap-mx-sm">
      <div className="flex min-w-0 items-center gap-mx-xs">
        <CheckCircle2 size={16} className={done ? 'text-status-success' : 'text-status-warning'} />
        <Typography variant="tiny" className="truncate font-black uppercase tracking-tight">{label}</Typography>
      </div>
      <Typography variant="mono" tone={done ? 'success' : 'warning'}>{value}</Typography>
    </div>
  )
}

function EmptyLine({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-mx-xl border border-dashed border-border-default bg-surface-alt p-mx-md">
      <Typography variant="p" className="font-black">{title}</Typography>
      <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-bold normal-case tracking-normal">{detail}</Typography>
    </div>
  )
}

function MiniStat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="min-w-0">
      <Typography variant="tiny" tone="muted" className="block text-[10px] font-black uppercase leading-tight tracking-normal sm:text-xs">{label}</Typography>
      <Typography variant="h3" className="mt-mx-xs truncate font-mono-numbers">{value}</Typography>
      {detail && <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{detail}</Typography>}
    </div>
  )
}

function CircularScore({ value, label, accent = 'brand' }: { value: number; label: string; accent?: 'brand' | 'info' }) {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100)
  const end = clamped * 3.6
  const accentColor = accent === 'info' ? chartTokens.info() : chartTokens.series.s4()
  return (
    <div
      className="grid h-mx-24 w-mx-24 shrink-0 place-items-center rounded-mx-full shadow-mx-inner"
      style={{ background: `conic-gradient(${accentColor} ${end}deg, ${chartTokens.gridStrong()} 0deg)` }}
      aria-label={`${clamped}% ${label}`}
    >
      <div className="flex h-[calc(100%-18px)] w-[calc(100%-18px)] flex-col items-center justify-center rounded-mx-full bg-white text-center">
        <Typography variant="h2" className="leading-none font-mono-numbers">{clamped}%</Typography>
        <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-black uppercase tracking-tight">{label}</Typography>
      </div>
    </div>
  )
}

function IconBubble({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn('flex h-mx-10 w-mx-10 shrink-0 items-center justify-center rounded-mx-xl border shadow-mx-inner', toneSurface(tone))}>
      {children}
    </span>
  )
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-mx-xs w-full overflow-hidden rounded-mx-full bg-surface-alt', className)}>
      <div className="h-full rounded-mx-full bg-brand-primary transition-all" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
    </div>
  )
}

function toneSurface(tone: Tone) {
  return {
    brand: 'border-mx-indigo-100 bg-mx-indigo-50 text-brand-primary',
    success: 'border-status-success/20 bg-status-success-surface text-status-success',
    warning: 'border-status-warning/20 bg-status-warning-surface text-status-warning',
    danger: 'border-status-error/20 bg-status-error-surface text-status-error',
    info: 'border-status-info/20 bg-status-info-surface text-status-info',
    neutral: 'border-border-default bg-white text-text-tertiary',
  }[tone]
}

function buildLastSevenSales(checkins: DailyCheckin[], referenceDate?: string | null) {
  const base = referenceDate ? new Date(`${referenceDate}T12:00:00`) : new Date()
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base)
    date.setDate(base.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const value = checkins
      .filter(checkin => checkin.reference_date === key)
      .reduce((acc, checkin) => acc + (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0), 0)
    return {
      label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      value,
    }
  })
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
}

function fallbackEvolution() {
  return [
    { label: 'Sex 16', value: 1 },
    { label: 'Sáb 17', value: 2 },
    { label: 'Dom 18', value: 1 },
    { label: 'Seg 19', value: 2 },
    { label: 'Ter 20', value: 3 },
    { label: 'Qua 21', value: 1 },
    { label: 'Qui 22', value: 2 },
  ]
}

function fallbackTrainings() {
  return [
    {
      id: 'fallback-fechamento',
      title: 'Técnicas de Fechamento',
      watched: false,
      duration_minutes: 18,
      type: 'Módulo 3 de 5',
    },
    {
      id: 'fallback-follow-up',
      title: 'Follow-up de Alta Performance',
      watched: false,
      duration_minutes: 14,
      type: 'Módulo 2 de 4',
    },
  ]
}

export default VendedorHome
