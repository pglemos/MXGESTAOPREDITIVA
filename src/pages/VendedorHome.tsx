import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTrainings } from '@/hooks/useData'
import { calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import { Target, TrendingUp, Trophy, CheckSquare, Car, Users, Globe, BarChart3, AlertTriangle, ArrowRight, Star, ArrowUpRight, Zap, Sparkles, LayoutDashboard, Crown, Flame, RefreshCw, Phone, CalendarDays, History, GraduationCap, Play } from 'lucide-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { startOfWeek } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default function VendedorHome() {
    const { profile } = useAuth()
    const { checkins, todayCheckin, loading: checkisLoading, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, sellerGoals, loading: goalsLoading, fetchGoals: refetchGoals } = useGoals()
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
    const { trainings, loading: trainingsLoading, refetch: refetchTrainings } = useTrainings()
    const [isRefetching, setIsRefetching] = useState(false)
    const navigate = useNavigate()

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([
            refetchCheckins(), 
            refetchGoals(), 
            refetchRanking?.() || Promise.resolve(),
            refetchTrainings?.() || Promise.resolve()
        ])
        setIsRefetching(false)
        toast.success('Cockpit de performance atualizado!')
    }, [refetchCheckins, refetchGoals, refetchRanking, refetchTrainings])

    // 🚀 Lógica de Prescrição MX na Home
    const tacticalPrescription = useMemo(() => {
        if (!checkins.length || !trainings.length) return null
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
        const recentCheckins = checkins.filter(c => c.seller_user_id === profile?.id && c.reference_date >= weekStart)
        if (recentCheckins.length === 0) return null

        const funil = calcularFunil(recentCheckins)
        const diag = gerarDiagnosticoMX(funil)
        if (!diag.gargalo) return null

        const categoryMap: Record<string, string> = {
            'LEAD_AGD': 'prospeccao',
            'AGD_VISITA': 'atendimento',
            'VISITA_VND': 'fechamento'
        }

        const category = categoryMap[diag.gargalo]
        const recommended = trainings.find(t => t.type === category && !t.watched)
        if (!recommended) return null

        return { gargalo: diag.gargalo, label: diag.diagnostico, training: recommended }
    }, [checkins, trainings, profile?.id])

    // 1. & 11. Performance: Memoized metrics
    const metrics = useMemo(() => {
        const myCheckins = checkins.filter(c => c.seller_user_id === profile?.id)
        const vendasMes = somarVendas(myCheckins)
        const porCanal = somarVendasPorCanal(myCheckins)
        const dias = getDiasInfo()

        const myGoal = sellerGoals.find(g => g.user_id === profile?.id)
        const meta = myGoal?.target || (storeGoal ? Math.round(storeGoal.target / Math.max(ranking.length, 1)) : 0)
        const atingimento = calcularAtingimento(vendasMes, meta)
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        const myRank = ranking.find(r => r.user_id === profile?.id)
        const myRankIndex = ranking.findIndex(r => r.user_id === profile?.id)
        const competitors = {
            above: myRankIndex > 0 ? ranking[myRankIndex - 1] : null,
            below: myRankIndex < ranking.length - 1 ? ranking[myRankIndex + 1] : null
        }

        // Dados de Ontem (D-1)
        const yesterdayStr = new Date(); yesterdayStr.setDate(yesterdayStr.getDate() - 1)
        const yesterdayFormatted = yesterdayStr.toISOString().split('T')[0]
        const checkinOntem = myCheckins.find(c => c.reference_date === yesterdayFormatted)
        
        const vendasOntem = checkinOntem ? (checkinOntem.vnd_porta_prev_day || 0) + (checkinOntem.vnd_cart_prev_day || 0) + (checkinOntem.vnd_net_prev_day || 0) : 0
        const agendamentosHoje = todayCheckin ? (todayCheckin.agd_cart_today || 0) + (todayCheckin.agd_net_today || 0) : 0

        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        const weekStr = weekAgo.toISOString().split('T')[0]
        const vendasSemana = somarVendas(myCheckins.filter(c => c.reference_date >= weekStr))

        const leadsMes = myCheckins.reduce((s, c) => s + (c.leads_prev_day || 0), 0)

        return { 
            vendasMes, porCanal, dias, meta, atingimento, projecao, faltaX, myRank, 
            leadsMes, vendasOntem, agendamentosHoje, vendasSemana, competitors 
        }
    }, [checkins, profile, sellerGoals, storeGoal, ranking, todayCheckin])


    if (checkisLoading || goalsLoading || rankingLoading || trainingsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Suas Metas...</p>
        </div>
    )

    const StatCard = ({ icon: Icon, label, value, sub, color, bg, trend, index }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-100 rounded-[2.2rem] p-8 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden"
        >
            <div className={cn("absolute -right-4 -top-4 w-32 h-32 opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-all z-0", bg)} />
            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white shadow-sm transition-transform group-hover:scale-110", bg, color)}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
                        <ArrowUpRight size={14} strokeWidth={2.5} /> {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 leading-none opacity-60">{label}</p>
                <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-pure-black tracking-tighter leading-none font-mono-numbers">{value}</p>
                    {sub && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{sub}</span>}
                </div>
            </div>
        </motion.div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Olá, <span className="text-indigo-600">{profile?.name?.split(' ')[0]}</span> <span className="animate-pulse inline-block">👋</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Painel de Performance Individual</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="flex items-center gap-4 bg-white border border-gray-100 p-2 pr-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:rotate-12 transition-transform">
                            <Trophy size={22} className="fill-white/20" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1 opacity-60">Status Elite</p>
                            <span className="text-lg font-black text-pure-black tracking-tighter uppercase">{metrics.myRank?.position || '--'}º no Ranking Unidade</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prescrição Tática MX - Mandatory Training Alert */}
            <AnimatePresence>
                {tacticalPrescription && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="shrink-0"
                    >
                        <div className="bg-indigo-600 text-white rounded-[3.5rem] p-10 sm:p-12 relative overflow-hidden group shadow-3xl">
                            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-white/10 via-white/5 to-transparent pointer-events-none" />
                            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                            
                            <div className="flex flex-col lg:flex-row lg:items-center gap-10 relative z-10">
                                <div className="w-20 h-20 rounded-[2rem] bg-white text-indigo-600 flex items-center justify-center shadow-2xl shrink-0 transform group-hover:rotate-6 transition-transform">
                                    <GraduationCap size={40} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge className="bg-rose-500 text-white border-none text-[8px] font-black tracking-widest px-3 h-6 uppercase">Correção Obrigatória</Badge>
                                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">Gap: {tacticalPrescription.gargalo}</span>
                                    </div>
                                    <h3 className="text-3xl font-black tracking-tighter uppercase leading-none mb-3">Masterize sua {tacticalPrescription.training.type}</h3>
                                    <p className="text-indigo-100 text-sm font-bold leading-relaxed opacity-80 max-w-2xl">
                                        {tacticalPrescription.label} Conclua este treinamento hoje para normalizar seu funil.
                                    </p>
                                </div>
                                <div className="shrink-0 w-full lg:w-auto">
                                    <button 
                                        onClick={() => navigate('/treinamentos')}
                                        className="w-full lg:w-auto px-12 py-6 rounded-full bg-white text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:shadow-2xl hover:scale-105 transition-all active:scale-95 group/btn"
                                    >
                                        <Play size={18} className="fill-current group-hover/btn:scale-110" /> Iniciar Agora
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CTA Check-in */}
            <div className="shrink-0 mb-2">
                {!todayCheckin ? (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -4, scale: 1.005 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate('/checkin')}
                        className="w-full bg-pure-black text-white rounded-[4rem] p-10 sm:p-14 text-left shadow-3xl group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-white/5 via-indigo-500/5 to-transparent z-0 pointer-events-none" />
                        <div className="absolute -right-20 -top-20 w-[400px] h-[400px] bg-indigo-600 opacity-10 rounded-full blur-[120px] group-hover:opacity-20 transition-all duration-1000" />

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shrink-0 border-4 border-white/10 shadow-2xl group-hover:rotate-12 transition-transform">
                                    <Zap size={40} className="text-white fill-white/20" />
                                </div>
                                <div className="max-w-2xl">
                                    <h2 className="font-black text-white text-4xl tracking-tighter leading-none mb-4 uppercase">Status Pendente</h2>
                                    <p className="text-white/60 text-lg font-bold leading-relaxed max-w-xl">
                                        Sua produção de ontem ainda não foi indexada. Acesse o terminal para consolidar seu run-rate.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 group/btn">
                                <span className="text-xs font-black uppercase tracking-[0.4em] text-white/40 group-hover/btn:text-white transition-colors">Consolidar Ontem</span>
                                <div className="w-16 h-16 rounded-full bg-white text-pure-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                    <ArrowRight size={28} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 border border-emerald-100 rounded-[3rem] p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8 shadow-xl shadow-emerald-500/5 relative overflow-hidden"
                    >
                        <div className="flex items-center gap-8 relative z-10">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center shadow-lg">
                                    <CheckSquare size={28} className="text-emerald-500" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center animate-bounce">
                                    <Sparkles size={10} className="text-white fill-current" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-emerald-900 text-2xl tracking-tighter leading-none mb-2 uppercase">Produção Consolidada</h3>
                                <p className="text-emerald-700/60 text-[10px] font-black uppercase tracking-widest bg-emerald-100/50 px-4 py-1 rounded-lg inline-block">Indexação de Ontem Concluída • 100% OK</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/checkin')}
                            className="text-[10px] font-black uppercase tracking-[0.3em] bg-white text-pure-black border-2 border-emerald-100 px-10 py-4 rounded-full hover:bg-pure-black hover:text-white transition-all active:scale-95 shadow-sm"
                        >
                            Retificar Lançamento
                        </button>
                    </motion.div>
                )}
            </div>
