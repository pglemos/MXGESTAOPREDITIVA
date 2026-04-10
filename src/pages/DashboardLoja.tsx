import { useMemberships, useSellersByStore } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    Target, RefreshCw, Search, Globe, ChevronDown, Calendar, History, Settings, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { somarVendas, calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { AdminNetworkView } from '@/components/admin/AdminNetworkView'
import { useSearchParams, Link } from 'react-router-dom'
import { toast } from 'sonner'

export default function DashboardLoja() {
    const { role, profile, storeId: authStoreId, setActiveStoreId, memberships } = useAuth()
    const [searchParams] = useSearchParams()
    const urlStoreId = searchParams.get('id')
    const storeId = urlStoreId || authStoreId

    // Sync global active store if URL param present
    useEffect(() => {
        if (urlStoreId && urlStoreId !== authStoreId) {
            setActiveStoreId(urlStoreId)
        }
    }, [urlStoreId, authStoreId, setActiveStoreId])

    const { sellers } = useSellersByStore(storeId)
    const { goal: storeGoal } = useStoreGoal(storeId)

    const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [sellerSearch, setSellerSearch] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const referenceDate = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), [])
    
    const { checkins, loading, refetch } = useCheckinsByDateRange(
        storeId, 
        viewMode === 'day' ? referenceDate : startDate, 
        viewMode === 'day' ? referenceDate : endDate
    )

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await refetch()
            toast.success('Performance sincronizada!')
        } finally {
            setIsRefetching(false)
        }
    }, [refetch])

    // Lógica centralizada de Vendas e Ranking (Memoized)
    const storeSalesParams = useMemo(() => {
        // Pre-group checkins by seller_user_id for O(1) access during ranking map
        const checkinsBySeller = (checkins || []).reduce((acc, c) => {
            if (!acc[c.seller_user_id]) acc[c.seller_user_id] = []
            acc[c.seller_user_id].push(c)
            return acc
        }, {} as Record<string, any[]>)

        return {
            checkins: checkins as any,
            ranking: (sellers || []).map(s => {
                const sellerCheckins = checkinsBySeller[s.id] || []
                return {
                    user_id: s.id,
                    user_name: s.name,
                    is_venda_loja: s.is_venda_loja || false,
                    vnd_total: somarVendas(sellerCheckins as any),
                    leads: sellerCheckins.reduce((acc, c) => acc + (c.leads_prev_day || 0), 0),
                    agd_total: sellerCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0),
                    visitas: sellerCheckins.reduce((acc, c) => acc + (c.visit_prev_day || 0), 0),
                    meta: storeGoal?.target || 0,
                    atingimento: 0,
                    projecao: 0,
                    ritmo: 0,
                    efficiency: 0,
                    status: { label: '', color: '' },
                    gap: 0,
                    position: 0
                }
            }),
            rules: { monthly_goal: storeGoal?.target || 0 } as any
        }
    }, [checkins, sellers, storeGoal])

    const storeSales = useStoreSales(storeSalesParams)

    const metrics = useMemo(() => {
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        
        return {
            totalSales: storeSales.storeTotalVendas,
            totalLeads: storeSales.storeTotalLeads,
            totalAgd: storeSales.storeTotalAgd,
            totalVis: storeSales.storeTotalVis,
            attainment: storeSales.storeAttainment,
            goalValue: storeSales.storeGoal,
            checkedInCount,
            ranking: storeSales.processedRanking,
            storeName: memberships?.find(m => m.store_id === storeId)?.store?.name || 'Unidade MX'
        }
    }, [storeSales, sellers, memberships, storeId])

    const diagnostics = useMemo(() => {
        const funil = calcularFunil(checkins as any)
        return gerarDiagnosticoMX(funil)
    }, [checkins])

    const sellersMap = useMemo(() => {
        const map = new Map();
        if (sellers) {
            for (const seller of sellers) {
                map.set(seller.id, seller);
            }
        }
        return map;
    }, [sellers])

    const mixCanais = useMemo(() => {
        const total = metrics.totalSales || 1
        const porta = (checkins || []).reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0), 0)
        const carteira = (checkins || []).reduce((acc, c) => acc + (c.vnd_cart_prev_day || 0), 0)
        const digital = (checkins || []).reduce((acc, c) => acc + (c.vnd_net_prev_day || 0), 0)
        
        return [
            { label: 'Porta (Showroom)', color: 'bg-emerald-500', pct: Math.round((porta / total) * 100), tone: 'success' },
            { label: 'Carteira (Ativo)', color: 'bg-blue-500', pct: Math.round((carteira / total) * 100), tone: 'info' },
            { label: 'Digital (Leads)', color: 'bg-indigo-500', pct: Math.round((digital / total) * 100), tone: 'brand' },
        ]
    }, [checkins, metrics.totalSales])

    const filteredRanking = useMemo(() => {
        return metrics.ranking.filter(r => r.user_name.toLowerCase().includes(sellerSearch.toLowerCase()))
    }, [metrics.ranking, sellerSearch])

    if (loading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-48 rounded-mx-xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Skeleton className="h-32 rounded-mx-2xl" />
                <Skeleton className="h-32 rounded-mx-2xl" />
                <Skeleton className="h-32 rounded-mx-2xl" />
                <Skeleton className="h-32 rounded-mx-2xl" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Skeleton className="h-96 rounded-mx-2xl" />
                </section>
                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Skeleton className="h-64 rounded-mx-2xl" />
                    <Skeleton className="h-48 rounded-mx-2xl" />
                </aside>
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-xs">
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60">Status de Unidade</Typography>
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        {(role === 'admin' || role === 'dono') ? (
                            <div className="relative group">
                                <label htmlFor="store-dashboard-select" className="sr-only">Selecionar unidade</label>
                                <select 
                                    id="store-dashboard-select"
                                    value={storeId || ''} onChange={e => setActiveStoreId(e.target.value)}
                                    className="appearance-none bg-transparent text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none outline-none pr-12 cursor-pointer hover:text-brand-primary transition-colors focus-visible:ring-4 focus-visible:ring-brand-primary/10 rounded-mx-md"
                                >
                                    {memberships.map(m => (
                                        <option key={m.store_id} value={m.store_id} className="text-lg bg-white">{m.store?.name?.toUpperCase() || 'LOJA'}</option>
                                    ))}
                                </select>
                                <ChevronDown size={32} className="absolute right-mx-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" aria-hidden="true" />
                            </div>
                        ) : (
                            <Typography variant="h1" className="font-black uppercase tracking-tighter">{metrics.storeName}</Typography>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    {(role === 'admin' || role === 'dono') && storeId && (
                        <div className="flex gap-mx-xs mr-mx-md">
                            <Button asChild variant="outline" size="sm" className="h-mx-10 px-mx-md rounded-mx-xl border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all uppercase font-black tracking-widest text-[10px]">
                                <Link to={`/configuracoes/operacional?id=${storeId}`}>
                                    <Settings className="w-mx-xs h-mx-xs mr-mx-xs" /> EDITAR UNIDADE
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-mx-10 px-mx-md rounded-mx-xl border-brand-secondary/20 text-brand-secondary hover:bg-brand-secondary hover:text-white transition-all uppercase font-black tracking-widest text-[10px]">
                                <Link to={`/equipe?id=${storeId}`}>
                                    <Users className="w-mx-xs h-mx-xs mr-mx-xs" /> GERIR EQUIPE
                                </Link>
                            </Button>
                        </div>
                    )}

                    <nav className="bg-white p-mx-tiny rounded-mx-full shadow-mx-sm border border-border-default flex gap-mx-tiny" role="tablist" aria-label="Modos de Visualização">
                        <Button 
                            variant={viewMode === 'month' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setViewMode('month')} 
                            className="h-mx-10 px-6 rounded-mx-full uppercase font-black tracking-widest text-tiny"
                            role="tab"
                            aria-selected={viewMode === 'month'}
                        >
                            Mês Atual
                        </Button>
                        <Button 
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setViewMode('day')} 
                            className="h-mx-10 px-6 rounded-mx-full uppercase font-black tracking-widest text-tiny"
                            role="tab"
                            aria-selected={viewMode === 'day'}
                        >
                            D-1
                        </Button>
                    </nav>

                    <div className="flex items-center gap-mx-xs px-6 bg-white h-mx-14 rounded-mx-xl shadow-mx-sm border border-border-default" role="group" aria-label="Filtro de Data">
                        <Calendar size={16} className="text-brand-primary" aria-hidden="true" />
                        <label htmlFor="start-date" className="sr-only">Data Inicial</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="uppercase font-black text-text-primary bg-transparent outline-none text-tiny focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded" />
                        <div className="w-px h-mx-sm bg-border-strong mx-2" aria-hidden="true" />
                        <label htmlFor="end-date" className="sr-only">Data Final</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="uppercase font-black text-text-primary bg-transparent outline-none text-tiny focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded" />
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm bg-white" aria-label="Sincronizar performance">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            {role === 'admin' && !urlStoreId && (
                <div className="mb-mx-lg">
                    <Typography variant="h2" className="mb-mx-md">Visão Administrativa da Rede</Typography>
                    <AdminNetworkView />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="p-mx-lg border-none bg-brand-secondary text-white shadow-mx-xl relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-white/5 rounded-mx-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <Typography variant="tiny" tone="white" className="opacity-50 mb-4 block font-black uppercase tracking-widest">Meta de Vendas</Typography>
                    <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-mono-numbers">{metrics.goalValue}</Typography>
                    <Badge variant="outline" className="text-white border-white/20 font-black h-mx-md uppercase text-tiny">{metrics.attainment}% ATINGIDO</Badge>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <Typography variant="tiny" tone="muted" className="mb-4 block font-black uppercase tracking-widest opacity-40">Vendido Período</Typography>
                    <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-mono-numbers">{metrics.totalSales}</Typography>
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">REFERÊNCIA REAL-TIME</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-info-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <Typography variant="tiny" tone="muted" className="mb-4 block font-black uppercase tracking-widest opacity-40">Escoamento Médio</Typography>
                    <div className="flex items-baseline gap-mx-xs mb-3">
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalLeads}</Typography>
                        <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">LEADS</Typography>
                    </div>
                    <Typography variant="tiny" tone="info" className="font-black uppercase tracking-widest">{metrics.totalVis} VISITAS EFETUADAS</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-success-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <Typography variant="tiny" tone="muted" className="mb-4 block font-black uppercase tracking-widest opacity-40">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone={metrics.checkedInCount < (sellers || []).length ? 'error' : 'success'} className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-mono-numbers">
                        {metrics.checkedInCount}<span className="text-text-tertiary text-2xl font-black">/{ (sellers || []).length }</span>
                    </Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-40">REGISTROS SINCRONIZADOS</Typography>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-lg p-mx-10 bg-surface-alt/30 border-b border-border-default">
                            <div>
                                <CardTitle className="text-2xl uppercase tracking-tighter">{viewMode === 'day' ? 'Grade Diária' : 'Ranking Unidade'}</CardTitle>
                                <CardDescription className="font-black uppercase tracking-widest mt-1 opacity-40">AUDITORIA DE PERFORMANCE INDIVIDUAL</CardDescription>
                            </div>
                            <div className="relative group w-full sm:w-mx-2xl">
                                <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                                <label htmlFor="search-seller" className="sr-only">Buscar especialista</label>
                                <Input 
                                    id="search-seller"
                                    placeholder="BUSCAR ESPECIALISTA..." value={sellerSearch}
                                    onChange={e => setSellerSearch(e.target.value)}
                                    className="!pl-11 !h-12 uppercase tracking-widest text-xs font-black"
                                />
                            </div>
                        </CardHeader>
                        
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[800px]">
                                <caption className="sr-only">Ranking de performance dos especialistas da unidade</caption>
                                <thead>
                                    <tr className="bg-mx-black border-b border-white/5 text-mx-tiny font-black uppercase tracking-mx-wide text-white/20">
                                        <th scope="col" className="pl-10 py-6">POS</th>
                                        <th scope="col" className="px-6 py-6">ESPECIALISTA</th>
                                        <th scope="col" className="px-6 py-6 text-center">LEADS</th>
                                        <th scope="col" className="px-6 py-6 text-center">VISITAS</th>
                                        <th scope="col" className="px-6 py-6 text-center text-brand-primary">VENDAS</th>
                                        <th scope="col" className="pr-10 py-6 text-right">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default">
                                    {filteredRanking.map((r, i) => {
                                        const seller = sellersMap.get(r.user_id)
                                        const isCheckedIn = seller?.checkin_today
                                        return (
                                        <tr key={r.user_id} className={cn("hover:bg-surface-alt/30 transition-all group h-20 border-l-4", isCheckedIn ? "border-l-transparent" : "border-l-status-error", r.is_venda_loja && "bg-brand-primary/5")}>
                                            <td className="pl-10 font-black text-sm text-text-tertiary tabular-nums opacity-40">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-6">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className={cn("w-mx-10 h-mx-10 rounded-mx-lg flex items-center justify-center font-black text-xs transition-all shadow-mx-inner uppercase border", r.is_venda_loja ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-alt text-text-primary border-border-default group-hover:bg-brand-primary group-hover:text-white")}>
                                                        {r.user_name.charAt(0)}
                                                    </div>
                                                    <div className="truncate">
                                                        <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black truncate">{r.user_name}</Typography>
                                                        {r.is_venda_loja ? (
                                                            <span className="text-[8px] font-black bg-brand-primary text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Venda Loja</span>
                                                        ) : (
                                                            <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-widest truncate opacity-40">Unidade {metrics.storeName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 text-center font-black text-sm text-text-primary font-mono-numbers opacity-60">{r.leads}</td>
                                            <td className="px-6 text-center font-black text-sm text-text-primary font-mono-numbers opacity-60">{r.visitas}</td>
                                            <td className="px-6 text-center font-black text-2xl text-brand-primary font-mono-numbers bg-mx-indigo-50/30">{r.vnd_total}</td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={r.vnd_total > 0 ? 'success' : 'outline'} className="px-4 py-1.5 rounded-mx-lg font-black text-mx-micro tracking-widest shadow-sm uppercase border-none">
                                                    {r.vnd_total > 0 ? 'CONVERSÃO' : 'EM AGUARDO'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                        <header className="flex items-center gap-mx-sm mb-10 relative z-10">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-mx-inner border border-border-default" aria-hidden="true"><Globe size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Mix de Canais</Typography>
                        </header>
                        
                        <div className="space-y-mx-lg relative z-10">
                            {mixCanais.map(ch => (
                                <div key={ch.label} className="space-y-mx-xs">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-40">{ch.label}</Typography>
                                        <Typography variant="mono" tone={ch.tone as any} className="text-sm font-black">{ch.pct}%</Typography>
                                    </div>
                                    <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-mx-inner p-0.5">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${ch.pct}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                                            className={cn("h-full rounded-full shadow-sm transition-all duration-1000", ch.color)} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-mx-10 bg-brand-primary rounded-mx-3xl text-white shadow-mx-xl relative overflow-hidden group border-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" aria-hidden="true" />
                        <div className="relative z-10 text-center">
                            <History className="mx-auto mb-8 opacity-30 transform group-hover:scale-110 transition-transform" size={48} aria-hidden="true" />
                            <Typography variant="h2" tone="white" className="text-xl mb-6 uppercase tracking-tight font-black">Diagnóstico Unidade</Typography>
                            <Typography variant="caption" tone="white" className="text-xs font-black italic opacity-80 leading-relaxed uppercase tracking-widest max-w-xs mx-auto block">
                                "{diagnostics.diagnostico} {diagnostics.sugestao}"
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
