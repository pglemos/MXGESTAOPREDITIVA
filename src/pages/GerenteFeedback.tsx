import { useFeedbacks } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Plus, X, Send, CheckCircle, Clock, User, Award, AlertCircle, Zap, ChevronRight, LayoutDashboard, Target, TrendingUp, Sparkles, Filter, RefreshCw, Search, History } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { format, startOfWeek } from 'date-fns'
import { calcularFunil, gerarDiagnosticoMX, MX_BENCHMARKS } from '@/lib/calculations'
import type { FunnelData, FeedbackFormData } from '@/types/database'
import { Badge } from '@/components/ui/badge'

export default function GerenteFeedback() {
    const { feedbacks, loading, createFeedback, refetch } = useFeedbacks()
    const { sellers } = useTeam()
    const { checkins } = useCheckins()
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState<FeedbackFormData>({ 
        seller_id: '', 
        week_reference: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
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
    
    // Instância dedicada para histórico do vendedor selecionado
    const { feedbacks: sellerHistory, refetch: refetchHistory } = useFeedbacks({ sellerId: form.seller_id || undefined })

    // Carregar dados da semana e gerar diagnóstico ao selecionar vendedor
    useEffect(() => {
        if (form.seller_id) {
            const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
            const sellerCheckins = checkins.filter(c => 
                c.seller_user_id === form.seller_id && 
                new Date(c.reference_date) >= weekStart
            )
            const funil = calcularFunil(sellerCheckins)
            const diagnostico = gerarDiagnosticoMX(funil)
            
            setWeeklySnapshot(funil)
            setForm(p => ({
                ...p,
                leads_week: funil.leads,
                agd_week: funil.agd_total,
                visit_week: funil.visitas,
                vnd_week: funil.vnd_total,
                tx_lead_agd: funil.tx_lead_agd,
                tx_agd_visita: funil.tx_agd_visita,
                tx_visita_vnd: funil.tx_visita_vnd,
                attention_points: diagnostico.diagnostico,
                action: diagnostico.sugestao
            }))
            refetchHistory()
        }
    }, [form.seller_id, checkins, refetchHistory])

    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter(f => 
            (f as any).seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.positives.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.action.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [feedbacks, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Matrix de feedback da equipe sincronizada!')
    }, [refetch])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.meta_compromisso || !form.positives || !form.attention_points || !form.action) {
            toast.error('Preencha os campos mandatórios de mentoria.')
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
            week_reference: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
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
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Feedbacks...</p>
        </div>
    )

    const SellerHistory = () => {
        if (!form.seller_id || sellerHistory.length === 0) return null
        return (
            <div className="space-y-6 pt-8 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><History size={16} className="text-indigo-400" /></div>
                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Histórico de Auditoria (Últimas Semanas)</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {sellerHistory.slice(0, 3).map((h) => (
                        <div key={h.id} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">Semana {format(new Date(h.week_reference), 'dd/MM')}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Meta: {h.meta_compromisso}</span>
                                    {h.acknowledged ? <Badge className="bg-emerald-500/20 text-emerald-400 text-[7px] border-none px-2 h-4 rounded-full">CIENTE</Badge> : <Badge className="bg-amber-500/20 text-amber-400 text-[7px] border-none px-2 h-4 rounded-full">PENDENTE</Badge>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold text-white/60 leading-relaxed line-clamp-2 italic">"{h.attention_points}"</p>
                                <div className="flex items-center gap-2 pt-2">
                                    <Zap size={10} className="text-indigo-400" />
                                    <p className="text-[10px] font-black text-white/80 uppercase tracking-tight truncate">{h.action}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-mx-md" />
                        <h1 className="text-4xl md:text-[38px] font-black tracking-tighter leading-none uppercase">
                            Feedback <span className="text-indigo-600">Estruturado</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Rotina Semanal Mandatória • Critério 20/60/33</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar por vendedor ou tema..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mx-input !py-3"
                        />
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mx-button-primary !px-8 !py-4 hover:bg-brand-secondary-hover shadow-3xl group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Feedback
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 z-50 rounded-[3rem] p-1 bg-gradient-to-b from-indigo-50 to-white shadow-3xl mb-10">
                        <form onSubmit={handleSubmit} className="mx-card !border-none p-10 md:p-14 space-y-10 relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-2">
                                        <Sparkles size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2 uppercase">Feedback Estruturado MX</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Auditoria de Performance Operacional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 leading-none">Vendedor Analisado</label>
                                        <select
                                            value={form.seller_id}
                                            onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                            required
                                            className="mx-input appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione o vendedor...</option>
                                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Dashboard de Performance In-Form */}
                                    {weeklySnapshot && (
                                        <div className="space-y-8">
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-8 bg-slate-950 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Auditoria Técnica (Semana)</span>
                                                    </div>
                                                    <Badge variant="outline" className="border-white/10 text-white/40 font-black text-[8px] tracking-widest uppercase py-1">Critério MX 20/60/33</Badge>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6 relative z-10">
                                                    {[
                                                        { label: 'Lead → Agendamento', val: weeklySnapshot.tx_lead_agd, bench: MX_BENCHMARKS.lead_agd, avg: Math.round(checkins.reduce((s, c) => s + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0) / (checkins.reduce((s, c) => s + (c.leads_prev_day || 0), 0) || 1) * 100) },
                                                        { label: 'Agendamento → Visita', val: weeklySnapshot.tx_agd_visita, bench: MX_BENCHMARKS.agd_visita, avg: Math.round(checkins.reduce((s, c) => s + (c.visit_prev_day || 0), 0) / (checkins.reduce((s, c) => s + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0) || 1) * 100) },
                                                        { label: 'Visita → Venda', val: weeklySnapshot.tx_visita_vnd, bench: MX_BENCHMARKS.visita_vnd, avg: Math.round(checkins.reduce((s, c) => s + (c.vnd_porta_prev_day || 0) + (c.vnd_cart_prev_day || 0) + (c.vnd_net_prev_day || 0), 0) / (checkins.reduce((s, c) => s + (c.visit_prev_day || 0), 0) || 1) * 100) },
                                                    ].map(metric => {
                                                        const isAboveAvg = metric.val >= metric.avg
                                                        return (
                                                            <div key={metric.label} className="space-y-3">
                                                                <div className="flex justify-between items-end">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{metric.label}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[8px] font-bold text-indigo-400/60 uppercase tracking-tighter">Média Loja: {metric.avg}%</span>
                                                                            <Badge className={cn("text-[7px] font-black h-4 px-1.5 border-none", isAboveAvg ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                                                                                {isAboveAvg ? 'SUPERIOR' : 'ABAIXO DA MÉDIA'}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <span className={cn("text-2xl font-black tabular-nums tracking-tighter leading-none", metric.val < metric.bench ? "text-rose-400" : "text-emerald-400")}>{metric.val}%</span>
                                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Ideal: {metric.bench}%</span>
                                                                    </div>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                                    <div className={cn("h-full transition-all duration-1000 p-0.5", metric.val < metric.bench ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]")} style={{ width: `${Math.min(metric.val, 100)}%` }} />
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                            
                                            {/* Histórico do Vendedor */}
                                            <SellerHistory />
                                        </div>
                                    )}


                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest ml-2 leading-none">
                                            <Target size={14} /> Meta Compromisso Semanal
                                        </label>
                                        <input
                                            type="number"
                                            value={form.meta_compromisso}
                                            onChange={e => setForm(p => ({ ...p, meta_compromisso: Number(e.target.value) }))}
                                            required
                                            placeholder="Sugerido: Média dos últimos 15 dias..."
                                            className="mx-input"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2 leading-none">
                                            <Award size={14} /> Pontos Positivos
                                        </label>
                                        <textarea
                                            value={form.positives}
                                            onChange={e => setForm(p => ({ ...p, positives: e.target.value }))}
                                            rows={3} required
                                            placeholder="Descreva resultados acima da média ou conquistas..."
                                            className="mx-input !rounded-[2rem] h-32 resize-none py-6"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest ml-2 leading-none">
                                            <AlertCircle size={14} /> Diagnóstico de Performance (Automático)
                                        </label>
                                        <textarea
                                            value={form.attention_points}
                                            onChange={e => setForm(p => ({ ...p, attention_points: e.target.value }))}
                                            rows={3} required
                                            placeholder="Quais indicadores ou comportamentos precisam de ajuste?"
                                            className="mx-input !rounded-[2rem] h-32 resize-none py-6"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2 leading-none">
                                            <Zap size={14} /> Orientação de Ação
                                        </label>
                                        <textarea
                                            value={form.action}
                                            onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                                            rows={3} required
                                            placeholder="Qual o plano tático imediato para este vendedor?"
                                            className="mx-input !rounded-[2rem] h-32 resize-none py-6"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-50 flex justify-end">
                                <button
                                    type="submit" disabled={saving}
                                    className="mx-button-primary hover:bg-brand-secondary-hover disabled:opacity-50 group/btn"
                                >
                                    {saving ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /> : <><Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /> Enviar Feedback Oficial</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0 pb-32">
                <AnimatePresence mode="popLayout">
                    {filteredFeedbacks.map((f, i) => (
                        <motion.div
                            key={f.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation transition-all group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-start justify-between mb-10 relative z-10 border-b border-gray-50 pb-6">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-lg shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all">
                                        {(f as any).seller_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-pure-black truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{(f as any).seller_name}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className={cn("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm shrink-0", 
                                    f.acknowledged ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                )}>
                                    {f.acknowledged ? 'LIDO' : 'PENDENTE'}
                                </div>
                            </div>

                            <div className="space-y-6 flex-1 relative z-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                                        <Award size={12} /> Pontos Positivos
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 line-clamp-2 leading-relaxed italic">"{f.positives}"</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none">
                                        <AlertCircle size={12} /> Atenção
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 line-clamp-2 leading-relaxed italic">"{f.attention_points}"</p>
                                </div>
                                <div className="pt-6 border-t border-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                                            <Target size={14} strokeWidth={2.5} /> Missão Definida
                                        </div>
                                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                            Meta: {(f as any).meta_compromisso || 0}
                                        </div>
                                    </div>
                                    <p className="text-base font-black text-pure-black leading-tight uppercase tracking-tight">{f.action}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredFeedbacks.length === 0 && !loading && (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <MessageSquare size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter uppercase">Sem Feedbacks Registrados</h3>
                        <p className="text-gray-400 text-sm font-bold max-w-sm mx-auto mb-8">
                            Nenhum registro de feedback localizado para "{searchTerm}" na unidade atual.
                        </p>
                        <button onClick={() => {setSearchTerm(''); setShowForm(true)}} className="mx-button-primary hover:bg-brand-secondary-hover px-10 py-4 shadow-3xl">
                            Iniciar Primeiro Feedback
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
