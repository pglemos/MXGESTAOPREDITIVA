import { useFeedbacks, usePDIs } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { MessageSquare, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Target, ChevronRight, Check, RefreshCw, X, Search, Zap, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

export default function VendedorFeedback() {
    const [tab, setTab] = useState<'feedbacks' | 'pdis'>('feedbacks')
    const { feedbacks, loading: fbLoading, acknowledge: ackFb, refetch: refetchFb } = useFeedbacks()
    const { pdis, reviews, loading: pdiLoading, acknowledge: ackPdi, fetchReviews, refetch: refetchPdi } = usePDIs()
    const [isRefetching, setIsRefetching] = useState(false)
    const navigate = useNavigate()

    const statusColor = { 
        aberto: 'text-rose-600 bg-rose-50 border-rose-100', 
        em_andamento: 'text-amber-600 bg-amber-50 border-amber-100', 
        concluido: 'text-emerald-600 bg-emerald-50 border-emerald-100' 
    }
    const statusLabel = { aberto: 'Aberto', em_andamento: 'Em Execução', concluido: 'Consolidado' }

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        if (tab === 'feedbacks') await refetchFb()
        else await refetchPdi()
        setIsRefetching(false)
        toast.success('Matrix de feedback sincronizada!')
    }, [tab, refetchFb, refetchPdi])

    if (fbLoading || pdiLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Feedbacks...</p>
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
                            Desenvolvimento <span className="text-electric-blue">Contínuo</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Performance & Growth Insights</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="bg-gray-100/50 p-1.5 rounded-full flex border border-gray-100 shadow-inner">
                        <button
                            onClick={() => setTab('feedbacks')}
                            className={cn("px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2", tab === 'feedbacks' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <MessageSquare size={14} /> Feedbacks
                        </button>
                        <button
                            onClick={() => setTab('pdis')}
                            className={cn("px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2", tab === 'pdis' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <Target size={14} /> PDI Ativos
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-5xl mx-auto shrink-0 pb-32">
                <AnimatePresence mode="popLayout">
                    {tab === 'feedbacks' ? (
                        <motion.div
                            key="feedbacks"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            {feedbacks.length === 0 ? (
                                <div className="py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                                    <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                                        <MessageSquare size={40} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Histórico Vazio</h3>
                                    <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                                        Seu diário de orientações estratégicas está limpo. Continue com a alta performance!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {feedbacks.map((f, i) => (
                                        <motion.div
                                            key={f.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col gap-10"
                                        >
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none z-0" />

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 border-b border-gray-50 pb-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-pure-black group-hover:text-white transition-all transform group-hover:rotate-3 shadow-inner">
                                                        <MessageSquare size={24} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-pure-black text-2xl tracking-tighter leading-none mb-2 group-hover:text-electric-blue transition-colors">Feedback One-on-One</h3>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Clock size={12} className="text-indigo-400" /> Semana {new Date(f.week_reference).toLocaleDateString('pt-BR')} • Criado {new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                                <div className={cn("text-[9px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.3em] flex items-center gap-2 border shadow-sm shrink-0 self-start sm:self-auto", 
                                                    f.acknowledged ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                )}>
                                                    {f.acknowledged ? <CheckCircle size={12} strokeWidth={2.5} /> : <AlertCircle size={12} strokeWidth={2.5} />}
                                                    {f.acknowledged ? `CIÊNCIA CONFIRMADA${f.acknowledged_at ? ` • ${new Date(f.acknowledged_at).toLocaleDateString('pt-BR')}` : ''}` : 'PENDENTE DE LEITURA'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                {/* Snapshot 20/60/33 do Vendedor */}
                                                <div className="bg-slate-950 rounded-[2rem] p-8 text-white space-y-6 md:col-span-2 shadow-2xl relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Snapshot de Performance (Semana)</span>
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Benchmark MX</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-6 relative z-10">
                                                        {[
                                                            { label: 'Lead → Agd', val: f.tx_lead_agd, bench: 20 },
                                                            { label: 'Agd → Visita', val: f.tx_agd_visita, bench: 60 },
                                                            { label: 'Visita → Venda', val: f.tx_visita_vnd, bench: 33 },
                                                        ].map(metric => (
                                                            <div key={metric.label} className="space-y-3">
                                                                <div className="flex justify-between items-end">
                                                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{metric.label}</span>
                                                                    <span className={cn("text-lg font-black tabular-nums tracking-tighter", metric.val < metric.bench ? "text-rose-400" : "text-emerald-400")}>{metric.val}%</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                    <div className={cn("h-full", metric.val < metric.bench ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(metric.val, 100)}%` }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-emerald-50/30 rounded-[2rem] p-8 border border-emerald-100/50 space-y-4 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Check size={14} strokeWidth={2.5} /> Pontos Positivos
                                                    </span>
                                                    <p className="text-base font-bold text-gray-600 leading-relaxed italic">"{f.positives}"</p>
                                                </div>
                                                <div className="bg-amber-50/30 rounded-[2rem] p-8 border border-amber-100/50 space-y-4 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <AlertCircle size={14} strokeWidth={2.5} /> Diagnóstico de Performance
                                                    </span>
                                                    <p className="text-base font-bold text-gray-600 leading-relaxed italic">"{f.attention_points}"</p>
                                                </div>
                                                <div className="bg-indigo-50/30 rounded-[2rem] p-8 border border-indigo-100/50 space-y-4 md:col-span-2 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Zap size={14} strokeWidth={2.5} /> Orientação de Ação
                                                    </span>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-base font-black text-pure-black leading-relaxed">{f.action}</p>
                                                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 ml-4 shrink-0">
                                                            Meta: {f.meta_compromisso}
                                                        </div>
                                                    </div>
                                                    {f.commitment_suggested > 0 && (
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            Meta sugerida pela MX: {f.commitment_suggested}. Meta final definida pelo gerente: {f.meta_compromisso}.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>


                                            {!f.acknowledged && (
                                                <div className="pt-8 border-t border-gray-50 relative z-10 flex justify-end">
                                                    <button
                                                        onClick={async () => { await ackFb(f.id); toast.success('Ciência Confirmada! Snapshot movido para o histórico.') }}
                                                        className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-brand-secondary-hover hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                                    >
                                                        Confirmar Ciência <Check size={20} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="pdis"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            {pdis.length === 0 ? (
                                <div className="py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                                    <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                                        <Target size={40} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Nenhum PDI Ativo</h3>
                                    <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                                        Não há Planos de Desenvolvimento Individual registrados para seu perfil no momento.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {pdis.map((p, i) => (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col gap-10"
                                        >
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50/50 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none z-0" />

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 border-b border-gray-50 pb-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-pure-black group-hover:text-white transition-all transform group-hover:rotate-3 shadow-inner">
                                                        <Target size={24} strokeWidth={2.5} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-pure-black text-2xl tracking-tighter leading-none mb-2 group-hover:text-amber-600 transition-colors uppercase">Acordo de PDI</h3>
                                                        {p.due_date && <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Clock size={12} className="text-amber-500" /> Deadline: {new Date(p.due_date).toLocaleDateString('pt-BR')}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button 
                                                        onClick={() => navigate(`/pdi/${p.id}/print`)}
                                                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                                        title="Imprimir PDI"
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                    <div className={cn("text-[9px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.3em] flex items-center gap-2 border shadow-sm shrink-0 self-start sm:self-auto", 
                                                        statusColor[p.status as keyof typeof statusColor] || 'bg-gray-50 text-gray-400 border-gray-100'
                                                    )}>
                                                        <AlertCircle size={12} strokeWidth={2.5} />
                                                        {statusLabel[p.status as keyof typeof statusLabel]}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                {/* Radar de Capacidade MX */}
                                                <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Radar de Capacidade (6-10)</span>
                                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none font-black text-[8px] uppercase tracking-widest px-2">Avaliação Gerencial</Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                        {[
                                                            { label: 'Prospecção', val: p.comp_prospeccao },
                                                            { label: 'Abordagem', val: p.comp_abordagem },
                                                            { label: 'Demonstração', val: p.comp_demonstracao },
                                                            { label: 'Fechamento', val: p.comp_fechamento },
                                                            { label: 'Gestão CRM', val: p.comp_crm },
                                                            { label: 'Venda Digital', val: p.comp_digital },
                                                            { label: 'Disciplina', val: p.comp_disciplina },
                                                            { label: 'Organização', val: p.comp_organizacao },
                                                            { label: 'Negociação', val: p.comp_negociacao },
                                                            { label: 'Prod. Técnico', val: p.comp_produto }
                                                        ].map(comp => (
                                                            <div key={comp.label} className="space-y-1.5">
                                                                <div className="flex justify-between items-center text-[8px] font-black uppercase text-gray-400">
                                                                    <span>{comp.label}</span>
                                                                    <span className="text-indigo-600">{comp.val}/10</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className={cn("h-full", comp.val >= 7 ? "bg-emerald-500" : comp.val >= 5 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${comp.val * 10}%` }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Horizontes de Crescimento */}
                                                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-200 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 relative z-10">Plano de Carreira MX</span>
                                                    <div className="space-y-6 relative z-10">
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Horizonte 6 Meses (Estratégico)</p>
                                                            <p className="text-lg font-black leading-tight uppercase tracking-tight">{p.meta_6m}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Horizonte 12 Meses (Tático)</p>
                                                            <p className="text-sm font-bold opacity-90 uppercase">{p.meta_12m}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Horizonte 24 Meses (Visão)</p>
                                                            <p className="text-sm font-bold opacity-70 uppercase">{p.meta_24m || 'A definir'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 5 Ações Mandatórias */}
                                                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 space-y-6 md:col-span-2 shadow-sm">
                                                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Zap size={14} strokeWidth={2.5} /> 5 Ações de Desenvolvimento (Obrigatórias)
                                                    </span>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {[p.action_1, p.action_2, p.action_3, p.action_4, p.action_5].map((act, idx) => act && (
                                                            <div key={idx} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-4 group/act hover:bg-white hover:shadow-lg transition-all">
                                                                <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover/act:bg-pure-black group-hover/act:text-white transition-all shrink-0">{idx + 1}</span>
                                                                <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight">{act}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Histórico de Evolução (Reviews) */}
                                                <div className="md:col-span-2 space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                            <Clock size={14} /> Histórico de Evolução Mensal
                                                        </span>
                                                        <button 
                                                            onClick={() => fetchReviews(p.id)}
                                                            className="text-[8px] font-black uppercase text-indigo-600 hover:underline"
                                                        >
                                                            Sincronizar Timeline
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {reviews[p.id]?.length === 0 && <p className="text-[10px] font-bold text-gray-300 italic uppercase">Nenhuma revisão registrada até o momento.</p>}
                                                        {reviews[p.id]?.map((rev, idx) => (
                                                            <div key={rev.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group/rev">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">R{idx + 1}</div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Evolução MX</p>
                                                                            <p className="text-[9px] font-bold text-gray-400">{new Date(rev.created_at).toLocaleDateString('pt-BR')}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Evolução</p>
                                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">"{rev.evolution}"</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Dificuldades</p>
                                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">"{rev.difficulties || 'Nenhum obstáculo relatado.'}"</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Ajustes</p>
                                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">"{rev.adjustments || 'Mantido o plano original.'}"</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>


                                            {!p.acknowledged && (
                                                <div className="pt-8 border-t border-gray-50 relative z-10 flex justify-end">
                                                    <button
                                                        onClick={async () => { await ackPdi(p.id); toast.success('Compromisso de PDI Ativado! ✨') }}
                                                        className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-brand-secondary-hover hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                                    >
                                                        Firmar Acordo <Check size={20} strokeWidth={2.5} className="group-hover/btn:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
