import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw, Users, Globe, Eye
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

export default function PainelConsultor() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { notifications } = useNotifications()
    
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)

    const [isTriggering, setIsTriggering] = useState<string | null>(null)

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

    const stats = useMemo(() => {
        const dVals = Object.values(diagnostics)
        const totalSales = dVals.reduce((sum, item) => sum + item.sales, 0)
        const totalGoal = dVals.reduce((sum, item) => sum + item.goal, 0)
        const totalGap = dVals.reduce((sum, item) => sum + item.gap, 0)
        
        return {
            totalSales, 
            totalGoal,
            totalGap,
            globalRitmo: totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0,
            unread: notifications.filter(item => !item.read).length,
            topStores: dVals.sort((a, b) => b.sales - a.sales)
        }
    }, [diagnostics, notifications])

    if (storesLoading || goalsLoading || networkLoading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-brand-primary" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header Operacional - MX Style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md mb-2 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-mx-md" />
                        <h1 className="text-[38px] font-black text-slate-950 tracking-tighter uppercase leading-none">Visão Geral da Rede</h1>
                    </div>
                    <div className="flex items-center gap-4 pl-6">
                        <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 px-3 py-1 font-black text-[10px] tracking-widest uppercase">
                           Gap da Rede: {stats.totalGap} UNIDADES
                        </Badge>
                        <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Metodologia MX • Raio-X Operacional</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 mr-4">
                        <button 
                            onClick={() => triggerReport('matinal')} 
                            disabled={isTriggering !== null}
                            className="text-[9px] font-black uppercase tracking-widest px-4 h-10 rounded-xl bg-white border border-gray-200 hover:bg-slate-950 hover:text-white transition-all disabled:opacity-50"
                        >
                            {isTriggering === 'matinal' ? '…' : 'Matinal'}
                        </button>
                        <button 
                            onClick={() => triggerReport('semanal')} 
                            disabled={isTriggering !== null}
                            className="text-[9px] font-black uppercase tracking-widest px-4 h-10 rounded-xl bg-white border border-gray-200 hover:bg-slate-950 hover:text-white transition-all disabled:opacity-50"
                        >
                            {isTriggering === 'semanal' ? '…' : 'Feedback'}
                        </button>
                        <button 
                            onClick={() => triggerReport('mensal')} 
                            disabled={isTriggering !== null}
                            className="text-[9px] font-black uppercase tracking-widest px-4 h-10 rounded-xl bg-white border border-gray-200 hover:bg-slate-950 hover:text-white transition-all disabled:opacity-50"
                        >
                            {isTriggering === 'mensal' ? '…' : 'Fechamento'}
                        </button>
                    </div>

                    <button type="button" aria-label="Atualizar visão geral da rede" onClick={() => fetchNetworkSnapshot(true)} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">
                        <RefreshCw size={20} aria-hidden="true" className={cn(isRefetching && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-mx-lg pb-mx-xl">
                
                {/* Tabela de Lojas - Centro Operacional MX */}
                <div className="flex flex-col gap-mx-lg">
                    <Card className="flex-1 overflow-hidden border border-gray-100 shadow-sm rounded-[2.5rem]">
                        <CardHeader className="flex-row items-center justify-between border-b border-gray-50 bg-gray-50/30 p-8">
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Performance por Loja</CardTitle>
                                <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Mapeamento bruto do escoamento de funil por unidade.</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Link to="/configuracoes/reprocessamento" className="text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 px-6 h-12 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">Reprocessar Base</Link>
                                <Link to="/lojas" className="mx-button-primary !h-12 !px-8 bg-slate-950 text-white rounded-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">Gerenciar Unidades</Link>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[1200px]">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <th className="pl-10 py-6">Loja</th>
                                        <th className="px-4 py-6 text-center">Leads</th>
                                        <th className="px-4 py-6 text-center">Agend.</th>
                                        <th className="px-4 py-6 text-center">Visitas</th>
                                        <th className="px-4 py-6 text-center text-indigo-600 font-black">Vendas</th>
                                        <th className="px-4 py-6 text-center">Meta</th>
                                        <th className="px-4 py-6 text-center text-rose-600">Gap</th>
                                        <th className="px-4 py-6 text-center text-indigo-600">Projeção</th>
                                        <th className="px-4 py-6 text-center">Atingimento</th>
                                        <th className="pr-10 py-6 text-center">Disciplina</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {stats.topStores.map(store => {
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
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Check-ins</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
