import { useTrainings, useTeamTrainings } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { GraduationCap, Play, CheckCircle, Clock, Users, Target, BookOpen, ChevronRight, Sparkles } from 'lucide-react'

const typeColors: Record<string, string> = {
    prospeccao: 'bg-violet-50 text-violet-700 border-violet-100',
    fechamento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    atendimento: 'bg-blue-50 text-blue-700 border-blue-100',
    gestao: 'bg-amber-50 text-amber-700 border-amber-100',
    'pre-vendas': 'bg-pink-50 text-pink-700 border-pink-100',
}

export default function GerenteTreinamentos() {
    const [tab, setTab] = useState<'meus' | 'equipe'>('equipe')

    // Meus Treinamentos
    const { trainings, loading: tLoading, markWatched } = useTrainings()
    const watched = trainings.filter(t => t.watched).length
    const progress = trainings.length > 0 ? (watched / trainings.length) * 100 : 0

    // Progresso da Equipe
    const { teamProgress, loading: tpLoading } = useTeamTrainings()

    const isLoading = tab === 'meus' ? tLoading : tpLoading

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-violet-600 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Treinamentos <br className="lg:hidden" />e Capacitação
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Gestão de Conhecimento</p>
                    </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-4 shrink-0 sm:items-end lg:w-auto">
                    <div className="relative flex w-full shrink-0 flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-[#F8FAFC] p-1.5 shadow-sm sm:flex-row sm:rounded-full">
                        <div
                            className={`absolute left-1.5 right-1.5 h-[calc(50%-6px)] rounded-[1.35rem] border border-gray-50 bg-white shadow-sm transition-transform duration-300 sm:inset-y-1.5 sm:left-auto sm:right-auto sm:h-auto sm:w-[calc(50%-6px)] sm:rounded-full ${tab === 'equipe'
                                ? 'translate-y-[6px] sm:translate-x-[6px] sm:translate-y-0'
                                : 'translate-y-[calc(100%+6px)] sm:translate-x-[calc(100%+6px)] sm:translate-y-0'
                                }`}
                        />
                        <button
                            onClick={() => setTab('equipe')}
                            className={`relative z-10 flex-1 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${tab === 'equipe' ? 'text-violet-600' : 'text-gray-400 hover:text-[#1A1D20]'}`}
                        >
                            <Users size={14} /> Progresso Equipe
                        </button>
                        <button
                            onClick={() => setTab('meus')}
                            className={`relative z-10 flex-1 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-colors flex items-center justify-center gap-2 ${tab === 'meus' ? 'text-violet-600' : 'text-gray-400 hover:text-[#1A1D20]'}`}
                        >
                            <GraduationCap size={14} /> Meus Treinamentos
                        </button>
                    </div>

                    {tab === 'meus' && (
                        <div className="flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-sm sm:w-auto sm:flex-row sm:items-center">
                            <span className="text-sm font-black tracking-tight">{watched} / {trainings.length} Módulos</span>
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden ml-2 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-violet-600 rounded-full"
                                />
                            </div>
                            <span className="text-[10px] font-black text-violet-600 ml-2">{Math.round(progress)}%</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tab */}
            <div className="flex-1 w-full max-w-7xl mx-auto shrink-0 pb-10">
                <AnimatePresence mode="wait">
                    {tab === 'meus' ? (
                        <motion.div
                            key="meus"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 xl:grid-cols-3"
                        >
                            {trainings.map((t, i) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="inner-card p-8 flex flex-col justify-between hover:shadow-2xl hover:border-violet-100 transition-all border border-gray-100 bg-white relative overflow-hidden group h-full"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[80px] -mr-16 -mt-16 opacity-40 group-hover:bg-violet-50 transition-colors pointer-events-none" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${t.watched ? 'bg-emerald-50 border-emerald-100' : 'bg-[#F8FAFC] border-gray-100 group-hover:scale-110 group-hover:bg-white group-hover:rotate-3'}`}>
                                                {t.watched ? <CheckCircle size={24} className="text-emerald-500" /> : <Play size={24} className="text-[#1A1D20] ml-1" />}
                                            </div>
                                            <span className={`text-[9px] uppercase font-black tracking-widest px-4 py-2 rounded-full border shadow-sm ${typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {t.type}
                                            </span>
                                        </div>

                                        <div className="flex-1 mb-8">
                                            <h3 className="text-xl font-black text-[#1A1D20] mb-3 leading-tight tracking-tight group-hover:text-violet-600 transition-colors line-clamp-2">{t.title}</h3>
                                            {t.description && (
                                                <p className="text-gray-500 text-[13px] font-bold line-clamp-3 leading-relaxed opacity-80 mb-4">{t.description}</p>
                                            )}
                                        </div>

                                        <div className="pt-6 border-t border-gray-50 flex gap-4 mt-auto">
                                            <a href={t.video_url} target="_blank" rel="noopener noreferrer"
                                                className="flex-1 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-[#1A1D20] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:shadow-xl transition-all active:scale-95">
                                                <Play size={16} /> Assistir
                                            </a>
                                            {!t.watched && (
                                                <button
                                                    onClick={() => markWatched(t.id)}
                                                    className="w-14 rounded-2xl bg-[#1A1D20] text-white flex items-center justify-center hover:bg-violet-600 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-105 active:scale-95"
                                                    title="Marcar como concluído"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {trainings.length === 0 && (
                                <div className="col-span-full py-20 text-center rounded-[3rem] border-2 border-dashed border-gray-100 bg-gray-50/50">
                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Nenhum treinamento disponível</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="equipe"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Stats */}
                            <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 md:grid-cols-4">
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time Total</span>
                                    <span className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none">{teamProgress.length}</span>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-2 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="relative z-10 text-[10px] font-black uppercase tracking-widest text-gray-400">100% Concluído</span>
                                    <span className="relative z-10 text-3xl font-black text-[#1A1D20] tracking-tighter leading-none">{teamProgress.filter(p => p.percentage === 100).length}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {teamProgress.map((p, i) => (
                                    <motion.div
                                        key={p.seller_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.1)] hover:border-violet-100 transition-all group relative overflow-hidden flex flex-col gap-4"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-black text-[#1A1D20] group-hover:text-violet-600 transition-colors uppercase tracking-tight">{p.seller_name}</h3>
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${p.percentage === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : p.percentage > 0 ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                {p.percentage === 100 ? <CheckCircle size={18} /> : p.percentage > 0 ? <Clock size={18} /> : <BookOpen size={18} />}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Progresso</span>
                                                <span className={`text-[11px] font-black ${p.percentage === 100 ? 'text-emerald-500' : 'text-violet-600'}`}>{Math.round(p.percentage)}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden border border-gray-50 shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.percentage}%` }}
                                                    className={`h-full rounded-full ${p.percentage === 100 ? 'bg-emerald-500' : 'bg-violet-600'}`}
                                                />
                                            </div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-[#1A1D20] opacity-80 mt-2 text-center">
                                                {p.watched.length} DE {p.total_trainings} MÓDULOS
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                {teamProgress.length === 0 && (
                                    <div className="col-span-full py-20 text-center rounded-[3rem] border-2 border-dashed border-gray-100 bg-gray-50/50">
                                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Nenhuma atividade registrada na equipe</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
