import { useRanking, useGlobalRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useCheckins } from '@/hooks/useCheckins'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { useState, useMemo, useCallback } from 'react'
import { 
    Trophy, Crown, TrendingUp, RefreshCw, 
    Search, Building2, Calendar, Zap, Target,
    Phone, Users, CheckCircle2, XCircle,
    Flame, Swords, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'

// New components
import { LiveFloor } from '@/features/ranking/components/LiveFloor'
import { BattleView } from '@/features/ranking/components/BattleView'
import { SellerProfileModal } from '@/features/ranking/components/SellerProfileModal'

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
    const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'leaderboard' | 'battle' | 'live'>('leaderboard')
    const [battleOpponents, setBattleOpponents] = useState<string[]>([])

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
        return list.filter(r => !r.is_venda_loja) // Exclude venda loja for actual ranking
    }, [ranking, searchTerm, filterStore])

    // Podium 
    const top3 = [...filtered].sort((a, b) => a.position - b.position).slice(0, 3)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

    const toggleOpponent = (id: string) => {
        if (battleOpponents.includes(id)) {
            setBattleOpponents(prev => prev.filter(oid => oid !== id))
        } else {
            if (battleOpponents.length < 2) setBattleOpponents(prev => [...prev, id])
            else setBattleOpponents([battleOpponents[0], id])
        }
    }

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
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena <span className="text-mx-green-700">Global</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">
                        {stores.length} UNIDADES • {totalVendedores} VENDEDORES • MERITOCRACIA EM TEMPO REAL
                    </Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
                    <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar bg-white/40 p-1.5 rounded-2xl border border-white/60 shadow-glass backdrop-blur-md mr-0 sm:mr-4">
                        <button onClick={() => setViewMode('leaderboard')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'leaderboard' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
                            <Trophy size={14} /> Ranking
                        </button>
                        <button onClick={() => setViewMode('live')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'live' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
                            <div className="w-mx-xs h-mx-xs rounded-full bg-status-success animate-pulse" /> Live Floor
                        </button>
                        <button onClick={() => setViewMode('battle')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'battle' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
                            <Swords size={14} /> Arena X1
                        </button>
                    </div>

                    <div className="flex items-center gap-mx-sm w-full sm:w-auto order-1 sm:order-none">
                        <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                        <div className="flex-1 sm:flex-none flex items-center justify-center gap-mx-sm bg-white border border-border-default px-6 h-mx-xl rounded-mx-full shadow-mx-sm">
                            <Trophy size={18} className="text-status-warning shrink-0" />
                            <Typography variant="caption" className="whitespace-nowrap uppercase font-black text-mx-micro">{filtered.length} EM DISPUTA</Typography>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-mx-md shrink-0 mb-4">
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

            <div className="flex flex-col sm:flex-row gap-mx-sm shrink-0 mb-6">
                <div className="relative group flex-1">
                    <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                    <Input
                        placeholder="LOCALIZAR VENDEDOR OU LOJA..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="!pl-11 !h-mx-14 !text-mx-tiny uppercase tracking-widest font-black"
                    />
                </div>
                <div className="flex items-center gap-mx-xs bg-white border border-border-default px-4 h-mx-14 sm:h-mx-14 rounded-mx-md shadow-inner overflow-x-auto no-scrollbar">
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
                                filterStore === store ? 'bg-brand-primary text-mx-black' : 'text-text-tertiary hover:bg-surface-alt'
                            )}
                        >{store}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {viewMode === 'live' && <LiveFloor ranking={filtered} />}

                {viewMode === 'battle' && (
                    <div className="animate-slide-up">
                        {battleOpponents.length < 2 && (
                             <div className="mb-8 text-center animate-pulse">
                                 <p className="text-sm font-bold text-text-tertiary bg-white/50 inline-block px-4 py-2 rounded-full border border-white/60 shadow-sm">
                                     Selecione {2 - battleOpponents.length} {2 - battleOpponents.length === 1 ? 'vendedor' : 'vendedores'} abaixo para iniciar o X1
                                 </p>
                             </div>
                        )}
                        
                        <div className="relative mb-10">
                             {battleOpponents.length > 0 && (
                                <button onClick={() => setBattleOpponents([])} className="absolute top-mx-0 right-mx-0 z-50 p-mx-xs bg-white/10 text-text-tertiary hover:text-status-error hover:bg-status-error-surface rounded-full transition-colors">
                                    <X className="w-mx-sm h-mx-sm" />
                                </button>
                             )}
                             <BattleView opponents={battleOpponents} ranking={filtered} />
                        </div>

                        <h3 className="font-display font-bold text-lg text-mx-black mb-4 px-2">Escolha os Combatentes</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-mx-md">
                            {filtered.map(seller => {
                                const selected = battleOpponents.includes(seller.user_id)
                                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random`
                                return (
                                    <button 
                                        key={seller.user_id}
                                        onClick={() => toggleOpponent(seller.user_id)}
                                        className={`p-mx-md rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-mx-sm relative overflow-hidden group active:scale-95
                                            ${selected ? 'bg-mx-black border-brand-primary shadow-xl scale-105' : 'bg-white/40 border-white/40 hover:bg-white hover:border-white'}`}
                                    >
                                        <img src={avatar} alt="" className={`w-mx-14 h-mx-14 rounded-full object-cover border-2 shadow-sm ${selected ? 'border-brand-primary' : 'border-white'}`} />
                                        <span className={`font-bold text-xs ${selected ? 'text-white' : 'text-mx-black'} truncate w-full`}>{seller.user_name}</span>
                                        <span className="text-mx-micro text-text-tertiary truncate w-full">{seller.store_name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'leaderboard' && (
                    <div className="space-y-mx-xl animate-slide-up">
                        {/* PODIUM */}
                        <div className="flex justify-center items-end gap-mx-sm sm:gap-mx-xl relative pt-4 min-h-mx-64">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-mx-64 bg-brand-primary/10 blur-mx-huge rounded-full pointer-events-none"></div>

                            {podiumOrder.map((seller) => {
                                const isFirst = seller.position === 1
                                const isSecond = seller.position === 2
                                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random`
                                
                                return (
                                    <div key={seller.user_id} onClick={() => setSelectedSeller(seller.user_id)} className={`flex flex-col items-center group cursor-pointer transition-transform duration-500 hover:-translate-y-2 z-10 ${isFirst ? '-mb-4 sm:-mb-0' : ''}`}>
                                        <div className="relative mb-3 flex flex-col items-center">
                                            {isFirst && <Crown className="w-mx-lg h-mx-lg text-status-warning mb-2 animate-bounce drop-shadow-lg" />}
                                            <div className={`rounded-full p-mx-tiny transition-all ${isFirst ? 'bg-gradient-to-br from-brand-primary to-status-warning shadow-mx-glow-brand' : 'bg-white shadow-xl'}`}>
                                                <img src={avatar} alt="" className={`rounded-full object-cover border-4 border-mx-black ${isFirst ? 'w-mx-20 h-mx-20 sm:w-mx-32 sm:h-mx-32' : isSecond ? 'w-mx-20 h-mx-20 sm:w-mx-20 sm:h-mx-20' : 'w-mx-14 h-mx-14 sm:w-mx-20 sm:h-mx-20'}`} />
                                            </div>
                                            <div className={`absolute -bottom-3 px-3 py-1 rounded-full text-mx-micro font-black uppercase tracking-wider shadow-lg border border-white/20 whitespace-nowrap z-20 ${isFirst ? 'bg-mx-black text-brand-primary' : 'bg-surface-alt text-text-primary'}`}>
                                                {isFirst ? 'Campeão' : `#${seller.position} Lugar`}
                                            </div>
                                        </div>
                                        <div className={`w-mx-20 sm:w-mx-32 rounded-t-2xl backdrop-blur-md border-x border-t border-white/30 flex flex-col items-center justify-end pb-4 shadow-2xl relative overflow-hidden transition-all duration-700
                                            ${isFirst ? 'h-mx-64 bg-gradient-to-b from-brand-primary/80 to-brand-primary/5' : isSecond ? 'h-mx-48 bg-gradient-to-b from-border-strong/80 to-surface-alt/10' : 'h-mx-32 bg-gradient-to-b from-amber-700/60 to-amber-900/10'}`}>
                                            <div className={`font-display font-black text-2xl sm:text-3xl mb-1 drop-shadow-sm ${isFirst ? 'text-mx-black' : 'text-text-primary'}`}>{seller.atingimento}%</div>
                                            <div className={`text-mx-nano sm:text-mx-micro uppercase font-bold tracking-widest ${isFirst ? 'text-brand-secondary' : 'text-text-tertiary'}`}>ATINGIMENTO</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* LIST */}
                        <ol className="grid gap-mx-lg m-mx-0 p-mx-0 list-none">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((r, i) => {
                                    const isMe = r.user_id === profile?.id
                                    const isTop1 = r.position === 1
                                    const isBattleSelected = battleOpponents.includes(r.user_id)

                                    return (
                                        <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                                            onClick={() => setSelectedSeller(r.user_id)} className="cursor-pointer hover:scale-[1.01] transition-transform"
                                        >
                                            <Card className={cn(
                                                "p-mx-lg md:p-mx-xl flex flex-col lg:flex-row lg:items-center gap-mx-md lg:gap-mx-10 border-none shadow-mx-lg transition-all relative overflow-hidden",
                                                isTop1 ? "bg-brand-secondary text-white shadow-mx-xl ring-2 ring-mx-amber-400 ring-offset-4" :
                                                isMe ? "bg-mx-indigo-50 border-2 border-brand-primary shadow-mx-sm" : "bg-white"
                                            )}>
                                                <div className="flex items-center gap-mx-lg flex-1 min-w-0">
                                                    <div className={cn(
                                                        "w-mx-14 h-mx-14 sm:w-mx-20 sm:h-mx-header rounded-mx-2xl border-4 flex items-center justify-center font-black text-xl sm:text-3xl shadow-mx-lg shrink-0",
                                                        isTop1 ? "bg-mx-amber-400 border-mx-amber-300 text-mx-black rotate-3 scale-110" : "bg-surface-alt border-white text-text-primary"
                                                    )}>
                                                        {isTop1 ? <Crown size={32} fill="currentColor" /> : <span>#{r.position}</span>}
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-mx-xs">
                                                        <div className="flex items-center gap-mx-sm">
                                                            <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">{r.user_name}</Typography>
                                                            {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md px-3 text-mx-nano sm:text-xs">LÍDER</Badge>}
                                                            {r.atingimento >= 100 && !isTop1 && <Badge variant="danger" className="px-3 text-mx-nano sm:text-xs"><Flame size={12} className="mr-1 inline-block"/> ON FIRE</Badge>}
                                                            {isMe && !isTop1 && <Badge variant="brand" className="px-3 text-mx-nano sm:text-xs">VOCÊ</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-mx-xs mb-mx-xs">
                                                            <Building2 size={12} className={cn("shrink-0", isTop1 ? 'text-white/60' : 'text-text-tertiary')} />
                                                            <Typography variant="tiny" tone={isTop1 ? 'white' : 'muted'} className="truncate uppercase font-bold">{r.store_name}</Typography>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-mx-md sm:gap-mx-10 pt-2">
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
                                                        <div className="flex items-center gap-mx-sm">
                                                            <Typography variant="h1" tone={isTop1 ? 'white' : 'brand'} className="text-4xl sm:text-5xl font-mono-numbers tracking-tighter leading-none font-black">{r.atingimento}%</Typography>
                                                            <div className={cn(
                                                                "w-mx-2xl h-mx-2xl rounded-mx-2xl flex items-center justify-center border shadow-inner shrink-0",
                                                                isTop1 ? "bg-white/10 border-white/20 text-white" : "bg-surface-alt border-border-default text-brand-primary"
                                                            )}>
                                                                <TrendingUp size={28} className={cn(r.atingimento < 50 && "rotate-180 text-status-error")} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); toggleOpponent(r.user_id); setViewMode('battle') }}
                                                      className={`ml-4 p-mx-sm rounded-xl transition-all border group/btn hover:scale-110 active:scale-95 ${isBattleSelected ? 'bg-brand-primary border-brand-primary text-mx-black shadow-mx-glow-brand' : 'bg-surface-alt border-border-default text-text-tertiary hover:border-brand-primary hover:text-brand-primary'}`}
                                                      title="Desafiar para X1"
                                                    >
                                                        <Swords className="w-mx-sm h-mx-sm" />
                                                    </button>
                                                </div>
                                            </Card>
                                        </motion.li>
                                    )
                                })}
                            </AnimatePresence>
                        </ol>
                    </div>
                )}
            </div>

            {selectedSeller && (
                <SellerProfileModal 
                    seller={filtered.find(s => s.user_id === selectedSeller)!} 
                    onClose={() => setSelectedSeller(null)} 
                />
            )}
        </main>
    )
}


function StoreRankingView() {
    const { profile } = useAuth()
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
    const { checkins, loading: checkinsLoading, fetchCheckins } = useCheckins()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    
    const [viewMode, setViewMode] = useState<'leaderboard' | 'battle' | 'live'>('leaderboard')
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [selectedSeller, setSelectedSeller] = useState<string | null>(null)
    const [battleOpponents, setBattleOpponents] = useState<string[]>([])

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
        return (storeSales.processedRanking || []).filter(r => r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) && !r.is_venda_loja)
    }, [storeSales.processedRanking, searchTerm])

    // Podium 
    const top3 = [...sortedRanking].sort((a, b) => a.position - b.position).slice(0, 3)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)

    const toggleOpponent = (id: string) => {
        if (battleOpponents.includes(id)) {
            setBattleOpponents(prev => prev.filter(oid => oid !== id))
        } else {
            if (battleOpponents.length < 2) setBattleOpponents(prev => [...prev, id])
            else setBattleOpponents([battleOpponents[0], id])
        }
    }

    if (rankingLoading || checkinsLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Arena...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena de <span className="text-mx-green-700">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">Meritocracia Real-time • MX ELITE TRACKING</Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
                    <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar bg-white/40 p-1.5 rounded-2xl border border-white/60 shadow-glass backdrop-blur-md mr-0 sm:mr-4">
                        <button onClick={() => setViewMode('leaderboard')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'leaderboard' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
                            <Trophy size={14} /> Ranking
                        </button>
                        <button onClick={() => setViewMode('live')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'live' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
                            <div className="w-mx-xs h-mx-xs rounded-full bg-status-success animate-pulse" /> Live Floor
                        </button>
                        <button onClick={() => setViewMode('battle')} className={cn("px-4 py-2 rounded-xl text-mx-tiny font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap gap-mx-xs", viewMode === 'battle' ? 'bg-mx-black text-brand-primary shadow-lg' : 'text-text-tertiary hover:bg-white/60')}>
                            <Swords size={14} /> Arena X1
                        </button>
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
                {viewMode === 'live' && <LiveFloor ranking={sortedRanking} />}

                {viewMode === 'battle' && (
                    <div className="animate-slide-up">
                        {battleOpponents.length < 2 && (
                             <div className="mb-8 text-center animate-pulse">
                                 <p className="text-sm font-bold text-text-tertiary bg-white/50 inline-block px-4 py-2 rounded-full border border-white/60 shadow-sm">
                                     Selecione {2 - battleOpponents.length} {2 - battleOpponents.length === 1 ? 'vendedor' : 'vendedores'} abaixo para iniciar o X1
                                 </p>
                             </div>
                        )}
                        
                        <div className="relative mb-10">
                             {battleOpponents.length > 0 && (
                                <button onClick={() => setBattleOpponents([])} className="absolute top-mx-0 right-mx-0 z-50 p-mx-xs bg-white/10 text-text-tertiary hover:text-status-error hover:bg-status-error-surface rounded-full transition-colors">
                                    <X className="w-mx-sm h-mx-sm" />
                                </button>
                             )}
                             <BattleView opponents={battleOpponents} ranking={sortedRanking} />
                        </div>

                        <h3 className="font-display font-bold text-lg text-mx-black mb-4 px-2">Escolha os Combatentes</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-mx-md">
                            {sortedRanking.map(seller => {
                                const selected = battleOpponents.includes(seller.user_id)
                                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random`
                                return (
                                    <button 
                                        key={seller.user_id}
                                        onClick={() => toggleOpponent(seller.user_id)}
                                        className={`p-mx-md rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-mx-sm relative overflow-hidden group active:scale-95
                                            ${selected ? 'bg-mx-black border-brand-primary shadow-xl scale-105' : 'bg-white/40 border-white/40 hover:bg-white hover:border-white'}`}
                                    >
                                        <img src={avatar} alt="" className={`w-mx-14 h-mx-14 rounded-full object-cover border-2 shadow-sm ${selected ? 'border-brand-primary' : 'border-white'}`} />
                                        <span className={`font-bold text-xs ${selected ? 'text-white' : 'text-mx-black'}`}>{seller.user_name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'leaderboard' && (
                    <div className="space-y-mx-xl animate-slide-up">
                        {/* PODIUM */}
                        <div className="flex justify-center items-end gap-mx-sm sm:gap-mx-xl relative pt-4 min-h-mx-64">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-mx-64 bg-brand-primary/10 blur-mx-huge rounded-full pointer-events-none"></div>

                            {podiumOrder.map((seller) => {
                                const isFirst = seller.position === 1
                                const isSecond = seller.position === 2
                                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random`
                                
                                return (
                                    <div key={seller.user_id} onClick={() => setSelectedSeller(seller.user_id)} className={`flex flex-col items-center group cursor-pointer transition-transform duration-500 hover:-translate-y-2 z-10 ${isFirst ? '-mb-4 sm:-mb-0' : ''}`}>
                                        <div className="relative mb-3 flex flex-col items-center">
                                            {isFirst && <Crown className="w-mx-lg h-mx-lg text-status-warning mb-2 animate-bounce drop-shadow-lg" />}
                                            <div className={`rounded-full p-mx-tiny transition-all ${isFirst ? 'bg-gradient-to-br from-brand-primary to-status-warning shadow-mx-glow-brand' : 'bg-white shadow-xl'}`}>
                                                <img src={avatar} alt="" className={`rounded-full object-cover border-4 border-mx-black ${isFirst ? 'w-mx-20 h-mx-20 sm:w-mx-32 sm:h-mx-32' : isSecond ? 'w-mx-20 h-mx-20 sm:w-mx-20 sm:h-mx-20' : 'w-mx-14 h-mx-14 sm:w-mx-20 sm:h-mx-20'}`} />
                                            </div>
                                            <div className={`absolute -bottom-3 px-3 py-1 rounded-full text-mx-micro font-black uppercase tracking-wider shadow-lg border border-white/20 whitespace-nowrap z-20 ${isFirst ? 'bg-mx-black text-brand-primary' : 'bg-surface-alt text-text-primary'}`}>
                                                {isFirst ? 'Campeão' : `#${seller.position} Lugar`}
                                            </div>
                                        </div>
                                        <div className={`w-mx-20 sm:w-mx-32 rounded-t-2xl backdrop-blur-md border-x border-t border-white/30 flex flex-col items-center justify-end pb-4 shadow-2xl relative overflow-hidden transition-all duration-700
                                            ${isFirst ? 'h-mx-64 bg-gradient-to-b from-brand-primary/80 to-brand-primary/5' : isSecond ? 'h-mx-48 bg-gradient-to-b from-border-strong/80 to-surface-alt/10' : 'h-mx-32 bg-gradient-to-b from-amber-700/60 to-amber-900/10'}`}>
                                            <div className={`font-display font-black text-2xl sm:text-3xl mb-1 drop-shadow-sm ${isFirst ? 'text-mx-black' : 'text-text-primary'}`}>{seller.atingimento}%</div>
                                            <div className={`text-mx-nano sm:text-mx-micro uppercase font-bold tracking-widest ${isFirst ? 'text-brand-secondary' : 'text-text-tertiary'}`}>ATINGIMENTO</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* LIST */}
                        <div className="relative group w-full max-w-sm mb-4">
                            <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                            <Input placeholder="LOCALIZAR VENDEDOR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="!pl-11 !h-mx-14 !text-mx-tiny uppercase tracking-widest font-black" />
                        </div>

                        <ol className="grid gap-mx-lg m-mx-0 p-mx-0 list-none">
                            <AnimatePresence mode="popLayout">
                                {sortedRanking.map((r, i) => {
                                    const isMe = r.user_id === profile?.id
                                    const isTop1 = r.position === 1
                                    const isBattleSelected = battleOpponents.includes(r.user_id)

                                    return (
                                        <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                                            onClick={() => setSelectedSeller(r.user_id)} className="cursor-pointer hover:scale-[1.01] transition-transform"
                                        >
                                            <Card className={cn(
                                                "p-mx-lg md:p-mx-xl flex flex-col lg:flex-row lg:items-center gap-mx-md lg:gap-mx-10 border-none shadow-mx-lg transition-all relative overflow-hidden",
                                                isTop1 ? "bg-brand-secondary text-white shadow-mx-xl ring-2 ring-mx-amber-400 ring-offset-4" :
                                                isMe ? "bg-mx-indigo-50 border-2 border-brand-primary shadow-mx-sm" : "bg-white"
                                            )}>
                                                <div className="flex items-center gap-mx-lg flex-1 min-w-0">
                                                    <div className={cn(
                                                        "w-mx-14 h-mx-14 sm:w-mx-20 sm:h-mx-header rounded-mx-2xl border-4 flex items-center justify-center font-black text-xl sm:text-3xl shadow-mx-lg shrink-0",
                                                        isTop1 ? "bg-mx-amber-400 border-mx-amber-300 text-mx-black rotate-3 scale-110" : "bg-surface-alt border-white text-text-primary"
                                                    )}>
                                                        {isTop1 ? <Crown size={32} fill="currentColor" /> : <span>#{r.position}</span>}
                                                    </div>
                                                    <div className="min-w-0 flex-1 space-y-mx-xs">
                                                        <div className="flex items-center gap-mx-sm">
                                                            <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">{r.user_name}</Typography>
                                                            {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md px-3 text-mx-nano sm:text-xs">LÍDER</Badge>}
                                                            {r.atingimento >= 100 && !isTop1 && <Badge variant="danger" className="px-3 text-mx-nano sm:text-xs"><Flame size={12} className="mr-1 inline-block"/> ON FIRE</Badge>}
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
                                                        <div className="flex items-center gap-mx-sm">
                                                            <Typography variant="h1" tone={isTop1 ? 'white' : 'brand'} className="text-4xl sm:text-5xl font-mono-numbers tracking-tighter leading-none font-black">{r.atingimento}%</Typography>
                                                            <div className={cn(
                                                                "w-mx-2xl h-mx-2xl rounded-mx-2xl flex items-center justify-center border shadow-inner shrink-0",
                                                                isTop1 ? "bg-white/10 border-white/20 text-white" : "bg-surface-alt border-border-default text-brand-primary"
                                                            )}>
                                                                <TrendingUp size={28} className={cn(r.atingimento < 50 && "rotate-180 text-status-error")} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); toggleOpponent(r.user_id); setViewMode('battle') }}
                                                      className={`ml-4 p-mx-sm rounded-xl transition-all border group/btn hover:scale-110 active:scale-95 ${isBattleSelected ? 'bg-brand-primary border-brand-primary text-mx-black shadow-mx-glow-brand' : 'bg-surface-alt border-border-default text-text-tertiary hover:border-brand-primary hover:text-brand-primary'}`}
                                                      title="Desafiar para X1"
                                                    >
                                                        <Swords className="w-mx-sm h-mx-sm" />
                                                    </button>
                                                </div>
                                            </Card>
                                        </motion.li>
                                    )
                                })}
                            </AnimatePresence>
                        </ol>
                    </div>
                )}
            </div>

            {selectedSeller && (
                <SellerProfileModal 
                    seller={sortedRanking.find(s => s.user_id === selectedSeller)!} 
                    onClose={() => setSelectedSeller(null)} 
                />
            )}
        </main>
    )
}
