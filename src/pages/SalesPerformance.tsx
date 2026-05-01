import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Calendar, Download, RefreshCw, 
    Activity, Target, Zap, ArrowRight, UsersRound,
    BriefcaseBusiness, BarChart3, Gauge, Layers3, Database,
    Eye
} from 'lucide-react'
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
    CartesianGrid, BarChart, Bar, Cell, PieChart as RechartsPieChart, Pie, Legend
} from 'recharts'
import { cn, slugify } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useNetworkPerformance } from '@/hooks/useNetworkPerformance'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento } from '@/lib/calculations'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function SalesPerformance() {
    const { role, setActiveStoreId } = useAuth()
    const isAdmin = isPerfilInternoMx(role)
    const navigate = useNavigate()

    if (isAdmin) return <AdminPerformanceV2 />
    return <StorePerformance />
}

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(Math.round(value || 0))
const formatPercent = (value: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0)}%`
const chartPalette = ['#0D3B2E', '#22C55E', '#2563EB', '#F59E0B', '#E11D48', '#64748B']
const roleLabels: Record<string, string> = {
    administrador_geral: 'Admin Master',
    administrador_mx: 'Admin MX',
    consultor_mx: 'Consultoria MX',
    dono: 'Donos',
    gerente: 'Gerentes',
    vendedor: 'Vendedores',
    sem_papel: 'Sem papel',
}

function shortDate(date: string | null) {
    if (!date) return 'Sem atividade'
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
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
        navigate(`/lojas/${slugify(storeName)}`)
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
                            <CardTitle className="text-sm">Classificação por Loja</CardTitle>
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

function AdminPerformanceV2() {
    const { metrics, loading, refetch } = useNetworkPerformance()
    const { setActiveStoreId } = useAuth()
    const navigate = useNavigate()
    const [isRefetching, setIsRefetching] = useState(false)

    const topStores = useMemo(() => metrics.byStore.slice(0, 10), [metrics.byStore])
    const roleData = useMemo(() => metrics.roleBreakdown.map((item) => ({
        name: roleLabels[item.role] || item.role,
        value: item.total,
        active: item.active,
    })), [metrics.roleBreakdown])
    const funnelData = useMemo(() => [
        { name: 'Leads', value: metrics.totalLeads, color: '#2563EB' },
        { name: 'Agend.', value: metrics.totalAgd, color: '#F59E0B' },
        { name: 'Visitas', value: metrics.totalVis, color: '#7C3AED' },
        { name: 'Vendas', value: metrics.totalSales, color: '#22C55E' },
    ], [metrics.totalAgd, metrics.totalLeads, metrics.totalSales, metrics.totalVis])
    const consultingData = useMemo(() => metrics.consultingStatus.length > 0
        ? metrics.consultingStatus.map((item) => ({ name: item.status.replace(/_/g, ' '), value: item.total }))
        : [{ name: 'Sem status', value: 0 }],
    [metrics.consultingStatus])
    const hasHistoricalData = metrics.historicalCheckins > 0

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Matriz executiva sincronizada!')
    }, [refetch])

    const handleExport = useCallback(async () => {
        const { exportToExcel } = await import('@/lib/export')
        const rows = metrics.byStore.map(s => ({
            Loja: s.storeName,
            Ativa: s.active ? 'Sim' : 'Nao',
            'Vendas historicas': s.sales,
            'Vendas mes atual': s.currentMonthSales,
            Meta: s.goal,
            'Atingimento %': s.reaching,
            Leads: s.leads,
            Agendamentos: s.agd,
            Visitas: s.vis,
            'Conv Lead Venda %': s.convLeadVnd,
            'Conv Agenda Venda %': s.convAgdVnd,
            'Conv Visita Venda %': s.convVisVnd,
            'Dias com lancamento': s.checkinDays,
            Vendedores: s.sellers,
            Gerentes: s.managers,
            Donos: s.owners,
            'Ultima atividade': s.lastActivity || '',
        }))
        exportToExcel(rows, `BI_Executivo_Rede_${format(new Date(), 'yyyy-MM-dd')}`)
        toast.success('BI executivo exportado!')
    }, [metrics.byStore])

    const handleStoreClick = useCallback((storeId: string, storeName: string) => {
        setActiveStoreId(storeId)
        navigate(`/lojas/${slugify(storeName)}`)
    }, [setActiveStoreId, navigate])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Carregando matriz executiva da rede...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md sm:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-mx-lg border-b border-border-default pb-8 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">BI Executivo <span className="text-mx-green-700">da Rede</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest leading-relaxed">
                        {metrics.storeCount} lojas | {metrics.totalUsers} usuarios | {metrics.consultingClients} clientes consultoria | historico {shortDate(metrics.period.historyStart)} ate {shortDate(metrics.period.today)}
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
                        <Download size={18} className="mr-2" /> EXPORTAR MATRIZ
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-md shrink-0">
                {[
                    { title: 'Sell-out Historico', value: formatNumber(metrics.historicalSales), trend: `${metrics.historicalCheckins} lancamentos`, icon: Zap, color: 'brand' },
                    { title: 'Meta Consolidada', value: formatNumber(metrics.networkGoal), trend: `${metrics.configuredGoalStores} lojas com meta`, icon: Target, color: 'info' },
                    { title: 'Mes Atual', value: formatNumber(metrics.currentMonthSales), trend: formatPercent(metrics.reaching), icon: Gauge, color: metrics.reaching >= 80 ? 'success' : 'warning' },
                    { title: 'Cobertura de Dados', value: formatPercent(metrics.disciplineRate), trend: `${metrics.storesWithSales}/${metrics.activeStoreCount} lojas com venda`, icon: Database, color: 'success' },
                ].map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-mx-lg border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white min-h-mx-36">
                            <div className="flex items-center gap-mx-md relative z-10">
                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.color === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.color === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                                    stat.color === 'warning' ? 'bg-status-warning-surface border-status-warning/20 text-status-warning' :
                                    'bg-status-success-surface border-mx-emerald-100 text-status-success'
                                )}>
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase font-black tracking-widest text-mx-micro">{stat.title}</Typography>
                                    <Typography variant="h1" className="text-3xl tabular-nums leading-none">{stat.value}</Typography>
                                    <Badge variant={stat.color === 'warning' ? 'warning' : stat.color === 'info' ? 'info' : stat.color === 'success' ? 'success' : 'brand'} className="text-mx-micro px-3 py-1 mt-3 font-black shadow-sm">{stat.trend}</Badge>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg shrink-0">
                <section className="xl:col-span-8">
                    <Card className="h-full border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg md:p-mx-10 flex flex-col md:flex-row md:items-center justify-between gap-mx-md">
                            <div>
                                <CardTitle className="text-xl md:text-2xl uppercase">Evolucao de Sell-out</CardTitle>
                                <CardDescription className="uppercase tracking-widest font-black text-mx-micro mt-1 opacity-60">Historico consolidado da rede | 180 dias</CardDescription>
                            </div>
                            <Badge variant={hasHistoricalData ? 'brand' : 'warning'} className="px-4 py-1.5 rounded-mx-full">{hasHistoricalData ? 'MATRIX LIVE' : 'SEM HISTORICO'}</Badge>
                        </CardHeader>
                        <CardContent className="p-mx-10" style={{ height: 'var(--height-mx-chart)' }}>
                            {metrics.byMonth.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metrics.byMonth} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSalesExecutive" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.24} />
                                                <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-xl)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                                        <Area type="monotone" dataKey="sales" stroke="var(--color-brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSalesExecutive)" dot={{ r: 5, fill: 'var(--color-brand-primary)', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, fill: 'var(--color-brand-primary)', stroke: '#fff', strokeWidth: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Typography variant="caption" tone="muted">Sem historico suficiente para montar grafico.</Typography>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-lg md:p-mx-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden flex-1 group">
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner mb-8 transform group-hover:rotate-6 transition-transform"><Activity size={32} /></div>
                                <Typography variant="h2" tone="white" className="text-3xl leading-none mb-4 uppercase tracking-tighter">Saude Executiva</Typography>
                                <Typography variant="p" tone="white" className="opacity-70 text-xs font-bold uppercase tracking-mx-wide leading-relaxed">Rede completa, base historica, metas, pessoas e consultoria no mesmo cockpit.</Typography>
                            </div>
                            <div className="pt-10 border-t border-white/10 mt-10 space-y-mx-8">
                                <div className="grid grid-cols-2 gap-mx-sm">
                                    <div>
                                        <Typography variant="caption" tone="white" className="font-black uppercase tracking-widest mb-2 block opacity-70">Lojas ativas</Typography>
                                        <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none">{metrics.activeStoreCount}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="caption" tone="white" className="font-black uppercase tracking-widest mb-2 block opacity-70">Vendedores ativos</Typography>
                                        <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none">{metrics.activeSellers}</Typography>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-white/70 text-mx-tiny font-black uppercase tracking-widest mb-3">
                                        <span>Cobertura operacional</span>
                                        <span>{formatPercent(metrics.disciplineRate)}</span>
                                    </div>
                                    <div className="h-mx-sm w-full bg-white/5 rounded-mx-full overflow-hidden p-mx-tiny shadow-inner border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${Math.min(metrics.disciplineRate, 100)}%` }} transition={{ duration: 2, ease: "circOut" }}
                                            className="h-full bg-white rounded-mx-full shadow-mx-glow-white transition-all duration-1000" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg shrink-0">
                <Card className="xl:col-span-5 border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-mx-lg">
                        <CardTitle className="text-lg flex items-center gap-mx-sm"><BarChart3 size={18} className="text-brand-primary" /> Top lojas por sell-out</CardTitle>
                        <CardDescription>Ranking historico com meta, equipe e ultima atividade</CardDescription>
                    </CardHeader>
                    <CardContent className="p-mx-0">
                        <div className="divide-y divide-border-subtle">
                            {topStores.map((store, i) => (
                                <button
                                    key={store.storeId}
                                    type="button"
                                    onClick={() => handleStoreClick(store.storeId, store.storeName)}
                                    className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-mx-sm px-mx-lg py-mx-sm hover:bg-surface-alt/60 transition-colors text-left"
                                >
                                    <span className={cn(
                                        "w-mx-8 h-mx-8 rounded-mx-lg flex items-center justify-center text-mx-nano font-black",
                                        i === 0 ? "bg-status-warning text-white" : i === 1 ? "bg-brand-primary text-white" : i === 2 ? "bg-status-info text-white" : "bg-surface-alt text-text-secondary"
                                    )}>{i + 1}</span>
                                    <span className="min-w-0">
                                        <Typography variant="tiny" className="font-black truncate">{store.storeName}</Typography>
                                        <Typography variant="tiny" tone="muted" className="text-mx-nano uppercase font-black">{store.sellers} vend. | {store.managers} ger. | ult. {shortDate(store.lastActivity)}</Typography>
                                    </span>
                                    <span className="text-right">
                                        <Typography variant="h3" className="text-base font-mono-numbers">{formatNumber(store.sales)}</Typography>
                                        <Typography variant="tiny" tone="muted" className="text-mx-nano uppercase">{formatPercent(store.reaching)}</Typography>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="xl:col-span-7 border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-mx-lg">
                        <CardTitle className="text-lg flex items-center gap-mx-sm"><Target size={18} className="text-brand-primary" /> Comparativo loja x meta</CardTitle>
                        <CardDescription>As 10 maiores lojas com realizado historico e meta mensal vigente</CardDescription>
                    </CardHeader>
                    <CardContent className="h-mx-96 p-mx-lg">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topStores} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                                <XAxis dataKey="storeName" tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 9 }} interval={0} angle={-16} textAnchor="end" height={72} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-xl)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                                <Legend />
                                <Bar dataKey="sales" name="Sell-out" radius={[6, 6, 0, 0]} fill="var(--color-brand-primary)" />
                                <Bar dataKey="goal" name="Meta" radius={[6, 6, 0, 0]} fill="var(--color-status-info)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-mx-lg shrink-0">
                <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-mx-lg">
                        <CardTitle className="text-lg flex items-center gap-mx-sm"><Layers3 size={18} className="text-brand-primary" /> Funil agregado</CardTitle>
                        <CardDescription>Leads ate vendas no historico</CardDescription>
                    </CardHeader>
                    <CardContent className="h-mx-80 p-mx-lg">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-xl)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {funnelData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-3 gap-mx-xs pt-mx-md border-t border-border-subtle">
                            <Badge variant="info" className="justify-center text-mx-nano">{formatPercent(metrics.convLeadAgd)} L-A</Badge>
                            <Badge variant="warning" className="justify-center text-mx-nano">{formatPercent(metrics.convAgdVis)} A-V</Badge>
                            <Badge variant="success" className="justify-center text-mx-nano">{formatPercent(metrics.convVisVnd)} V-V</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-mx-lg">
                        <CardTitle className="text-lg flex items-center gap-mx-sm"><UsersRound size={18} className="text-brand-primary" /> Pessoas e papeis</CardTitle>
                        <CardDescription>Donos, gerentes, vendedores e equipe MX</CardDescription>
                    </CardHeader>
                    <CardContent className="h-mx-80 p-mx-lg">
                        <ResponsiveContainer width="100%" height="70%">
                            <RechartsPieChart>
                                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={3}>
                                    {roleData.map((entry, index) => <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />)}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-xl)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-mx-xs">
                            <Badge variant="outline" className="justify-center text-mx-nano">{metrics.owners} donos</Badge>
                            <Badge variant="outline" className="justify-center text-mx-nano">{metrics.managers} gerentes</Badge>
                            <Badge variant="outline" className="justify-center text-mx-nano">{metrics.sellers} vendedores</Badge>
                            <Badge variant="outline" className="justify-center text-mx-nano">{metrics.internalUsers} MX</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-mx-lg">
                        <CardTitle className="text-lg flex items-center gap-mx-sm"><BriefcaseBusiness size={18} className="text-brand-primary" /> Consultoria MX</CardTitle>
                        <CardDescription>Clientes, visitas e execucao PMR</CardDescription>
                    </CardHeader>
                    <CardContent className="p-mx-lg flex flex-col gap-mx-md">
                        <div className="grid grid-cols-2 gap-mx-md">
                            <div className="p-mx-md rounded-mx-2xl bg-surface-alt border border-border-subtle">
                                <Typography variant="tiny" tone="muted" className="uppercase font-black">Clientes</Typography>
                                <Typography variant="h1" className="text-4xl tabular-nums">{metrics.consultingClients}</Typography>
                            </div>
                            <div className="p-mx-md rounded-mx-2xl bg-surface-alt border border-border-subtle">
                                <Typography variant="tiny" tone="muted" className="uppercase font-black">Visitas</Typography>
                                <Typography variant="h1" className="text-4xl tabular-nums">{metrics.consultingVisits}</Typography>
                            </div>
                        </div>
                        <div className="space-y-mx-sm">
                            {consultingData.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between gap-mx-sm">
                                    <div className="flex items-center gap-mx-sm min-w-0">
                                        <span className="w-mx-xs h-mx-xs rounded-full shrink-0" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                                        <Typography variant="tiny" className="uppercase font-black truncate">{item.name}</Typography>
                                    </div>
                                    <Badge variant="outline" className="text-mx-nano">{String(item.value)}</Badge>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-mx-sm mt-auto pt-mx-md border-t border-border-subtle">
                            <Badge variant="success" className="justify-center text-mx-nano">{metrics.completedConsultingVisits} concluidas</Badge>
                            <Badge variant="info" className="justify-center text-mx-nano">{metrics.plannedConsultingVisits} abertas</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-mx-lg bg-white overflow-hidden mb-32">
                <CardHeader className="p-mx-lg flex flex-col md:flex-row md:items-center justify-between gap-mx-md">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-mx-sm"><Eye size={18} className="text-brand-primary" /> Matriz completa de lojas</CardTitle>
                        <CardDescription>Leitura executiva para auditoria visual e tomada de decisao</CardDescription>
                    </div>
                    <Badge variant="brand" className="text-mx-nano">{metrics.byStore.length} linhas</Badge>
                </CardHeader>
                <CardContent className="p-mx-0 overflow-x-auto">
                    <table className="w-full text-left" style={{ minWidth: 960 }}>
                        <thead className="bg-surface-alt/60 border-y border-border-subtle">
                            <tr>
                                {['Loja', 'Sell-out', 'Meta', 'Ating.', 'Leads', 'Agend.', 'Visitas', 'Equipe', 'Ultima atividade', 'Status'].map((head) => (
                                    <th key={head} className="px-mx-md py-mx-sm text-mx-nano font-black uppercase tracking-widest text-text-tertiary">{head}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {metrics.byStore.map((store) => (
                                <tr key={store.storeId} className="hover:bg-surface-alt/40 transition-colors">
                                    <td className="px-mx-md py-mx-sm">
                                        <button type="button" onClick={() => handleStoreClick(store.storeId, store.storeName)} className="font-black uppercase text-text-primary hover:text-brand-primary text-xs">
                                            {store.storeName}
                                        </button>
                                    </td>
                                    <td className="px-mx-md py-mx-sm font-mono-numbers font-black">{formatNumber(store.sales)}</td>
                                    <td className="px-mx-md py-mx-sm font-mono-numbers">{formatNumber(store.goal)}</td>
                                    <td className="px-mx-md py-mx-sm font-mono-numbers">{formatPercent(store.reaching)}</td>
                                    <td className="px-mx-md py-mx-sm font-mono-numbers">{formatNumber(store.leads)}</td>
                                    <td className="px-mx-md py-mx-sm font-mono-numbers">{formatNumber(store.agd)}</td>
                                    <td className="px-mx-md py-mx-sm font-mono-numbers">{formatNumber(store.vis)}</td>
                                    <td className="px-mx-md py-mx-sm text-mx-nano font-black uppercase">{store.sellers}V / {store.managers}G / {store.owners}D</td>
                                    <td className="px-mx-md py-mx-sm text-mx-nano font-black uppercase text-text-tertiary">{shortDate(store.lastActivity)}</td>
                                    <td className="px-mx-md py-mx-sm">
                                        <Badge variant={store.status === 'excellent' ? 'success' : store.status === 'on-track' ? 'info' : store.status === 'attention' ? 'warning' : 'outline'} className="text-mx-nano">
                                            {store.status === 'excellent' ? 'excelencia' : store.status === 'on-track' ? 'no ritmo' : store.status === 'attention' ? 'atencao' : 'sem dados'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
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
