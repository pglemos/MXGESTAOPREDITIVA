import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw, Users, Globe, Eye, Search, ArrowUpDown, Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStores } from '@/hooks/useTeam'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getOperationalStatus } from '@/lib/calculations'

type StoreDiagnostic = { id: string; name: string; leads: number; agd: number; vis: number; sales: number; goal: number; gap: number; proj: number; ritmo: number; sellers: number; checkedInToday: number; disciplinePct: number }

type SortConfig = {
    key: keyof StoreDiagnostic;
    direction: 'asc' | 'desc';
}

export default function PainelConsultor() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { notifications } = useNotifications()
    
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isTriggering, setIsTriggering] = useState<string | null>(null)

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'critical' | 'target'>('all')
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sales', direction: 'desc' })

    const triggerReport = async (type: 'matinal' | 'semanal' | 'mensal') => {
        setIsTriggering(type)
        try {
            const { data: { session } } = await supabase.auth.getSession()
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

    const fetchNetworkSnapshot = useCallback(async (isManual = false) => {
        if (isManual) setIsRefetching(true)
        else setNetworkLoading(true)

        try {
            const now = new Date()
            const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            const yesterdayDate = new Date(now)
            yesterdayDate.setDate(yesterdayDate.getDate() - 1)
            const yesterday = yesterdayDate.toISOString().split('T')[0]

            const [
                { data: monthCheckins },
                { data: sellers },
                { data: todayCheckins },
            ] = await Promise.all([
                supabase.from('daily_checkins').select('*').gte('reference_date', monthStart),
                supabase.from('store_sellers').select('*').eq('is_active', true),
                supabase.from('daily_checkins').select('store_id, seller_user_id').eq('reference_date', yesterday),
            ])

            const salesMap: Record<string, any> = {}
            for (const checkin of monthCheckins || []) {
                if (!salesMap[checkin.store_id]) salesMap[checkin.store_id] = { total: 0, leads: 0, agd: 0, vis: 0 }
                salesMap[checkin.store_id].total += (checkin.vnd_porta_prev_day || 0) + (checkin.vnd_cart_prev_day || 0) + (checkin.vnd_net_prev_day || 0)
                salesMap[checkin.store_id].leads += (checkin.leads_prev_day || 0)
                salesMap[checkin.store_id].agd += (checkin.agd_cart_today || 0) + (checkin.agd_net_today || 0)
                salesMap[checkin.store_id].vis += (checkin.visit_prev_day || 0)
            }

            const sellerMap = new Map<string, number>()
            for (const m of sellers || []) sellerMap.set(m.store_id, (sellerMap.get(m.store_id) || 0) + 1)

            const checkedInMap = new Map<string, number>()
            for (const c of todayCheckins || []) checkedInMap.set(c.store_id, (checkedInMap.get(c.store_id) || 0) + 1)

            const diagnosticsMap: Record<string, StoreDiagnostic> = {}
            const daysElapsed = now.getDate()
            const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

            for (const store of stores) {
                const s = salesMap[store.id] || { total: 0, leads: 0, agd: 0, vis: 0 }
                const goal = goals.find(item => item.store_id === store.id)?.target || 0
                const proj = daysElapsed > 0 ? Math.round((s.total / daysElapsed) * totalDays) : 0
                const numSellers = sellerMap.get(store.id) || 0
                const numCheckedIn = checkedInMap.get(store.id) || 0
                
                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, 
                    sales: s.total, leads: s.leads, agd: s.agd, vis: s.vis,
                    goal, 
                    gap: Math.max(goal - s.total, 0),
                    proj,
                    ritmo: goal > 0 ? Math.round((s.total / goal) * 100) : 0,
                    sellers: numSellers,
                    checkedInToday: numCheckedIn,
                    disciplinePct: numSellers > 0 ? (numCheckedIn / numSellers) * 100 : 100
                }
            }
            setDiagnostics(diagnosticsMap)
        } finally { setNetworkLoading(false); setIsRefetching(false) }
    }, [stores, goals])

    useEffect(() => { if (!storesLoading && !goalsLoading) fetchNetworkSnapshot() }, [storesLoading, goalsLoading, fetchNetworkSnapshot])

    const handleSort = (key: keyof StoreDiagnostic) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    const filteredAndSortedStores = useMemo(() => {
        let result = Object.values(diagnostics)

        // 1. Search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase()
            result = result.filter(s => s.name.toLowerCase().includes(lower))
        }

        // 2. Status filter
        if (statusFilter !== 'all') {
            result = result.filter(s => {
                const status = getOperationalStatus(s.ritmo, s.disciplinePct)
                if (statusFilter === 'alert') return status.label === 'ALERTA'
                if (statusFilter === 'critical') return status.label === 'CRÍTICO'
                if (statusFilter === 'target') return status.label === 'NO RITMO' || status.label === 'NO ALVO'
                return true
            })
        }

        // 3. Sorting
        result.sort((a, b) => {
            const valA = a[sortConfig.key]
            const valB = b[sortConfig.key]
            
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'desc' 
                    ? valB.localeCompare(valA) 
                    : valA.localeCompare(valB)
            }
            
            return sortConfig.direction === 'desc' 
                ? (valB as number) - (valA as number)
                : (valA as number) - (valB as number)
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
        
        return {
            totalSales, 
            totalGoal,
            totalGap,
            totalLeads,
            totalAgd,
            totalVis,
            globalRitmo: totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0,
            unread: notifications.filter(item => !item.read).length
        }
    }, [diagnostics, notifications])

    if (storesLoading || goalsLoading || networkLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="animate-spin text-indigo-600 w-10 h-10 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Consolidando Malha MX...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 p-4 md:p-10 overflow-y-auto no-scrollbar bg-slate-50/30">
            
            {/* Header Operacional - MX Style */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-200 pb-10 shrink-0">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-12 bg-slate-950 rounded-full shadow-lg" />
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Rede Operacional</h1>
                    </div>
                    <div className="flex items-center gap-4 pl-6">
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 px-3 py-1 font-black text-[10px] tracking-widest uppercase">
                           Gap Global: {globalStats.totalGap} UNIDADES
                        </Badge>
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Matriz de Governança MX • Diagnóstico em Tempo Real</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mr-2">
                        <button 
                            onClick={() => triggerReport('matinal')} 
                            disabled={isTriggering !== null}
                            className="text-[9px] font-black uppercase tracking-widest px-4 h-10 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-50"
                        >
                            {isTriggering === 'matinal' ? '…' : 'Disparo Matinal'}
                        </button>
                        <button 
                            onClick={() => triggerReport('semanal')} 
                            disabled={isTriggering !== null}
                            className="text-[9px] font-black uppercase tracking-widest px-4 h-10 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-200 hover:bg-white hover:text-indigo-600 transition-all disabled:opacity-50"
                        >
                            {isTriggering === 'semanal' ? '…' : 'Ciclo Feedback'}
                        </button>
                    </div>

                    <button type="button" aria-label="Atualizar rede" onClick={() => fetchNetworkSnapshot(true)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-95">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Camada Executiva Global */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
                <Card className="bg-slate-950 border-none rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Venda Global</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{globalStats.totalSales}</span>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{globalStats.globalRitmo}%</span>
                        </div>
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-4">Meta da Rede: {globalStats.totalGoal}</p>
                    </div>
                </Card>

                <Card className="bg-white border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl" />
                    <div className="relative z-10 text-center flex flex-col items-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Escoamento Rede</p>
                        <div className="grid grid-cols-3 gap-8">
                            <div><p className="text-xl font-black text-slate-950 tabular-nums">{globalStats.totalLeads}</p><p className="text-[8px] font-black text-gray-400 uppercase">Leads</p></div>
                            <div><p className="text-xl font-black text-slate-950 tabular-nums">{globalStats.totalAgd}</p><p className="text-[8px] font-black text-gray-400 uppercase">Agd</p></div>
                            <div><p className="text-xl font-black text-slate-950 tabular-nums">{globalStats.totalVis}</p><p className="text-[8px] font-black text-gray-400 uppercase">Vis</p></div>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Unidades Críticas</p>
                        <span className="text-4xl font-black text-rose-600 tracking-tighter tabular-nums leading-none">
                            {Object.values(diagnostics).filter(s => getOperationalStatus(s.ritmo, s.disciplinePct).label === 'CRÍTICO').length}
                        </span>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-4">Ação Imediata Necessária</p>
                    </div>
                </Card>

                <Card className="bg-white border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Saúde Disciplinar</p>
                        <span className="text-4xl font-black text-emerald-600 tracking-tighter tabular-nums leading-none">
                            {Math.round(Object.values(diagnostics).reduce((sum, s) => sum + s.disciplinePct, 0) / (Object.values(diagnostics).length || 1))}%
                        </span>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-4">Aderência aos Check-ins</p>
                    </div>
                </Card>
            </div>

            <div className="flex flex-col gap-8 pb-20">
                
                {/* Tabela de Lojas - Centro Operacional MX */}
                <div className="flex flex-col gap-8">
                    <Card className="flex-1 overflow-hidden border border-gray-100 shadow-sm rounded-[2.5rem] bg-white">
                        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-50 bg-gray-50/30 p-8 gap-6">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Performance Estratégica</CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Malha de Controle de Unidades MX.</CardDescription>
                            </div>
                            
                            {/* Filtros Ativos */}
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Localizar unidade..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 h-12 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-300 w-full sm:w-48 shadow-sm transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm h-12">
                                    <button 
                                        onClick={() => setStatusFilter('all')}
                                        className={cn("px-3 h-full rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", statusFilter === 'all' ? "bg-slate-900 text-white" : "text-gray-400 hover:text-slate-900")}
                                    >Todos</button>
                                    <button 
                                        onClick={() => setStatusFilter('alert')}
                                        className={cn("px-3 h-full rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", statusFilter === 'alert' ? "bg-amber-500 text-white" : "text-gray-400 hover:text-amber-500")}
                                    >Alertas</button>
                                    <button 
                                        onClick={() => setStatusFilter('critical')}
                                        className={cn("px-3 h-full rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", statusFilter === 'critical' ? "bg-rose-600 text-white" : "text-gray-400 hover:text-rose-600")}
                                    >Críticos</button>
                                </div>
                                <Link to="/configuracoes/reprocessamento" className="text-[9px] font-black uppercase tracking-widest bg-white border border-gray-200 px-4 h-12 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center">Reprocessar</Link>
                                <Link to="/lojas" className="text-[9px] font-black uppercase tracking-widest bg-slate-950 text-white px-6 h-12 rounded-xl flex items-center justify-center hover:bg-black transition-all">Gestão</Link>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[1200px]">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <th className="pl-10 py-6 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-2">Loja <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('leads')}>
                                            <div className="flex items-center justify-center gap-2">Leads <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('agd')}>
                                            <div className="flex items-center justify-center gap-2">Agend. <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('vis')}>
                                            <div className="flex items-center justify-center gap-2">Visitas <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center text-indigo-600 font-black cursor-pointer hover:text-indigo-800 transition-colors" onClick={() => handleSort('sales')}>
                                            <div className="flex items-center justify-center gap-2">Vendas <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center">Meta</th>
                                        <th className="px-4 py-6 text-center text-rose-600 cursor-pointer hover:text-rose-800 transition-colors" onClick={() => handleSort('gap')}>
                                            <div className="flex items-center justify-center gap-2">Gap <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center text-indigo-600 cursor-pointer hover:text-indigo-800 transition-colors" onClick={() => handleSort('proj')}>
                                            <div className="flex items-center justify-center gap-2">Projeção <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="px-4 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('ritmo')}>
                                            <div className="flex items-center justify-center gap-2">Status <ArrowUpDown size={10} /></div>
                                        </th>
                                        <th className="pr-10 py-6 text-center cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('disciplinePct')}>
                                            <div className="flex items-center justify-center gap-2">Disciplina <ArrowUpDown size={10} /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {filteredAndSortedStores.map(store => {
                                        const status = getOperationalStatus(store.ritmo, store.disciplinePct)
                                        return (
                                            <tr key={store.id} className="hover:bg-slate-50/50 transition-colors group h-24">
                                                <td className="pl-10 py-2">
                                                    <Link to={`/loja?id=${store.id}`} className="flex items-center gap-4 group/item">
                                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-slate-950 text-lg group-hover/item:bg-slate-950 group-hover/item:text-white transition-all shadow-sm">{store.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-black text-base text-slate-950 uppercase leading-none mb-1 group-hover/item:text-indigo-600 transition-colors">{store.name}</p>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">UNIDADE OPERACIONAL</p>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.leads}</td>
                                                <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.agd}</td>
                                                <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.vis}</td>
                                                <td className="px-4 py-2 text-center font-black text-2xl font-mono-numbers text-indigo-600">{store.sales}</td>
                                                <td className="px-4 py-2 text-center font-black text-base font-mono-numbers text-slate-950">{store.goal}</td>
                                                <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-rose-600">-{store.gap}</td>
                                                <td className="px-4 py-2 text-center font-black text-lg font-mono-numbers text-indigo-600">{store.proj}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <Badge className={cn("text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border-none shadow-sm", status.color)}>
                                                        {status.label === 'NO RITMO' ? 'NO ALVO' : status.label}
                                                    </Badge>
                                                </td>
                                                <td className="pr-10 py-2 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("font-black text-xs font-mono-numbers", store.checkedInToday < store.sellers ? "text-rose-600" : "text-emerald-600")}>
                                                            {store.checkedInToday}/{store.sellers}
                                                        </span>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{Math.round(store.disciplinePct)}% OK</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredAndSortedStores.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="py-20 text-center">
                                                <Filter size={32} className="mx-auto text-gray-200 mb-4" />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhuma unidade corresponde aos filtros ativos.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
