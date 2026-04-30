import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw, Users, Globe, Eye, Search, ArrowUpDown, Filter, Calendar, X, Check, Shield, Store
} from 'lucide-react'
import { supabase as originalSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { toast } from 'sonner'
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getOperationalStatus, getDiasInfo, calcularProjecao } from '@/lib/calculations'
import { PageHeader } from '@/components/molecules/PageHeader'

type StoreDiagnostic = { id: string; name: string; leads: number; agd: number; vis: number; sales: number; goal: number; gap: number; proj: number; ritmo: number; efficiency: number; sellers: number; checkedInToday: number; disciplinePct: number }

type SortConfig = {
    key: keyof StoreDiagnostic;
    direction: 'asc' | 'desc';
}

type Timeframe = 'hoje' | 'ontem' | 'semanal' | 'mensal' | 'personalizada'

export default function PainelConsultor() {
    const navigate = useNavigate()
    const { setActiveStoreId } = useAuth()
    const { metas, loading: goalsLoading } = useAllStoreGoals()
    const { notifications } = useNotifications()
    
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isTriggering, setIsTriggering] = useState<string | null>(null)

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'critical' | 'target'>('all')
    const [timeframe, setTimeframe] = useState<Timeframe>('mensal')
    const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })
    const [showCustomPicker, setShowCustomPicker] = useState(false)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sales', direction: 'desc' })

    const handleStoreClick = (storeId: string, storeName: string) => {
        setActiveStoreId(storeId)
        const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        navigate(`/loja/${slug}`)
        toast.info('Unidade selecionada para monitoramento.')
    }

    const triggerReport = async (type: 'matinal' | 'semanal' | 'mensal') => {
        setIsTriggering(type)
        try {
            const { data: { session } } = await originalSupabase.auth.getSession()
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relatorio-${type}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                toast.success(`Relatório ${type} disparado com sucesso!`)
            } else {
                const err = await response.json()
                toast.error(`Falha ao disparar: ${err.error || response.statusText}`)
            }
        } catch (err) {
            toast.error('Erro de conexão com o servidor de automação.')
        } finally {
            setIsTriggering(null)
        }
    }

    const calculateRange = (tf: Timeframe) => {
        const now = new Date()
        let start = now
        let end = now

        switch (tf) {
            case 'hoje':
                start = startOfDay(now); end = endOfDay(now); break
            case 'ontem':
                const yesterday = subDays(now, 1); start = startOfDay(yesterday); end = endOfDay(yesterday); break
            case 'semanal':
                start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break
            case 'mensal':
                start = startOfMonth(now); end = endOfMonth(now); break
            case 'personalizada':
                return customRange
        }

        return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
    }

    const fetchNetworkSnapshot = useCallback(async (isManual = false) => {
        if (isManual) setIsRefetching(true)
        else setNetworkLoading(true)

        try {
            const range = calculateRange(timeframe)
            const yesterdayDate = new Date()
            yesterdayDate.setDate(yesterdayDate.getDate() - 1)
            const yesterday = yesterdayDate.toISOString().split('T')[0]

            let allCheckins: any[] = [];
            let from = 0;
            while (true) {
                const { data, error } = await originalSupabase.from('lancamentos_diarios')
                    .select('*')
                    .gte('reference_date', range.start)
                    .lte('reference_date', range.end)
                    .range(from, from + 999);
                
                if (error) throw error;
                if (!data || data.length === 0) break;
                allCheckins = allCheckins.concat(data);
                if (data.length < 1000) break;
                from += 1000;
            }

            const [
                { data: allStores },
                { data: sellers },
                { data: todayCheckins },
            ] = await Promise.all([
                originalSupabase.from('lojas').select('id, name'),
                originalSupabase.from('vendedores_loja').select('*').eq('is_active', true),
                originalSupabase.from('lancamentos_diarios').select('store_id, seller_user_id').eq('reference_date', yesterday),
            ])

            const salesMap: Record<string, any> = {}
            for (const checkin of allCheckins) {
                const sid = checkin.store_id
                if (!salesMap[sid]) salesMap[sid] = { total: 0, leads: 0, agd: 0, vis: 0 }
                salesMap[sid].total += Number(checkin.vnd_net_prev_day || 0) + Number(checkin.vnd_porta_prev_day || 0) + Number(checkin.vnd_cart_prev_day || 0)
                salesMap[sid].leads += Number(checkin.leads_prev_day || 0)
                salesMap[sid].agd += Number(checkin.agd_net_today || 0) + Number(checkin.agd_cart_today || 0)
                salesMap[sid].vis += Number(checkin.visit_prev_day || 0)
            }

            const sellerMap = new Map<string, number>()
            for (const m of sellers || []) sellerMap.set(m.store_id, (sellerMap.get(m.store_id) || 0) + 1)

            const checkedInMap = new Map<string, number>()
            for (const c of todayCheckins || []) checkedInMap.set(c.store_id, (checkedInMap.get(c.store_id) || 0) + 1)

            const diagnosticsMap: Record<string, StoreDiagnostic> = {}
            const dias = getDiasInfo(yesterday)
            const daysElapsed = dias.decorridos
            const totalDays = dias.total

            for (const store of (allStores || [])) {
                const s = salesMap[store.id] || { total: 0, leads: 0, agd: 0, vis: 0 }
                const goal = metas.find(item => item.store_id === store.id)?.target || 0
                const proj = timeframe === 'mensal' ? calcularProjecao(s.total, daysElapsed, totalDays) : s.total
                const numSellers = sellerMap.get(store.id) || 0
                const numCheckedIn = checkedInMap.get(store.id) || 0
                
                const targetToday = (goal / totalDays) * daysElapsed
                const efficiency = targetToday > 0 ? (s.total / targetToday) * 100 : 100
                const ritmoNominal = Math.max(0, (goal - s.total) / Math.max(dias.restantes, 1))

                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, 
                    sales: s.total, leads: s.leads, agd: s.agd, vis: s.vis,
                    goal, 
                    gap: timeframe === 'mensal' ? Math.max(goal - s.total, 0) : 0,
                    proj,
                    ritmo: Math.round(ritmoNominal * 10) / 10,
                    efficiency: Math.round(efficiency),
                    sellers: numSellers,
                    checkedInToday: numCheckedIn,
                    disciplinePct: numSellers > 0 ? (numCheckedIn / numSellers) * 100 : 100
                }
            }
            setDiagnostics(diagnosticsMap)
        } finally { setNetworkLoading(false); setIsRefetching(false) }
    }, [metas, timeframe])

    useEffect(() => { if (!goalsLoading) fetchNetworkSnapshot() }, [goalsLoading, fetchNetworkSnapshot])

    const handleSort = (key: keyof StoreDiagnostic) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }))
    }

    const filteredAndSortedStores = useMemo(() => {
        let result = Object.values(diagnostics)
        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(s => s.name.toLowerCase().includes(lower))
        }
        if (statusFilter !== 'all') {
            result = result.filter(s => {
                const status = getOperationalStatus(s.efficiency, s.disciplinePct)
                if (statusFilter === 'alert') return status.label.includes('ALERTA')
                if (statusFilter === 'critical') return status.label === 'CRÍTICO'
                if (statusFilter === 'target') return status.label === 'NO RITMO' || status.label === 'EXCELÊNCIA'
                return true
            })
        }
        result.sort((a, b) => {
            const valA = a[sortConfig.key]; const valB = b[sortConfig.key]
            if (typeof valA === 'string' && typeof valB === 'string') return sortConfig.direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB)
            return sortConfig.direction === 'desc' ? (valB as number) - (valA as number) : (valA as number) - (valB as number)
        })
        return result
    }, [diagnostics, searchTerm, statusFilter, sortConfig])

    const globalStats = useMemo(() => {
        const dVals = Object.values(diagnostics)
        const totalSales = dVals.reduce((sum, item) => sum + item.sales, 0)
        const totalGoal = dVals.reduce((sum, item) => sum + item.goal, 0)
        const totalGap = dVals.reduce((sum, item) => sum + item.gap, 0)
        const totalLeads = dVals.reduce((sum, item) => sum + item.leads, 0)
        const totalAgd = dVals.reduce((sum, item) => sum + item.agd, 0)
        const totalVis = dVals.reduce((sum, item) => sum + item.vis, 0)
        return { totalSales, totalGoal, totalGap, totalLeads, totalAgd, totalVis, globalRitmo: totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0 }
    }, [diagnostics])

    if (goalsLoading || networkLoading) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500 overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-mx-64" />
                    <Skeleton className="h-mx-xs w-mx-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-64 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-lg shrink-0">
                <Skeleton className="h-mx-48 rounded-mx-4xl" />
                <Skeleton className="h-mx-48 rounded-mx-4xl" />
                <Skeleton className="h-mx-48 rounded-mx-4xl" />
                <Skeleton className="h-mx-48 rounded-mx-4xl" />
            </div>

            <div className="flex-1 mt-mx-lg">
                <Skeleton className="h-full w-full rounded-mx-4xl" />
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative" id="main-content">
            
            <PageHeader 
                title={<span>Rede <span className="text-brand-primary">Operacional</span></span>}
                description={
                    <div className="flex items-center gap-mx-sm">
                        <Badge variant="danger" className="px-4 py-1 font-black shadow-mx-sm border-none">
                            GAP GLOBAL: {globalStats.totalGap} UNIDADES
                        </Badge>
                        <span className="opacity-40 font-black uppercase tracking-mx-widest text-mx-nano">Matriz de Governança MX • {filteredAndSortedStores.length} LOJAS</span>
                    </div>
                }
                actions={
                    <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                        <nav className="flex items-center gap-mx-tiny bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm relative h-mx-14 px-3">
                            <Calendar size={14} className="text-text-tertiary ml-2 mr-1" />
                            {(['hoje', 'ontem', 'semanal', 'mensal'] as const).map((t) => (
                                <Button 
                                    key={t}
                                    variant={timeframe === t ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setTimeframe(t)}
                                    className="rounded-mx-full px-4 h-mx-10 uppercase font-black text-mx-nano tracking-widest"
                                >
                                    {t}
                                </Button>
                            ))}
                            <Button
                                variant={timeframe === 'personalizada' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setShowCustomPicker(!showCustomPicker)}
                                className="rounded-mx-full px-4 h-mx-10 uppercase font-black text-mx-nano tracking-widest"
                            >
                                Custom
                            </Button>

                            <AnimatePresence>
                                {showCustomPicker && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-4 right-mx-0 z-50">
                                        <Card className="p-mx-lg min-w-mx-card-sm shadow-mx-elite border-none bg-white/95 backdrop-blur-xl rounded-mx-3xl">
                                            <header className="flex items-center justify-between mb-8">
                                                <Typography variant="caption" tone="muted" className="font-black uppercase tracking-mx-widest">Período Customizado</Typography>
                                                <Button variant="ghost" size="sm" onClick={() => setShowCustomPicker(false)} className="w-mx-10 h-mx-10 p-mx-0 rounded-mx-full"><X size={16} /></Button>
                                            </header>
                                            <div className="space-y-mx-md">
                                                <div className="space-y-mx-xs">
                                                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest ml-1">Início</Typography>
                                                    <Input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))} className="!h-12 !px-4 uppercase font-black" />
                                                </div>
                                                <div className="space-y-mx-xs">
                                                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest ml-1">Fim</Typography>
                                                    <Input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))} className="!h-12 !px-4 uppercase font-black" />
                                                </div>
                                                <Button onClick={() => { setTimeframe('personalizada'); setShowCustomPicker(false); fetchNetworkSnapshot() }} className="w-full h-mx-14 shadow-mx-lg font-black uppercase text-xs tracking-widest rounded-mx-xl">
                                                    APLICAR PERÍODO
                                                </Button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </nav>

                        <div className="flex items-center gap-mx-sm">
                            <Button variant="outline" size="icon" onClick={() => fetchNetworkSnapshot(true)} className="rounded-mx-xl shadow-mx-sm h-mx-14 w-mx-14 bg-white border-border-default">
                                <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                            </Button>
                            <nav className="flex items-center gap-mx-tiny bg-mx-black p-mx-tiny rounded-mx-full shadow-mx-xl border border-white/10 h-mx-14 px-3">
                                {(['matinal', 'semanal', 'mensal'] as const).map((r) => (
                                    <Button 
                                        key={r} variant="ghost" size="sm" 
                                        onClick={() => triggerReport(r)} 
                                        disabled={isTriggering !== null} 
                                        className="rounded-mx-full px-5 h-mx-10 text-white hover:bg-white/10 uppercase font-black text-mx-nano tracking-widest"
                                    >
                                        {isTriggering === r ? <RefreshCw size={12} className="animate-spin" /> : r}
                                    </Button>
                                ))}
                            </nav>
                        </div>
                    </div>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="bg-mx-black border-none p-mx-xl shadow-mx-elite text-white rounded-mx-4xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-transparent to-transparent opacity-50" />
                    <div className="relative z-10">
                        <Typography variant="tiny" tone="brand" className="mb-4 block font-black uppercase tracking-mx-widest opacity-60">Venda {timeframe.toUpperCase()}</Typography>
                        <div className="flex items-baseline gap-mx-xs">
                            <Typography variant="h1" tone="white" className="text-6xl font-mono-numbers tracking-tighter font-black">{globalStats.totalSales}</Typography>
                            {timeframe === 'mensal' && <Typography variant="h3" tone="success" className="text-2xl font-black">+{globalStats.globalRitmo}%</Typography>}
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <Typography variant="tiny" tone="white" className="opacity-30 tracking-mx-widest block font-black uppercase text-mx-nano">META REDE: {globalStats.totalGoal}</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-mx-xl border-none shadow-mx-lg bg-white/50 backdrop-blur-2xl rounded-mx-4xl flex flex-col justify-between group">
                    <Typography variant="tiny" tone="muted" className="mb-6 block font-black uppercase tracking-mx-widest opacity-40">Escoamento Rede</Typography>
                    <div className="grid grid-cols-3 gap-mx-md">
                        <div className="text-center group-hover:scale-110 transition-transform">
                            <Typography variant="h1" className="text-3xl font-mono-numbers mb-1 tracking-tighter font-black">{globalStats.totalLeads}</Typography>
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest text-mx-micro opacity-60">Leads</Typography>
                        </div>
                        <div className="text-center group-hover:scale-110 transition-transform delay-75">
                            <Typography variant="h1" className="text-3xl font-mono-numbers mb-1 tracking-tighter font-black text-status-info">{globalStats.totalAgd}</Typography>
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest text-mx-micro opacity-60">Agd</Typography>
                        </div>
                        <div className="text-center group-hover:scale-110 transition-transform delay-150">
                            <Typography variant="h1" className="text-3xl font-mono-numbers mb-1 tracking-tighter font-black">{globalStats.totalVis}</Typography>
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-micro opacity-60">Vis</Typography>
                        </div>
                    </div>
                    <div className="mt-8 h-mx-px bg-border-default opacity-50" />
                </Card>

                <Card className="p-mx-xl flex flex-col justify-between border-none shadow-mx-lg bg-white/50 backdrop-blur-2xl rounded-mx-4xl relative overflow-hidden group">
                    <div className="absolute -right-mx-lg -top-mx-lg w-mx-32 h-mx-32 bg-status-error-surface rounded-mx-full blur-mx-4xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Typography variant="tiny" tone="error" className="mb-4 font-black uppercase tracking-mx-widest opacity-60">Unidades Críticas</Typography>
                    <div className="flex items-baseline gap-mx-sm">
                        <Typography variant="h1" tone="error" className="text-6xl font-mono-numbers tracking-tighter font-black">
                            {Object.values(diagnostics).filter(s => getOperationalStatus(s.ritmo, s.disciplinePct).label === 'CRÍTICO').length}
                        </Typography>
                        <AlertTriangle className="text-status-error opacity-20" size={32} />
                    </div>
                    <Typography variant="tiny" tone="error" className="mt-6 font-black uppercase tracking-mx-widest text-mx-nano italic">Ação Imediata Necessária</Typography>
                </Card>

                <Card className="p-mx-xl flex flex-col justify-between border-none shadow-mx-lg bg-white/50 backdrop-blur-2xl rounded-mx-4xl relative overflow-hidden group">
                    <div className="absolute -right-mx-lg -top-mx-lg w-mx-32 h-mx-32 bg-status-success-surface rounded-mx-full blur-mx-4xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Typography variant="tiny" tone="success" className="mb-4 font-black uppercase tracking-mx-widest opacity-60">Saúde Disciplinar</Typography>
                    <div className="flex items-baseline gap-mx-sm">
                        <Typography variant="h1" tone="success" className="text-6xl font-mono-numbers tracking-tighter font-black">
                            {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                        </Typography>
                        <Shield className="text-status-success opacity-20" size={32} />
                    </div>
                    <Typography variant="tiny" tone="success" className="mt-6 font-black uppercase tracking-mx-widest text-mx-nano italic">Aderência aos Check-ins</Typography>
                </Card>
            </div>

            <Card className="w-full mb-32 shadow-mx-elite border-none bg-white/50 backdrop-blur-2xl rounded-mx-4xl overflow-hidden">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-mx-lg p-mx-xl border-b border-white/20">
                    <div className="flex items-center gap-mx-md">
                        <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-xl"><Activity size={28} /></div>
                        <div>
                            <CardTitle className="text-3xl uppercase tracking-tighter font-black">Malha de Performance</CardTitle>
                            <CardDescription className="font-black uppercase tracking-mx-widest mt-1 text-mx-tiny opacity-40">Monitoramento Predictivo de Unidades.</CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-mx-sm">
                        <div className="relative group w-full sm:w-mx-sidebar-expanded">
                            <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" />
                            <Input placeholder="LOCALIZAR UNIDADE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-12 !h-14 uppercase font-black tracking-mx-widest !text-xs rounded-mx-xl bg-white border-border-default shadow-mx-sm" />
                        </div>
                        <div className="flex items-center gap-mx-tiny bg-mx-black/5 p-mx-tiny rounded-mx-xl h-mx-14 shadow-inner px-2">
                            {(['all', 'alert', 'critical'] as const).map(f => (
                                <Button key={f} variant={statusFilter === f ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter(f)} className="h-mx-10 rounded-mx-lg px-6 uppercase font-black text-mx-nano tracking-widest">
                                    {f === 'all' ? 'Todos' : f === 'alert' ? 'Alertas' : 'Críticos'}
                                </Button>
                            ))}
                        </div>
                        <Button asChild variant="mx-elite" className="h-mx-14 px-8 shadow-mx-xl uppercase font-black text-mx-tiny tracking-mx-widest rounded-mx-xl">
                            <Link to="/lojas"><Store size={18} className="mr-2" /> GESTÃO LOJAS</Link>
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-mx-table-wide">
                        <thead>
                            <tr className="uppercase tracking-mx-widest border-b border-border-default bg-mx-black/5">
                                <th className="pl-12 py-6 cursor-pointer hover:text-brand-primary transition-colors" onClick={() => handleSort('name')}>
                                    <Typography variant="tiny" className="font-black">Unidade</Typography>
                                </th>
                                <th className="px-6 py-6 text-center cursor-pointer" onClick={() => handleSort('leads')}><Typography variant="tiny" className="font-black">Leads</Typography></th>
                                <th className="px-6 py-6 text-center cursor-pointer" onClick={() => handleSort('agd')}><Typography variant="tiny" className="font-black">Agend.</Typography></th>
                                <th className="px-6 py-6 text-center cursor-pointer" onClick={() => handleSort('vis')}><Typography variant="tiny" className="font-black">Visitas</Typography></th>
                                <th className="px-6 py-6 text-center cursor-pointer" onClick={() => handleSort('sales')}><Typography variant="tiny" tone="brand" className="font-black">Vendas</Typography></th>
                                <th className="px-6 py-6 text-center"><Typography variant="tiny" className="font-black opacity-40">Meta</Typography></th>
                                <th className="px-6 py-6 text-center cursor-pointer" onClick={() => handleSort('gap')}><Typography variant="tiny" tone="error" className="font-black">Gap</Typography></th>
                                <th className="px-6 py-6 text-center cursor-pointer" onClick={() => handleSort('proj')}><Typography variant="tiny" tone="brand" className="font-black">Projeção</Typography></th>
                                <th className="px-6 py-6 text-center"><Typography variant="tiny" className="font-black">Ritmo</Typography></th>
                                <th className="px-6 py-6 text-center"><Typography variant="tiny" className="font-black">Status</Typography></th>
                                <th className="pr-12 py-6 text-center"><Typography variant="tiny" className="font-black">Disciplina</Typography></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {filteredAndSortedStores.map((store, i) => {
                                const status = getOperationalStatus(store.ritmo, store.disciplinePct)
                                return (
                                    <motion.tr 
                                        key={store.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="hover:bg-white/40 transition-all group h-mx-28 cursor-pointer"
                                        onClick={() => handleStoreClick(store.id, store.name)}
                                    >
                                        <td className="pl-12">
                                            <div className="flex items-center gap-mx-md">
                                                <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center font-black text-text-primary text-xl group-hover:bg-mx-black group-hover:text-white group-hover:border-mx-black transition-all shadow-mx-sm uppercase" aria-hidden="true">{store.name.charAt(0)}</div>
                                                <Typography variant="h3" className="text-lg group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{store.name}</Typography>
                                            </div>
                                        </td>
                                        <td className="px-6 text-center font-black text-lg font-mono-numbers text-text-primary opacity-60">{store.leads}</td>
                                        <td className="px-6 text-center font-black text-lg font-mono-numbers text-status-info">{store.agd}</td>
                                        <td className="px-6 text-center font-black text-lg font-mono-numbers text-text-primary opacity-60">{store.vis}</td>
                                        <td className="px-6 text-center">
                                            <Typography variant="h1" className="text-3xl font-mono-numbers text-brand-primary font-black tracking-tighter">{store.sales}</Typography>
                                        </td>
                                        <td className="px-6 text-center font-black text-sm font-mono-numbers text-text-tertiary opacity-40">{store.goal}</td>
                                        <td className="px-6 text-center font-black text-xl font-mono-numbers text-status-error">{store.gap}</td>
                                        <td className="px-6 text-center font-black text-xl font-mono-numbers text-brand-primary shadow-mx-glow-brand-sm">{store.proj}</td>
                                        <td className="px-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <Typography variant="mono" className="text-xl font-black text-mx-black leading-none">{store.ritmo}</Typography>
                                                <Typography variant="tiny" tone="muted" className="font-black uppercase text-mx-micro mt-1 opacity-40">VND/DIA</Typography>
                                            </div>
                                        </td>
                                        <td className="px-6 text-center">
                                            <Badge variant={status.label === 'CRÍTICO' ? 'danger' : status.label === 'NO RITMO' ? 'success' : 'warning'} className="px-4 py-1.5 font-black shadow-sm uppercase border-none text-mx-nano tracking-widest">
                                                {status.label}
                                            </Badge>
                                            <Typography variant="tiny" tone="muted" className="font-black block uppercase text-mx-micro mt-1 opacity-40">{store.efficiency}% EFIC.</Typography>
                                        </td>
                                        <td className="pr-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <Typography variant="mono" tone={store.checkedInToday < store.sellers ? 'error' : 'success'} className="text-lg font-black leading-none">
                                                    {store.checkedInToday}/{store.sellers}
                                                </Typography>
                                                <Typography variant="tiny" tone="muted" className="font-black tracking-mx-widest uppercase text-mx-micro mt-1 opacity-40">{Math.round(store.disciplinePct)}% OK</Typography>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </main>
    );
}
