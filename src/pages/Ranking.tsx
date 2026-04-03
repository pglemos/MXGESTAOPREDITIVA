import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Trophy, 
    TrendingUp, 
    Target, 
    Medal, 
    Star, 
    Crown, 
    ChevronRight, 
    User, 
    Award, 
    Sparkles, 
    Zap, 
    Flame,
    RefreshCw,
    Info,
    ArrowUpRight
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Ranking() {
    const { profile } = useAuth()
    const { ranking, loading, refetch } = useRanking()
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch?.()
        setIsRefetching(false)
    }, [refetch])

    // 4. Enhanced tie-breaking logic and attainment scaling
    const sortedRanking = useMemo(() => {
        return [...ranking].sort((a, b) => {
            if (b.vnd_total !== a.vnd_total) return b.vnd_total - a.vnd_total
            if (b.visitas !== a.visitas) return b.visitas - a.visitas
            return b.leads - a.leads
        })
    }, [ranking])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Computando Elo de Elite...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Arena de Performance</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                            Snapshot em tempo real • Cluster Alpha
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="flex items-center justify-center gap-3 rounded-full border border-gray-100 bg-white px-8 py-4 shadow-sm group">
                        <Trophy size={18} className="text-amber-500 group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{sortedRanking.length} Especialistas na Grade</span>
                    </div>
                </div>
            </div>

            {sortedRanking.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-40 rounded-[2.5rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                    <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                        <Medal size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Temporada Iniciando</h3>
                    <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                        O grid de elite será preenchido assim que os primeiros check-ins operacionais forem validados.
                    </p>
                </div>
            ) : (
                <div className="grid gap-8 pb-32">
                    <AnimatePresence mode="popLayout">
                        {sortedRanking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop3 = i < 3
                            // 12. Handling attainment > 100%
                            const attainment = r.atingimento || 0

                            return (
                                <motion.div
                                    key={r.user_id} // 1. Fixed key
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={cn(
                                        "p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16 transition-all relative group overflow-hidden border rounded-[2.2rem]",
                                        isMe ? "border-electric-blue bg-indigo-50/20 shadow-elevation z-20 ring-4 ring-electric-blue/5" :
                                        isTop3 ? "border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-1" :
                                        "border-gray-50 bg-white/50 hover:bg-white hover:shadow-xl"
                                    )}
                                >
                                    {/* 2. & 3. Layout Shift & Z-Index fix */}
                                    {isTop3 && (
                                        <div className={cn(
                                            "absolute right-0 top-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none -mr-40 -mt-40 opacity-30 transition-all group-hover:opacity-50",
                                            i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-orange-400"
                                        )} />
                                    )}

                                    <div className="flex min-w-0 flex-1 flex-col gap-8 sm:flex-row sm:items-center lg:gap-16 relative z-10">
                                        {/* Position Component */}
                                        <div className="relative flex flex-shrink-0 flex-col items-center justify-center sm:min-w-[120px]">
                                            {i === 0 ? (
                                                <div className="relative pt-4">
                                                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl border-4 border-white transform -rotate-3 group-hover:rotate-0 transition-transform">
                                                        <span className="text-4xl font-black text-white italic tracking-tighter">1º</span>
                                                    </div>
                                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-amber-500 drop-shadow-xl h-10 w-10">
                                                        <Crown size={40} className="fill-amber-500" />
                                                    </div>
                                                </div>
                                            ) : i === 1 ? (
                                                <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-tr from-gray-300 to-gray-500 flex items-center justify-center shadow-xl border-4 border-white group-hover:scale-105 transition-transform">
                                                    <span className="text-3xl font-black text-white italic tracking-tighter">2º</span>
                                                </div>
                                            ) : i === 2 ? (
                                                <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-tr from-orange-400 to-orange-700 flex items-center justify-center shadow-xl border-4 border-white group-hover:scale-105 transition-transform">
                                                    <span className="text-3xl font-black text-white italic tracking-tighter">3º</span>
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl border transition-all",
                                                    isMe ? "bg-pure-black text-white border-transparent shadow-lg" : "bg-gray-50 text-gray-300 border-gray-100"
                                                )}>
                                                    {i + 1}
                                                </div>
                                            )}
                                        </div>

                                        {/* Detail Component */}
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                                                <h3 className={cn(
                                                    "break-words text-3xl font-black leading-none tracking-tighter transition-colors",
                                                    isMe ? "text-indigo-900" : "text-pure-black group-hover:text-electric-blue"
                                                )}>
                                                    {r.user_name || 'Especialista Anônimo'}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {isMe && (
                                                        <div className="flex items-center gap-2 bg-electric-blue text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-indigo-600/30">
                                                            <Star size={12} className="fill-white" /> Seu Perfil
                                                        </div>
                                                    )}
                                                    {i === 0 && (
                                                        <div className="flex items-center gap-2 bg-amber-500 text-white text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20">
                                                            <Flame size={12} className="fill-white animate-pulse" /> On Fire
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-inner group-hover:bg-white transition-colors">
                                                    <Zap size={16} className="text-indigo-500" /> <span>{r.leads} Leads</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-inner group-hover:bg-white transition-colors">
                                                    <TrendingUp size={16} className="text-blue-500" /> <span>{r.agd_total} Agd</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-inner group-hover:bg-white transition-colors">
                                                    <Target size={16} className="text-amber-500" /> <span>{r.visitas} Visitas</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 8. & 11. Typography and Responsive fix */}
                                    <div className="flex w-full flex-col gap-10 border-t border-gray-50 pt-10 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:justify-end lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0 relative z-10">
                                        <div className="flex flex-col items-start lg:items-end min-w-[140px]">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 leading-none opacity-60">Sellout Consolidado</p>
                                            <div className="flex items-center gap-6">
                                                <div className="text-left lg:text-right">
                                                    <p className={cn(
                                                        "text-6xl font-black tracking-tighter leading-none font-mono-numbers",
                                                        isTop3 ? "text-pure-black" : "text-gray-400"
                                                    )}>
                                                        {r.vnd_total}
                                                    </p>
                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">Unidades</p>
                                                </div>
                                                <Link to={`/relatorios/performance-vendedores?id=${r.user_id}`} className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 hover:text-electric-blue hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm group/btn">
                                                    <ChevronRight size={24} strokeWidth={3} className="group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                            </div>
                                        </div>

                                        {r.meta > 0 && (
                                            <div className="flex min-w-[160px] flex-col items-start text-left sm:items-end sm:text-right">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-5 leading-none opacity-60">Taxa de Atingimento</p>
                                                <div className="flex flex-col items-end gap-4 w-full">
                                                    <div className="flex items-center gap-2">
                                                        {attainment >= 100 && <ArrowUpRight size={18} className="text-emerald-500 animate-pulse" strokeWidth={3} />}
                                                        <span className={cn(
                                                            "text-4xl font-black tracking-tighter font-mono-numbers leading-none",
                                                            attainment >= 100 ? "text-emerald-500" : attainment >= 70 ? "text-amber-500" : "text-rose-500"
                                                        )}>
                                                            {attainment}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full sm:w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner p-0.5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(attainment, 100)}%` }}
                                                            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                                            className={cn(
                                                                "h-full rounded-full transition-all shadow-sm",
                                                                attainment >= 100 ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-emerald-500/20" : 
                                                                attainment >= 70 ? "bg-gradient-to-r from-amber-400 to-amber-600 shadow-amber-500/20" : 
                                                                "bg-gradient-to-r from-rose-400 to-rose-600 shadow-rose-500/20"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
