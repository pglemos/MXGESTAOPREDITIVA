import { usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useState, useCallback, useMemo } from 'react'
import { Plus, Target, CheckCircle2, Calendar, User, TrendingUp, Search, Briefcase, X, MessageSquare, AlertCircle, Clock, RefreshCw, Printer, Award, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"

const statusCfg = {
    aberto: { color: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Aberto' },
    em_andamento: { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Em Execução' },
    concluido: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Concluído' }
}

export default function GerentePDI() {
    const { pdis, reviews, loading, createPDI, updateStatus, createReview, fetchReviews, refetch } = usePDIs()
    const { sellers } = useTeam()
    const navigate = useNavigate()
    const [showForm, setShowForm] = useState(false)
    const [showReviewForm, setShowReviewForm] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    
    const [form, setForm] = useState({
        seller_id: '',
        meta_6m: '',
        meta_12m: '',
        meta_24m: '',
        comp_prospeccao: 5,
        comp_abordagem: 5,
        comp_demonstracao: 5,
        comp_fechamento: 5,
        comp_crm: 5,
        comp_digital: 5,
        comp_disciplina: 5,
        comp_organizacao: 5,
        comp_negociacao: 5,
        comp_produto: 5,
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

    const handleReviewSubmit = async (pdiId: string) => {
        if (!reviewForm.evolution || !reviewForm.next_review_date) {
            toast.error('Preencha a evolução e a próxima data.')
            return
        }
        setSaving(true)
        const { error } = await createReview(pdiId, reviewForm)
        setSaving(false)
        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Revisão mensal registrada!')
            setShowReviewForm(null)
            setReviewForm({ evolution: '', difficulties: '', adjustments: '', next_review_date: '' })
        }
    }

    // 1. & 11. Performance: Memoized search and normalization
    const filteredPDIs = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return (pdis || []).filter(p =>
            (p as any).meta_6m?.toLowerCase().includes(term) ||
            (p as any).seller_name?.toLowerCase().includes(term)
        )
    }, [pdis, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Matriz de PDI sincronizada!')
    }, [refetch])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.meta_6m || !form.action_1) {
            toast.error('Preencha as diretrizes mandatórias do PDI MX.')
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
            setForm({
                seller_id: '', meta_6m: '', meta_12m: '', meta_24m: '',
                comp_prospeccao: 5, comp_abordagem: 5, comp_demonstracao: 5, comp_fechamento: 5, comp_crm: 5,
                comp_digital: 5, comp_disciplina: 5, comp_organizacao: 5, comp_negociacao: 5, comp_produto: 5,
                action_1: '', action_2: '', action_3: '', action_4: '', action_5: '', due_date: ''
            })
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Computando Planos...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Ciclo de <span className="text-indigo-600">Evolução</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Personal Development Plan (PDI)</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar PDI ou vendedor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-indigo-200 shadow-sm transition-all"
                        />
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-brand-secondary-hover shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo PDI
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 z-50 rounded-mx-3xl p-1 bg-gradient-to-b from-indigo-50 to-white shadow-mx-elite mb-10">
                        <form onSubmit={handleCreate} className="mx-card !border-none p-mx-lg md:p-mx-xl relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-2">
                                        <Target size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2 uppercase">Estruturar PDI</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Diretriz de Crescimento Profissional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Vendedor Vinculado</label>
                                        <select
                                            value={form.seller_id}
                                            onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-pure-black font-black text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:shadow-xl transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="">Selecione o vendedor...</option>
                                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Radar de Competências - Versão Auditoria de Gaps */}
                                    <div className="bg-slate-950 p-8 md:p-10 rounded-[3rem] text-white space-y-10 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                                        
                                        <div className="flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em]">Radar de Capacidade MX</h4>
                                            </div>
                                            <Badge variant="outline" className="border-white/10 text-white/40 font-black text-[8px] tracking-widest uppercase">Escala 0 a 10</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 gap-8 relative z-10">
                                            {[
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
                                            ].map(comp => (
                                                <div key={comp.id} className="space-y-3">
                                                    <div className="flex justify-between items-end px-1">
                                                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{comp.label}</span>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-black tabular-nums tracking-tighter text-indigo-400">{(form as any)[comp.id]}</span>
                                                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">/ 10</span>
                                                        </div>
                                                    </div>
                                                    <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(form as any)[comp.id] * 10}%` }}
                                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                                        />
                                                        <input 
                                                            type="range" min="0" max="10" step="1"
                                                            value={(form as any)[comp.id]}
                                                            onChange={e => setForm(p => ({ ...p, [comp.id]: Number(e.target.value) }))}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center pt-4 italic">Arraste as barras para auditar o nível técnico atual.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meta Estratégica (6 Meses)</label>
                                        <input type="text" value={form.meta_6m} onChange={e => setForm(p => ({ ...p, meta_6m: e.target.value }))} required placeholder="Ex: Assumir liderança de equipe ou atingir 120% da meta constante." className="premium-input !rounded-[1.5rem]" />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Meta Tática (12 Meses)</label>
                                        <input type="text" value={form.meta_12m} onChange={e => setForm(p => ({ ...p, meta_12m: e.target.value }))} required placeholder="Objetivo de consolidação no ano." className="premium-input !rounded-[1.5rem]" />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Visão de Longo Prazo (24 Meses)</label>
                                        <input type="text" value={form.meta_24m} onChange={e => setForm(p => ({ ...p, meta_24m: e.target.value }))} placeholder="Ponto de chegada na rede (ex: Gerência Regional)." className="premium-input !rounded-[1.5rem]" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 ml-2">
                                        <Zap size={14} /> 5 Ações de Desenvolvimento (Mandatórias)
                                    </h4>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <div key={num} className="space-y-2">
                                            <label className="text-[8px] font-black text-gray-400 uppercase ml-2">Ação #{num}</label>
                                            <input 
                                                type="text" 
                                                value={(form as any)[`action_${num}`]} 
                                                onChange={e => setForm(p => ({ ...p, [`action_${num}`]: e.target.value }))}
                                                required={num === 1}
                                                placeholder={`Descreva a ação ${num}...`}
                                                className="premium-input !rounded-xl py-4"
                                            />
                                        </div>
                                    ))}

                                    <div className="space-y-4 pt-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Data da Próxima Revisão</label>
                                        <div className="relative group">
                                            <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="date"
                                                value={form.due_date}
                                                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                                                required
                                                className="w-full bg-gray-50 border border-gray-100 rounded-[1.5rem] pl-16 pr-6 py-5 text-pure-black font-black text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:shadow-xl transition-all shadow-inner font-mono-numbers"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-50 flex justify-end">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-brand-secondary-hover hover:shadow-elevation transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                >
                                    {saving ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /> : <><CheckCircle2 size={18} className="group-hover/btn:scale-110 transition-transform" /> Ativar Plano de Desenvolvimento</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0 pb-32">
                <AnimatePresence mode="popLayout">
                    {filteredPDIs.map((p, i) => {
                        const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                        const isExpired = p.due_date && new Date(p.due_date) < new Date()
                        const isNearing = p.due_date && (new Date(p.due_date).getTime() - new Date().getTime()) < (7 * 24 * 60 * 60 * 1000)
                        const needsRevision = isExpired || isNearing

                        return (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation transition-all group relative overflow-hidden flex flex-col h-full",
                                    needsRevision && "border-amber-200 bg-amber-50/10"
                                )}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex items-start justify-between mb-10 relative z-10 border-b border-gray-50 pb-6">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-lg shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all">
                                            {(p as any).seller_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-base text-slate-950 uppercase leading-none mb-1">{(p as any).seller_name}</p>
                                            {needsRevision && (
                                                <span className="text-[7px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Revisão Pendente</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <Badge className={cn("text-[8px] font-black uppercase tracking-widest border shadow-sm px-3 h-6 rounded-lg", status.color)}>
                                            {status.label}
                                        </Badge>
                                        <select
                                            value={p.status}
                                            onChange={e => updateStatus(p.id, e.target.value)}
                                            className="text-[9px] font-black text-gray-300 bg-transparent focus:outline-none cursor-pointer hover:text-pure-black transition-colors uppercase tracking-widest"
                                        >
                                            <option value="aberto">Aberto</option>
                                            <option value="em_andamento">Execução</option>
                                            <option value="concluido">Consolidado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1 relative z-10 mb-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                                <Target size={12} /> Horizonte 6 Meses
                                            </div>
                                            <button 
                                                onClick={() => setShowReviewForm(showReviewForm === p.id ? null : p.id)}
                                                className="text-[8px] font-black text-amber-600 uppercase tracking-widest hover:underline"
                                            >
                                                {showReviewForm === p.id ? 'Cancelar' : 'Registrar Evolução'}
                                            </button>
                                        </div>
                                        <h3 className="text-xl font-black text-pure-black leading-tight uppercase tracking-tight line-clamp-2">{(p as any).meta_6m || (p as any).objective || 'PDI Desatualizado'}</h3>
                                    </div>

                                    {/* Mini Radar de Capacidade - Visão Rápida */}
                                    <div className="grid grid-cols-5 gap-1.5 h-8 items-end px-1 border-b border-gray-50 pb-2">
                                        {[
                                            { val: p.comp_prospeccao, label: 'PR' },
                                            { val: p.comp_abordagem, label: 'AB' },
                                            { val: p.comp_demonstracao, label: 'DM' },
                                            { val: p.comp_fechamento, label: 'FC' },
                                            { val: p.comp_crm, label: 'CR' }
                                        ].map((c, idx) => (
                                            <div key={idx} className="flex flex-col gap-1">
                                                <div className="w-full bg-slate-100 rounded-sm h-6 relative overflow-hidden">
                                                    <div className={cn("absolute bottom-0 w-full rounded-sm transition-all", c.val < 5 ? "bg-rose-400" : "bg-indigo-400")} style={{ height: `${c.val * 10}%` }} />
                                                </div>
                                                <span className="text-[6px] font-black text-gray-300 text-center uppercase">{c.label}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {showReviewForm === p.id ? (
                                        <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                            <textarea 
                                                placeholder="Descreva a evolução do mês..."
                                                value={reviewForm.evolution}
                                                onChange={e => setReviewForm(prev => ({ ...prev, evolution: e.target.value }))}
                                                className="w-full text-[11px] font-bold p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-300 min-h-[80px]"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input 
                                                    type="date"
                                                    value={reviewForm.next_review_date}
                                                    onChange={e => setReviewForm(prev => ({ ...prev, next_review_date: e.target.value }))}
                                                    className="text-[10px] font-black p-3 rounded-xl border border-gray-200 focus:outline-none"
                                                />
                                                <button 
                                                    onClick={() => handleReviewSubmit(p.id)}
                                                    disabled={saving}
                                                    className="bg-slate-950 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                                                >
                                                    {saving ? '...' : 'Salvar'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                    <TrendingUp size={12} /> Ações MX
                                                </div>
                                                <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-widest">
                                                    {[p.action_1, p.action_2, p.action_3, p.action_4, p.action_5].filter(Boolean).length} Ativas
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-500 line-clamp-3 leading-relaxed opacity-80 uppercase tracking-tight">
                                                <span className="text-pure-black font-black">#1:</span> {(p as any).action_1 || (p as any).action || 'Sem ação definida'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            <Calendar size={14} className="text-indigo-400" /> 
                                            {p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : 'Sem Prazo'}
                                        </div>
                                        <button 
                                            onClick={() => navigate(`/pdi/${p.id}/print`)}
                                            className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                            title="Imprimir PDI"
                                        >
                                            <Printer size={14} />
                                        </button>
                                    </div>
                                    {p.acknowledged ? (
                                        <div className="flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                            <CheckCircle2 size={10} strokeWidth={2.5} /> Acordo Firmado
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-gray-300 text-[9px] font-black uppercase tracking-widest">
                                            <Clock size={10} strokeWidth={2.5} /> Pendente Ciência
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {filteredPDIs.length === 0 && !loading && (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <TrendingUp size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter uppercase">Matriz de Evolução Limpa</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto mb-8">
                            Não localizamos planos de desenvolvimento ativos para "{searchTerm}" na loja atual.
                        </p>
                        <button onClick={() => {setSearchTerm(''); setShowForm(true)}} className="px-10 py-4 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all active:scale-95">
                            Fixar Primeiro PDI
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
