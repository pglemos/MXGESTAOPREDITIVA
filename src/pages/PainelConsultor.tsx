import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useStores } from '@/hooks/useTeam'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useGlobalRanking } from '@/hooks/useRanking'
import { useNotifications } from '@/hooks/useData'

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

    useEffect(() => {
        async function fetchNetworkSnapshot() {
            setNetworkLoading(true)

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

            const salesMap: Record<string, StoreSales> = {}
            for (const checkin of monthCheckins || []) {
                if (!salesMap[checkin.store_id]) salesMap[checkin.store_id] = { ...EMPTY_SALES }
                salesMap[checkin.store_id].porta += checkin.vnd_porta || 0
                salesMap[checkin.store_id].cart += checkin.vnd_cart || 0
                salesMap[checkin.store_id].net += checkin.vnd_net || 0
                salesMap[checkin.store_id].total += (checkin.vnd_porta || 0) + (checkin.vnd_cart || 0) + (checkin.vnd_net || 0)
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
            setNetworkLoading(false)
        }

        if (!storesLoading && !goalsLoading) fetchNetworkSnapshot()
    }, [stores, goals, storesLoading, goalsLoading])

    const totalSales = Object.values(storeSales).reduce((sum, item) => sum + item.total, 0)
    const totalGoal = goals.reduce((sum, item) => sum + item.target, 0)
    const globalPacing = totalGoal > 0 ? Math.round((totalSales / totalGoal) * 100) : 0
    const unreadNotifications = notifications.filter(item => !item.read).length
    const storesWithoutGoal = Object.values(diagnostics).filter(item => !item.hasGoal)
    const storesBehindPace = Object.values(diagnostics).filter(item => item.hasGoal && item.pacing < 70)
    const storesWithoutCheckin = Object.values(diagnostics).filter(item => item.sellers > 0 && item.checkedInToday === 0)
    const salesByChannel = Object.values(storeSales).reduce((acc, item) => ({
        porta: acc.porta + item.porta,
        cart: acc.cart + item.cart,
        net: acc.net + item.net,
    }), { porta: 0, cart: 0, net: 0 })

    const topStores = [...stores]
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

    if (storesLoading || goalsLoading || networkLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
                <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Reconstruindo cockpit...</p>
            </div>
        )
    }

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-8 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-gray-50 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Dashboard Legacy Restored</span>
                    </div>
                    <h1 className="text-[38px] font-black tracking-tighter leading-none">Cockpit do Sistema</h1>
                    <p className="mt-3 text-sm font-bold text-gray-500 max-w-2xl">
                        Restaurei o painel para voltar a concentrar visão global, run-rate, alertas operacionais e atalhos do sistema em um único lugar.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Lojas ativas', value: stores.length, icon: Building2, tone: 'bg-indigo-50 text-indigo-600' },
                        { label: 'Sellout rede', value: totalSales, icon: Car, tone: 'bg-emerald-50 text-emerald-600' },
                        { label: 'Pacing global', value: `${globalPacing}%`, icon: Target, tone: 'bg-amber-50 text-amber-600' },
                        { label: 'Alertas abertos', value: unreadNotifications, icon: Bell, tone: 'bg-rose-50 text-rose-600' },
                    ].map(item => (
                        <div key={item.label} className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${item.tone}`}>
                                <item.icon size={20} />
                            </div>
                            <p className="text-2xl font-black tracking-tighter">{item.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { to: '/lojas', label: 'Lojas', icon: Building2, note: 'estrutura e cadastro' },
                            { to: '/funil', label: 'Funil', icon: TrendingUp, note: 'gargalo e conversao' },
                            { to: '/notificacoes', label: 'Alertas', icon: Bell, note: 'broadcast e inbox' },
                            { to: '/configuracoes', label: 'Config.', icon: Settings, note: 'parametros do sistema' },
                        ].map(action => (
                            <Link
                                key={action.to}
                                to={action.to}
                                className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-center text-[#1A1D20] group-hover:bg-[#1A1D20] group-hover:text-white transition-colors">
                                        <action.icon size={20} />
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                </div>
                                <p className="text-lg font-black tracking-tight">{action.label}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{action.note}</p>
                            </Link>
                        ))}
                    </div>

                    <div className="rounded-[2.5rem] border border-gray-100 bg-white shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-gray-50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Run-rate da rede</p>
                                <h2 className="text-2xl font-black tracking-tight">Lojas, meta, pacing e projeção</h2>
                            </div>
                            <Link to="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                                <LayoutDashboard size={14} /> /dashboard
                            </Link>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-[#F8FAFC] text-[9px] uppercase tracking-[0.2em] text-gray-400">
                                        <th className="pl-8 py-4">Loja</th>
                                        <th className="py-4 text-center">Sellout</th>
                                        <th className="py-4 text-center">Meta</th>
                                        <th className="py-4 text-center">Pacing</th>
                                        <th className="py-4 text-center">Projeção</th>
                                        <th className="py-4 text-center">Equipe</th>
                                        <th className="pr-8 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topStores.map(store => (
                                        <tr key={store.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="pl-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-center font-black text-sm">
                                                        {store.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-sm">{store.name}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">node operacional</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 text-center font-black">{store.metrics.sales}</td>
                                            <td className="py-5 text-center font-black text-gray-500">{store.metrics.goal}</td>
                                            <td className="py-5 text-center">
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${store.metrics.pacing >= 100
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : store.metrics.pacing >= 70
                                                        ? 'bg-amber-50 text-amber-600'
                                                        : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                    {store.metrics.pacing}%
                                                </span>
                                            </td>
                                            <td className="py-5 text-center font-black text-gray-500">{store.metrics.projection}</td>
                                            <td className="py-5 text-center font-black text-gray-500">
                                                {store.metrics.checkedInToday}/{store.metrics.sellers}
                                            </td>
                                            <td className="pr-8 py-5 text-right">
                                                <Link to="/loja" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
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
                            { label: 'Showroom', value: salesByChannel.porta, tone: 'bg-emerald-50 text-emerald-600' },
                            { label: 'Carteira', value: salesByChannel.cart, tone: 'bg-blue-50 text-blue-600' },
                            { label: 'Internet', value: salesByChannel.net, tone: 'bg-indigo-50 text-indigo-600' },
                        ].map(channel => (
                            <div key={channel.label} className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${channel.tone}`}>
                                    <Globe size={20} />
                                </div>
                                <p className="text-3xl font-black tracking-tighter">{channel.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{channel.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-8">
                    <div className="rounded-[2.5rem] bg-[#1A1D20] text-white p-6 sm:p-8 shadow-2xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                                <Activity size={24} className="text-indigo-300" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Saude da operacao</span>
                        </div>
                        <p className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">{globalPacing}%</p>
                        <p className="mt-3 text-sm font-bold text-white/60">Pacing consolidado da rede com base nas metas mensais configuradas.</p>
                        <div className="mt-6 h-3.5 w-full rounded-full bg-white/10 p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(globalPacing, 100)}%` }}
                                transition={{ duration: 1 }}
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                            />
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Alertas operacionais</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">o que sumiu do dashboard antigo</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AlertItem
                                title="Lojas sem meta"
                                count={storesWithoutGoal.length}
                                description="unidades sem target mensal cadastrado"
                            />
                            <AlertItem
                                title="Pacing abaixo de 70%"
                                count={storesBehindPace.length}
                                description="unidades atrasadas contra a meta"
                            />
                            <AlertItem
                                title="Sem check-in hoje"
                                count={storesWithoutCheckin.length}
                                description="equipes inteiras sem atividade no dia"
                            />
                            <AlertItem
                                title="Notificações não lidas"
                                count={unreadNotifications}
                                description="alertas aguardando leitura"
                            />
                        </div>
                    </div>

                    {ranking.length > 0 && (
                        <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight">Top performers</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ranking global</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {ranking.slice(0, 5).map((item, index) => (
                                    <div key={item.user_id} className="flex flex-col gap-4 rounded-[1.8rem] bg-[#F8FAFC] border border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-sm truncate">{item.user_name}</p>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 truncate">{item.store_name || 'sem loja'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg">{item.vnd_total}</p>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">sellout</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Compatibilidade restaurada</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">links antigos</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm font-bold text-gray-500">
                            <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> `/dashboard` volta a abrir o cockpit certo.</p>
                            <p className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> `/settings`, `/funnel`, `/team`, `/training` e `/communication` foram redirecionados.</p>
                            <p className="flex items-center gap-2"><Users size={16} className="text-indigo-500" /> O admin agora enxerga o painel como dono do sistema, sem depender do papel consultor.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AlertItem({ title, count, description }: { title: string; count: number; description: string }) {
    const tone = count > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'

    return (
        <div className="flex flex-col gap-4 rounded-[1.8rem] border border-gray-100 bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-black text-sm text-[#1A1D20]">{title}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{description}</p>
            </div>
            <div className={`min-w-12 h-12 px-3 rounded-2xl border flex items-center justify-center font-black text-lg ${tone}`}>
                {count}
            </div>
        </div>
    )
}
