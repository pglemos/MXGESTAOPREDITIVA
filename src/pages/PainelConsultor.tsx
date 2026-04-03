import { Link } from 'react-router-dom'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Award,
    Bell,
    Building2,
    Car,
    CheckCircle2,
    ChevronRight,
    Globe,
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
                { data: monthCheckins, error: checkinsErr },
                { data: sellerMemberships, error: membersErr },
                { data: todayCheckins, error: todayErr },
            ] = await Promise.all([
                supabase
                    .from('daily_checkins')
                    .select('store_id, user_id, vnd_porta, vnd_cart, vnd_net')
                    .gte('date', monthStart),
                supabase
                    .from('memberships')
                    .select('store_id, user_id')
                    .eq('role', 'vendedor'),
                supabase
                    .from('daily_checkins')
                    .select('store_id, user_id')
                    .eq('date', today),
            ])

            if (checkinsErr || membersErr || todayErr) throw new Error('Sync fail')

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
            console.error('Audit Error [01]:', err)
        } finally {
            setNetworkLoading(false)
            setIsRefetching(false)
        }
    }, [stores, goals])

    useEffect(() => {
        let isMounted = true
        if (!storesLoading && !goalsLoading && isMounted) { fetchNetworkSnapshot() }
        return () => { isMounted = false }
    }, [storesLoading, goalsLoading, fetchNetworkSnapshot])

    const stats = useMemo(() => {
        const tSales = Object.values(storeSales).reduce((sum, item) => sum + item.total, 0)
        const tGoal = goals.reduce((sum, item) => sum + item.target, 0)
        const gPacing = tGoal > 0 ? Math.round((tSales / tGoal) * 100) : 0
        const unread = notifications.filter(item => !item.read).length
        
        const sByChannel = Object.values(storeSales).reduce((acc, item) => ({
            porta: acc.porta + item.porta, cart: acc.cart + item.cart, net: acc.net + item.net,
        }), { porta: 0, cart: 0, net: 0 })

        const tStores = [...stores].map(store => ({
            ...store, metrics: diagnostics[store.id] || { id: store.id, name: store.name, sales: 0, goal: 0, pacing: 0, projection: 0, sellers: 0, checkedInToday: 0, hasGoal: false }
        })).sort((a, b) => b.metrics.sales - a.metrics.sales)

        return { totalSales: tSales, globalPacing: gPacing, unread, salesByChannel: sByChannel, topStores: tStores }
    }, [storeSales, goals, notifications, stores, diagnostics])

    if (storesLoading || goalsLoading || networkLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin shadow-mx-lg"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse">Sincronizando cockpit de rede...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header - Tokenized Spacing & Typography */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg">
                <div>
                    <div className="flex items-center gap-mx-xs mb-mx-sm">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <span className="mx-text-caption">Operações em Tempo Real</span>
                    </div>
                    <h1 className="mx-heading-hero mb-mx-sm">Cockpit de Gestão</h1>
                    <p className="text-sm font-bold text-text-secondary max-w-2xl leading-relaxed">Interface unificada para monitoramento de run-rate e saúde da tropa.</p>
                </div>

                <div className="flex items-center gap-mx-sm">
                    <button onClick={() => fetchNetworkSnapshot(true)} className="w-14 h-14 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all active:scale-90 disabled:opacity-50">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-mx-xs">
                        {[
                            { label: 'Lojas', value: stores.length, icon: Building2, tone: 'bg-mx-indigo-50 text-mx-indigo-600 border-mx-indigo-100' },
                            { label: 'Vendas', value: stats.totalSales, icon: Car, tone: 'bg-status-success-surface text-status-success border-mx-emerald-100' },
                            { label: 'Pacing', value: `${stats.globalPacing}%`, icon: Target, tone: 'bg-status-warning-surface text-status-warning border-mx-amber-100' },
                            { label: 'Alertas', value: stats.unread, icon: Bell, tone: 'bg-status-error-surface text-status-error border-mx-rose-100' },
                        ].map(item => (
                            <div key={item.label} className="rounded-mx-lg border border-border-default bg-white p-mx-sm shadow-mx-sm">
                                <div className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center mb-mx-xs border", item.tone)}>
                                    <item.icon size={18} />
                                </div>
                                <p className="text-2xl font-black tracking-tighter text-text-primary">{item.value}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-text-tertiary">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-mx-3xl">
                {/* Main Stats (8/12) */}
                <div className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-mx-sm">
                        {[
                            { to: '/lojas', label: 'Unidades', icon: Building2, note: 'Rede' },
                            { to: '/funil', label: 'Funil', icon: TrendingUp, note: 'Conversão' },
                            { to: '/notificacoes', label: 'Inbox', icon: Bell, note: 'Central' },
                            { to: '/configuracoes', label: 'Ajustes', icon: Settings, note: 'Global' },
                        ].map(action => (
                            <Link key={action.to} to={action.to} className="mx-card p-mx-md mx-card-hover group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-mx-slate-50 rounded-full blur-3xl -mr-mx-md -mt-mx-md group-hover:bg-brand-primary-surface transition-colors" />
                                <div className="flex items-center justify-between mb-mx-lg relative z-10">
                                    <div className="w-12 h-12 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center text-text-primary group-hover:bg-brand-secondary group-hover:text-white transition-colors">
                                        <action.icon size={20} />
                                    </div>
                                    <ArrowRight size={18} className="text-text-tertiary group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                </div>
                                <p className="text-lg font-black text-text-primary tracking-tight relative z-10">{action.label}</p>
                                <p className="mx-text-caption mt-1 relative z-10">{action.note}</p>
                            </Link>
                        ))}
                    </div>

                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardDescription>Performance por Unidade</CardDescription>
                                <CardTitle>Run-rate Detalhado</CardTitle>
                            </div>
                            <Link to="/lojas">
                                <button className="mx-button-primary !h-10 !px-6">Ver Todas</button>
                            </Link>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default">
                                        <th className="pl-mx-lg py-mx-md">Loja</th>
                                        <th className="py-mx-md text-center">Vendas</th>
                                        <th className="py-mx-md text-center">Meta</th>
                                        <th className="py-mx-md text-center">Pacing</th>
                                        <th className="py-mx-md text-center">Check-in</th>
                                        <th className="pr-mx-lg py-mx-md text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {stats.topStores.map(store => (
                                        <tr key={store.id} className="hover:bg-mx-slate-50/50 transition-colors group">
                                            <td className="pl-mx-lg py-mx-md">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-11 h-11 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all">{store.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="font-black text-sm text-text-primary">{store.name}</p>
                                                        <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Node 0{store.id.slice(0,1)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-mx-md text-center font-black text-sm">{store.metrics.sales}</td>
                                            <td className="py-mx-md text-center font-black text-xs text-text-tertiary">{store.metrics.goal || '-'}</td>
                                            <td className="py-mx-md text-center">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    store.metrics.pacing >= 100 ? 'bg-status-success-surface text-status-success border-mx-emerald-100' :
                                                    store.metrics.pacing >= 70 ? 'bg-status-warning-surface text-status-warning border-mx-amber-100' :
                                                    'bg-status-error-surface text-status-error border-mx-rose-100'
                                                )}>{store.metrics.pacing}%</span>
                                            </td>
                                            <td className="py-mx-md text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", store.metrics.checkedInToday >= store.metrics.sellers ? "bg-status-success" : "bg-status-error")} />
                                                    <span className="text-xs font-black text-text-tertiary">{store.metrics.checkedInToday}/{store.metrics.sellers}</span>
                                                </div>
                                            </td>
                                            <td className="pr-mx-lg py-mx-md text-right">
                                                <Link to={`/loja?id=${store.id}`} className="inline-flex items-center gap-1 mx-text-caption text-brand-primary hover:underline">Abrir <ChevronRight size={14} /></Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar (4/12) */}
                <div className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <div className="rounded-mx-3xl bg-brand-secondary text-white p-mx-lg shadow-mx-elite relative overflow-hidden group">
                        <div className="absolute -right-mx-md -top-mx-md w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl group-hover:bg-brand-primary/30 transition-colors" />
                        <div className="flex items-center justify-between mb-mx-xl relative z-10">
                            <div className="w-14 h-14 rounded-mx-lg bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                                <Activity size={24} className="text-brand-primary" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Saude do Cluster</span>
                        </div>
                        <div className="relative z-10 mb-mx-md">
                            <p className="text-6xl font-black tracking-tighter leading-none mb-mx-sm">{stats.globalPacing}%</p>
                            <p className="text-sm font-bold text-white/50 leading-relaxed italic">Run-rate consolidado contra o target do node.</p>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 p-0.5 border border-white/5 relative z-10 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(stats.globalPacing, 100)}%` }} className="h-full rounded-full bg-brand-primary shadow-mx-md" />
                        </div>
                    </div>

                    <div className="mx-card p-mx-lg">
                        <div className="flex items-center gap-mx-sm mb-mx-lg">
                            <div className="w-12 h-12 rounded-mx-lg bg-status-error-surface text-status-error border border-mx-rose-100 flex items-center justify-center shadow-inner"><AlertTriangle size={20} strokeWidth={2.5} /></div>
                            <div>
                                <h2 className="text-xl font-black text-text-primary leading-none mb-1">Audit Log</h2>
                                <p className="mx-text-caption">Gaps Operacionais</p>
                            </div>
                        </div>
                        <div className="space-y-mx-sm">
                            <div className="flex items-center justify-between p-mx-sm rounded-mx-md border border-border-default bg-mx-slate-50/50">
                                <div><p className="font-black text-sm text-text-primary">Metas Pendentes</p><p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Ação Necessária</p></div>
                                <div className="w-10 h-10 rounded-mx-md bg-status-error text-white flex items-center justify-center font-black text-sm">3</div>
                            </div>
                            <div className="flex items-center justify-between p-mx-sm rounded-mx-md border border-border-default bg-mx-slate-50/50">
                                <div><p className="font-black text-sm text-text-primary">Check-ins D0</p><p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Aguardando Registro</p></div>
                                <div className="w-10 h-10 rounded-mx-md bg-status-warning text-white flex items-center justify-center font-black text-sm">5</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
