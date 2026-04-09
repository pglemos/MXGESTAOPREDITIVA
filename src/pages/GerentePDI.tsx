import { usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Plus, Target, CheckCircle2, Calendar, User, TrendingUp, Search, Briefcase, X, MessageSquare, AlertCircle, Clock, RefreshCw, Printer, Award, Zap, ChevronLeft, ChevronRight, LayoutDashboard, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const statusCfg = {
    aberto: { color: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Aberto' },
    em_andamento: { color: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Em Execução' },
    concluido: { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Concluído' }
}

const steps = [
    { id: 'goals', label: 'Metas de Carreira', icon: Target },
    { id: 'skills', label: 'Radar de Competências', icon: LayoutDashboard },
    { id: 'actions', label: 'Plano de Ação', icon: Zap }
]

const competences = [
    { id: 'comp_prospeccao', label: 'Prospecção' },
    { id: 'comp_abordagem', label: 'Abordagem' },
    { id: 'comp_demonstracao', label: 'Demonstração' },
    { id: 'comp_fechamento', label: 'Fechamento' },
    { id: 'comp_crm', label: 'Gestão CRM' },
    { id: 'comp_digital', label: 'Venda Digital' },
    { id: 'comp_disciplina', label: 'Disciplina' },
    { id: 'comp_organizacao', label: 'Organização' },
    { id: 'comp_negociacao', label: 'Negociação' },
    { id: 'comp_produto', label: 'Prod. Técnico' }
]

export default function GerentePDI() {
    const { role } = useAuth()
    const { pdis, loading, createPDI, updateStatus, createReview, refetch } = usePDIs()
    const { sellers } = useTeam()
    const navigate = useNavigate()
    const [showForm, setShowForm] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [showReviewForm, setShowReviewForm] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const canManagePDI = role === 'admin' || role === 'gerente'

    const [form, setForm] = useState({
        seller_id: '',
        meta_6m: '',
        meta_12m: '',
        meta_24m: '',
        comp_prospeccao: 6,
        comp_abordagem: 6,
        comp_demonstracao: 6,
        comp_fechamento: 6,
        comp_crm: 6,
        comp_digital: 6,
        comp_disciplina: 6,
        comp_organizacao: 6,
        comp_negociacao: 6,
        comp_produto: 6,
        action_1: '',
        action_2: '',
        action_3: '',
        action_4: '',
        action_5: '',
        due_date: ''
    })

    const [reviewForm, setReviewForm] = useState({
        evolution: '',
        difficulties: '',
        adjustments: '',
        next_review_date: ''
    })

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

    const radarData = useMemo(() => competences.map(c => ({
        subject: c.label,
        value: (form as any)[c.id] || 6,
        fullMark: 10
    })), [form])

    const filteredPDIs = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return pdis.filter((p: any) =>
            (p.meta_6m || p.objective || '').toLowerCase().includes(term) ||
            (p.seller_name || '').toLowerCase().includes(term)
        )
    }, [pdis, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Matriz de PDI sincronizada!')
    }, [refetch])

    const handleReviewSubmit = async (pdiId: string) => {
        if (!canManagePDI) {
            toast.error('Seu papel permite acompanhar PDIs, mas não revisar.')
            return
        }
        if (!reviewForm.evolution || !reviewForm.next_review_date) {
            toast.error('Preencha a evolução e a próxima data.')
            return
        }
        setSaving(true)
        const { error } = await createReview(pdiId, reviewForm)
        setSaving(false)
        if (error) {
            toast.error(error.message)
            return
        }
        toast.success('Revisão mensal registrada!')
        setShowReviewForm(null)
        setReviewForm({
            evolution: '',
            difficulties: '',
            adjustments: '',
            next_review_date: ''
        })
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManagePDI) {
            toast.error('Seu papel permite acompanhar PDIs, mas não criar ou editar.')
            return
        }
        if (!form.seller_id || !form.meta_6m || !form.meta_12m || !form.meta_24m || !form.action_1 || !form.action_2 || !form.action_3 || !form.action_4 || !form.action_5 || !form.due_date) {
            toast.error('Preencha os 3 horizontes, as 5 ações mandatórias e a data alvo do PDI MX.')
            return
        }
        setSaving(true)
        const { error } = await createPDI(form as any)
        setSaving(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('PDI Oficial MX ativado com sucesso!')
            setShowForm(false)
            setCurrentStep(0)
            setForm({
                seller_id: '', meta_6m: '', meta_12m: '', meta_24m: '',
                comp_prospeccao: 6, comp_abordagem: 6, comp_demonstracao: 6, comp_fechamento: 6, comp_crm: 6,
                comp_digital: 6, comp_disciplina: 6, comp_organizacao: 6, comp_negociacao: 6, comp_produto: 6,
                action_1: '', action_2: '', action_3: '', action_4: '', action_5: '', due_date: ''
            })
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl" role="status">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl" aria-hidden="true"></div>
            <p className="mt-6 text-gray-500 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Computando Planos...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Ciclo de <span className="text-indigo-600">Evolução</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg animate-pulse" aria-hidden="true" />
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] italic">Personal Development Plan (PDI)</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" aria-hidden="true" />
                        <label htmlFor="search-pdi" className="sr-only">Buscar PDI ou vendedor</label>
                        <input
                            id="search-pdi"
                            type="text"
                            placeholder="Buscar PDI ou vendedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-indigo-200 shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        aria-label="Atualizar lista de PDI"
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                    >
                        <RefreshCw size={20} className={cn((isRefetching || loading) && "animate-spin")} aria-hidden="true" />
                    </button>
                    {canManagePDI && (
                        <button
                            type="button"
                            onClick={() => setShowForm(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-brand-secondary-hover shadow-3xl transition-all active:scale-95 text-xs uppercase tracking-[0.3em] group relative overflow-hidden focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" aria-hidden="true" /> Novo PDI
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && canManagePDI && (
                    <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 z-50 rounded-mx-3xl p-1 bg-gradient-to-b from-indigo-50 to-white shadow-mx-elite mb-10">
                        <form onSubmit={handleCreate} className="mx-card !border-none p-mx-lg md:p-mx-xl relative overflow-hidden bg-white" aria-labelledby="form-pdi-title">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8 mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-2" aria-hidden="true">
                                        <Target size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h2 id="form-pdi-title" className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2 uppercase">Ciclo de Evolução Individual</h2>
                                        <div className="flex items-center gap-3">
                                            <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Mapeamento de Competências & Gaps</p>
                                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase tracking-widest animate-pulse">Consultoria Técnica MX</span>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário" className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all focus-visible:ring-4 focus-visible:ring-red-500/10 outline-none">
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>

                            {/* Stepper */}
                            <nav aria-label="Passos do formulário" className="flex items-center justify-between gap-4 mb-12 relative z-10">
                                {steps.map((step, idx) => (
                                    <div key={step.id} className="flex-1 flex flex-col gap-3">
                                        <div className={cn(
                                            "h-1.5 rounded-full transition-all duration-500",
                                            currentStep >= idx ? "bg-indigo-600" : "bg-gray-100"
                                        )} />
                                        <div className="flex items-center gap-2">
                                            <step.icon size={14} className={currentStep >= idx ? "text-indigo-600" : "text-gray-400"} aria-hidden="true" />
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStep >= idx ? "text-slate-950" : "text-gray-400")}>{step.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <div className="relative z-10 min-h-[500px]" aria-live="polite">
                                <AnimatePresence mode="wait">
                                    {currentStep === 0 && (
                                        <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                            <fieldset className="space-y-8">
                                                <legend className="sr-only">Metas de Carreira</legend>
                                                <div className="space-y-4">
                                                    <label htmlFor="seller-select" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Especialista Alvo</label>
                                                    <select
                                                        id="seller-select"
                                                        value={form.seller_id}
                                                        onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                                        required
                                                        className="mx-input appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/5 outline-none"
                                                    >
                                                        <option value="">Selecione o vendedor...</option>
                                                        {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div className="space-y-2">
                                                        <label htmlFor="meta-6m" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2 italic">Horizonte 6 Meses</label>
                                                        <input id="meta-6m" type="text" value={form.meta_6m} onChange={e => setForm(p => ({ ...p, meta_6m: e.target.value }))} className="premium-input" placeholder="Onde o vendedor estara em 6 meses?" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label htmlFor="meta-12m" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2 italic">Horizonte 12 Meses</label>
                                                        <input id="meta-12m" type="text" value={form.meta_12m} onChange={e => setForm(p => ({ ...p, meta_12m: e.target.value }))} className="premium-input" placeholder="Meta tatica anual..." />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label htmlFor="meta-24m" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2 italic">Visao 24 Meses</label>
                                                        <input id="meta-24m" type="text" value={form.meta_24m} onChange={e => setForm(p => ({ ...p, meta_24m: e.target.value }))} className="premium-input" placeholder="Ponto de chegada na rede..." />
                                                    </div>
                                                </div>
                                            </fieldset>
                                        </motion.div>
                                    )}

                                    {currentStep === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid lg:grid-cols-2 gap-12">
                                            <fieldset className="space-y-6">
                                                <legend className="text-xs font-black text-slate-950 uppercase tracking-widest border-l-4 border-indigo-600 pl-4 mb-8">Auditoria de Competencias (6-10)</legend>
                                                <div className="grid grid-cols-1 gap-6 h-[400px] overflow-y-auto pr-4 no-scrollbar">
                                                    {competences.map(c => (
                                                        <div key={c.id} className="space-y-2">
                                                            <div className="flex justify-between items-end">
                                                                <label htmlFor={`range-${c.id}`} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{c.label}</label>
                                                                <span className="text-xl font-black text-indigo-600 font-mono-numbers">{(form as any)[c.id]}</span>
                                                            </div>
                                                            <input
                                                                id={`range-${c.id}`}
                                                                type="range" min="6" max="10" step="1"
                                                                value={(form as any)[c.id]}
                                                                onChange={e => setForm(p => ({ ...p, [c.id]: Number(e.target.value) }))}
                                                                className="w-full accent-indigo-600 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </fieldset>
                                            <div className="bg-slate-950 rounded-[3rem] p-10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" aria-hidden="true" />
                                                <div className="flex items-center gap-2 mb-8 relative z-10">
                                                    <Sparkles size={14} className="text-indigo-400" aria-hidden="true" />
                                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Radar Tecnico MX</span>
                                                </div>
                                                <div className="w-full h-[350px] relative z-10">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                            <PolarGrid stroke="#ffffff20" />
                                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 10, fontWeight: 'bold' }} />
                                                            <Radar
                                                                name="Capacidade"
                                                                dataKey="value"
                                                                stroke="#6366f1"
                                                                fill="#6366f1"
                                                                fillOpacity={0.5}
                                                            />
                                                        </RadarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {currentStep === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                            <fieldset className="grid grid-cols-1 gap-4">
                                                <legend className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                                                    <Zap size={14} aria-hidden="true" /> 5 Ações Mandatorias de Evolucao
                                                </legend>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <div key={n} className="flex items-center gap-4">
                                                        <span className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-xs shrink-0" aria-hidden="true">{n}</span>
                                                        <label htmlFor={`action-${n}`} className="sr-only">Ação #{n}</label>
                                                        <input
                                                            id={`action-${n}`}
                                                            type="text"
                                                            value={(form as any)[`action_${n}`]}
                                                            onChange={e => setForm(p => ({ ...p, [`action_${n}`]: e.target.value }))}
                                                            required={n === 1}
                                                            className="premium-input !rounded-2xl"
                                                            placeholder={`Ação #${n}...`}
                                                        />
                                                    </div>
                                                ))}
                                            </fieldset>
                                            <div className="pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label htmlFor="pdi-due-date" className="text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Data da Proxima Revisao</label>
                                                    <div className="relative group">
                                                        <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" aria-hidden="true" />
                                                        <input id="pdi-due-date" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} required className="mx-input !pl-16 font-mono-numbers outline-none focus:ring-4 focus:ring-indigo-500/5" />
                                                    </div>
                                                </div>
                                                <div className="flex items-end">
                                                    <button
                                                        type="submit" disabled={saving}
                                                        className="w-full h-16 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center gap-4 hover:bg-indigo-700 shadow-xl transition-all active:scale-95 text-xs uppercase tracking-[0.3em] focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"
                                                    >
                                                        {saving ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <><Award size={18} aria-hidden="true" /> Ativar Ciclo de Evolucao</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-50 relative z-10">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                                    disabled={currentStep === 0}
                                    className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-pure-black disabled:opacity-0 transition-all focus-visible:ring-2 focus-visible:ring-gray-500 outline-none rounded-lg p-2"
                                >
                                    <ChevronLeft size={16} aria-hidden="true" /> Voltar Passo
                                </button>
                                {currentStep < 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(s => Math.min(2, s + 1))}
                                        className="mx-button-primary !w-auto !px-10 group focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"
                                    >
                                        Proximo Passo <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0 pb-32" aria-live="polite">
                <AnimatePresence mode="popLayout">
                    {filteredPDIs.map((p, i) => {
                        const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                        const isExpired = p.due_date && new Date(p.due_date) < new Date()
                        const isNearing = p.due_date && (new Date(p.due_date).getTime() - new Date().getTime()) < (7 * 24 * 60 * 60 * 1000)
                        const needsRevision = isExpired || isNearing

                        return (
                            <article
                                key={p.id}
                                className={cn(
                                    "bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation transition-all group relative overflow-hidden flex flex-col h-full",
                                    needsRevision && "border-amber-300 bg-amber-50/20"
                                )}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />

                                <div className="flex items-start justify-between mb-10 relative z-10 border-b border-gray-100 pb-6">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-slate-900 text-lg shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all" aria-hidden="true">
                                            {(p as any).seller_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-base text-slate-950 uppercase leading-none mb-1">{(p as any).seller_name}</h3>
                                            {needsRevision && (
                                                <span className="text-[8px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Revisão Pendente</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <Badge className={cn("text-[10px] font-black uppercase tracking-widest border shadow-sm px-3 h-6 rounded-lg", status.color)}>
                                            {status.label}
                                        </Badge>
                                        {canManagePDI && (
                                            <>
                                                <label htmlFor={`status-${p.id}`} className="sr-only">Alterar Status</label>
                                                <select
                                                    id={`status-${p.id}`}
                                                    value={p.status}
                                                    onChange={e => updateStatus(p.id, e.target.value)}
                                                    className="text-[10px] font-black text-gray-500 bg-transparent focus:outline-none cursor-pointer hover:text-pure-black transition-colors uppercase tracking-widest"
                                                >
                                                    <option value="aberto">Aberto</option>
                                                    <option value="em_andamento">Execução</option>
                                                    <option value="concluido">Consolidado</option>
                                                </select>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1 relative z-10 mb-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase tracking-widest leading-none">
                                                <Target size={14} aria-hidden="true" /> Horizonte 6 Meses
                                            </div>
                                            {canManagePDI && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReviewForm(showReviewForm === p.id ? null : p.id)}
                                                    className="text-[10px] font-black text-amber-700 uppercase tracking-widest hover:underline focus-visible:ring-2 focus-visible:ring-amber-500 outline-none rounded"
                                                >
                                                    {showReviewForm === p.id ? 'Cancelar' : 'Registrar Evolução'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">{(p as any).meta_6m || (p as any).objective || 'PDI Desatualizado'}</p>
                                    </div>

                                    {/* Mini Radar de Capacidade - Visão Rápida */}
                                    <div className="grid grid-cols-5 gap-1.5 h-8 items-end px-1 border-b border-gray-100 pb-2" aria-label="Níveis de competência">
                                        {[
                                            { val: p.comp_prospeccao, label: 'PR' },
                                            { val: p.comp_abordagem, label: 'AB' },
                                            { val: p.comp_demonstracao, label: 'DM' },
                                            { val: p.comp_fechamento, label: 'FC' },
                                            { val: p.comp_crm, label: 'CR' }
                                        ].map((c, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                                <div className="w-full bg-slate-100 rounded-sm h-6 relative overflow-hidden">
                                                    <div className={cn("absolute bottom-0 w-full rounded-sm transition-all", c.val < 7 ? "bg-rose-500" : "bg-indigo-500")} style={{ height: `${c.val * 10}%` }}>
                                                        <span className="sr-only">{c.label}: {c.val}/10</span>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-black text-gray-400 text-center uppercase" aria-hidden="true">{c.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {showReviewForm === p.id ? (
                                        <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                            <label htmlFor={`review-${p.id}`} className="sr-only">Evolução do Mês</label>
                                            <textarea
                                                id={`review-${p.id}`}
                                                placeholder="Descreva a evolução do mês..."
                                                value={reviewForm.evolution}
                                                onChange={e => setReviewForm(prev => ({ ...prev, evolution: e.target.value }))}
                                                className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-300 min-h-[80px] text-slate-900"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <label htmlFor={`next-review-${p.id}`} className="sr-only">Próxima Revisão</label>
                                                <input
                                                    id={`next-review-${p.id}`}
                                                    type="date"
                                                    value={reviewForm.next_review_date}
                                                    onChange={e => setReviewForm(prev => ({ ...prev, next_review_date: e.target.value }))}
                                                    className="text-[10px] font-black p-3 rounded-xl border border-gray-200 focus:outline-none text-slate-700"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleReviewSubmit(p.id)}
                                                    disabled={saving}
                                                    className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none"
                                                >
                                                    {saving ? '...' : 'Salvar'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs font-black text-gray-600 uppercase tracking-widest leading-none">
                                                    <TrendingUp size={14} aria-hidden="true" /> Ações MX
                                                </div>
                                                <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-widest">
                                                    {[p.action_1, p.action_2, p.action_3, p.action_4, p.action_5].filter(Boolean).length} Ativas
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-600 line-clamp-3 leading-relaxed uppercase tracking-tight">
                                                <span className="text-slate-950 font-black">#1:</span> {(p as any).action_1 || (p as any).action || 'Sem ação definida'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <Calendar size={14} className="text-indigo-600" aria-hidden="true" />
                                            {p.due_date ? <time dateTime={p.due_date}>{new Date(p.due_date).toLocaleDateString('pt-BR')}</time> : 'Sem Prazo'}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/pdi/${p.id}/print`)}
                                            className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-gray-500 hover:text-slate-900 hover:bg-slate-100 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                                            aria-label="Imprimir PDI"
                                        >
                                            <Printer size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                    {p.acknowledged ? (
                                        <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                            <CheckCircle2 size={12} strokeWidth={2.5} aria-hidden="true" /> Acordo Firmado
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                            <Clock size={12} strokeWidth={2.5} aria-hidden="true" /> Pendente Ciência
                                        </div>
                                    )}
                                </div>
                            </article>
                        )
                    })}
                </AnimatePresence>

                {filteredPDIs.length === 0 && !loading && (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                            <TrendingUp size={40} className="text-gray-300" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Matriz de Evolução Limpa</h2>
                        <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto mb-8">
                            Não localizamos planos de desenvolvimento ativos para "{searchTerm}" na loja atual.
                        </p>
                        {canManagePDI && (
                            <button type="button" onClick={() => {setSearchTerm(''); setShowForm(true)}} className="px-10 py-4 bg-pure-black text-white rounded-full text-xs font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">
                                Fixar Primeiro PDI
                            </button>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
