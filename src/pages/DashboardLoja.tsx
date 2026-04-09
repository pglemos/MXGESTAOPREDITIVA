import { useMemberships, useSellersByStore } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useState, useMemo, useCallback } from 'react'
import { 
    Target, Car, TrendingUp, Users, Calendar, 
    RefreshCw, Search, Globe, AlertTriangle, 
    ChevronDown, ChevronRight, Share2, MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/ui/skeleton'
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
        await refetch()
        setIsRefetching(false)
        toast.success('Sincronizado!')
    }, [refetch])

    const metrics = useMemo(() => {
        const totalSales = checkins.reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
        const totalLeads = checkins.reduce((acc, c) => acc + (c.leads_prev_day || 0), 0)
        const totalAgd = checkins.reduce((acc, c) => acc + (c.agd_cart_prev_day || 0) + (c.agd_net_prev_day || 0), 0)
        const totalVis = checkins.reduce((acc, c) => acc + (c.visit_prev_day || 0), 0)
        
        const goalValue = storeGoal?.target || 0
        const attainment = goalValue > 0 ? Math.round((totalSales / goalValue) * 100) : 0
        
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        
        const salesBySeller = new Map()
        checkins.forEach(c => {
            const sid = c.seller_user_id
            if (!salesBySeller.has(sid)) salesBySeller.set(sid, { total: 0, leads: 0, agd: 0, vis: 0, is_venda_loja: c.is_venda_loja })
            const current = salesBySeller.get(sid)
            current.total += (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0)
            current.leads += (c.leads_prev_day || 0)
            current.agd += (c.agd_cart_prev_day || 0) + (c.agd_net_prev_day || 0)
            current.vis += (c.visit_prev_day || 0)
        })

        const ranking = Array.from(salesBySeller.entries()).map(([uid, s]) => ({
            user_id: uid,
            user_name: sellers?.find(sl => sl.id === uid)?.name || (s.is_venda_loja ? 'VENDA LOJA' : 'Vendedor'),
            ...s
        })).sort((a, b) => b.total - a.total)

        return {
            totalSales, totalLeads, totalAgd, totalVis,
            attainment, goalValue, checkedInCount,
            ranking,
            storeName: memberships?.find(m => m.store_id === storeId)?.store?.name || 'Unidade MX'
        }
    }, [checkins, storeGoal, sellers, memberships, storeId])

    const filteredRanking = useMemo(() => {
        return metrics.ranking.filter(r => r.user_name.toLowerCase().includes(sellerSearch.toLowerCase()))
    }, [metrics.ranking, sellerSearch])

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header Operacional */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-2">
                    <Typography variant="caption" tone="brand">Status de Unidade</Typography>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-secondary rounded-full" aria-hidden="true" />
                        {role === 'admin' || role === 'dono' ? (
                            <div className="relative group">
                                <label htmlFor="store-select" className="sr-only">Trocar Unidade Operacional</label>
                                <select 
                                    id="store-select"
                                    value={storeId || ''} 
                                    onChange={e => setActiveStoreId(e.target.value)}
                                    className="appearance-none bg-transparent text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none outline-none pr-10 cursor-pointer hover:text-brand-primary transition-colors focus-visible:ring-4 focus-visible:ring-brand-primary/10"
                                >
                                    {memberships.map(m => (
                                        <option key={m.store_id} value={m.store_id}>{m.store?.name?.toUpperCase() || 'LOJA'}</option>
                                    ))}
                                </select>
                                <ChevronDown size={32} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" aria-hidden="true" />
                            </div>
                        ) : (
                            <Typography variant="h1">{metrics.storeName}</Typography>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <div className="bg-white p-1 rounded-full shadow-mx-sm border border-border-default flex gap-1" role="tablist">
                        <Button 
                            variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('month')}
                            className="h-10 px-6 rounded-full"
                        >
                            Mês Atual
                        </Button>
                        <Button 
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('day')}
                            className="h-10 px-6 rounded-full"
                        >
                            D-1
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 px-4 bg-white h-14 rounded-mx-lg shadow-mx-sm border border-border-default">
                        <Calendar size={16} className="text-text-tertiary" aria-hidden="true" />
                        <label htmlFor="start-date" className="sr-only">Início</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="text-[10px] font-black uppercase text-text-primary bg-transparent focus:outline-none" />
                        <label htmlFor="end-date" className="sr-only">Fim</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="text-[10px] font-black uppercase text-text-primary bg-transparent focus:outline-none ml-2" />
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-14 h-14 rounded-xl">
                        <RefreshCw size={20} className={cn((isRefetching || loading) && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0" aria-live="polite">
                <Card className="p-8 border-none bg-brand-secondary text-white shadow-mx-xl">
                    <Typography variant="caption" tone="white" className="opacity-50 mb-4">Meta de Vendas</Typography>
                    <Typography variant="h1" tone="white" className="text-4xl tabular-nums leading-none mb-2">{metrics.goalValue}</Typography>
                    <Typography variant="caption" tone="white" className="opacity-30">{metrics.attainment}% Atingido</Typography>
                </Card>
                <Card className="p-8">
                    <Typography variant="caption" tone="muted" className="mb-4">Vendido no Período</Typography>
                    <Typography variant="h1" className="text-4xl tabular-nums leading-none mb-2">{metrics.totalSales}</Typography>
                    <Typography variant="caption" tone="brand">Referência em Real-Time</Typography>
                </Card>
                <Card className="p-8">
                    <Typography variant="caption" tone="muted" className="mb-4">Escoamento Médio</Typography>
                    <div className="flex items-baseline gap-2">
                        <Typography variant="h1" className="text-4xl tabular-nums leading-none">{metrics.totalLeads}</Typography>
                        <Typography variant="caption">Leads</Typography>
                    </div>
                    <Typography variant="caption" tone="muted" className="mt-2">{metrics.totalVis} Visitas Efetuadas</Typography>
                </Card>
                <Card className="p-8">
                    <Typography variant="caption" tone="muted" className="mb-4">Status Equipe</Typography>
                    <Typography variant="h1" tone={metrics.checkedInCount < (sellers || []).length ? 'error' : 'success'} className="text-4xl tabular-nums leading-none mb-2">
                        {metrics.checkedInCount}/{ (sellers || []).length }
                    </Typography>
                    <Typography variant="caption" tone="muted">Vendedores Sincronizados</Typography>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg shrink-0 pb-32">
                
                {/* Ranking Section */}
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="w-full">
                        <CardHeader className="flex-row items-center justify-between gap-mx-md">
                            <div>
                                <CardTitle>{viewMode === 'day' ? 'Grade Diária MX' : 'Ranking de Performance'}</CardTitle>
                                <CardDescription>{viewMode === 'day' ? 'Foco D-1' : 'Acumulado Período'}</CardDescription>
                            </div>
                            <div className="relative group w-64">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                                <label htmlFor="seller-search" className="sr-only">Buscar especialista</label>
                                <input 
                                    id="seller-search"
                                    type="text" 
                                    placeholder="BUSCAR ESPECIALISTA..." 
                                    value={sellerSearch}
                                    onChange={e => setSellerSearch(e.target.value)}
                                    className="w-full bg-surface-alt border border-border-default rounded-full h-10 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all"
                                />
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[800px] border-collapse">
                                <caption className="sr-only">Ranking de performance por vendedor</caption>
                                <thead>
                                    <tr className="bg-brand-secondary border-b border-white/5">
                                        <th scope="col" className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Pos</th>
                                        <th scope="col" className="px-8 py-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Especialista</th>
                                        <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">Leads</th>
                                        <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">Visitas</th>
                                        <th scope="col" className="px-8 py-4 text-center text-[10px] font-black text-indigo-400 uppercase tracking-widest">Vendas</th>
                                        <th scope="col" className="px-8 py-4 text-right text-[10px] font-black text-white/20 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default">
                                    {filteredRanking.map((r, i) => (
                                        <tr key={r.user_id} className="hover:bg-surface-alt transition-colors group h-16">
                                            <td className="px-8 py-2 font-black text-xs text-text-tertiary tabular-nums">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-8 py-2"><Typography variant="h3" className="text-sm">{r.user_name}</Typography></td>
                                            <td className="px-8 py-2 text-center font-bold text-xs text-text-primary tabular-nums">{r.leads}</td>
                                            <td className="px-8 py-2 text-center font-bold text-xs text-text-primary tabular-nums">{r.vis}</td>
                                            <td className="px-8 py-2 text-center font-black text-xl text-brand-primary tabular-nums bg-brand-primary/5">{r.total}</td>
                                            <td className="px-8 py-2 text-right">
                                                <Badge variant={r.total > 0 ? 'success' : 'outline'} className="px-3">
                                                    {r.total > 0 ? 'CONVERSÃO' : 'EM AGUARDO'}
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
                    <section className="bg-white border border-border-default rounded-[2.5rem] p-10 shadow-mx-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-inner" aria-hidden="true"><Globe size={24} /></div>
                            <Typography variant="h3">Mix de Canais</Typography>
                        </div>
                        <div className="space-y-4 relative z-10">
                            {[
                                { label: 'Showroom', color: 'bg-emerald-500', pct: 40 },
                                { label: 'Carteira', color: 'bg-blue-500', pct: 35 },
                                { label: 'Digital', color: 'bg-indigo-500', pct: 25 },
                            ].map(ch => (
                                <div key={ch.label} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="caption" className="text-[8px]">{ch.label}</Typography>
                                        <Typography variant="mono" className="text-xs">{ch.pct}%</Typography>
                                    </div>
                                    <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden" role="progressbar" aria-valuenow={ch.pct} aria-valuemin={0} aria-valuemax={100}>
                                        <div className={cn("h-full transition-all duration-1000", ch.color)} style={{ width: `${ch.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-brand-secondary rounded-[2.5rem] p-10 text-white shadow-mx-xl relative overflow-hidden" aria-labelledby="side-diag-title">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12" aria-hidden="true"><TrendingUp size={160} /></div>
                        <h3 id="side-diag-title" className="text-lg font-black uppercase tracking-tight mb-6">Diagnóstico Unidade</h3>
                        <p className="text-sm font-bold leading-relaxed italic opacity-80 uppercase tracking-tight">
                            "A unidade opera com 85% de eficiência disciplinar. O gargalo técnico identificado é o agendamento de leads digitais para o final de semana."
                        </p>
                    </section>
                </aside>
            </div>
        </main>
    )
}
