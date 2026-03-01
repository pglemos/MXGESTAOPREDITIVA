import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { Target, TrendingUp, Trophy, CheckSquare, Car, Users, Globe, BarChart3, AlertTriangle, ArrowRight, Star, ArrowUpRight, Zap, Sparkles, LayoutDashboard, Crown, Flame } from 'lucide-react'

export default function VendedorHome() {
    const { profile } = useAuth()
    const { checkins, todayCheckin } = useCheckins()
    const { storeGoal, sellerGoals } = useGoals()
    const { ranking } = useRanking()
    const navigate = useNavigate()

    const myCheckins = checkins.filter(c => c.user_id === profile?.id)
    const vendasMes = somarVendas(myCheckins)
    const porCanal = somarVendasPorCanal(myCheckins)
    const dias = getDiasInfo()

    const myGoal = sellerGoals.find(g => g.user_id === profile?.id)
    const meta = myGoal?.target || (storeGoal ? Math.round(storeGoal.target / Math.max(ranking.length, 1)) : 0)
    const atingimento = calcularAtingimento(vendasMes, meta)
    const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
    const faltaX = calcularFaltaX(meta, vendasMes)
    const myRank = ranking.find(r => r.user_id === profile?.id)

    // Last 7 days
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    const weekStr = weekAgo.toISOString().split('T')[0]
    const vendasSemana = somarVendas(myCheckins.filter(c => c.date >= weekStr))

    const StatCard = ({ icon: Icon, label, value, sub, color, bg, trend, index }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="inner-card p-8 flex flex-col justify-between group hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.08)] transition-all relative overflow-hidden bg-white border border-gray-100 hover:-translate-y-2 cursor-default"
        >
            <div className={`absolute -right-4 -top-4 w-32 h-32 ${bg} opacity-5 rounded-full blur-3xl group-hover:opacity-20 transition-all z-0`} />
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center border border-white shadow-2xl ${bg} ${color} group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                    <Icon size={28} />
                </div>
                {trend && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
                        <ArrowUpRight size={14} /> {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
                <div className="flex items-baseline gap-3">
                    <p className="text-5xl font-black text-[#1A1D20] tracking-tighter leading-none">{value}</p>
                    {sub && <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">{sub}</span>}
                </div>
            </div>
        </motion.div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Olá, <span className="text-indigo-600">{profile?.name?.split(' ')[0]}</span> <span className="animate-pulse inline-block">👋</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Painel de Performance Regional</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-4 bg-white border border-gray-100 p-2 pr-8 rounded-[2rem] shadow-xl shadow-black/[0.02] hover:shadow-2xl transition-all group">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:rotate-12 transition-transform">
                            <Trophy size={22} className="fill-white/20" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 opacity-60">Status de Elite</p>
                            <span className="text-lg font-black text-[#1A1D20] tracking-tighter uppercase">{myRank?.position || '--'}º no Ranking Nacional</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Check-in / Status */}
            <div className="shrink-0 mb-2">
                {!todayCheckin ? (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4, scale: 1.005 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate('/checkin')}
                        className="w-full bg-[#1A1D20] text-white rounded-[4rem] p-10 sm:p-14 text-left shadow-[0_45px_100px_-20px_rgba(0,0,0,0.3)] group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-white/5 via-indigo-500/5 to-transparent z-0 pointer-events-none" />
                        <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-indigo-600 opacity-10 rounded-full blur-[120px] group-hover:opacity-20 group-hover:scale-110 transition-all duration-1000" />

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shrink-0 border-4 border-white/10 shadow-[0_20px_60px_rgba(79,70,229,0.5)] group-hover:rotate-12 group-hover:scale-110 transition-all">
                                    <Zap size={48} className="text-white fill-white/20" />
                                </div>
                                <div className="max-w-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <h2 className="font-black text-white text-4xl sm:text-5xl tracking-tighter leading-none">Ponto em Aberto</h2>
                                        <div className="bg-amber-500 p-1.5 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
                                    </div>
                                    <p className="text-gray-400 text-lg sm:text-xl font-bold opacity-80 leading-relaxed max-w-xl">
                                        Seu fluxo de hoje ainda não foi processado. Registre suas métricas para desbloquear sua posição no ranking atual.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 group/btn">
                                <span className="text-sm font-black uppercase tracking-[0.4em] text-white/40 group-hover/btn:text-white transition-colors">Iniciar Registro</span>
                                <div className="w-20 h-20 rounded-full bg-white text-[#1A1D20] flex items-center justify-center shadow-2xl group-hover:scale-115 transition-transform border-4 border-white/10 group-hover:bg-indigo-400 group-hover:text-white">
                                    <ArrowRight size={32} />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50/50 border-2 border-emerald-100 rounded-[3.5rem] p-10 flex flex-col lg:flex-row lg:items-center gap-10 shadow-xl shadow-emerald-500/5 relative overflow-hidden group hover:bg-emerald-50 transition-colors"
                    >
                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-100 opacity-20 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                        <div className="flex items-center gap-10 relative z-10 flex-1">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-[2rem] bg-white border border-emerald-100 flex items-center justify-center shadow-2xl shadow-emerald-500/10 group-hover:scale-105 transition-transform">
                                    <CheckSquare size={36} className="text-emerald-500" />
                                </div>
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg animate-bounce">
                                    <Sparkles size={14} className="text-white fill-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-emerald-900 text-3xl tracking-tighter leading-none mb-3">Check-in Concluído</h3>
                                <p className="text-emerald-700/60 text-[10px] font-black uppercase tracking-[0.3em] bg-emerald-100/50 px-4 py-1.5 rounded-full inline-block border border-emerald-100">Performance Indexada no Sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/checkin')}
                            className="w-full lg:w-auto text-[10px] font-black uppercase tracking-[0.3em] bg-white text-[#1A1D20] hover:bg-[#1A1D20] hover:text-white border-2 border-emerald-100 px-12 py-5 rounded-full transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-4 group/btn-upd"
                        >
                            Atualizar Métricas <ArrowRight size={18} className="group-hover/btn-upd:translate-x-2 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 shrink-0">
                <StatCard index={0} icon={Target} label="Meta do Ciclo" value={meta || '--'} sub={`${atingimento}% atg`} bg="bg-indigo-600" color="text-white" trend="Tracking" />
                <StatCard index={1} icon={Car} label="Fechamentos" value={vendasMes} sub={`Faltam ${faltaX}`} bg="bg-emerald-600" color="text-white" />
                <StatCard index={2} icon={TrendingUp} label="Projeção de Fim" value={projecao} sub="Predictive" bg="bg-blue-600" color="text-white" />
                <StatCard index={3} icon={Flame} label="Foco em Canal" value={porCanal.porta >= porCanal.internet && porCanal.porta >= porCanal.carteira ? 'Showroom' : porCanal.internet >= porCanal.carteira ? 'Digital' : 'Carteira'} bg="bg-amber-500" color="text-white" sub="Volume" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 shrink-0 pb-20">

                {/* Canal Analysis (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="inner-card p-12 bg-white relative overflow-hidden group border border-gray-100/50 hover:shadow-2xl transition-all">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gray-50 opacity-20 rounded-full blur-[100px] -mr-48 -mt-48 transition-colors group-hover:bg-indigo-50" />
                        <div className="flex items-center justify-between mb-14 relative z-10">
                            <div>
                                <h3 className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none mb-3">Mix de Conversão</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Volume de fechamentos por canal de aquisição</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-gray-50 flex items-center justify-center text-gray-200 shadow-inner group-hover:text-indigo-400 group-hover:rotate-12 transition-all">
                                <BarChart3 size={32} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                            {[
                                { label: 'Showroom', value: porCanal.porta, icon: Car, color: 'text-emerald-500', bg: 'bg-emerald-50/50 border-emerald-100/30', pct: Math.round((porCanal.porta / (vendasMes || 1)) * 100), desc: 'Tráfego Orgânico' },
                                { label: 'Carteira', value: porCanal.carteira, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50/50 border-blue-100/30', pct: Math.round((porCanal.carteira / (vendasMes || 1)) * 100), desc: 'Leads Retention' },
                                { label: 'Digital', value: porCanal.internet, icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50/50 border-indigo-100/30', pct: Math.round((porCanal.internet / (vendasMes || 1)) * 100), desc: 'Social & Web' },
                            ].map(ch => (
                                <div key={ch.label} className={`${ch.bg} border-2 rounded-[3rem] p-10 relative group/item transition-all hover:scale-[1.05] hover:shadow-2xl hover:bg-white`}>
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl border border-gray-50 group-hover/item:scale-110 group-hover/item:-rotate-12 transition-transform">
                                            <ch.icon size={28} className={`${ch.color}`} />
                                        </div>
                                        <div className={`text-[10px] font-black ${ch.color} bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm tracking-widest`}>{ch.pct}%</div>
                                    </div>
                                    <p className="text-6xl font-black text-[#1A1D20] mb-2 tracking-tighter leading-none">{ch.value}</p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 opacity-80 leading-none mb-2">{ch.label}</p>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{ch.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Info Sidebar (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">

                    {/* Weekly Performance Bar */}
                    <div className="inner-card p-12 bg-[#1A1D20] text-white flex flex-col relative overflow-hidden group shadow-[0_30px_70px_-20px_rgba(0,0,0,0.4)]">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-transparent z-0" />
                        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600 opacity-20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="w-16 h-16 rounded-[1.8rem] bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:rotate-12 transition-transform">
                                <TrendingUp size={32} className="text-white" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] leading-none mb-1">Weekly Pulse</span>
                                <span className="text-rose-400 text-[8px] font-black uppercase tracking-widest border border-rose-400/20 px-2 py-0.5 rounded-full">+4% vs Last WK</span>
                            </div>
                        </div>
                        <div className="relative z-10 mb-8">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-80">Cycle Progress</p>
                            <div className="flex items-baseline gap-3">
                                <p className="text-6xl font-black tracking-tighter leading-none">{vendasSemana}</p>
                                <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Vendas</span>
                            </div>
                        </div>
                        <div className="mt-auto space-y-3 relative z-10">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                <span>Eficiência da Semana</span>
                                <span className="text-white">65% Target</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '65%' }}
                                    transition={{ duration: 2, ease: "circOut" }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Predictive Alert */}
                    {faltaX > 0 && dias.restantes > 0 && (
                        <div className="bg-white border-2 border-amber-100 rounded-[3.5rem] p-10 shadow-2xl shadow-amber-500/5 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 opacity-50 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                            <div className="flex items-center gap-6 mb-8 relative z-10">
                                <div className="bg-amber-500 w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-amber-500/40 text-white group-hover:scale-110 transition-transform">
                                    <AlertTriangle size={32} className="fill-white/10" />
                                </div>
                                <div>
                                    <h4 className="font-black text-[#1A1D20] text-2xl tracking-tighter leading-none mb-1">Sprint de Fechamento</h4>
                                    <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Cálculo de Necessidade Diária</p>
                                </div>
                            </div>
                            <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100 relative z-10">
                                <p className="text-amber-900/80 text-lg font-bold leading-relaxed mb-6">
                                    Mantenha o ritmo de <span className="bg-amber-500 text-white px-3 py-1 rounded-xl font-black shadow-lg shadow-amber-500/20">{(faltaX / dias.restantes).toFixed(1)} vendas</span>/dia para garantir o objetivo do mês.
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-[1px] bg-amber-200" />
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Meta em Foco</span>
                                    <div className="flex-1 h-[1px] bg-amber-200" />
                                </div>
                                <p className="text-center mt-6 text-amber-900/40 text-[10px] font-black uppercase tracking-[0.2em]">Faltam {faltaX} vendas em {dias.restantes} dias úteis</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
