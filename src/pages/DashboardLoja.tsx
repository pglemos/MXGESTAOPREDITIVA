import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { 
    calcularAtingimento, 
    calcularProjecao, 
    calcularFaltaX, 
    getDiasInfo, 
    somarVendas, 
    somarVendasPorCanal, 
    calcularFunil 
} from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    AlertTriangle, 
    ArrowUpRight, 
    BarChart3, 
    Car, 
    Calendar, 
    CheckCircle, 
    ChevronRight, 
    Clock, 
    Download, 
    Eye, 
    Filter, 
    Globe, 
    MoreHorizontal, 
    Phone, 
    Share2, 
    Sparkles, 
    Target, 
    TrendingUp, 
    Users, 
    RefreshCw
} from 'lucide-react'
import { useMemo, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// 3. Stat component moved outside for better organization
interface StatProps {
    icon: any
    label: string
    value: string | number
    sub?: string
    bg: string
    color: string
    trend?: string
    delay?: number
}

const Stat = ({ icon: Icon, label, value, sub, bg, color, trend, delay = 0 }: StatProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: "easeOut" }}
        className="rounded-[2rem] p-8 flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden bg-white border border-gray-100"
    >
        <div className={cn("absolute -right-8 -top-8 w-32 h-32 opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-all z-0", bg)} />
        <div className="flex items-start justify-between mb-8 relative z-10">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm transition-transform group-hover:scale-110", bg, color)}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {trend && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                    <ArrowUpRight size={14} strokeWidth={3} /> {trend}
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-0.5">{label}</p>
            <div className="flex items-baseline gap-3">
                <p className="text-4xl font-black text-pure-black tracking-tighter">{value}</p>
                {sub && (
                    <span className="text-[10px] font-black bg-gray-50 text-gray-400 border border-gray-100 px-2 py-1 rounded-lg uppercase tracking-widest truncate max-w-[120px]">
                        {sub}
                    </span>
                )}
            </div>
        </div>
    </motion.div>
)

