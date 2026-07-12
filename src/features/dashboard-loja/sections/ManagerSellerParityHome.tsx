import type { ReactNode } from 'react'
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, ClipboardCheck, Target, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { calcularProjecao, getDiasInfo } from '@/lib/calculations'
import type { RankingEntry } from '@/types/database'
import type { useDashboardLojaData } from '../hooks/useDashboardLojaData'
import type { OwnerPerformanceAlert } from './PerformanceAlerts'

type DashboardData = ReturnType<typeof useDashboardLojaData>

export function ManagerSellerParityHome({ data, alerts }: { data: DashboardData; alerts: OwnerPerformanceAlert[] }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const sellers = data.sellers || []
  const ranking = data.metrics.ranking
  const goal = data.metrics.goalValue || 0
  const sales = data.metrics.totalSales || 0
  const gap = Math.max(goal - sales, 0)
  const attainment = goal > 0 ? Math.min(100, Math.round((sales / goal) * 100)) : 0
  const pending = Math.max(sellers.length - data.metrics.checkedInCount, 0)
  const discipline = sellers.length > 0 ? Math.round((data.metrics.checkedInCount / sellers.length) * 100) : 0
  const days = getDiasInfo(data.referenceDate, data.operationalMetaRules?.projection_mode || 'calendar')
  const projection = calcularProjecao(sales, days.decorridos, days.total)
  const expectedSales = days.total > 0 ? Math.round((goal / days.total) * days.decorridos) : 0
  const paceGap = Math.max(expectedSales - sales, 0)
  const critical = gap > 0 || pending > 0 || alerts.length > 0
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'Gerente'
  const channelTotals = data.checkins.reduce((totals, checkin) => ({
    showroomSales: totals.showroomSales + (checkin.vnd_porta_prev_day || 0),
    internetSales: totals.internetSales + (checkin.vnd_net_prev_day || 0),
    carteiraSales: totals.carteiraSales + (checkin.vnd_cart_prev_day || 0),
    carteiraContacts: totals.carteiraContacts + (checkin.agd_cart_prev_day || 0) + (checkin.agd_cart_today || 0),
  }), { showroomSales: 0, internetSales: 0, carteiraSales: 0, carteiraContacts: 0 })
  const channels = [
    { label: 'Showroom', total: data.funilData.visitas, sales: channelTotals.showroomSales },
    { label: 'Internet', total: data.funilData.leads, sales: channelTotals.internetSales },
    { label: 'Carteira', total: channelTotals.carteiraContacts, sales: channelTotals.carteiraSales },
  ]

  return <div className="min-h-full w-full bg-surface-alt px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 pb-24">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div><h1 className="text-2xl font-bold">Boa tarde, {firstName}</h1><p className="mt-2 flex items-center gap-2 text-sm font-medium capitalize"><CalendarDays size={16} /> Hoje é {formattedDate}</p><p className="mt-1 text-sm">Unidade: {data.metrics.storeName}</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><HeaderStat label="Equipe" value={`${sellers.length} vendedores`} icon={<Users size={16} />} /><HeaderStat label="Meta do mês" value={goal} icon={<Target size={16} />} /><HeaderStat label="Realizado" value={sales} icon={<TrendingUp size={16} />} /><HeaderStat label="Faltam" value={gap} icon={<Target size={16} />} /></div>
        </div>
        <div className="mt-5 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold">🏁 {gap > 0 ? `É necessário vender ${Math.max(1, Math.ceil(gap / Math.max(days.restantes, 1)))} veículo(s) por dia` : 'Meta atingida — proteja o resultado'}</div>
      </header>

      <div className={`flex items-center gap-4 rounded-2xl border px-5 py-5 text-lg font-bold ${critical ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{critical ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}{critical ? 'Situação Crítica' : 'Operação em dia'}</div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores gerenciais">
        <LightCard title="Meta da Loja" icon={<Target size={20} />} tone="green"><StatLine label="Meta mensal" value={goal} /><StatLine label="Realizado" value={sales} valueClass="text-emerald-600" /><Progress value={attainment} /><StatLine label="% atingido" value={`${attainment}%`} /><StatLine label="Projeção" value={`${projection} vendas`} /><StatLine label="Faltam vender" value={gap} valueClass="text-orange-600" /></LightCard>
        <LightCard title="Conversão Geral" icon={<BarChart3 size={20} />} tone="blue"><div className="space-y-3">{channels.map(channel => <ChannelRow key={channel.label} {...channel} />)}</div></LightCard>
        <LightCard title="Execução da Rotina" icon={<ClipboardCheck size={20} />} tone="violet"><StatLine label="Execução média" value={`${discipline}%`} valueClass={discipline < 70 ? 'text-red-600' : 'text-emerald-600'} /><div className="mt-5 grid grid-cols-3 gap-2 text-center"><StatusStat value={data.metrics.checkedInCount} label="Em dia" tone="green" /><StatusStat value={pending} label="Pendentes" tone="orange" /><StatusStat value={pending} label="Críticos" tone="red" /></div></LightCard>
        <LightCard title="Fechamento Diário" icon={<ClipboardCheck size={20} />} tone="orange"><StatLine label="Total de vendedores" value={sellers.length} /><StatLine label="Realizados hoje" value={data.metrics.checkedInCount} valueClass="text-emerald-600" /><StatLine label="Pendentes" value={pending} valueClass="text-orange-600" /><button type="button" onClick={() => navigate('/gerente/fechamento-diario')} className="mt-5 w-full rounded-lg border border-emerald-300 px-3 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">Abrir Fechamento da Equipe →</button></LightCard>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">🎯 Prioridades do Gerente Hoje</h2><div className="mt-4 space-y-2">{paceGap > 0 && <PriorityRow text={`A loja está abaixo do ritmo necessário. Faltam ${paceGap} vendas para recuperar o ritmo.`} action="Abrir Meta da Loja" onClick={() => navigate('/gerente/meta-loja')} tone="red" />}{data.pendingDisciplineSellers.map(seller => <PriorityRow key={seller.id} text={`${seller.name} ainda não realizou o fechamento diário.`} action="Cobrar fechamento" onClick={() => navigate('/gerente/fechamento-diario')} tone="orange" />)}{!critical && <PriorityRow text="A equipe está com a rotina sincronizada. Acompanhe a execução comercial." action="Ver equipe" onClick={() => navigate('/gerente/minha-equipe')} tone="green" />}</div></section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="p-5 pb-3"><h2 className="text-lg font-bold">📊 Performance da Equipe</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-left text-xs text-slate-500"><tr>{['Vendedor', 'Unidade', 'Vendas', 'Meta', '% Meta', 'Conversão', 'Rotina', 'Fechamento', 'Status'].map(label => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{ranking.length ? ranking.map(row => <PerformanceRow key={row.user_id} row={row} storeName={data.metrics.storeName} onClick={() => navigate('/gerente/minha-equipe')} />) : <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-500">Equipe sem dados no período.</td></tr>}</tbody></table></div></section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2"><LightCard title="📈 Evolução da Loja" icon={<TrendingUp size={20} />} tone="green"><p className="text-sm text-slate-500">Realizado no período em relação à meta mensal.</p><div className="mt-6"><Progress value={attainment} /><div className="mt-2 flex justify-between text-sm font-semibold"><span>{sales} realizados</span><span>{goal} meta</span></div></div></LightCard><LightCard title="Agenda Gerencial" icon={<CalendarDays size={20} />} tone="blue"><p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{data.metrics.totalAgd > 0 ? `${data.metrics.totalAgd} agendamentos registrados pela equipe hoje.` : 'Nenhum compromisso operacional registrado para hoje.'}</p></LightCard></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">Resumo do Dia</h2><p className="mt-2 text-sm leading-6 text-slate-600">{critical ? 'A operação exige atuação do gerente nos fechamentos pendentes, na disciplina da equipe e na recuperação do ritmo da meta.' : 'A operação está em dia. Mantenha a cadência e reconheça a execução da equipe.'}</p><button type="button" onClick={() => navigate('/gerente/mentor')} className="mt-4 text-sm font-semibold text-emerald-700">Abrir Mentor Gerencial →</button></section>
    </div>
  </div>
}

function HeaderStat({ label, value, icon }: { label: string; value: ReactNode; icon: ReactNode }) { return <div className="min-w-[140px] rounded-xl bg-white/15 px-4 py-3 text-center"><div className="flex items-center justify-center gap-1.5 text-xs">{icon}{label}</div><strong className="mt-1 block text-lg">{value}</strong></div> }
function LightCard({ title, icon, tone, children }: { title: string; icon: ReactNode; tone: 'green' | 'blue' | 'violet' | 'orange'; children: ReactNode }) { const colors = { green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', violet: 'bg-violet-50 text-violet-600', orange: 'bg-orange-50 text-orange-600' }; return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><h2 className="font-bold">{title}</h2></div>{children}</article> }
function StatLine({ label, value, valueClass = '' }: { label: string; value: ReactNode; valueClass?: string }) { return <div className="flex items-center justify-between gap-3 py-1.5 text-sm"><span className="text-slate-500">{label}</span><strong className={valueClass}>{value}</strong></div> }
function Progress({ value }: { value: number }) { return <div className="my-2 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div> }
function ChannelRow({ label, total, sales }: { label: string; total: number; sales: number }) { const conversion = total > 0 ? Math.round((sales / total) * 100) : 0; return <div className="rounded-xl bg-slate-50 px-3 py-2"><div className="text-xs font-semibold text-slate-500">{label}</div><div className="mt-1 flex justify-between text-sm"><span>{total} atd / {sales} vendas</span><strong>{conversion}%</strong></div></div> }
function StatusStat({ value, label, tone }: { value: number; label: string; tone: 'green' | 'orange' | 'red' }) { const colors = { green: 'bg-emerald-50 text-emerald-700', orange: 'bg-orange-50 text-orange-700', red: 'bg-red-50 text-red-700' }; return <div className={`rounded-xl px-2 py-3 ${colors[tone]}`}><strong className="block text-xl">{value}</strong><span className="text-xs">{label}</span></div> }
function PriorityRow({ text, action, onClick, tone }: { text: string; action: string; onClick: () => void; tone: 'red' | 'orange' | 'green' }) { const colors = { red: 'border-red-200 bg-red-50 text-red-800', orange: 'border-orange-200 bg-orange-50 text-orange-800', green: 'border-emerald-200 bg-emerald-50 text-emerald-800' }; return <div className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center ${colors[tone]}`}><span className="flex-1">{text}</span><button type="button" onClick={onClick} className="self-start font-semibold sm:self-auto">{action}</button></div> }
function PerformanceRow({ row, storeName, onClick }: { row: RankingEntry; storeName: string; onClick: () => void }) { const attainment = row.meta > 0 ? Math.round((row.vnd_total / row.meta) * 100) : 0; const conversion = row.visitas > 0 ? Math.round((row.vnd_total / row.visitas) * 100) : 0; const status = !row.checked_in || attainment < 50 ? 'Crítico' : attainment < 80 ? 'Atenção' : 'Em dia'; return <tr className="hover:bg-slate-50"><td className="px-5 py-3"><button type="button" onClick={onClick} className="font-semibold text-slate-800 hover:text-emerald-700">{row.user_name}</button></td><td className="px-5 py-3">{storeName}</td><td className="px-5 py-3">{row.vnd_total}</td><td className="px-5 py-3">{row.meta}</td><td className="px-5 py-3">{attainment}%</td><td className="px-5 py-3">{conversion}%</td><td className="px-5 py-3">{row.checked_in ? '100%' : '0%'}</td><td className="px-5 py-3">{row.checked_in ? 'Realizado' : 'Pendente'}</td><td className={`px-5 py-3 font-semibold ${status === 'Crítico' ? 'text-red-600' : status === 'Atenção' ? 'text-orange-600' : 'text-emerald-600'}`}>{status}</td></tr> }

export default ManagerSellerParityHome
