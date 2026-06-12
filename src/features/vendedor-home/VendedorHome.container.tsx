import { useMemo } from 'react'
import { Award, CalendarDays, CheckCircle2, DollarSign, ListChecks, MessageSquare, PlayCircle, Plus, Shield, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/atoms/Avatar'
import { Card } from '@/components/molecules/Card'
import { Typography } from '@/components/atoms/Typography'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useVendedorHomePage } from '@/features/vendedor-home/hooks/useVendedorHomePage'
import { useMeuScore } from '@/features/crm/hooks/useMeuScore'
import { useAgendamentos, type AgendamentoComCliente } from '@/features/crm/hooks/useAgendamentos'
import { useOportunidades } from '@/features/crm/hooks/useOportunidades'
import { CRM_AGENDAMENTO_STATUS_LABEL } from '@/lib/schemas/crm.schema'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

const TIPO_LABEL: Record<string, string> = {
  visita: 'Visita',
  retorno: 'Retorno',
  test_drive: 'Test drive',
  entrega: 'Entrega',
  negociacao: 'Negociação',
}

const saudacao = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const isHoje = (iso: string) => {
  const d = new Date(iso)
  const agora = new Date()
  return d.getDate() === agora.getDate() && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
}

export function VendedorHome() {
  const { profile } = useAuth()
  const { unreadCount } = useNotifications()
  const home = useVendedorHomePage()
  const { score, bandLabel, nextBand } = useMeuScore()
  const { agendamentos, metrics: agendaMetrics } = useAgendamentos()
  const { oportunidades } = useOportunidades()

  const firstName = profile?.name?.split(' ')[0] || 'Vendedor'
  const meta = home.metrics?.meta ?? 0
  const vendasMes = home.metrics?.vendasMes ?? 0
  const faltam = Math.max(meta - vendasMes, 0)
  const atingimento = meta > 0 ? Math.min(100, Math.round((vendasMes / meta) * 100)) : 0

  const agendaHoje = useMemo(() => agendamentos.filter(a => isHoje(a.data_hora)), [agendamentos])

  const atividades = useMemo(() => {
    const negociacoes = oportunidades.filter(o => o.etapa === 'negociacao').length
    const visitas = agendaHoje.filter(a => a.tipo === 'visita' || a.tipo === 'test_drive').length
    const retornos = agendaHoje.filter(a => a.tipo === 'retorno').length
    const entregas = agendaHoje.filter(a => a.tipo === 'entrega').length
    return { negociacoes, visitas, retornos, entregas, total: negociacoes + visitas + retornos + entregas }
  }, [agendaHoje, oportunidades])

  const disciplina = home.discipline?.percentage ?? 0

  const conquistas = useMemo(() => {
    const itens = [
      { label: `Vendas no mês (${vendasMes})`, pontos: vendasMes * 50 },
      { label: `Agendamentos hoje (${agendaMetrics.agendamentosHoje})`, pontos: agendaMetrics.agendamentosHoje * 10 },
      { label: `Disciplina da rotina (${disciplina}%)`, pontos: Math.round(disciplina / 10) },
    ]
    return { itens, total: itens.reduce((acc, i) => acc + i.pontos, 0) }
  }, [agendaMetrics.agendamentosHoje, disciplina, vendasMes])

  const evolucao = useMemo(() => {
    if (!profile?.id) return []
    return home.checkins
      .filter(c => c.seller_user_id === profile.id)
      .slice(0, 7)
      .reverse()
      .map(c => (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0))
  }, [home.checkins, profile?.id])

  const ultimoFeedback = home.devolutivas?.[0] || null
  const treinamentosTop = (home.treinamentos || []).slice(0, 2)
  const hojeLabel = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="h-full w-full overflow-y-auto bg-white p-mx-md md:p-mx-lg no-scrollbar">
      <div className="mx-auto grid max-w-[1680px] gap-mx-lg pb-20">
        <div className="flex min-w-0 flex-col gap-mx-lg">
          <header className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
            <div>
              <Typography variant="h1" className="text-4xl leading-tight">{saudacao()}, {firstName}! 👋</Typography>
              <Typography variant="p" tone="muted" className="mt-1">Vamos pra cima! Foque nas atividades de hoje e faça acontecer.</Typography>
            </div>
            <div className="hidden items-center gap-mx-md xl:flex">
              <span className="rounded-mx-md border border-border-subtle px-mx-md py-mx-sm text-sm font-black capitalize">{hojeLabel}</span>
              {unreadCount > 0 && (
                <Link to="/notificacoes" aria-label={`${unreadCount} notificações não lidas`} className="grid h-10 w-10 place-items-center rounded-full bg-status-error-surface text-status-error">{unreadCount}</Link>
              )}
              <Avatar src={profile?.avatar_url || undefined} fallback={profile?.name || 'V'} alt={profile?.name || 'Vendedor'} className="h-11 w-11 rounded-full" />
              <div><Typography variant="p" className="font-black">{profile?.name || 'Vendedor'}</Typography><Typography variant="tiny" tone="muted">Vendedor</Typography></div>
            </div>
          </header>

          <section className="grid gap-mx-md md:grid-cols-2 xl:grid-cols-5">
            <GoalCard meta={meta} vendidos={vendasMes} faltam={faltam} atingimento={atingimento} />
            <Metric
              icon={<DollarSign size={22} />}
              title="Comissão estimada"
              value={home.remuneracaoEstimada?.disponivel ? BRL(home.remuneracaoEstimada.total) : '—'}
              detail={home.remuneracaoEstimada?.disponivel ? 'estimativa projetada do mês' : 'plano não cadastrado'}
              footer={home.remuneracaoEstimada?.disponivel ? `${home.remuneracaoEstimada.atingimentoPercentual}% de atingimento projetado` : 'Fale com seu gestor para cadastrar o plano.'}
              tone="green"
            />
            <Metric
              icon={<CalendarDays size={22} />}
              title="Agendamentos hoje"
              value={String(agendaMetrics.agendamentosHoje)}
              detail={agendaMetrics.agendamentosHoje === 1 ? 'agendamento' : 'agendamentos'}
              footer={`${agendaMetrics.confirmados} confirmado(s) · ${agendaMetrics.aguardando} aguardando`}
              tone="blue"
            />
            <Activities atividades={atividades} />
            <ScoreCard score={score} bandLabel={bandLabel} nextBand={nextBand} />
          </section>

          <section className="grid gap-mx-lg xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.8fr)_minmax(360px,.95fr)]">
            <Agenda items={agendaHoje} />
            <CloseDay disciplina={disciplina} fechamentoFeito={Boolean(home.todayCheckin)} agendamentosHoje={agendaMetrics.agendamentosHoje} compareceram={agendaMetrics.compareceram} />
            <RankingPanel ranking={home.ranking || []} selfId={profile?.id} />
          </section>

          <section className="grid gap-mx-lg md:grid-cols-2 xl:grid-cols-4">
            <Evolution series={evolucao} />
            <Achievements conquistas={conquistas} />
            <Trainings treinamentos={treinamentosTop} />
            <FeedbackPanel feedback={ultimoFeedback} />
          </section>
        </div>
      </div>
    </main>
  )
}

