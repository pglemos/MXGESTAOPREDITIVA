import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Lightbulb,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getDiasInfo } from '@/lib/calculations'
import type { RankingEntry } from '@/types/database'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'

type DashboardData = ReturnType<typeof useDashboardLojaData>

const SALES_PER_APPOINTMENTS = 3

export function ManagerSellerParityHome({ data }: { data: DashboardData; alerts: OwnerPerformanceAlert[] }) {
  const navigate = useNavigate()
  const ranking = data.metrics.ranking
  const goal = data.metrics.goalValue || 0
  const sales = data.metrics.totalSales || 0
  const missingSales = Math.max(goal - sales, 0)
  const days = getDiasInfo(data.referenceDate, data.operationalMetaRules?.projection_mode || 'calendar')
  const remainingDays = Math.max(days.restantes, 1)
  const salesNeededToday = missingSales > 0 ? Math.max(1, Math.ceil(missingSales / remainingDays)) : 0
  const appointmentsToday = data.metrics.totalAgd || 0
  const salesForecastToday = Math.floor(appointmentsToday / SALES_PER_APPOINTMENTS)
  const appointmentTarget = salesNeededToday * SALES_PER_APPOINTMENTS
  const appointmentGap = appointmentsToday - appointmentTarget
  const coverage = salesNeededToday > 0 ? Math.min(100, Math.round((salesForecastToday / salesNeededToday) * 100)) : 100
  const date = new Date(`${data.referenceDate}T12:00:00`)
  const weekday = capitalize(new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date))
  const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  const configuredRules = ranking.filter(item => item.remuneracao_plano_id)
  const closeToBand = configuredRules.filter(item => item.gap > 0 && item.gap <= 2).length
  const chartMax = Math.max(1, ...ranking.map(item => item.agd_total || 0))

  return <div className="min-h-full bg-gray-50 text-gray-800">
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 pb-24">
      <header className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div><h1 className="text-xl font-bold text-gray-800">Início</h1><p className="mt-0.5 text-sm text-gray-500">Previsibilidade comercial para conduzir o resultado do dia.</p></div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="mr-1 text-right"><p className="text-sm font-semibold text-gray-700">{weekday}</p><p className="text-xs text-gray-500">{longDate}</p></div>
            <input aria-label="Data de referência" type="date" value={data.referenceDate} onChange={event => data.setReferenceDate(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500" />
            <HeaderAction icon={Target} label="Ver Meta da Loja" onClick={() => navigate('/gerente/meta-loja')} tone="emerald" />
            <HeaderAction icon={CalendarClock} label="Ver Rotina do Dia" onClick={() => navigate('/rotina')} tone="dark" />
            <button type="button" onClick={() => void data.handleRefresh()} aria-label="Atualizar início" className="grid h-10 w-10 place-items-center rounded-xl text-gray-500 hover:bg-gray-50"><RefreshCw size={17} className={data.isRefetching ? 'animate-spin' : ''}/></button>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Previsibilidade do dia">
        <ForecastCard title="Previsão de vendas hoje" value={`${salesForecastToday} vendas`} detail={appointmentsToday > 0 ? `${appointmentsToday} agendamento${appointmentsToday === 1 ? '' : 's'} confirmado${appointmentsToday === 1 ? '' : 's'} para hoje.` : 'Nenhum agendamento confirmado para hoje.'} footer={`Regra atual: 1 venda a cada ${SALES_PER_APPOINTMENTS} agendamentos`} tone="green" icon={TrendingUp}/>
        <ForecastCard title="Necessidade de vendas no dia" value={`${salesNeededToday} vendas`} detail="Para sustentar a meta da loja hoje" tone="neutral" icon={Target}/>
        <ForecastCard title="Meta de agendamentos para hoje" value={`${appointmentTarget} agendamentos`} detail={`Baseado na necessidade de ${salesNeededToday} venda${salesNeededToday === 1 ? '' : 's'}`} tone="neutral" icon={CalendarDays}/>
        <ForecastCard title="Gap de agendamentos" value={String(appointmentGap)} detail={`${appointmentGap < 0 ? `Faltam ${Math.abs(appointmentGap)}` : `Sobram ${appointmentGap}`} agendamento${Math.abs(appointmentGap) === 1 ? '' : 's'} para sustentar o volume de vendas necessário`} tone="warning" icon={AlertTriangle}/>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-800">Leitura do Dia</h2><div className="mt-5 flex items-end justify-between gap-4"><Metric label="Previsão" value={`${salesForecastToday} vendas`}/><Metric label="Necessidade" value={`${salesNeededToday} vendas`} align="right"/></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${coverage}%`}}/></div><p className="mt-2 text-xs text-gray-400">Cobertura: {coverage}%</p><p className={`mt-4 text-sm font-semibold ${salesForecastToday >= salesNeededToday ? 'text-emerald-600' : 'text-orange-600'}`}>{salesForecastToday >= salesNeededToday ? 'A projeção cobre a necessidade do dia.' : `A projeção ainda está ${salesNeededToday - salesForecastToday} venda${salesNeededToday - salesForecastToday === 1 ? '' : 's'} abaixo do necessário.`}</p></article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-500"><Lightbulb size={17}/></span><h2 className="font-semibold text-gray-800">Ação sugerida</h2></div><p className="mt-4 text-sm leading-6 text-gray-600">{appointmentGap < 0 ? 'Prioridade do gerente: elevar a agenda do dia e acompanhar negociações com maior chance de fechamento.' : 'A agenda cobre a necessidade prevista. Acompanhe confirmações e proteja a conversão.'}</p></article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" aria-labelledby="team-focus-title">
        <div className="flex items-center justify-between gap-3 px-5 py-4"><h2 id="team-focus-title" className="font-semibold text-gray-800">Equipe em foco</h2><button type="button" onClick={() => navigate('/gerente/minha-equipe')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Ver toda a equipe →</button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="border-y border-gray-100 bg-gray-50/70"><tr>{['Vendedor','Agend. hoje','Projeção','Realizado mês','Próx. faixa','Faltam carros','Status'].map(label=><th key={label} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-50">{ranking.length ? ranking.slice(0, 8).map(row=><TeamFocusRow key={row.user_id} row={row}/>) : <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">Equipe sem dados no período.</td></tr>}</tbody></table></div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-800">Radar Financeiro da Equipe</h2><p className="mt-1 text-xs text-gray-500">Vendedores próximos da próxima faixa</p><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><RadarStat label="Próximos da faixa" value={configuredRules.length ? closeToBand : 'Regras não configuradas'}/><RadarStat label="Premiação projetada" value={configuredRules.length ? 'Disponível no plano' : 'Regras não configuradas'}/><RadarStat label="Podem subir hoje" value={configuredRules.length ? closeToBand : 'Regras não configuradas'}/></div></article>
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-800">Agendamentos por Vendedor</h2>{ranking.length ? <div className="mt-5 flex h-36 items-end gap-3 overflow-x-auto pb-2">{ranking.map(row=><div key={row.user_id} className="flex min-w-10 flex-1 flex-col items-center justify-end gap-2"><span className="text-xs font-semibold text-gray-500">{row.agd_total || 0}</span><div className="w-full max-w-9 rounded-t-lg bg-emerald-500" style={{height:`${Math.max(4, ((row.agd_total || 0) / chartMax) * 92)}px`}}/><span className="max-w-14 truncate text-[10px] text-gray-400">{firstName(row.user_name)}</span></div>)}</div> : <p className="py-12 text-center text-sm text-gray-400">Sem dados de agendamento.</p>}</article>
      </section>
    </div>
  </div>
}

function HeaderAction({ icon: Icon, label, onClick, tone }: { icon: typeof Target; label: string; onClick: () => void; tone: 'emerald' | 'dark' }) { return <button type="button" onClick={onClick} className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold shadow-sm transition-colors ${tone === 'emerald' ? 'border-emerald-500 text-emerald-700 hover:bg-emerald-50' : 'border-gray-700 text-gray-700 hover:bg-gray-50'}`}><Icon size={16}/>{label}</button> }

function ForecastCard({ title, value, detail, footer, tone, icon: Icon }: { title: string; value: string; detail: string; footer?: string; tone: 'green' | 'neutral' | 'warning'; icon: typeof Target }) {
  const styles = tone === 'green' ? 'border-emerald-700 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white' : tone === 'warning' ? 'border-orange-200 bg-white' : 'border-gray-100 bg-white'
  const valueTone = tone === 'warning' ? 'text-orange-500' : tone === 'green' ? 'text-white' : 'text-gray-900'
  return <article className={`flex min-h-48 flex-col rounded-2xl border p-5 shadow-sm ${styles}`}><div className="flex items-start justify-between gap-3"><p className={`text-xs font-semibold uppercase tracking-wide ${tone === 'green' ? 'text-emerald-100' : 'text-gray-500'}`}>{title}</p><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone === 'green' ? 'bg-white/15 text-white' : 'bg-gray-50 text-gray-400'}`}><Icon size={17}/></span></div><div className="mt-auto"><p className={`text-3xl font-bold ${valueTone}`}>{value}</p><p className={`mt-2 text-sm leading-5 ${tone === 'green' ? 'text-emerald-50' : 'text-gray-500'}`}>{detail}</p>{footer && <p className="mt-3 text-xs text-emerald-100">{footer}</p>}</div></article>
}

function Metric({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) { return <div className={align === 'right' ? 'text-right' : ''}><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-bold text-gray-800">{value}</p></div> }

function TeamFocusRow({ row }: { row: RankingEntry }) {
  const nextBand = row.remuneracao_plano_cargo || 'Sem regra configurada'
  const gap = row.remuneracao_plano_id ? row.gap : null
  const status = row.status?.label || (row.projecao >= row.meta && row.meta > 0 ? 'Em evolução' : 'Abaixo do ritmo')
  const statusStyle = /bom|dia|evolu/i.test(status) ? 'bg-emerald-100 text-emerald-700' : /aten/i.test(status) ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'
  return <tr><td className="px-5 py-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">{initials(row.user_name)}</span><span className="font-semibold text-gray-700">{row.user_name}</span></div></td><td className="px-5 py-3 text-gray-600">{row.agd_total || 0}</td><td className="px-5 py-3 text-gray-600">{row.projecao || 0}</td><td className="px-5 py-3 text-gray-600">{row.vnd_total || 0}</td><td className="px-5 py-3 text-gray-500">{nextBand}</td><td className="px-5 py-3 text-gray-500">{gap === null ? '—' : gap}</td><td className="px-5 py-3"><span className={`rounded-lg px-2 py-1 text-xs font-medium ${statusStyle}`}>{status}</span></td></tr>
}

function RadarStat({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">{label}</p><p className="mt-2 text-sm font-semibold text-gray-700">{value}</p></div> }

function initials(name: string) { const parts = name.trim().split(/\s+/); return `${parts[0]?.[0] || ''}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase() }
function firstName(name: string) { return name.trim().split(/\s+/)[0] || '—' }
function capitalize(value: string) { return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value }

export default ManagerSellerParityHome
