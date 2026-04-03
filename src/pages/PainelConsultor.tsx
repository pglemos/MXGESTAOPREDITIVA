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

            if (checkinsErr || membersErr || todayErr) throw new Error('Falha ao sincronizar dados do cockpit')

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
                    id: store.id,
                    name: store.name,
                    sales: sales.total,
                    goal,
                    pacing,
                    projection,
                    sellers,
                    checkedInToday,
                    hasGoal: goal > 0,
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
        if (!storesLoading && !goalsLoading && isMounted) {
            fetchNetworkSnapshot()
        }
        return () => { isMounted = false }
    }, [storesLoading, goalsLoading, fetchNetworkSnapshot])

    const { totalSales, globalPacing, unreadNotifications, salesByChannel, topStores } = useMemo(() => {
        const tSales = Object.values(storeSales).reduce((sum, item) => sum + item.total, 0)
        const tGoal = goals.reduce((sum, item) => sum + item.target, 0)
        const gPacing = tGoal > 0 ? Math.round((tSales / tGoal) * 100) : 0
        const unread = notifications.filter(item => !item.read).length
        
        const sByChannel = Object.values(storeSales).reduce((acc, item) => ({
            porta: acc.porta + item.porta,
            cart: acc.cart + item.cart,
            net: acc.net + item.net,
        }), { porta: 0, cart: 0, net: 0 })

        const tStores = [...stores]
            .map(store => ({
                ...store,
                metrics: diagnostics[store.id] || {
                    id: store.id,
                    name: store.name,
                    sales: 0,
                    goal: 0,
                    pacing: 0,
                    projection: 0,
                    sellers: 0,
                    checkedInToday: 0,
                    hasGoal: false,
                }
            }))
            .sort((a, b) => b.metrics.sales - a.metrics.sales)

        return {
            totalSales: tSales,
            globalPacing: gPacing,
            unreadNotifications: unread,
            salesByChannel: sByChannel,
            topStores: tStores
        }
    }, [storeSales, goals, notifications, stores, diagnostics])

    const storesWithoutGoal = useMemo(() => Object.values(diagnostics).filter(item => !item.hasGoal), [diagnostics])
    const storesBehindPace = useMemo(() => Object.values(diagnostics).filter(item => item.hasGoal && item.pacing < 70), [diagnostics])
    const storesWithoutCheckin = useMemo(() => Object.values(diagnostics).filter(item => item.sellers > 0 && item.checkedInToday === 0), [diagnostics])

    if (storesLoading || goalsLoading || networkLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
                <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
                <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase animate-pulse">Sincronizando cockpit de rede...</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col gap-8 md:gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-gray-100 pb-10">
                <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Operações em Tempo Real</span>
                    </div>
                    <h1 className="text-[42px] font-black tracking-tighter leading-none mb-4">Cockpit de Gestão</h1>
                    <p className="text-sm font-bold text-gray-500 max-w-2xl leading-relaxed">
                        Interface unificada para monitoramento de run-rate, saúde da tropa e volumetria de vendas por canal.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fetchNetworkSnapshot(true)}
                        disabled={isRefetching}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black hover:border-gray-200 transition-all active:scale-90 disabled:opacity-50"
                        aria-label="Atualizar dados"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Lojas Ativas', value: stores.length, icon: Building2, tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                            { label: 'Vendas Totais', value: totalSales, icon: Car, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                            { label: 'Pacing Geral', value: `${globalPacing}%`, icon: Target, tone: 'bg-amber-50 text-amber-600 border-amber-100' },
                            { label: 'Alertas IA', value: unreadNotifications, icon: Bell, tone: 'bg-rose-50 text-rose-600 border-rose-100' },
                        ].map(item => (
                            <div key={item.label} className="rounded-[1.8rem] border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 border", item.tone)}>
                                    <item.icon size={18} />
                                </div>
                                <p className="text-2xl font-black tracking-tighter leading-none mb-1">{item.value}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 whitespace-nowrap">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-20">
                {/* Main Stats Column */}
                <div className="xl:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { to: '/lojas', label: 'Unidades', icon: Building2, note: 'Cadastro Rede' },
                            { to: '/funil', label: 'Funil', icon: TrendingUp, note: 'Conversão' },
                            { to: '/notificacoes', label: 'Inbox', icon: Bell, note: 'Central' },
                            { to: '/configuracoes', label: 'Ajustes', icon: Settings, note: 'Global' },
                        ].map(action => (
                            <Link
                                key={action.to}
                                to={action.to}
                                className="rounded-[2.2rem] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-50 transition-colors" />
                                <div className="flex items-center justify-between mb-8 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-pure-black group-hover:bg-pure-black group-hover:text-white transition-colors">
                                        <action.icon size={20} />
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-electric-blue group-hover:translate-x-1 transition-all" />
                                </div>
                                <p className="text-lg font-black tracking-tight relative z-10">{action.label}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1 relative z-10">{action.note}</p>
                            </Link>
                        ))}
                    </div>

                    <div className="rounded-[2.5rem] border border-gray-100 bg-white shadow-elevation overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-gray-50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50/30">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Performance por Unidade</p>
                                <h2 className="text-2xl font-black tracking-tight">Run-rate Detalhado</h2>
                            </div>
                            <Link to="/lojas" className="px-5 py-2.5 rounded-full bg-white border border-gray-100 shadow-sm text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:shadow-md transition-all flex items-center gap-2">
                                <LayoutDashboard size={14} /> Ver Todas
                            </Link>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="bg-gray-50/50 text-[9px] uppercase tracking-[0.2em] text-gray-400">
                                        <th className="pl-8 py-5">Loja</th>
                                        <th className="py-5 text-center">Vendas</th>
                                        <th className="py-5 text-center">Meta</th>
                                        <th className="py-5 text-center">Pacing</th>
                                        <th className="py-5 text-center">Projeção</th>
                                        <th className="py-5 text-center">Check-in</th>
                                        <th className="pr-8 py-5 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {topStores.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center text-gray-400 font-bold italic">Nenhuma loja ativa no cluster.</td>
                                        </tr>
                                    ) : topStores.map(store => (
                                        <tr key={store.id} className="hover:bg-gray-50/50 transition-colors group cursor-default">
                                            <td className="pl-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-sm group-hover:bg-pure-black group-hover:text-white transition-colors">
                                                        {store.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm text-pure-black">{store.name}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Operacional</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 text-center font-black text-sm">{store.metrics.sales}</td>
                                            <td className="py-6 text-center font-black text-xs text-gray-400">{store.metrics.goal || '-'}</td>
                                            <td className="py-6 text-center">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border",
                                                    store.metrics.pacing >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    store.metrics.pacing >= 70 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                )}>
                                                    {store.metrics.pacing}%
                                                </span>
                                            </td>
                                            <td className="py-6 text-center font-mono-numbers font-bold text-gray-500">{store.metrics.projection}</td>
                                            <td className="py-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        store.metrics.checkedInToday >= store.metrics.sellers && store.metrics.sellers > 0 ? "bg-emerald-500" : "bg-rose-500"
                                                    )} />
                                                    <span className="text-xs font-black text-gray-400">{store.metrics.checkedInToday}/{store.metrics.sellers}</span>
                                                </div>
                                            </td>
                                            <td className="pr-8 py-6 text-right">
                                                <Link to={`/loja?id=${store.id}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-electric-blue hover:underline">
                                                    Abrir <ChevronRight size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Showroom', value: salesByChannel.porta, tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                            { label: 'Carteira', value: salesByChannel.cart, tone: 'bg-blue-50 text-blue-600 border-blue-100' },
                            { label: 'Canais Digitais', value: salesByChannel.net, tone: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        ].map(channel => (
                            <div key={channel.label} className="rounded-[2.2rem] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border", channel.tone)}>
                                    <Globe size={20} />
                                </div>
                                <p className="text-4xl font-black tracking-tighter mb-1">{channel.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{channel.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                    <div className="rounded-[2.5rem] bg-pure-black text-white p-8 shadow-3xl relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-electric-blue/20 rounded-full blur-3xl group-hover:bg-electric-blue/30 transition-colors" />
                        
                        <div className="flex items-center justify-between gap-4 mb-10 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                                <Activity size={24} className="text-electric-blue" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Saude da Operação</span>
                        </div>
                        
                        <div className="relative z-10 mb-8">
                            <p className="text-6xl font-black tracking-tighter leading-none mb-4">{globalPacing}%</p>
                            <p className="text-sm font-bold text-white/50 leading-relaxed">Pacing consolidado da rede contra o target mensal.</p>
                        </div>

                        <div className="relative z-10">
                            <div className="h-4 w-full rounded-full bg-white/5 p-1 border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(globalPacing, 100)}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full rounded-full bg-gradient-to-r from-electric-blue to-cyan-400 shadow-[0_0_15px_rgba(79,70,229,0.5)] will-change-[width]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight leading-none mb-1">Gaps Operacionais</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Auditoria Automática</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AlertItem title="Unidades sem Meta" count={storesWithoutGoal.length} description="Impedindo projeção de run-rate" />
                            <AlertItem title="Baixa Performance" count={storesBehindPace.length} description="Pacing abaixo da zona de segurança" />
                            <AlertItem title="Check-in Pendente" count={storesWithoutCheckin.length} description="Lojas sem atividade registrada hoje" />
                            <AlertItem title="Alertas IA" count={unreadNotifications} description="Notificações críticas pendentes" />
                        </div>
                    </div>

                    {ranking.length > 0 && (
                        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight leading-none mb-1">Top Performers</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Ranking por Sellout</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {ranking.slice(0, 5).map((item, index) => (
                                    <div key={item.user_id} className="flex items-center justify-between rounded-2xl bg-gray-50/50 border border-gray-100 p-4 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-xs">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-sm text-pure-black truncate">{item.user_name}</p>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">{item.store_name || 'Individual'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-base leading-none mb-1">{item.vnd_total}</p>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Unidades</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function AlertItem({ title, count, description }: { title: string; count: number; description: string }) {
    const isCritical = count > 0
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="min-w-0">
                <p className={cn("font-black text-sm truncate", isCritical ? "text-pure-black" : "text-gray-400")}>{title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">{description}</p>
            </div>
            <div className={cn(
                "min-w-10 h-10 px-3 rounded-xl border flex items-center justify-center font-black text-sm transition-colors",
                isCritical ? "bg-rose-50 text-rose-600 border-rose-100 shadow-sm" : "bg-emerald-50 text-emerald-600 border-emerald-100"
            )}>
                {count}
            </div>
        </div>
    )
}