function GoalCard({ meta, vendidos, faltam, atingimento }: { meta: number; vendidos: number; faltam: number; atingimento: number }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Target size={22} className="text-brand-primary" /><Typography variant="h3" className="text-sm uppercase tracking-normal">Minha meta (mês)</Typography></div>
      <div className="mt-mx-md grid grid-cols-[1fr_1fr_auto] items-center gap-mx-sm">
        <Mini label="Meta" value={meta > 0 ? String(meta) : '—'} hint="vendas" />
        <Mini label="Realizado" value={String(vendidos)} hint="vendas" />
        <Circle value={atingimento} />
      </div>
      <div className="mt-mx-md h-2 rounded-full bg-surface-alt"><div className="h-2 rounded-full bg-brand-primary" style={{ width: `${atingimento}%` }} /></div>
      <Typography variant="p" className="mt-mx-md text-sm font-black text-text-primary">
        {meta === 0 ? 'Meta mensal não cadastrada.' : faltam === 0 ? 'Meta do mês batida! 🎉' : `Faltam ${faltam} venda${faltam === 1 ? '' : 's'} para bater a meta!`}
      </Typography>
    </Card>
  )
}

function Metric({ icon, title, value, detail, footer, tone }: { icon: React.ReactNode; title: string; value: string; detail: string; footer: string; tone: 'green' | 'blue' }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm">
        <span className={tone === 'green' ? 'text-status-success' : 'text-brand-primary'}>{icon}</span>
        <Typography variant="h3" className="text-sm uppercase tracking-normal">{title}</Typography>
      </div>
      <Typography variant="h1" className="mt-mx-md text-4xl">{value}</Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">{detail}</Typography>
      <Typography variant="caption" className="mt-mx-md block font-black normal-case tracking-normal text-text-secondary">{footer}</Typography>
    </Card>
  )
}

