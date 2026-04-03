import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    Building2,
    Car,
    ChevronRight,
    LayoutDashboard,
    Settings,
    Target,
    TrendingUp,
    Users,
    Zap,
    RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStores } from '@/hooks/useTeam'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useGlobalRanking } from '@/hooks/useRanking'
import { useNotifications } from '@/hooks/useData'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type StoreSales = { total: number; porta: number; cart: number; net: number }

type StoreDiagnostic = {
    id: string
    name: string
    sales: number
    goal: number
    pacing: number
    projection: number
    sellers: number
    checkedInToday: number
    hasGoal: boolean
}

const EMPTY_SALES: StoreSales = { total: 0, porta: 0, cart: 0, net: 0 }

export default function PainelConsultor() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { ranking } = useGlobalRanking()
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
            const daysPassed = Math.max(now.getDate(), 1)
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

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
                const porta = checkin.vnd_porta || 0
                const cart = checkin.vnd_cart || 0
                const net = checkin.vnd_net || 0
                salesMap[checkin.store_id].porta += porta
                salesMap[checkin.store_id].cart += cart
                salesMap[checkin.store_id].net += net
                salesMap[checkin.store_id].total += (porta + cart + net)
            }

            const sellerMap = new Map<string, Set<string>>()
            for (const member of sellerMemberships || []) {
                if (!sellerMap.has(member.store_id)) sellerMap.set(member.store_id, new Set())
                sellerMap.get(member.store_id)?.add(member.user_id)
            }

            const checkedInMap = new Map<string, Set<string>>()
            for (const checkin of todayCheckins || []) {
                if (!checkedInMap.has(checkin.store_id)) checkedInMap.set(checkin.store_id, new Set())
                checkedInMap.get(checkin.store_id)?.add(checkin.user_id)
            }

            const diagnosticsMap: Record<string, StoreDiagnostic> = {}
            for (const store of stores) {
                const sales = salesMap[store.id] || { ...EMPTY_SALES }
                const goal = goals.find(item => item.store_id === store.id)?.target || 0
                const pacing = goal > 0 ? Math.round((sales.total / goal) * 100) : 0
                const projection = Math.round((sales.total / daysPassed) * daysInMonth)
                const sellers = sellerMap.get(store.id)?.size || 0
                const checkedInToday = checkedInMap.get(store.id)?.size || 0

                diagnosticsMap[store.id] = {
                    id: store.id, name: store.name, sales: sales.total, goal, pacing, projection, sellers, checkedInToday, hasGoal: goal > 0,
                }
            }

            setStoreSales(salesMap)
            setDiagnostics(diagnosticsMap)
        } catch (err) {
            console.error('Audit Error:', err)
        } finally {
            setNetworkLoading(false)
            setIsRefetching(false)
        }
    }, [stores, goals])

    useEffect(() => {
        if (!storesLoading && !goalsLoading) fetchNetworkSnapshot()
    }, [storesLoading, goalsLoading, fetchNetworkSnapshot])

    const stats = useMemo(() => {
        const tSales = Object.values(storeSales).reduce((sum, item) => sum + item.total, 0)
        const tGoal = goals.reduce((sum, item) => sum + item.target, 0)
        const gPacing = tGoal > 0 ? Math.round((tSales / tGoal) * 100) : 0
        const unread = notifications.filter(item => !item.read).length
        
        const tStores = [...stores].map(store => ({
            ...store, metrics: diagnostics[store.id] || { id: store.id, name: store.name, sales: 0, goal: 0, pacing: 0, projection: 0, sellers: 0, checkedInToday: 0, hasGoal: false }
        })).sort((a, b) => b.metrics.sales - a.metrics.sales)

        return { totalSales: tSales, globalPacing: gPacing, unread, topStores: tStores }
    }, [storeSales, goals, notifications, stores, diagnostics])

    if (storesLoading || goalsLoading || networkLoading) return (
        <div className="flex items-center justify-center h-full w-full bg-white">
            <div className="w-12 h-12 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-md p-mx-md sm:p-mx-lg overflow-y-auto no-scrollbar">
            
            {/* Header - Melhor alinhamento e peso visual */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md mb-mx-sm">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-1 block">Gestão de Cluster • Live</span>
                    <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter uppercase">Painel de Controle</h1>
                </div>
                <div className="flex items-center gap-mx-sm">
                    <button onClick={() => fetchNetworkSnapshot(true)} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="grid grid-cols-4 gap-mx-xs">
                        {[
                            { label: 'Nodes', value: stores.length, icon: Building2, tone: 'bg-mx-indigo-50 text-mx-indigo-600' },
                            { label: 'Vendas', value: stats.totalSales, icon: Car, tone: 'bg-status-success-surface text-status-success' },
                            { label: 'Pacing', value: `${stats.globalPacing}%`, icon: Target, tone: 'bg-status-warning-surface text-status-warning' },
                            { label: 'Inbox', value: stats.unread, icon: Zap, tone: 'bg-status-error-surface text-status-error' },
                        ].map(item => (
                            <div key={item.label} className="flex flex-col items-center justify-center w-20 h-20 rounded-mx-xl bg-white border border-border-default shadow-mx-sm">
                                <item.icon size={16} className={cn("mb-1", item.tone.split(' ')[1])} />
                                <span className="text-lg font-black tracking-tighter leading-none">{item.value}</span>
                                <span className="text-[7px] font-black uppercase opacity-40">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-mx-2xl">
                
                {/* Ações Rápidas - Normalizados */}
                <div className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
                        {[
                            { to: '/lojas', label: 'Unidades', desc: 'Gerenciar Nodes', icon: Building2 },
                            { to: '/funil', label: 'Funil', desc: 'Conversão Real', icon: TrendingUp },
                            { to: '/notificacoes', label: 'Inbox', desc: 'Alertas Ativos', icon: Zap },
                            { to: '/configuracoes', label: 'Ajustes', desc: 'System Core', icon: Settings },
                        ].map(action => (
                            <Link key={action.to} to={action.to} className="mx-card p-mx-lg hover:-translate-y-1 group">
                                <div className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 flex items-center justify-center text-text-tertiary group-hover:bg-brand-secondary group-hover:text-white transition-all mb-mx-md">
                                    <action.icon size={22} />
                                </div>
                                <h3 className="text-lg font-black text-text-primary leading-none mb-1">{action.label}</h3>
                                <p className="text-[10px] font-bold text-text-tertiary uppercase">{action.desc}</p>
                            </Link>
                        ))}
                    </div>

                    {/* Tabela de Run-rate - Alinhamento Cirúrgico */}
                    <Card className="flex-1">
                        <CardHeader className="flex-row items-center justify-between border-b border-border-subtle bg-mx-slate-50/20">
                            <div>
                                <CardTitle className="!text-xl uppercase">Run-rate por Unidade</CardTitle>
                                <CardDescription>Performance consolidada do ciclo atual.</CardDescription>
                            </div>
                            <Link to="/lojas"><button className="mx-button-primary !h-10 !px-6">Ver Rede</button></Link>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-mx-slate-50/50 border-b border-border-default">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                                        <th className="px-mx-lg py-mx-md">Unidade</th>
                                        <th className="px-mx-md py-mx-md text-center">Vendas</th>
                                        <th className="px-mx-md py-mx-md text-center">Pacing</th>
                                        <th className="px-mx-md py-mx-md text-center">Tropa</th>
                                        <th className="px-mx-lg py-mx-md text-right">Gestão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {stats.topStores.map(store => (
                                        <tr key={store.id} className="hover:bg-mx-slate-50/30 transition-colors group h-20">
                                            <td className="px-mx-lg py-4">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all uppercase">{store.name.charAt(0)}</div>
                                                    <div><p className="font-black text-sm text-text-primary leading-none mb-1 uppercase">{store.name}</p><p className="text-[8px] font-black text-text-tertiary uppercase">Node 0{store.id.slice(0,1)}</p></div>
                                                </div>
                                            </td>
                                            <td className="px-mx-md py-4 text-center font-black text-lg font-mono-numbers">{store.metrics.sales}</td>
                                            <td className="px-mx-md py-4 text-center">
                                                <Badge className={cn("text-[9px] font-black", store.metrics.pacing >= 100 ? "bg-status-success-surface text-status-success" : "bg-status-warning-surface text-status-warning")}>
                                                    {store.metrics.pacing}%
                                                </Badge>
                                            </td>
                                            <td className="px-mx-md py-4 text-center font-black text-xs text-text-tertiary">{store.metrics.checkedInToday}/{store.metrics.sellers}</td>
                                            <td className="px-mx-lg py-4 text-right">
                                                <Link to={`/loja?id=${store.id}`} className="text-brand-primary hover:underline font-black text-[10px] uppercase flex items-center justify-end gap-1">Auditar <ChevronRight size={14} /></Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Metrics */}
                <div className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <div className="bg-brand-secondary rounded-mx-3xl p-mx-xl text-white shadow-mx-elite relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-transparent pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between mb-mx-xl">
                            <div className="w-14 h-14 rounded-mx-lg bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl"><Activity size={28} className="text-brand-primary" /></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Network Health</span>
                        </div>
                        <div className="relative z-10 mb-mx-lg">
                            <p className="text-7xl font-black tracking-tighter leading-none mb-2">{stats.globalPacing}%</p>
                            <p className="text-sm font-bold text-white/50 italic leading-tight">Run-rate médio do cluster contra o objetivo estratégico.</p>
                        </div>
                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-px shadow-inner relative z-10">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(stats.globalPacing, 100)}%` }} transition={{ duration: 1.5 }} className="h-full bg-brand-primary rounded-full shadow-[0_0_12px_rgba(79,70,229,0.6)]" />
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="bg-mx-slate-50/20 border-b border-border-subtle"><div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-status-error-surface text-status-error flex items-center justify-center border border-mx-rose-100 shadow-inner"><AlertTriangle size={20} /></div><div><CardTitle className="!text-lg uppercase">Audit Log</CardTitle><p className="mx-text-caption !text-[8px]">Inconsistências Detectadas</p></div></div></CardHeader>
                        <CardContent className="p-mx-lg space-y-mx-md">
                            {[
                                { label: 'Metas Pendentes', val: 3, tone: 'bg-status-error text-white' },
                                { label: 'Check-ins Atrasados', val: 5, tone: 'bg-status-warning text-white' },
                            ].map(log => (
                                <div key={log.label} className="flex items-center justify-between p-mx-md rounded-mx-xl bg-mx-slate-50/50 border border-border-subtle hover:bg-white transition-all">
                                    <span className="text-xs font-black text-text-primary uppercase tracking-tight">{log.label}</span>
                                    <div className={cn("w-10 h-10 rounded-mx-lg flex items-center justify-center font-black text-sm shadow-mx-sm", log.tone)}>{log.val}</div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
