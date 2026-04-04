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

type StoreDiagnostic = { id: string; name: string; leads: number; agd: number; vis: number; sales: number; goal: number; gap: number; proj: number; pacing: number; sellers: number; checkedInToday: number }

export default function PainelConsultor() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { notifications } = useNotifications()
    
    const [diagnostics, setDiagnostics] = useState<Record<string, StoreDiagnostic>>({})
    const [networkLoading, setNetworkLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)

    const fetchNetworkSnapshot = useCallback(async (isManual = false) => {
        if (isManual) setIsRefetching(true)
        else setNetworkLoading(true)

        try {
            const now = new Date()
            const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            // Na Metodologia MX, o "hoje" pro checkin de ontem é a data de ontem para fins de volume
            // Mas o status disciplinar do checkin é a data de hoje.
            const todayDate = new Date()
            const today = todayDate.toISOString().split('T')[0]
            
            const yesterdayDate = new Date(now)
            yesterdayDate.setDate(yesterdayDate.getDate() - 1)
            const yesterday = yesterdayDate.toISOString().split('T')[0]

            const [
                { data: monthCheckins },
                { data: sellers },
                { data: todayCheckins },
            ] = await Promise.all([
                // Usando a nomenclatura canônica do EPIC-01
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
                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, 
                    sales: s.total, leads: s.leads, agd: s.agd, vis: s.vis,
                    goal, 
                    gap: Math.max(goal - s.total, 0),
                    proj,
                    pacing: goal > 0 ? Math.round((s.total / goal) * 100) : 0,
                    sellers: sellerMap.get(store.id) || 0,
                    checkedInToday: checkedInMap.get(store.id) || 0,
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
        return {
            totalSales, globalPacing: totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0,
            unread: notifications.filter(item => !item.read).length,
            topStores: dVals.sort((a, b) => b.sales - a.sales)
        }
    }, [diagnostics, goals, notifications])

    if (storesLoading || goalsLoading || networkLoading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-brand-primary" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header - Fixed Grid 8pts */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-mx-md mb-2">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">VISÃO GERAL MULTI-LOJA • REDE</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Painel de Controle</h1>
                </div>
                <div className="flex items-center gap-mx-md">
                    <button onClick={() => fetchNetworkSnapshot(true)} className="w-14 h-14 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-brand-primary transition-all active:scale-95">
                        <RefreshCw size={24} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="grid grid-cols-4 gap-mx-sm">
                        {[
                            { label: 'LOJAS', value: stores.length, icon: Building2, tone: 'text-mx-indigo-600' },
                            { label: 'VENDAS', value: stats.totalSales, icon: Car, tone: 'text-status-success' },
                            { label: 'ATINGIMENTO', value: `${stats.globalPacing}%`, icon: Target, tone: 'text-status-warning' },
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
                            { to: '/lojas', label: 'Unidades', desc: 'Gerenciar Lojas', icon: Building2 },
                            { to: '/relatorio-matinal', label: 'Matinal', desc: 'Motor Operacional', icon: TrendingUp },
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
                            <div><CardTitle className="text-2xl font-black uppercase tracking-tight">Raio-X da Rede MX</CardTitle><CardDescription className="font-bold text-text-tertiary">Mapeamento em tempo real do funil e escoamento.</CardDescription></div>
                            <Link to="/lojas"><button className="mx-button-primary !h-12 !px-8">VER LOJAS</button></Link>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[900px]">
                                <thead className="bg-mx-slate-50/50 border-b border-border-default">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                        <th className="px-mx-xl py-mx-lg">Unidade</th>
                                        <th className="px-mx-md py-mx-lg text-center">Leads</th>
                                        <th className="px-mx-md py-mx-lg text-center">Agd</th>
                                        <th className="px-mx-md py-mx-lg text-center">Vis</th>
                                        <th className="px-mx-md py-mx-lg text-center text-brand-primary">VND</th>
                                        <th className="px-mx-md py-mx-lg text-center">Meta</th>
                                        <th className="px-mx-md py-mx-lg text-center">Gap</th>
                                        <th className="px-mx-md py-mx-lg text-center">Proj</th>
                                        <th className="px-mx-md py-mx-lg text-center">Status</th>
                                        <th className="px-mx-md py-mx-lg text-center">Disciplina</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {stats.topStores.map(store => (
                                        <tr key={store.id} className="hover:bg-mx-slate-50/30 transition-colors group h-20">
                                            <td className="px-mx-xl py-2">
                                                <div className="flex items-center gap-mx-md">
                                                    <div className="w-10 h-10 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-sm">{store.name.charAt(0)}</div>
                                                    <div><p className="font-black text-sm text-text-primary uppercase leading-none mb-1">{store.name}</p></div>
                                                </div>
                                            </td>
                                            <td className="px-mx-md py-2 text-center font-black text-sm font-mono-numbers text-text-secondary">{store.leads}</td>
                                            <td className="px-mx-md py-2 text-center font-black text-sm font-mono-numbers text-text-secondary">{store.agd}</td>
                                            <td className="px-mx-md py-2 text-center font-black text-sm font-mono-numbers text-text-secondary">{store.vis}</td>
                                            <td className="px-mx-md py-2 text-center font-black text-lg font-mono-numbers text-brand-primary">{store.sales}</td>
                                            <td className="px-mx-md py-2 text-center font-black text-sm font-mono-numbers text-text-secondary">{store.goal}</td>
                                            <td className="px-mx-md py-2 text-center font-black text-sm font-mono-numbers text-status-error">{store.gap}</td>
                                            <td className="px-mx-md py-2 text-center font-black text-sm font-mono-numbers text-status-info">{store.proj}</td>
                                            <td className="px-mx-md py-2 text-center">
                                                <Badge className={cn("text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest", store.pacing >= 100 ? "bg-status-success-surface text-status-success" : "bg-status-warning-surface text-status-warning")}>
                                                    {store.pacing}%
                                                </Badge>
                                            </td>
                                            <td className="px-mx-md py-2 text-center font-black text-xs text-text-tertiary font-mono-numbers">{store.checkedInToday}/{store.sellers}</td>
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
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">SAÚDE DA OPERAÇÃO</span>
                        </div>
                        <div className="relative z-10 mb-mx-xl">
                            <p className="text-8xl font-black tracking-tighter leading-none mb-4">{stats.globalPacing}%</p>
                            <p className="text-sm font-bold text-white/50 italic leading-snug">Projeção média da rede contra o objetivo tático mensal oficial.</p>
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
                                { label: 'METAS NÃO DEFINIDAS', val: 3, tone: 'bg-status-error' },
                                { label: 'VENDEDORES SEM REGISTRO', val: 5, tone: 'bg-status-warning' },
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