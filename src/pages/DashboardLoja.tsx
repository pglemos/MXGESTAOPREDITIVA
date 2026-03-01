import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, ArrowUpRight, BarChart3, Car, Calendar, CheckCircle, ChevronRight, Clock, Download, Eye, Filter, Globe, Link, MoreHorizontal, Phone, Share2, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, Triangle, Users, XCircle, Zap } from 'lucide-react'

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
    const storeName = (membership as any)?.store?.name || 'Unidade Operacional'

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Escaneando performance...</p>
        </div>
    )

    const Stat = ({ icon: Icon, label, value, sub, bg, color, trend, delay = 0 }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="inner-card p-8 flex flex-col justify-between hover:shadow-2xl transition-all group relative overflow-hidden bg-white border border-gray-100"
        >
            <div className={`absolute -right-8 -top-8 w-32 h-32 ${bg} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-all z-0`} />
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm ${bg} ${color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                        <ArrowUpRight size={14} /> {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-0.5">{label}</p>
                <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-[#1A1D20] tracking-tighter">{value}</p>
                    {sub && <span className="text-[10px] font-black bg-gray-50 text-gray-400 border border-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest truncate max-w-[100px]">{sub}</span>}
                </div>
            </div>
        </motion.div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0 border-b border-gray-50 pb-8">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full" />
                        <h1 className="text-[36px] font-black tracking-tighter leading-none">{storeName}</h1>
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] pl-6 opacity-60">Intelligence & Performance Control</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 rounded-2xl border border-gray-200/50">
                        <button className="px-5 py-2.5 rounded-xl bg-white text-[#1A1D20] font-black text-[10px] uppercase tracking-widest shadow-sm">Mensal</button>
                        <button className="px-5 py-2.5 rounded-xl text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-[#1A1D20] transition-colors">Semanal</button>
                    </div>
                    <div className="w-px h-10 bg-gray-200 mx-2" />
                    <button className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-xl transition-all shadow-sm active:scale-95">
                        <Download size={20} />
                    </button>
                    <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1A1D20] text-white font-black text-[10px] uppercase tracking-[0.1em] hover:bg-black hover:shadow-2xl transition-all shadow-xl active:scale-95">
                        <Share2 size={16} /> Relatórios
                    </button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 shrink-0">
                <Stat icon={Target} label="Meta Mensal" value={meta} sub={`${atingimento}%`} bg="bg-blue-600" color="text-white" trend="Alcançável" delay={0.1} />
                <Stat icon={Car} label="Vendas Unidade" value={vendasMes} sub={`Faltam ${faltaX}`} bg="bg-emerald-600" color="text-white" delay={0.2} />
                <Stat icon={TrendingUp} label="Projeção IA" value={projecao} bg="bg-indigo-600" color="text-white" sub="Optimized" delay={0.3} />
                <Stat icon={Users} label="Check-in Team" value={`${checkedIn}/${sellers.length}`} bg="bg-amber-500" color="text-white" sub="Online" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 shrink-0 pb-10">

                {/* Main Content Area (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    {/* Vendas por canal */}
                    <div className="inner-card p-10 bg-white border border-gray-100 overflow-hidden relative group">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-100/30 transition-all pointer-events-none" />

                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-[#1A1D20] group-hover:text-white transition-all shadow-inner">
                                    <BarChart3 size={24} />
                                </div>
                                Canais de Conversão
                            </h3>
                            <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1A1D20] transition-all">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            {[
                                { label: 'Showroom', value: porCanal.porta, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', pct: Math.round((porCanal.porta / (vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: porCanal.carteira, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', pct: Math.round((porCanal.carteira / (vendasMes || 1)) * 100) },
                                { label: 'Internet', value: porCanal.internet, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', pct: Math.round((porCanal.internet / (vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={`${ch.bg} border rounded-[2.5rem] p-8 group/item relative overflow-hidden transition-all hover:scale-[1.02] hover:-translate-y-2 hover:shadow-xl`}>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-gray-50 transition-transform group-hover/item:rotate-12">
                                            <ch.icon size={26} className={`${ch.color}`} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[10px] font-black ${ch.color} uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full border border-white`}>{ch.pct}%</span>
                                        </div>
                                    </div>
                                    <p className="text-5xl font-black text-[#1A1D20] mb-2 tracking-tighter">{ch.value}</p>
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 opacity-60">{ch.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="inner-card p-0 overflow-hidden bg-white border border-gray-100 flex flex-col shadow-xl shadow-gray-100/50">
                        <div className="p-10 pb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">Especialistas de Elite</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-60">Performance Individual & KPI's</p>
                            </div>
                            <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#1A1D20] transition-colors group">
                                Ver Completo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] border-y border-gray-100">
                                        <th className="pl-10 py-5 w-20 text-center">Pos</th>
                                        <th className="py-5 min-w-[200px]">Consultor</th>
                                        <th className="py-5 text-center">Leads</th>
                                        <th className="py-5 text-center">Visitas</th>
                                        <th className="py-5 text-center">Vendas</th>
                                        <th className="pr-10 py-5 text-right">Eficiência</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.slice(0, 8).map((r, i) => (
                                        <tr key={r.user_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-all group cursor-pointer relative">
                                            <td className="pl-10 py-5">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm mx-auto shadow-sm border ${i === 0 ? 'bg-amber-100 border-amber-200 text-amber-700' :
                                                    i === 1 ? 'bg-slate-100 border-slate-200 text-slate-700' :
                                                        i === 2 ? 'bg-orange-100 border-orange-200 text-orange-700' :
                                                            'bg-white border-gray-100 text-gray-400'
                                                    }`}>
                                                    {r.position}
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-center font-black text-[#1A1D20] text-sm group-hover:scale-105 transition-transform">
                                                        {r.user_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="text-[#1A1D20] font-black text-sm block group-hover:text-indigo-600 transition-colors">{r.user_name}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-60">Consultor Senior</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 text-center font-black text-gray-400 text-sm">{r.leads}</td>
                                            <td className="py-5 text-center font-black text-gray-400 text-sm">{r.visitas}</td>
                                            <td className="py-5 text-center">
                                                <span className="px-4 py-1.5 rounded-full bg-[#1A1D20] text-white font-black text-[11px] shadow-lg shadow-gray-200">
                                                    {r.vnd_total}
                                                </span>
                                            </td>
                                            <td className="pr-10 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-sm font-black ${r.atingimento >= 100 ? 'text-emerald-500' : r.atingimento >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                                                        {r.atingimento}%
                                                    </span>
                                                    <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${r.atingimento >= 100 ? 'bg-emerald-500' : r.atingimento >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                            style={{ width: `${Math.min(r.atingimento, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && (
                                        <tr><td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                                <Users size={32} className="text-gray-300" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Escaneando performance do servidor...</p>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar area (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">

                    {/* Alerta Status */}
                    <AnimatePresence>
                        {sellers.length > 0 && checkedIn < sellers.length && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-[#1A1D20] border border-gray-800 rounded-[2.5rem] p-8 flex items-start gap-5 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none" />
                                <div className="bg-red-500 p-3 rounded-2xl shrink-0 shadow-lg shadow-red-500/50">
                                    <AlertTriangle size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white text-sm font-black leading-tight uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                        Ação Necessária <Sparkles size={14} className="text-red-500 animate-pulse" />
                                    </p>
                                    <p className="text-white/60 text-[11px] font-bold leading-relaxed">
                                        <span className="text-white font-black">{sellers.length - checkedIn} especialistas</span> ausentes no check-in operacional de hoje. Requer atenção imediata.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pipeline Funnel */}
                    <div className="inner-card p-10 bg-white border border-gray-100 flex flex-col shadow-xl shadow-gray-100/30 relative group overflow-hidden">
                        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-gray-50 rounded-full blur-[80px] group-hover:bg-blue-50/50 transition-colors pointer-events-none" />

                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">Fluxo Ativo</h3>
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                                <TrendingUp size={20} />
                            </div>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {[
                                { label: 'Leads Captados', value: funil.leads, pct: 100, color: 'bg-indigo-600', icon: Phone, lightBg: 'bg-indigo-50 text-indigo-600' },
                                { label: 'Agendamentos', value: funil.agd_total, pct: funil.tx_lead_agd, color: 'bg-blue-600', icon: Calendar, lightBg: 'bg-blue-50 text-blue-600' },
                                { label: 'Demonstrações', value: funil.visitas, pct: funil.tx_agd_visita, color: 'bg-amber-500', icon: Eye, lightBg: 'bg-amber-50 text-amber-600' },
                                { label: 'Conversão Final', value: funil.vnd_total, pct: funil.tx_visita_vnd, color: 'bg-emerald-600', icon: CheckCircle, lightBg: 'bg-emerald-50 text-emerald-600' },
                            ].map((step, i) => (
                                <div key={step.label} className="relative group/step">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${step.lightBg} shadow-sm border border-white`}>
                                                <step.icon size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 opacity-60">{step.label}</span>
                                                <span className="text-[#1A1D20] font-black text-2xl tracking-tighter leading-none">{step.value}</span>
                                            </div>
                                        </div>
                                        {i > 0 && (
                                            <div className={`px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest ${step.color.replace('bg-', 'text-')}`}>
                                                {step.pct}% CR
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 rounded-full h-2.5 overflow-hidden p-0.5 border border-gray-200/50 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(step.pct, 100)}%` }}
                                            transition={{ duration: 1.5, ease: "circOut", delay: 0.5 + (i * 0.1) }}
                                            className={`${step.color} h-full rounded-full shadow-lg shadow-indigo-200/20`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Quick Review */}
                    <div className="inner-card p-10 bg-[#F8FAFC] border-none flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-gray-100 -rotate-12 group-hover:text-indigo-50 transition-colors">
                            <Users size={80} />
                        </div>

                        <h3 className="text-xl font-black text-[#1A1D20] tracking-tight mb-8">Estado da Tropa</h3>

                        <div className="space-y-4 relative z-10">
                            {sellers.slice(0, 5).map(s => (
                                <div key={s.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/80 backdrop-blur-sm border border-white shadow-sm transition-all hover:scale-[1.02] hover:bg-white hover:shadow-xl group/card">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[#1A1D20] text-sm group-hover/card:bg-[#1A1D20] group-hover/card:text-white transition-all">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[#1A1D20] text-sm font-black tracking-tight">{s.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Consultor Jr.</p>
                                        </div>
                                    </div>
                                    {s.checkin_today ? (
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                            <CheckCircle size={20} />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center border border-amber-100/50">
                                            <Clock size={20} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {sellers.length > 5 && (
                                <button className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                                    + {sellers.length - 5} outros membros
                                </button>
                            )}
                            {sellers.length === 0 && <p className="text-sm font-bold text-gray-400 text-center py-10 italic opacity-40">Unidade em fase de recrutamento...</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
