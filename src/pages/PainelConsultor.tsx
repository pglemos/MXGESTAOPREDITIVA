import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw, Users, Globe, Eye, Search, ArrowUpDown, Filter, Calendar, X, Check
} from 'lucide-react'
import { supabase as originalSupabase, supabaseAdmin } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
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

    const handleStoreClick = (storeId: string) => {
        setActiveStoreId(storeId)
        navigate('/loja')
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
                const { data, error } = await supabaseAdmin.from('daily_checkins')
                    .select('store_id, vnd_net, vnd_porta, vnd_cart, leads, agd_net, agd_cart, visitas')
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
                supabaseAdmin.from('stores').select('id, name'),
                supabaseAdmin.from('store_sellers').select('*').eq('is_active', true),
                supabaseAdmin.from('daily_checkins').select('store_id, seller_user_id').eq('reference_date', yesterday),
            ])

            const salesMap: Record<string, any> = {}
            for (const checkin of allCheckins) {
                const sid = checkin.store_id
                if (!salesMap[sid]) salesMap[sid] = { total: 0, leads: 0, agd: 0, vis: 0 }
                salesMap[sid].total += Number(checkin.vnd_net || 0) + Number(checkin.vnd_porta || 0) + Number(checkin.vnd_cart || 0)
                salesMap[sid].leads += Number(checkin.leads || 0)
                salesMap[sid].agd += Number(checkin.agd_net || 0) + Number(checkin.agd_cart || 0)
                salesMap[sid].vis += Number(checkin.visitas || 0)
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="animate-spin text-brand-primary w-12 h-12 mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Rede...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-secondary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Rede <span className="text-brand-primary">Operacional</span></Typography>
                    </div>
                    <div className="flex items-center gap-4 pl-6">
                        <Badge variant="danger" className="px-4 py-1">Gap Global: {globalStats.totalGap} UNIDADES</Badge>
                        <Typography variant="caption" tone="muted">Matriz de Governança MX • {filteredAndSortedStores.length} LOJAS</Typography>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-mx-xs shrink-0">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-mx-full border border-border-default shadow-mx-sm relative">
                        <Calendar size={14} className="text-text-tertiary ml-3 mr-1" />
                        {(['hoje', 'ontem', 'semanal', 'mensal'] as const).map((t) => (
                            <Button 
                                key={t}
                                variant={timeframe === t ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTimeframe(t)}
                                className="rounded-full px-4 h-8 uppercase text-[10px]"
                            >
                                {t}
                            </Button>
                        ))}
                        <Button
                            variant={timeframe === 'personalizada' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setShowCustomPicker(!showCustomPicker)}
                            className="rounded-full px-4 h-8 uppercase text-[10px]"
                        >
                            Custom
                        </Button>

                        <AnimatePresence>
                            {showCustomPicker && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-4 right-0 z-50">
                                    <Card className="p-6 min-w-[320px] shadow-mx-xl">
                                        <header className="flex items-center justify-between mb-6">
                                            <Typography variant="caption" tone="muted">Período Customizado</Typography>
                                            <Button variant="ghost" size="sm" onClick={() => setShowCustomPicker(false)} className="w-8 h-8 p-0 rounded-full"><X size={16} /></Button>
                                        </header>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Typography variant="caption" className="ml-1">Início</Typography>
                                                <Input type="date" value={customRange.start} onChange={e => setCustomRange(p => ({ ...p, start: e.target.value }))} className="!h-10 !px-4 !text-xs" />
                                            </div>
                                            <div className="space-y-2">
                                                <Typography variant="caption" className="ml-1">Fim</Typography>
                                                <Input type="date" value={customRange.end} onChange={e => setCustomRange(p => ({ ...p, end: e.target.value }))} className="!h-10 !px-4 !text-xs" />
                                            </div>
                                            <Button onClick={() => { setTimeframe('personalizada'); setShowCustomPicker(false); fetchNetworkSnapshot() }} className="w-full h-12 shadow-mx-lg">APLICAR PERÍODO</Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-1 bg-white p-1 rounded-mx-full border border-border-default shadow-mx-sm">
                        {(['matinal', 'semanal', 'mensal'] as const).map((r) => (
                            <Button key={r} variant="ghost" size="sm" onClick={() => triggerReport(r)} disabled={isTriggering !== null} className="rounded-full px-4 h-8 text-brand-primary uppercase text-[9px]">
                                {isTriggering === r ? '…' : r}
                            </Button>
                        ))}
                    </div>

                    <Button variant="outline" size="icon" onClick={() => fetchNetworkSnapshot(true)} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {/* Global KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="bg-brand-secondary border-none p-8 shadow-mx-xl text-white">
                    <Typography variant="caption" tone="white" className="opacity-50 mb-4 block">Venda {timeframe.toUpperCase()}</Typography>
                    <div className="flex items-baseline gap-2">
                        <Typography variant="h1" tone="white" className="text-5xl font-mono-numbers">{globalStats.totalSales}</Typography>
                        {timeframe === 'mensal' && <Typography variant="mono" tone="success" className="text-lg">+{globalStats.globalRitmo}%</Typography>}
                    </div>
                    {timeframe === 'mensal' && <Typography variant="caption" tone="white" className="opacity-30 mt-4 tracking-widest block">META REDE: {globalStats.totalGoal}</Typography>}
                </Card>

                <Card className="p-8">
                    <Typography variant="caption" tone="muted" className="mb-6 text-center block">Escoamento Rede</Typography>
                    <div className="grid grid-cols-3 gap-mx-md">
                        <div className="text-center"><Typography variant="h3" className="text-2xl font-mono-numbers mb-1">{globalStats.totalLeads}</Typography><Typography variant="caption" className="text-[8px]">Leads</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-2xl font-mono-numbers mb-1">{globalStats.totalAgd}</Typography><Typography variant="caption" className="text-[8px]">Agd</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-2xl font-mono-numbers mb-1">{globalStats.totalVis}</Typography><Typography variant="caption" className="text-[8px]">Vis</Typography></div>
                    </div>
                </Card>

                <Card className="p-8 flex flex-col justify-between">
                    <Typography variant="caption" tone="muted" className="mb-4">Unidades Críticas</Typography>
                    <Typography variant="h1" tone="error" className="text-5xl font-mono-numbers">
                        {Object.values(diagnostics).filter(s => getOperationalStatus(s.ritmo, s.disciplinePct).label === 'CRÍTICO').length}
                    </Typography>
                    <Typography variant="caption" tone="error" className="mt-4 opacity-60">Ação Imediata Necessária</Typography>
                </Card>

                <Card className="p-8 flex flex-col justify-between">
                    <Typography variant="caption" tone="muted" className="mb-4">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone="success" className="text-5xl font-mono-numbers">
                        {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                    </Typography>
                    <Typography variant="caption" tone="success" className="mt-4 opacity-60">Aderência aos Check-ins</Typography>
                </Card>
            </div>

            {/* Strategic Map Table */}
            <Card className="w-full mb-20 shadow-mx-lg border-none">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10">
                    <div>
                        <CardTitle className="text-3xl">Malha de Performance</CardTitle>
                        <CardDescription>Auditoria em Tempo Real de Unidades MX.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-mx-xs">
                        <div className="relative group w-full sm:w-64">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" />
                            <Input placeholder="Localizar unidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-10 !h-12 !text-[10px]" />
                        </div>
                        <div className="flex items-center gap-1 bg-surface-alt border border-border-default p-1 rounded-mx-md h-12 shadow-inner">
                            {(['all', 'alert', 'critical'] as const).map(f => (
                                <Button key={f} variant={statusFilter === f ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter(f)} className="h-full rounded-mx-sm px-4 text-[10px] uppercase">
                                    {f === 'all' ? 'Todos' : f === 'alert' ? 'Alertas' : 'Críticos'}
                                </Button>
                            ))}
                        </div>
                        <Button asChild variant="secondary" className="h-12 px-6 shadow-mx-md">
                            <Link to="/lojas">GESTÃO LOJAS</Link>
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[1200px]">
                        <thead className="bg-surface-alt/50 border-y border-border-default">
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                <th scope="col" className="pl-10 py-6 cursor-pointer hover:text-brand-primary transition-colors" onClick={() => handleSort('name')}>Unidade</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer" onClick={() => handleSort('leads')}>Leads</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer" onClick={() => handleSort('agd')}>Agend.</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer" onClick={() => handleSort('vis')}>Visitas</th>
                                <th scope="col" className="px-4 py-6 text-center text-brand-primary cursor-pointer" onClick={() => handleSort('sales')}>Vendas</th>
                                <th scope="col" className="px-4 py-6 text-center">Meta</th>
                                <th scope="col" className="px-4 py-6 text-center text-status-error cursor-pointer" onClick={() => handleSort('gap')}>Gap</th>
                                <th scope="col" className="px-4 py-6 text-center text-brand-primary cursor-pointer" onClick={() => handleSort('proj')}>Projeção</th>
                                <th scope="col" className="px-4 py-6 text-center">Ritmo</th>
                                <th scope="col" className="px-4 py-6 text-center">Status</th>
                                <th scope="col" className="pr-10 py-6 text-center">Disciplina</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {filteredAndSortedStores.map(store => {
                                const status = getOperationalStatus(store.ritmo, store.disciplinePct)
                                return (
                                    <tr 
                                        key={store.id} 
                                        className="hover:bg-brand-primary-surface/10 transition-colors group h-24 cursor-pointer"
                                        onClick={() => handleStoreClick(store.id)}
                                    >
                                        <td className="pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-lg group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">{store.name.charAt(0)}</div>
                                                <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors">{store.name}</Typography>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-primary">{store.leads}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-primary">{store.agd}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-primary">{store.vis}</td>
                                        <td className="px-4 py-2 text-center font-black text-2xl font-mono-numbers text-brand-primary">{store.sales}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-text-tertiary">{store.goal}</td>
                                        <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-status-error">-{store.gap}</td>
                                        <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-brand-primary">{store.proj}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <Typography variant="mono" className="text-lg">{store.ritmo}</Typography>
                                                <Typography variant="caption" className="text-[8px] opacity-50">VND/DIA</Typography>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <Badge variant={status.label === 'CRÍTICO' ? 'danger' : status.label === 'NO RITMO' ? 'success' : 'warning'} className="px-4 py-1 mb-1">
                                                {status.label}
                                            </Badge>
                                            <Typography variant="caption" tone="muted" className="text-[8px] block">{store.efficiency}% EFIC.</Typography>
                                        </td>
                                        <td className="pr-10 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <Typography variant="mono" tone={store.checkedInToday < store.sellers ? 'error' : 'success'} className="text-base">
                                                    {store.checkedInToday}/{store.sellers}
                                                </Typography>
                                                <Typography variant="caption" tone="muted" className="text-[8px] tracking-tighter">{Math.round(store.disciplinePct)}% OK</Typography>
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
