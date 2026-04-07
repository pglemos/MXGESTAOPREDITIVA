import { useCheckins } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { 
    calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil 
} from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Car, Target, TrendingUp, Users, RefreshCw, Search, Calendar, Globe, AlertTriangle
} from 'lucide-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatProps {
    icon: any; label: string; value: string | number; sub?: string; bg: string; color: string; trend?: string; delay?: number
}

const Stat = ({ icon: Icon, label, value, sub, bg, color, trend, delay = 0 }: StatProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
        className="mx-card p-mx-lg flex flex-col justify-between hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl"
    >
        <div className={cn("absolute -right-8 -top-8 w-32 h-32 opacity-10 rounded-full blur-3xl transition-all z-0", bg)} />
        <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", bg, color)}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            {trend && (
                <Badge className={cn("border-none text-[8px] px-2 h-6 uppercase font-black tracking-widest bg-gray-50 text-gray-500")}>{trend}</Badge>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none font-mono-numbers">{value}</p>
                {sub && <span className="text-[10px] font-black text-gray-500 bg-gray-50 px-2 py-0.5 rounded uppercase tracking-widest">{sub}</span>}
            </div>
        </div>
    </motion.div>
)

export default function DashboardLoja() {
    const { membership, memberships, role, setActiveStoreId, storeId } = useAuth()
    const [searchParams] = useSearchParams()
    
    const now = new Date()
    const defaultStartOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const defaultEndOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`

    const [startDate, setStartDate] = useState(defaultStartOfMonth)
    const [endDate, setEndDate] = useState(defaultEndOfMonth)
    const [sellerSearch, setSellerSearch] = useState('')

    const filters = useMemo(() => ({ startDate, endDate }), [startDate, endDate])

    const { checkins, loading: checkinsLoading, fetchCheckins: refetchCheckins } = useCheckins(storeId || undefined)
    const { storeGoal, fetchGoals: refetchGoals } = useGoals(storeId || undefined)
    const { metaRules, fetchMetaRules } = useStoreMetaRules(storeId || undefined)
    const { sellers, refetch: refetchTeam } = useTeam(storeId || undefined)
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking(storeId || undefined, filters)
    
    const [isRefetching, setIsRefetching] = useState(false)

    useEffect(() => {
        const storeIdParam = searchParams.get('id')
        if (!storeIdParam) return
        if (role === 'admin' || memberships.some(m => m.store_id === storeIdParam)) {
            setActiveStoreId(storeIdParam)
        }
    }, [memberships, role, searchParams, setActiveStoreId])

    useEffect(() => {
        refetchCheckins(filters)
    }, [filters, refetchCheckins])

    const metrics = useMemo(() => {
        const meta = Number(metaRules?.monthly_goal ?? storeGoal?.target ?? 0)
        
        // Filter checkins by period for dashboard top metrics
        const periodCheckins = checkins.filter(c => c.reference_date >= startDate && c.reference_date <= endDate)

        const vendaLojaIds = new Set((sellers || []).filter(s => s.is_venda_loja).map(s => s.id))
        const checkinsForStoreTotal = metaRules?.include_venda_loja_in_store_total === false
            ? periodCheckins.filter(c => !vendaLojaIds.has(c.seller_user_id))
            : periodCheckins

        const vendasMes = somarVendas(checkinsForStoreTotal)
        const porCanal = somarVendasPorCanal(checkinsForStoreTotal)
        const atingimento = calcularAtingimento(vendasMes, meta)
        const dias = getDiasInfo()
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        const semRegistroCount = Math.max((sellers || []).length - checkedInCount, 0)
        const funil = calcularFunil(checkinsForStoreTotal)
        
        return { meta, vendasMes, porCanal, atingimento, projecao, faltaX, checkedInCount, semRegistroCount, funil, storeName: membership?.store?.name || 'UNIDADE' }
    }, [checkins, metaRules, storeGoal, sellers, membership, startDate, endDate])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(filters), refetchGoals(), fetchMetaRules(), refetchTeam(), refetchRanking?.() || Promise.resolve()])
            toast.success('Performance sincronizada!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, filters, refetchGoals, fetchMetaRules, refetchTeam, refetchRanking])

    const filteredRanking = useMemo(() => {
        if (!sellerSearch) return ranking || []
        const lowerSearch = sellerSearch.toLowerCase()
        return (ranking || []).filter(r => r.user_name.toLowerCase().includes(lowerSearch))
    }, [ranking, sellerSearch])

    const loading = checkinsLoading || rankingLoading

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-indigo-600" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-8 p-4 md:p-8 overflow-y-auto no-scrollbar bg-gray-50/30">
            
            {/* Header Operacional */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-200 pb-8 shrink-0">
                <div>
                    <span className="text-[10px] text-indigo-600 mb-2 block font-black tracking-[0.3em] uppercase">Operação de Loja</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">{metrics.storeName}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 px-4 border-r border-gray-100">
                        <Calendar size={16} className="text-gray-400" />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-[11px] font-black uppercase text-slate-700 bg-transparent focus:outline-none" />
                        <span className="text-gray-300 font-bold">até</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-[11px] font-black uppercase text-slate-700 bg-transparent focus:outline-none" />
                    </div>
                    <button onClick={handleRefresh} disabled={isRefetching} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                <Stat icon={Target} label="Meta Mensal" value={metrics.meta} sub={`${metrics.atingimento}% Atingido`} bg="bg-indigo-50" color="text-indigo-600" trend="ALVO" delay={0.1} />
                <Stat icon={Car} label="Acumulado" value={metrics.vendasMes} sub={`Faltam ${metrics.faltaX}`} bg="bg-emerald-50" color="text-emerald-600" trend="REALIZADO" delay={0.2} />
                <Stat icon={TrendingUp} label="Projeção" value={metrics.projecao} bg="bg-blue-50" color="text-blue-600" sub={metrics.projecao >= metrics.meta ? 'Ritmo Saudável' : 'Ritmo Abaixo'} trend="ESTIMADO" delay={0.3} />
                <Stat icon={Users} label="Check-ins (Hoje)" value={`${metrics.checkedInCount}/${(sellers || []).length}`} bg={metrics.semRegistroCount > 0 ? "bg-rose-50" : "bg-emerald-50"} color={metrics.semRegistroCount > 0 ? "text-rose-600" : "text-emerald-600"} sub={`${metrics.semRegistroCount} Sem Registro`} trend="OPERAÇÃO" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 shrink-0 pb-20">
                
                {/* Grade Operacional (Table) */}
                <div className="xl:col-span-8 flex flex-col gap-8">
                    <Card className="border border-gray-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-50/50 border-b border-gray-100 gap-4">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Grade Operacional</CardTitle>
                                <CardDescription className="font-bold text-gray-500 text-[10px] tracking-widest uppercase mt-1">Leitura Oficial por Vendedor</CardDescription>
                            </div>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Filtrar vendedor..." 
                                    value={sellerSearch}
                                    onChange={e => setSellerSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-300 w-full sm:w-64"
                                />
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-slate-50 border-b border-gray-200">
                                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-6 py-4 w-12 text-center">#</th>
                                        <th className="py-4">Especialista</th>
                                        <th className="py-4 text-center">Leads</th>
                                        <th className="py-4 text-center">Agend.</th>
                                        <th className="py-4 text-center">Visitas</th>
                                        <th className="py-4 text-center text-indigo-600">Vendas</th>
                                        <th className="py-4 text-center">Meta</th>
                                        <th className="py-4 text-center">% Ating.</th>
                                        <th className="px-6 py-4 text-center">Disciplina</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRanking.map((r, i) => {
                                        const seller = sellers?.find(s => s.id === r.user_id)
                                        const isCheckedIn = seller?.checkin_today
                                        return (
                                        <tr key={r.user_id} className={cn("hover:bg-slate-50/50 transition-colors h-16 group", r.is_venda_loja && "bg-amber-50/30 hover:bg-amber-50/60")}>
                                            <td className="px-6 py-2 text-center font-black text-[10px] text-gray-400">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="py-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs uppercase shadow-sm border", r.is_venda_loja ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200")}>
                                                        {r.user_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs text-slate-950 uppercase tracking-tight leading-none mb-1">{r.user_name}</p>
                                                        {r.is_venda_loja && <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Venda Loja</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-2 text-center font-black text-sm font-mono-numbers text-slate-700">{r.leads}</td>
                                            <td className="py-2 text-center font-black text-sm font-mono-numbers text-slate-700">{r.agd_total}</td>
                                            <td className="py-2 text-center font-black text-sm font-mono-numbers text-slate-700">{r.visitas}</td>
                                            <td className="py-2 text-center font-black text-lg font-mono-numbers text-indigo-600">{r.vnd_total}</td>
                                            <td className="py-2 text-center font-black text-sm font-mono-numbers text-slate-700">{r.is_venda_loja ? '-' : r.meta}</td>
                                            <td className="py-2 text-center">
                                                {!r.is_venda_loja && (
                                                    <span className={cn("font-mono-numbers font-black text-sm", r.atingimento >= 100 ? 'text-emerald-600' : 'text-amber-500')}>{r.atingimento}%</span>
                                                )}
                                                {r.is_venda_loja && <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="px-6 py-2 text-center">
                                                {!r.is_venda_loja && (
                                                    <Badge variant="outline" className={cn("text-[8px] font-black tracking-widest uppercase border-none px-2 py-1", isCheckedIn ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                                        {isCheckedIn ? 'Registrado' : 'Sem Registro'}
                                                    </Badge>
                                                )}
                                                {r.is_venda_loja && <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">-</span>}
                                            </td>
                                        </tr>
                                    )})}
                                    {filteredRanking.length === 0 && <tr><td colSpan={9} className="py-16 text-center text-[10px] uppercase text-gray-400 font-black tracking-widest bg-gray-50/50">Aguardando dados de performance...</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="xl:col-span-4 flex flex-col gap-8">
                    
                    {/* Canais de Conversão */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Mix Operacional</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Canais de Fechamento</p>
                            </div>
                            <Car size={18} className="text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Showroom', value: metrics.porCanal.porta, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={cn("p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-gray-100 transition-all", ch.bg)}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full", ch.color)} />
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", ch.text)}>{ch.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <span className={cn("text-xl font-black font-mono-numbers", ch.text)}>{ch.value}</span>
                                        <span className={cn("text-[9px] font-black opacity-60", ch.text)}>{ch.pct}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Escoamento MX Alert (if applicable) */}
                    {metrics.semRegistroCount > 0 && (
                        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex gap-4">
                            <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                            <div>
                                <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest mb-1">Risco Operacional</h4>
                                <p className="text-[10px] font-bold text-rose-600/80 leading-relaxed uppercase">
                                    Há {metrics.semRegistroCount} vendedor(es) Sem Registro na grade. O escoamento do funil diário está comprometido na visão geral.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}