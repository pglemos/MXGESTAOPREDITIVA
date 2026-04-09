import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { 
    calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil, calcularRitmo 
} from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Car, Target, TrendingUp, Users, RefreshCw, Search, Calendar, Globe, AlertTriangle, ChevronDown, CheckCircle2, XCircle
} from 'lucide-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Skeleton } from '@/components/ui/skeleton'

interface StatProps {
    icon: any; label: string; value: string | number; sub?: string; bg: string; color: string; trend?: string; delay?: number; highlight?: boolean; loading?: boolean
}

const Stat = ({ icon: Icon, label, value, sub, bg, color, trend, delay = 0, highlight = false, loading = false }: StatProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
        className={cn(
            "mx-card p-mx-lg flex flex-col justify-between hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white border shadow-sm rounded-3xl",
            highlight ? "border-indigo-200 ring-4 ring-indigo-50/50" : "border-gray-100"
        )}
    >
        <div className={cn("absolute -right-8 -top-8 w-32 h-32 opacity-10 rounded-full blur-3xl transition-all z-0", bg)} aria-hidden="true" />
        <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", bg, color)} aria-hidden="true">
                <Icon size={22} strokeWidth={2.5} />
            </div>
            {trend && (
                <Badge className={cn("border-none text-[8px] px-2 h-6 uppercase font-black tracking-widest bg-gray-50 text-gray-500")}>{trend}</Badge>
            )}
        </div>
        <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-black mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-black text-slate-950 tracking-tighter leading-none font-mono-numbers">{value}</p>}
                {sub && !loading && <span className="text-xs font-black text-gray-600 bg-gray-50 px-2 py-0.5 rounded uppercase tracking-widest">{sub}</span>}
            </div>
        </div>
    </motion.div>
)

