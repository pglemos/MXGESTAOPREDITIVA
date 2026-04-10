import { useFeedbacks, useWeeklyFeedbackReports } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { 
    MessageSquare, Plus, X, Send, Award, AlertCircle, Zap, 
    ChevronRight, LayoutDashboard, Target, TrendingUp, 
    Sparkles, RefreshCw, Search, FileText, ExternalLink, 
    Calendar, ShieldCheck, User, ChevronDown
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { format, subWeeks, startOfWeek, endOfWeek, parseISO, isSameWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { calcularFunil, formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import type { FeedbackFormData } from '@/types/database'

function getPreviousWeekRange() {
    const now = new Date()
    const lastWeek = subWeeks(now, 1)
    const start = startOfWeek(lastWeek, { weekStartsOn: 1 })
    const end = endOfWeek(lastWeek, { weekStartsOn: 1 })
    return {
        start,
        end,
        startKey: format(start, 'yyyy-MM-dd'),
        label: `${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`
    }
}

export default function GerenteFeedback() {
    const { role } = useAuth()
    const { feedbacks, loading: feedbacksLoading, createFeedback, refetch: refetchFeedbacks } = useFeedbacks()
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
        seller_id: '',
        week_reference: previousWeek.startKey,
        leads_week: 0, agd_week: 0, visit_week: 0, vnd_week: 0,
        tx_lead_agd: 0, tx_agd_visita: 0, tx_visita_vnd: 0,
        meta_compromisso: 0, positives: '', attention_points: '', action: '', notes: ''
    })

    const handleSellerSelect = useCallback((sellerId: string) => {
        if (!sellerId) {
            setFormData(f => ({ ...f, seller_id: '' }))
            return
        }

        const weekCheckins = checkins.filter(c => 
            c.seller_user_id === sellerId && 
            isSameWeek(parseISO(c.reference_date), previousWeek.start, { weekStartsOn: 1 })
        )

        const funnel = calcularFunil(weekCheckins as any)
        setFormData(f => ({
            ...f,
            seller_id: sellerId,
            leads_week: funnel.leads,
            agd_week: funnel.agd_total,
            visit_week: funnel.visitas,
            vnd_week: funnel.vnd_total,
            tx_lead_agd: funnel.tx_lead_agd,
            tx_agd_visita: funnel.tx_agd_visita,
            tx_visita_vnd: funnel.tx_visita_vnd,
            meta_compromisso: Math.ceil(funnel.vnd_total * 1.2) || 1
        }))
    }, [checkins, previousWeek])

    const handleSubmit = async () => {
        setSaving(true)
        const { error } = await createFeedback(formData)
        setSaving(false)
        if (error) toast.error(error)
        else {
            toast.success('Mentoria registrada com sucesso!')
            setShowForm(false)
            refetchFeedbacks()
        }
    }

    const handleShareWhatsApp = (f: any) => {
        const text = formatStructuredWhatsAppFeedback({
            sellerName: f.seller_name || 'Especialista',
            metrics: {
                vnd_total: f.vnd_week,
                agd_total: f.agd_week,
                visitas: f.visit_week,
                leads: f.leads_week
            },
            diagnostic: {
                diagnostico: f.attention_points,
                sugestao: f.action
            },
            actions: [f.action],
            periodLabel: `Semana ${f.week_reference}`
        })
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const canCreateFeedback = role === 'admin' || role === 'gerente'

    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter(f => 
            (f as any).seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.week_reference.includes(searchTerm)
        )
    }, [feedbacks, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        if (activeTab === 'individual') await refetchFeedbacks()
        else await refetchReports()
        setIsRefetching(false)
        toast.success('Sincronizado!')
    }, [activeTab, refetchFeedbacks, refetchReports])

    if (feedbacksLoading || reportsLoading) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-64 rounded-mx-full" />
                    <Skeleton className="h-mx-14 w-48 rounded-mx-full" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg bg-surface-alt" id="main-content">
            
            {/* Header / Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-brand-primary">Feedback</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">Rotina Semanal Mandatória • Metodologia MX</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <nav className="flex p-mx-tiny bg-white border border-border-default rounded-mx-full shadow-mx-sm mr-2" role="tablist" aria-label="Abas de Feedback">
                        <Button
                            variant={activeTab === 'individual' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('individual')} 
                            className="h-mx-9 rounded-mx-full px-6 text-mx-tiny font-black uppercase"
                            role="tab"
                            aria-selected={activeTab === 'individual'}
                        >Individual</Button>
                        <Button
                            variant={activeTab === 'weekly' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('weekly')} 
                            className="h-mx-9 rounded-mx-full px-6 text-mx-tiny font-black uppercase"
                            role="tab"
                            aria-selected={activeTab === 'weekly'}
                        >Relatórios</Button>
                    </nav>

                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="search-feedback" className="sr-only">Buscar mentoria</label>
                        <Input 
                            id="search-feedback"
                            placeholder="BUSCAR MENTORIA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest font-black"
                        />
                    </div>
                    
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white" aria-label="Sincronizar mentorias">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>

                    {activeTab === 'individual' && canCreateFeedback && (
                        <Button onClick={() => setShowForm(true)} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary font-black uppercase text-xs tracking-widest">
                            <Plus size={18} className="mr-2" aria-hidden="true" /> NOVO FEEDBACK
                        </Button>
                    )}
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-mx-sm md:p-10 bg-mx-black/60 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feedback-form-title"
                    >
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-mx-2xl border-none flex flex-col bg-white rounded-mx-2xl">
                            <header className="p-mx-lg md:p-10 border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                                <div className="flex items-center gap-mx-sm">
                                    <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg" aria-hidden="true"><MessageSquare size={24} /></div>
                                    <div>
                                        <Typography variant="h2" id="feedback-form-title" className="uppercase tracking-tighter">Nova Mentoria</Typography>
                                        <Typography variant="tiny" tone="muted" className="font-black uppercase opacity-40">Ciclo de Feedback Semanal</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-mx-full w-mx-xl h-mx-xl hover:bg-surface-alt bg-white" aria-label="Fechar modal"><X size={24} /></Button>
                            </header>

                            <div className="p-mx-lg md:p-10 space-y-mx-xl">
                                <div className="grid md:grid-cols-2 gap-mx-lg">
                                    <div className="space-y-mx-xs">
                                        <label htmlFor="seller-select" className="text-mx-tiny font-black uppercase tracking-widest text-text-tertiary ml-2">Especialista Alvo</label>
                                        <div className="relative">
                                            <select 
                                                id="seller-select"
                                                value={formData.seller_id}
                                                onChange={(e) => handleSellerSelect(e.target.value)}
                                                className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md text-sm font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer uppercase shadow-inner"
                                                aria-required="true"
                                            >
                                                <option value="">Selecione um vendedor...</option>
                                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                            </select>
                                            <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" aria-hidden="true" />
                                        </div>
                                    </div>
                                    <div className="space-y-mx-xs">
                                        <Typography variant="tiny" tone="muted" className="ml-2 uppercase font-black tracking-widest opacity-40">Semana de Referência</Typography>
                                        <div className="h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md flex items-center text-sm font-black text-brand-primary shadow-inner">
                                            <Calendar size={18} className="mr-3 opacity-40" aria-hidden="true" />
                                            {previousWeek.label} (ANTERIOR)
                                        </div>
                                    </div>
                                </div>

                                {formData.seller_id && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-mx-xl">
                                        <div className="p-mx-lg bg-surface-alt rounded-mx-xl border border-border-default space-y-mx-lg shadow-inner" role="region" aria-label="Métricas de Desempenho da Semana">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-mx-md">
                                                {[
                                                    { label: 'Leads', val: formData.leads_week, icon: Zap, tone: 'brand' },
                                                    { label: 'Agend.', val: formData.agd_week, icon: Calendar, tone: 'info' },
                                                    { label: 'Visitas', val: formData.visit_week, icon: ShieldCheck, tone: 'warning' },
                                                    { label: 'Vendas', val: formData.vnd_week, icon: Award, tone: 'success' },
                                                ].map(item => (
                                                    <div key={item.label} className="bg-white p-mx-5 rounded-mx-2xl border border-border-default shadow-sm text-center">
                                                        <Typography variant="tiny" tone="muted" className="mb-1 block uppercase text-mx-micro font-black opacity-40">{item.label}</Typography>
                                                        <Typography variant="h2" className="text-xl font-mono-numbers font-black">{item.val}</Typography>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                                            <div className="space-y-mx-sm">
                                                <label htmlFor="positives" className="text-mx-tiny font-black uppercase tracking-widest text-status-success ml-2 flex items-center gap-mx-xs"><Award size={14} aria-hidden="true" /> Pontos Fortes</label>
                                                <textarea 
                                                    id="positives"
                                                    value={formData.positives}
                                                    onChange={e => setFormData(f => ({ ...f, positives: e.target.value }))}
                                                    placeholder="O que o especialista fez de excelente?"
                                                    className="w-full h-mx-4xl p-mx-md bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-status-success transition-all shadow-sm outline-none resize-none"
                                                />
                                            </div>
                                            <div className="space-y-mx-sm">
                                                <label htmlFor="attentions" className="text-mx-tiny font-black uppercase tracking-widest text-status-error ml-2 flex items-center gap-mx-xs"><AlertCircle size={14} aria-hidden="true" /> Pontos de Atenção</label>
                                                <textarea 
                                                    id="attentions"
                                                    value={formData.attention_points}
                                                    onChange={e => setFormData(f => ({ ...f, attention_points: e.target.value }))}
                                                    placeholder="Quais os gargalos identificados?"
                                                    className="w-full h-mx-4xl p-mx-md bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-status-error transition-all shadow-sm outline-none resize-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-mx-sm">
                                            <label htmlFor="action-plan" className="text-mx-tiny font-black uppercase tracking-widest text-brand-primary ml-2 flex items-center gap-mx-xs"><Target size={16} aria-hidden="true" /> Próximo Passo Prático (Ação)</label>
                                            <textarea 
                                                id="action-plan"
                                                value={formData.action}
                                                onChange={e => setFormData(f => ({ ...f, action: e.target.value }))}
                                                placeholder="Qual a ÚNICA COISA que ele deve focar esta semana?"
                                                className="w-full h-mx-3xl p-mx-md bg-white border-2 border-brand-primary/20 rounded-mx-2xl text-base font-black focus:border-brand-primary transition-all shadow-mx-lg outline-none resize-none"
                                                aria-required="true"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <footer className="p-mx-lg md:p-10 border-t border-border-default sticky bottom-mx-0 bg-white z-10 flex justify-end gap-mx-sm">
                                <Button variant="ghost" onClick={() => setShowForm(false)} className="h-mx-14 px-8 rounded-mx-full font-black uppercase tracking-widest">CANCELAR</Button>
                                <Button 
                                    onClick={handleSubmit}
                                    disabled={saving || !formData.seller_id || !formData.action}
                                    className="h-mx-14 px-12 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest"
                                >
                                    {saving ? <RefreshCw className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                                    REGISTRAR MENTORIA
                                </Button>
                            </footer>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {activeTab === 'individual' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg" role="list">
                        <AnimatePresence mode="popLayout">
                            {filteredFeedbacks.map((f, i) => (
                                <motion.article key={f.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }} role="listitem">
                                    <Card className="p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                        
                                        <div>
                                            <header className="flex items-start justify-between mb-8 border-b border-border-default pb-6 relative z-10">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner uppercase" aria-hidden="true">{(f as any).seller_name?.substring(0, 2)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-base font-black uppercase tracking-tight">{(f as any).seller_name}</Typography>
                                                        <Typography variant="tiny" tone="muted" className="text-mx-tiny font-black uppercase opacity-40">{format(parseISO(f.created_at), 'dd/MM/yyyy')}</Typography>
                                                    </div>
                                                </div>
                                                <Badge variant={f.acknowledged ? 'success' : 'danger'} className="px-4 py-1 rounded-mx-lg text-mx-micro font-black uppercase shadow-sm border-none">{f.acknowledged ? 'LIDO' : 'PENDENTE'}</Badge>
                                            </header>

                                            <div className="space-y-mx-md relative z-10">
                                                <div className="p-mx-md bg-surface-alt border-none shadow-mx-inner group-hover:bg-white group-hover:shadow-mx-sm transition-all rounded-mx-2xl">
                                                    <header className="flex items-center justify-between mb-4 border-b border-border-strong/10 pb-3">
                                                        <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest text-mx-micro">Plano de Ação</Typography>
                                                        <Zap size={14} className="text-brand-primary" aria-hidden="true" />
                                                    </header>
                                                    <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-text-secondary line-clamp-3">"{f.action}"</Typography>
                                                </div>
                                            </div>
                                        </div>

                                        <footer className="mt-10 pt-8 border-t border-border-default flex items-center justify-between relative z-10">
                                            <div className="flex gap-mx-xs">
                                                <Button variant="ghost" size="icon" onClick={() => handleShareWhatsApp(f)} className="w-mx-10 h-mx-10 p-mx-0 text-status-success hover:bg-status-success-surface rounded-mx-xl border border-border-default shadow-sm bg-white" aria-label="Compartilhar no WhatsApp"><MessageSquare size={18} /></Button>
                                                <Button variant="ghost" size="icon" className="w-mx-10 h-mx-10 p-mx-0 text-brand-primary hover:bg-mx-indigo-50 rounded-mx-xl border border-border-default shadow-sm bg-white" aria-label="Enviar por email"><Send size={18} /></Button>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-mx-10 px-4 text-mx-micro uppercase tracking-widest rounded-mx-xl shadow-sm bg-white font-black" aria-label="Ver PDF da mentoria">
                                                <FileText size={14} className="mr-2" aria-hidden="true" /> PDF
                                            </Button>
                                        </footer>
                                    </Card>
                                </motion.article>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg" role="list">
                        {reports.map((report) => (
                            <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} role="listitem">
                                <Card className="p-mx-lg md:p-10 hover:shadow-mx-xl transition-all h-full border-none shadow-mx-lg bg-white relative overflow-hidden flex flex-col">
                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md" aria-hidden="true"><Calendar size={24} /></div>
                                            <div>
                                                <Typography variant="tiny" tone="muted" className="uppercase tracking-widest font-black text-mx-micro opacity-40">FECHAMENTO SEMANAL</Typography>
                                                <Typography variant="h3" className="text-lg uppercase font-black tracking-tight">{format(parseISO(report.week_start), 'dd/MM')} - {format(parseISO(report.week_end), 'dd/MM')}</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={report.email_status === 'sent' ? 'success' : 'danger'} className="px-4 py-1 rounded-mx-lg text-mx-micro font-black shadow-sm uppercase border-none">{report.email_status === 'sent' ? 'ENVIADO' : 'FALHA'}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-mx-md py-8 border-y border-border-default relative z-10">
                                        <div className="bg-surface-alt rounded-mx-2xl p-mx-md shadow-mx-inner text-center">
                                            <Typography variant="tiny" tone="muted" className="text-mx-micro mb-2 block uppercase tracking-widest font-black opacity-40">META REDE</Typography>
                                            <Typography variant="h2" className="text-2xl font-mono-numbers tabular-nums font-black">{report.weekly_goal}v</Typography>
                                        </div>
                                        <div className="bg-surface-alt rounded-mx-2xl p-mx-md shadow-mx-inner text-center">
                                            <Typography variant="tiny" tone="muted" className="text-mx-micro mb-2 block uppercase tracking-widest font-black opacity-40">MÉDIA TROPA</Typography>
                                            <Typography variant="h2" tone="brand" className="text-2xl font-mono-numbers tabular-nums font-black">{(report.team_avg_json as any).vnd || 0}v</Typography>
                                        </div>
                                    </div>
                                    <div className="pt-10 flex justify-end gap-mx-sm mt-auto relative z-10">
                                        <Button variant="outline" size="sm" className="h-mx-10 px-6 text-mx-tiny uppercase rounded-mx-full font-black tracking-widest shadow-sm bg-white" aria-label={`Ver detalhes do fechamento de ${format(parseISO(report.week_start), 'dd/MM')}`}>DETALHES</Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
