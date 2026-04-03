import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Trophy, TrendingUp, Target, Medal, Star, Crown, ChevronRight, User, Award, Sparkles, Zap, Flame, RefreshCw, ArrowUpRight
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

    const sortedRanking = useMemo(() => {
        return [...ranking].sort((a, b) => {
            if (b.vnd_total !== a.vnd_total) return b.vnd_total - a.vnd_total
            if (b.visitas !== a.visitas) return b.visitas - a.visitas
            return b.leads - a.leads
        })
    }, [ranking])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin shadow-mx-lg"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse">Computando Arena de Elite...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-status-warning rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Arena de Performance</h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60">Snapshot Nacional • Meritocracia em Tempo Real</p>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={handleRefresh} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="flex items-center justify-center gap-3 rounded-full border border-border-default bg-white px-mx-md py-4 shadow-mx-sm">
                        <Trophy size={18} className="text-status-warning" />
                        <span className="mx-text-caption text-text-primary">{sortedRanking.length} Especialistas Ativos</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-mx-md pb-mx-3xl">
                <AnimatePresence mode="popLayout">
                    {sortedRanking.map((r, i) => {
                        const isMe = r.user_id === profile?.id
                        const isTop3 = i < 3
                        return (
                            <motion.div
                                key={r.user_id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-mx-md sm:p-mx-lg flex flex-col lg:flex-row lg:items-center gap-mx-md lg:gap-mx-xl transition-all relative group overflow-hidden border rounded-mx-3xl",
                                    isMe ? "border-brand-primary bg-brand-primary-surface shadow-mx-xl z-20 ring-4 ring-brand-primary/5" :
                                    isTop3 ? "border-border-default bg-white hover:shadow-mx-xl hover:-translate-y-1" :
                                    "border-border-subtle bg-white/50 hover:bg-white hover:shadow-mx-lg"
                                )}
                            >
                                <div className="flex min-w-0 flex-1 flex-col gap-mx-md sm:flex-row sm:items-center lg:gap-mx-xl relative z-10">
                                    {/* Position Indicator */}
                                    <div className="relative flex flex-shrink-0 flex-col items-center justify-center sm:min-w-[120px]">
                                        {i === 0 ? (
                                            <div className="relative pt-4">
                                                <div className="w-20 h-20 rounded-mx-lg bg-gradient-to-tr from-mx-amber-400 to-mx-amber-600 flex items-center justify-center shadow-mx-xl border-4 border-white transform -rotate-3 group-hover:rotate-0 transition-transform">
                                                    <span className="text-3xl font-black text-white italic">1º</span>
                                                </div>
                                                <Crown size={32} className="absolute -top-4 left-1/2 -translate-x-1/2 text-status-warning fill-status-warning/20 animate-bounce" />
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "w-14 h-14 rounded-mx-md flex items-center justify-center font-black text-xl border transition-all",
                                                isMe ? "bg-brand-secondary text-white border-transparent shadow-mx-lg" : "bg-mx-slate-50 text-mx-slate-200 border-border-default"
                                            )}>
                                                {i + 1}
                                            </div>
                                        )}
                                    </div>

                                    {/* Performer Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-mx-sm flex flex-col gap-mx-xs sm:flex-row sm:items-center">
                                            <h3 className={cn("text-2xl font-black tracking-tight truncate", isMe ? "text-brand-primary" : "text-text-primary group-hover:text-brand-primary transition-colors")}>
                                                {r.user_name}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {isMe && <span className="bg-brand-primary text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-mx-md flex items-center gap-1.5"><Star size={10} fill="currentColor" /> Seu Perfil</span>}
                                                {i === 0 && <span className="bg-status-warning text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-mx-md flex items-center gap-1.5"><Flame size={10} fill="currentColor" /> On Fire</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-mx-sm">
                                            <div className="flex items-center gap-2 bg-mx-slate-50 border border-border-default px-mx-sm py-1.5 rounded-mx-md mx-text-caption">
                                                <Zap size={14} className="text-brand-primary" /> {r.leads} Leads
                                            </div>
                                            <div className="flex items-center gap-2 bg-mx-slate-50 border border-border-default px-mx-sm py-1.5 rounded-mx-md mx-text-caption">
                                                <TrendingUp size={14} className="text-status-info" /> {r.agd_total} Agd
                                            </div>
                                            <div className="flex items-center gap-2 bg-mx-slate-50 border border-border-default px-mx-sm py-1.5 rounded-mx-md mx-text-caption">
                                                <Target size={14} className="text-status-warning" /> {r.visitas} Visitas
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Results Column */}
                                <div className="flex w-full flex-col gap-mx-lg border-t border-border-subtle pt-mx-md sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:border-l lg:border-t-0 lg:pl-mx-xl lg:pt-0 relative z-10">
                                    <div className="text-left lg:text-right">
                                        <p className="mx-text-caption opacity-60 mb-1">Sellout</p>
                                        <p className={cn("text-5xl font-black tracking-tighter leading-none font-mono-numbers", isTop3 ? "text-text-primary" : "text-text-tertiary")}>{r.vnd_total}</p>
                                        <p className="text-[8px] font-black uppercase text-text-tertiary mt-1">Unidades</p>
                                    </div>

                                    <div className="flex flex-col items-start sm:items-end min-w-[120px]">
                                        <p className="mx-text-caption opacity-60 mb-2">Atingimento</p>
                                        <div className="flex flex-col items-end gap-2 w-full">
                                            <span className={cn("text-2xl font-black font-mono-numbers", r.atingimento >= 100 ? 'text-status-success' : 'text-status-warning')}>
                                                {r.atingimento}%
                                            </span>
                                            <div className="w-full sm:w-24 h-1.5 bg-mx-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(r.atingimento, 100)}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", r.atingimento >= 100 ? 'bg-status-success' : 'bg-status-warning')} />
                                            </div>
                                        </div>
                                    </div>

                                    <Link to={`/relatorios/performance-vendedores?id=${r.user_id}`} className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-center text-text-tertiary hover:text-brand-primary hover:shadow-mx-md transition-all shrink-0">
                                        <ChevronRight size={20} strokeWidth={3} />
                                    </Link>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
