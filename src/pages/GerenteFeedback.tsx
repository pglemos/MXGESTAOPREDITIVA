import { useFeedbacks, useWeeklyFeedbackReports } from '@/hooks/useData'
import { useTeam, useAllSellers, useStores } from '@/hooks/useTeam'
import { useCheckins, useCheckinsByDateRange } from '@/hooks/useCheckins'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { canManageFeedback } from '@/lib/auth/capabilities'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { 
    MessageSquare, Plus, X, Send, Award, AlertCircle, Zap, 
    Target, RefreshCw, Search, Calendar, ShieldCheck, ChevronDown,
    Building2
} from 'lucide-react'
import { TabNavPill, type TabNavPillItem } from '@/components/molecules/TabNavPill'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/molecules/Card'
import { format, subWeeks, startOfWeek, endOfWeek, parseISO, isSameWeek } from 'date-fns'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { calcularFunil, formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import type { DailyCheckin, FeedbackFormData, WeeklyFeedbackReport } from '@/types/database'
import type { Feedback } from '@/lib/schemas/feedback.schema'

type FeedbackListItem = Feedback & {
    seller_name?: string
    manager_name?: string
}

function getFeedbackSellerName(feedback: FeedbackListItem): string {
    return feedback.seller_name || 'Especialista'
}

function getWeeklyAverageSales(report: Pick<WeeklyFeedbackReport, 'team_avg_json'>): number {
    const value = report.team_avg_json?.vnd
    return typeof value === 'number' ? value : 0
}

function getPreviousWeekRange() {
    const now = new Date()
    const lastWeek = subWeeks(now, 1)
    const start = startOfWeek(lastWeek, { weekStartsOn: 1 })
    const end = endOfWeek(lastWeek, { weekStartsOn: 1 })
    return {
        start,
        end,
        startKey: format(start, 'yyyy-MM-dd'),
        endKey: format(end, 'yyyy-MM-dd'),
        label: `${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`
    }
}

function formatSafeDate(value?: string | null, pattern = 'dd/MM/yyyy') {
    if (!value) return '--/--'
    try {
        return format(parseISO(value), pattern)
    } catch {
        return '--/--'
    }
}

function buildFeedbackMetricsPatch(checkins: DailyCheckin[], commitmentMode: 'actual' | 'suggested' = 'actual') {
    const funnel = calcularFunil(checkins)
    return {
        leads_week: funnel.leads,
        agd_week: funnel.agd_total,
        visit_week: funnel.visitas,
        vnd_week: funnel.vnd_total,
        tx_lead_agd: funnel.tx_lead_agd,
        tx_agd_visita: funnel.tx_agd_visita,
        tx_visita_vnd: funnel.tx_visita_vnd,
        meta_compromisso: commitmentMode === 'suggested' ? Math.ceil(funnel.vnd_total * 1.2) || 1 : funnel.vnd_total,
    }
}

export default function GerenteFeedback() {
    const { role } = useAuth()
    const isAdmin = isPerfilInternoMx(role)

    if (isAdmin) return <AdminFeedback />
    return <StoreFeedback />
}

type FeedbackTab = 'individual' | 'weekly'
const FEEDBACK_TABS: TabNavPillItem<FeedbackTab>[] = [
    { key: 'individual', label: 'Individual' },
    { key: 'weekly',     label: 'Relatórios' },
]

function AdminFeedback() {
    const { devolutivas, loading: devolutivasLoading, createFeedback, refetch: refetchFeedbacks } = useFeedbacks()
    const { reports, loading: reportsLoading, error: reportsError, refetch: refetchReports } = useWeeklyFeedbackReports()
    const { sellers: allSellers, loading: sellersLoading } = useAllSellers()
    const { lojas } = useStores()

    const previousWeek = useMemo(() => getPreviousWeekRange(), [])

    const [activeTab, setActiveTab] = useState<'individual' | 'weekly'>('individual')
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedStoreId, setSelectedStoreId] = useState<string>('')
    const [formData, setFormData] = useState<FeedbackFormData>({
        seller_id: '', week_reference: previousWeek.startKey,
        leads_week: 0, agd_week: 0, visit_week: 0, vnd_week: 0,
        tx_lead_agd: 0, tx_agd_visita: 0, tx_visita_vnd: 0,
        meta_compromisso: 0, positives: '', attention_points: '', action: '', notes: ''
    })

    const filteredSellers = useMemo(() => {
        if (!selectedStoreId) return allSellers
        return allSellers.filter(s => s.store_id === selectedStoreId)
    }, [allSellers, selectedStoreId])

    const filteredFeedbacks = useMemo(() => {
        return devolutivas.filter(f =>
            getFeedbackSellerName(f).toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.week_reference.includes(searchTerm)
        )
    }, [devolutivas, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            if (activeTab === 'individual') await refetchFeedbacks()
            else await refetchReports()
            toast.success('Sincronizado!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao sincronizar devolutivas.')
        } finally {
            setIsRefetching(false)
        }
    }, [activeTab, refetchFeedbacks, refetchReports])

    const loadSellerMetrics = useCallback(async (sellerId: string, weekReference: string) => {
        if (!sellerId) {
            setFormData(f => ({ ...f, seller_id: '' }))
            return
        }
        const seller = allSellers.find(s => s.id === sellerId)
        if (!seller) return

        let selectedWeekStart: Date
        let selectedWeekEnd: Date
        try {
            selectedWeekStart = startOfWeek(parseISO(weekReference), { weekStartsOn: 1 })
            selectedWeekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 })
        } catch {
            toast.error('Semana inválida.')
            return
        }

        const { supabase } = await import('@/lib/supabase')
        const { isLancamentosViaRpcEnabled } = await import('@/lib/feature-flags')

        let weekCheckins: DailyCheckin[] | null = null
        let error: { message: string } | null = null
        if (isLancamentosViaRpcEnabled()) {
            const { data, error: rpcErr } = await supabase.rpc('get_lancamentos_por_vendedor_periodo', {
                p_seller_id: sellerId,
                p_store_id: seller.store_id!,
                p_start_date: format(selectedWeekStart, 'yyyy-MM-dd'),
                p_end_date: format(selectedWeekEnd, 'yyyy-MM-dd'),
                p_scope: 'daily',
            })
            weekCheckins = (data as DailyCheckin[] | null) || []
            error = rpcErr
        } else {
            const res = await supabase
                .from('lancamentos_diarios')
                .select('id, seller_user_id, store_id, reference_date, leads_prev_day, agd_cart_prev_day, agd_net_prev_day, agd_cart_today, agd_net_today, vnd_porta_prev_day, vnd_cart_prev_day, vnd_net_prev_day, visit_prev_day')
                .eq('seller_user_id', sellerId)
                .eq('store_id', seller.store_id)
                .gte('reference_date', format(selectedWeekStart, 'yyyy-MM-dd'))
                .lte('reference_date', format(selectedWeekEnd, 'yyyy-MM-dd'))
            weekCheckins = res.data as DailyCheckin[] | null
            error = res.error
        }
        if (error) {
            toast.error('Não foi possível carregar os check-ins do especialista.')
            return
        }

        setFormData(f => ({
            ...f,
            seller_id: sellerId,
            week_reference: weekReference,
            ...buildFeedbackMetricsPatch((weekCheckins || []) as DailyCheckin[]),
        }))
    }, [allSellers])

    const handleSellerSelect = useCallback((sellerId: string) => {
        void loadSellerMetrics(sellerId, formData.week_reference)
    }, [formData.week_reference, loadSellerMetrics])

    const handleWeekReferenceChange = useCallback((weekReference: string) => {
        setFormData(f => ({ ...f, week_reference: weekReference }))
        if (formData.seller_id) void loadSellerMetrics(formData.seller_id, weekReference)
    }, [formData.seller_id, loadSellerMetrics])

    const handleSubmit = async () => {
        if (!formData.seller_id || !formData.positives.trim() || !formData.attention_points.trim() || !formData.action.trim()) {
            toast.error('Preencha especialista, pontos fortes, pontos de atenção e ação.')
            return
        }
        setSaving(true)
        const seller = allSellers.find(s => s.id === formData.seller_id)
        if (!seller) { setSaving(false); toast.error('Selecione um vendedor.'); return }
        const { error } = await createFeedback({ ...formData, store_id: seller.store_id })
        setSaving(false)
        if (error) toast.error(error)
        else {
            toast.success('Mentoria registrada!')
            setShowForm(false)
            await refetchFeedbacks()
        }
    }

    const handleShareWhatsApp = (f: FeedbackListItem) => {
        const text = formatStructuredWhatsAppFeedback({
            sellerName: getFeedbackSellerName(f),
            metrics: { vnd_total: f.vnd_week, agd_total: f.agd_week, visitas: f.visit_week, leads: f.leads_week },
            diagnostic: { diagnostico: f.attention_points, sugestao: f.action },
            actions: [f.action],
            periodLabel: `Semana ${f.week_reference}`,
            dateLabel: f.created_at ? formatSafeDate(f.created_at) : f.week_reference,
            metaIndividual: f.commitment_suggested || f.meta_compromisso || f.vnd_week,
            metaCompromisso: f.meta_compromisso,
            positives: f.positives,
            attentionPoints: f.attention_points,
        })
        const opened = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
        if (!opened) toast.error('O navegador bloqueou a janela do WhatsApp.')
    }

    if (devolutivasLoading || reportsLoading || sellersLoading) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-mx-64" />
                    <Skeleton className="h-mx-xs w-mx-48" />
                </div>
            </header>
            {reportsError && (
                <div role="alert" className="rounded-mx-2xl border border-status-error/20 bg-status-error-surface px-mx-md py-mx-sm text-sm font-bold text-status-error">
                    {reportsError}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                <Skeleton className="h-mx-64 rounded-mx-2xl" />
                <Skeleton className="h-mx-64 rounded-mx-2xl" />
                <Skeleton className="h-mx-64 rounded-mx-2xl" />
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg bg-surface-alt">
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-tiny min-w-0 max-w-full">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-mx-green-700">Devolutivas</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">ADMIN — VISÃO DA REDE • METODOLOGIA MX</Typography>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-mx-sm shrink-0 w-full xl:w-auto max-w-full">
                    <TabNavPill tabs={FEEDBACK_TABS} activeTab={activeTab} onTabChange={setActiveTab} buttonClassName="h-mx-9 px-6" className="w-full sm:w-auto xl:mr-2" />
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="feedback-admin-search" className="sr-only">Buscar mentoria</label>
                        <Input id="feedback-admin-search" name="feedback-admin-search" placeholder="BUSCAR MENTORIA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black" />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white" aria-label="Sincronizar">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    {activeTab === 'individual' && (
                        <Button onClick={() => setShowForm(true)} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary font-black uppercase text-xs tracking-widest w-full sm:w-auto">
                            <Plus size={18} className="mr-2" /> NOVO FEEDBACK
                        </Button>
                    )}
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-mx-sm md:p-10 bg-mx-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="feedback-admin-title">
                        <Card className="w-full max-w-mx-4xl max-h-full overflow-y-auto no-scrollbar shadow-mx-2xl border-none flex flex-col bg-white rounded-mx-2xl">
                            <header className="p-mx-lg md:p-10 border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                                <div className="flex items-center gap-mx-sm">
                                    <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg"><MessageSquare size={24} /></div>
                                    <div>
                                        <Typography id="feedback-admin-title" variant="h2" className="uppercase tracking-tighter">Nova Mentoria</Typography>
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase">Selecione a loja e o especialista</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-mx-full w-mx-xl h-mx-xl"><X size={24} /></Button>
                            </header>
                            <div className="p-mx-lg md:p-10 space-y-mx-xl">
                                <div className="grid md:grid-cols-3 gap-mx-lg">
                                    <div className="space-y-mx-xs">
                                        <Typography as="label" htmlFor="feedback-admin-store" variant="tiny" tone="muted" className="ml-2 uppercase font-black tracking-widest">Loja</Typography>
                                        <div className="relative">
                                            <select id="feedback-admin-store" name="store_id" value={selectedStoreId} onChange={(e) => { setSelectedStoreId(e.target.value); setFormData(f => ({ ...f, seller_id: '' })) }}
                                                className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md text-sm font-bold uppercase shadow-inner appearance-none cursor-pointer">
                                                <option value="">Todas as lojas</option>
                                                {lojas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-mx-xs">
                                        <Typography as="label" htmlFor="feedback-admin-seller" variant="tiny" tone="muted" className="ml-2 uppercase font-black tracking-widest">Especialista</Typography>
                                        <div className="relative">
                                            <select id="feedback-admin-seller" name="seller_id" value={formData.seller_id} onChange={(e) => handleSellerSelect(e.target.value)}
                                                className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md text-sm font-bold uppercase shadow-inner appearance-none cursor-pointer">
                                                <option value="">Selecione...</option>
                                                {filteredSellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()} — {s.store_name}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-mx-xs">
                                        <label htmlFor="feedback-admin-week-reference" className="ml-2 text-mx-tiny uppercase font-black tracking-widest text-text-tertiary">Semana</label>
                                        <Input
                                            id="feedback-admin-week-reference"
                                            name="week_reference"
                                            type="date"
                                            value={formData.week_reference}
                                            onChange={e => handleWeekReferenceChange(e.target.value)}
                                            className="!h-mx-14 bg-surface-alt font-black"
                                        />
                                    </div>
                                    <div className="space-y-mx-xs">
                                        <Typography variant="tiny" tone="muted" className="ml-2 uppercase font-black tracking-widest">Semana</Typography>
                                        <div className="h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md flex items-center text-sm font-black text-brand-primary shadow-inner">
                                            <Calendar size={18} className="mr-3 opacity-40" />{previousWeek.label}
                                        </div>
                                    </div>
                                </div>

                                {formData.seller_id && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-mx-xl">
                                        <div className="p-mx-lg bg-surface-alt rounded-mx-xl border border-border-default space-y-mx-lg shadow-inner">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-mx-md">
                                                {[
                                                    { label: 'Leads', val: formData.leads_week, icon: Zap },
                                                    { label: 'Agend.', val: formData.agd_week, icon: Calendar },
                                                    { label: 'Visitas', val: formData.visit_week, icon: ShieldCheck },
                                                    { label: 'Vendas', val: formData.vnd_week, icon: Award },
                                                ].map(item => (
                                                    <div key={item.label} className="bg-white p-mx-5 rounded-mx-2xl border border-border-default shadow-sm text-center">
                                                        <Typography variant="tiny" tone="muted" className="mb-1 block uppercase text-mx-micro font-black">{item.label}</Typography>
                                                        <Typography variant="h2" className="text-xl font-mono-numbers font-black">{item.val}</Typography>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                                            <div className="space-y-mx-sm">
                                                <label htmlFor="feedback-admin-positives" className="text-mx-tiny font-black uppercase tracking-widest text-status-success ml-2 flex items-center gap-mx-xs"><Award size={14} /> Pontos Fortes</label>
                                                <textarea id="feedback-admin-positives" name="positives" value={formData.positives} onChange={e => setFormData(f => ({ ...f, positives: e.target.value }))}
                                                    placeholder="O que o especialista fez de excelente?"
                                                    className="w-full h-mx-4xl p-mx-md bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-status-success transition-all shadow-sm outline-none resize-none" />
                                            </div>
                                            <div className="space-y-mx-sm">
                                                <label htmlFor="feedback-admin-attention" className="text-mx-tiny font-black uppercase tracking-widest text-status-error ml-2 flex items-center gap-mx-xs"><AlertCircle size={14} /> Pontos de Atenção</label>
                                                <textarea id="feedback-admin-attention" name="attention_points" value={formData.attention_points} onChange={e => setFormData(f => ({ ...f, attention_points: e.target.value }))}
                                                    placeholder="Quais os gargalos identificados?"
                                                    className="w-full h-mx-4xl p-mx-md bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-status-error transition-all shadow-sm outline-none resize-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-mx-sm">
                                            <label htmlFor="feedback-admin-action" className="text-mx-tiny font-black uppercase tracking-widest text-brand-primary ml-2 flex items-center gap-mx-xs"><Target size={16} /> Próximo Passo (Ação)</label>
                                            <textarea id="feedback-admin-action" name="action" value={formData.action} onChange={e => setFormData(f => ({ ...f, action: e.target.value }))}
                                                placeholder="Qual a ÚNICA COISA que ele deve focar esta semana?"
                                                className="w-full h-mx-3xl p-mx-md bg-white border-2 border-brand-primary/20 rounded-mx-2xl text-base font-black focus:border-brand-primary transition-all shadow-mx-lg outline-none resize-none" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            <footer className="p-mx-lg md:p-10 border-t border-border-default sticky bottom-mx-0 bg-white z-10 flex justify-end gap-mx-sm">
                                <Button variant="ghost" onClick={() => setShowForm(false)} className="h-mx-14 px-8 rounded-mx-full font-black uppercase tracking-widest">CANCELAR</Button>
                                <Button onClick={handleSubmit} disabled={saving || !formData.seller_id || !formData.action}
                                    className="h-mx-14 px-12 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest">
                                    {saving ? <RefreshCw className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />} REGISTRAR
                                </Button>
                            </footer>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {activeTab === 'individual' ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredFeedbacks.map((f, i) => {
                                const sellerName = getFeedbackSellerName(f)
                                return (
                                <motion.li key={f.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className="p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <article>
                                            <header className="flex items-start justify-between mb-8 border-b border-border-default pb-6 relative z-10">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner uppercase">{sellerName.substring(0, 2)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-base font-black uppercase tracking-tight">{sellerName}</Typography>
                                                        <Typography variant="tiny" tone="muted" className="text-mx-tiny font-black uppercase">{formatSafeDate(f.created_at)}</Typography>
                                                    </div>
                                                </div>
                                                <Badge variant={f.acknowledged ? 'success' : 'danger'} className="px-4 py-1 rounded-mx-lg text-mx-micro font-black uppercase shadow-sm border-none">{f.acknowledged ? 'LIDO' : 'PENDENTE'}</Badge>
                                            </header>
                                            <div className="space-y-mx-md relative z-10">
                                                <div className="p-mx-md bg-surface-alt rounded-mx-2xl group-hover:bg-white group-hover:shadow-mx-sm transition-all">
                                                    <header className="flex items-center justify-between mb-4 border-b border-border-strong/10 pb-3">
                                                        <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-micro">Plano de Ação</Typography>
                                                        <Zap size={14} className="text-brand-primary" />
                                                    </header>
                                                    <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-text-secondary line-clamp-3">"{f.action}"</Typography>
                                                </div>
                                            </div>
                                        </article>
                                        <footer className="mt-10 pt-8 border-t border-border-default flex items-center justify-between relative z-10">
                                            <div className="flex gap-mx-xs">
                                                <Button variant="ghost" size="icon" onClick={() => handleShareWhatsApp(f)} className="w-mx-10 h-mx-10 p-mx-0 text-status-success hover:bg-status-success-surface rounded-mx-xl border border-border-default shadow-sm bg-white"><MessageSquare size={18} /></Button>
                                            </div>
                                        </footer>
                                    </Card>
                                </motion.li>
                            )})}
                        </AnimatePresence>
                    </ul>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        {reports.map((report) => (
                            <motion.li key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="p-mx-lg md:p-10 hover:shadow-mx-xl transition-all h-full border-none shadow-mx-lg bg-white relative overflow-hidden flex flex-col">
                                    <article className="flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-10 relative z-10">
                                            <div className="flex items-center gap-mx-sm">
                                                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md"><Calendar size={24} /></div>
                                                <div>
                                                    <Typography variant="tiny" tone="muted" className="uppercase tracking-widest font-black text-mx-micro">FECHAMENTO SEMANAL</Typography>
                                                    <Typography variant="h3" className="text-lg uppercase font-black tracking-tight">{formatSafeDate(report.week_start, 'dd/MM')} - {formatSafeDate(report.week_end, 'dd/MM')}</Typography>
                                                </div>
                                            </div>
                                            <Badge variant={report.email_status === 'sent' ? 'success' : 'danger'} className="px-4 py-1 rounded-mx-lg text-mx-micro font-black shadow-sm uppercase border-none">{report.email_status === 'sent' ? 'ENVIADO' : 'FALHA'}</Badge>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md py-8 border-y border-border-default relative z-10">
                                            <div className="bg-surface-alt rounded-mx-2xl p-mx-md shadow-mx-inner text-center">
                                                <Typography variant="tiny" tone="muted" className="text-mx-micro mb-2 block uppercase tracking-widest font-black">META</Typography>
                                                <Typography variant="h2" className="text-2xl font-mono-numbers tabular-nums font-black">{report.weekly_goal}v</Typography>
                                            </div>
                                            <div className="bg-surface-alt rounded-mx-2xl p-mx-md shadow-mx-inner text-center">
                                                <Typography variant="tiny" tone="muted" className="text-mx-micro mb-2 block uppercase tracking-widest font-black">MÉDIA</Typography>
                                                <Typography variant="h2" tone="brand" className="text-2xl font-mono-numbers tabular-nums font-black">{getWeeklyAverageSales(report)}v</Typography>
                                            </div>
                                        </div>
                                    </article>
                                </Card>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}

function StoreFeedback() {
    const { profile, storeId, role } = useAuth()
    const { devolutivas, loading: devolutivasLoading, createFeedback, refetch: refetchFeedbacks } = useFeedbacks()
    const { reports, loading: reportsLoading, refetch: refetchReports } = useWeeklyFeedbackReports()
    const { sellers } = useTeam()
    const { checkins } = useCheckins()
    const previousWeek = useMemo(() => getPreviousWeekRange(), [])

    const [activeTab, setActiveTab] = useState<'individual' | 'weekly'>('individual')
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState<FeedbackFormData>({
        seller_id: '', week_reference: previousWeek.startKey,
        leads_week: 0, agd_week: 0, visit_week: 0, vnd_week: 0,
        tx_lead_agd: 0, tx_agd_visita: 0, tx_visita_vnd: 0,
        meta_compromisso: 0, positives: '', attention_points: '', action: '', notes: ''
    })

    const calculateStoreSellerMetrics = useCallback((sellerId: string, weekReference: string) => {
        if (!sellerId) { setFormData(f => ({ ...f, seller_id: '' })); return }
        let selectedWeekStart: Date
        try {
            selectedWeekStart = startOfWeek(parseISO(weekReference), { weekStartsOn: 1 })
        } catch {
            toast.error('Semana inválida.')
            return null
        }
        const weekCheckins = checkins.filter(c =>
            c.seller_user_id === sellerId &&
            (() => {
                try {
                    return isSameWeek(parseISO(c.reference_date), selectedWeekStart, { weekStartsOn: 1 })
                } catch {
                    return false
                }
            })()
        )
        return buildFeedbackMetricsPatch(weekCheckins, 'suggested')
    }, [checkins])

    const handleSellerSelect = useCallback((sellerId: string) => {
        if (!sellerId) { setFormData(f => ({ ...f, seller_id: '' })); return }
        const metricsPatch = calculateStoreSellerMetrics(sellerId, formData.week_reference)
        if (!metricsPatch) return
        setFormData(f => ({
            ...f, seller_id: sellerId,
            ...metricsPatch,
        }))
    }, [calculateStoreSellerMetrics, formData.week_reference])

    const handleWeekReferenceChange = useCallback((weekReference: string) => {
        const metricsPatch = formData.seller_id ? calculateStoreSellerMetrics(formData.seller_id, weekReference) : null
        setFormData(f => ({
            ...f,
            week_reference: weekReference,
            ...(metricsPatch || {}),
        }))
    }, [calculateStoreSellerMetrics, formData.seller_id])

    const handleSubmit = async () => {
        if (!formData.seller_id || !formData.positives.trim() || !formData.attention_points.trim() || !formData.action.trim()) {
            toast.error('Preencha especialista, pontos fortes, pontos de atenção e ação.')
            return
        }
        setSaving(true)
        const { error } = await createFeedback(formData)
        setSaving(false)
        if (error) toast.error(error)
        else {
            toast.success('Mentoria registrada!')
            setShowForm(false)
            await refetchFeedbacks()
        }
    }

    const handleShareWhatsApp = (f: FeedbackListItem) => {
        const text = formatStructuredWhatsAppFeedback({
            sellerName: getFeedbackSellerName(f),
            metrics: { vnd_total: f.vnd_week, agd_total: f.agd_week, visitas: f.visit_week, leads: f.leads_week },
            diagnostic: { diagnostico: f.attention_points, sugestao: f.action },
            actions: [f.action],
            periodLabel: `Semana ${f.week_reference}`,
            dateLabel: f.created_at ? formatSafeDate(f.created_at) : f.week_reference,
            metaIndividual: f.commitment_suggested || f.meta_compromisso || f.vnd_week,
            metaCompromisso: f.meta_compromisso,
            positives: f.positives,
            attentionPoints: f.attention_points,
        })
        const opened = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
        if (!opened) toast.error('O navegador bloqueou a janela do WhatsApp.')
    }

    const filteredFeedbacks = useMemo(() => {
        return devolutivas.filter(f =>
            getFeedbackSellerName(f).toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.week_reference.includes(searchTerm)
        )
    }, [devolutivas, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            if (activeTab === 'individual') await refetchFeedbacks()
            else await refetchReports()
            toast.success('Sincronizado!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Falha ao sincronizar devolutivas.')
        } finally {
            setIsRefetching(false)
        }
    }, [activeTab, refetchFeedbacks, refetchReports])

    const isOwner = role === 'dono'
    const canCreateFeedback = canManageFeedback(role) && !isOwner
    const isManager = role === 'gerente'

    if (devolutivasLoading || reportsLoading) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-mx-64" />
                    <Skeleton className="h-mx-xs w-mx-48" />
                </div>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                <Skeleton className="h-mx-64 rounded-mx-2xl" />
                <Skeleton className="h-mx-64 rounded-mx-2xl" />
                <Skeleton className="h-mx-64 rounded-mx-2xl" />
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg bg-surface-alt">
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-tiny min-w-0 max-w-full">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                        <Typography variant="h1">{isOwner ? 'Devolutivas da ' : 'Gestão de '}<span className="text-mx-green-700">{isOwner ? 'Rede' : 'Devolutivas'}</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">
                        {isOwner ? 'ACOMPANHE QUALIDADE DE GESTÃO E COBRANÇAS SEMANAIS' : 'Rotina Semanal Mandatória • Metodologia MX'}
                    </Typography>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-mx-sm shrink-0 w-full xl:w-auto max-w-full">
                    <nav className="flex p-mx-tiny bg-white border border-border-default rounded-mx-full shadow-mx-sm xl:mr-2" role="tablist">
                        <Button variant={activeTab === 'individual' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('individual')}
                            className="h-mx-9 rounded-mx-full px-6 text-mx-tiny font-black uppercase" role="tab" aria-selected={activeTab === 'individual'}>Individual</Button>
                        <Button variant={activeTab === 'weekly' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('weekly')}
                            className="h-mx-9 rounded-mx-full px-6 text-mx-tiny font-black uppercase" role="tab" aria-selected={activeTab === 'weekly'}>Relatórios</Button>
                    </nav>
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <label htmlFor="feedback-store-search" className="sr-only">Buscar mentoria</label>
                        <Input id="feedback-store-search" name="feedback-store-search" placeholder="BUSCAR MENTORIA..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black" />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Sincronizar devolutivas" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    {activeTab === 'individual' && canCreateFeedback && (
                        <Button onClick={() => setShowForm(true)} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary font-black uppercase text-xs tracking-widest w-full sm:w-auto">
                            <Plus size={18} className="mr-2" /> NOVO FEEDBACK
                        </Button>
                    )}
                </div>
            </header>

            {isManager && (
                <Card className="border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
                    <Typography variant="h3" className="uppercase tracking-tight text-status-info">Escopo do gerente</Typography>
                    <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
                        Aqui você executa devolutivas da sua unidade. Admin MX vê governança multi-loja e Dono acompanha consistência, mas a criação semanal operacional fica com o gerente.
                    </Typography>
                </Card>
            )}

            {isOwner && (
                <Card className="border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
                    <Typography variant="h3" className="uppercase tracking-tight text-status-info">Devolutivas como governança</Typography>
                    <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
                        Esta rota mostra evidências de feedback individual e relatórios semanais. O Dono acompanha consistência e cobra cadência; criação e execução das devolutivas ficam com gerente/Admin MX.
                    </Typography>
                </Card>
            )}

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-end justify-center p-mx-sm bg-mx-black/60 backdrop-blur-sm sm:items-center md:p-10" role="dialog" aria-modal="true" aria-labelledby="feedback-store-title">
                        <Card className="flex max-h-full w-full max-w-mx-4xl flex-col overflow-hidden border-none bg-white shadow-mx-2xl rounded-mx-2xl">
                            <header className="p-mx-lg md:p-10 border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                                <div className="flex items-center gap-mx-sm">
                                    <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg"><MessageSquare size={24} /></div>
                                    <div>
                                        <Typography id="feedback-store-title" variant="h2" className="uppercase tracking-tighter">Nova Mentoria</Typography>
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase">Ciclo de Devolutiva Semanal</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-mx-full w-mx-xl h-mx-xl"><X size={24} /></Button>
                            </header>
                            <div className="overflow-y-auto p-mx-lg md:p-10 space-y-mx-xl">
                                <div className="grid md:grid-cols-2 gap-mx-lg">
                                    <div className="space-y-mx-xs">
                                        <label htmlFor="feedback-seller" className="ml-2 text-mx-tiny uppercase font-black tracking-widest text-text-tertiary">Especialista</label>
                                        <div className="relative">
                                            <select id="feedback-seller" name="seller_id" value={formData.seller_id} onChange={(e) => handleSellerSelect(e.target.value)}
                                                className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md text-sm font-bold uppercase shadow-inner appearance-none cursor-pointer">
                                                <option value="">Selecione...</option>
                                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-mx-xs">
                                        <label htmlFor="feedback-week-reference" className="ml-2 text-mx-tiny uppercase font-black tracking-widest text-text-tertiary">Semana</label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 opacity-40 pointer-events-none" />
                                            <input
                                                id="feedback-week-reference"
                                                name="week_reference"
                                                type="date"
                                                value={formData.week_reference}
                                                onChange={e => handleWeekReferenceChange(e.target.value)}
                                                className="w-full h-mx-14 pl-12 pr-6 bg-surface-alt border border-border-default rounded-mx-md text-sm font-black text-brand-primary shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {formData.seller_id && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-mx-xl">
                                        <div className="p-mx-lg bg-surface-alt rounded-mx-xl border border-border-default space-y-mx-lg shadow-inner">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
                                                {[
                                                    { label: 'Leads', val: formData.leads_week },
                                                    { label: 'Agend.', val: formData.agd_week },
                                                    { label: 'Visitas', val: formData.visit_week },
                                                    { label: 'Vendas', val: formData.vnd_week },
                                                ].map(item => (
                                                    <div key={item.label} className="bg-white p-mx-5 rounded-mx-2xl border border-border-default shadow-sm text-center">
                                                        <Typography variant="tiny" tone="muted" className="mb-1 block uppercase text-mx-micro font-black">{item.label}</Typography>
                                                        <Typography variant="h2" className="text-xl font-mono-numbers font-black">{item.val}</Typography>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                                            <div className="space-y-mx-sm">
                                                <label htmlFor="feedback-positives" className="text-mx-tiny font-black uppercase tracking-widest text-status-success ml-2 flex items-center gap-mx-xs"><Award size={14} /> Pontos Fortes</label>
                                                <textarea id="feedback-positives" name="positives" value={formData.positives} onChange={e => setFormData(f => ({ ...f, positives: e.target.value }))}
                                                    className="w-full h-mx-4xl p-mx-md bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-status-success transition-all shadow-sm outline-none resize-none" />
                                            </div>
                                            <div className="space-y-mx-sm">
                                                <label htmlFor="feedback-attention" className="text-mx-tiny font-black uppercase tracking-widest text-status-error ml-2 flex items-center gap-mx-xs"><AlertCircle size={14} /> Pontos de Atenção</label>
                                                <textarea id="feedback-attention" name="attention_points" value={formData.attention_points} onChange={e => setFormData(f => ({ ...f, attention_points: e.target.value }))}
                                                    className="w-full h-mx-4xl p-mx-md bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-status-error transition-all shadow-sm outline-none resize-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-mx-sm">
                                            <label htmlFor="feedback-action" className="text-mx-tiny font-black uppercase tracking-widest text-brand-primary ml-2 flex items-center gap-mx-xs"><Target size={16} /> Ação</label>
                                            <textarea id="feedback-action" name="action" value={formData.action} onChange={e => setFormData(f => ({ ...f, action: e.target.value }))}
                                                className="w-full h-mx-3xl p-mx-md bg-white border-2 border-brand-primary/20 rounded-mx-2xl text-base font-black focus:border-brand-primary transition-all shadow-mx-lg outline-none resize-none" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                            <footer className="p-mx-lg md:p-10 border-t border-border-default sticky bottom-mx-0 bg-white z-10 flex justify-end gap-mx-sm">
                                <Button variant="ghost" onClick={() => setShowForm(false)} className="h-mx-14 px-8 rounded-mx-full font-black uppercase tracking-widest">CANCELAR</Button>
                                <Button onClick={handleSubmit} disabled={saving || !formData.seller_id || !formData.positives.trim() || !formData.attention_points.trim() || !formData.action.trim()}
                                    className="h-mx-14 px-12 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest">
                                    {saving ? <RefreshCw className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />} REGISTRAR
                                </Button>
                            </footer>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {activeTab === 'individual' ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredFeedbacks.map((f, i) => {
                                const sellerName = getFeedbackSellerName(f)
                                return (
                                <motion.li key={f.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className="p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <article>
                                            <header className="flex items-start justify-between mb-8 border-b border-border-default pb-6 relative z-10">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner uppercase">{sellerName.substring(0, 2)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-base font-black uppercase tracking-tight">{sellerName}</Typography>
                                                        <Typography variant="tiny" tone="muted" className="font-black uppercase">{formatSafeDate(f.created_at)}</Typography>
                                                    </div>
                                                </div>
                                                <Badge variant={f.acknowledged ? 'success' : 'danger'} className="px-4 py-1 rounded-mx-lg text-mx-micro font-black uppercase shadow-sm border-none">{f.acknowledged ? 'LIDO' : 'PENDENTE'}</Badge>
                                            </header>
                                            <div className="space-y-mx-md relative z-10">
                                                <div className="p-mx-md bg-surface-alt rounded-mx-2xl group-hover:bg-white group-hover:shadow-mx-sm transition-all">
                                                    <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-micro mb-4 block">Plano de Ação</Typography>
                                                    <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-text-secondary line-clamp-3">"{f.action}"</Typography>
                                                </div>
                                            </div>
                                        </article>
                                        <footer className="mt-10 pt-8 border-t border-border-default flex items-center justify-between relative z-10">
                                            <Button variant="ghost" size="icon" onClick={() => handleShareWhatsApp(f)} className="w-mx-10 h-mx-10 p-mx-0 text-status-success hover:bg-status-success-surface rounded-mx-xl border border-border-default shadow-sm bg-white"><MessageSquare size={18} /></Button>
                                        </footer>
                                    </Card>
                                </motion.li>
                            )})}
                        </AnimatePresence>
                    </ul>
                ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        {reports.map((report) => (
                            <motion.li key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="p-mx-lg md:p-10 hover:shadow-mx-xl transition-all h-full border-none shadow-mx-lg bg-white flex flex-col">
                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md"><Calendar size={24} /></div>
                                            <div>
                                                <Typography variant="tiny" tone="muted" className="uppercase tracking-widest font-black text-mx-micro">FECHAMENTO SEMANAL</Typography>
                                                <Typography variant="h3" className="text-lg uppercase font-black tracking-tight">{formatSafeDate(report.week_start, 'dd/MM')} - {formatSafeDate(report.week_end, 'dd/MM')}</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={report.email_status === 'sent' ? 'success' : 'danger'} className="px-4 py-1 rounded-mx-lg text-mx-micro font-black shadow-sm uppercase border-none">{report.email_status === 'sent' ? 'ENVIADO' : 'FALHA'}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-mx-md py-8 border-y border-border-default">
                                        <div className="bg-surface-alt rounded-mx-2xl p-mx-md shadow-mx-inner text-center">
                                            <Typography variant="tiny" tone="muted" className="text-mx-micro mb-2 block uppercase tracking-widest font-black">META</Typography>
                                            <Typography variant="h2" className="text-2xl font-mono-numbers font-black">{report.weekly_goal}v</Typography>
                                        </div>
                                        <div className="bg-surface-alt rounded-mx-2xl p-mx-md shadow-mx-inner text-center">
                                            <Typography variant="tiny" tone="muted" className="text-mx-micro mb-2 block uppercase tracking-widest font-black">MÉDIA</Typography>
                                            <Typography variant="h2" tone="brand" className="text-2xl font-mono-numbers font-black">{getWeeklyAverageSales(report)}v</Typography>
                                        </div>
                                    </div>
                                </Card>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}
