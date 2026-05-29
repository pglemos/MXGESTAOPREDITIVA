import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  ListChecks,
  MessageSquare,
  Plus,
  Shield,
  Target,
} from 'lucide-react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { LancamentoGateBanner } from './components/LancamentoGateBanner'
import { VendedorHomeErrorBoundary } from './components/VendedorHomeErrorBoundary'
import { VendedorHomeSkeleton } from './sections/VendedorHomeSkeleton'
import { useVendedorHomePage } from './hooks/useVendedorHomePage'

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

  const { metrics, profile, todayCheckin, isLancamentoGateLocked, discipline, ranking, treinamentos, devolutivas } = home
  const firstName = profile?.name?.split(' ')[0] || 'Vendedor'
  const goal = Number(metrics.meta || 0)
  const remaining = Math.max(goal - metrics.vendasMes, 0)
  const disciplinePct = discipline?.percentage ?? (todayCheckin ? 100 : 0)
  const activitiesDone = [
    todayCheckin ? 1 : 0,
    metrics.agendamentosHoje > 0 ? 1 : 0,
    metrics.vendasOntem > 0 ? 1 : 0,
  ].reduce((acc, item) => acc + item, 0)
  const dayCompletion = Math.round((activitiesDone / 3) * 100)
  const score = Math.min(1000, Math.round((Math.min(metrics.atingimento, 100) * 5) + (disciplinePct * 3) + (Math.min(metrics.agendamentosHoje, 10) * 20)))
  const level = score >= 760 ? 'Ouro MX' : score >= 520 ? 'Prata MX' : 'Bronze MX'
  const nextLevel = score >= 760 ? 'Diamante MX' : score >= 520 ? 'Ouro MX' : 'Prata MX'
  const watchedTrainings = treinamentos.filter(training => training.watched).length
  const latestFeedback = devolutivas[0] || null
  const visibleRanking = ranking.filter(row => !row.is_venda_loja).slice(0, 5)

  const activityRows = [
    { label: 'Leads registrados', value: todayCheckin?.leads_prev_day ?? 0, icon: <ListChecks size={16} />, tone: 'danger' as Tone },
    { label: 'Agendamentos', value: metrics.agendamentosHoje, icon: <CalendarDays size={16} />, tone: 'success' as Tone },
    { label: 'Visitas D-1', value: todayCheckin?.visit_prev_day ?? 0, icon: <Clock size={16} />, tone: 'info' as Tone },
    { label: 'Vendas D-1', value: metrics.vendasOntem, icon: <BadgeCheck size={16} />, tone: 'warning' as Tone },
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
          <section className="grid grid-cols-1 gap-mx-lg lg:grid-cols-12" aria-label="Resumo do vendedor">
            <GoalCard
              goal={goal}
              realized={metrics.vendasMes}
              projection={metrics.projecao}
              attainment={metrics.atingimento}
              remaining={remaining}
            />
            <CommissionCard />
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
              hasTodayCheckin={!!todayCheckin}
              agendamentosHoje={metrics.agendamentosHoje}
              vendasOntem={metrics.vendasOntem}
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

        <section className="grid grid-cols-1 gap-mx-lg xl:grid-cols-12" aria-label="Evolucao do vendedor">
          <VendedorHomeErrorBoundary sectionName="Minha evolução">
            <EvolutionCard vendasSemana={metrics.vendasSemana} vendasMes={metrics.vendasMes} />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Minhas conquistas">
            <AchievementsCard
              agendamentosHoje={metrics.agendamentosHoje}
              vendasSemana={metrics.vendasSemana}
              hasTodayCheckin={!!todayCheckin}
              score={score}
            />
          </VendedorHomeErrorBoundary>

          <VendedorHomeErrorBoundary sectionName="Treinamentos">
            <TrainingsCard trainings={treinamentos.slice(0, 2)} watched={watchedTrainings} total={treinamentos.length} />
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
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg lg:col-span-4">
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

function CommissionCard() {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg lg:col-span-2">
      <div className="flex items-center gap-mx-sm">
        <IconBubble tone="success"><DollarSign size={22} /></IconBubble>
        <Typography variant="h3" className="uppercase tracking-tight">Comissão Estimada</Typography>
      </div>
      <Typography variant="h2" tone="muted" className="mt-mx-lg">Pendente</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
        Regra de comissão ainda não configurada para cálculo automático.
      </Typography>
      <div className="mt-mx-lg rounded-mx-xl border border-dashed border-border-default bg-surface-alt p-mx-md">
        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Aguardando parametrização</Typography>
      </div>
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
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg lg:col-span-2">
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
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg lg:col-span-2">
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
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg lg:col-span-2">
      <div className="flex items-center gap-mx-sm">
        <IconBubble tone="brand"><Shield size={22} /></IconBubble>
        <Typography variant="h3" className="uppercase tracking-tight">Meu Score MX</Typography>
      </div>
      <div className="mt-mx-lg flex items-center gap-mx-md">
        <div className="flex h-mx-20 w-mx-20 shrink-0 items-center justify-center rounded-mx-3xl bg-mx-indigo-50 text-brand-primary shadow-mx-inner">
          <Shield size={38} />
        </div>
        <div className="min-w-0">
          <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-widest">Nível atual</Typography>
          <Typography variant="h3" className="truncate">{level}</Typography>
          <Typography variant="tiny" tone="brand" className="mt-mx-xs block font-black">{score}/1000 pts</Typography>
        </div>
      </div>
      <ProgressBar value={(score / 1000) * 100} className="mt-mx-md" />
      <Typography variant="tiny" tone="muted" className="mt-mx-sm block font-black uppercase tracking-tight">Próximo nível: {nextLevel}</Typography>
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
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-5">
      <PanelHeader title="Minha Agenda de Hoje" to="/historico" label="Ver agenda completa" />
      <div className="mt-mx-lg space-y-mx-sm">
        {isLocked ? (
          <EmptyLine
            title="Agenda bloqueada até o lançamento"
            detail="Registre o fechamento diário para liberar a leitura de agenda e leads."
          />
        ) : agendamentosHoje > 0 ? (
          <AgendaRow time="Hoje" title={`${agendamentosHoje} agendamentos registrados`} detail="Agenda declarada no fechamento diário." badge="Agendado" tone="success" />
        ) : (
          <EmptyLine title="Nenhum agendamento lançado" detail="A agenda depende do fechamento diário ou integração operacional." />
        )}
        <AgendaRow time="D-1" title={hasTodayCheckin ? 'Lançamento de produção registrado' : 'Fechamento ainda pendente'} detail={hasTodayCheckin ? 'Dados sincronizados para sua rotina.' : 'Finalize seu dia para alimentar ranking e gerente.'} badge={hasTodayCheckin ? 'Ok' : 'Pendente'} tone={hasTodayCheckin ? 'success' : 'warning'} />
      </div>
      <Button asChild className="mt-mx-lg h-mx-12 w-full rounded-mx-xl">
        <Link to="/lancamento-diario"><Plus size={16} /> Nova Atividade</Link>
      </Button>
    </Card>
  )
}

