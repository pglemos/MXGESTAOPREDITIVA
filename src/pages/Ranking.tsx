import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Trophy, Medal, Star, Crown, ChevronRight, User, Award, Zap, RefreshCw, TrendingUp, Target, Flame, Building2
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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
                        <RefreshCw size={24} className={cn((isRefetching || loading) && "animate-spin")} />
                    </button>
                    <div className="flex items-center justify-center gap-3 rounded-full border border-border-default bg-white px-8 py-4 shadow-mx-sm">
                        <Trophy size={20} className="text-status-warning" />
                        <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">
                            {loading ? <Skeleton className="h-3 w-20" /> : `${sortedRanking.filter(r => !r.is_venda_loja).length} Vendedores em Arena`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-mx-xl">
                {loading ? (
                    <div className="grid gap-mx-md">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="p-8 flex flex-col lg:flex-row lg:items-center gap-10 border rounded-[2.5rem] bg-gray-50/50">
                                <div className="flex items-center gap-8 flex-1">
                                    <Skeleton className="w-20 h-20 rounded-[2rem]" />
                                    <div className="space-y-3 flex-1">
                                        <Skeleton className="h-8 w-1/3" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-right space-y-2">
                                        <Skeleton className="h-3 w-16 ml-auto" />
                                        <Skeleton className="h-12 w-24 ml-auto" />
                                    </div>
                                    <Skeleton className="w-16 h-16 rounded-[1.5rem]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedRanking.length > 0 ? (
                    <div className="grid gap-mx-md">
                        <AnimatePresence mode="popLayout">
                            {sortedRanking.map((r, i) => {
                                const isMe = r.user_id === profile?.id
                                const isVendaLoja = (r as any).is_venda_loja
                                const isTop1 = i === 0 && !isVendaLoja
                                const isTop2 = i === 1 && !isVendaLoja
                                const isTop3 = i === 2 && !isVendaLoja
                                
                                return (
                                    <motion.div
                                        key={r.user_id} layout
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        className={cn(
                                            "p-8 flex flex-col lg:flex-row lg:items-center gap-10 transition-all relative overflow-hidden border rounded-[2.5rem]",
                                            isTop1 ? "bg-slate-950 border-amber-400/50 shadow-[0_20px_50px_rgba(245,158,11,0.15)] ring-2 ring-amber-400/20" : 
                                            isTop2 ? "bg-white border-slate-300 shadow-xl shadow-slate-200/50" :
                                            isTop3 ? "bg-white border-orange-200 shadow-xl shadow-orange-100/50" :
                                            isMe ? "border-indigo-600 bg-indigo-50/30 shadow-mx-lg" : 
                                            isVendaLoja ? "border-slate-200 bg-slate-50/50" : "bg-white border-gray-100 hover:shadow-mx-md"
                                        )}
                                    >
                                        {/* Efeitos de Fundo para o Top 1 */}
                                        {isTop1 && (
                                            <>
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
                                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] -ml-16 -mb-16" />
                                            </>
                                        )}

                                        <div className="flex items-center gap-8 flex-1 min-w-0 relative z-10">
                                            <div className={cn(
                                                "w-20 h-20 rounded-[2rem] border-4 flex items-center justify-center font-black text-3xl shadow-2xl transition-transform group-hover:scale-110",
                                                isTop1 ? "bg-amber-400 border-amber-300 text-slate-950 rotate-3" : 
                                                isTop2 ? "bg-slate-200 border-slate-100 text-slate-600 -rotate-2" :
                                                isTop3 ? "bg-orange-100 border-orange-50 text-orange-700 rotate-1" :
                                                isVendaLoja ? "bg-slate-100 border-slate-200 text-slate-400" : "bg-gray-50 border-white text-slate-950"
                                            )}>
                                                {isTop1 ? <Crown size={36} fill="currentColor" /> : 
                                                 isTop2 ? <Medal size={36} /> :
                                                 isTop3 ? <Award size={36} /> :
                                                 isVendaLoja ? <Building2 size={32} /> : i + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className={cn("text-3xl font-black tracking-tighter uppercase truncate", isTop1 ? "text-white" : "text-slate-950")}>
                                                        {r.user_name}
                                                    </h3>
                                                    {isTop1 && <Badge className="bg-amber-400 text-slate-950 font-black text-[8px] tracking-[0.2em] border-none shadow-lg">LÍDER ABSOLUTO</Badge>}
                                                </div>
                                                {!isVendaLoja ? (
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-[8px] font-black uppercase tracking-widest", isTop1 ? "text-amber-400/60" : "text-gray-400")}>Leads</span>
                                                            <span className={cn("text-sm font-bold font-mono-numbers", isTop1 ? "text-white" : "text-slate-600")}>{r.leads}</span>
                                                        </div>
                                                        <div className="w-px h-6 bg-gray-100/20" />
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-[8px] font-black uppercase tracking-widest", isTop1 ? "text-amber-400/60" : "text-gray-400")}>Visitas</span>
                                                            <span className={cn("text-sm font-bold font-mono-numbers", isTop1 ? "text-white" : "text-slate-600")}>{r.visitas}</span>
                                                        </div>
                                                        <div className="w-px h-6 bg-gray-100/20" />
                                                        <div className="flex flex-col">
                                                            <span className={cn("text-[8px] font-black uppercase tracking-widest", isTop1 ? "text-amber-400/60" : "text-gray-400")}>Eficiência</span>
                                                            <span className={cn("text-sm font-bold font-mono-numbers text-emerald-500")}>{r.atingimento}%</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Saldo Consolidado da Unidade</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "flex items-center gap-10 border-t lg:border-t-0 lg:border-l pt-8 lg:pt-0 lg:pl-10 relative z-10",
                                            isTop1 ? "border-white/10" : "border-gray-50"
                                        )}>
                                            <div className="text-right">
                                                <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", isTop1 ? "text-amber-400" : "text-indigo-600")}>VENDAS</p>
                                                <p className={cn("text-6xl font-black font-mono-numbers leading-none tracking-tighter", isTop1 ? "text-white" : "text-slate-950")}>{r.vnd_total}</p>
                                            </div>
                                            {!isVendaLoja && (
                                                <Link to={`/relatorios/performance-vendedores?id=${r.user_id}`} className={cn(
                                                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95",
                                                    isTop1 ? "bg-amber-400 text-slate-950" : "bg-slate-950 text-white"
                                                )}>
                                                    <ChevronRight size={32} strokeWidth={3} />
                                                </Link>
                                            )}
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