export default function DashboardLoja() {
    const { membership } = useAuth()
    const { checkins, loading, refetch: refetchCheckins } = useCheckins()
    const { storeGoal, refetch: refetchGoals } = useGoals()
    const { sellers, refetch: refetchTeam } = useTeam()
    const { ranking, refetch: refetchRanking } = useRanking()
    const [isRefetching, setIsRefetching] = useState(false)
    const [rankingLimit, setRankingLimit] = useState(8)

    const dias = useMemo(() => getDiasInfo(), [])

    // 1. & 2. & 4. Logic optimization via useMemo
    const metrics = useMemo(() => {
        const meta = storeGoal?.target || 0
        const vendasMes = somarVendas(checkins)
        const porCanal = somarVendasPorCanal(checkins)
        const atingimento = calcularAtingimento(vendasMes, meta)
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        const funil = calcularFunil(checkins)
        const checkedInCount = sellers.filter(s => s.checkin_today).length
        const storeName = membership?.store?.name || 'Unidade Operacional'

        return {
            meta,
            vendasMes,
            porCanal,
            atingimento,
            projecao,
            faltaX,
            funil,
            checkedInCount,
            storeName
        }
    }, [checkins, storeGoal, sellers, membership, dias])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([
                refetchCheckins(),
                refetchGoals(),
                refetchTeam(),
                refetchRanking()
            ])
            toast.success('Cockpit da unidade sincronizado!')
        } catch (e) {
            toast.error('Erro ao atualizar dados.')
        } finally {
            setIsRefetching(false)
        }
    }, [refetchCheckins, refetchGoals, refetchTeam, refetchRanking])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Escaneando performance da unidade...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-8 md:gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">{metrics.storeName}</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Node Intelligence & Performance</p>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-4 shrink-0 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex w-full items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-1.5 sm:w-auto shadow-sm">
                        <button className="px-5 py-2.5 rounded-xl bg-pure-black text-white font-black text-[10px] uppercase tracking-widest shadow-lg">Mensal</button>
                        <button className="px-5 py-2.5 rounded-xl text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-pure-black transition-colors">Semanal</button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleRefresh}
                            disabled={isRefetching}
                            className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                        >
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </button>
                        <button 
                            onClick={() => toast.info('Exportando dados da unidade...')}
                            className="w-12 h-12 rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-all hover:text-electric-blue hover:shadow-xl flex items-center justify-center"
                        >
                            <Download size={20} />
                        </button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-3xl active:scale-95">
                            <Share2 size={16} /> Relatórios
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 shrink-0">
                <Stat icon={Target} label="Meta Mensal" value={metrics.meta} sub={`${metrics.atingimento}%`} bg="bg-indigo-50" color="text-indigo-600" trend="Alcançável" delay={0.1} />
                <Stat icon={Car} label="Vendas Unidade" value={metrics.vendasMes} sub={`Faltam ${metrics.faltaX}`} bg="bg-emerald-50" color="text-emerald-600" delay={0.2} />
                <Stat icon={TrendingUp} label="Projeção IA" value={metrics.projecao} bg="bg-blue-50" color="text-blue-600" sub="Optimized" delay={0.3} />
                <Stat icon={Users} label="Check-in Team" value={`${metrics.checkedInCount}/${sellers.length}`} bg="bg-amber-50" color="text-amber-600" sub="Online" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-20">

                {/* Main Content Area (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">

                    {/* Vendas por canal */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden relative group">
                        <div className="absolute right-0 top-0 w-80 h-80 bg-electric-blue/5 rounded-full blur-[100px] pointer-events-none -mt-40 -mr-40 transition-all group-hover:bg-electric-blue/10" />

                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl">
                                    <BarChart3 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Canais de Conversão</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Distribuição Multicanal</p>
                                </div>
                            </div>
                            <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-pure-black transition-all shadow-sm">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                            {[
                                { label: 'Showroom', value: metrics.porCanal.porta, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Canais Digitais', value: metrics.porCanal.internet, icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={cn(ch.bg, "border rounded-[2rem] p-6 group/item relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1")}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-50 transition-transform group-hover/item:rotate-6">
                                            <ch.icon size={22} className={ch.color} strokeWidth={2.5} />
                                        </div>
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border bg-white/80", ch.color)}>
                                            {ch.pct}%
                                        </span>
                                    </div>
                                    <p className="text-4xl font-black text-pure-black mb-1 tracking-tighter font-mono-numbers">{ch.value}</p>
                                    <p className="text-[9px] uppercase tracking-[0.2em] font-black text-gray-400">{ch.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-gray-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1.5">Especialistas de Elite</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Monitoramento de Performance Individual</p>
                            </div>
                            <Link to="/ranking" className="flex items-center gap-2 text-[10px] font-black text-electric-blue uppercase tracking-widest hover:underline transition-all group">
                                Ver Ranking Completo <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="bg-gray-50/50 text-gray-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-gray-100">
                                        <th className="pl-10 py-5 w-20 text-center">Pos</th>
                                        <th className="py-5">Consultor</th>
                                        <th className="py-5 text-center">Leads</th>
                                        <th className="py-5 text-center">Visitas</th>
                                        <th className="py-5 text-center">Vendas</th>
                                        <th className="pr-10 py-5 text-right">Eficiência</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {ranking.length === 0 ? (
                                        <tr><td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 opacity-40">
                                                <Users size={32} className="text-gray-300" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 italic">Sincronizando banco de performance...</p>
                                            </div>
                                        </td></tr>
                                    ) : ranking.slice(0, rankingLimit).map((r, i) => (
                                        <tr key={r.user_id} className="hover:bg-gray-50/50 transition-colors group cursor-default">
                                            <td className="pl-10 py-6">
                                                <div className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs mx-auto border shadow-sm",
                                                    i === 0 ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                                    i === 1 ? 'bg-slate-50 border-slate-200 text-slate-500' :
                                                    i === 2 ? 'bg-orange-50 border-orange-200 text-orange-600' :
                                                    'bg-white border-gray-100 text-gray-400'
                                                )}>
                                                    {r.position}
                                                </div>
                                            </td>
                                            <td className="py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-sm shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all">
                                                        {r.user_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <span className="text-pure-black font-black text-sm block group-hover:text-electric-blue transition-colors">{r.user_name || 'Usuário'}</span>
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">Team Member</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 text-center font-black text-gray-400 text-sm font-mono-numbers">{r.leads}</td>
                                            <td className="py-6 text-center font-black text-gray-400 text-sm font-mono-numbers">{r.visitas}</td>
                                            <td className="py-6 text-center">
                                                <span className="px-4 py-2 rounded-full bg-pure-black text-white font-black text-[11px] shadow-lg shadow-black/10">
                                                    {r.vnd_total}
                                                </span>
                                            </td>
                                            <td className="pr-10 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={cn(
                                                        "text-sm font-black font-mono-numbers",
                                                        r.atingimento >= 100 ? 'text-emerald-500' : r.atingimento >= 70 ? 'text-amber-500' : 'text-rose-500'
                                                    )}>
                                                        {r.atingimento}%
                                                    </span>
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(r.atingimento, 100)}%` }}
                                                            className={cn(
                                                                "h-full rounded-full transition-colors",
                                                                r.atingimento >= 100 ? 'bg-emerald-500' : r.atingimento >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {ranking.length > 8 && rankingLimit === 8 && (
                            <div className="p-6 border-t border-gray-50 text-center bg-gray-50/20">
                                <button onClick={() => setRankingLimit(20)} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-pure-black transition-colors">Expandir Tabela Completa</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar area (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">

                    {/* Alerta Status */}
                    <AnimatePresence>
                        {sellers.length > 0 && metrics.checkedInCount < sellers.length && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="bg-pure-black border border-gray-800 rounded-[2.5rem] p-8 flex items-start gap-5 shadow-3xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none group-hover:bg-rose-500/20 transition-all" />
                                <div className="bg-rose-500 p-3.5 rounded-2xl shrink-0 shadow-lg shadow-rose-500/40 transform -rotate-3">
                                    <AlertTriangle size={24} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-white text-[10px] font-black leading-tight uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                                        GAP Operacional <Sparkles size={12} className="text-rose-500 animate-pulse" />
                                    </p>
                                    <p className="text-white/60 text-sm font-bold leading-relaxed">
                                        <span className="text-white font-black">{sellers.length - metrics.checkedInCount} especialistas</span> ausentes no check-in operacional. Requer atenção imediata da gestão.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pipeline Funnel */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 flex flex-col shadow-elevation relative group overflow-hidden">
                        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-gray-50 rounded-full blur-[100px] group-hover:bg-indigo-50/50 transition-colors pointer-events-none" />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1">Fluxo Ativo</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Conversão de Unidade</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="space-y-10 relative z-10">
                            {[
                                { label: 'Leads Captados', value: metrics.funil.leads, pct: 100, color: 'bg-indigo-600', icon: Phone, lightBg: 'bg-indigo-50 text-indigo-600' },
                                { label: 'Agendamentos', value: metrics.funil.agd_total, pct: metrics.funil.tx_lead_agd, color: 'bg-blue-600', icon: Calendar, lightBg: 'bg-blue-50 text-blue-600' },
                                { label: 'Demonstrações', value: metrics.funil.visitas, pct: metrics.funil.tx_agd_visita, color: 'bg-amber-500', icon: Eye, lightBg: 'bg-amber-50 text-amber-600' },
                                { label: 'Conversão Final', value: metrics.funil.vnd_total, pct: metrics.funil.tx_visita_vnd, color: 'bg-emerald-600', icon: CheckCircle, lightBg: 'bg-emerald-50 text-emerald-600' },
                            ].map((step, i) => (
                                <div key={step.label} className="relative group/step">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-3 rounded-2xl shadow-sm border border-white transition-transform group-hover/step:rotate-6", step.lightBg)}>
                                                <step.icon size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5 opacity-60">{step.label}</span>
                                                <span className="text-pure-black font-black text-3xl tracking-tighter leading-none font-mono-numbers">{step.value}</span>
                                            </div>
                                        </div>
                                        {i > 0 && (
                                            <div className={cn("px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest", step.color.replace('bg-', 'text-'))}>
                                                {step.pct}% CR
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 rounded-full h-3 overflow-hidden p-0.5 border border-gray-100 shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(step.pct, 100)}%` }}
                                            transition={{ duration: 1.2, ease: "circOut", delay: 0.2 + (i * 0.1) }}
                                            className={cn(step.color, "h-full rounded-full shadow-lg shadow-black/5")}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Quick Review */}
                    <div className="bg-gray-50/50 border border-gray-100 rounded-[3rem] p-10 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-gray-100 -rotate-12 group-hover:text-indigo-50/50 transition-colors pointer-events-none">
                            <Users size={100} strokeWidth={1} />
                        </div>

                        <h3 className="text-xl font-black text-pure-black tracking-tight mb-10 relative z-10">Estado da Tropa</h3>

                        <div className="space-y-4 relative z-10">
                            {sellers.length === 0 ? (
                                <p className="text-sm font-bold text-gray-400 text-center py-10 italic opacity-40 bg-white/50 rounded-3xl border border-dashed border-gray-200">Unidade em fase de recrutamento...</p>
                            ) : (
                                <>
                                    {sellers.slice(0, 5).map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-white border border-white shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl group/card">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-sm shadow-inner group-hover/card:bg-pure-black group-hover/card:text-white transition-all">
                                                    {s.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-pure-black text-sm font-black tracking-tight">{s.name}</p>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">{s.role || 'Especialista'}</p>
                                                </div>
                                            </div>
                                            {s.checkin_today ? (
                                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                                                    <CheckCircle size={20} strokeWidth={2.5} />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-400 flex items-center justify-center border border-amber-100/50">
                                                    <Clock size={20} strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {sellers.length > 5 && (
                                        <Link to="/equipe" className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-electric-blue text-center transition-colors block">
                                            + {sellers.length - 5} Outros Membros
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
