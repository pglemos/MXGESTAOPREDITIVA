import { useMemberships, useSellersByStore } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useState, useMemo, useCallback } from 'react'
import { 
    Target, Car, TrendingUp, Users, Calendar, 
    RefreshCw, Search, Globe, AlertTriangle, 
    ChevronDown, ChevronRight, Share2, MessageCircle,
    Building2, LayoutDashboard, History, Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
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
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Performance sincronizada!')
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

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Unidade...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Dashboard Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-2">
                    <Typography variant="caption" tone="brand" className="pl-6 uppercase tracking-widest font-black">Status de Unidade</Typography>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-secondary rounded-full shadow-mx-md" aria-hidden="true" />
                        {(role === 'admin' || role === 'dono') ? (
                            <div className="relative group">
                                <select 
                                    value={storeId || ''} onChange={e => setActiveStoreId(e.target.value)}
                                    className="appearance-none bg-transparent text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none outline-none pr-12 cursor-pointer hover:text-brand-primary transition-colors"
                                >
                                    {memberships.map(m => (
                                        <option key={m.store_id} value={m.store_id} className="text-lg bg-white">{m.store?.name?.toUpperCase() || 'LOJA'}</option>
                                    ))}
                                </select>
                                <ChevronDown size={32} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" />
                            </div>
                        ) : (
                            <Typography variant="h1">{metrics.storeName}</Typography>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <div className="bg-white p-1 rounded-mx-full shadow-mx-sm border border-border-default flex gap-1" role="tablist">
                        <Button 
                            variant={viewMode === 'month' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setViewMode('month')} className="h-10 px-6 rounded-full text-[10px] font-black uppercase"
                        >
                            Mês Atual
                        </Button>
                        <Button 
                            variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setViewMode('day')} className="h-10 px-6 rounded-full text-[10px] font-black uppercase"
                        >
                            D-1
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 px-6 bg-white h-14 rounded-mx-xl shadow-mx-sm border border-border-default">
                        <Calendar size={16} className="text-brand-primary" aria-hidden="true" />
                        <input type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="text-[10px] font-black uppercase text-text-primary bg-transparent outline-none" />
                        <div className="w-px h-4 bg-border-strong mx-2" />
                        <input type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="text-[10px] font-black uppercase text-text-primary bg-transparent outline-none" />
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-14 h-14 rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {/* Tactical Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="p-8 border-none bg-brand-secondary text-white shadow-mx-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="caption" tone="white" className="opacity-50 mb-4 block uppercase tracking-widest">Meta de Vendas</Typography>
                    <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none mb-3">{metrics.goalValue}</Typography>
                    <Badge variant="outline" className="text-white border-white/20 font-black">{metrics.attainment}% ATINGIDO</Badge>
                </Card>

                <Card className="p-8 border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="caption" tone="muted" className="mb-4 block uppercase tracking-widest">Vendido Período</Typography>
                    <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3">{metrics.totalSales}</Typography>
                    <Typography variant="caption" tone="brand" className="font-black">REFERÊNCIA REAL-TIME</Typography>
                </Card>

                <Card className="p-8 border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-info-surface rounded-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="caption" tone="muted" className="mb-4 block uppercase tracking-widest">Escoamento Médio</Typography>
                    <div className="flex items-baseline gap-2 mb-3">
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none">{metrics.totalLeads}</Typography>
                        <Typography variant="h3" tone="muted" className="text-xl">LEADS</Typography>
                    </div>
                    <Typography variant="caption" tone="info" className="font-black">{metrics.totalVis} VISITAS EFETUADAS</Typography>
                </Card>

                <Card className="p-8 border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-success-surface rounded-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="caption" tone="muted" className="mb-4 block uppercase tracking-widest">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone={metrics.checkedInCount < (sellers || []).length ? 'error' : 'success'} className="text-5xl tabular-nums leading-none mb-3">
                        {metrics.checkedInCount}<span className="text-text-tertiary text-2xl">/{ (sellers || []).length }</span>
                    </Typography>
                    <Typography variant="caption" tone="muted" className="font-black">REGISTROS SINCRONIZADOS</Typography>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                
                {/* Ranking Section */}
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 p-10 bg-surface-alt/30 border-b border-border-default">
                            <div>
                                <CardTitle className="text-2xl uppercase">{viewMode === 'day' ? 'Grade Diária' : 'Ranking Unidade'}</CardTitle>
                                <CardDescription className="font-black uppercase tracking-widest mt-1 opacity-60">AUDITORIA DE PERFORMANCE INDIVIDUAL</CardDescription>
                            </div>
                            <div className="relative group w-full sm:w-72">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                                <Input 
                                    placeholder="BUSCAR ESPECIALISTA..." value={sellerSearch}
                                    onChange={e => setSellerSearch(e.target.value)}
                                    className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                                />
                            </div>
                        </CardHeader>
                        
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead>
                                    <tr className="bg-brand-secondary border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                        <th scope="col" className="pl-10 py-6">POS</th>
                                        <th scope="col" className="px-6 py-6">ESPECIALISTA</th>
                                        <th scope="col" className="px-6 py-6 text-center">LEADS</th>
                                        <th scope="col" className="px-6 py-6 text-center">VISITAS</th>
                                        <th scope="col" className="px-6 py-6 text-center text-indigo-400">VENDAS</th>
                                        <th scope="col" className="pr-10 py-6 text-right">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default">
                                    {filteredRanking.map((r, i) => (
                                        <tr key={r.user_id} className="hover:bg-surface-alt/30 transition-colors group h-20">
                                            <td className="pl-10 font-black text-sm text-text-tertiary tabular-nums opacity-40">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-xs group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner uppercase">{r.user_name.charAt(0)}</div>
                                                    <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors">{r.user_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-6 text-center font-bold text-sm text-text-primary tabular-nums opacity-60">{r.leads}</td>
                                            <td className="px-6 text-center font-bold text-sm text-text-primary tabular-nums opacity-60">{r.vis}</td>
                                            <td className="px-6 text-center font-black text-2xl text-brand-primary tabular-nums bg-mx-indigo-50/30">{r.total}</td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={r.total > 0 ? 'success' : 'outline'} className="px-4 py-1.5 rounded-lg font-black text-[8px] tracking-widest shadow-sm">
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

                {/* Sidebar Mix */}
                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                        <header className="flex items-center gap-4 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-inner border border-border-default"><Globe size={28} /></div>
                            <Typography variant="h3">Mix de Canais</Typography>
                        </header>
                        
                        <div className="space-y-8 relative z-10">
                            {[
                                { label: 'Porta (Showroom)', color: 'bg-emerald-500', pct: 40, tone: 'success' },
                                { label: 'Carteira (Ativo)', color: 'bg-blue-500', pct: 35, tone: 'info' },
                                { label: 'Digital (Leads)', color: 'bg-indigo-500', pct: 25, tone: 'brand' },
                            ].map(ch => (
                                <div key={ch.label} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase tracking-widest">{ch.label}</Typography>
                                        <Typography variant="mono" tone={ch.tone as any} className="text-sm font-black">{ch.pct}%</Typography>
                                    </div>
                                    <div className="h-2 w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-0.5">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${ch.pct}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                                            className={cn("h-full rounded-full shadow-mx-sm transition-all duration-1000", ch.color)} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-10 bg-brand-primary rounded-[3rem] text-white shadow-mx-xl relative overflow-hidden group border-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                        <div className="relative z-10">
                            <TrendingUp className="mx-auto mb-8 opacity-30 transform group-hover:scale-110 transition-transform" size={48} />
                            <Typography variant="h2" tone="white" className="text-xl mb-6 uppercase tracking-tight">Diagnóstico Unidade</Typography>
                            <Typography variant="p" tone="white" className="text-sm font-black italic opacity-80 leading-relaxed uppercase tracking-widest max-w-xs mx-auto">
                                "A unidade opera com 85% de eficiência disciplinar. O gargalo técnico identificado é o agendamento de leads digitais."
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