export default function DashboardLoja() {
    const { membership, memberships, role, setActiveStoreId, storeId } = useAuth()
    const [searchParams] = useSearchParams()
    
    const today = new Date()
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
    
    const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-01'))
    const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'))
    const [sellerSearch, setSellerSearch] = useState('')

    // Auto-switch dates based on viewMode
    useEffect(() => {
        if (viewMode === 'day') {
            setStartDate(referenceDate)
            setEndDate(referenceDate)
        } else {
            setStartDate(format(startOfMonth(today), 'yyyy-MM-01'))
            setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
        }
    }, [viewMode, referenceDate])

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
        
        // Sold Yesterday (D-1)
        const checkinsYesterday = checkins.filter(c => c.reference_date === referenceDate)
        const vendidoOntem = somarVendas(checkinsYesterday)

        // Filter checkins by period for dashboard top metrics
        const periodCheckins = checkins.filter(c => c.reference_date >= startDate && c.reference_date <= endDate)

        const vendaLojaIds = new Set((sellers || []).filter(s => s.is_venda_loja).map(s => s.id))
        const checkinsForStoreTotal = metaRules?.include_venda_loja_in_store_total === false
            ? periodCheckins.filter(c => !vendaLojaIds.has(c.seller_user_id))
            : periodCheckins

        const vendasPeriodo = somarVendas(checkinsForStoreTotal)
        const porCanal = somarVendasPorCanal(checkinsForStoreTotal)
        const atingimento = calcularAtingimento(vendasPeriodo, meta)
        
        // Regra MX: A projeção deve ser baseada no último dia consolidado (ontem)
        const dias = getDiasInfo(referenceDate) 
        const projecao = calcularProjecao(vendasPeriodo, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasPeriodo)
        const ritmo = calcularRitmo(meta, vendasPeriodo, dias.restantes)
        
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        const semRegistroCount = Math.max((sellers || []).length - checkedInCount, 0)
        
        return { 
            meta, vendasPeriodo, vendidoOntem, porCanal, atingimento, projecao, faltaX, ritmo,
            checkedInCount, semRegistroCount, 
            storeName: membership?.store?.name || 'UNIDADE' 
        }
    }, [checkins, metaRules, storeGoal, sellers, membership, startDate, endDate, referenceDate])

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

    return (
        <main className="w-full h-full flex flex-col gap-8 p-4 md:p-8 overflow-y-auto no-scrollbar bg-gray-50/30">
            
            {/* Header Operacional com Seletor de Loja */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-gray-200 pb-8 shrink-0">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-indigo-600 font-black tracking-[0.3em] uppercase">Status de Unidade</span>
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-12 bg-slate-950 rounded-full" aria-hidden="true" />
                        {role === 'admin' || role === 'dono' ? (
                            <div className="relative group">
                                <label htmlFor="store-dashboard-select" className="sr-only">Trocar Unidade Operacional</label>
                                <select 
                                    id="store-dashboard-select"
                                    value={storeId || ''} 
                                    onChange={e => setActiveStoreId(e.target.value)}
                                    className="appearance-none bg-transparent text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none outline-none pr-10 cursor-pointer hover:text-indigo-600 transition-colors focus-visible:ring-4 focus-visible:ring-indigo-500/10"
                                >
                                    {memberships.map(m => (
                                        <option key={m.store_id} value={m.store_id}>{m.store?.name || 'LOJA'}</option>
                                    ))}
                                </select>
                                <ChevronDown size={32} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                            </div>
                        ) : (
                            <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">{metrics.storeName}</h1>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                    {/* View Mode Toggle */}
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1" role="group" aria-label="Escopo da Visualização">
                        <button 
                            type="button"
                            onClick={() => setViewMode('month')}
                            aria-pressed={viewMode === 'month'}
                            className={cn(
                                "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-slate-500 outline-none",
                                viewMode === 'month' ? "bg-slate-950 text-white shadow-md" : "text-gray-500 hover:text-slate-700"
                            )}
                        >
                            Mês Atual
                        </button>
                        <button 
                            type="button"
                            onClick={() => setViewMode('day')}
                            aria-pressed={viewMode === 'day'}
                            className={cn(
                                "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none",
                                viewMode === 'day' ? "bg-indigo-600 text-white shadow-md" : "text-gray-500 hover:text-slate-700"
                            )}
                        >
                            Ontem (D-1)
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-4 bg-white h-14 rounded-2xl shadow-sm border border-gray-100">
                        <Calendar size={16} className="text-gray-400" aria-hidden="true" />
                        <label htmlFor="start-date" className="sr-only">Data Inicial</label>
                        <input id="start-date" type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="text-[10px] font-black uppercase text-slate-700 bg-transparent focus:outline-none" />
                        <span className="text-gray-400 font-bold mx-1" aria-hidden="true">até</span>
                        <label htmlFor="end-date" className="sr-only">Data Final</label>
                        <input id="end-date" type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="text-[10px] font-black uppercase text-slate-700 bg-transparent focus:outline-none" />
                    </div>

                    <button onClick={handleRefresh} disabled={isRefetching} aria-label="Sincronizar Performance" className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none">
                        <RefreshCw size={20} className={cn((isRefetching || loading) && "animate-spin")} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0" aria-live="polite">
                <Stat 
                    icon={Target} 
                    label="Meta de Vendas" 
                    value={metrics.meta} 
                    sub={`${metrics.atingimento}% Atingido`} 
                    bg="bg-indigo-50" 
                    color="text-indigo-600" 
                    trend="MÊS" 
                    delay={0.1} 
                    loading={loading}
                />
                <Stat 
                    icon={Car} 
                    label="Vendido (D-1)" 
                    value={metrics.vendidoOntem} 
                    sub={format(parseISO(referenceDate), "dd/MM/yyyy")} 
                    bg="bg-emerald-50" 
                    color="text-emerald-600" 
                    trend="REF HOJE" 
                    highlight={viewMode === 'day'}
                    delay={0.2} 
                    loading={loading}
                />
                <Stat 
                    icon={TrendingUp} 
                    label="Projeção" 
                    value={metrics.projecao} 
                    bg="bg-blue-50" 
                    color="text-blue-600" 
                    sub={metrics.projecao >= metrics.meta ? 'No Ritmo' : 'Abaixo do Ritmo'} 
                    trend="FECHAMENTO" 
                    delay={0.3} 
                    loading={loading}
                />
                <Stat 
                    icon={Users} 
                    label="Status Equipe" 
                    value={`${metrics.checkedInCount}/${(sellers || []).length}`} 
                    bg={metrics.semRegistroCount > 0 ? "bg-rose-50" : "bg-emerald-50"} 
                    color={metrics.semRegistroCount > 0 ? "text-rose-600" : "text-emerald-600"} 
                    sub={metrics.semRegistroCount > 0 ? `${metrics.semRegistroCount} Sem Registro` : '100% OK'} 
                    trend="DISCIPLINA" 
                    delay={0.4} 
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 shrink-0 pb-20">
                
                {/* Grade Operacional (Table) */}
                <section className="xl:col-span-8 flex flex-col gap-8" aria-labelledby="operational-grid-title">
                    <Card className="border border-gray-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="flex-col sm:flex-row items-start sm:items-center justify-between p-8 bg-slate-50/50 border-b border-gray-100 gap-4">
                            <div>
                                <CardTitle id="operational-grid-title" className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    {viewMode === 'day' ? 'Grade Diária MX' : 'Ranking de Performance'}
                                    <Badge className="bg-white border-gray-200 text-gray-500 text-[10px] font-black tracking-widest uppercase">
                                        {viewMode === 'day' ? 'Foco D-1' : 'Acumulado'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="font-bold text-gray-500 text-[10px] tracking-widest uppercase mt-1">
                                    {viewMode === 'day' ? `Visualização bruta do fechamento em ${format(parseISO(referenceDate), "dd/MM/yyyy", { locale: ptBR })}` : 'Performance consolidada do período selecionado'}
                                </CardDescription>
                            </div>
                            <div className="relative group">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" aria-hidden="true" />
                                <label htmlFor="seller-search-input" className="sr-only">Buscar especialista por nome</label>
                                <input 
                                    id="seller-search-input"
                                    type="text" 
                                    placeholder="BUSCAR VENDEDOR..." 
                                    value={sellerSearch}
                                    onChange={e => setSellerSearch(e.target.value)}
                                    className="pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-indigo-300 w-full sm:w-64 shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all"
                                />
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[800px] border-collapse">
                                <caption className="sr-only">Tabela detalhada de performance por especialista da unidade</caption>
                                <thead className="bg-slate-950 border-b border-gray-800">
                                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <th scope="col" className="px-4 py-4 w-10 text-center border-r border-slate-800">Pos</th>
                                        <th scope="col" className="px-4 py-4 border-r border-slate-800">Especialista</th>
                                        <th scope="col" className="py-4 text-center border-r border-slate-800">Vendas</th>
                                        <th scope="col" className="py-4 text-center border-r border-slate-800 hidden md:table-cell">Projeção</th>
                                        <th scope="col" className="py-4 text-center border-r border-slate-800 hidden md:table-cell">Ritmo</th>
                                        <th scope="col" className="px-4 py-4 text-right">Disciplina</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredRanking.map((r, i) => {
                                        const seller = sellers?.find(s => s.id === r.user_id)
                                        const isCheckedIn = seller?.checkin_today
                                        return (
                                            <tr key={r.user_id} className={cn("transition-all h-14 group border-l-4", isCheckedIn ? "border-l-transparent" : "border-l-rose-500", r.is_venda_loja && "bg-amber-50/50")}>
                                                <td className="px-2 text-center font-black text-xs text-slate-500 font-mono-numbers border-r border-gray-100">{(i + 1).toString().padStart(2, '0')}</td>
                                                <td className="px-4 border-r border-gray-100 font-black text-sm truncate uppercase text-slate-900">{r.user_name}</td>
                                                <td className="text-center font-black text-lg font-mono-numbers text-indigo-600 border-r border-gray-100 bg-indigo-50/30">{r.vnd_total}</td>
                                                <td className="text-center font-black text-xs font-mono-numbers text-blue-600 border-r border-gray-100 bg-blue-50/20 hidden md:table-cell">{r.projecao}</td>
                                                <td className="text-center font-black text-xs font-mono-numbers text-amber-600 border-r border-gray-100 bg-amber-50/20 hidden md:table-cell">{r.ritmo}</td>
                                                <td className="px-4 text-right">
                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", isCheckedIn ? "text-emerald-600" : "text-rose-600")}>
                                                        {isCheckedIn ? 'OK' : 'PENDENTE'}
                                                        <span className="sr-only">{isCheckedIn ? '- Registro realizado' : '- Registro pendente'}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredRanking.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-xs uppercase text-gray-500 font-black tracking-[0.3em] bg-gray-50/50">
                                                Nenhum registro encontrado no período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-8">
                    
                    {/* Canais de Conversão */}
                    <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group" aria-labelledby="channels-title">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl group-hover:bg-indigo-50/50 transition-colors" aria-hidden="true" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 id="channels-title" className="text-sm font-black text-slate-950 uppercase tracking-[0.2em]">Mix de Canais</h3>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{viewMode === 'day' ? 'Fechamento Ontem' : 'Acumulado Período'}</p>
                            </div>
                            <Globe size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                        </div>
                        <div className="space-y-4 relative z-10">
                            {[
                                { label: 'Showroom', value: metrics.porCanal.porta, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', pct: Math.round((metrics.porCanal.porta / (metrics.vendasPeriodo || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasPeriodo || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, color: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', pct: Math.round((metrics.porCanal.internet / (metrics.vendasPeriodo || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={cn("p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-gray-100 transition-all", ch.bg)}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2.5 h-2.5 rounded-full", ch.color)} aria-hidden="true" />
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", ch.text)}>{ch.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <span className={cn("text-2xl font-black font-mono-numbers", ch.text)}>{ch.value}</span>
                                        <span className={cn("text-[10px] font-black opacity-70", ch.text)}>{ch.pct}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Escoamento MX Alert */}
                    {metrics.semRegistroCount > 0 && (
                        <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-100 flex gap-5 relative overflow-hidden group" role="alert">
                            <div className="absolute -left-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse" aria-hidden="true" />
                            <AlertTriangle className="text-white shrink-0 mt-1" size={24} aria-hidden="true" />
                            <div className="relative z-10">
                                <h4 className="text-xs font-black uppercase tracking-widest mb-2">Bloqueio de Visibilidade</h4>
                                <p className="text-[10px] font-black leading-relaxed uppercase opacity-95">
                                    Há {metrics.semRegistroCount} especialista(s) Sem Registro. A performance consolidada da loja não representa a realidade operacional do dia.
                                </p>
                            </div>
                        </div>
                    )}

                    <section className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 text-center space-y-4" aria-labelledby="projections-title">
                        <TrendingUp size={32} className="mx-auto text-indigo-400 opacity-40" aria-hidden="true" />
                        <h3 id="projections-title" className="sr-only">Projeções de Fechamento</h3>
                        <div className="flex flex-col gap-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Gap para Alvo</p>
                                <p className="text-4xl font-black tracking-tighter tabular-nums text-rose-500">-{metrics.faltaX}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-2">Unidades Faltantes</p>
                            </div>
                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Ritmo Diário</p>
                                <p className="text-4xl font-black tracking-tighter tabular-nums">{metrics.ritmo}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mt-2">Vendas/Dia Necessárias</p>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    )
}
