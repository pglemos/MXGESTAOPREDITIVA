import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw, Users, Globe, Eye, Search, ArrowUpDown, Filter, Calendar, X, Check
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
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getOperationalStatus, getDiasInfo, calcularProjecao } from '@/lib/calculations'

type StoreDiagnostic = { id: string; name: string; leads: number; agd: number; vis: number; sales: number; goal: number; gap: number; proj: number; ritmo: number; efficiency: number; sellers: number; checkedInToday: number; disciplinePct: number }

type SortConfig = {
    key: keyof StoreDiagnostic;
    direction: 'asc' | 'desc';
}

type Timeframe = 'hoje' | 'ontem' | 'semanal' | 'mensal' | 'personalizada'

export default function PainelConsultor() {
    const navigate = useNavigate()
    const { setActiveStoreId } = useAuth()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
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
                const { data, error } = await originalSupabase.from('daily_checkins')
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
                originalSupabase.from('stores').select('id, name'),
                originalSupabase.from('store_sellers').select('*').eq('is_active', true),
                originalSupabase.from('daily_checkins').select('store_id, seller_user_id').eq('reference_date', yesterday),
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
                const goal = goals.find(item => item.store_id === store.id)?.target || 0
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
    }, [goals, timeframe])

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
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-mx-64" />
                    <Skeleton className="h-mx-xs w-mx-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-64 rounded-mx-full" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-full" />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-lg shrink-0">
                <Skeleton className="h-mx-xl rounded-mx-2xl" />
                <Skeleton className="h-mx-xl rounded-mx-2xl" />
                <Skeleton className="h-mx-xl rounded-mx-2xl" />
                <Skeleton className="h-mx-xl rounded-mx-2xl" />
            </div>

            <Card className="p-mx-10 bg-white/50 border-dashed border-2">
                <div className="flex justify-between mb-8">
                    <Skeleton className="h-mx-sm w-mx-48" />
                    <Skeleton className="h-mx-sm w-mx-32" />
                </div>
                <div className="space-y-mx-sm">
                    <Skeleton className="h-mx-md w-full rounded-mx-md" />
                    <Skeleton className="h-mx-md w-full rounded-mx-md" />
                    <Skeleton className="h-mx-md w-full rounded-mx-md" />
                    <Skeleton className="h-mx-md w-full rounded-mx-md" />
                    <Skeleton className="h-mx-md w-full rounded-mx-md" />
                </div>
            </Card>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            {/* Header Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-xs">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Rede <Typography as="span" className="text-brand-primary">Operacional</Typography></Typography>
                    </div>
                    <div className="flex items-center gap-mx-sm pl-6">
                        <Badge variant="danger" className="px-4 py-1 font-black">
                            <Typography variant="tiny" as="span" className="font-black">Gap Global: {globalStats.totalGap} UNIDADES</Typography>
                        </Badge>
                        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Matriz de Governança MX • {filteredAndSortedStores.length} LOJAS</Typography>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-mx-xs shrink-0">
                    <nav className="flex items-center gap-mx-tiny bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm relative" aria-label="Filtro de Período">
                        <Calendar size={14} className="text-text-tertiary ml-3 mr-1" aria-hidden="true" />
                        {(['hoje', 'ontem', 'semanal', 'mensal'] as const).map((t) => (
                            <Button 
                                key={t}
                                variant={timeframe === t ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTimeframe(t)}
                                className="rounded-mx-full px-4 h-mx-lg uppercase font-black"
                                aria-pressed={timeframe === t}
                            >
                                <Typography variant="tiny" as="span" className="font-black">{t}</Typography>
                            </Button>
                        ))}
                        <Button
                            variant={timeframe === 'personalizada' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setShowCustomPicker(!showCustomPicker)}
                            className="rounded-mx-full px-4 h-mx-lg uppercase font-black"
                            aria-expanded={showCustomPicker}
                        >
                            <Typography variant="tiny" as="span" className="font-black">Custom</Typography>
                        </Button>

                        <AnimatePresence>
                            {showCustomPicker && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-4 right-mx-0 z-50">
                                    <Card className="p-mx-md min-w-mx-card-sm shadow-mx-xl border-none">
                                        <header className="flex items-center justify-between mb-6">
                                            <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Período Customizado</Typography>
                                            <Button variant="ghost" size="sm" onClick={() => setShowCustomPicker(false)} className="w-mx-lg h-mx-lg p-mx-0 rounded-mx-full" aria-label="Fechar seletor"><X size={16} /></Button>
                                        </header>
                                        <div className="space-y-mx-sm">
                                            <div className="space-y-mx-xs">
                                                <Typography variant="tiny" tone="muted" as="label" htmlFor="start-date" className="font-black uppercase tracking-widest ml-1">Início</Typography>
                                                <Input id="start-date" type="date" value={customRange.start} onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))} className="!h-10 !px-4 !text-xs font-black" />
                                            </div>
                                            <div className="space-y-mx-xs">
                                                <Typography variant="tiny" tone="muted" as="label" htmlFor="end-date" className="font-black uppercase tracking-widest ml-1">Fim</Typography>
                                                <Input id="end-date" type="date" value={customRange.end} onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))} className="!h-10 !px-4 !text-xs font-black" />
                                            </div>
                                            <Button onClick={() => { setTimeframe('personalizada'); setShowCustomPicker(false); fetchNetworkSnapshot() }} className="w-full h-mx-xl shadow-mx-lg font-black uppercase text-xs">
                                                <Typography variant="tiny" as="span" className="font-black">APLICAR PERÍODO</Typography>
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </nav>

                    <nav className="flex items-center gap-mx-tiny bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm" aria-label="Disparos de Relatórios">
                        {(['matinal', 'semanal', 'mensal'] as const).map((r) => (
                            <Button 
                                key={r} variant="ghost" size="sm" 
                                onClick={() => triggerReport(r)} 
                                disabled={isTriggering !== null} 
                                className="rounded-mx-full px-4 h-mx-lg text-brand-primary uppercase font-black"
                                aria-label={`Disparar relatório ${r}`}
                            >
                                {isTriggering === r ? <RefreshCw size={12} className="animate-spin" /> : <Typography variant="tiny" as="span" className="font-black">{r}</Typography>}
                            </Button>
                        ))}
                    </nav>

                    <Button variant="outline" size="icon" onClick={() => fetchNetworkSnapshot(true)} className="rounded-mx-xl shadow-mx-sm h-mx-10 w-mx-10 bg-white" aria-label="Sincronizar dados">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {/* Global KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="bg-brand-secondary border-none p-mx-lg shadow-mx-xl text-white">
                    <Typography variant="caption" tone="white" className="opacity-50 mb-4 block font-black uppercase tracking-widest">Venda {timeframe.toUpperCase()}</Typography>
                    <div className="flex items-baseline gap-mx-xs">
                        <Typography variant="h1" tone="white" className="text-5xl font-mono-numbers tracking-tighter">{globalStats.totalSales}</Typography>
                        {timeframe === 'mensal' && <Typography variant="mono" tone="success" className="text-lg font-black">+{globalStats.globalRitmo}%</Typography>}
                    </div>
                    {timeframe === 'mensal' && <Typography variant="caption" tone="white" className="opacity-30 mt-4 tracking-widest block font-black uppercase">META REDE: {globalStats.totalGoal}</Typography>}
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-sm bg-white">
                    <Typography variant="caption" tone="muted" className="mb-6 text-center block font-black uppercase tracking-widest">Escoamento Rede</Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-md">
                        <div className="text-center"><Typography variant="h3" className="text-2xl font-mono-numbers mb-1 tracking-tighter">{globalStats.totalLeads}</Typography><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Leads</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-2xl font-mono-numbers mb-1 tracking-tighter">{globalStats.totalAgd}</Typography><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Agd</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-2xl font-mono-numbers mb-1 tracking-tighter">{globalStats.totalVis}</Typography><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Vis</Typography></div>
                    </div>
                </Card>

                <Card className="p-mx-lg flex flex-col justify-between border-none shadow-mx-sm bg-white">
                    <Typography variant="caption" tone="muted" className="mb-4 font-black uppercase tracking-widest">Unidades Críticas</Typography>
                    <Typography variant="h1" tone="error" className="text-5xl font-mono-numbers tracking-tighter">
                        {Object.values(diagnostics).filter(s => getOperationalStatus(s.ritmo, s.disciplinePct).label === 'CRÍTICO').length}
                    </Typography>
                    <Typography variant="caption" tone="error" className="mt-4 opacity-60 font-black uppercase tracking-widest">Ação Imediata Necessária</Typography>
                </Card>

                <Card className="p-mx-lg flex flex-col justify-between border-none shadow-mx-sm bg-white">
                    <Typography variant="caption" tone="muted" className="mb-4 font-black uppercase tracking-widest">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone="success" className="text-5xl font-mono-numbers tracking-tighter">
                        {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                    </Typography>
                    <Typography variant="caption" tone="success" className="mt-4 opacity-60 font-black uppercase tracking-widest">Aderência aos Check-ins</Typography>
                </Card>
            </div>

            {/* Strategic Map Table */}
            <Card className="w-full mb-20 shadow-mx-lg border-none bg-white">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md pb-10">
                    <div>
                        <CardTitle className="text-3xl uppercase tracking-tighter">Malha de Performance</CardTitle>
                        <CardDescription className="font-black uppercase tracking-widest mt-1">Auditoria em Tempo Real de Unidades MX.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-mx-xs">
                        <div className="relative group w-full sm:w-mx-sidebar-expanded">
                            <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" aria-hidden="true" />
                            <Typography variant="tiny" as="label" htmlFor="search-store" className="sr-only">Buscar Unidade</Typography>
                            <Input id="search-store" placeholder="LOCALIZAR UNIDADE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 !h-12 uppercase font-black tracking-widest !text-xs" />
                        </div>
                        <div className="flex items-center gap-mx-tiny bg-surface-alt border border-border-default p-mx-tiny rounded-mx-md h-mx-xl shadow-inner" role="group" aria-label="Filtro de Status">
                            {(['all', 'alert', 'critical'] as const).map(f => (
                                <Button key={f} variant={statusFilter === f ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter(f)} className="h-full rounded-mx-sm px-4 uppercase font-black">
                                    <Typography variant="tiny" as="span" className="font-black">{f === 'all' ? 'Todos' : f === 'alert' ? 'Alertas' : 'Críticos'}</Typography>
                                </Button>
                            ))}
                        </div>
                        <Button asChild variant="secondary" className="h-mx-xl px-6 shadow-mx-md uppercase">
                            <Link to="/lojas"><Typography variant="tiny" as="span" className="font-black">GESTÃO LOJAS</Typography></Link>
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-mx-elite-wide">
                        <caption className="sr-only">Consolidado operacional de todas as unidades da rede</caption>
                        <thead className="bg-surface-alt/50 border-y border-border-default">
                            <tr className="uppercase tracking-mx-wide">
                                <th 
                                    scope="col" 
                                    className="pl-10 py-6 cursor-pointer hover:text-brand-primary transition-colors" 
                                    onClick={() => handleSort('name')}
                                    aria-sort={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" className="font-black">Unidade</Typography>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-6 text-center cursor-pointer" 
                                    onClick={() => handleSort('leads')}
                                    aria-sort={sortConfig.key === 'leads' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" className="font-black">Leads</Typography>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-6 text-center cursor-pointer" 
                                    onClick={() => handleSort('agd')}
                                    aria-sort={sortConfig.key === 'agd' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" className="font-black">Agend.</Typography>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-6 text-center cursor-pointer" 
                                    onClick={() => handleSort('vis')}
                                    aria-sort={sortConfig.key === 'vis' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" className="font-black">Visitas</Typography>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-6 text-center cursor-pointer" 
                                    onClick={() => handleSort('sales')}
                                    aria-sort={sortConfig.key === 'sales' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" tone="brand" className="font-black">Vendas</Typography>
                                </th>
                                <th scope="col" className="px-4 py-6 text-center"><Typography variant="caption" className="font-black">Meta</Typography></th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-6 text-center cursor-pointer" 
                                    onClick={() => handleSort('gap')}
                                    aria-sort={sortConfig.key === 'gap' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" tone="error" className="font-black">Gap</Typography>
                                </th>
                                <th 
                                    scope="col" 
                                    className="px-4 py-6 text-center cursor-pointer" 
                                    onClick={() => handleSort('proj')}
                                    aria-sort={sortConfig.key === 'proj' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                                >
                                    <Typography variant="caption" tone="brand" className="font-black">Projeção</Typography>
                                </th>
                                <th scope="col" className="px-4 py-6 text-center"><Typography variant="caption" className="font-black">Ritmo</Typography></th>
                                <th scope="col" className="px-4 py-6 text-center"><Typography variant="caption" className="font-black">Status</Typography></th>
                                <th scope="col" className="pr-10 py-6 text-center"><Typography variant="caption" className="font-black">Disciplina</Typography></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredAndSortedStores.map(store => {
                                const status = getOperationalStatus(store.ritmo, store.disciplinePct)
                                return (
                                    <tr 
                                        key={store.id} 
                                        className="hover:bg-brand-primary-surface/10 transition-colors group h-mx-3xl cursor-pointer"
                                        onClick={() => handleStoreClick(store.id, store.name)}
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleStoreClick(store.id, store.name)}
                                        role="button"
                                        aria-label={`Ver detalhes da unidade ${store.name}`}
                                    >
                                        <td className="pl-10">
                                            <div className="flex items-center gap-mx-sm">
                                                <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-lg group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner uppercase" aria-hidden="true">{store.name.charAt(0)}</div>
                                                <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{store.name}</Typography>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-primary">{store.leads}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-primary">{store.agd}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-primary">{store.vis}</td>
                                        <td className="px-4 py-2 text-center font-black text-2xl font-mono-numbers text-brand-primary">{store.sales}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-tertiary">{store.goal}</td>
                                        <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-status-error">{store.gap}</td>
                                        <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-brand-primary">{store.proj}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <Typography variant="mono" className="text-lg font-black">{store.ritmo}</Typography>
                                                <Typography variant="tiny" tone="muted" className="font-black uppercase">VND/DIA</Typography>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <Badge variant={status.label === 'CRÍTICO' ? 'danger' : status.label === 'NO RITMO' ? 'success' : 'warning'} className="px-4 py-1 mb-1 font-black shadow-sm uppercase border-none">
                                                <Typography variant="tiny" as="span" className="font-black">{status.label}</Typography>
                                            </Badge>
                                            <Typography variant="tiny" tone="muted" className="font-black block uppercase">{store.efficiency}% EFIC.</Typography>
                                        </td>
                                        <td className="pr-10 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <Typography variant="mono" tone={store.checkedInToday < store.sellers ? 'error' : 'success'} className="text-base font-black">
                                                    {store.checkedInToday}/{store.sellers}
                                                </Typography>
                                                <Typography variant="tiny" tone="muted" className="font-black tracking-tighter uppercase">{Math.round(store.disciplinePct)}% OK</Typography>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </main>
    )
}
