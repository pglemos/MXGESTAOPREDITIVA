import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import {
    Activity, AlertTriangle, ArrowRight, Building2, Car, ChevronRight, Settings, Target, TrendingUp, Zap, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStores } from '@/hooks/useTeam'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type StoreSales = { total: number; porta: number; cart: number; net: number }
type StoreDiagnostic = { id: string; name: string; sales: number; goal: number; pacing: number; sellers: number; checkedInToday: number }

const EMPTY_SALES: StoreSales = { total: 0, porta: 0, cart: 0, net: 0 }

export default function PainelConsultor() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { notifications } = useNotifications()
    
    const [storeSales, setStoreSales] = useState<Record<string, StoreSales>>({})
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)

    const fetchNetworkSnapshot = useCallback(async (isManual = false) => {
        if (isManual) setIsRefetching(true)
        else setNetworkLoading(true)

        try {
            const now = new Date()
            const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            const today = now.toISOString().split('T')[0]

            const [
                { data: monthCheckins },
                { data: sellerMemberships },
                { data: todayCheckins },
            ] = await Promise.all([
                supabase.from('daily_checkins').select('store_id, user_id, vnd_porta, vnd_cart, vnd_net').gte('date', monthStart),
                supabase.from('memberships').select('store_id, user_id').eq('role', 'vendedor'),
                supabase.from('daily_checkins').select('store_id, user_id').eq('date', today),
            ])

            const salesMap: Record<string, StoreSales> = {}
            for (const checkin of monthCheckins || []) {
                if (!salesMap[checkin.store_id]) salesMap[checkin.store_id] = { ...EMPTY_SALES }
                salesMap[checkin.store_id].total += (checkin.vnd_porta || 0) + (checkin.vnd_cart || 0) + (checkin.vnd_net || 0)
            }

            const sellerMap = new Map<string, number>()
            for (const m of sellerMemberships || []) sellerMap.set(m.store_id, (sellerMap.get(m.store_id) || 0) + 1)

            const checkedInMap = new Map<string, number>()
            for (const c of todayCheckins || []) checkedInMap.set(c.store_id, (checkedInMap.get(c.store_id) || 0) + 1)

            const diagnosticsMap: Record<string, StoreDiagnostic> = {}
            for (const store of stores) {
                const sales = salesMap[store.id]?.total || 0
                const goal = goals.find(item => item.store_id === store.id)?.target || 0
                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, sales, goal,
                    pacing: goal > 0 ? Math.round((sales / goal) * 100) : 0,
                    sellers: sellerMap.get(store.id) || 0,
                    checkedInToday: checkedInMap.get(store.id) || 0,
                }
            }
            setStoreSales(salesMap); setDiagnostics(diagnosticsMap)
        } finally { setNetworkLoading(false); setIsRefetching(false) }
    }, [stores, goals])

    useEffect(() => { if (!storesLoading && !goalsLoading) fetchNetworkSnapshot() }, [storesLoading, goalsLoading, fetchNetworkSnapshot])

    const stats = useMemo(() => {
        const totalSales = Object.values(storeSales).reduce((sum, item) => sum + item.total, 0)
        const totalGoal = goals.reduce((sum, item) => sum + item.target, 0)
        return {
            totalSales, globalPacing: totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0,
            unread: notifications.filter(item => !item.read).length,
            topStores: [...stores].map(s => diagnostics[s.id] || { id: s.id, name: s.name, sales: 0, goal: 0, pacing: 0, sellers: 0, checkedInToday: 0 }).sort((a, b) => b.sales - a.sales)
        }
    }, [storeSales, goals, notifications, stores, diagnostics])

    if (storesLoading || goalsLoading || networkLoading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-brand-primary" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header - Fixed Grid 8pts */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-mx-md mb-2">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">GESTÃO DE CLUSTER • LIVE</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Painel de Controle</h1>
                </div>
                <div className="flex items-center gap-mx-md">
                    <button onClick={() => fetchNetworkSnapshot(true)} className="w-14 h-14 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-brand-primary transition-all active:scale-95">
                        <RefreshCw size={24} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="grid grid-cols-4 gap-mx-sm">
                        {[
                            { label: 'NODES', value: stores.length, icon: Building2, tone: 'text-mx-indigo-600' },
                            { label: 'VENDAS', value: stats.totalSales, icon: Car, tone: 'text-status-success' },
                            { label: 'PACING', value: `${stats.globalPacing}%`, icon: Target, tone: 'text-status-warning' },
                            { label: 'INBOX', value: stats.unread, icon: Zap, tone: 'text-status-error' },
                        ].map(item => (
                            <div key={item.label} className="flex flex-col items-center justify-center w-24 h-24 rounded-mx-2xl bg-white border border-border-default shadow-mx-sm group hover:border-brand-primary transition-all">
                                <item.icon size={20} className={cn("mb-1 opacity-40 group-hover:opacity-100 transition-opacity", item.tone)} />
                                <span className="text-2xl font-black tracking-tighter leading-none text-text-primary">{item.value}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-text-tertiary mt-1">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-mx-xl">
                
                <div className="xl:col-span-8 flex flex-col gap-mx-lg">
                    {/* Action Cards - Uniform Size */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
                        {[
                            { to: '/lojas', label: 'Unidades', desc: 'Gerenciar Nodes', icon: Building2 },
                            { to: '/funil', label: 'Funil', desc: 'Conversão Real', icon: TrendingUp },
                            { to: '/notificacoes', label: 'Inbox', desc: 'Alertas Ativos', icon: Zap },
                            { to: '/configuracoes', label: 'Ajustes', desc: 'System Core', icon: Settings },
                        ].map(action => (
                            <Link key={action.to} to={action.to} className="mx-card p-mx-lg mx-card-hover group flex flex-col h-48 justify-between">
                                <div className="w-14 h-14 rounded-mx-xl bg-mx-slate-50 flex items-center justify-center text-text-tertiary group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner">
                                    <action.icon size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">{action.label}</h3>
                                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest opacity-60">{action.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Run-rate Table - Semantic Align */}
                    <Card className="flex-1 overflow-hidden border-none shadow-mx-lg rounded-[2.5rem]">
                        <CardHeader className="flex-row items-center justify-between border-b border-border-subtle bg-mx-slate-50/30 p-mx-lg">
                            <div><CardTitle className="text-2xl font-black uppercase tracking-tight">Run-rate por Unidade</CardTitle><CardDescription className="font-bold text-text-tertiary">Mapeamento em tempo real do escoamento.</CardDescription></div>
                            <Link to="/lojas"><button className="mx-button-primary !h-12 !px-8">VER REDE</button></Link>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-mx-slate-50/50 border-b border-border-default">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                        <th className="px-mx-xl py-mx-lg">Unidade Operacional</th>
                                        <th className="px-mx-md py-mx-lg text-center">Volume</th>
                                        <th className="px-mx-md py-mx-lg text-center">Pacing</th>
                                        <th className="px-mx-md py-mx-lg text-center">Tropa</th>
                                        <th className="px-mx-xl py-mx-lg text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {stats.topStores.map(store => (
                                        <tr key={store.id} className="hover:bg-mx-slate-50/30 transition-colors group h-24">
                                            <td className="px-mx-xl py-4">
                                                <div className="flex items-center gap-mx-md">
                                                    <div className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-lg group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-sm">{store.name.charAt(0)}</div>
                                                    <div><p className="font-black text-base text-text-primary uppercase leading-none mb-1">{store.name}</p><p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Node ID {store.id.slice(0,4)}</p></div>
                                                </div>
                                            </td>
                                            <td className="px-mx-md py-4 text-center font-black text-xl font-mono-numbers text-text-primary">{store.sales}</td>
                                            <td className="px-mx-md py-4 text-center">
                                                <Badge className={cn("text-[10px] font-black px-3 py-1 rounded-full", store.pacing >= 100 ? "bg-status-success-surface text-status-success" : "bg-status-warning-surface text-status-warning")}>
                                                    {store.pacing}%
                                                </Badge>
                                            </td>
                                            <td className="px-mx-md py-4 text-center font-black text-sm text-text-tertiary font-mono-numbers">{store.checkedInToday}/{store.sellers}</td>
                                            <td className="px-mx-xl py-4 text-right">
                                                <Link to={`/loja?id=${store.id}`} className="inline-flex items-center gap-1 font-black text-[10px] text-brand-primary uppercase hover:underline">Auditar <ChevronRight size={14} /></Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-mx-lg">
                    {/* Health Card - High Visibility */}
                    <div className="bg-brand-secondary rounded-[3rem] p-mx-xl text-white shadow-mx-elite relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/30 via-transparent to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between mb-mx-xl">
                            <div className="w-16 h-16 rounded-mx-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-mx-lg"><Activity size={32} className="text-brand-primary" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">NETWORK HEALTH</span>
                        </div>
                        <div className="relative z-10 mb-mx-xl">
                            <p className="text-8xl font-black tracking-tighter leading-none mb-4">{stats.globalPacing}%</p>
                            <p className="text-sm font-bold text-white/50 italic leading-snug">Run-rate médio do cluster contra o objetivo tático mensal.</p>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-1 shadow-inner relative z-10 border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(stats.globalPacing, 100)}%` }} transition={{ duration: 2 }} className="h-full bg-brand-primary rounded-full shadow-[0_0_20px_rgba(79,70,229,0.8)]" />
                        </div>
                    </div>

                    {/* Audit Log - Clean & Semantic */}
                    <Card className="rounded-[2.5rem] border-none shadow-mx-lg overflow-hidden flex-1">
                        <CardHeader className="bg-mx-slate-50/20 border-b border-border-subtle p-mx-lg">
                            <div className="flex items-center gap-mx-md">
                                <div className="w-12 h-12 rounded-mx-xl bg-status-error-surface text-status-error flex items-center justify-center border border-mx-rose-100 shadow-inner"><AlertTriangle size={24} /></div>
                                <div><CardTitle className="text-xl font-black uppercase tracking-tight">Audit Log</CardTitle><p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Inconsistências Detectadas</p></div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-mx-lg space-y-mx-md">
                            {[
                                { label: 'METAS PENDENTES', val: 3, tone: 'bg-status-error' },
                                { label: 'CHECK-INS ATRASADOS', val: 5, tone: 'bg-status-warning' },
                            ].map(log => (
                                <div key={log.label} className="flex items-center justify-between p-mx-lg rounded-mx-2xl bg-mx-slate-50/50 border border-border-subtle group hover:bg-white hover:shadow-mx-md transition-all cursor-pointer">
                                    <span className="text-[10px] font-black text-text-primary tracking-widest">{log.label}</span>
                                    <div className={cn("w-12 h-12 rounded-mx-lg flex items-center justify-center font-black text-lg text-white shadow-mx-md", log.tone)}>{log.val}</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
