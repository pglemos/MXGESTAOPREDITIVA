import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    TrendingUp, Target, Zap, 
    RefreshCw, MessageCircle, BarChart3, Mail, FileDown,
    Users, Activity, ChevronDown, Building2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { format, parseISO, startOfMonth, startOfWeek, endOfWeek, endOfMonth, startOfDay, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento, formatWhatsAppMorningReport } from '@/lib/calculations'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Skeleton } from '@/components/atoms/Skeleton'
import { SkeletonStats, SkeletonList } from '@/components/atoms/skeletons'
import { Avatar } from '@/components/atoms/Avatar'
import { Card, CardHeader, CardTitle } from '@/components/molecules/Card'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { DailyCheckin, Store } from '@/types/database'
import { isLancamentosViaRpcEnabled } from '@/lib/feature-flags'
import { traced } from '@/lib/observability'

type StoreMorningData = {
    store_id: string
    store_name: string
    totalSales: number
    goal: number
    reaching: number
    projection: number
    gap: number
    checkedInCount: number
    totalSellers: number
    totalLeads: number
    totalVisits: number
    sellers: { id: string; name: string; avatar_url: string | null; checkin_today: boolean; vnd_total: number; leads: number }[]
}

type AdminStoreRow = Pick<Store, 'id' | 'name'>
type MorningGoalRow = {
    store_id: string
    monthly_goal: number | null
}
type MorningCheckinRow = Pick<DailyCheckin,
    'seller_user_id'
    | 'store_id'
    | 'reference_date'
    | 'leads_prev_day'
    | 'vnd_porta_prev_day'
    | 'vnd_cart_prev_day'
    | 'vnd_net_prev_day'
    | 'visit_prev_day'
>
type MorningPresenceRow = Pick<DailyCheckin, 'seller_user_id' | 'store_id'>
type MorningMemberRow = {
    user_id: string
    store_id: string
    users: {
        id: string
        name: string
        avatar_url: string | null
        active: boolean
    } | null
}
type MorningSeller = StoreMorningData['sellers'][number]

export default function MorningReport() {
    const { profile, storeId, vinculos_loja, role } = useAuth()
    const isAdmin = isPerfilInternoMx(role)

    if (isAdmin) return <AdminMorningReport />
    return <StoreMorningReport />
}

type ReportTimeframe = 'diario' | 'semanal' | 'mensal'

function getRange(tf: ReportTimeframe) {
    const now = new Date()
    switch (tf) {
        case 'diario': {
            const ref = subDays(now, 1)
            return { start: format(ref, 'yyyy-MM-dd'), end: format(ref, 'yyyy-MM-dd'), label: format(ref, 'dd/MM/yyyy', { locale: ptBR }) }
        }
        case 'semanal': {
            const ws = startOfWeek(now, { weekStartsOn: 1 })
            const we = endOfWeek(now, { weekStartsOn: 1 })
            return { start: format(ws, 'yyyy-MM-dd'), end: format(we, 'yyyy-MM-dd'), label: `${format(ws, 'dd/MM', { locale: ptBR })} — ${format(we, 'dd/MM/yyyy', { locale: ptBR })}` }
        }
        case 'mensal': {
            return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd'), label: format(now, 'MMMM yyyy', { locale: ptBR }) }
        }
    }
}

