import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil } from '@/lib/calculations'
import { motion } from 'motion/react'
import { Target, TrendingUp, Users, Car, Globe, AlertTriangle, CheckCircle, XCircle, Phone, Eye, BarChart3, Filter } from 'lucide-react'

export default function DashboardLoja() {
    const { membership } = useAuth()
    const { checkins, loading } = useCheckins()
    const { storeGoal } = useGoals()
    const { sellers } = useTeam()
    const { ranking } = useRanking()
    const dias = getDiasInfo()

    const meta = storeGoal?.target || 0
    const vendasMes = somarVendas(checkins)
    const porCanal = somarVendasPorCanal(checkins)
    const atingimento = calcularAtingimento(vendasMes, meta)
    const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
    const faltaX = calcularFaltaX(meta, vendasMes)
    const funil = calcularFunil(checkins)
    const checkedIn = sellers.filter(s => s.checkin_today).length
    const storeName = (membership as any)?.store?.name || 'Loja'

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando painel...</p>
        </div>
    )

    const Stat = ({ icon: Icon, label, value, sub, bg, color }: any) => (
        <div className="inner-card p-5 sm:p-6 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full blur-2xl group-hover:bg-gray-100 transition-colors z-0" />
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center border border-gray-100 shadow-sm ${bg || 'bg-blue-50'}`}>
                    <Icon size={20} className={color || 'text-blue-500'} />
                </div>
            </div>
            <div className="relative z-10">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-extrabold text-[#1A1D20]">{value}</p>
                    {sub && <span className="text-xs font-bold text-gray-500 truncate">{sub}</span>}
                </div>
            </div>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">{storeName}</h1>
                    <p className="text-gray-500 text-sm font-medium">Dashboard da Gestão</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-[#1A1D20] border border-gray-200 font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 text-sm">
                        <Filter size={18} /> Filtros
                    </button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 shrink-0">
                <Stat icon={Target} label="Meta" value={meta} sub={`${atingimento}% atg`} bg="bg-blue-50" color="text-blue-600" />
                <Stat icon={Car} label="Vendas no Mês" value={vendasMes} sub={`Falta ${faltaX}`} bg="bg-emerald-50" color="text-emerald-600" />
                <Stat icon={TrendingUp} label="Projeção" value={projecao} bg="bg-violet-50" color="text-violet-600" />
                <Stat icon={Users} label="Equipe Check-in" value={`${checkedIn}/${sellers.length}`} sub="hoje" bg="bg-amber-50" color="text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 pb-10">
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Vendas por canal */}
                    <div className="inner-card p-6 sm:p-8">
                        <h3 className="text-lg font-extrabold text-[#1A1D20] mb-6">Vendas por Canal</h3>
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            {[
                                { label: 'Portão', value: porCanal.porta, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                                { label: 'Carteira', value: porCanal.carteira, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                                { label: 'Internet', value: porCanal.internet, icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
                            ].map(ch => (
                                <div key={ch.label} className={`${ch.bg} border rounded-[1.5rem] p-4 text-center shadow-sm hover:shadow-md transition-shadow`}>
                                    <div className="w-10 h-10 mx-auto rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                                        <ch.icon size={18} className={`${ch.color}`} />
                                    </div>
                                    <p className="text-2xl font-black text-[#1A1D20] mb-1">{ch.value}</p>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">{ch.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ranking */}
                    <div className="inner-card p-6 sm:p-8 overflow-hidden">
                        <h3 className="text-lg font-extrabold text-[#1A1D20] mb-6">Ranking da Equipe</h3>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-100">
                                        <th className="text-left py-3 font-bold">#</th>
                                        <th className="text-left py-3 font-bold">Vendedor</th>
                                        <th className="text-right py-3 font-bold">Leads</th>
                                        <th className="text-right py-3 font-bold">AGD</th>
                                        <th className="text-right py-3 font-bold">Vis</th>
                                        <th className="text-right py-3 font-bold">VND</th>
                                        <th className="text-right py-3 font-bold">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.slice(0, 10).map((r, i) => (
                                        <tr key={r.user_id} className="border-b border-gray-50 last:border-0 hover:bg-[#F8FAFC] transition-colors">
                                            <td className="py-3 text-gray-400 font-bold">{r.position}º</td>
                                            <td className="py-3 text-[#1A1D20] font-bold">{r.user_name}</td>
                                            <td className="py-3 text-right text-gray-500">{r.leads}</td>
                                            <td className="py-3 text-right text-gray-500">{r.agd_total}</td>
                                            <td className="py-3 text-right text-gray-500">{r.visitas}</td>
                                            <td className="py-3 text-right text-[#1A1D20] font-black">{r.vnd_total}</td>
                                            <td className={`py-3 text-right font-extrabold ${r.atingimento >= 100 ? 'text-emerald-500' : r.atingimento >= 70 ? 'text-amber-500' : 'text-red-500'}`}>{r.atingimento}%</td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && (
                                        <tr><td colSpan={7} className="py-8 text-center text-gray-400">Nenhum dado de ranking.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-1">
                    {/* Alerta de inatividade */}
                    {sellers.length > 0 && checkedIn < sellers.length && (
                        <div className="bg-red-50 border border-red-200 rounded-[1.5rem] p-5 flex items-center gap-3 shadow-sm">
                            <div className="bg-red-100 p-2 rounded-full shrink-0"><AlertTriangle size={16} className="text-red-600" /></div>
                            <p className="text-red-800 text-sm font-semibold leading-tight">
                                {sellers.length - checkedIn} vendedor{sellers.length - checkedIn > 1 ? 'es' : ''} pendente{sellers.length - checkedIn > 1 ? 's' : ''} de check-in hoje.
                            </p>
                        </div>
                    )}

                    {/* Funil */}
                    <div className="inner-card p-6 sm:p-8 shrink-0">
                        <h3 className="text-lg font-extrabold text-[#1A1D20] mb-6">Funil de Vendas</h3>
                        <div className="space-y-5">
                            {[
                                { label: 'Leads', value: funil.leads, pct: 100, color: 'bg-violet-500' },
                                { label: 'Agendamentos', value: funil.agd_total, pct: funil.tx_lead_agd, color: 'bg-blue-500' },
                                { label: 'Visitas', value: funil.visitas, pct: funil.tx_agd_visita, color: 'bg-amber-500' },
                                { label: 'Vendas', value: funil.vnd_total, pct: funil.tx_visita_vnd, color: 'bg-emerald-500' },
                            ].map((step, i) => (
                                <div key={step.label} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">{step.label}</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[#1A1D20] font-black text-lg leading-none">{step.value}</span>
                                            {i > 0 && <span className="text-gray-400 text-[10px] font-bold">({step.pct}%)</span>}
                                        </div>
                                    </div>
                                    <div className="bg-[#F8FAFC] rounded-full h-3 overflow-hidden border border-gray-100">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(step.pct, 100)}%` }} transition={{ duration: 1 }} className={`${step.color} h-full rounded-full transition-all`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status check-in */}
                    <div className="inner-card p-6 sm:p-8 shrink-0">
                        <h3 className="text-lg font-extrabold text-[#1A1D20] mb-6">Status Check-in Hoje</h3>
                        <div className="space-y-3">
                            {sellers.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-gray-100">
                                    <span className="text-[#1A1D20] text-sm font-bold">{s.name}</span>
                                    {s.checkin_today ? (
                                        <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle size={12} /> OK</span>
                                    ) : (
                                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><XCircle size={12} /> PENDENTE</span>
                                    )}
                                </div>
                            ))}
                            {sellers.length === 0 && <p className="text-sm text-gray-400">Nenhum vendedor na equipe.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
