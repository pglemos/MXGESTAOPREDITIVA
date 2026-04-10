import { useMemberships, useSellersByStore } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useState, useMemo, useCallback } from 'react'
import { 
    Target, RefreshCw, Search, Globe, ChevronDown, Calendar, History
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
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

export default function DashboardLoja() {
    const { role, profile, storeId: authStoreId, setActiveStoreId } = useAuth()
    const [searchParams] = useSearchParams()
    const urlStoreId = searchParams.get('id')
    const storeId = urlStoreId || authStoreId

    const { memberships } = useMemberships()
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
    const storeSalesParams = useMemo(() => ({
        checkins: checkins as any,
        ranking: (sellers || []).map(s => ({
            user_id: s.id,
            user_name: s.name,
            is_venda_loja: s.is_venda_loja || false,
            vnd_total: somarVendas(checkins.filter(c => c.seller_user_id === s.id) as any),
            leads: checkins.filter(c => c.seller_user_id === s.id).reduce((acc, c) => acc + (c.leads_prev_day || 0), 0),
            agd_total: checkins.filter(c => c.seller_user_id === s.id).reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0),
            visitas: checkins.filter(c => c.seller_user_id === s.id).reduce((acc, c) => acc + (c.visit_prev_day || 0), 0),
            meta: storeGoal?.target || 0,
            atingimento: 0,
            projecao: 0,
            ritmo: 0,
            efficiency: 0,
            status: { label: '', color: '' },
            gap: 0,
            position: 0
        })),
        rules: { monthly_goal: storeGoal?.target || 0 } as any
    }), [checkins, sellers, storeGoal])

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

    const filteredRanking = useMemo(() => {
        return metrics.ranking.filter(r => r.user_name.toLowerCase().includes(sellerSearch.toLowerCase()))
    }, [metrics.ranking, sellerSearch])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt" role="status" aria-live="polite">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse font-black uppercase tracking-widest">Consolidando Unidade...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-2">
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60">Status de Unidade</Typography>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-secondary rounded-full shadow-mx-md" aria-hidden="true" />
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
                                <ChevronDown size={32} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" aria-hidden="true" />
                            </div>
                        ) : (
                            <Typography variant="h1" className="font-black uppercase tracking-tighter">{metrics.storeName}</Typography>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <nav className="bg-white p-1 rounded-mx-full shadow-mx-sm border border-border-default flex gap-1" role="tablist" aria-label="Modos de Visualização">
                        <Button 
                            variant={viewMode === 'month' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setViewMode('month')} 
                            className="h-10 px-6 rounded-full uppercase font-black tracking-widest text-tiny"
                            role="tab"
                            aria-selected={viewMode === 'month'}
                        >
                            Mês Atual
                        </Button>
                        <Button 
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setViewMode('day')} 
                            className="h-10 px-6 rounded-full uppercase font-black tracking-widest text-tiny"
                            role="tab"
                            aria-selected={viewMode === 'day'}
                        >
                            D-1
                        </Button>
                    </nav>

                    <div className="flex items-center gap-2 px-6 bg-white h-14 rounded-mx-xl shadow-mx-sm border border-border-default" role="group" aria-label="Filtro de Data">
                        <Calendar size={16} className="text-brand-primary" aria-hidden="true" />
                        <label htmlFor="start-date" className="sr-only">Data Inicial</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="uppercase font-black text-text-primary bg-transparent outline-none text-tiny focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded" />
                        <div className="w-px h-4 bg-border-strong mx-2" aria-hidden="true" />
                        <label htmlFor="end-date" className="sr-only">Data Final</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="uppercase font-black text-text-primary bg-transparent outline-none text-tiny focus-visible:ring-2 focus-visible:ring-brand-primary/20 rounded" />
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-14 h-14 rounded-xl shadow-mx-sm bg-white" aria-label="Sincronizar performance">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            {role === 'admin' && (
                <div className="mb-mx-lg">
                    <Typography variant="h2" className="mb-mx-md">Visão Administrativa da Rede</Typography>
                    <AdminNetworkView />
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="p-8 border-none bg-brand-secondary text-white shadow-mx-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <Typography variant="tiny" tone="white" className="opacity-50 mb-4 block font-black uppercase tracking-widest">Meta de Vendas</Typography>
                    <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-mono-numbers">{metrics.goalValue}</Typography>
                    <Badge variant="outline" className="text-white border-white/20 font-black h-6 uppercase text-tiny">{metrics.attainment}% ATINGIDO</Badge>
                </Card>

                <Card className="p-8 border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <Typography variant="tiny" tone="muted" className="mb-4 block font-black uppercase tracking-widest opacity-40">Vendido Período</Typography>
                    <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-mono-numbers">{metrics.totalSales}</Typography>
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">REFERÊNCIA REAL-TIME</Typography>
                </Card>

                <Card className="p-8 border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-info-surface rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <Typography variant="tiny" tone="muted" className="mb-4 block font-black uppercase tracking-widest opacity-40">Escoamento Médio</Typography>
                    <div className="flex items-baseline gap-2 mb-3">
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalLeads}</Typography>
                        <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">LEADS</Typography>
                    </div>
                    <Typography variant="tiny" tone="info" className="font-black uppercase tracking-widest">{metrics.totalVis} VISITAS EFETUADAS</Typography>
                </Card>

                <Card className="p-8 border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-success-surface rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
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
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 p-10 bg-surface-alt/30 border-b border-border-default">
                            <div>
                                <CardTitle className="text-2xl uppercase tracking-tighter">{viewMode === 'day' ? 'Grade Diária' : 'Ranking Unidade'}</CardTitle>
                                <CardDescription className="font-black uppercase tracking-widest mt-1 opacity-40">AUDITORIA DE PERFORMANCE INDIVIDUAL</CardDescription>
                            </div>
                            <div className="relative group w-full sm:w-mx-2xl">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
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
                            <table className="w-full text-left">
                                <caption className="sr-only">Ranking de performance dos especialistas da unidade</caption>
                                <thead>
                                    <tr className="bg-mx-black border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                        <th scope="col" className="pl-10 py-6">POS</th>
                                        <th scope="col" className="px-6 py-6">ESPECIALISTA</th>
                                        <th scope="col" className="px-6 py-6 text-center">LEADS</th>
                                        <th scope="col" className="px-6 py-6 text-center">VISITAS</th>
                                        <th scope="col" className="px-6 py-6 text-center text-brand-primary">VENDAS</th>
                                        <th scope="col" className="pr-10 py-6 text-right">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default">
                                    {filteredRanking.map((r, i) => (
                                        <tr key={r.user_id} className="hover:bg-surface-alt/30 transition-colors group h-20">
                                            <td className="pl-10 font-black text-sm text-text-tertiary tabular-nums opacity-40">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-xs group-hover:bg-brand-primary group-hover:text-white transition-all shadow-mx-inner uppercase" aria-hidden="true">{r.user_name.charAt(0)}</div>
                                                    <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black">{r.user_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-6 text-center font-black text-sm text-text-primary font-mono-numbers opacity-60">{r.leads}</td>
                                            <td className="px-6 text-center font-black text-sm text-text-primary font-mono-numbers opacity-60">{r.visitas}</td>
                                            <td className="px-6 text-center font-black text-2xl text-brand-primary font-mono-numbers bg-mx-indigo-50/30">{r.vnd_total}</td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={r.vnd_total > 0 ? 'success' : 'outline'} className="px-4 py-1.5 rounded-lg font-black text-[8px] tracking-widest shadow-sm uppercase border-none">
                                                    {r.vnd_total > 0 ? 'CONVERSÃO' : 'EM AGUARDO'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                        <header className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-mx-inner border border-border-default" aria-hidden="true"><Globe size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Mix de Canais</Typography>
                        </header>
                        
                        <div className="space-y-8 relative z-10">
                            {[
                                { label: 'Porta (Showroom)', color: 'bg-emerald-500', pct: 40, tone: 'success' },
                                { label: 'Carteira (Ativo)', color: 'bg-blue-500', pct: 35, tone: 'info' },
                                { label: 'Digital (Leads)', color: 'bg-indigo-500', pct: 25, tone: 'brand' },
                            ].map(ch => (
                                <div key={ch.label} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-40">{ch.label}</Typography>
                                        <Typography variant="mono" tone={ch.tone as any} className="text-sm font-black">{ch.pct}%</Typography>
                                    </div>
                                    <div className="h-2 w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-mx-inner p-0.5">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${ch.pct}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                                            className={cn("h-full rounded-full shadow-sm transition-all duration-1000", ch.color)} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-10 bg-brand-primary rounded-[3rem] text-white shadow-mx-xl relative overflow-hidden group border-none">
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
