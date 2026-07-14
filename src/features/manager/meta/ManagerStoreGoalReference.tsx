import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { format, endOfMonth, parseISO } from 'date-fns'
import { Activity, CalendarDays, CheckCircle2, RefreshCw, ShoppingCart, Target, TrendingUp, Wrench, Zap } from 'lucide-react'
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
import { getDiasInfo } from '@/lib/calculations'
import { chartTokens } from '@/lib/charts/tokens'
import type { useDashboardLojaData } from '@/features/dashboard-loja/hooks/useDashboardLojaData'
import { ManagerHomeReturnLink } from '@/features/manager/home/ManagerHomeReturnLink'
import { buildStoreGoalClosingRows, calculateStoreGoalMetrics, calculateSustainabilityPlan, formatStoreGoalMetric, operationalDayPredicate } from './manager-store-goal'

type DashboardData = ReturnType<typeof useDashboardLojaData>
type Horizon = 'hoje' | 'semana' | 'dezena' | 'mes'

export function ManagerStoreGoalReference({ data }: { data: DashboardData }) {
  const [month, setMonth] = useState(data.referenceDate.slice(0, 7))
  const [horizon, setHorizon] = useState<Horizon>('semana')

  useEffect(() => {
    data.setViewMode('month')
    return () => data.setViewMode('day')
  }, [data.setViewMode])

  const projectionMode = data.operationalMetaRules?.projection_mode || 'calendar'
  const activeReferenceDate = data.referenceDate < data.startDate
    ? data.startDate
    : data.referenceDate > data.endDate
      ? data.endDate
      : data.referenceDate
  const days = getDiasInfo(activeReferenceDate, projectionMode)
  const goal = data.metrics.goalValue || 0
  const sales = data.metrics.totalSales || 0
  const { proportionalGoal, gap, paceGap, projection, dailyPace } = calculateStoreGoalMetrics(goal, sales, {
    elapsed: days.decorridos,
    total: days.total,
    remaining: days.restantes,
  })
  const attainment = goal > 0 ? Math.round((sales / goal) * 100) : 0
  const projectedPct = goal > 0 ? Math.round((projection / goal) * 100) : 0

  const chartData = useMemo(() => {
    const salesByDate = new Map<string, number>()
    for (const checkin of data.checkins) {
      const value = (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0)
      salesByDate.set(checkin.reference_date, (salesByDate.get(checkin.reference_date) || 0) + value)
    }
    let cumulative = 0
    return Array.from(salesByDate.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, value]) => {
        cumulative += value
        const elapsed = getDiasInfo(date, projectionMode).decorridos
        return {
          date: date.slice(8, 10),
          realizado: cumulative,
          meta: days.total > 0 ? Number(((goal / days.total) * elapsed).toFixed(1)) : 0,
          projecao: days.decorridos > 0 ? Number(((sales / days.decorridos) * elapsed).toFixed(1)) : 0,
        }
      })
  }, [data.checkins, days.decorridos, days.total, goal, projectionMode, sales])

  const channelResults = useMemo(() => data.checkins.reduce((totals, checkin) => ({
    showroom: totals.showroom + (checkin.vnd_porta_prev_day || 0),
    carteira: totals.carteira + (checkin.vnd_cart_prev_day || 0),
    internet: totals.internet + (checkin.vnd_net_prev_day || 0),
  }), { showroom: 0, carteira: 0, internet: 0 }), [data.checkins])

  const closingRows = useMemo(() => buildStoreGoalClosingRows(data.checkins), [data.checkins])

  const operationalStats = useMemo(() => {
    const salesInBase = closingRows.reduce((total, row) => total + row.sales, 0)
    const appointmentsInBase = closingRows.reduce((total, row) => total + row.appointments, 0)
    const visitsInBase = closingRows.reduce((total, row) => total + row.visits, 0)
    return {
      agendaPerSale: salesInBase > 0 ? appointmentsInBase / salesInBase : 0,
      visitsPerSale: salesInBase > 0 ? visitsInBase / salesInBase : 0,
    }
  }, [closingRows])

  const sustainabilityPlan = useMemo(() => calculateSustainabilityPlan({
    horizon,
    goal,
    realized: sales,
    referenceDate: activeReferenceDate,
    monthDays: { total: days.total, elapsed: days.decorridos, remaining: days.restantes },
    closings: closingRows,
    agendaPerSale: operationalStats.agendaPerSale,
    visitsPerSale: operationalStats.visitsPerSale,
    isOperationalDay: operationalDayPredicate(projectionMode),
  }), [activeReferenceDate, closingRows, days.decorridos, days.restantes, days.total, goal, horizon, operationalStats.agendaPerSale, operationalStats.visitsPerSale, projectionMode, sales])

  const changeMonth = (value: string) => {
    if (!/^\d{4}-\d{2}$/.test(value)) return
    setMonth(value)
    const start = `${value}-01`
    data.setStartDate(start)
    data.setEndDate(format(endOfMonth(parseISO(start)), 'yyyy-MM-dd'))
  }

  return (
    <section className="min-h-full bg-gray-50" aria-labelledby="manager-store-goal-title">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
        <ManagerHomeReturnLink />
        <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 id="manager-store-goal-title" className="text-xl font-bold text-gray-800">Meta da Loja</h1>
              <p className="mt-0.5 text-sm text-gray-500">Acompanhe o resultado da loja e saiba o que fazer para alcançar a meta.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-gray-500">Período
                <input type="month" value={month} onChange={(event) => changeMonth(event.target.value)} className="mt-1 block rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <button type="button" onClick={() => void data.handleRefresh()} disabled={data.isRefetching} className="inline-flex h-[38px] items-center gap-1 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                <RefreshCw size={15} className={data.isRefetching ? 'animate-spin' : ''} /> Atualizar
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GoalCard icon={Target} label="Progresso da meta" tone="emerald">{goal > 0 ? <><strong className="text-2xl text-gray-800">{sales}<span className="text-sm font-medium text-gray-400"> de {goal}</span></strong><Progress value={attainment} /><CardFooter left={`${attainment}%`} right="atingido" /></> : <EmptyGoalState />}</GoalCard>
          <GoalCard icon={CalendarDays} label="Meta proporcional até hoje" tone="blue">{goal > 0 ? <><strong className="text-2xl text-gray-800">{formatStoreGoalMetric(proportionalGoal)}<span className="text-sm font-medium text-gray-400"> vendas</span></strong><p className="mt-2 text-xs text-gray-500">Realizado: <b>{sales}</b></p><p className={`mt-1 text-sm font-bold ${paceGap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{paceGap > 0 ? `−${formatStoreGoalMetric(paceGap)} abaixo do ritmo` : 'Dentro do ritmo'}</p></> : <EmptyGoalState />}</GoalCard>
          <GoalCard icon={ShoppingCart} label="Faltam vender" tone="orange">{goal > 0 ? <><strong className="text-4xl text-gray-800">{gap}</strong><p className="mt-2 text-xs text-gray-500">vendas para atingir a meta mensal</p></> : <EmptyGoalState />}</GoalCard>
          <GoalCard icon={TrendingUp} label="Projeção e ritmo necessário" tone="violet">{goal > 0 ? <><strong className="text-3xl text-gray-800">{formatStoreGoalMetric(projection)}<span className="text-sm font-medium text-gray-400"> vendas</span></strong><p className="mt-1 text-sm font-bold text-violet-600">{projectedPct}% da meta</p><p className="mt-2 text-xs text-gray-500">Ritmo necessário: <b>{formatStoreGoalMetric(dailyPace)} por dia</b></p></> : <EmptyGoalState />}</GoalCard>
        </div>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800">Evolução da Meta</h2>
          <div className="mt-4 h-72">
            {goal <= 0 ? <div className="grid h-full place-items-center rounded-xl bg-gray-50 text-sm text-gray-500">Meta ainda não cadastrada.</div> : chartData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid()} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTokens.axisTick() }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTokens.axisTick() }} /><Tooltip /><Legend /><Line type="monotone" dataKey="meta" name="Meta acumulada" stroke={chartTokens.series.s6()} strokeDasharray="4 4" dot={false} /><Line type="monotone" dataKey="realizado" name="Realizado" stroke={chartTokens.success()} strokeWidth={2} /><Line type="monotone" dataKey="projecao" name="Projeção" stroke={chartTokens.series.s7()} strokeDasharray="5 3" dot={false} /></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center rounded-xl bg-gray-50 text-sm text-gray-500">A evolução aparecerá quando houver lançamentos oficiais no período.</div>}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-100"><Activity size={16} className="text-emerald-600" /></span><h2 className="font-semibold text-gray-800">Plano de Sustentação</h2></div>
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">{([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['dezena', 'Esta dezena'], ['mes', 'Este mês']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setHorizon(key)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${horizon === key ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{label}</button>)}</div>
          {goal <= 0 ? <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">Meta ainda não cadastrada.</p> : <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SustainabilityBlock icon={Zap} label="Faltam" tone="orange">
                {sustainabilityPlan.objectiveReached ? <div className="flex items-center gap-1.5"><CheckCircle2 size={20} className="text-emerald-500" /><p className="text-sm font-semibold text-emerald-600">Objetivo atingido</p></div> : <><p className="text-2xl font-bold text-gray-800">{sustainabilityPlan.faltam} <span className="text-base font-medium text-gray-400">{sustainabilityPlan.faltam === 1 ? 'venda' : 'vendas'}</span></p><p className="mt-1 text-xs text-gray-400">{horizon === 'hoje' ? 'para hoje' : horizon === 'semana' ? 'nesta semana' : horizon === 'dezena' ? 'nesta dezena' : 'neste mês'}</p></>}
              </SustainabilityBlock>
              <SustainabilityBlock icon={Activity} label="Ritmo necessário" tone="blue">
                {sustainabilityPlan.objectiveReached ? <p className="text-sm font-semibold text-emerald-600">Ritmo suficiente</p> : <p className="text-base font-semibold leading-snug text-gray-700">{sustainabilityPlan.ritmoLabel}</p>}
              </SustainabilityBlock>
              <SustainabilityBlock icon={Wrench} label="Necessidade operacional" tone="purple">
                {sustainabilityPlan.objectiveReached ? <p className="text-sm font-semibold text-emerald-600">Necessidade atendida</p> : sustainabilityPlan.necessidadeOperacional === null ? <p className="text-sm font-semibold text-amber-700">Base estatística insuficiente</p> : <><p className="text-lg font-bold text-gray-800">{sustainabilityPlan.necessidadeOperacional} <span className="text-sm font-medium text-gray-400">{sustainabilityPlan.tipoOperacional}</span></p><p className="mt-1 text-xs text-gray-400">para gerar {sustainabilityPlan.faltam} {sustainabilityPlan.faltam === 1 ? 'venda' : 'vendas'}</p></>}
              </SustainabilityBlock>
            </div>
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-sm font-medium leading-snug text-emerald-700">{sustainabilityPlan.mensagemFoco}</p></div>
            {!sustainabilityPlan.hasStatisticalBase ? <p className="mt-3 text-xs text-gray-400">Sem histórico suficiente — configure uma base oficial de agendamentos ou atendimentos por venda.</p> : null}
          </>}
        </article>

        <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-semibold text-gray-800">Contribuição da Equipe</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-gray-100 bg-gray-50"><tr>{['Vendedor', 'Vendas', 'Meta', '% da meta', 'Agendamentos', 'Visitas', 'Status'].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{data.metrics.ranking.map((seller) => { const pct = seller.meta > 0 ? Math.round((seller.vnd_total / seller.meta) * 100) : 0; return <tr key={seller.user_id}><td className="px-4 py-3 font-semibold text-gray-800">{seller.user_name}</td><td className="px-4 py-3">{seller.vnd_total}</td><td className="px-4 py-3">{seller.meta || '—'}</td><td className="px-4 py-3"><span className={`rounded-lg px-2 py-1 text-xs font-medium ${pct >= 80 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{pct}%</span></td><td className="px-4 py-3">{seller.agd_total}</td><td className="px-4 py-3">{seller.visitas}</td><td className="px-4 py-3 font-medium">{seller.checked_in ? 'Em dia' : 'Atenção'}</td></tr>})}</tbody></table></div>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-800">Resultado por Canal</h2><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><Channel label="Showroom" value={channelResults.showroom} /><Channel label="Carteira" value={channelResults.carteira} /><Channel label="Internet" value={channelResults.internet} /></div></article>
      </div>
    </section>
  )
}

