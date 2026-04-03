import { useFeedbacks, usePDIs } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { MessageSquare, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Target, ChevronRight, Check, RefreshCw, X, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function VendedorFeedback() {
    const [tab, setTab] = useState<'feedbacks' | 'pdis'>('feedbacks')
    const { feedbacks, loading: fbLoading, acknowledge: ackFb, refetch: refetchFb } = useFeedbacks()
    const { pdis, loading: pdiLoading, acknowledge: ackPdi, refetch: refetchPdi } = usePDIs()
    const [isRefetching, setIsRefetching] = useState(false)

    const statusIcon = { aberto: AlertCircle, em_andamento: Clock, concluido: CheckCircle }
    // 19. Color Token: Daltônico friendly colors fix
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
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Clock size={12} className="text-indigo-400" /> {new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                                <div className={cn("text-[9px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.3em] flex items-center gap-2 border shadow-sm shrink-0 self-start sm:self-auto", 
                                                    f.acknowledged ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                )}>
                                                    {f.acknowledged ? <CheckCircle size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                                                    {f.acknowledged ? 'CIÊNCIA CONFIRMADA' : 'PENDENTE DE LEITURA'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                <div className="bg-emerald-50/30 rounded-[2rem] p-8 border border-emerald-100/50 space-y-4 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Check size={14} strokeWidth={3} /> Pontos Positivos
                                                    </span>
                                                    <p className="text-base font-bold text-gray-600 leading-relaxed italic">"{f.positives}"</p>
                                                </div>
                                                <div className="bg-amber-50/30 rounded-[2rem] p-8 border border-amber-100/50 space-y-4 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <AlertCircle size={14} strokeWidth={3} /> Pontos de Atenção
                                                    </span>
                                                    <p className="text-base font-bold text-gray-600 leading-relaxed italic">"{f.attention_points}"</p>
                                                </div>
                                                {/* 6. Contrast fix for action plan */}
                                                <div className="bg-indigo-50/30 rounded-[2rem] p-8 border border-indigo-100/50 space-y-4 md:col-span-2 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <TrendingUp size={14} strokeWidth={3} /> Plano de Ação Estratégico
                                                    </span>
                                                    <p className="text-base font-black text-pure-black leading-relaxed">{f.action}</p>
                                                </div>
                                            </div>

                                            {!f.acknowledged && (
                                                <div className="pt-8 border-t border-gray-50 relative z-10 flex justify-end">
                                                    <button
                                                        onClick={async () => { await ackFb(f.id); toast.success('Ciência Confirmada! Snapshot movido para o histórico.') }}
                                                        className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-black hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                                    >
                                                        Confirmar Ciência <Check size={20} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
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
                                                <div className={cn("text-[9px] font-black px-5 py-2.5 rounded-full uppercase tracking-[0.3em] flex items-center gap-2 border shadow-sm shrink-0 self-start sm:self-auto", 
                                                    statusColor[p.status as keyof typeof statusColor] || 'bg-gray-50 text-gray-400 border-gray-100'
                                                )}>
                                                    <AlertCircle size={12} strokeWidth={3} />
                                                    {statusLabel[p.status as keyof typeof statusLabel]}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                                <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 space-y-4 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <Target size={14} strokeWidth={3} className="text-indigo-500" /> Objetivo Estratégico
                                                    </span>
                                                    <p className="text-lg font-black text-pure-black leading-tight uppercase tracking-tight">{p.objective}</p>
                                                </div>
                                                <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 space-y-4 hover:bg-white transition-all hover:shadow-lg">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                        <TrendingUp size={14} strokeWidth={3} className="text-amber-500" /> Ação Mandatória
                                                    </span>
                                                    <p className="text-base font-bold text-gray-500 leading-relaxed">{p.action}</p>
                                                </div>
                                            </div>

                                            {!p.acknowledged && (
                                                <div className="pt-8 border-t border-gray-50 relative z-10 flex justify-end">
                                                    <button
                                                        onClick={async () => { await ackPdi(p.id); toast.success('Compromisso de PDI Ativado! ✨') }}
                                                        className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-black hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                                    >
                                                        Firmar Acordo <Check size={20} strokeWidth={3} className="group-hover/btn:scale-110 transition-transform" />
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
