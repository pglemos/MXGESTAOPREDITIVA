import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Calendar, Download, RefreshCw, 
    Activity, Target, Zap, Building2, ArrowRight
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useNetworkPerformance } from '@/hooks/useNetworkPerformance'
import { useAuth } from '@/hooks/useAuth'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento } from '@/lib/calculations'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function SalesPerformance() {
    const { role, setActiveStoreId } = useAuth()
    const isAdmin = role === 'admin'
    const navigate = useNavigate()

    if (isAdmin) return <AdminPerformance />
    return <StorePerformance />
}

function AdminPerformance() {
    const { metrics, loading, refetch } = useNetworkPerformance()
    const { setActiveStoreId } = useAuth()
    const navigate = useNavigate()
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Performance da rede sincronizada!')
    }, [refetch])

    const handleExport = useCallback(async () => {
        const { exportToExcel } = await import('@/lib/export')
        const rows = metrics.byStore.map(s => ({
            Loja: s.storeName,
            Vendas: s.sales,
            Meta: s.goal,
            'Atingimento %': s.reaching,
        }))
        exportToExcel(rows, `BI_Rede_${format(new Date(), 'yyyy-MM')}`)
        toast.success('BI da rede exportado!')
    }, [metrics.byStore])

    const handleStoreClick = useCallback((storeId: string, storeName: string) => {
        setActiveStoreId(storeId)
        const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        navigate(`/loja/${slug}`)
    }, [setActiveStoreId, navigate])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Agregando dados da rede...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Benchmarks <span className="text-mx-green-700">da Rede</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">
                        {metrics.storeCount} UNIDADES • BUSINESS INTELLIGENCE • LIVE AUDIT MX
                    </Typography>
                </div>
                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-mx-xs px-6 h-mx-14 rounded-mx-full border border-border-default bg-white shadow-mx-sm">
                        <Calendar size={18} className="text-brand-primary" />
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Ciclo {format(new Date(), 'yyyy')}</Typography>
                    </div>
                    <Button variant="secondary" onClick={handleExport} className="h-mx-14 px-8 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest text-mx-tiny">
                        <Download size={18} className="mr-2" /> EXPORTAR BI
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {[
                    { title: 'Volume Rede', value: metrics.totalSales, trend: `${metrics.reaching}%`, icon: Zap, tone: 'brand' as const },
                    { title: 'Meta Consolidada', value: metrics.networkGoal, trend: `${metrics.storeCount} lojas`, icon: Target, tone: 'info' as const },
                    { title: 'Projeção MX', value: metrics.projection, trend: 'Predictive', icon: TrendingUp, tone: 'success' as const },
                ].map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-mx-lg border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12" />
                            <div className="flex items-center gap-mx-md relative z-10">
                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                                    'bg-status-success-surface border-mx-emerald-100 text-status-success'
                                )}>
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                                <div className="flex-1">
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase font-black tracking-widest text-mx-micro">{stat.title}</Typography>
                                    <div className="flex items-center justify-between">
                                        <Typography variant="h1" className="text-3xl tabular-nums leading-none">{stat.value}</Typography>
                                        <Badge variant={stat.tone} className="text-mx-micro px-3 py-1 font-black shadow-sm">{stat.trend}</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                <section className="lg:col-span-8">
                    <Card className="h-full border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl uppercase">Evolução de Sell-out</CardTitle>
                                <CardDescription className="uppercase tracking-widest font-black text-mx-micro mt-1 opacity-60">VOLUME CONSOLIDADO MENSAL • REDE COMPLETA</CardDescription>
                            </div>
                            <Badge variant="brand" className="animate-pulse px-4 py-1.5 rounded-mx-full">LIVE MATRIX</Badge>
                        </CardHeader>
                        <CardContent className="p-mx-10" style={{ height: 'var(--height-mx-chart)' }}>
                            {metrics.byMonth.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metrics.byMonth} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-xl)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                                        <Area type="monotone" dataKey="sales" stroke="var(--color-brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" dot={{ r: 6, fill: 'var(--color-brand-primary)', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, fill: 'var(--color-brand-primary)', stroke: '#fff', strokeWidth: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Typography variant="caption" tone="muted">Nenhum dado de vendas disponível para o período.</Typography>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 md:p-14 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden flex-1 group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/10 rounded-mx-full blur-mx-xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner mb-10 transform group-hover:rotate-6 transition-transform"><Activity size={32} /></div>
                                <Typography variant="h2" tone="white" className="text-3xl leading-none mb-4 uppercase tracking-tighter">Saúde da Rede</Typography>
                                <Typography variant="p" tone="white" className="opacity-60 text-xs font-bold uppercase tracking-mx-wide italic leading-relaxed">"Ritmo operacional consolidado de todas as unidades."</Typography>
                            </div>
                            <div className="pt-14 border-t border-white/10 mt-14 space-y-mx-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <Typography variant="caption" tone="white" className="font-black uppercase tracking-widest mb-2 block">Eficiência da Rede</Typography>
                                        <Typography variant="h1" tone="white" className="text-7xl tabular-nums leading-none tracking-tighter">{metrics.reaching}%</Typography>
                                    </div>
                                    <Badge variant="outline" className="text-white border-white/20 mb-2 uppercase font-black">{metrics.reaching >= 80 ? 'ON TRACK' : 'ATENÇÃO'}</Badge>
                                </div>
                                <div className="h-mx-sm w-full bg-white/5 rounded-mx-full overflow-hidden p-mx-tiny shadow-inner border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(metrics.reaching, 100)}%` }} transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full bg-white rounded-mx-full shadow-mx-glow-white transition-all duration-1000" 
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-md">
                            <CardTitle className="text-sm">Ranking por Loja</CardTitle>
                        </CardHeader>
                        <CardContent className="p-mx-0">
                            {metrics.byStore.slice(0, 5).map((store, i) => (
                                <button
                                    key={store.storeId}
                                    type="button"
                                    onClick={() => handleStoreClick(store.storeId, store.storeName)}
                                    className="w-full flex items-center justify-between px-mx-md py-mx-sm hover:bg-surface-alt/50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-mx-sm">
                                        <span className={cn(
                                            "w-mx-xs h-mx-xs rounded-mx-full",
                                            i === 0 ? "bg-status-success" : i === 1 ? "bg-brand-primary" : i === 2 ? "bg-status-warning" : "bg-text-tertiary"
                                        )} />
                                        <Typography variant="tiny" className="font-black">{store.storeName}</Typography>
                                    </div>
                                    <div className="flex items-center gap-mx-sm">
                                        <Typography variant="tiny" tone="muted">{store.sales} vendas</Typography>
                                        <ArrowRight size={12} className="text-text-tertiary" />
                                    </div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </main>
    )
}

function StorePerformance() {
    const { checkins, loading: loadingCheckins, fetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    const [isRefetching, setIsRefetching] = useState(false)
    const daysInfo = useMemo(() => getDiasInfo(), [])

    const metrics = useMemo(() => {
        const currentSales = somarVendas(checkins)
        const teamGoal = metaRules?.monthly_goal ?? storeGoal?.target ?? 0
        const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
        const reaching = calcularAtingimento(currentSales, teamGoal)
        return { currentSales, teamGoal, projection, reaching }
    }, [checkins, metaRules, storeGoal, daysInfo])

    const chartData = useMemo(() => {
        const byMonth: Record<string, number> = {}
        for (const c of checkins) {
            const month = c.reference_date?.slice(0, 7)
            if (!month) continue
            byMonth[month] = (byMonth[month] || 0) + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0)
        }
        return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, sales]) => ({ month, sales }))
    }, [checkins])

    const handleExport = useCallback(async () => {
        const { exportToExcel } = await import('@/lib/export')
        const rows = checkins.map(c => ({
            Data: c.reference_date,
            Vendas: (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0),
            Leads: c.leads_prev_day || 0,
            Agendamentos: (c.agd_cart_prev_day || 0) + (c.agd_net_prev_day || 0),
            Visitas: c.visit_prev_day || 0,
        }))
        exportToExcel(rows, `BI_Performance_${format(new Date(), 'yyyy-MM')}`)
        toast.success('BI exportado!')
    }, [checkins])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([fetchCheckins(), fetchGoals(), fetchMetaRules()])
        setIsRefetching(false)
        toast.success('Performance sincronizada!')
    }, [fetchCheckins, fetchGoals, fetchMetaRules])

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Calculando Matriz BI...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Análise de <span className="text-mx-green-700">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">BUSINESS INTELLIGENCE • LIVE AUDIT MX</Typography>
                </div>
                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-mx-xs px-6 h-mx-14 rounded-mx-full border border-border-default bg-white shadow-mx-sm">
                        <Calendar size={18} className="text-brand-primary" />
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Ciclo {format(new Date(), 'yyyy')}</Typography>
                    </div>
                    <Button variant="secondary" onClick={handleExport} className="h-mx-14 px-8 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest text-mx-tiny">
                        <Download size={18} className="mr-2" /> EXPORTAR BI
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {[
                    { title: 'Volume Bruto', value: metrics.currentSales, trend: `${metrics.reaching}%`, icon: Zap, tone: 'brand' as const },
                    { title: 'Meta Mensal', value: metrics.teamGoal, trend: 'Alvo', icon: Target, tone: 'info' as const },
                    { title: 'Projeção MX', value: metrics.projection, trend: 'Predictive', icon: TrendingUp, tone: 'success' as const },
                ].map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-mx-lg border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12" />
                            <div className="flex items-center gap-mx-md relative z-10">
                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                                    'bg-status-success-surface border-mx-emerald-100 text-status-success'
                                )}>
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                                <div className="flex-1">
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase font-black tracking-widest text-mx-micro">{stat.title}</Typography>
                                    <div className="flex items-center justify-between">
                                        <Typography variant="h1" className="text-3xl tabular-nums leading-none">{stat.value}</Typography>
                                        <Badge variant={stat.tone} className="text-mx-micro px-3 py-1 font-black shadow-sm">{stat.trend}</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-32">
                <section className="lg:col-span-8">
                    <Card className="h-full border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl uppercase">Evolução de Sell-out</CardTitle>
                                <CardDescription className="uppercase tracking-widest font-black text-mx-micro mt-1 opacity-60">VOLUME CONSOLIDADO MENSAL</CardDescription>
                            </div>
                            <Badge variant="brand" className="animate-pulse px-4 py-1.5 rounded-mx-full">LIVE MATRIX</Badge>
                        </CardHeader>
                        <CardContent className="p-mx-10" style={{ height: 'var(--height-mx-chart)' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-xl)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                                        <Area type="monotone" dataKey="sales" stroke="var(--color-brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" dot={{ r: 6, fill: 'var(--color-brand-primary)', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, fill: 'var(--color-brand-primary)', stroke: '#fff', strokeWidth: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Typography variant="caption" tone="muted">Nenhum dado disponível.</Typography>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 md:p-14 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden flex-1 group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/10 rounded-mx-full blur-mx-xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner mb-10 transform group-hover:rotate-6 transition-transform"><Activity size={32} /></div>
                                <Typography variant="h2" tone="white" className="text-3xl leading-none mb-4 uppercase tracking-tighter">Saúde da Loja</Typography>
                                <Typography variant="p" tone="white" className="opacity-60 text-xs font-bold uppercase tracking-mx-wide italic leading-relaxed">"Ritmo operacional sincronizado com a meta projetada."</Typography>
                            </div>
                            <div className="pt-14 border-t border-white/10 mt-14 space-y-mx-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <Typography variant="caption" tone="white" className="font-black uppercase tracking-widest mb-2 block">Eficiência Real</Typography>
                                        <Typography variant="h1" tone="white" className="text-7xl tabular-nums leading-none tracking-tighter">{metrics.reaching}%</Typography>
                                    </div>
                                    <Badge variant="outline" className="text-white border-white/20 mb-2 uppercase font-black">{metrics.reaching >= 80 ? 'TARGET OK' : 'ATENÇÃO'}</Badge>
                                </div>
                                <div className="h-mx-sm w-full bg-white/5 rounded-mx-full overflow-hidden p-mx-tiny shadow-inner border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(metrics.reaching, 100)}%` }} transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full bg-white rounded-mx-full shadow-mx-glow-white transition-all duration-1000" 
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
