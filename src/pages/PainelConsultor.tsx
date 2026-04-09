import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw, Users, Globe, Eye, Search, ArrowUpDown, Filter, Calendar, X, Check
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { supabase as originalSupabase, supabaseAdmin } from '@/lib/supabase'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { getOperationalStatus, getDiasInfo, calcularProjecao } from '@/lib/calculations'

type StoreDiagnostic = { id: string; name: string; leads: number; agd: number; vis: number; sales: number; goal: number; gap: number; proj: number; ritmo: number; efficiency: number; sellers: number; checkedInToday: number; disciplinePct: number }

type SortConfig = {
    key: keyof StoreDiagnostic;
    direction: 'asc' | 'desc';
}

type Timeframe = 'hoje' | 'ontem' | 'semanal' | 'mensal' | 'personalizada'

export default function PainelConsultor() {
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { notifications } = useNotifications()
    
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isTriggering, setIsTriggering] = useState<string | null>(null)

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'critical' | 'target'>('all')
    const [timeframe, setTimeframe] = useState<Timeframe>('mensal')
    const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })
    const [showCustomPicker, setShowCustomPicker] = useState(false)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sales', direction: 'desc' })

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

            // 1. Fetch ALL checkins for the range (handling pagination)
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

            // 2. Fetch other essential data
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
                // Soma de todos os canais de venda
                salesMap[sid].total += Number(checkin.vnd_net || 0) + Number(checkin.vnd_porta || 0) + Number(checkin.vnd_cart || 0)
                salesMap[sid].leads += Number(checkin.leads || 0)
                // Soma de agendamentos
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="animate-spin text-indigo-600 w-10 h-10 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Sincronizando Rede...</p>
        </div>
    )

    return (
        <main className="w-full flex flex-col gap-4 md:gap-10 p-2 md:p-10 bg-slate-50/30">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8 border-b border-gray-200 pb-4 md:pb-10 shrink-0">
                <div className="flex flex-col gap-1 md:gap-2">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="w-1.5 h-8 md:w-3 md:h-12 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Rede Operacional</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 pl-3 md:pl-6">
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-100 px-1.5 md:px-3 py-0.5 font-black text-[7px] md:text-[10px] tracking-widest uppercase">
                           Gap Global: {globalStats.totalGap} UNIDADES
                        </Badge>
                        <p className="text-gray-600 text-[7px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.4em]">Matriz de Governança MX • Dados Sincronizados ({filteredAndSortedStores.length} LOJAS)</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">
                    <div className="flex items-center gap-1 md:gap-2 bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm relative" role="group" aria-label="Filtro temporal">
                        <Calendar size={12} className="text-gray-500 ml-1" aria-hidden="true" />
                        <button onClick={() => setTimeframe('hoje')} aria-pressed={timeframe === 'hoje'} className={cn("px-2 md:px-3 h-7 md:h-8 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none", timeframe === 'hoje' ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-gray-500 hover:bg-gray-50")}>Hoje</button>
                        <button onClick={() => setTimeframe('ontem')} aria-pressed={timeframe === 'ontem'} className={cn("px-2 md:px-3 h-7 md:h-8 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none", timeframe === 'ontem' ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-gray-500 hover:bg-gray-50")}>Ontem</button>
                        <button onClick={() => setTimeframe('semanal')} aria-pressed={timeframe === 'semanal'} className={cn("px-2 md:px-3 h-7 md:h-8 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none", timeframe === 'semanal' ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-gray-400 hover:bg-gray-50")}>Semanal</button>
                        <button onClick={() => setTimeframe('mensal')} aria-pressed={timeframe === 'mensal'} className={cn("px-2 md:px-3 h-7 md:h-8 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none", timeframe === 'mensal' ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-gray-400 hover:bg-gray-50")}>Mensal</button>
                        <button 
                            onClick={() => setShowCustomPicker(!showCustomPicker)} 
                            aria-pressed={timeframe === 'personalizada'} 
                            className={cn(
                                "px-2 md:px-3 h-7 md:h-8 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none", 
                                timeframe === 'personalizada' ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-gray-400 hover:bg-gray-50"
                            )}
                        >
                            Personalizado
                        </button>

                        {/* Custom Date Picker Popover */}
                        {showCustomPicker && (
                            <div className="absolute top-full mt-4 right-0 z-50 bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 min-w-[320px] animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Período Customizado</p>
                                    <button onClick={() => setShowCustomPicker(false)} className="w-8 h-8 rounded-lg hover:bg-gray-50 flex items-center justify-center text-gray-400">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Início</label>
                                        <input 
                                            type="date" 
                                            value={customRange.start} 
                                            onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold outline-none focus:border-indigo-300 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Fim</label>
                                        <input 
                                            type="date" 
                                            value={customRange.end} 
                                            onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full h-10 px-4 rounded-xl border border-gray-100 bg-gray-50 text-xs font-bold outline-none focus:border-indigo-300 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setTimeframe('personalizada')
                                            setShowCustomPicker(false)
                                            fetchNetworkSnapshot()
                                        }}
                                        className="w-full h-12 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        <Check size={14} /> Aplicar Período
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 md:gap-2 bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm" role="group" aria-label="Disparar relatórios">
                        <button onClick={() => triggerReport('matinal')} disabled={isTriggering !== null} aria-label="Disparar relatório matinal" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-4 h-7 md:h-8 rounded-lg md:rounded-xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none">
                            {isTriggering === 'matinal' ? '…' : 'Matinal'}
                        </button>
                        <button onClick={() => triggerReport('semanal')} disabled={isTriggering !== null} aria-label="Disparar relatório de feedback" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-4 h-7 md:h-8 rounded-lg md:rounded-xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none">
                            {isTriggering === 'semanal' ? '…' : 'Feedback'}
                        </button>
                        <button onClick={() => triggerReport('mensal')} disabled={isTriggering !== null} aria-label="Disparar relatório mensal" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:px-4 h-7 md:h-8 rounded-lg md:rounded-xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none">
                            {isTriggering === 'mensal' ? '…' : 'Mensal'}
                        </button>
                    </div>

                    <button type="button" onClick={() => fetchNetworkSnapshot(true)} aria-label="Sincronizar dados da rede" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none">
                        <RefreshCw size={16} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6 shrink-0">
                <Card className="bg-slate-950 border-none rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[7px] md:text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1 md:mb-4">Venda {timeframe.toUpperCase()}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{globalStats.totalSales}</span>
                            {timeframe === 'mensal' && <span className="text-[8px] md:text-xs font-bold text-emerald-400 uppercase tracking-widest">{globalStats.globalRitmo}%</span>}
                        </div>
                        {timeframe === 'mensal' && <p className="text-[7px] md:text-[10px] font-bold text-white/30 uppercase tracking-widest mt-2 md:mt-4">Meta da Rede: {globalStats.totalGoal}</p>}
                    </div>
                </Card>

                <Card className="bg-white border-gray-100 rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 text-center flex flex-col items-center">
                        <p className="text-[7px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1 md:mb-4">Escoamento Rede</p>
                        <div className="grid grid-cols-3 gap-3 md:gap-8">
                            <div><p className="text-base md:text-xl font-black text-slate-950 tabular-nums">{globalStats.totalLeads}</p><p className="text-[7px] md:text-[10px] font-black text-gray-500 uppercase">Leads</p></div>
                            <div><p className="text-base md:text-xl font-black text-slate-950 tabular-nums">{globalStats.totalAgd}</p><p className="text-[7px] md:text-[10px] font-black text-gray-500 uppercase">Agd</p></div>
                            <div><p className="text-base md:text-xl font-black text-slate-950 tabular-nums">{globalStats.totalVis}</p><p className="text-[7px] md:text-[10px] font-black text-gray-500 uppercase">Vis</p></div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-gray-100 rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[7px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1 md:mb-4">Unidades Críticas</p>
                        <span className="text-2xl md:text-4xl font-black text-rose-600 tracking-tighter tabular-nums leading-none">
                            {Object.values(diagnostics).filter(s => getOperationalStatus(s.ritmo, s.disciplinePct).label === 'CRÍTICO').length}
                        </span>
                        <p className="text-[7px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 md:mt-4">Ação Imediata Necessária</p>
                    </div>
                </Card>

                <Card className="bg-white border-gray-100 rounded-[1.2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[7px] md:text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1 md:mb-4">Saúde Disciplinar</p>
                        <span className="text-2xl md:text-4xl font-black text-emerald-600 tracking-tighter tabular-nums leading-none">
                            {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                        </span>
                        <p className="text-[7px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 md:mt-4">Aderência aos Check-ins</p>
                    </div>
                </Card>
            </div>

            <Card className="w-full border border-gray-100 shadow-sm rounded-[1.5rem] md:rounded-[2.5rem] bg-white mb-20">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-50 bg-gray-50/30 p-6 md:p-8 gap-4 md:gap-6">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-950">Performance Estratégica</h2>
                        <CardDescription className="font-bold text-gray-500 uppercase text-[8px] md:text-[10px] tracking-widest mt-1">Malha de Controle de Unidades MX.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <div className="relative group flex-1 sm:flex-none">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" aria-hidden="true" />
                            <label htmlFor="search-units" className="sr-only">Localizar unidade operacional</label>
                            <input 
                                id="search-units"
                                name="search-units"
                                type="text" 
                                placeholder="Localizar unidade..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="pl-10 pr-4 h-10 md:h-12 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold focus:outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 w-full sm:w-48 shadow-sm transition-all" 
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg md:rounded-xl shadow-sm h-10 md:h-12" role="group" aria-label="Filtro de status">
                            <button onClick={() => setStatusFilter('all')} aria-pressed={statusFilter === 'all'} className={cn("px-2 md:px-3 h-full rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none", statusFilter === 'all' ? "bg-slate-900 text-white shadow-sm" : "text-gray-500 hover:text-slate-900")}>Todos</button>
                            <button onClick={() => setStatusFilter('alert')} aria-pressed={statusFilter === 'alert'} className={cn("px-2 md:px-3 h-full rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-amber-500 outline-none", statusFilter === 'alert' ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:text-amber-500")}>Alertas</button>
                            <button onClick={() => setStatusFilter('critical')} aria-pressed={statusFilter === 'critical'} className={cn("px-2 md:px-3 h-full rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none", statusFilter === 'critical' ? "bg-rose-600 text-white shadow-sm" : "text-gray-500 hover:text-rose-600")}>Críticos</button>
                        </div>
                        <Link to="/lojas" className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white px-4 md:px-6 h-10 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-md focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">Gestão de Lojas</Link>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px] md:min-w-[1200px]">
                        <caption className="sr-only">Tabela de desempenho operacional das lojas da rede</caption>
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                <th scope="col" className="pl-10 py-6 cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('name')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('name')}>Loja</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('leads')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('leads')}>Leads</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('agd')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('agd')}>Agend.</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('vis')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('vis')}>Visitas</th>
                                <th scope="col" className="px-4 py-6 text-center text-indigo-600 font-black cursor-pointer hover:text-indigo-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none" onClick={() => handleSort('sales')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('sales')}>Vendas</th>
                                <th scope="col" className="px-4 py-6 text-center">Meta</th>
                                <th scope="col" className="px-4 py-6 text-center text-rose-600 cursor-pointer hover:text-rose-800 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 outline-none" onClick={() => handleSort('gap')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('gap')}>Gap</th>
                                <th scope="col" className="px-4 py-6 text-center text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none" onClick={() => handleSort('proj')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('proj')}>Projeção</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('ritmo')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('ritmo')}>Ritmo</th>
                                <th scope="col" className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('efficiency')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('efficiency')}>Status</th>
                                <th scope="col" className="pr-10 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors focus-visible:text-indigo-600 outline-none" onClick={() => handleSort('disciplinePct')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort('disciplinePct')}>Disciplina</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {filteredAndSortedStores.map(store => {
                                const status = getOperationalStatus(store.ritmo, store.disciplinePct)
                                return (
                                    <tr key={store.id} className="hover:bg-slate-50/50 transition-colors group h-24">
                                        <td className="pl-10 py-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-100 flex items-center justify-center font-black text-slate-950 text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner" aria-hidden="true">{store.name.charAt(0)}</div>
                                                <p className="font-black text-base text-slate-950 uppercase leading-none mb-1">{store.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.leads}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.agd}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.vis}</td>
                                        <td className="px-4 py-2 text-center font-black text-2xl font-mono-numbers text-indigo-600">{store.sales}</td>
                                        <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.goal}</td>
                                        <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-rose-600">-{store.gap}</td>
                                        <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-indigo-600">{store.proj}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-lg font-mono-numbers text-slate-700">{store.ritmo}</span>
                                                <p className="text-[10px] font-black uppercase text-gray-500">Vnd/Dia</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <Badge className={cn("text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border-none shadow-sm", status.color)}>{status.label}</Badge>
                                            <p className="text-[10px] font-black text-slate-500 mt-1 uppercase">{store.efficiency}% EFIC.</p>
                                        </td>
                                        <td className="pr-10 py-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={cn("font-black text-sm font-mono-numbers", store.checkedInToday < store.sellers ? "text-rose-600" : "text-emerald-600")}>{store.checkedInToday}/{store.sellers}</span>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{Math.round(store.disciplinePct)}% OK</p>
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