function Activities({ atividades }: { atividades: { negociacoes: number; visitas: number; retornos: number; entregas: number; total: number } }) {
  const rows: Array<[string, number]> = [
    ['Negociações', atividades.negociacoes],
    ['Visitas hoje', atividades.visitas],
    ['Retornos hoje', atividades.retornos],
    ['Entregas hoje', atividades.entregas],
  ]
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><ListChecks size={22} className="text-brand-primary" /><Typography variant="h3" className="text-sm uppercase tracking-normal">Atividades hoje</Typography></div>
      <div className="mt-mx-md space-y-mx-xs">
        {rows.map(([label, value]) => <div key={label} className="flex justify-between text-sm font-black"><span className="text-text-secondary">{label}</span><span>{value}</span></div>)}
      </div>
      <div className="mt-mx-md border-t border-border-subtle pt-mx-sm text-sm font-black">Total de atividades <span className="float-right">{atividades.total}</span></div>
    </Card>
  )
}

function ScoreCard({ score, bandLabel, nextBand }: { score: { value: number; band: string } | null; bandLabel: Record<string, string>; nextBand: Record<string, string> }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <div className="flex items-center gap-mx-sm"><Award size={22} className="text-brand-primary" /><Typography variant="h3" className="text-sm uppercase tracking-normal">Meu Score MX</Typography></div>
      <div className="mt-mx-md flex items-center gap-mx-md">
        <span className="grid h-20 w-20 place-items-center rounded-mx-xl bg-brand-primary text-white"><Shield size={40} /></span>
        {score ? (
          <div>
            <Typography variant="caption" tone="muted">Banda atual</Typography>
            <Typography variant="h3">{bandLabel[score.band] || score.band}</Typography>
            <Typography variant="caption" className="font-black text-brand-primary">{score.value} /100 pts</Typography>
          </div>
        ) : (
          <div>
            <Typography variant="caption" tone="muted">Score MX</Typography>
            <Typography variant="h3">Sem score</Typography>
            <Typography variant="caption" className="font-black text-text-tertiary">aguardando cálculo</Typography>
          </div>
        )}
      </div>
      <div className="mt-mx-md h-2 rounded-full bg-surface-alt"><div className="h-2 rounded-full bg-brand-primary" style={{ width: `${score?.value ?? 0}%` }} /></div>
      <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">
        {score ? `Próxima banda: ${nextBand[score.band] || '—'}` : 'O score é calculado a partir dos seus lançamentos.'}
      </Typography>
    </Card>
  )
}

