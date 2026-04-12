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

type Timeframe = 'hoje' | 'ontem' | 'semanal' | 'mensal'

export default function PainelConsultor() {
    const navigate = useNavigate()
    const { setActiveStoreId } = useAuth()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)

    const [searchTerm, setSearchTerm] = useState('')
    const [timeframe, setTimeframe] = useState<Timeframe>('mensal')
    const [sortConfig] = useState<SortConfig>({ key: 'sales', direction: 'desc' })

    const handleStoreClick = (storeId: string, storeName: string) => {
        setActiveStoreId(storeId)
        const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        navigate(`/loja/${slug}/${storeId}`)
    }

    const calculateRange = (tf: Timeframe) => {
        const now = new Date()
        let start = now; let end = now
        switch (tf) {
            case 'hoje': start = startOfDay(now); end = endOfDay(now); break
            case 'ontem': const yesterday = subDays(now, 1); start = startOfDay(yesterday); end = endOfDay(yesterday); break
            case 'semanal': start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break
            case 'mensal': start = startOfMonth(now); end = endOfMonth(now); break
        }
        return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') }
    }

    const fetchNetworkSnapshot = useCallback(async (isManual = false) => {
        if (isManual) setIsRefetching(true)
        else setNetworkLoading(true)

        try {
            const range = calculateRange(timeframe)
            const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

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
                const numSellers = sellerMap.get(store.id) || 0
                const numCheckedIn = checkedInMap.get(store.id) || 0
                const targetToday = (goal / dias.total) * dias.decorridos
                const efficiency = targetToday > 0 ? (s.total / targetToday) * 100 : 100

                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, 
                    sales: s.total, leads: s.leads, agd: s.agd, vis: s.vis,
                    goal, gap: timeframe === 'mensal' ? Math.max(goal - s.total, 0) : 0, proj: 0, ritmo: 0,
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
        result.sort((a, b) => {
            const valA = a[sortConfig.key]; const valB = b[sortConfig.key]
            return sortConfig.direction === 'desc' ? (valB as any) > (valA as any) ? 1 : -1 : (valA as any) > (valB as any) ? 1 : -1
        })
        return result
    }, [diagnostics, searchTerm, sortConfig])

    const globalStats = useMemo(() => {
        const dVals = Object.values(diagnostics)
        return {
            totalSales: dVals.reduce((sum, item) => sum + item.sales, 0),
            totalGoal: dVals.reduce((sum, item) => sum + item.goal, 0),
            totalGap: dVals.reduce((sum, item) => sum + item.gap, 0),
            totalLeads: dVals.reduce((sum, item) => sum + item.leads, 0),
            totalAgd: dVals.reduce((sum, item) => sum + item.agd, 0),
            totalVis: dVals.reduce((sum, item) => sum + item.vis, 0)
        }
    }, [diagnostics])

    const columns = useMemo<Column<StoreDiagnostic>[]>(() => [
        {
            key: 'name',
            header: 'UNIDADE',
            render: (s) => (
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center font-black text-brand-primary shrink-0 uppercase">{s.name.charAt(0)}</div>
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm uppercase font-black truncate">{s.name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[8px] uppercase opacity-40 font-black">{s.checkedInToday}/{s.sellers} OP</Typography>
                    </div>
                </div>
            )
        },
        {
            key: 'sales',
            header: timeframe === 'mensal' ? 'MÊS' : 'VND',
            align: 'center',
            render: (s) => <Typography variant="h1" tone="brand" className="text-xl font-mono-numbers">{s.sales}</Typography>
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'right',
            render: (s) => {
                const status = getOperationalStatus(s.efficiency, s.disciplinePct)
                return (
                    <Badge variant={status.label === 'CRÍTICO' ? 'danger' : status.label.includes('ALERTA') ? 'warning' : 'success'} className="px-3 py-1 rounded-lg font-black text-[8px] uppercase border-none">
                        {status.label}
                    </Badge>
                )
            }
        }
    ], [timeframe])

    if (networkLoading) return (
        <main className="w-full h-full flex flex-col gap-4 p-4 bg-surface-alt animate-in fade-in duration-500">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-4 p-4 overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col gap-4 border-b border-border-default pb-6 shrink-0">
                <div className="flex items-center justify-between">
                    <Typography variant="h1" className="text-2xl uppercase font-black">Rede</Typography>
                    <div className="flex gap-2">
                        <nav className="bg-white p-1 rounded-full shadow-sm border border-border-default flex gap-1">
                            {(['hoje', 'ontem', 'semanal', 'mensal'] as const).map((t) => (
                                <Button 
                                    key={t} variant={timeframe === t ? 'secondary' : 'ghost'} size="sm"
                                    onClick={() => setTimeframe(t)} 
                                    className="h-8 px-3 rounded-full uppercase font-black text-[8px]"
                                >
                                    {t}
                                </Button>
                            ))}
                        </nav>
                        <Button variant="outline" size="icon" onClick={() => fetchNetworkSnapshot(true)} className="w-10 h-10 rounded-xl shadow-sm bg-white shrink-0">
                            <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                    </div>
                </div>
                
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <Input placeholder="LOCALIZAR LOJA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-9 !h-10 text-[10px] font-black uppercase" />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <Card className="p-4 border-none bg-brand-secondary text-white shadow-mx-xl relative overflow-hidden flex flex-col justify-center">
                    <Typography variant="tiny" tone="white" className="opacity-50 mb-1 block font-black uppercase text-[8px]">Venda {timeframe}</Typography>
                    <Typography variant="h1" tone="white" className="text-4xl font-mono-numbers tracking-tighter leading-none">{globalStats.totalSales}</Typography>
                    <Typography variant="caption" tone="white" className="opacity-30 mt-2 block font-black uppercase text-[8px]">META: {globalStats.totalGoal}</Typography>
                </Card>

                <Card className="p-4 border-none shadow-sm bg-white relative overflow-hidden flex flex-col justify-center">
                    <Typography variant="tiny" tone="muted" className="opacity-40 mb-3 block font-black uppercase text-center text-[8px]">Escoamento Rede</Typography>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="text-center bg-surface-alt p-2 rounded-xl border border-border-default"><Typography variant="h3" className="text-lg font-mono-numbers leading-none">{globalStats.totalLeads}</Typography><Typography variant="tiny" className="font-black uppercase opacity-40 text-[8px]">LDS</Typography></div>
                        <div className="text-center bg-surface-alt p-2 rounded-xl border border-border-default"><Typography variant="h3" className="text-lg font-mono-numbers leading-none">{globalStats.totalAgd}</Typography><Typography variant="tiny" className="font-black uppercase opacity-40 text-[8px]">AGD</Typography></div>
                        <div className="text-center bg-surface-alt p-2 rounded-xl border border-border-default"><Typography variant="h3" className="text-lg font-mono-numbers leading-none">{globalStats.totalVis}</Typography><Typography variant="tiny" className="font-black uppercase opacity-40 text-[8px]">VIS</Typography></div>
                    </div>
                </Card>

                <Card className="p-4 border-none shadow-sm bg-white flex flex-col justify-center items-center text-center">
                    <Typography variant="tiny" tone="muted" className="mb-1 font-black uppercase opacity-40 text-[8px]">Unidades Críticas</Typography>
                    <Typography variant="h1" tone="error" className="text-4xl font-mono-numbers tracking-tighter leading-none">
                        {Object.values(diagnostics).filter(s => getOperationalStatus(s.efficiency, s.disciplinePct).label === 'CRÍTICO').length}
                    </Typography>
                </Card>

                <Card className="p-4 border-none shadow-sm bg-white flex flex-col justify-center items-center text-center">
                    <Typography variant="tiny" tone="muted" className="mb-1 font-black uppercase opacity-40 text-[8px]">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone="success" className="text-4xl font-mono-numbers tracking-tighter leading-none">
                        {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                    </Typography>
                </Card>
            </div>

            <Card className="w-full mb-32 shadow-mx-xl border-none bg-white overflow-hidden">
                <DataGrid 
                    columns={columns} 
                    data={filteredAndSortedStores} 
                    onRowClick={(s) => handleStoreClick(s.id, s.name)}
                    emptyMessage="Nenhuma unidade."
                />
            </Card>
        </main>
    )
}
