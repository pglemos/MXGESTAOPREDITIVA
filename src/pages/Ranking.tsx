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
        return (storeSales.processedRanking || []).filter(r => r.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [storeSales.processedRanking, searchTerm])

    if (rankingLoading || checkinsLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Arena...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena de <span className="text-brand-primary">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">Meritocracia Real-time • MX ELITE TRACKING</Typography>
                </div>
                
                <div className="flex flex-wrap flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
                    <div className="relative group w-full sm:w-mx-sidebar-expanded order-2 sm:order-none">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input 
                            placeholder="LOCALIZAR VENDEDOR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
                        />
                    </div>
                    <div className="flex items-center gap-mx-sm w-full sm:w-auto order-1 sm:order-none">
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                        <div className="flex-1 sm:flex-none flex items-center justify-center gap-mx-sm bg-white border border-border-default px-6 h-mx-xl rounded-mx-full shadow-mx-sm">
                            <Trophy size={18} className="text-status-warning shrink-0" />
                            <Typography variant="caption" className="whitespace-nowrap uppercase font-black text-mx-micro">{sortedRanking.length} EM DISPUTA</Typography>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <ol className="grid gap-mx-lg m-mx-0 p-mx-0 list-none">
                    <AnimatePresence mode="popLayout">
                        {sortedRanking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop1 = i === 0 && !r.is_venda_loja
                            
                            return (
                                <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className={cn(
                                        "p-4 md:p-mx-lg md:p-10 flex flex-col lg:flex-row lg:items-center gap-mx-md lg:gap-mx-10 border-none shadow-mx-lg transition-all relative overflow-hidden",
                                        isTop1 ? "bg-brand-secondary text-white shadow-mx-xl ring-2 ring-mx-amber-400 ring-offset-4" : 
                                        isMe ? "bg-mx-indigo-50 border-2 border-brand-primary shadow-mx-sm" : "bg-white"
                                    )}>
                                        <div className="flex items-center gap-mx-lg flex-1 min-w-0">
                                            <div className={cn(
                                                "w-mx-14 h-mx-14 sm:w-mx-20 sm:h-mx-header rounded-mx-2xl border-4 flex items-center justify-center font-black text-xl sm:text-3xl shadow-mx-lg shrink-0",
                                                isTop1 ? "bg-mx-amber-400 border-mx-amber-300 text-mx-black rotate-3 scale-110" : "bg-surface-alt border-white text-text-primary"
                                            )}>
                                                {isTop1 ? <Crown size={32} fill="currentColor" /> : <span>#{i + 1}</span>}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-mx-xs">
                                                <div className="flex items-center gap-mx-sm">
                                                    <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">{r.user_name}</Typography>
                                                    {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md px-3 text-[8px] sm:text-xs">LÍDER</Badge>}
                                                    {isMe && !isTop1 && <Badge variant="brand" className="px-3 text-[8px] sm:text-xs">VOCÊ</Badge>}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-mx-md sm:gap-mx-10">
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px] sm:text-mx-micro">Realizado</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-lg sm:text-2xl font-mono-numbers">{r.vnd_total} v</Typography>
                                                    </div>
                                                    <div className="w-px h-mx-lg bg-current opacity-10 hidden sm:block" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px] sm:text-mx-micro">Objetivo</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-lg sm:text-2xl font-mono-numbers">{r.meta} v</Typography>
                                                    </div>
                                                    <div className="w-px h-mx-lg bg-current opacity-10 hidden sm:block" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-[8px] sm:text-mx-micro">Ritmo</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-lg sm:text-2xl font-mono-numbers">{r.ritmo} v/d</Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-mx-lg lg:gap-mx-10 shrink-0 mt-6 lg:mt-0 border-t lg:border-none border-current border-opacity-10 pt-6 lg:pt-0">
                                            <div className="text-left lg:text-right">
                                                <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="opacity-40 uppercase tracking-widest font-black text-mx-micro mb-1">Atingimento</Typography>
                                                <Typography variant="h1" tone={isTop1 ? 'white' : 'brand'} className="text-4xl sm:text-5xl font-mono-numbers tracking-tighter leading-none font-black">{r.atingimento}%</Typography>
                                            </div>
                                            <div className={cn(
                                                "w-mx-2xl h-mx-2xl rounded-mx-2xl flex items-center justify-center border shadow-inner shrink-0",
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