function Agenda({ items }: { items: AgendamentoComCliente[] }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <PanelTitle title="Minha agenda de hoje" action="Ver na Central de Execução" to="/central-execucao" />
      <div className="mt-mx-md space-y-mx-xs">
        {items.length === 0 && (
          <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">Nada agendado para hoje. Crie um compromisso na Central de Execução.</Typography>
        )}
        {items.map(item => {
          const time = new Date(item.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          const tipo = TIPO_LABEL[item.tipo] || 'Compromisso'
          const veiculo = item.oportunidade?.veiculo_interesse
          return (
            <div key={item.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-mx-sm rounded-mx-md bg-white py-mx-xs">
              <span className="rounded-mx-sm bg-brand-primary/5 px-2 py-1 text-sm font-black text-brand-primary">{time}</span>
              <div className="min-w-0">
                <Typography variant="p" className="truncate text-sm font-black">{tipo}{veiculo ? ` - ${veiculo}` : ''}</Typography>
                <Typography variant="tiny" tone="muted" className="block truncate normal-case tracking-normal">{item.cliente?.nome || 'Cliente não informado'} · {CRM_AGENDAMENTO_STATUS_LABEL[item.status]}</Typography>
              </div>
              <span className="rounded-mx-sm bg-brand-primary/10 px-2 py-1 text-xs font-black text-brand-primary">{tipo}</span>
            </div>
          )
        })}
      </div>
      <Link to="/central-execucao" className="mt-mx-md flex h-11 w-full items-center justify-center gap-mx-xs rounded-mx-md bg-brand-primary text-sm font-black text-white"><Plus size={16} /> Nova Atividade</Link>
    </Card>
  )
}

function CloseDay({ disciplina, fechamentoFeito, agendamentosHoje, compareceram }: { disciplina: number; fechamentoFeito: boolean; agendamentosHoje: number; compareceram: number }) {
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <Typography variant="h3" className="text-sm uppercase tracking-normal">Fechar meu dia</Typography>
      <Typography variant="caption" tone="muted" className="normal-case tracking-normal">Registre suas atividades e finalize o dia com foco!</Typography>
      <div className="mt-mx-lg grid grid-cols-[120px_1fr] items-center gap-mx-md">
        <Circle value={disciplina} label="disciplina 7 dias" />
        <div className="space-y-mx-sm">
          <Check label="Fechamento Diário" value={fechamentoFeito ? 'Feito' : 'Pendente'} />
          <Check label="Agendamentos hoje" value={String(agendamentosHoje)} />
          <Check label="Compareceram" value={String(compareceram)} />
        </div>
      </div>
      <Link to="/lancamento-diario" className="mt-mx-lg flex h-12 w-full items-center justify-center rounded-mx-md bg-brand-primary text-sm font-black text-white">Fechar meu dia</Link>
    </Card>
  )
}