function CloseDayCard({
  completion,
  hasTodayCheckin,
  agendamentosHoje,
  vendasOntem,
}: {
  completion: number
  hasTodayCheckin: boolean
  agendamentosHoje: number
  vendasOntem: number
}) {
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-3">
      <Typography variant="h3" className="uppercase tracking-tight">Fechar Meu Dia</Typography>
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">Registre suas atividades e finalize o dia com foco.</Typography>
      <div className="mt-mx-lg grid grid-cols-[auto_1fr] items-center gap-mx-lg">
        <CircularScore value={completion} label="do dia concluído" />
        <div className="space-y-mx-sm">
          <CheckItem label="Lançamento realizado" value={hasTodayCheckin ? '1/1' : '0/1'} done={hasTodayCheckin} />
          <CheckItem label="Agenda registrada" value={agendamentosHoje > 0 ? '1/1' : '0/1'} done={agendamentosHoje > 0} />
          <CheckItem label="Produção registrada" value={vendasOntem > 0 ? '1/1' : '0/1'} done={vendasOntem > 0} />
        </div>
      </div>
      <Button asChild className="mt-mx-lg h-mx-12 w-full rounded-mx-xl">
        <Link to="/lancamento-diario">Fechar meu dia</Link>
      </Button>
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
              <span className="w-mx-8 text-center text-lg font-black text-status-warning">{index + 1}º</span>
              <Avatar src={row.avatar_url || undefined} alt={`Avatar de ${row.user_name}`} fallback={row.user_name} size="sm" className="rounded-mx-lg" />
              <Typography variant="p" className="truncate font-black">{row.user_name}</Typography>
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

function EvolutionCard({ vendasSemana, vendasMes }: { vendasSemana: number; vendasMes: number }) {
  const bars = [Math.max(vendasSemana - 2, 0), Math.max(vendasSemana - 1, 0), vendasSemana, Math.max(vendasMes - vendasSemana, 0)]
  const max = Math.max(...bars, 1)
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-3">
      <PanelHeader title="Minha Evolução" to="/historico" label="Ver histórico" />
      <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">Vendas recentes registradas no MX.</Typography>
      <div className="mt-mx-lg flex h-mx-40 items-end gap-mx-md">
        {bars.map((value, index) => (
          <div key={`${value}-${index}`} className="flex flex-1 flex-col items-center gap-mx-xs">
            <div className="w-full rounded-mx-full bg-brand-primary" style={{ height: `${Math.max((value / max) * 100, 8)}%` }} />
            <Typography variant="mono" tone="muted">{value}</Typography>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AchievementsCard({ agendamentosHoje, vendasSemana, hasTodayCheckin, score }: { agendamentosHoje: number; vendasSemana: number; hasTodayCheckin: boolean; score: number }) {
  const rows = [
    { title: 'Meta diária de agendamentos', detail: agendamentosHoje > 0 ? `${agendamentosHoje} agendamentos hoje` : 'Aguardando agenda', pts: agendamentosHoje * 10, active: agendamentosHoje > 0 },
    { title: 'Fechamento consistente', detail: `${vendasSemana} vendas na semana`, pts: vendasSemana * 20, active: vendasSemana > 0 },
    { title: 'Atividades em dia', detail: hasTodayCheckin ? 'Rotina diária mantida' : 'Fechamento pendente', pts: hasTodayCheckin ? 30 : 0, active: hasTodayCheckin },
  ]
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-3">
      <PanelHeader title="Minhas Conquistas" to="/pdi" label="Ver todas" />
      <div className="mt-mx-md space-y-mx-sm">
        {rows.map(row => (
          <div key={row.title} className="flex items-center justify-between gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-sm">
            <div className="min-w-0">
              <Typography variant="p" className="truncate font-black">{row.title}</Typography>
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

function TrainingsCard({ trainings, watched, total }: { trainings: Array<{ id: string; title: string; watched: boolean; duration_minutes?: number | null }>; watched: number; total: number }) {
  const progress = total > 0 ? Math.round((watched / total) * 100) : 0
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-3">
      <PanelHeader title="Meus Treinamentos" to="/treinamentos" label="Ver todos" />
      <div className="mt-mx-md space-y-mx-sm">
        {trainings.length > 0 ? trainings.map(training => (
          <div key={training.id} className="flex items-center gap-mx-sm rounded-mx-xl bg-surface-alt p-mx-sm">
            <div className="flex h-mx-12 w-mx-12 shrink-0 items-center justify-center rounded-mx-lg bg-mx-black text-white">
              <GraduationCap size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <Typography variant="p" className="truncate font-black">{training.title}</Typography>
              <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{training.watched ? 'Concluído' : 'Em andamento'}</Typography>
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
  return (
    <Card className="border-none bg-white p-mx-lg shadow-mx-lg xl:col-span-3">
      <PanelHeader title="Último Feedback" to="/devolutivas" label="Ver todos" />
      {feedback ? (
        <div className="mt-mx-md rounded-mx-xl bg-mx-indigo-50 p-mx-md">
          <Typography variant="p" className="font-black">"{feedback.positives || feedback.action || 'Continue evoluindo na rotina.'}"</Typography>
          <div className="mt-mx-md flex items-center gap-mx-sm">
            <IconBubble tone="brand"><MessageSquare size={16} /></IconBubble>
            <div className="min-w-0">
              <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-widest">{feedback.manager_name || 'Gerente'}</Typography>
              <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{feedback.created_at ? new Date(feedback.created_at).toLocaleDateString('pt-BR') : 'Data pendente'}</Typography>
            </div>
          </div>
        </div>
      ) : (
        <EmptyLine title="Feedback pendente" detail="Seu gerente ainda não registrou uma devolutiva." />
      )}
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
      <Typography variant="tiny" tone="muted" className="block font-black uppercase tracking-tight">{label}</Typography>
      <Typography variant="h3" className="mt-mx-xs truncate font-mono-numbers">{value}</Typography>
      {detail && <Typography variant="tiny" tone="muted" className="block font-bold normal-case tracking-normal">{detail}</Typography>}
    </div>
  )
}

function CircularScore({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex h-mx-24 w-mx-24 shrink-0 flex-col items-center justify-center rounded-mx-full border-[10px] border-mx-indigo-100 bg-white text-center shadow-mx-inner">
      <Typography variant="h2" className="leading-none font-mono-numbers">{Math.round(value)}%</Typography>
      <Typography variant="tiny" tone="muted" className="mt-mx-tiny block font-black uppercase tracking-tight">{label}</Typography>
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

export default VendedorHome
