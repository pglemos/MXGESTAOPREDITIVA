import { useFeedbacks, usePDIs } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { MessageSquare, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, Target, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function VendedorFeedback() {
    const [tab, setTab] = useState<'feedbacks' | 'pdis'>('feedbacks')
    const { feedbacks, loading: fbLoading, acknowledge: ackFb } = useFeedbacks()
    const { pdis, loading: pdiLoading, acknowledge: ackPdi } = usePDIs()

    const statusIcon = { aberto: AlertCircle, em_andamento: Clock, concluido: CheckCircle }
    const statusColor = { aberto: 'text-rose-600 bg-rose-50 border-rose-100', em_andamento: 'text-amber-600 bg-amber-50 border-amber-100', concluido: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
    const statusLabel = { aberto: 'Aberto', em_andamento: 'Em andamento', concluido: 'Concluído' }

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Desenvolvimento <br className="lg:hidden" />Poderoso
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Growth & Orientations</p>
                    </div>
                </div>

                <div className="flex bg-[#F8FAFC] border border-gray-100 rounded-full p-1.5 shadow-sm overflow-hidden relative shrink-0">
                    <div className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-full transition-transform duration-300 shadow-sm border border-gray-50" style={{ transform: `translateX(${tab === 'feedbacks' ? '6px' : 'calc(100% + 6px)'})` }} />
                    <button
                        onClick={() => setTab('feedbacks')}
                        className={`relative z-10 flex-1 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${tab === 'feedbacks' ? 'text-indigo-600' : 'text-gray-400 hover:text-[#1A1D20]'}`}
                    >
                        <MessageSquare size={14} /> Histórico Feedbacks
                    </button>
                    <button
                        onClick={() => setTab('pdis')}
                        className={`relative z-10 flex-1 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${tab === 'pdis' ? 'text-indigo-600' : 'text-gray-400 hover:text-[#1A1D20]'}`}
                    >
                        <Target size={14} /> Planos PDI Ativos
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-4xl mx-auto shrink-0 pb-20">
                <AnimatePresence mode="wait">
                    {tab === 'feedbacks' ? (
                        <motion.div
                            key="feedbacks"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {fbLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 inner-card">
                                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
                                    <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Feedbacks...</p>
                                </div>
                            ) : feedbacks.length === 0 ? (
                                <div className="py-32 rounded-[4rem] text-center inner-card flex flex-col items-center justify-center border-dashed border-2 border-gray-200 bg-gray-50/50 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <MessageSquare size={40} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A1D20] mb-4 tracking-tighter">Histórico Vazio</h3>
                                    <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                                        Seu diário de orientações está limpo por enquanto. Continue com o excelente trabalho!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {feedbacks.map((f, i) => (
                                        <motion.div
                                            key={f.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.1)] hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col gap-6"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex justify-between items-start relative z-10 border-b border-gray-50 pb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-[1.5rem] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors transform group-hover:rotate-6">
                                                        <MessageSquare size={20} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="font-black text-[#1A1D20] text-xl tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase">One-on-One</h3>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.3em] flex items-center gap-1.5 border ${f.acknowledged ? 'bg-[#F8FAFC] text-gray-400 border-gray-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                                    }`}>
                                                    {f.acknowledged ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                                    {f.acknowledged ? 'Ciência Dada' : 'Pendente'}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                <div className="bg-[#F8FAFC] rounded-[1.8rem] p-6 border border-gray-50 flex flex-col group/item hover:bg-white transition-colors hover:border-emerald-100 hover:shadow-lg">
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <ChevronRight size={12} /> Pontos Positivos
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-500 leading-relaxed text-[#1A1D20]">{f.positives}</p>
                                                </div>
                                                <div className="bg-[#F8FAFC] rounded-[1.8rem] p-6 border border-gray-50 flex flex-col group/item hover:bg-white transition-colors hover:border-amber-100 hover:shadow-lg">
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <ChevronRight size={12} /> Pontos de Atenção
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-500 leading-relaxed text-[#1A1D20]">{f.attention_points}</p>
                                                </div>
                                                <div className="bg-[#F8FAFC] rounded-[1.8rem] p-6 border border-gray-50 flex flex-col md:col-span-2 group/item hover:bg-white transition-colors hover:border-indigo-100 hover:shadow-lg">
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                        <TrendingUp size={12} /> Plano de Ação Sugerido
                                                    </span>
                                                    <p className="text-sm font-bold text-gray-500 leading-relaxed text-[#1A1D20]">{f.action}</p>
                                                </div>
                                            </div>

                                            {!f.acknowledged && (
                                                <div className="pt-4 border-t border-gray-50 relative z-10 flex justify-end">
                                                    <button
                                                        onClick={async () => { await ackFb(f.id); toast.success('Ciência confirmada! Este feedback foi movido para o histórico.') }}
                                                        className="px-8 py-4 rounded-[2rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                                    >
                                                        Confirmar Ciência <Check size={16} className="group-hover/btn:scale-110 transition-transform" />
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
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {pdiLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 inner-card">
                                    <div className="w-16 h-16 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin shadow-xl"></div>
                                    <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando PDIs...</p>
                                </div>
                            ) : pdis.length === 0 ? (
                                <div className="py-32 rounded-[4rem] text-center inner-card flex flex-col items-center justify-center border-dashed border-2 border-gray-200 bg-gray-50/50 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                                        <Target size={40} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A1D20] mb-4 tracking-tighter">Nenhum PDI Ativo</h3>
                                    <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                                        Você não possui nenhum Plano de Desenvolvimento Individual registrado neste momento.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {pdis.map((p, i) => {
                                        const Icon = statusIcon[p.status as keyof typeof statusIcon] || AlertCircle
                                        const color = statusColor[p.status as keyof typeof statusColor] || ''
                                        return (
                                            <motion.div
                                                key={p.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:border-amber-100 hover:shadow-[0_20px_40px_-15px_rgba(251,191,36,0.1)] transition-all group relative overflow-hidden flex flex-col gap-6"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-gray-50 pb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-[1.5rem] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#1A1D20] group-hover:text-white transition-colors transform group-hover:rotate-6">
                                                            <Target size={20} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <h3 className="font-black text-[#1A1D20] text-xl tracking-tighter leading-tight group-hover:text-amber-600 transition-colors uppercase">Acordo de PDI</h3>
                                                            {p.due_date && <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Deadline: {new Date(p.due_date).toLocaleDateString('pt-BR')}</span>}
                                                        </div>
                                                    </div>
                                                    <div className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.3em] flex items-center justify-center gap-1.5 border overflow-hidden ${color}`}>
                                                        <Icon size={12} />
                                                        {statusLabel[p.status as keyof typeof statusLabel]}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                                    <div className="bg-[#F8FAFC] rounded-[1.8rem] p-6 border border-gray-50 flex flex-col group/item hover:bg-white transition-colors hover:border-[#1A1D20] hover:shadow-lg">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                            <Target size={12} /> Objetivo Estratégico
                                                        </span>
                                                        <p className="text-sm font-black text-[#1A1D20] leading-relaxed">{p.objective}</p>
                                                    </div>
                                                    <div className="bg-[#F8FAFC] rounded-[1.8rem] p-6 border border-gray-50 flex flex-col group/item hover:bg-white transition-colors hover:border-amber-100 hover:shadow-lg">
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                            <TrendingUp size={12} /> Ação Mandatória
                                                        </span>
                                                        <p className="text-sm font-bold text-gray-500 leading-relaxed text-[#1A1D20]">{p.action}</p>
                                                    </div>
                                                </div>

                                                {!p.acknowledged && (
                                                    <div className="pt-4 border-t border-gray-50 relative z-10 flex justify-end">
                                                        <button
                                                            onClick={async () => { await ackPdi(p.id); toast.success('Termo aceito! O PDI está arquivado em seu histórico.') }}
                                                            className="px-8 py-4 rounded-[2rem] bg-indigo-600 text-white font-black flex items-center justify-center gap-3 hover:bg-indigo-700 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                                        >
                                                            Aceitar Termos <Check size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