function GoalCard({ icon: Icon, label, tone, children }: { icon: typeof Target; label: string; tone: 'emerald' | 'blue' | 'orange' | 'violet'; children: ReactNode }) {
  const tones = { emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', violet: 'bg-violet-50 text-violet-600' }
  return <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-lg ${tones[tone]}`}><Icon size={16} /></span><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p></div>{children}</article>
}
function Progress({ value }: { value: number }) { return <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div> }
function CardFooter({ left, right }: { left: string; right: string }) { return <div className="mt-2 flex justify-between text-xs text-gray-500"><b className="text-gray-700">{left}</b><span>{right}</span></div> }
function Channel({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><strong className="mt-2 block text-2xl text-gray-800">{value}</strong><span className="text-xs text-gray-500">vendas no período</span></div> }

function EmptyGoalState() { return <p className="text-sm font-medium text-gray-500">Meta ainda não cadastrada.</p> }

function SustainabilityBlock({ icon: Icon, label, tone, children }: { icon: typeof Activity; label: string; tone: 'orange' | 'blue' | 'purple'; children: ReactNode }) {
  const tones = { orange: 'text-orange-500', blue: 'text-blue-500', purple: 'text-purple-500' }
  return <div className="rounded-xl border border-gray-100 bg-gray-50 p-4"><div className="mb-2 flex items-center gap-1.5"><Icon size={16} className={tones[tone]} /><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p></div>{children}</div>
}

export default ManagerStoreGoalReference
