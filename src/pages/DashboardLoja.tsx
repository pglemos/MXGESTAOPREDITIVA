import { useSellersByStore, useStores } from '@/hooks/useTeam'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { useCheckinsByDateRange } from '@/hooks/useCheckins'
import { useStoreGoal } from '@/hooks/useGoals'
import { useStoreSales } from '@/hooks/useStoreSales'
import { useDRE } from '@/hooks/useDRE'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    RefreshCw, Search, Globe, ChevronDown, Calendar, History, ArrowRight
} from 'lucide-react'
import { cn, slugify } from '@/lib/utils'
import { format, subDays, startOfMonth } from 'date-fns'
import { somarVendas, calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { motion } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DataGrid, Column } from '@/components/organisms/DataGrid'
import { supabase } from '@/lib/supabase'

export default function DashboardLoja() {
    const { role, storeId: authStoreId, setActiveStoreId, vinculos_loja } = useAuth()
    const { storeSlug } = useParams()
    const navigate = useNavigate()
    const { lojas, loading: storesLoading } = useStores()

    const [resolvedStoreId, setResolvedStoreId] = useState<string | null>(null)
    const [resolving, setResolving] = useState(!!storeSlug)

    const activeStores = useMemo(() => (lojas || []).filter(store => store.active), [lojas])
    const selectableStores = useMemo(() => {
        if (isPerfilInternoMx(role)) return activeStores
        return activeStores.filter(store => vinculos_loja.some(m => m.store_id === store.id))
    }, [activeStores, role, vinculos_loja])

    const queryStoreId = useMemo(() => {
        if (typeof window === 'undefined') return null
        return new URLSearchParams(window.location.search).get('id')
    }, [])

    useEffect(() => {
        const resolve = () => {
            if (!storeSlug) {
                setResolvedStoreId(null)
                setResolving(false)
                return
            }

            if (storesLoading && selectableStores.length === 0) {
                setResolving(true)
                return
            }

            setResolving(true)
            const found = selectableStores.find(store => slugify(store.name) === storeSlug)

            if (found) {
                setResolvedStoreId(found.id)
                setResolving(false)
                return
            }

            setResolvedStoreId(null)
            if (!storesLoading) {
                toast.error('Unidade não localizada.')
            }
            setResolving(false)
        }

        resolve()
    }, [storeSlug, selectableStores, storesLoading])

    const urlStoreId = storeSlug ? resolvedStoreId : queryStoreId
    const shouldUseStoreList = !storeSlug && !queryStoreId && (isPerfilInternoMx(role) || role === 'dono')
    const selectedStoreId = useMemo(() => {
        const requestedStoreId = urlStoreId || (!storeSlug && !shouldUseStoreList ? authStoreId || (isPerfilInternoMx(role) ? activeStores[0]?.id : null) : null) || null

        if ((role === 'gerente' || role === 'dono') && requestedStoreId) {
            const isMember = vinculos_loja.some(m => m.store_id === requestedStoreId)
            return isMember ? requestedStoreId : authStoreId
        }

        return requestedStoreId
    }, [activeStores, authStoreId, role, shouldUseStoreList, storeSlug, urlStoreId, vinculos_loja])

    useEffect(() => {
        if (selectedStoreId && selectedStoreId !== authStoreId) {
            setActiveStoreId(selectedStoreId)
        }
    }, [selectedStoreId, authStoreId, setActiveStoreId])

    const { sellers } = useSellersByStore(selectedStoreId)
    const { goal: storeGoal } = useStoreGoal(selectedStoreId)

    const [viewMode, setViewMode] = useState<'day' | 'month'>('day')
    const [startDate, setStartDate] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
    const [sellerSearch, setSellerSearch] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    // Fix Hydration Error: stabilize date generation using state to match SSR/CSR
    const [referenceDate] = useState(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'))
    
    const { checkins, loading, refetch } = useCheckinsByDateRange(
        selectedStoreId, 
        viewMode === 'day' ? referenceDate : startDate, 
        viewMode === 'day' ? referenceDate : endDate
    )

    // Realtime Sync: Escutar alterações na tabela de checkins para esta loja
    useEffect(() => {
        if (!selectedStoreId) return

        const channel = supabase
            .channel(`dashboard-sync-${selectedStoreId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lancamentos_diarios',
                    filter: `store_id=eq.${selectedStoreId}`
                },
                () => {
                    refetch() // Recarregar dados quando houver mudança real no banco
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedStoreId, refetch])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await refetch()
            toast.success('Performance sincronizada!')
        } finally {
            setIsRefetching(false)
        }
    }, [refetch])

    const storeSalesParams = useMemo(() => {
        const checkinsBySeller = (checkins || []).reduce((acc, c) => {
            if (!acc[c.seller_user_id]) acc[c.seller_user_id] = []
            acc[c.seller_user_id].push(c)
            return acc
        }, {} as Record<string, any[]>)

        return {
            checkins: checkins as any,
            ranking: (sellers || []).map(s => {
                const sellerCheckins = checkinsBySeller[s.id] || []
                return {
                    id: s.id,
                    user_id: s.id,
                    user_name: s.name,
                    is_venda_loja: s.is_venda_loja || false,
                    vnd_total: somarVendas(sellerCheckins as any),
                    leads: sellerCheckins.reduce((acc, c) => acc + (c.leads_prev_day || 0), 0),
                    agd_total: sellerCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0),
                    visitas: sellerCheckins.reduce((acc, c) => acc + (c.visit_prev_day || 0), 0),
                    meta: storeGoal?.target || 0,
                    atingimento: 0,
                    projecao: 0,
                    ritmo: 0,
                    efficiency: 0,
                    status: { label: '', color: '' },
                    gap: 0,
                    position: 0,
                    checkin_today: (sellers || []).find(sel => sel.id === s.id)?.checkin_today
                }
            }),
            rules: { monthly_goal: storeGoal?.target || 0 } as any
        }
    }, [checkins, sellers, storeGoal])

    const storeSales = useStoreSales(storeSalesParams)
    const { financials, computeDRE: computeDREFn } = useDRE(undefined, selectedStoreId || undefined)

    const latestDRE = useMemo(() => {
        if (!financials || financials.length === 0) return null
        return computeDREFn(financials[0])
    }, [financials, computeDREFn])

    const selectedStore = useMemo(() => {
        return activeStores.find(store => store.id === selectedStoreId)
            || vinculos_loja.find(m => m.store_id === selectedStoreId)?.store
            || null
    }, [activeStores, selectedStoreId, vinculos_loja])

    const metrics = useMemo(() => {
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        return {
            totalSales: storeSales.storeTotalVendas,
            totalLeads: storeSales.storeTotalLeads,
            totalAgd: storeSales.storeTotalAgd,
            totalVis: storeSales.storeTotalVis,
            attainment: storeSales.storeAttainment,
            goalValue: storeSales.storeGoal,
            checkedInCount,
            ranking: storeSales.processedRanking,
            storeName: selectedStore?.name || 'Unidade MX'
        }
    }, [storeSales, sellers, selectedStore])

    const funilData = useMemo(() => calcularFunil(checkins as any), [checkins])
    const diagnostics = useMemo(() => gerarDiagnosticoMX(funilData), [funilData])

    const mixCanais = useMemo(() => {
        const total = metrics.totalSales || 1
        const porta = (checkins || []).reduce((acc, c) => acc + (c.vnd_porta_prev_day || 0), 0)
        const carteira = (checkins || []).reduce((acc, c) => acc + (c.vnd_cart_prev_day || 0), 0)
        const digital = (checkins || []).reduce((acc, c) => acc + (c.vnd_net_prev_day || 0), 0)
        
        return [
            { label: 'Porta (Showroom)', color: 'bg-emerald-500', pct: Math.round((porta / total) * 100), tone: 'success' },
            { label: 'Carteira (Ativo)', color: 'bg-blue-500', pct: Math.round((carteira / total) * 100), tone: 'info' },
            { label: 'Digital (Leads)', color: 'bg-indigo-500', pct: Math.round((digital / total) * 100), tone: 'brand' },
        ]
    }, [checkins, metrics.totalSales])

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'position',
            header: 'POS',
            width: 'w-16',
            render: (_, i) => <span className="font-black text-sm text-text-label tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
        },
        {
            key: 'user_name',
            header: 'ESPECIALISTA',
            render: (r) => (
                <div className="flex items-center gap-mx-sm">
                    <div className={cn("w-mx-8 h-mx-8 sm:w-mx-10 sm:h-mx-10 rounded-mx-lg flex items-center justify-center font-black text-xs transition-all shadow-mx-inner uppercase border shrink-0", r.is_venda_loja ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-alt text-text-primary border-border-default group-hover:bg-brand-primary group-hover:text-white")}>
                        {r.user_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black leading-tight whitespace-normal break-words">{r.user_name}</Typography>
                        {r.is_venda_loja && <span className="text-mx-nano font-black bg-brand-primary text-white px-1 py-0.5 rounded uppercase tracking-widest">Venda Loja</span>}
                    </div>
                </div>
            )
        },
        { key: 'leads', header: 'LEADS', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums">{r.leads}</span> },
        { key: 'agd_total', header: 'AGEND.', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums text-status-info">{r.agd_total}</span> },
        { key: 'visitas', header: 'VISITAS', align: 'center', desktopOnly: true, render: (r) => <span className="opacity-60 tabular-nums">{r.visitas}</span> },
        {
            key: 'vnd_total',
            header: 'VENDAS',
            align: 'center',
            render: (r) => <span className="font-black text-xl sm:text-2xl text-brand-primary font-mono-numbers">{r.vnd_total}</span>
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'right',
            render: (r) => (
                <Badge variant={r.vnd_total > 0 ? 'success' : 'outline'} className="px-3 py-1 rounded-mx-lg font-black text-mx-tiny tracking-widest shadow-sm uppercase border-none">
                    {r.vnd_total > 0 ? 'CONVERSÃO' : 'EM AGUARDO'}
                </Badge>
            )
        }
    ], [])

    const filteredRanking = useMemo(() => {
        return metrics.ranking.filter(r => r.user_name.toLowerCase().includes(sellerSearch.toLowerCase()))
    }, [metrics.ranking, sellerSearch])

    if (!resolving && !storesLoading && !selectedStoreId && (isPerfilInternoMx(role) || role === 'dono')) {
        return <Navigate to="/lojas" replace />
    }

    if (resolving || (storesLoading && isPerfilInternoMx(role) && !selectedStoreId)) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt" role="status">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse font-black uppercase tracking-widest">Identificando Unidade...</Typography>
        </div>
    )

    if (loading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-full max-w-mx-64" />
                    <Skeleton className="h-mx-xs w-full max-w-mx-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
                </div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-mx-xl rounded-mx-2xl" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-md md:gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-xs text-center lg:text-left">
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest opacity-60 text-mx-tiny">Status de Unidade</Typography>                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="hidden sm:block w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        {(isPerfilInternoMx(role) || role === 'dono') ? (
                            <div className="relative group">
                                <select 
                                    value={selectedStoreId || ''} 
                                    onChange={e => {
                                        const newStoreId = e.target.value
                                        const newStore = selectableStores.find(store => store.id === newStoreId)
                                        if (newStore) {
                                            setActiveStoreId(newStoreId)
                                            navigate(`/lojas/${slugify(newStore.name)}`)
                                        }
                                    }}
                                    className="appearance-none bg-transparent text-3xl sm:text-5xl font-black text-text-primary tracking-tighter uppercase outline-none pr-10 cursor-pointer hover:text-brand-primary transition-colors whitespace-normal max-w-full"
                                >
                                    {selectableStores.map(store => (
                                        <option key={store.id} value={store.id} className="text-lg bg-white">{store.name.toUpperCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown size={24} className="absolute right-mx-0 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                            </div>
                        ) : (
                            <Typography variant="h1" className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">{metrics.storeName}</Typography>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
                    <nav className="bg-white p-mx-tiny rounded-mx-full shadow-mx-sm border border-border-default flex gap-mx-tiny">
                        {['month', 'day'].map((m) => (
                            <Button 
                                key={m} variant={viewMode === m ? 'secondary' : 'ghost'} size="sm"
                                onClick={() => setViewMode(m as any)} 
                                className="h-mx-8 sm:h-mx-10 px-4 sm:px-6 rounded-mx-full uppercase font-black tracking-widest text-mx-tiny"
                            >
                                {m === 'month' ? 'Mês' : 'D-1'}
                            </Button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-mx-sm px-4 bg-white h-mx-10 sm:h-mx-14 rounded-mx-xl shadow-mx-sm border border-border-default">
                        <Calendar size={14} className="text-brand-primary shrink-0" />
                        <input type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setViewMode('month')}} className="uppercase font-black text-text-primary bg-transparent outline-none text-mx-tiny w-mx-3xl sm:w-auto" />
                        <div className="hidden sm:block w-px h-mx-sm bg-border-strong mx-1" />
                        <input type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setViewMode('month')}} className="hidden sm:block uppercase font-black text-text-primary bg-transparent outline-none text-mx-tiny" />
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-md md:gap-mx-lg shrink-0">
                <Card className="p-mx-lg border-none bg-brand-secondary text-white shadow-mx-xl relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-white/5 rounded-mx-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="tiny" tone="white" className="opacity-50 mb-2 block font-black uppercase tracking-widest text-mx-tiny">Meta de Vendas</Typography>
                    <Typography variant="h1" tone="white" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.goalValue}</Typography>
                    <Badge variant="outline" className="text-white border-white/20 font-black h-mx-md uppercase text-mx-tiny">{metrics.attainment}% ATINGIDO</Badge>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Vendido Período</Typography>
                    <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">{metrics.totalSales}</Typography>
                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-tiny">REFERÊNCIA REAL-TIME</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-info-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Escoamento Médio</Typography>
                    <div className="flex items-baseline gap-mx-xs mb-2">
                        <Typography variant="h1" className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">{metrics.totalLeads}</Typography>
                        <Typography variant="h3" tone="muted" className="text-xl font-black uppercase opacity-20">LEADS</Typography>
                    </div>
                    <Typography variant="tiny" tone="info" className="font-black uppercase tracking-widest text-mx-tiny">{metrics.totalVis} VISITAS EFETUADAS</Typography>
                </Card>

                <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-success-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny">Saúde Disciplinar</Typography>
                    <Typography variant="h1" tone={metrics.checkedInCount < (sellers || []).length ? 'error' : 'success'} className="text-4xl sm:text-5xl tabular-nums leading-none mb-2 tracking-tighter font-mono-numbers">
                        {metrics.checkedInCount}<span className="text-text-tertiary text-2xl font-black">/{(sellers || []).length}</span>
                    </Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">REGISTROS SINCRONIZADOS</Typography>
                </Card>

                {/* DRE Summary for Owner/Admin */}
                {(isPerfilInternoMx(role) || role === 'dono') && latestDRE && (
                   <Card className="p-mx-lg bg-white shadow-mx-lg border-none animate-in slide-in-from-right duration-500 delay-300">
                       <Typography variant="tiny" tone="muted" className="mb-2 block font-black uppercase tracking-widest text-mx-tiny text-brand-primary">Lucratividade Preditiva (DRE)</Typography>
                        <div className="flex items-baseline gap-mx-xs mb-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black text-mx-nano">R$</Typography>
                            <Typography variant="h1" tone={latestDRE.net_profit >= 0 ? 'success' : 'error'} className="text-4xl sm:text-5xl tabular-nums leading-none tracking-tighter font-mono-numbers">
                                {Math.round(latestDRE.net_profit).toLocaleString('pt-BR')}
                            </Typography>
                        </div>
                       <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">RESULTADO LÍQUIDO MÊS</Typography>
                   </Card>
                )}
                </div>
            <Card className="w-full border-none shadow-mx-lg bg-white overflow-hidden">
                <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg md:text-xl uppercase tracking-tighter">Fluxo de Escoamento</CardTitle>
                            <CardDescription className="uppercase tracking-widest font-black mt-1 text-mx-tiny">TAXAS DE CONVERSÃO & BENCHMARKS MX</CardDescription>
                        </div>
                        <div className="hidden sm:flex items-baseline gap-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">Eficiência Global</Typography>
                            <Typography variant="h2" tone={funilData.tx_visita_vnd >= 33 ? 'success' : 'error'} className="tabular-nums">{funilData.tx_visita_vnd}%</Typography>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-mx-lg md:p-mx-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg md:gap-mx-14">
                        {[
                            { from: 'Leads', to: 'Agendamentos', val: funilData.tx_lead_agd, bench: 20 },
                            { from: 'Agendamentos', to: 'Visitas', val: funilData.tx_agd_visita, bench: 60 },
                            { from: 'Visitas', to: 'Vendas', val: funilData.tx_visita_vnd, bench: 33 },
                        ].map((step, idx) => (
                            <div key={idx} className="space-y-mx-md">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-mx-xs">
                                        <div className="w-mx-8 h-mx-8 rounded-mx-lg bg-surface-alt flex items-center justify-center font-black text-text-tertiary text-xs border border-border-default shadow-sm">0{idx+1}</div>
                                        <Typography variant="tiny" className="font-black uppercase tracking-tight">{step.from} <ArrowRight size={10} className="inline opacity-30" /> {step.to}</Typography>
                                    </div>
                                    <div className="flex items-baseline gap-mx-xs">
                                        <Typography variant="h2" tone={step.val >= step.bench ? 'success' : 'error'} className="text-2xl tabular-nums">{step.val}%</Typography>
                                        <Typography variant="tiny" tone="muted" className="font-black text-mx-micro">BENCH {step.bench}%</Typography>
                                    </div>
                                </div>
                                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-px">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(step.val, 100)}%` }} transition={{ duration: 1.2, delay: idx * 0.15, ease: "circOut" }}
                                        className={cn("h-full rounded-mx-full shadow-sm transition-all duration-1000", 
                                            step.val >= step.bench ? 'bg-status-success shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-status-error shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                                        )} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col">
                    <Card className="border-none shadow-mx-lg bg-white overflow-hidden flex-1">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-md p-mx-lg bg-surface-alt/30 border-b border-border-default">
                            <div>
                                <CardTitle className="text-xl md:text-2xl uppercase tracking-tighter">{viewMode === 'day' ? 'Grade Diária' : 'Classificação Unidade'}</CardTitle>
                                <CardDescription className="font-black uppercase tracking-widest mt-1 text-mx-tiny">AUDITORIA DE PERFORMANCE INDIVIDUAL</CardDescription>
                            </div>
                            <div className="relative group w-full sm:w-mx-sidebar-expanded">
                                <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                                <Input placeholder="BUSCAR..." value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} className="!pl-10 !h-10 text-mx-tiny font-black uppercase" />
                            </div>
                        </CardHeader>
                        <DataGrid columns={columns} data={filteredRanking} emptyMessage="Nenhum especialista localizado." />
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                        <header className="flex items-center gap-mx-sm mb-8 relative z-10">
                            <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-surface-alt flex items-center justify-center text-brand-primary shadow-mx-inner border border-border-default shrink-0"><Globe size={24} /></div>
                            <Typography variant="h3" className="text-lg uppercase tracking-tight font-black">Mix de Canais</Typography>
                        </header>
                        <div className="space-y-mx-lg relative z-10">
                            {mixCanais.map(ch => (
                                <div key={ch.label} className="space-y-mx-xs">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest text-mx-tiny">{ch.label}</Typography>
                                        <Typography variant="mono" tone={ch.tone as any} className="text-sm font-black">{ch.pct}%</Typography>
                                    </div>
                                    <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default p-0.5"><motion.div initial={{ width: 0 }} animate={{ width: `${ch.pct}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full", ch.color)} /></div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-mx-lg bg-brand-primary rounded-mx-3xl text-white shadow-mx-xl relative overflow-hidden group border-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                        <div className="relative z-10 text-center py-4">
                            <History className="mx-auto mb-6 opacity-30 transform group-hover:scale-110 transition-transform" size={40} />
                            <Typography variant="h2" tone="white" className="text-lg mb-4 uppercase tracking-tight font-black">Diagnóstico Unidade</Typography>
                            <Typography variant="caption" tone="white" className="text-mx-tiny font-black italic opacity-80 leading-relaxed uppercase tracking-widest max-w-xs mx-auto block italic">"{diagnostics.diagnostico} {diagnostics.sugestao}"</Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