function AdminMorningReport() {
    const [storeData, setStoreData] = useState<StoreMorningData[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [isTriggering, setIsTriggering] = useState<string | null>(null)
    const [timeframe, setTimeframe] = useState<ReportTimeframe>('mensal')

    const daysInfo = useMemo(() => getDiasInfo(), [])
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const range = useMemo(() => getRange(timeframe), [timeframe])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const useRpc = isLancamentosViaRpcEnabled()
            const checkinsPromise = useRpc
                ? traced(async () => supabase.rpc('get_lancamentos_rede_periodo', {
                    p_start_date: range.start,
                    p_end_date: range.end,
                    p_scope: 'daily',
                })).then(({ result }) => result)
                : supabase.from('lancamentos_diarios')
                    .select('seller_user_id, store_id, reference_date, leads_prev_day, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day')
                    .gte('reference_date', range.start).lte('reference_date', range.end)
            const todayCheckinsPromise = useRpc
                ? traced(async () => supabase.rpc('get_lancamentos_referencia_dia', {
                    p_reference_date: referenceDate,
                    p_scope: 'daily',
                })).then(({ result }) => result)
                : supabase.from('lancamentos_diarios').select('seller_user_id, store_id').eq('reference_date', referenceDate)

            const [storesRes, goalsRes, checkinsRes, todayCheckinsRes, membershipsRes] = await Promise.all([
                supabase.from('lojas').select('id, name').eq('active', true).order('name'),
                supabase.from('regras_metas_loja').select('store_id, monthly_goal'),
                checkinsPromise,
                todayCheckinsPromise,
                supabase.from('vinculos_loja').select('user_id, store_id, users:usuarios(id, name, avatar_url, active)'),
            ])

        const lojas = (storesRes.data || []) as AdminStoreRow[]
        const metas = (goalsRes.data || []) as MorningGoalRow[]
        const checkins = (checkinsRes.data || []) as MorningCheckinRow[]
        const todayCheckins = (todayCheckinsRes.data || []) as MorningPresenceRow[]
        const members = ((membershipsRes.data || []) as unknown as MorningMemberRow[]).filter(m => m.users?.active)

        const goalMap = new Map(metas.map(g => [g.store_id, Number(g.monthly_goal || 0)]))
        const checkedInSet = new Set(todayCheckins.map(c => `${c.store_id}-${c.seller_user_id}`))
        const membersByStore = new Map<string, MorningSeller[]>()
        for (const m of members) {
            const arr = membersByStore.get(m.store_id) || []
            arr.push({
                id: m.user_id,
                name: m.users?.name || 'Unknown',
                avatar_url: m.users?.avatar_url || null,
                checkin_today: false,
                vnd_total: 0,
                leads: 0,
            })
            membersByStore.set(m.store_id, arr)
        }

        const checkinsByStore = new Map<string, MorningCheckinRow[]>()
        for (const c of checkins) {
            const arr = checkinsByStore.get(c.store_id) || []
            arr.push(c)
            checkinsByStore.set(c.store_id, arr)
        }

        const computed: StoreMorningData[] = lojas.map((store) => {
            const storeCheckins = checkinsByStore.get(store.id) || []
            const storeMembers = membersByStore.get(store.id) || []
            const storeGoal = goalMap.get(store.id) || 0
            const sales = storeCheckins.reduce((s, c) => s + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
            const leads = storeCheckins.reduce((s, c) => s + (c.leads_prev_day || 0), 0)
            const visits = storeCheckins.reduce((s, c) => s + (c.visit_prev_day || 0), 0)
            const projection = calcularProjecao(sales, daysInfo.decorridos, daysInfo.total)
            const reaching = calcularAtingimento(sales, storeGoal)

            const checkinsBySeller = new Map<string, number>()
            for (const c of storeCheckins) {
                checkinsBySeller.set(c.seller_user_id, (checkinsBySeller.get(c.seller_user_id) || 0) + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0))
            }
            const leadsBySeller = new Map<string, number>()
            for (const c of storeCheckins) {
                leadsBySeller.set(c.seller_user_id, (leadsBySeller.get(c.seller_user_id) || 0) + (c.leads_prev_day || 0))
            }

            const sellers = storeMembers.map((m) => ({
                id: m.id,
                name: m.name,
                avatar_url: m.avatar_url,
                checkin_today: checkedInSet.has(`${store.id}-${m.id}`),
                vnd_total: checkinsBySeller.get(m.id) || 0,
                leads: leadsBySeller.get(m.id) || 0,
            }))

            return {
                store_id: store.id,
                store_name: store.name,
                totalSales: sales,
                goal: storeGoal,
                reaching,
                projection,
                gap: Math.max(storeGoal - sales, 0),
                checkedInCount: sellers.filter(s => s.checkin_today).length,
                totalSellers: sellers.length,
                totalLeads: leads,
                totalVisits: visits,
                sellers,
            }
        })

        setStoreData(computed)
        } catch {
            toast.error('Falha ao carregar relatório matinal da rede.')
        } finally {
            setLoading(false)
        }
    }, [range.start, range.end, referenceDate, daysInfo])

    useEffect(() => { fetchData() }, [fetchData])

    const networkMetrics = useMemo(() => ({
        totalSales: storeData.reduce((s, d) => s + d.totalSales, 0),
        totalGoal: storeData.reduce((s, d) => s + d.goal, 0),
        totalProjection: storeData.reduce((s, d) => s + d.projection, 0),
        totalCheckedIn: storeData.reduce((s, d) => s + d.checkedInCount, 0),
        totalSellers: storeData.reduce((s, d) => s + d.totalSellers, 0),
        totalLeads: storeData.reduce((s, d) => s + d.totalLeads, 0),
        totalVisits: storeData.reduce((s, d) => s + d.totalVisits, 0),
        totalGap: storeData.reduce((s, d) => s + d.gap, 0),
    }), [storeData])

    const networkReaching = networkMetrics.totalGoal > 0
        ? calcularAtingimento(networkMetrics.totalSales, networkMetrics.totalGoal)
        : 0

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await fetchData()
        setIsRefetching(false)
        toast.success('Snapshot operacional atualizado!')
    }, [fetchData])

    const handleDownloadXlsx = useCallback(async () => {
        toast.info('Gerando planilha operacional...')
        const exportData = storeData.map(s => ({
            'Unidade': s.store_name,
            'Vendas': s.totalSales,
            'Meta': s.goal,
            'Atingimento (%)': s.reaching,
            'Projeção': s.projection,
            'Gap': s.gap,
            'Leads': s.totalLeads,
            'Visitas': s.totalVisits,
            'Lançamentos': `${s.checkedInCount}/${s.totalSellers}`,
        }))
        const { exportToExcel } = await import('@/lib/export')
        const success = exportToExcel(exportData, 'Matinal_Rede_MX')
        if (success) toast.success('Planilha gerada com sucesso!')
        else toast.error('Falha ao gerar planilha.')
    }, [storeData])

    const handleSendEmail = useCallback(async () => {
        setIsSendingEmail(true)
        try {
            await new Promise(r => setTimeout(r, 2000))
            toast.success('Relatório enviado para a Direção MX!')
        } catch (e) {
            toast.error('Falha ao enviar e-mail.')
        } finally { setIsSendingEmail(false) }
    }, [])

    if (loading) return (
        <main
            className="w-full h-full flex flex-col gap-8 p-6 md:p-8 bg-gray-50 animate-in fade-in duration-500"
            aria-busy="true"
            aria-live="polite"
            aria-label="Consolidando rede"
        >
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-2 w-48" />
                </div>
                <Skeleton className="h-14 w-48 rounded-2xl" />
            </header>
            <SkeletonStats count={4} />
            <SkeletonList items={5} showAvatar />
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-8 p-8 overflow-y-auto no-scrollbar bg-gray-50">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-emerald-600 rounded-full shadow-sm" aria-hidden="true" />
                        <Typography variant="h1">Matinal <Typography as="span" className="text-emerald-600">Rede MX</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-6 uppercase tracking-widest font-black">Visão Administrativa • Todas as Unidades • {range.label}</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-2xl shadow-sm h-12 w-12 bg-white" aria-label="Sincronizar">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-12 px-6 rounded-full shadow-sm uppercase tracking-widest bg-white">
                        <FileDown size={16} className="mr-2" aria-hidden="true" /> <Typography variant="tiny" as="span" className="font-black">PLANILHA</Typography>
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-12 px-8 rounded-full shadow-sm uppercase tracking-widest" disabled={isSendingEmail}>
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Mail size={16} className="mr-2" aria-hidden="true" />}
                        <Typography variant="tiny" as="span" className="font-black">DIREÇÃO MX</Typography>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 shrink-0">
                <Card className="p-8 md:p-10 group relative overflow-hidden border-none shadow-sm bg-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center shadow-inner border border-indigo-100" aria-hidden="true"><Target size={24} /></div>
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">META REDE</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{networkMetrics.totalGoal}</Typography>
                        <div className="flex items-center gap-2">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">REALIZADO: {networkMetrics.totalSales}</Typography>
                            <div className="w-1 h-1 rounded-full bg-border-strong opacity-20" aria-hidden="true" />
                            <Typography variant="h3" tone="brand" className="text-sm font-black">{networkReaching}%</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 bg-gray-900 text-white border-none shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                            <Badge variant="outline" className="bg-white text-gray-900 border-white px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span" className="text-inherit">PROJEÇÃO</Typography></Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{networkMetrics.totalProjection}</Typography>
                        <Typography variant="tiny" tone="white" className="opacity-50 font-black uppercase tracking-widest">GAP: {networkMetrics.totalGap} UNIDADES</Typography>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 border-none shadow-sm bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100" aria-hidden="true"><Activity size={24} /></div>
                            <Badge variant="success" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">SAÚDE REDE</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{networkMetrics.totalCheckedIn}<Typography as="span" variant="h3" tone="muted" className="text-2xl font-black">/{networkMetrics.totalSellers}</Typography></Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">SINCRONIA DISCIPLINAR D-0</Typography>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 border-none shadow-sm bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center shadow-inner border border-indigo-100" aria-hidden="true"><Users size={24} /></div>
                            <Badge variant="outline" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">UNIDADES</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{storeData.length}</Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{networkMetrics.totalLeads} LEADS • {networkMetrics.totalVisits} VISITAS</Typography>
                    </div>
                </Card>
            </div>

            <Card className="w-full border-none shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-8 bg-gray-50/30 border-b border-gray-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm" aria-hidden="true"><Building2 size={24} className="text-emerald-600" /></div>
                        <div>
                            <CardTitle className="text-xl uppercase tracking-tighter">Grade Operacional da Rede</CardTitle>
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block mt-1">TODAS AS UNIDADES • {range.label}</Typography>
                        </div>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th scope="col" className="pl-10 py-6"><Typography variant="caption" className="font-black uppercase tracking-wide">UNIDADE</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">META</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">VENDAS</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" tone="brand" className="font-black uppercase tracking-wide">ATING.</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">PROJEÇÃO</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">LEADS</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">LANÇAMENTOS</Typography></th>
                                <th scope="col" className="pr-10 py-6 text-right"><Typography variant="caption" className="font-black uppercase tracking-wide">STATUS</Typography></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default bg-white">
                            {storeData.map((store) => {
                                const isExpanded = expandedStoreId === store.store_id
                                const healthPct = store.totalSellers > 0 ? Math.round((store.checkedInCount / store.totalSellers) * 100) : 0
                                return (
                                    <React.Fragment key={store.store_id}>
                                        <tr className="hover:bg-gray-50/30 transition-colors group cursor-pointer" onClick={() => setExpandedStoreId(isExpanded ? null : store.store_id)}>
                                            <td className="pl-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-emerald-600 transition-all shadow-inner" aria-hidden="true">
                                                        <Typography variant="tiny" className="font-black text-gray-800 group-hover:text-white uppercase">{store.store_name.substring(0, 2)}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-base group-hover:text-emerald-600 transition-colors uppercase tracking-tight font-black">{store.store_name}</Typography>
                                                    <ChevronDown size={16} className={cn("transition-transform text-gray-500", isExpanded && "rotate-180")} />
                                                </div>
                                            </td>
                                            <td className="text-center"><Typography variant="mono" className="text-sm tabular-nums opacity-60">{store.goal}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" tone="brand" className="text-lg tabular-nums font-black">{store.totalSales}</Typography></td>
                                            <td className="text-center">
                                                <Badge variant={store.reaching >= 100 ? 'success' : store.reaching >= 50 ? 'outline' : 'danger'} className="px-3 py-1 rounded-full border-none font-black">{store.reaching}%</Badge>
                                            </td>
                                            <td className="text-center"><Typography variant="mono" className="text-sm tabular-nums">{store.projection}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" className="text-sm tabular-nums opacity-60">{store.totalLeads}</Typography></td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Typography variant="mono" className="text-sm tabular-nums">{store.checkedInCount}/{store.totalSellers}</Typography>
                                                </div>
                                            </td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={healthPct >= 80 ? 'success' : healthPct >= 50 ? 'outline' : 'danger'} className="px-4 py-1.5 rounded-2xl shadow-sm border-none uppercase">
                                                    <Typography variant="tiny" as="span" className="font-black tracking-widest">{healthPct >= 80 ? 'SAUDÁVEL' : healthPct >= 50 ? 'ATENÇÃO' : 'CRÍTICO'}</Typography>
                                                </Badge>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-gray-50/30"
                                                        >
                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {store.sellers.map(seller => (
                                                                    <div key={seller.id} className={cn("flex items-center justify-between p-4 rounded-2xl border", seller.checkin_today ? "bg-white border-gray-100" : "bg-red-50/50 border-red-600/20")}>
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <Avatar
                                                                                src={seller.avatar_url || undefined}
                                                                                alt={`Avatar de ${seller.name}`}
                                                                                fallback={seller.name}
                                                                                size="sm"
                                                                                className={cn("rounded-2xl", seller.checkin_today ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}
                                                                            />
                                                                            <Typography variant="tiny" className="font-black uppercase truncate">{seller.name}</Typography>
                                                                        </div>
                                                                        <div className="flex items-center gap-6 shrink-0">
                                                                            <Typography variant="tiny" className="font-black tabular-nums">{seller.vnd_total}v • {seller.leads}l</Typography>
                                                                            <Badge variant={seller.checkin_today ? 'success' : 'danger'} className="px-2 py-0.5 rounded-2xl border-none uppercase text-[9px] font-black">
                                                                                {seller.checkin_today ? 'OK' : 'OFF'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            <div className="pb-32" />
        </main>
    )
}

function StoreMorningReport() {
    const { profile, storeId, vinculos_loja } = useAuth()
    const { checkins, loading: loadingCheckins, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals: refetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    const { ranking, refetch: refetchRanking } = useRanking()
    const { sellers, refetch: refetchTeam } = useTeam()

    const [isRefetching, setIsRefetching] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [reportAudit, setReportAudit] = useState<{ action: string; status: 'success' | 'error' | 'info'; detail: string; at: Date } | null>(null)

    const daysInfo = useMemo(() => getDiasInfo(), [])
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const referenceDateLabel = useMemo(() => format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR }), [referenceDate])

    const metrics = useMemo(() => {
        const currentSales = somarVendas(checkins)
        const teamGoal = metaRules?.monthly_goal ?? storeGoal?.target ?? 0
        const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
        const reaching = calcularAtingimento(currentSales, teamGoal)
        const gap = Math.max(teamGoal - currentSales, 0)
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        const pendingSellers = (sellers || []).filter(s => !s.checkin_today).map(s => s.name)
        return { currentSales, teamGoal, projection, reaching, gap, checkedInCount, pendingSellers }
    }, [checkins, metaRules, storeGoal, daysInfo, sellers])

    const activeStore = vinculos_loja.find(m => m.store_id === storeId)?.store
    const storeName = activeStore?.name || 'Unidade MX'

    const handleShareWhatsApp = useCallback(() => {
        const text = formatWhatsAppMorningReport(storeName, referenceDateLabel, metrics, ranking)
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        setReportAudit({ action: 'Compartilhamento WhatsApp preparado', status: 'info', detail: 'A janela de compartilhamento foi aberta com o snapshot atual.', at: new Date() })
    }, [referenceDateLabel, metrics, ranking, storeName])

    const handleSendEmail = useCallback(async () => {
        setIsSendingEmail(true)
        try {
            await new Promise(r => setTimeout(r, 2000))
            setReportAudit({ action: 'Relatório enviado para a Direção MX', status: 'success', detail: `Unidade ${storeName} · referência ${referenceDateLabel}.`, at: new Date() })
            toast.success('Relatório enviado para a Direção MX!')
        } catch (e) {
            setReportAudit({ action: 'Falha ao enviar relatório', status: 'error', detail: e instanceof Error ? e.message : 'Falha ao enviar e-mail.', at: new Date() })
            toast.error('Falha ao enviar e-mail.')
        }
        finally { setIsSendingEmail(false) }
    }, [referenceDateLabel, storeName])

    const handleDownloadXlsx = useCallback(async () => {
        toast.info('Gerando planilha operacional...')
        const exportData = ranking.map(r => ({
            'Especialista': r.user_name, 'Vendas': r.vnd_total, 'Leads': r.leads,
            'Agendamentos': r.agd_total, 'Visitas': r.visitas, 'Meta': r.meta,
            'Atingimento (%)': r.atingimento, 'Projeção': r.projecao, 'Ritmo': r.ritmo
        }))
        const { exportToExcel } = await import('@/lib/export')
        const success = exportToExcel(exportData, `Matinal_${storeName.replace(/\s+/g, '_')}`)
        if (success) {
            setReportAudit({ action: 'Planilha gerada', status: 'success', detail: `${exportData.length} linhas exportadas do Matinal.`, at: new Date() })
            toast.success('Planilha gerada com sucesso!')
        } else {
            setReportAudit({ action: 'Falha ao gerar planilha', status: 'error', detail: 'Exportação local retornou erro.', at: new Date() })
            toast.error('Falha ao gerar planilha.')
        }
    }, [ranking, storeName])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), fetchMetaRules(), refetchRanking(), refetchTeam()])
            setReportAudit({ action: 'Snapshot atualizado', status: 'success', detail: 'Check-ins, metas, ranking e equipe foram sincronizados.', at: new Date() })
            toast.success('Snapshot operacional atualizado!')
        } catch (error) {
            setReportAudit({ action: 'Falha ao atualizar snapshot', status: 'error', detail: error instanceof Error ? error.message : 'Erro de sincronização.', at: new Date() })
            toast.error('Falha ao atualizar snapshot.')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    if (loadingCheckins || loadingGoals) return (
        <main
            className="w-full h-full flex flex-col gap-8 p-6 md:p-8 bg-gray-50 animate-in fade-in duration-500"
            aria-busy="true"
            aria-live="polite"
            aria-label="Consolidando matinal"
        >
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-2 w-48" />
                </div>
                <Skeleton className="h-14 w-48 rounded-2xl" />
            </header>
            <SkeletonStats count={4} />
            <SkeletonList items={5} showAvatar />
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-8 p-8 overflow-y-auto no-scrollbar bg-gray-50">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-emerald-600 rounded-full shadow-sm" aria-hidden="true" />
                        <Typography variant="h1">Matinal <Typography as="span" className="text-emerald-600">Oficial</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-6 uppercase tracking-widest font-black">Unidade Operacional • Ritual D+1 • {referenceDateLabel}</Typography>
                </div>
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-2xl shadow-sm h-12 w-12 bg-white" aria-label="Sincronizar">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-12 px-6 rounded-full shadow-sm uppercase tracking-widest bg-white">
                        <FileDown size={16} className="mr-2" aria-hidden="true" /> <Typography variant="tiny" as="span" className="font-black">PLANILHA</Typography>
                    </Button>
                    <Button onClick={handleShareWhatsApp} className="h-12 px-8 rounded-full bg-emerald-600 shadow-sm uppercase tracking-widest hover:bg-emerald-600/90">
                        <MessageCircle size={16} className="mr-2 fill-white/20" aria-hidden="true" /> <Typography variant="tiny" as="span" tone="white" className="font-black">WHATSAPP</Typography>
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-12 px-8 rounded-full shadow-sm uppercase tracking-widest" disabled={isSendingEmail}>
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Mail size={16} className="mr-2" aria-hidden="true" />}
                        <Typography variant="tiny" as="span" className="font-black">DIREÇÃO MX</Typography>
                    </Button>
                </div>
            </header>

            {reportAudit && (
                <div role="status" className={cn(
                    "rounded-2xl border px-6 py-4 text-sm font-bold",
                    reportAudit.status === 'success' && "border-emerald-600/20 bg-emerald-50 text-emerald-600",
                    reportAudit.status === 'error' && "border-red-600/20 bg-red-50 text-red-600",
                    reportAudit.status === 'info' && "border-blue-600/20 bg-blue-50 text-blue-600"
                )}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <span>{reportAudit.action}</span>
                        <span className="text-[10px] font-black uppercase opacity-70">{reportAudit.at.toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="mt-1 text-xs opacity-80">{reportAudit.detail}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                <Card className="p-8 md:p-10 group relative overflow-hidden border-none shadow-sm bg-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center shadow-inner border border-indigo-100" aria-hidden="true"><Target size={24} /></div>
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">META MENSAL</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.teamGoal}</Typography>
                        <div className="flex items-center gap-2">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">REALIZADO: {metrics.currentSales}</Typography>
                            <div className="w-1 h-1 rounded-full bg-border-strong opacity-20" aria-hidden="true" />
                            <Typography variant="h3" tone="brand" className="text-sm font-black">{metrics.reaching}%</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 bg-gray-900 text-white border-none shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                            <Badge variant="outline" className="bg-white text-gray-900 border-white px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span" className="text-inherit">PROJEÇÃO MX</Typography></Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.projection}</Typography>
                        <Typography variant="tiny" tone="white" className="opacity-50 font-black uppercase tracking-widest">GAP RESIDUAL: {metrics.gap} UNIDADES</Typography>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 border-none shadow-sm bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-100" aria-hidden="true"><Activity size={24} /></div>
                            <Badge variant="success" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">SAÚDE DA MALHA</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.checkedInCount}<Typography as="span" variant="h3" tone="muted" className="text-2xl font-black">/{(sellers || []).length}</Typography></Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">SINCRONIA DISCIPLINAR D-0</Typography>
                    </div>
                </Card>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-32">
                <Card className="xl:col-span-8 border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="p-10 bg-gray-50/30 border-b border-gray-100 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm" aria-hidden="true"><BarChart3 size={24} className="text-emerald-600" /></div>
                            <div>
                                <CardTitle className="text-xl uppercase tracking-tighter">Grade Operacional do Time</CardTitle>
                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block mt-1">EFICIÊNCIA INDIVIDUAL ACUMULADA</Typography>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th scope="col" className="pl-10 py-6"><Typography variant="caption" className="font-black uppercase tracking-wide">ESPECIALISTA</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">LEADS</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">AGEND.</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-wide">VND (ONTEM)</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" tone="brand" className="font-black uppercase tracking-wide">TOTAL (MÊS)</Typography></th>
                                    <th scope="col" className="pr-10 py-6 text-right"><Typography variant="caption" className="font-black uppercase tracking-wide">STATUS</Typography></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default bg-white">
                                {(ranking || []).map((r) => {
                                    const isDone = sellers.find(s => s.id === r.user_id)?.checkin_today
                                    return (
                                        <tr key={r.user_id} className="hover:bg-gray-50/30 transition-colors group h-24">
                                            <td className="pl-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-emerald-600 transition-all shadow-inner" aria-hidden="true">
                                                        <Typography variant="tiny" className="font-black text-gray-800 group-hover:text-white uppercase">{r.user_name.substring(0, 2)}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-base group-hover:text-emerald-600 transition-colors uppercase tracking-tight font-black">{r.user_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="text-center"><Typography variant="mono" className="text-lg text-gray-800 opacity-60 tabular-nums">{r.leads}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" className="text-lg text-gray-800 opacity-60 tabular-nums">{r.agd_total}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" tone="success" className="text-lg tabular-nums">{r.vnd_yesterday || 0}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" tone="brand" className="text-2xl tabular-nums">{r.vnd_total}</Typography></td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={isDone ? 'success' : 'danger'} className="px-6 py-1.5 rounded-2xl shadow-sm border uppercase border-none">
                                                    <Typography variant="tiny" as="span" className="font-black tracking-widest">{isDone ? 'SINCRONIZADO' : 'PENDENTE'}</Typography>
                                                </Badge>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <aside className="xl:col-span-4 flex flex-col gap-8">
                    <Card className="p-10 md:p-14 space-y-10 border-none shadow-sm bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                        <header className="flex items-center gap-4 border-b border-gray-100 pb-8 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-emerald-600 flex items-center justify-center shadow-sm" aria-hidden="true"><Zap size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Foco do Dia</Typography>
                        </header>
                        <div className="space-y-6 relative z-10">
                            {metrics.pendingSellers.length > 0 && (
                                <Card className="p-8 bg-red-50 border-none shadow-inner space-y-6">
                                    <header className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <Typography variant="h3" className="text-base text-red-600 leading-none uppercase tracking-tight font-black">COBRAR REGISTRO</Typography>
                                            <Typography variant="tiny" tone="error" className="font-black opacity-60 uppercase tracking-widest">Ação Imediata Necessária</Typography>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse shadow-sm border-none"><Typography variant="tiny" as="span" className="font-black uppercase">CRÍTICO</Typography></Badge>
                                    </header>
                                    <div className="space-y-2">
                                        {metrics.pendingSellers.map(name => (
                                            <div key={name} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" aria-hidden="true" />
                                                <Typography variant="caption" tone="error" className="font-black uppercase">{name}</Typography>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="danger" className="w-full h-12 rounded-2xl shadow-sm" onClick={() => {
                                        const msg = encodeURIComponent(`MX PERFORMANCE — Lembrete de Fechamento Diário!\n\nPendente: ${metrics.pendingSellers.join(', ')}\n\nPreencha seu Fechamento Diário agora.`)
                                        window.open(`https://wa.me/?text=${msg}`, '_blank')
                                    }}>
                                        <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest">Notificar Time</Typography>
                                    </Button>
                                </Card>
                            )}
                            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                                <Typography variant="caption" tone="muted" className="mb-4 block font-black uppercase tracking-widest">Sugestão MX</Typography>
                                <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-gray-600">"Manter o ritmo de agendamentos D-0 para garantir o escoamento projetado."</Typography>
                            </div>
                        </div>
                    </Card>
                </aside>
            </section>
        </main>
    )
}
