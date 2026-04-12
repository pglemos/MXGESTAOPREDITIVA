import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Activity, Target, Zap, RefreshCw, Globe, Search, Calendar, X, History, TrendingUp, CheckCircle2
} from 'lucide-react'
import { supabase as originalSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { toast } from 'sonner'
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { getOperationalStatus, getDiasInfo, calcularProjecao } from '@/lib/calculations'
import { DataGrid, Column } from '@/components/organisms/DataGrid'

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
        navigate(`/loja/${slug}/${storeId}`)
        toast.info('Unidade selecionada.')
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
            if (response.ok) toast.success(`Relatório ${type} disparado!`)
            else toast.error('Falha ao disparar relatório.')
        } catch (err) {
            toast.error('Erro de conexão.')
        } finally {
            setIsTriggering(null)
        }
    }

    const calculateRange = (tf: Timeframe) => {
        const now = new Date()
        let start = now; let end = now
        switch (tf) {
            case 'hoje': start = startOfDay(now); end = endOfDay(now); break
            case 'ontem': const yesterday = subDays(now, 1); start = startOfDay(yesterday); end = endOfDay(yesterday); break
            case 'semanal': start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break
            case 'mensal': start = startOfMonth(now); end = endOfMonth(now); break
            case 'personalizada': return customRange
        }
        return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
    }

    const fetchNetworkSnapshot = useCallback(async (isManual = false) => {
        if (isManual) setIsRefetching(true)
        else setNetworkLoading(true)

        try {
            const range = calculateRange(timeframe)
            const yesterdayDate = subDays(new Date(), 1)
            const yesterday = format(yesterdayDate, 'yyyy-MM-dd')

            const [
                { data: allCheckins },
                { data: allStores },
                { data: sellers },
                { data: todayCheckins },
            ] = await Promise.all([
                originalSupabase.from('daily_checkins').select('*').gte('reference_date', range.start).lte('reference_date', range.end),
                originalSupabase.from('stores').select('id, name').eq('active', true),
                originalSupabase.from('store_sellers').select('*').eq('is_active', true),
                originalSupabase.from('daily_checkins').select('store_id, seller_user_id').eq('reference_date', yesterday),
            ])

            const salesMap: Record<string, any> = {}
            for (const checkin of (allCheckins || [])) {
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

            for (const store of (allStores || [])) {
                const s = salesMap[store.id] || { total: 0, leads: 0, agd: 0, vis: 0 }
                const goal = goals.find(item => item.store_id === store.id)?.target || 0
                const proj = timeframe === 'mensal' ? calcularProjecao(s.total, dias.decorridos, dias.total) : s.total
                const numSellers = sellerMap.get(store.id) || 0
                const numCheckedIn = checkedInMap.get(store.id) || 0
                const targetToday = (goal / dias.total) * dias.decorridos
                const efficiency = targetToday > 0 ? (s.total / targetToday) * 100 : 100
                const ritmoNominal = Math.max(0, (goal - s.total) / Math.max(dias.restantes, 1))

                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, 
                    sales: s.total, leads: s.leads, agd: s.agd, vis: s.vis,
                    goal, gap: timeframe === 'mensal' ? Math.max(goal - s.total, 0) : 0, proj,
                    ritmo: Math.round(ritmoNominal * 10) / 10,
                    efficiency: Math.round(efficiency),
                    sellers: numSellers, checkedInToday: numCheckedIn,
                    disciplinePct: numSellers > 0 ? (numCheckedIn / numSellers) * 100 : 100
                }
            }
            setDiagnostics(diagnosticsMap)
        } finally { setNetworkLoading(false); setIsRefetching(false) }
    }, [goals, timeframe])

    useEffect(() => { if (!goalsLoading) fetchNetworkSnapshot() }, [goalsLoading, fetchNetworkSnapshot])

    const filteredAndSortedStores = useMemo(() => {
        let result = Object.values(diagnostics)
        if (searchTerm) result = result.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
        if (statusFilter !== 'all') {
            result = result.filter(s => {
                const st = getOperationalStatus(s.efficiency, s.disciplinePct)
                if (statusFilter === 'alert') return st.label.includes('ALERTA')
                if (statusFilter === 'critical') return st.label === 'CRÍTICO'
                if (statusFilter === 'target') return st.label === 'NO RITMO' || st.label === 'EXCELÊNCIA'
                return true
            })
        }
        result.sort((a, b) => {
            const valA = a[sortConfig.key]; const valB = b[sortConfig.key]
            return sortConfig.direction === 'desc' ? (valB as any) > (valA as any) ? 1 : -1 : (valA as any) > (valB as any) ? 1 : -1
        })
        return result
    }, [diagnostics, searchTerm, statusFilter, sortConfig])

    const globalStats = useMemo(() => {
        const dVals = Object.values(diagnostics)
        return {
            totalSales: dVals.reduce((sum, item) => sum + item.sales, 0),
            totalGoal: dVals.reduce((sum, item) => sum + item.goal, 0),
            totalGap: dVals.reduce((sum, item) => sum + item.gap, 0),
            totalLeads: dVals.reduce((sum, item) => sum + item.leads, 0),
            totalAgd: dVals.reduce((sum, item) => sum + item.agd, 0),
            totalVis: dVals.reduce((sum, item) => sum + item.vis, 0),
            globalRitmo: 0 // placeholder
        }
    }, [diagnostics])

    const columns = useMemo<Column<StoreDiagnostic>[]>(() => [
        {
            key: 'name',
            header: 'UNIDADE',
            render: (s) => (
                <div className="flex items-center gap-mx-sm min-w-0">
                    <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center font-black text-lg shrink-0 group-hover:bg-brand-primary group-hover:text-white transition-all uppercase">{s.name.charAt(0)}</div>
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black truncate">{s.name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[8px] sm:text-mx-micro uppercase opacity-40 font-black">{s.checkedInToday}/{s.sellers} OPERACIONAIS</Typography>
                    </div>
                </div>
            )
        },
        { key: 'leads', header: 'LEADS', align: 'center', desktopOnly: true, render: (s) => <span className="opacity-60 tabular-nums">{s.leads}</span> },
        {
            key: 'sales',
            header: timeframe === 'mensal' ? 'MÊS' : 'VND',
            align: 'center',
            render: (s) => <Typography variant="h1" tone="brand" className="text-xl sm:text-3xl font-mono-numbers">{s.sales}</Typography>
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'right',
            render: (s) => {
                const status = getOperationalStatus(s.efficiency, s.disciplinePct)
                return (
                    <div className="flex flex-col items-end">
                        <Badge variant={status.label === 'CRÍTICO' ? 'danger' : status.label.includes('ALERTA') ? 'warning' : 'success'} className="px-3 py-1 rounded-mx-lg font-black text-[8px] sm:text-mx-micro uppercase border-none shadow-sm">
                            {status.label}
                        </Badge>
                        <Typography variant="tiny" tone="muted" className="text-[8px] uppercase mt-1 font-black opacity-40">{s.efficiency}% EFIC.</Typography>
                    </div>
                )
            }
        }
    ], [timeframe])

    if (goalsLoading || networkLoading) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md border-b border-border-default pb-10">
                <Skeleton className="h-mx-14 w-full max-w-mx-2xl" />
                <Skeleton className="h-mx-14 w-48 rounded-mx-xl" />
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-lg shrink-0">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-mx-xl rounded-mx-2xl" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md md:gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="hidden sm:block w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Rede <Typography as="span" className="text-brand-primary">Operacional</Typography></Typography>
                    </div>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-mx-sm mt-1 sm:pl-6">
                        <Badge variant="danger" className="px-4 py-1 font-black text-[10px] uppercase">GAP: {globalStats.totalGap}</Badge>
                        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest text-[8px] sm:text-xs opacity-40">GOVERNANÇA MX • {filteredAndSortedStores.length} LOJAS</Typography>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
                    <nav className="bg-white p-mx-tiny rounded-mx-full shadow-mx-sm border border-border-default flex gap-mx-tiny">
                        {(['hoje', 'ontem', 'semanal', 'mensal'] as const).map((t) => (
                            <Button 
                                key={t} variant={timeframe === t ? 'secondary' : 'ghost'} size="sm"
                                onClick={() => setTimeframe(t)} 
                                className="h-mx-8 sm:h-mx-10 px-3 sm:px-6 rounded-mx-full uppercase font-black tracking-widest text-[10px]"
                            >
                                {t}
                            </Button>
                        ))}
                    </nav>

                    <Button variant="outline" size="icon" onClick={() => fetchNetworkSnapshot(true)} className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white shrink-0">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-md md:gap-mx-lg shrink-0">
                <Card className="bg-brand-secondary border-none p-4 md:p-mx-lg shadow-mx-xl text-white relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-white/5 rounded-mx-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="caption" tone="white" className="opacity-50 mb-2 block font-black uppercase tracking-widest text-[10px]">Venda {timeframe}</Typography>
                    <Typography variant="h1" tone="white" className="text-4xl sm:text-5xl font-mono-numbers tracking-tighter">{globalStats.totalSales}</Typography>
                    <Typography variant="caption" tone="white" className="opacity-30 mt-4 tracking-widest block font-black uppercase text-[8px]">META REDE: {globalStats.totalGoal}</Typography>
                </Card>

                <Card className="p-4 md:p-mx-lg border-none shadow-mx-sm bg-white relative overflow-hidden">
                    <Typography variant="caption" tone="muted" className="mb-6 block font-black uppercase tracking-widest opacity-40 text-center text-[10px]">Escoamento Rede</Typography>
                    <div className="grid grid-cols-1 sm:grid-cols- gap-mx-md">
                        <div className="text-center"><Typography variant="h3" className="text-xl sm:text-2xl font-mono-numbers mb-1">{globalStats.totalLeads}</Typography><Typography variant="tiny" className="font-black uppercase opacity-20 text-[8px]">Leads</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-xl sm:text-2xl font-mono-numbers mb-1">{globalStats.totalAgd}</Typography><Typography variant="tiny" className="font-black uppercase opacity-20 text-[8px]">Agd</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-xl sm:text-2xl font-mono-numbers mb-1">{globalStats.totalVis}</Typography><Typography variant="tiny" className="font-black uppercase opacity-20 text-[8px]">Vis</Typography></div>
                    </div>
                </Card>

                <Card className="p-4 md:p-mx-lg border-none shadow-mx-sm bg-white flex flex-col justify-between">
                    <Typography variant="caption" tone="muted" className="mb-2 font-black uppercase tracking-widest opacity-40 text-[10px]">Unidades Críticas</Typography>
                    <Typography variant="h1" tone="error" className="text-4xl sm:text-5xl font-mono-numbers tracking-tighter">
                        {Object.values(diagnostics).filter(s => getOperationalStatus(s.ritmo, s.disciplinePct).label === 'CRÍTICO').length}
                    </Typography>
                    <Typography variant="caption" tone="error" className="mt-4 opacity-60 font-black uppercase tracking-widest text-[8px]">AÇÃO IMEDIATA</Typography>
                </Card>

                <Card className="p-4 md:p-mx-lg border-none shadow-mx-sm bg-white flex flex-col justify-between">
                    <Typography variant="caption" tone="muted" className="mb-2 font-black uppercase tracking-widest opacity-40 text-[10px]">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone="success" className="text-4xl sm:text-5xl font-mono-numbers tracking-tighter">
                        {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                    </Typography>
                    <Typography variant="caption" tone="success" className="mt-4 opacity-60 font-black uppercase tracking-widest text-[8px]">ADERÊNCIA GLOBAL</Typography>
                </Card>
            </div>

            <Card className="w-full mb-32 shadow-mx-lg border-none bg-white overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-md p-4 md:p-mx-lg bg-surface-alt/30 border-b border-border-default">
                    <div>
                        <CardTitle className="text-2xl uppercase tracking-tighter">Malha de Performance</CardTitle>
                        <CardDescription className="font-black uppercase tracking-widest mt-1 opacity-40 text-[10px]">AUDITORIA EM TEMPO REAL DE UNIDADES</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-mx-sm">
                        <div className="relative group w-full sm:w-mx-sidebar-expanded">
                            <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <Input placeholder="LOCALIZAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 !h-10 text-[10px] font-black uppercase" />
                        </div>
                        <Button asChild variant="secondary" className="h-mx-10 px-6 shadow-mx-md uppercase text-[10px] font-black w-full sm:w-auto">
                            <Link to="/lojas">GESTÃO LOJAS</Link>
                        </Button>
                    </div>
                </CardHeader>
                <DataGrid 
                    columns={columns} 
                    data={filteredAndSortedStores} 
                    onRowClick={(s) => handleStoreClick(s.id, s.name)}
                    emptyMessage="Nenhuma unidade na malha."
                />
            </Card>
        </main>
    )
}
