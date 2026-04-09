import { useFeedbacks, useWeeklyFeedbackReports } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Plus, X, Send, Award, AlertCircle, Zap, ChevronRight, LayoutDashboard, Target, TrendingUp, Sparkles, RefreshCw, Search, FileText, ExternalLink, Calendar, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format, subDays, subWeeks, startOfWeek, endOfWeek, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { calcularFunil, gerarDiagnosticoMX, MX_BENCHMARKS, formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import { PrintableFeedback } from '@/components/feedback/PrintableFeedback'
import { WeeklyStoreReport } from '@/components/feedback/WeeklyStoreReport'
import { supabase } from '@/lib/supabase'
import type { FunnelData, FeedbackFormData } from '@/types/database'

function getPreviousWeekRange(baseDate = new Date()) {
    const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
    const start = addDays(currentWeekStart, -7)
    const end = addDays(currentWeekStart, -1)
    return {
        start,
        end,
        startKey: format(start, 'yyyy-MM-dd'),
        endKey: format(end, 'yyyy-MM-dd'),
        label: `${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`,
    }
}

export default function GerenteFeedback() {
    const { role } = useAuth()
    const { feedbacks, loading: feedbacksLoading, createFeedback, refetch: refetchFeedbacks } = useFeedbacks()
    const { reports, loading: reportsLoading, refetch: refetchReports } = useWeeklyFeedbackReports()
    const { sellers } = useTeam()
    const { checkins } = useCheckins()
    const [activeTab, setActiveTab] = useState<'individual' | 'weekly'>('individual')
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [saving, setSaving] = useState(false)
    const [printingFeedback, setPrintingFeedback] = useState<any>(null)
    const [printingWeeklyReport, setPrintingWeeklyReport] = useState<any>(null)
    const [sendingEmail, setSendingEmail] = useState<string | null>(null)
    const canCreateFeedback = role === 'admin' || role === 'gerente'
    const previousWeek = useMemo(() => getPreviousWeekRange(), [])

    const [form, setForm] = useState<FeedbackFormData>({ 
        seller_id: '', 
        week_reference: previousWeek.startKey,
        leads_week: 0,
        agd_week: 0,
        visit_week: 0,
        vnd_week: 0,
        tx_lead_agd: 0,
        tx_agd_visita: 0,
        tx_visita_vnd: 0,
        meta_compromisso: 0, 
        positives: '', 
        attention_points: '', 
        action: '', 
        notes: '' 
    })

    const [weeklySnapshot, setWeeklySnapshot] = useState<FunnelData | null>(null)
    const [commitmentSuggested, setCommitmentSuggested] = useState(0)

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (showForm && !saving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [showForm, saving])

    const weeklyTeamCheckins = useMemo(() => {
        return checkins.filter(c => c.reference_date >= previousWeek.startKey && c.reference_date <= previousWeek.endKey)
    }, [checkins, previousWeek.endKey, previousWeek.startKey])

    const weeklyTeamSnapshot = useMemo(() => calcularFunil(weeklyTeamCheckins), [weeklyTeamCheckins])

    useEffect(() => {
        if (form.seller_id) {
            const sellerCheckins = checkins.filter(c => 
                c.seller_user_id === form.seller_id && 
                c.reference_date >= previousWeek.startKey &&
                c.reference_date <= previousWeek.endKey
            )
            const last15Start = format(subDays(new Date(), 15), 'yyyy-MM-dd')
            const sellerLast15Checkins = checkins.filter(c =>
                c.seller_user_id === form.seller_id &&
                c.reference_date >= last15Start
            )
            const funil = calcularFunil(sellerCheckins)
            const diagnostico = gerarDiagnosticoMX(funil)
            const activeDays = new Set(sellerLast15Checkins.map(c => c.reference_date)).size || 1
            const last15Sales = sellerLast15Checkins.reduce(
                (sum, c) => sum + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0),
                0
            )
            const suggested = Math.max(1, Math.ceil((last15Sales / activeDays) * 7))
            
            setWeeklySnapshot(funil)
            setCommitmentSuggested(suggested)
            setForm(p => ({
                ...p,
                week_reference: previousWeek.startKey,
                leads_week: funil.leads,
                agd_week: funil.agd_total,
                visit_week: funil.visitas,
                vnd_week: funil.vnd_total,
                tx_lead_agd: funil.tx_lead_agd,
                tx_agd_visita: funil.tx_agd_visita,
                tx_visita_vnd: funil.tx_visita_vnd,
                meta_compromisso: suggested,
                commitment_suggested: suggested,
                team_avg_json: { ...weeklyTeamSnapshot },
                diagnostic_json: {
                    week_start: previousWeek.startKey,
                    week_end: previousWeek.endKey,
                    criterion: 'MX 20/60/33',
                    gargalo: diagnostico.gargalo,
                    seller_snapshot: { ...funil },
                    team_snapshot: { ...weeklyTeamSnapshot },
                },
                attention_points: diagnostico.diagnostico,
                action: diagnostico.sugestao
            }))
        }
    }, [form.seller_id, checkins, previousWeek.endKey, previousWeek.startKey, weeklyTeamSnapshot])

    const sellerHistory = useMemo(() => {
        if (!form.seller_id) return []
        
        const history = []
        for (let i = 5; i >= 0; i--) {
            const date = subWeeks(new Date(), i)
            const wStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            const wEnd = format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
            const label = format(startOfWeek(date, { weekStartsOn: 1 }), 'dd/MM')
            
            const weekSales = checkins.filter(c => 
                c.seller_user_id === form.seller_id &&
                c.reference_date >= wStart &&
                c.reference_date <= wEnd
            ).reduce((sum, c) => sum + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0)
            
            history.push({ week: label, sales: weekSales })
        }
        return history
    }, [form.seller_id, checkins])

    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter(f => 
            (f as any).seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.positives.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.action.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [feedbacks, searchTerm])

    const teamStatus = useMemo(() => {
        const total = sellers.length
        const weeklyFeedbacks = feedbacks.filter(f => f.week_reference === previousWeek.startKey)
        const done = new Set(weeklyFeedbacks.map(f => f.seller_id)).size
        const acknowledged = weeklyFeedbacks.filter(f => f.acknowledged).length
        return {
            total,
            done,
            missing: Math.max(0, total - done),
            acknowledged
        }
    }, [sellers, feedbacks, previousWeek.startKey])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        if (activeTab === 'individual') await refetchFeedbacks()
        else await refetchReports()
        setIsRefetching(false)
        toast.success(activeTab === 'individual' ? 'Lista de feedbacks atualizada!' : 'Relatórios semanais atualizados!')
    }, [activeTab, refetchFeedbacks, refetchReports])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canCreateFeedback) {
            toast.error('Seu papel permite acompanhar feedbacks, mas não criar ou editar.')
            return
        }
        if (!form.seller_id || !form.meta_compromisso || !form.positives || !form.attention_points || !form.action) {
            toast.error('Preencha os campos mandatórios da auditoria.')
            return
        }
        setSaving(true)
        const { error } = await createFeedback(form)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Feedback enviado para o cockpit do vendedor!')
        setShowForm(false)
        setForm({ 
            seller_id: '', 
            week_reference: previousWeek.startKey,
            leads_week: 0,
            agd_week: 0,
            visit_week: 0,
            vnd_week: 0,
            tx_lead_agd: 0,
            tx_agd_visita: 0,
            tx_visita_vnd: 0,
            meta_compromisso: 0, 
            positives: '', 
            attention_points: '', 
            action: '', 
            notes: '',
            team_avg_json: {},
            diagnostic_json: {},
            commitment_suggested: 0,
        })
        setCommitmentSuggested(0)
        setWeeklySnapshot(null)
    }

    const handleSendWhatsApp = (f: any) => {
        const text = formatStructuredWhatsAppFeedback(f)
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const handleSendEmail = async (f: any) => {
        setSendingEmail(f.id)
        try {
            const { error } = await supabase.functions.invoke('send-individual-feedback', {
                body: { feedbackId: f.id }
            })
            if (error) throw error
            toast.success('Feedback enviado por e-mail!')
        } catch (err: any) {
            toast.error('Falha no motor de e-mail.')
        } finally {
            setSendingEmail(null)
        }
    }

    const handlePrint = (f: any) => {
        setPrintingFeedback(f)
        setTimeout(() => {
            window.print()
            setPrintingFeedback(null)
        }, 500)
    }

    const handlePrintWeekly = (report: any) => {
        setPrintingWeeklyReport(report)
        setTimeout(() => {
            window.print()
            setPrintingWeeklyReport(null)
        }, 500)
    }

    if (feedbacksLoading || reportsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl" role="status">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl" aria-hidden="true"></div>
            <p className="mt-6 text-gray-500 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Sincronizando Feedbacks...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-mx-md" aria-hidden="true" />
                        <h1 className="text-4xl md:text-[38px] font-black tracking-tighter leading-none uppercase text-slate-950">
                            Feedback <span className="text-indigo-600">Oficial</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg animate-pulse" aria-hidden="true" />
                        <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">Rotina Semanal Mandatória • Critério 20/60/33</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-gray-100 border border-gray-200 rounded-2xl" role="tablist" aria-label="Abas de Auditoria de Feedback">
                        <button
                            id="tab-individual"
                            role="tab"
                            aria-selected={activeTab === 'individual'}
                            aria-controls="panel-individual"
                            onClick={() => setActiveTab('individual')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500",
                                activeTab === 'individual' ? "bg-white text-pure-black shadow-sm" : "text-gray-500 hover:text-slate-700"
                            )}
                        >
                            <User size={14} aria-hidden="true" /> Individual
                        </button>
                        <button
                            id="tab-weekly"
                            role="tab"
                            aria-selected={activeTab === 'weekly'}
                            aria-controls="panel-weekly"
                            onClick={() => setActiveTab('weekly')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-500",
                                activeTab === 'weekly' ? "bg-white text-pure-black shadow-sm" : "text-gray-500 hover:text-slate-700"
                            )}
                        >
                            <FileText size={14} aria-hidden="true" /> Relatórios Semanais
                        </button>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" aria-hidden="true" />
                        <label htmlFor="feedback-search" className="sr-only">Buscar vendedor ou conteúdo do feedback</label>
                        <input 
                            id="feedback-search"
                            name="feedback-search"
                            type="text"
                            placeholder="BUSCAR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mx-input !py-3 !text-[10px] !font-black !tracking-widest uppercase focus:ring-4 focus:ring-indigo-500/5 outline-none"
                        />
                    </div>
                    <button 
                        onClick={handleRefresh}
                        aria-label="Atualizar lista de feedbacks"
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-slate-950 transition-all active:scale-90 focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                    {activeTab === 'individual' && canCreateFeedback && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="mx-button-primary !px-8 !py-4 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-3xl group relative overflow-hidden focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" aria-hidden="true" /> Novo Feedback
                        </button>
                    )}
                </div>
            </div>

            {/* Status Section */}
            <AnimatePresence>
                {activeTab === 'individual' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0" aria-label="Resumo de Status da Equipe">
                        <div className="p-6 rounded-[2rem] bg-white border border-gray-100 shadow-sm space-y-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tropa Total</p>
                            <p className="text-3xl font-black tabular-nums text-slate-950">{teamStatus.total}</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-sm space-y-4">
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em]">Auditorias Feitas</p>
                            <p className="text-3xl font-black tabular-nums text-indigo-700">{teamStatus.done}<span className="text-sm text-indigo-400 ml-2">/ {teamStatus.total}</span></p>
                        </div>
                        <div className={cn("p-6 rounded-[2rem] border shadow-sm space-y-4", teamStatus.missing > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                            <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", teamStatus.missing > 0 ? "text-rose-700" : "text-emerald-700")}>Pendentes</p>
                            <p className={cn("text-3xl font-black tabular-nums", teamStatus.missing > 0 ? "text-rose-700" : "text-emerald-700")}>{teamStatus.missing}</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-sm space-y-4">
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">Ciência Recebida</p>
                            <p className="text-3xl font-black tabular-nums text-emerald-700">{teamStatus.acknowledged}<span className="text-sm text-emerald-400 ml-2">/ {teamStatus.done}</span></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {activeTab === 'individual' ? (
                    <motion.section 
                        key="individual" 
                        id="panel-individual"
                        role="tabpanel"
                        aria-labelledby="tab-individual"
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 20 }} 
                        className="space-y-10 pb-32" 
                        aria-live="polite"
                    >
                        <AnimatePresence>
                            {showForm && canCreateFeedback && (
                                <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 z-50 rounded-[3rem] p-1 bg-gradient-to-b from-indigo-50 to-white shadow-3xl mb-10">
                                    <form onSubmit={handleSubmit} className="mx-card !border-none p-10 md:p-14 space-y-10 relative overflow-hidden bg-white" aria-labelledby="feedback-form-title">
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />

                                        <div className="flex items-center justify-between relative z-10 border-b border-gray-100 pb-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-2xl transform rotate-2" aria-hidden="true">
                                                    <Sparkles size={24} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h2 id="feedback-form-title" className="text-2xl font-black text-slate-950 tracking-tighter leading-none mb-2 uppercase">Auditoria de Performance MX</h2>
                                                    <p className="text-gray-600 text-xs font-black uppercase tracking-[0.3em]">Feedback Estruturado • Ciclo Semanal</p>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário" className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:rotate-90 transition-all outline-none focus-visible:ring-4 focus-visible:ring-red-500/10">
                                                <X size={20} aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                            <div className="space-y-8">
                                                <fieldset className="space-y-8">
                                                    <legend className="sr-only">Dados do Vendedor e Performance Técnica</legend>
                                                    <div className="space-y-4">
                                                        <label htmlFor="seller-select" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 leading-none">Especialista em Análise</label>
                                                        <select
                                                            id="seller-select"
                                                            name="seller_id"
                                                            value={form.seller_id}
                                                            onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                                            required
                                                            className="mx-input appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-950 h-14"
                                                        >
                                                            <option value="">Selecione o vendedor...</option>
                                                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                                        </select>
                                                    </div>

                                                    {/* Dashboard de Performance In-Form */}
                                                    {weeklySnapshot && (
                                                        <div className="space-y-8">
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-8 bg-slate-950 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden group border border-white/5 shadow-indigo-500/10">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" aria-hidden="true" />
                                                                <div className="flex items-center justify-between relative z-10">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" aria-hidden="true" />
                                                                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Auditoria Técnica (Semana)</span>
                                                                    </div>
                                                                    <Badge variant="outline" className="border-white/10 text-white/50 font-black text-[10px] tracking-widest uppercase py-1">Critério MX 20/60/33</Badge>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-6 relative z-10" role="list" aria-label="Métricas do funil de vendas">
                                                                    {[
                                                                        { label: 'Leads → Agendamentos', val: weeklySnapshot.tx_lead_agd, bench: MX_BENCHMARKS.lead_agd, avg: weeklyTeamSnapshot.tx_lead_agd },
                                                                        { label: 'Agendamentos → Visitas', val: weeklySnapshot.tx_agd_visita, bench: MX_BENCHMARKS.agd_visita, avg: weeklyTeamSnapshot.tx_agd_visita },
                                                                        { label: 'Visitas → Vendas (Porta/Net)', val: weeklySnapshot.tx_visita_vnd, bench: MX_BENCHMARKS.visita_vnd, avg: weeklyTeamSnapshot.tx_visita_vnd },
                                                                    ].map(metric => {
                                                                        const isAboveAvg = metric.val >= metric.avg
                                                                        return (
                                                                            <div key={metric.label} className="space-y-3" role="listitem">
                                                                                <div className="flex justify-between items-end">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{metric.label}</span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-tighter">Média Loja: {metric.avg}%</span>
                                                                                            <Badge className={cn("text-[8px] font-black h-4 px-1.5 border-none", isAboveAvg ? "bg-emerald-500/30 text-emerald-400" : "bg-rose-500/30 text-rose-400")}>
                                                                                                {isAboveAvg ? 'SUPERIOR' : 'ABAIXO DA MÉDIA'}
                                                                                            </Badge>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-1">
                                                                                        <span className={cn("text-2xl font-black tabular-nums tracking-tighter leading-none", metric.val < metric.bench ? "text-rose-400" : "text-emerald-400")}>{metric.val}%</span>
                                                                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Ideal: {metric.bench}%</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5" role="progressbar" aria-valuenow={metric.val} aria-valuemin={0} aria-valuemax={100} aria-label={metric.label}>
                                                                                    <div className={cn("h-full transition-all duration-1000 p-0.5", metric.val < metric.bench ? "bg-rose-50 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]")} style={{ width: `${Math.min(metric.val, 100)}%` }} />
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                            
                                                            {/* Evolução Histórica */}
                                                             <motion.div 
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="bg-slate-950 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl"
                                                             >
                                                                 <div className="flex items-center justify-between mb-8">
                                                                     <div className="flex flex-col gap-1">
                                                                         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Tendência de Entrega</h4>
                                                                         <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Vendas Totais / Últimas 6 Semanas</p>
                                                                     </div>
                                                                     <TrendingUp size={16} className="text-white/20" aria-hidden="true" />
                                                                 </div>

                                                                 <div className="h-48 w-full mt-4" aria-hidden="true">
                                                                     <ChartContainer config={{ sales: { label: 'Vendas', color: '#6366f1' } }}>
                                                                        <ResponsiveContainer width="100%" height="100%">
                                                                            <AreaChart data={sellerHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                                                <defs>
                                                                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                                                    </linearGradient>
                                                                                </defs>
                                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                                                                <XAxis 
                                                                                    dataKey="week" 
                                                                                    axisLine={false} 
                                                                                    tickLine={false} 
                                                                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900 }} 
                                                                                    dy={10}
                                                                                />
                                                                                <YAxis 
                                                                                    axisLine={false} 
                                                                                    tickLine={false} 
                                                                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 900 }} 
                                                                                />
                                                                                <Tooltip content={<ChartTooltipContent />} />
                                                                                <Area 
                                                                                    type="monotone" 
                                                                                    dataKey="sales" 
                                                                                    stroke="#6366f1" 
                                                                                    strokeWidth={4}
                                                                                    fillOpacity={1} 
                                                                                    fill="url(#colorSales)" 
                                                                                    animationDuration={2000}
                                                                                />
                                                                            </AreaChart>
                                                                        </ResponsiveContainer>
                                                                     </ChartContainer>
                                                                 </div>
                                                             </motion.div>
                                                        </div>
                                                    )}
                                                </fieldset>

                                                <fieldset className="space-y-8">
                                                    <legend className="sr-only">Conteúdo Narrativo do Feedback</legend>
                                                    <div className="space-y-4">
                                                        <label htmlFor="meta-compromisso" className="flex items-center gap-2 text-[10px] font-black text-amber-700 uppercase tracking-widest ml-2 leading-none">
                                                            <Target size={14} aria-hidden="true" /> Meta de Compromisso (Próxima Semana)
                                                        </label>
                                                        <input
                                                            id="meta-compromisso"
                                                            name="meta_compromisso"
                                                            type="number"
                                                            value={form.meta_compromisso}
                                                            onChange={e => setForm(p => ({ ...p, meta_compromisso: Number(e.target.value) }))}
                                                            required
                                                            placeholder="0"
                                                            className="mx-input h-14 font-black text-slate-950 focus:ring-4 focus:ring-amber-500/5 outline-none"
                                                        />
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal ml-2 leading-tight">
                                                            Referência de ritmo para a unidade: <span className="text-amber-700 font-black">{commitmentSuggested} VENDAS</span>.
                                                        </p>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label htmlFor="positives" className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest ml-2 leading-none">
                                                            <Award size={14} aria-hidden="true" /> Diferenciais & Pontos Positivos
                                                        </label>
                                                        <textarea
                                                            id="positives"
                                                            name="positives"
                                                            value={form.positives}
                                                            onChange={e => setForm(p => ({ ...p, positives: e.target.value }))}
                                                            rows={3} required
                                                            placeholder="Quais foram as vitórias desta semana?"
                                                            className="mx-input !rounded-[2rem] h-32 resize-none py-6 font-bold text-slate-950 focus:ring-4 focus:ring-emerald-500/5 outline-none"
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label htmlFor="attention-points" className="flex items-center gap-2 text-[10px] font-black text-rose-700 uppercase tracking-widest ml-2 leading-none">
                                                            <AlertCircle size={14} aria-hidden="true" /> Gargalo Operacional (Pontos de Atenção)
                                                        </label>
                                                        <textarea
                                                            id="attention-points"
                                                            name="attention_points"
                                                            value={form.attention_points}
                                                            onChange={e => setForm(p => ({ ...p, attention_points: e.target.value }))}
                                                            rows={3} required
                                                            placeholder="Onde a conversão está sendo perdida?"
                                                            className="mx-input !rounded-[2rem] h-32 resize-none py-6 font-bold text-slate-950 focus:ring-4 focus:ring-rose-500/5 outline-none"
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label htmlFor="action-plan" className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest ml-2 leading-none">
                                                            <Zap size={14} aria-hidden="true" /> Missão Estratégica & Plano de Ação
                                                        </label>
                                                        <textarea
                                                            id="action-plan"
                                                            name="action"
                                                            value={form.action}
                                                            onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                                                            rows={3} required
                                                            placeholder="Qual a tarefa prática imediata?"
                                                            className="mx-input !rounded-[2rem] h-32 resize-none py-6 font-bold text-slate-950 focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                        />
                                                    </div>
                                                </fieldset>
                                            </div>
                                        </div>

                                        <div className="pt-10 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="submit" disabled={saving}
                                                className="mx-button-primary bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest px-12 py-5 rounded-full hover:bg-black hover:-translate-y-1 transition-all active:scale-95 shadow-2xl disabled:opacity-50 group/btn focus-visible:ring-8 focus-visible:ring-slate-500/20 outline-none"
                                            >
                                                {saving ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" aria-hidden="true" /> : <><Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" aria-hidden="true" /> Enviar Feedback Oficial</>}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence mode="popLayout">
                                {filteredFeedbacks.map((f, i) => (
                                    <li key={f.id} role="listitem">
                                        <article
                                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation transition-all group relative overflow-hidden flex flex-col h-full"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />

                                            <div className="flex items-start justify-between mb-10 relative z-10 border-b border-gray-100 pb-6">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-slate-950 text-xl shadow-inner group-hover:bg-slate-950 group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                                        {(f as any).seller_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-black text-slate-950 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{(f as any).seller_name}</h3>
                                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                                            <time dateTime={f.created_at}>{format(parseISO(f.created_at), 'dd/MM/yyyy')}</time>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm shrink-0", 
                                                    f.acknowledged ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                                )}>
                                                    {f.acknowledged ? 'LIDO' : 'PENDENTE'}
                                                </div>
                                            </div>

                                            <div className="space-y-8 flex-1 relative z-10">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                                                        <Award size={14} className="fill-emerald-700/10" aria-hidden="true" /> Pontos Positivos
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-700 line-clamp-2 leading-relaxed italic bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50 shadow-inner">"{f.positives}"</p>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-700 uppercase tracking-widest leading-none">
                                                        <AlertCircle size={14} className="fill-rose-700/10" aria-hidden="true" /> Atenção
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-700 line-clamp-2 leading-relaxed italic bg-rose-50/30 p-4 rounded-2xl border border-rose-50 shadow-inner">"{f.attention_points}"</p>
                                                </div>
                                                <div className="pt-8 border-t border-gray-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest leading-none">
                                                            <Target size={16} strokeWidth={2.5} className="fill-indigo-700/10" aria-hidden="true" /> Missão Definida
                                                        </div>
                                                        <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 shadow-sm">
                                                            Meta: {(f as any).meta_compromisso || 0} VENDAS
                                                        </div>
                                                    </div>
                                                    <p className="text-lg font-black text-slate-950 leading-tight uppercase tracking-tight">{f.action}</p>
                                                </div>
                                            </div>

                                            <div className="mt-10 pt-8 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => handleSendWhatsApp(f)}
                                                        className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-emerald-500/20 outline-none"
                                                        aria-label={`Enviar feedback de ${(f as any).seller_name} via WhatsApp`}
                                                    >
                                                        <MessageSquare size={18} aria-hidden="true" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSendEmail(f)}
                                                        disabled={sendingEmail === f.id}
                                                        className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"
                                                        aria-label={`Enviar feedback de ${(f as any).seller_name} para e-mail oficial`}
                                                    >
                                                        {sendingEmail === f.id ? <RefreshCw size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => handlePrint(f)}
                                                    className="flex items-center gap-3 px-6 h-12 rounded-2xl bg-gray-50 text-gray-600 hover:text-slate-950 hover:bg-white border border-gray-100 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10"
                                                >
                                                    <FileText size={16} aria-hidden="true" /> Versão PDF
                                                </button>
                                            </div>
                                        </article>
                                    </li>
                                ))}
                            </AnimatePresence>
                        </ul>

                        {/* Printable Hidden View */}
                        <div className="hidden">
                            <div id="printable-area">
                                {printingFeedback && <PrintableFeedback feedback={printingFeedback} />}
                                {printingWeeklyReport && <WeeklyStoreReport report={printingWeeklyReport} />}
                            </div>
                        </div>
                        <style>{`
                            @media print {
                                body * { visibility: hidden; }
                                #printable-area, #printable-area * { visibility: visible; }
                                #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
                            }
                        `}</style>

                        {filteredFeedbacks.length === 0 && (
                            <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-gray-50 transition-all">
                                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />
                                <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                                    <MessageSquare size={48} className="text-gray-300" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter uppercase leading-none">Sem Feedbacks Registrados</h2>
                                <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto mb-10 uppercase tracking-widest leading-relaxed">
                                    Nenhum registro de feedback localizado para <span className="text-indigo-600">"{searchTerm}"</span> na unidade atual.
                                </p>
                                {canCreateFeedback && (
                                    <button type="button" onClick={() => {setSearchTerm(''); setShowForm(true)}} className="mx-button-primary hover:bg-brand-secondary-hover px-12 py-5 shadow-3xl focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none">
                                        Iniciar Primeiro Feedback
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.section>
                ) : (
                    <motion.section 
                        key="weekly" 
                        id="panel-weekly"
                        role="tabpanel"
                        aria-labelledby="tab-weekly"
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }} 
                        className="space-y-10 pb-32" 
                        aria-live="polite"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
                            {reports.map((report, i) => (
                                <article
                                    key={report.id}
                                    className="mx-card p-10 hover:shadow-elevation transition-all group relative overflow-hidden bg-white border border-gray-100 rounded-[2.5rem]"
                                    role="listitem"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" aria-hidden="true" />
                                    
                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl group-hover:rotate-3 transition-transform" aria-hidden="true">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Período de Análise</h3>
                                                <p className="text-lg font-black text-slate-950 uppercase tracking-tight">
                                                    {format(parseISO(report.week_start), 'dd/MM')} a {format(parseISO(report.week_end), 'dd/MM')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={cn(
                                            "text-[9px] font-black tracking-[0.2em] border-none px-4 py-1.5 rounded-full shadow-sm",
                                            report.email_status === 'sent' ? "bg-emerald-500 text-white" : "bg-rose-600 text-white"
                                        )}>
                                            {report.email_status === 'sent' ? 'ENVIADO' : 'FALHA'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Meta Semanal</p>
                                            <p className="text-3xl font-black text-slate-950 font-mono-numbers">{report.weekly_goal}v</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Média Team</p>
                                            <p className="text-3xl font-black text-indigo-600 font-mono-numbers">{(report.team_avg_json as any).vnd || 0}v</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-10 relative z-10">
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-indigo-600" aria-hidden="true" /> Diagnóstico da Unidade
                                        </p>
                                        <div className="flex items-start gap-3 bg-slate-50 p-5 rounded-2xl border border-gray-100 shadow-inner">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" aria-hidden="true" />
                                            <p className="text-xs font-bold text-gray-700 uppercase leading-relaxed line-clamp-2 italic">
                                                "{(report.ranking_json as any)[0]?.diagnostic || 'Sem dados suficientes para processamento forense.'}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-100 flex items-center justify-between mt-auto relative z-10">
                                        <div className="flex -space-x-2" aria-label="Principais especialistas destaques">
                                            {(report.ranking_json as any[]).slice(0, 3).map((s, idx) => (
                                                <div key={idx} className="w-9 h-9 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-[10px] font-black text-indigo-700 shadow-sm hover:z-20 transition-all cursor-help" title={s.name}>
                                                    {s.name.charAt(0)}
                                                </div>
                                            ))}
                                            {(report.ranking_json as any[]).length > 3 && (
                                                <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-[9px] font-black text-white shadow-lg">
                                                    +{(report.ranking_json as any[]).length - 3}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <a
                                                href={report.report_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest hover:text-indigo-950 transition-colors focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none rounded-xl bg-indigo-50 px-4 py-2"
                                            >
                                                CSV <ExternalLink size={12} aria-hidden="true" />
                                            </a>
                                            <button 
                                                onClick={() => handlePrintWeekly(report)}
                                                className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-slate-950 hover:bg-white hover:border-gray-200 uppercase tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-gray-500/10 outline-none rounded-xl border border-transparent px-4 py-2 shadow-sm bg-gray-50"
                                            >
                                                PDF <FileText size={12} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}

                            {reports.length === 0 && (
                                <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-gray-50 transition-all">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />
                                    <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                                        <TrendingUp size={48} className="text-gray-300" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter uppercase leading-none">Histórico em Branco</h2>
                                    <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto mb-10 uppercase tracking-widest leading-relaxed">
                                        O primeiro relatório oficial de unidade será gerado automaticamente na próxima <span className="text-indigo-600">segunda-feira às 12:30</span>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.section>
                )}
            </AnimatePresence>
        </main>
    )
}