...
            {/* Stats grid - Cockpit Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 shrink-0">
                <StatCard index={0} icon={History} label="Produção Ontem" value={metrics.vendasOntem} sub="Consolidado" bg="bg-emerald-50" color="text-emerald-600" trend="Realizado" />
                <StatCard index={1} icon={CalendarDays} label="Agenda de Hoje" value={metrics.agendamentosHoje} sub="Compromissos" bg="bg-blue-50" color="text-blue-600" />
                <StatCard index={2} icon={Zap} label="Projeção MX" value={metrics.projecao} sub="Predictive" bg="bg-slate-950" color="text-indigo-400" />
                <StatCard index={3} icon={Target} label="Meta do Mês" value={metrics.meta || '--'} sub={`${metrics.atingimento}% atg`} bg="bg-rose-50" color="text-rose-600" />
            </div>

            {/* Arena de Elite - Meritocracia Real-time */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-[3rem] p-10 md:p-12 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg"><Trophy size={24} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-pure-black tracking-tighter uppercase leading-none">Arena de Elite</h3>
                            <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Sua Posição no Campo de Batalha</p>
                        </div>
                    </div>
                    <Link to="/ranking" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Arena Completa</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {/* Quem você está caçando */}
                    <div className={cn("p-8 rounded-[2rem] border-2 border-dashed transition-all", metrics.competitors.above ? "bg-white border-amber-200 shadow-xl" : "bg-gray-100/50 border-gray-200 opacity-40")}>
                        {metrics.competitors.above ? (
                            <>
                                <p className="text-[8px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4">Próximo Alvo</p>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg border border-amber-100">{metrics.myRank?.position ? metrics.myRank.position - 1 : '--'}º</div>
                                    <div>
                                        <p className="font-black text-slate-950 uppercase tracking-tight">{metrics.competitors.above.user_name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{metrics.competitors.above.vnd_total} Vendas</p>
                                    </div>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-3 text-center">
                                    <p className="text-[9px] font-black text-amber-700 uppercase">Gap: {metrics.competitors.above.vnd_total - metrics.vendasMes} Vendas para superar</p>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <Crown size={32} className="text-amber-500 mb-2" />
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">VOCÊ É O TOPO DA ARENA</p>
                            </div>
                        )}
                    </div>

                    {/* Sua Posição Central */}
                    <div className="p-8 rounded-[2rem] bg-slate-950 text-white shadow-2xl transform md:scale-110 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 relative z-10 text-center">Seu Status Atual</p>
                        <div className="text-center relative z-10">
                            <p className="text-7xl font-black tracking-tighter leading-none mb-2 font-mono-numbers">{metrics.myRank?.position || '--'}º</p>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Na Unidade</p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                            <div className="text-left">
                                <p className="text-[7px] font-black text-white/40 uppercase">Vendido</p>
                                <p className="text-lg font-black">{metrics.vendasMes}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[7px] font-black text-white/40 uppercase">Eficiência</p>
                                <p className="text-lg font-black text-emerald-400">{metrics.atingimento}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Quem está na sua cola */}
                    <div className={cn("p-8 rounded-[2rem] border-2 border-dashed transition-all", metrics.competitors.below ? "bg-white border-rose-100" : "bg-gray-100/50 border-gray-200 opacity-40")}>
                        {metrics.competitors.below ? (
                            <>
                                <p className="text-[8px] font-black text-rose-400 uppercase tracking-[0.3em] mb-4">Na sua retaguarda</p>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-lg border border-rose-100">{metrics.myRank?.position ? metrics.myRank.position + 1 : '--'}º</div>
                                    <div>
                                        <p className="font-black text-slate-950 uppercase tracking-tight">{metrics.competitors.below.user_name}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{metrics.competitors.below.vnd_total} Vendas</p>
                                    </div>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-3 text-center">
                                    <p className="text-[9px] font-black text-rose-700 uppercase">Vantagem: {metrics.vendasMes - metrics.competitors.below.vnd_total} Vendas</p>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <Flame size={32} className="text-rose-400 mb-2" />
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">MANTENHA A DISTÂNCIA</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-20">
                {/* Mix Section (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-12 shadow-elevation relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50 opacity-20 rounded-full blur-[100px] -mr-48 -mt-48 transition-colors group-hover:bg-indigo-100" />
                        
                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div>
                                <h3 className="text-3xl font-black text-pure-black tracking-tighter leading-none mb-3">Sua Matrix de Canais</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Distribuição de fechamentos por canal</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-200 shadow-inner group-hover:text-indigo-500 transition-all">
                                <BarChart3 size={28} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                            {[
                                { label: 'Porta', value: metrics.porCanal.porta, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={cn(ch.bg, "border-2 rounded-[2.5rem] p-8 transition-all hover:bg-white hover:shadow-2xl hover:scale-[1.03] group/item")}>
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg border border-gray-50 group-hover/item:rotate-6 transition-transform">
                                            <ch.icon size={22} className={ch.color} strokeWidth={2.5} />
                                        </div>
                                        <div className={cn("text-[9px] font-black bg-white border border-gray-100 px-2.5 py-1 rounded-full shadow-sm", ch.color)}>{ch.pct}%</div>
                                    </div>
                                    <p className="text-5xl font-black text-pure-black mb-1 tracking-tighter font-mono-numbers">{ch.value}</p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-gray-400 opacity-80">{ch.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Growth Section (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">
                    <div className="bg-pure-black rounded-[2.5rem] p-10 md:p-12 text-white relative overflow-hidden group shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-transparent z-0" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                            <Zap size={200} fill="currentColor" />
                        </div>

                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-electric-blue transition-colors">
                                <TrendingUp size={28} className="text-electric-blue" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Weekly Sprint</span>
                        </div>

                        <div className="relative z-10 space-y-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-80">Performance da Semana</p>
                                <div className="flex items-baseline gap-3 mb-6">
                                    <p className="text-6xl font-black tracking-tighter leading-none font-mono-numbers">{metrics.vendasSemana}</p>
                                    <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Unidades</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '72%' }}
                                        transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full bg-gradient-to-r from-electric-blue to-indigo-400 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                    />
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-bold leading-relaxed italic opacity-60">
                                "O sucesso é a soma de pequenos esforços repetidos dia após dia."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