function RankingPanel({ ranking, selfId }: { ranking: Array<{ user_id: string; user_name: string; avatar_url?: string | null; vnd_total: number }>; selfId?: string }) {
  const top = ranking.slice(0, 5)
  return (
    <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm">
      <PanelTitle title="Ranking da loja" action="Ver ranking completo" to="/classificacao" />
      <div className="mt-mx-md space-y-mx-sm">
        {top.length === 0 && (
          <Typography variant="caption" tone="muted" className="block normal-case tracking-normal">Sem lançamentos no período para montar o ranking.</Typography>
        )}
        {top.map((entry, index) => (
          <div key={entry.user_id} className={`flex items-center justify-between rounded-mx-sm ${entry.user_id === selfId ? 'bg-brand-primary/5 px-mx-xs py-1' : ''}`}>
            <div className="flex items-center gap-mx-sm">
              <span className="w-6 text-center font-black text-status-warning">{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</span>
              <Avatar src={entry.avatar_url || undefined} fallback={entry.user_name} alt={entry.user_name} className="h-9 w-9 rounded-full" />
              <Typography variant="p" className="font-black">{entry.user_name}</Typography>
            </div>
            <Typography variant="p" className="font-black text-text-secondary">{entry.vnd_total} venda{entry.vnd_total === 1 ? '' : 's'}</Typography>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Evolution({ series }: { series: number[] }) {
  const hasData = series.length > 1
  const max = Math.max(1, ...series)
  const points = series.map((value, index) => `${(index / Math.max(series.length - 1, 1)) * 216},${82 - (value / max) * 60}`).join(' ')
  return (
    <SmallPanel title="Minha evolução" action="Ver histórico" to="/historico">
      <div className="mt-mx-md h-36 rounded-mx-md bg-surface-alt p-mx-md">
        {hasData ? (
          <svg viewBox="0 0 220 90" className="h-full w-full" role="img" aria-label="Vendas dos últimos lançamentos">
            <polyline points={points} fill="none" stroke="var(--color-brand-primary)" strokeWidth="4" />
            <g fill="var(--color-brand-primary)">
              {series.map((value, index) => (
                <circle key={index} cx={(index / Math.max(series.length - 1, 1)) * 216} cy={82 - (value / max) * 60} r="4" />
              ))}
            </g>
          </svg>
        ) : (
          <Typography variant="caption" tone="muted" className="block pt-mx-lg text-center normal-case tracking-normal">Faça seus fechamentos diários para acompanhar a evolução.</Typography>
        )}
      </div>
    </SmallPanel>
  )
}

function Achievements({ conquistas }: { conquistas: { itens: Array<{ label: string; pontos: number }>; total: number } }) {
  return (
    <SmallPanel title="Minhas conquistas" action="Ver ranking" to="/classificacao">
      {conquistas.itens.map(item => (
        <div key={item.label} className="mt-mx-sm flex justify-between text-sm"><b>{item.label}</b><span className="font-black text-status-success">+{item.pontos} pts</span></div>
      ))}
      <div className="mt-mx-md rounded-mx-md bg-brand-primary/5 p-mx-sm text-right text-xl font-black text-brand-primary">{conquistas.total} pts</div>
    </SmallPanel>
  )
}

function Trainings({ treinamentos }: { treinamentos: Array<{ id?: string; title?: string; watched?: boolean }> }) {
  return (
    <SmallPanel title="Meus treinamentos" action="Ver todos" to="/treinamentos">
      {treinamentos.length === 0 && (
        <Typography variant="caption" tone="muted" className="mt-mx-sm block normal-case tracking-normal">Nenhum conteúdo liberado para seu perfil ainda.</Typography>
      )}
      {treinamentos.map((t, index) => (
        <div key={t.id || index} className="mt-mx-sm flex gap-mx-sm">
          <span className="grid h-14 w-20 place-items-center rounded-mx-md bg-surface-alt"><PlayCircle size={24} /></span>
          <div className="flex-1">
            <Typography variant="p" className="text-sm font-black">{t.title || 'Treinamento'}</Typography>
            <div className="mt-2 h-2 rounded-full bg-surface-alt"><div className="h-2 rounded-full bg-status-success" style={{ width: `${t.watched ? 100 : 0}%` }} /></div>
          </div>
        </div>
      ))}
    </SmallPanel>
  )
}

function FeedbackPanel({ feedback }: { feedback: { action?: string; positives?: string; manager_name?: string; created_at?: string } | null }) {
  return (
    <SmallPanel title="Último feedback" action="Ver todos" to="/devolutivas">
      {feedback ? (
        <div className="mt-mx-md rounded-mx-md bg-brand-primary/5 p-mx-md">
          <Typography variant="p" className="font-black">"{feedback.positives || feedback.action || 'Continue evoluindo na rotina.'}"</Typography>
          <Typography variant="caption" tone="muted" className="mt-mx-md block normal-case tracking-normal">
            {feedback.manager_name || 'Gestor'}{feedback.created_at ? ` · ${new Date(feedback.created_at).toLocaleDateString('pt-BR')}` : ''}
          </Typography>
        </div>
      ) : (
        <div className="mt-mx-md rounded-mx-md bg-surface-alt p-mx-md">
          <span className="flex items-center gap-mx-xs text-text-tertiary"><MessageSquare size={16} /><Typography variant="caption" tone="muted" className="normal-case tracking-normal">Nenhum feedback recebido ainda.</Typography></span>
        </div>
      )}
    </SmallPanel>
  )
}

function PanelTitle({ title, action, to }: { title: string; action: string; to: string }) {
  return <div className="flex items-center justify-between"><Typography variant="h3" className="text-sm uppercase tracking-normal">{title}</Typography><Link to={to} className="text-xs font-black text-brand-primary">{action}</Link></div>
}

function SmallPanel({ title, action, to, children }: { title: string; action: string; to: string; children: React.ReactNode }) {
  return <Card className="rounded-mx-lg border border-border-subtle bg-white p-mx-lg shadow-mx-sm"><PanelTitle title={title} action={action} to={to} />{children}</Card>
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div><Typography variant="tiny" tone="muted" className="block font-black normal-case tracking-normal">{label}</Typography><Typography variant="h2" className="text-2xl">{value}</Typography><Typography variant="tiny" tone="muted">{hint}</Typography></div>
}

function Circle({ value, label = 'da meta' }: { value: number; label?: string }) {
  return <div className="grid h-24 w-24 place-items-center rounded-full" style={{ background: `conic-gradient(var(--color-brand-primary) ${value * 3.6}deg, var(--color-border-subtle) 0deg)` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center"><span className="text-xl font-black">{value}%</span><span className="-mt-5 text-[10px] font-bold text-text-secondary">{label}</span></div></div>
}

function Check({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-mx-sm text-sm font-black"><span className="flex items-center gap-mx-xs text-text-secondary"><CheckCircle2 size={16} className="text-status-success" /> {label}</span><span>{value}</span></div>
}

export default VendedorHome
