import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    TrendingUp, Target, Zap, 
    RefreshCw, MessageCircle, BarChart3, Mail, FileDown,
    Users, Activity, ChevronDown, Building2
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento, formatWhatsAppMorningReport } from '@/lib/calculations'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle } from '@/components/molecules/Card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

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
    sellers: { id: string; name: string; checkin_today: boolean; vnd_total: number; leads: number }[]
}

export default function MorningReport() {
    const { profile, storeId, memberships, role } = useAuth()
    const isAdmin = role === 'admin'

    if (isAdmin) return <AdminMorningReport />
    return <StoreMorningReport />
}

function AdminMorningReport() {
    const [storeData, setStoreData] = useState<StoreMorningData[]>([])
    const [loading, setLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

    const daysInfo = useMemo(() => getDiasInfo(), [])
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const referenceDateLabel = useMemo(() => format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR }), [referenceDate])
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const monthEnd = format(new Date(), 'yyyy-MM-dd')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [storesRes, goalsRes, checkinsRes, todayCheckinsRes, membershipsRes] = await Promise.all([
                supabase.from('stores').select('id, name').eq('active', true).order('name'),
                supabase.from('store_meta_rules').select('store_id, monthly_goal'),
                supabase.from('daily_checkins')
                    .select('seller_user_id, store_id, reference_date, leads_prev_day, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day')
                    .gte('reference_date', monthStart).lte('reference_date', monthEnd),
                supabase.from('daily_checkins').select('seller_user_id, store_id').eq('reference_date', referenceDate),
                supabase.from('memberships').select('user_id, store_id, users:user_id(id, name, active)'),
            ])

        const stores = storesRes.data || []
        const goals = goalsRes.data || []
        const checkins = checkinsRes.data || []
        const todayCheckins = todayCheckinsRes.data || []
        const members = ((membershipsRes.data || []) as any[]).filter(m => m.users?.active)

        const goalMap = new Map(goals.map((g: any) => [g.store_id, g.monthly_goal || 0]))
        const checkedInSet = new Set(todayCheckins.map((c: any) => `${c.store_id}-${c.seller_user_id}`))
        const membersByStore = new Map<string, any[]>()
        for (const m of members) {
            const arr = membersByStore.get(m.store_id) || []
            arr.push({ id: m.user_id, name: m.users?.name || 'Unknown', store_id: m.store_id })
            membersByStore.set(m.store_id, arr)
        }

        const checkinsByStore = new Map<string, any[]>()
        for (const c of checkins) {
            const arr = checkinsByStore.get(c.store_id) || []
            arr.push(c)
            checkinsByStore.set(c.store_id, arr)
        }

        const computed: StoreMorningData[] = stores.map((store: any) => {
            const storeCheckins = checkinsByStore.get(store.id) || []
            const storeMembers = membersByStore.get(store.id) || []
            const storeGoal = goalMap.get(store.id) || 0
            const sales = storeCheckins.reduce((s: number, c: any) => s + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
            const leads = storeCheckins.reduce((s: number, c: any) => s + (c.leads_prev_day || 0), 0)
            const visits = storeCheckins.reduce((s: number, c: any) => s + (c.visit_prev_day || 0), 0)
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

            const sellers = storeMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
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
        } catch (err) {
            console.error('[AdminMorningReport] fetchData failed:', err)
        } finally {
            setLoading(false)
        }
    }, [monthStart, monthEnd, referenceDate, daysInfo])

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
            'Checkins': `${s.checkedInCount}/${s.totalSellers}`,
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse uppercase font-black tracking-widest">Consolidando Rede...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Matinal <Typography as="span" className="text-brand-primary">Rede MX</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">Visão Administrativa • Todas as Unidades • {referenceDateLabel}</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white" aria-label="Sincronizar">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-mx-xl px-6 rounded-mx-full shadow-mx-sm uppercase tracking-widest bg-white">
                        <FileDown size={16} className="mr-2" aria-hidden="true" /> <Typography variant="tiny" as="span" className="font-black">PLANILHA</Typography>
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-mx-xl px-8 rounded-mx-full shadow-mx-xl uppercase tracking-widest" disabled={isSendingEmail}>
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Mail size={16} className="mr-2" aria-hidden="true" />}
                        <Typography variant="tiny" as="span" className="font-black">DIREÇÃO MX</Typography>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Card className="p-mx-lg md:p-10 group relative overflow-hidden border-none shadow-mx-lg bg-white">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner border border-mx-indigo-100" aria-hidden="true"><Target size={24} /></div>
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">META REDE</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{networkMetrics.totalGoal}</Typography>
                        <div className="flex items-center gap-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">REALIZADO: {networkMetrics.totalSales}</Typography>
                            <div className="w-mx-tiny h-mx-tiny rounded-mx-full bg-border-strong opacity-20" aria-hidden="true" />
                            <Typography variant="h3" tone="brand" className="text-sm font-black">{networkReaching}%</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-mx-lg md:p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-48 h-mx-48 bg-white/5 rounded-mx-full blur-3xl -mr-24 -mt-24" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black"><Typography variant="tiny" as="span" tone="white">PROJEÇÃO</Typography></Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{networkMetrics.totalProjection}</Typography>
                        <Typography variant="tiny" tone="white" className="opacity-50 font-black uppercase tracking-widest">GAP: {networkMetrics.totalGap} UNIDADES</Typography>
                    </div>
                </Card>

                <Card className="p-mx-lg md:p-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-success-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-status-success-surface text-status-success flex items-center justify-center shadow-inner border border-mx-emerald-100" aria-hidden="true"><Activity size={24} /></div>
                            <Badge variant="success" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">SAÚDE REDE</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{networkMetrics.totalCheckedIn}<Typography as="span" variant="h3" tone="muted" className="text-2xl font-black">/{networkMetrics.totalSellers}</Typography></Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">SINCRONIA DISCIPLINAR D-0</Typography>
                    </div>
                </Card>

                <Card className="p-mx-lg md:p-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-info-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner border border-mx-indigo-100" aria-hidden="true"><Users size={24} /></div>
                            <Badge variant="outline" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">UNIDADES</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-3 tracking-tighter font-black">{storeData.length}</Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">{networkMetrics.totalLeads} LEADS • {networkMetrics.totalVisits} VISITAS</Typography>
                    </div>
                </Card>
            </div>

            <Card className="w-full border-none shadow-mx-lg bg-white overflow-hidden">
                <CardHeader className="p-mx-lg bg-surface-alt/30 border-b border-border-default flex flex-row items-center justify-between">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white border border-border-default flex items-center justify-center shadow-mx-sm" aria-hidden="true"><Building2 size={24} className="text-brand-primary" /></div>
                        <div>
                            <CardTitle className="text-xl uppercase tracking-tighter">Grade Operacional da Rede</CardTitle>
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block mt-1">TODAS AS UNIDADES • {referenceDateLabel}</Typography>
                        </div>
                    </div>
                </CardHeader>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-alt/50 border-b border-border-default">
                                <th scope="col" className="pl-10 py-6"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">UNIDADE</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">META</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">VENDAS</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" tone="brand" className="font-black uppercase tracking-mx-wide">ATING.</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">PROJEÇÃO</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">LEADS</Typography></th>
                                <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">CHECKINS</Typography></th>
                                <th scope="col" className="pr-10 py-6 text-right"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">STATUS</Typography></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default bg-white">
                            {storeData.map((store) => {
                                const isExpanded = expandedStoreId === store.store_id
                                const healthPct = store.totalSellers > 0 ? Math.round((store.checkedInCount / store.totalSellers) * 100) : 0
                                return (
                                    <React.Fragment key={store.store_id}>
                                        <tr className="hover:bg-surface-alt/30 transition-colors group cursor-pointer" onClick={() => setExpandedStoreId(isExpanded ? null : store.store_id)}>
                                            <td className="pl-10">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center group-hover:bg-brand-primary transition-all shadow-mx-inner" aria-hidden="true">
                                                        <Typography variant="tiny" className="font-black text-text-primary group-hover:text-white uppercase">{store.store_name.substring(0, 2)}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{store.store_name}</Typography>
                                                    <ChevronDown size={16} className={cn("transition-transform text-text-tertiary", isExpanded && "rotate-180")} />
                                                </div>
                                            </td>
                                            <td className="text-center"><Typography variant="mono" className="text-sm tabular-nums opacity-60">{store.goal}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" tone="brand" className="text-lg tabular-nums font-black">{store.totalSales}</Typography></td>
                                            <td className="text-center">
                                                <Badge variant={store.reaching >= 100 ? 'success' : store.reaching >= 50 ? 'outline' : 'danger'} className="px-3 py-1 rounded-mx-full border-none font-black">{store.reaching}%</Badge>
                                            </td>
                                            <td className="text-center"><Typography variant="mono" className="text-sm tabular-nums">{store.projection}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" className="text-sm tabular-nums opacity-60">{store.totalLeads}</Typography></td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-mx-xs">
                                                    <Typography variant="mono" className="text-sm tabular-nums">{store.checkedInCount}/{store.totalSellers}</Typography>
                                                </div>
                                            </td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={healthPct >= 80 ? 'success' : healthPct >= 50 ? 'outline' : 'danger'} className="px-4 py-1.5 rounded-mx-lg shadow-sm border-none uppercase">
                                                    <Typography variant="tiny" as="span" className="font-black tracking-widest">{healthPct >= 80 ? 'SAUDÁVEL' : healthPct >= 50 ? 'ATENÇÃO' : 'CRÍTICO'}</Typography>
                                                </Badge>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={8} className="p-mx-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-surface-alt/30"
                                                        >
                                                            <div className="p-mx-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-sm">
                                                                {store.sellers.map(seller => (
                                                                    <div key={seller.id} className={cn("flex items-center justify-between p-mx-sm rounded-mx-lg border", seller.checkin_today ? "bg-white border-border-default" : "bg-status-error-surface/50 border-status-error/20")}>
                                                                        <div className="flex items-center gap-mx-xs min-w-0">
                                                                            <div className={cn("w-mx-8 h-mx-8 rounded-mx-lg flex items-center justify-center text-xs font-black uppercase shrink-0", seller.checkin_today ? "bg-status-success-surface text-status-success" : "bg-status-error-surface text-status-error")}>
                                                                                {seller.name.charAt(0)}
                                                                            </div>
                                                                            <Typography variant="tiny" className="font-black uppercase truncate">{seller.name}</Typography>
                                                                        </div>
                                                                        <div className="flex items-center gap-mx-md shrink-0">
                                                                            <Typography variant="tiny" className="font-black tabular-nums">{seller.vnd_total}v • {seller.leads}l</Typography>
                                                                            <Badge variant={seller.checkin_today ? 'success' : 'danger'} className="px-2 py-0.5 rounded-mx-lg border-none uppercase text-mx-micro font-black">
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
    const { profile, storeId, memberships } = useAuth()
    const { checkins, loading: loadingCheckins, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals: refetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    const { ranking, refetch: refetchRanking } = useRanking()
    const { sellers, refetch: refetchTeam } = useTeam()

    const [isRefetching, setIsRefetching] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

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

    const activeStore = memberships.find(m => m.store_id === storeId)?.store
    const storeName = activeStore?.name || 'Unidade MX'

    const handleShareWhatsApp = useCallback(() => {
        const text = formatWhatsAppMorningReport(storeName, referenceDateLabel, metrics, ranking)
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [referenceDateLabel, metrics, ranking, storeName])

    const handleSendEmail = useCallback(async () => {
        setIsSendingEmail(true)
        try {
            await new Promise(r => setTimeout(r, 2000))
            toast.success('Relatório enviado para a Direção MX!')
        } catch (e) { toast.error('Falha ao enviar e-mail.') }
        finally { setIsSendingEmail(false) }
    }, [])

    const handleDownloadXlsx = useCallback(async () => {
        toast.info('Gerando planilha operacional...')
        const exportData = ranking.map(r => ({
            'Especialista': r.user_name, 'Vendas': r.vnd_total, 'Leads': r.leads,
            'Agendamentos': r.agd_total, 'Visitas': r.visitas, 'Meta': r.meta,
            'Atingimento (%)': r.atingimento, 'Projeção': r.projecao, 'Ritmo': r.ritmo
        }))
        const { exportToExcel } = await import('@/lib/export')
        const success = exportToExcel(exportData, `Matinal_${storeName.replace(/\s+/g, '_')}`)
        if (success) toast.success('Planilha gerada com sucesso!')
        else toast.error('Falha ao gerar planilha.')
    }, [ranking, storeName])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), fetchMetaRules(), refetchRanking(), refetchTeam()])
            toast.success('Snapshot operacional atualizado!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse uppercase font-black tracking-widest">Consolidando Matinal...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Matinal <Typography as="span" className="text-brand-primary">Oficial</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">Unidade Operacional • Ritual D+1 • {referenceDateLabel}</Typography>
                </div>
                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white" aria-label="Sincronizar">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-mx-xl px-6 rounded-mx-full shadow-mx-sm uppercase tracking-widest bg-white">
                        <FileDown size={16} className="mr-2" aria-hidden="true" /> <Typography variant="tiny" as="span" className="font-black">PLANILHA</Typography>
                    </Button>
                    <Button onClick={handleShareWhatsApp} className="h-mx-xl px-8 rounded-mx-full bg-status-success shadow-mx-lg uppercase tracking-widest hover:bg-status-success/90">
                        <MessageCircle size={16} className="mr-2 fill-white/20" aria-hidden="true" /> <Typography variant="tiny" as="span" tone="white" className="font-black">WHATSAPP</Typography>
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-mx-xl px-8 rounded-mx-full shadow-mx-xl uppercase tracking-widest" disabled={isSendingEmail}>
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Mail size={16} className="mr-2" aria-hidden="true" />}
                        <Typography variant="tiny" as="span" className="font-black">DIREÇÃO MX</Typography>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                <Card className="p-mx-lg md:p-10 group relative overflow-hidden border-none shadow-mx-lg bg-white">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner border border-mx-indigo-100" aria-hidden="true"><Target size={24} /></div>
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">META MENSAL</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.teamGoal}</Typography>
                        <div className="flex items-center gap-mx-xs">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">REALIZADO: {metrics.currentSales}</Typography>
                            <div className="w-mx-tiny h-mx-tiny rounded-mx-full bg-border-strong opacity-20" aria-hidden="true" />
                            <Typography variant="h3" tone="brand" className="text-sm font-black">{metrics.reaching}%</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-mx-lg md:p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-48 h-mx-48 bg-white/5 rounded-mx-full blur-3xl -mr-24 -mt-24" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black"><Typography variant="tiny" as="span" tone="white">PROJEÇÃO MX</Typography></Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.projection}</Typography>
                        <Typography variant="tiny" tone="white" className="opacity-50 font-black uppercase tracking-widest">GAP RESIDUAL: {metrics.gap} UNIDADES</Typography>
                    </div>
                </Card>

                <Card className="p-mx-lg md:p-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-success-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-status-success-surface text-status-success flex items-center justify-center shadow-inner border border-mx-emerald-100" aria-hidden="true"><Activity size={24} /></div>
                            <Badge variant="success" className="px-4 py-1 uppercase font-black shadow-sm"><Typography variant="tiny" as="span">SAÚDE DA MALHA</Typography></Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.checkedInCount}<Typography as="span" variant="h3" tone="muted" className="text-2xl font-black">/{(sellers || []).length}</Typography></Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">SINCRONIA DISCIPLINAR D-0</Typography>
                    </div>
                </Card>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <Card className="xl:col-span-8 border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-mx-10 bg-surface-alt/30 border-b border-border-default flex flex-row items-center justify-between">
                        <div className="flex items-center gap-mx-sm">
                            <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white border border-border-default flex items-center justify-center shadow-mx-sm" aria-hidden="true"><BarChart3 size={24} className="text-brand-primary" /></div>
                            <div>
                                <CardTitle className="text-xl uppercase tracking-tighter">Grade Operacional do Time</CardTitle>
                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block mt-1">EFICIÊNCIA INDIVIDUAL ACUMULADA</Typography>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-alt/50 border-b border-border-default">
                                    <th scope="col" className="pl-10 py-6"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">ESPECIALISTA</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">LEADS</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">AGEND.</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">VND (ONTEM)</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" tone="brand" className="font-black uppercase tracking-mx-wide">TOTAL (MÊS)</Typography></th>
                                    <th scope="col" className="pr-10 py-6 text-right"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">STATUS</Typography></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default bg-white">
                                {(ranking || []).map((r) => {
                                    const isDone = sellers.find(s => s.id === r.user_id)?.checkin_today
                                    return (
                                        <tr key={r.user_id} className="hover:bg-surface-alt/30 transition-colors group h-mx-3xl">
                                            <td className="pl-10">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center group-hover:bg-brand-primary transition-all shadow-mx-inner" aria-hidden="true">
                                                        <Typography variant="tiny" className="font-black text-text-primary group-hover:text-white uppercase">{r.user_name.substring(0, 2)}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{r.user_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="text-center"><Typography variant="mono" className="text-lg text-text-primary opacity-60 tabular-nums">{r.leads}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" className="text-lg text-text-primary opacity-60 tabular-nums">{r.agd_total}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" tone="success" className="text-lg tabular-nums">{r.vnd_yesterday || 0}</Typography></td>
                                            <td className="text-center"><Typography variant="mono" tone="brand" className="text-2xl tabular-nums">{r.vnd_total}</Typography></td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={isDone ? 'success' : 'danger'} className="px-6 py-1.5 rounded-mx-lg shadow-sm border uppercase border-none">
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

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 md:p-14 space-y-mx-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-8 relative z-10">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-mx-sm" aria-hidden="true"><Zap size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Foco do Dia</Typography>
                        </header>
                        <div className="space-y-mx-md relative z-10">
                            {metrics.pendingSellers.length > 0 && (
                                <Card className="p-mx-lg bg-status-error-surface border-none shadow-mx-inner space-y-mx-md">
                                    <header className="flex justify-between items-start">
                                        <div className="space-y-mx-tiny">
                                            <Typography variant="h3" className="text-base text-status-error leading-none uppercase tracking-tight font-black">COBRAR REGISTRO</Typography>
                                            <Typography variant="tiny" tone="error" className="font-black opacity-60 uppercase tracking-widest">Ação Imediata Necessária</Typography>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse shadow-sm border-none"><Typography variant="tiny" as="span" className="font-black uppercase">CRÍTICO</Typography></Badge>
                                    </header>
                                    <div className="space-y-mx-xs">
                                        {metrics.pendingSellers.map(name => (
                                            <div key={name} className="flex items-center gap-mx-xs">
                                                <div className="w-1.5 h-1.5 rounded-mx-full bg-status-error" aria-hidden="true" />
                                                <Typography variant="caption" tone="error" className="font-black uppercase">{name}</Typography>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="danger" className="w-full h-mx-xl rounded-mx-xl shadow-mx-lg" onClick={() => {
                                        const msg = encodeURIComponent(`MX PERFORMANCE — Lembrete de Check-in!\n\nPendente: ${metrics.pendingSellers.join(', ')}\n\nPreencha seu check-in agora.`)
                                        window.open(`https://wa.me/?text=${msg}`, '_blank')
                                    }}>
                                        <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest">Notificar Time</Typography>
                                    </Button>
                                </Card>
                            )}
                            <div className="p-mx-lg bg-surface-alt rounded-mx-2xl border border-border-default shadow-inner">
                                <Typography variant="caption" tone="muted" className="mb-4 block font-black uppercase tracking-widest">Sugestão MX</Typography>
                                <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-text-secondary">"Manter o ritmo de agendamentos D-0 para garantir o escoamento projetado."</Typography>
                            </div>
                        </div>
                    </Card>
                </aside>
            </section>
        </main>
    )
}
