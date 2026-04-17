import { useRanking, useGlobalRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useCheckins } from '@/hooks/useCheckins'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { useState, useMemo, useCallback } from 'react'
import { 
    Trophy, Crown, TrendingUp, RefreshCw, 
    Search, Building2, Calendar, Zap, Target,
    Phone, Users, CheckCircle2, XCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'

export default function Ranking() {
    const { role } = useAuth()
    if (role === 'admin') return <GlobalRanking />
    return <StoreRankingView />
}

function GlobalRanking() {
    const { ranking, loading, refetch } = useGlobalRanking()
    const { profile } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [filterStore, setFilterStore] = useState<string>('all')

    const stores = useMemo(() => {
        const set = new Set(ranking.map(r => r.store_name).filter(Boolean))
        return Array.from(set).sort()
    }, [ranking])

    const filtered = useMemo(() => {
        let list = ranking
        if (filterStore !== 'all') list = list.filter(r => r.store_name === filterStore)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            list = list.filter(r => r.user_name.toLowerCase().includes(term) || (r.store_name || '').toLowerCase().includes(term))
        }
        return list
    }, [ranking, searchTerm, filterStore])

    const totalVendedores = useMemo(() => ranking.filter(r => !r.is_venda_loja).length, [ranking])
    const totalVendas = useMemo(() => ranking.reduce((acc, r) => acc + r.vnd_total, 0), [ranking])
    const totalLeads = useMemo(() => ranking.reduce((acc, r) => acc + r.leads, 0), [ranking])
    const totalAgd = useMemo(() => ranking.reduce((acc, r) => acc + r.agd_total, 0), [ranking])
    const totalVis = useMemo(() => ranking.reduce((acc, r) => acc + r.visitas, 0), [ranking])
    const checkinRate = useMemo(() => {
        const sellers = ranking.filter(r => !r.is_venda_loja)
        if (sellers.length === 0) return 0
        return Math.round((sellers.filter(r => r.checked_in).length / sellers.length) * 100)
    }, [ranking])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
    }, [refetch])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Arena Global...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena <span className="text-mx-green-700">Global</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">
                        {stores.length} UNIDADES • {totalVendedores} VENDEDORES • MERITOCRACIA EM TEMPO REAL
                    </Typography>
                </div>
                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-mx-xs bg-white border border-border-default px-6 h-mx-xl rounded-mx-full shadow-mx-sm">
                        <Trophy size={18} className="text-status-warning shrink-0" />
                        <Typography variant="caption" className="whitespace-nowrap uppercase font-black text-mx-micro">{filtered.filter(r => !r.is_venda_loja).length} EM DISPUTA</Typography>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-mx-md shrink-0">
                {[
                    { label: 'Vendas Rede', value: totalVendas, icon: Zap, tone: 'brand' as const },
                    { label: 'Leads', value: totalLeads, icon: Phone, tone: 'info' as const },
                    { label: 'Agendamentos', value: totalAgd, icon: Calendar, tone: 'warning' as const },
                    { label: 'Visitas', value: totalVis, icon: Users, tone: 'success' as const },
                    { label: 'Check-in Hoje', value: `${checkinRate}%`, icon: checkinRate >= 80 ? CheckCircle2 : XCircle, tone: checkinRate >= 80 ? 'success' : 'danger' },
                    { label: 'Vendedores', value: totalVendedores, icon: Target, tone: 'info' as const },
                ].map((stat) => (
                    <Card key={stat.label} className="p-mx-md border-none shadow-mx-sm bg-white flex items-center gap-mx-sm">
                        <div className={cn(
                            "w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shrink-0",
                            stat.tone === 'brand' ? 'bg-mx-green-50 border-mx-green-200 text-mx-green-700' :
                            stat.tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                            stat.tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                            stat.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                            'bg-status-error-surface border-mx-rose-100 text-status-error'
                        )}>
                            <stat.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                            <Typography variant="tiny" tone="muted" className="uppercase block truncate">{stat.label}</Typography>
                            <Typography variant="h2" className="text-xl tabular-nums leading-none">{stat.value}</Typography>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-mx-sm shrink-0">
                <div className="relative group flex-1">
                    <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                    <Input
                        placeholder="LOCALIZAR VENDEDOR OU LOJA..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
                    />
                </div>
                <div className="flex items-center gap-mx-xs bg-white border border-border-default px-4 h-mx-14 sm:h-12 rounded-mx-md shadow-inner overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setFilterStore('all')}
                        className={cn(
                            "px-3 py-1 rounded-mx-sm text-mx-tiny font-black uppercase tracking-widest whitespace-nowrap transition-colors",
                            filterStore === 'all' ? 'bg-brand-primary text-white' : 'text-text-tertiary hover:bg-surface-alt'
                        )}
                    >Todas</button>
                    {stores.map(store => (
                        <button
                            key={store}
                            type="button"
                            onClick={() => setFilterStore(store === filterStore ? 'all' : (store || 'all'))}
                            className={cn(
                                "px-3 py-1 rounded-mx-sm text-mx-tiny font-black uppercase tracking-widest whitespace-nowrap transition-colors",
                                filterStore === store ? 'bg-brand-primary text-white' : 'text-text-tertiary hover:bg-surface-alt'
                            )}
                        >{store}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <ol className="grid gap-mx-md m-mx-0 p-mx-0 list-none">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop1 = i === 0 && !r.is_venda_loja
                            if (r.is_venda_loja) return null

                            return (
                                <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className={cn(
                                        "p-mx-md flex items-center gap-mx-md border-none shadow-mx-sm transition-all relative overflow-hidden",
                                        isTop1 ? "bg-brand-secondary text-white shadow-mx-xl ring-2 ring-mx-amber-400 ring-offset-4" :
                                        isMe ? "bg-mx-indigo-50 border-2 border-brand-primary" : "bg-white"
                                    )}>
                                        <div className={cn(
                                            "w-mx-14 h-mx-14 rounded-mx-2xl border-4 flex items-center justify-center font-black text-xl shadow-mx-lg shrink-0",
                                            isTop1 ? "bg-mx-amber-400 border-mx-amber-300 text-mx-black rotate-3 scale-110" : "bg-surface-alt border-white text-text-primary"
                                        )}>
                                            {isTop1 ? <Crown size={32} fill="currentColor" /> : <span>#{r.position}</span>}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-mx-sm mb-mx-xs">
                                                <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate text-base font-black uppercase tracking-tight">{r.user_name}</Typography>
                                                {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md text-mx-nano">LÍDER</Badge>}
                                                {isMe && !isTop1 && <Badge variant="brand" className="text-mx-nano">VOCÊ</Badge>}
                                            </div>
                                            <div className="flex items-center gap-mx-xs mb-mx-xs">
                                                <Building2 size={12} className="text-text-tertiary shrink-0" />
                                                <Typography variant="tiny" tone="muted" className="truncate uppercase">{r.store_name}</Typography>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-mx-md">
                                                <div className="flex flex-col">
                                                    <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="uppercase text-mx-micro">Vendas</Typography>
                                                    <Typography variant="p" tone={isTop1 ? 'white' : 'default'} className="font-mono-numbers font-black">{r.vnd_total}</Typography>
                                                </div>
                                                <div className="flex flex-col">
                                                    <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="uppercase text-mx-micro">Leads</Typography>
                                                    <Typography variant="p" tone={isTop1 ? 'white' : 'default'} className="font-mono-numbers font-black">{r.leads}</Typography>
                                                </div>
                                                <div className="flex flex-col">
                                                    <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="uppercase text-mx-micro">Agd</Typography>
                                                    <Typography variant="p" tone={isTop1 ? 'white' : 'default'} className="font-mono-numbers font-black">{r.agd_total}</Typography>
                                                </div>
                                                <div className="flex flex-col">
                                                    <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="uppercase text-mx-micro">Visitas</Typography>
                                                    <Typography variant="p" tone={isTop1 ? 'white' : 'default'} className="font-mono-numbers font-black">{r.visitas}</Typography>
                                                </div>
                                                <div className="flex flex-col">
                                                    <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="uppercase text-mx-micro">Check-in</Typography>
                                                    <div className="flex items-center gap-mx-xs">
                                                        {r.checked_in
                                                            ? <CheckCircle2 size={14} className="text-status-success" />
                                                            : <XCircle size={14} className="text-status-error" />
                                                        }
                                                        <Typography variant="tiny" className={cn("font-black", r.checked_in ? "text-status-success" : "text-status-error")}>
                                                            {r.checked_in ? 'OK' : 'Falta'}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-mx-lg shrink-0">
                                            <div className="text-right">
                                                <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="uppercase text-mx-micro">Atingimento</Typography>
                                                <Typography variant="h1" tone={isTop1 ? 'white' : 'brand'} className="text-3xl font-mono-numbers tracking-tighter leading-none font-black">{r.atingimento}%</Typography>
                                            </div>
                                            <div className={cn(
                                                "w-mx-2xl h-mx-2xl rounded-mx-2xl flex items-center justify-center border shadow-inner shrink-0",
                                                isTop1 ? "bg-white/10 border-white/20 text-white" : "bg-surface-alt border-border-default text-brand-primary"
                                            )}>
                                                <TrendingUp size={24} className={cn(r.atingimento < 50 && "rotate-180 text-status-error")} />
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

function StoreRankingView() {
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
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena de <span className="text-mx-green-700">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">Meritocracia Real-time • MX ELITE TRACKING</Typography>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
                    <div className="relative group w-full sm:w-mx-sidebar-expanded order-2 sm:order-none">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            placeholder="LOCALIZAR VENDEDOR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
                        />
                    </div>
                    <div className="flex items-center gap-mx-sm w-full sm:w-auto order-1 sm:order-none">
                        <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
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
                                        "p-mx-lg md:p-10 flex flex-col lg:flex-row lg:items-center gap-mx-md lg:gap-mx-10 border-none shadow-mx-lg transition-all relative overflow-hidden",
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
                                                    {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md px-3 text-mx-nano sm:text-xs">LÍDER</Badge>}
                                                    {isMe && !isTop1 && <Badge variant="brand" className="px-3 text-mx-nano sm:text-xs">VOCÊ</Badge>}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-mx-md sm:gap-mx-10">
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="uppercase tracking-widest font-black text-mx-nano sm:text-mx-micro">Vendas</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-lg sm:text-2xl font-mono-numbers">{r.vnd_total} v</Typography>
                                                    </div>
                                                    <div className="w-px h-mx-lg bg-current opacity-10 hidden sm:block" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="uppercase tracking-widest font-black text-mx-nano sm:text-mx-micro">Objetivo</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-lg sm:text-2xl font-mono-numbers">{r.meta} v</Typography>
                                                    </div>
                                                    <div className="w-px h-mx-lg bg-current opacity-10 hidden sm:block" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="uppercase tracking-widest font-black text-mx-nano sm:text-mx-micro">Ritmo</Typography>
                                                        <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="text-lg sm:text-2xl font-mono-numbers">{r.ritmo} v/d</Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-mx-lg lg:gap-mx-10 shrink-0 mt-6 lg:mt-0 border-t lg:border-none border-current border-opacity-10 pt-6 lg:pt-0">
                                            <div className="text-left lg:text-right">
                                                <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="uppercase tracking-widest font-black text-mx-micro mb-1">Atingimento</Typography>
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
