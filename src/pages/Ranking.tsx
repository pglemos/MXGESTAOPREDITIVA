import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useCheckins } from '@/hooks/useCheckins'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { useState, useMemo, useCallback } from 'react'
import { 
    Trophy, Medal, Award, Crown, TrendingUp, RefreshCw, 
    ChevronRight, Search, Building2, Filter, Calendar, Zap, Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Ranking() {
    const { profile, storeId } = useAuth()
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
    const { checkins, loading: checkinsLoading, fetchCheckins } = useCheckins()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([refetchRanking(), fetchCheckins(), fetchMetaRules()])
        setIsRefetching(false)
    }, [refetchRanking, fetchCheckins, fetchMetaRules])

    const storeSales = useStoreSales({
        checkins: checkins as any,
        ranking: ranking,
        rules: metaRules as any
    })

    const sortedRanking = useMemo(() => {
        return storeSales.processedRanking.filter(r => r.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [storeSales.processedRanking, searchTerm])

    if (rankingLoading || checkinsLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Arena...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Arena Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena de <span className="text-brand-primary">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Meritocracia Real-time • MX ELITE TRACKING</Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input 
                            placeholder="BUSCAR ESPECIALISTA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-4 bg-white border border-border-default px-8 h-12 rounded-full shadow-mx-sm">
                        <Trophy size={18} className="text-status-warning" />
                        <Typography variant="caption" className="whitespace-nowrap">{sortedRanking.length} EM ARENA</Typography>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-mx-xl" aria-live="polite">
                <ol className="grid gap-mx-lg m-0 p-0 list-none">
                    <AnimatePresence mode="popLayout">
                        {sortedRanking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop1 = i === 0 && !r.is_venda_loja
                            
                            return (
                                <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className={cn(
                                        "p-8 md:p-10 flex flex-col lg:flex-row lg:items-center gap-10 border-none shadow-mx-lg transition-all",
                                        isTop1 ? "bg-brand-secondary text-white shadow-mx-xl ring-2 ring-mx-amber-400 ring-offset-4" : 
                                        isMe ? "bg-mx-indigo-50 border-2 border-brand-primary shadow-mx-sm" : "bg-white"
                                    )}>
                                        <div className="flex items-center gap-8 flex-1 min-w-0">
                                            <div className={cn(
                                                "w-20 h-20 rounded-mx-2xl border-4 flex items-center justify-center font-black text-3xl shadow-mx-lg",
                                                isTop1 ? "bg-mx-amber-400 border-mx-amber-300 text-mx-black rotate-3 scale-110" : "bg-surface-alt border-white text-text-primary"
                                            )}>
                                                {isTop1 ? <Crown size={36} fill="currentColor" /> : <span>#{i + 1}</span>}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate text-2xl md:text-3xl">{r.user_name}</Typography>
                                                    {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md">LÍDER</Badge>}
                                                    {isMe && !isTop1 && <Badge variant="brand">VOCÊ</Badge>}
                                                </div>
                                                <div className="flex items-center gap-10">
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px]">Realizado</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-2xl font-mono-numbers">{r.vnd_total} v</Typography>
                                                    </div>
                                                    <div className="w-px h-8 bg-current opacity-10" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px]">Objetivo</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-2xl font-mono-numbers">{r.meta} v</Typography>
                                                    </div>
                                                    <div className="w-px h-8 bg-current opacity-10" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px]">Ritmo</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-2xl font-mono-numbers">{r.ritmo} v/d</Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10 shrink-0">
                                            <div className="text-right">
                                                <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px] mb-1">Atingimento</Typography>
                                                <div className="flex items-center gap-2">
                                                    <Typography variant="h1" tone={isTop1 ? 'white' : 'brand'} className="text-5xl font-mono-numbers tracking-tighter leading-none">{r.atingimento}%</Typography>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-16 h-16 rounded-mx-2xl flex items-center justify-center border shadow-inner",
                                                isTop1 ? "bg-white/10 border-white/20 text-white" : "bg-surface-alt border-border-default text-brand-primary"
                                            )}>
                                                <TrendingUp size={28} className={cn(r.atingimento < 50 && "rotate-180 text-status-error")} />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.li>
                            )
                        })}
                    </AnimatePresence>
                </ol>
            </div>
        </main>
    )
}
