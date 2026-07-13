import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { format, endOfMonth, parseISO } from 'date-fns'
import { BarChart3, CalendarDays, RefreshCw, ShoppingCart, Target, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import { calcularProjecao, getDiasInfo } from '@/lib/calculations'
import { chartTokens } from '@/lib/charts/tokens'
import type { useDashboardLojaData } from '@/features/dashboard-loja/hooks/useDashboardLojaData'
import { ManagerHomeReturnLink } from '@/features/manager/home/ManagerHomeReturnLink'

type DashboardData = ReturnType<typeof useDashboardLojaData>
type Horizon = 'hoje' | 'semana' | 'quinzena' | 'mes'

export function ManagerStoreGoalReference({ data }: { data: DashboardData }) {
  const navigate = useNavigate()
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
  const gap = Math.max(goal - sales, 0)
  const attainment = goal > 0 ? Math.round((sales / goal) * 100) : 0
  const proportionalGoal = days.total > 0 ? Math.round((goal / days.total) * days.decorridos) : 0
  const paceGap = Math.max(proportionalGoal - sales, 0)
  const projection = calcularProjecao(sales, days.decorridos, days.total)
  const projectedPct = goal > 0 ? Math.round((projection / goal) * 100) : 0
  const dailyPace = days.restantes > 0 ? gap / days.restantes : 0

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

  const changeMonth = (value: string) => {
    if (!/^\d{4}-\d{2}$/.test(value)) return
    setMonth(value)
    const start = `${value}-01`
    data.setStartDate(start)
    data.setEndDate(format(endOfMonth(parseISO(start)), 'yyyy-MM-dd'))
  }

  const planText = {
    hoje: gap > 0 ? `Converter o gap em uma ação imediata: buscar ${Math.max(1, Math.ceil(dailyPace))} venda(s) no ritmo de hoje.` : 'Proteger o resultado e reconhecer as entregas concluídas hoje.',
    semana: paceGap > 0 ? `Recuperar ${paceGap} venda(s) para voltar ao ritmo proporcional da meta.` : 'Manter a cadência semanal e acompanhar os vendedores abaixo do ritmo.',
    quinzena: projection < goal ? `A projeção atual é de ${projection} venda(s). Priorize os canais com conversão real e revisão diária.` : 'A projeção cobre a meta. Preserve disciplina e qualidade da carteira.',
    mes: gap > 0 ? `Faltam ${gap} venda(s) no mês. O ritmo necessário é ${dailyPace.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por dia operacional.` : 'Meta mensal atingida. Foque sustentabilidade, margem e consistência da equipe.',
  }[horizon]

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
          <GoalCard icon={Target} label="Progresso da meta" tone="emerald"><strong className="text-2xl text-gray-800">{sales}<span className="text-sm font-medium text-gray-400"> de {goal}</span></strong><Progress value={attainment} /><CardFooter left={`${attainment}%`} right="atingido" /></GoalCard>
          <GoalCard icon={CalendarDays} label="Meta proporcional até hoje" tone="blue"><strong className="text-2xl text-gray-800">{proportionalGoal}<span className="text-sm font-medium text-gray-400"> vendas</span></strong><p className="mt-2 text-xs text-gray-500">Realizado: <b>{sales}</b></p><p className={`mt-1 text-sm font-bold ${paceGap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{paceGap > 0 ? `−${paceGap} abaixo do ritmo` : 'Dentro do ritmo'}</p></GoalCard>
          <GoalCard icon={ShoppingCart} label="Faltam vender" tone="orange"><strong className="text-4xl text-gray-800">{gap}</strong><p className="mt-2 text-xs text-gray-500">vendas para atingir a meta mensal</p></GoalCard>
          <GoalCard icon={TrendingUp} label="Projeção e ritmo necessário" tone="violet"><strong className="text-3xl text-gray-800">{projection}<span className="text-sm font-medium text-gray-400"> vendas</span></strong><p className="mt-1 text-sm font-bold text-violet-600">{projectedPct}% da meta</p><p className="mt-2 text-xs text-gray-500">Ritmo necessário: <b>{dailyPace.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} por dia</b></p></GoalCard>
        </div>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-800">Evolução da Meta</h2>
          <div className="mt-4 h-72">
            {chartData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={chartTokens.grid()} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: chartTokens.axisTick() }} /><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTokens.axisTick() }} /><Tooltip /><Legend /><Line type="monotone" dataKey="meta" name="Meta acumulada" stroke={chartTokens.series.s6()} strokeDasharray="4 4" dot={false} /><Line type="monotone" dataKey="realizado" name="Realizado" stroke={chartTokens.success()} strokeWidth={2} /><Line type="monotone" dataKey="projecao" name="Projeção" stroke={chartTokens.series.s7()} strokeDasharray="5 3" dot={false} /></LineChart></ResponsiveContainer> : <div className="grid h-full place-items-center rounded-xl bg-gray-50 text-sm text-gray-500">A evolução aparecerá quando houver lançamentos oficiais no período.</div>}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><BarChart3 size={18} className="text-emerald-600" /><h2 className="font-semibold text-gray-800">Plano de Sustentação</h2></div>
          <div className="mt-4 flex flex-wrap gap-2">{([['hoje', 'Hoje'], ['semana', 'Esta semana'], ['quinzena', 'Esta quinzena'], ['mes', 'Este mês']] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setHorizon(key)} className={`rounded-xl px-4 py-2 text-xs font-semibold ${horizon === key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label}</button>)}</div>
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm leading-6 text-emerald-900">{planText}</p><button type="button" onClick={() => navigate('/gerente/rotina-equipe')} className="shrink-0 text-sm font-semibold text-emerald-700">Abrir Rotina da Equipe →</button></div>
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

export default ManagerStoreGoalReference
