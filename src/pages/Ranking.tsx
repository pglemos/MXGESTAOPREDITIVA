import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Trophy, Medal, Star, Crown, ChevronRight, User, Award, Zap, RefreshCw, TrendingUp, Target, Flame
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
        return [...(ranking || [])].sort((a, b) => {
            if (b.vnd_total !== a.vnd_total) return b.vnd_total - a.vnd_total
            return b.visitas - a.visitas
        })
    }, [ranking])

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-brand-primary" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div>
                    <span className="mx-text-caption text-status-warning mb-2 block font-black tracking-[0.3em]">MERITOCRACIA REAL-TIME</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Arena de Performance</h1>
                    <p className="text-sm font-bold text-text-secondary mt-4 uppercase tracking-wide">Snapshot Nacional da Rede MX</p>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={handleRefresh} className="w-14 h-14 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-95 transition-all">
                        <RefreshCw size={24} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="flex items-center justify-center gap-3 rounded-full border border-border-default bg-white px-8 py-4 shadow-mx-sm">
                        <Trophy size={20} className="text-status-warning" />
                        <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">{sortedRanking.length} Especialistas Ativos</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-mx-xl">
                {sortedRanking.length > 0 ? (
                    <div className="grid gap-mx-md">
                        <AnimatePresence mode="popLayout">
                            {sortedRanking.map((r, i) => {
                                const isMe = r.user_id === profile?.id
                                const isTop3 = i < 3
                                return (
                                    <motion.div
                                        key={r.user_id} layout
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                        className={cn(
                                            "p-mx-lg flex flex-col lg:flex-row lg:items-center gap-mx-lg transition-all relative overflow-hidden border rounded-mx-3xl",
                                            isMe ? "border-brand-primary bg-brand-primary-surface shadow-mx-lg" : "bg-white border-border-subtle hover:shadow-mx-md"
                                        )}
                                    >
                                        <div className="flex items-center gap-mx-xl flex-1 min-w-0">
                                            <div className="w-14 h-14 rounded-mx-xl bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-2xl text-text-primary shadow-inner">
                                                {i + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase truncate">{r.user_name}</h3>
                                                <div className="flex items-center gap-mx-md mt-2">
                                                    <span className="mx-text-caption !text-[8px] text-text-secondary">{r.leads} Leads</span>
                                                    <div className="w-1 h-1 rounded-full bg-mx-slate-300" />
                                                    <span className="mx-text-caption !text-[8px] text-text-secondary">{r.visitas} Visitas</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-mx-xl border-t lg:border-t-0 lg:border-l border-border-subtle pt-mx-lg lg:pt-0 lg:pl-mx-xl">
                                            <div className="text-right">
                                                <p className="mx-text-caption !text-[8px] text-text-tertiary mb-1">UNIDADES</p>
                                                <p className="text-4xl font-black text-text-primary font-mono-numbers leading-none">{r.vnd_total}</p>
                                            </div>
                                            <Link to={`/relatorios/performance-vendedores?id=${r.user_id}`} className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 border border-border-default text-text-tertiary hover:bg-brand-secondary hover:text-white transition-all flex items-center justify-center shadow-sm">
                                                <ChevronRight size={22} />
                                            </Link>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-mx-slate-50/20 border-2 border-dashed border-border-default rounded-[3rem]">
                        <div className="w-24 h-24 rounded-mx-3xl bg-white shadow-mx-lg flex items-center justify-center mb-mx-lg"><Medal size={48} className="text-mx-slate-200" /></div>
                        <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase mb-2">Arena em Aquecimento</h3>
                        <p className="mx-text-caption text-text-secondary max-w-xs leading-relaxed uppercase font-black">Aguardando as primeiras conversões do ciclo para computar o ranking de elite.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
