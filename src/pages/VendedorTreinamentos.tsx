import { useTrainings } from '@/hooks/useData'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { GraduationCap, Play, CheckCircle, ExternalLink, Clock, Users, Target, BookOpen, ChevronRight, Sparkles } from 'lucide-react'

const typeColors: Record<string, string> = {
    prospeccao: 'bg-violet-50 text-violet-700 border-violet-100',
    fechamento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    atendimento: 'bg-blue-50 text-blue-700 border-blue-100',
    gestao: 'bg-amber-50 text-amber-700 border-amber-100',
    'pre-vendas': 'bg-pink-50 text-pink-700 border-pink-100',
}

export default function VendedorTreinamentos() {
    const { trainings, loading, markWatched } = useTrainings()
    const watched = trainings.filter(t => t.watched).length
    const progress = trainings.length > 0 ? (watched / trainings.length) * 100 : 0

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando treinamentos...</p>
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
                            Minha Evolução
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Prepare-se para o Próximo Nível</p>
                    </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-2 shrink-0 sm:items-end lg:w-auto">
                    <div className="flex w-full flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-3 shadow-sm sm:w-auto sm:flex-row sm:items-center">
                        <GraduationCap size={18} className="text-violet-600" />
                        <span className="text-sm font-black tracking-tight">{watched} / {trainings.length} Módulos</span>
                        <div className="h-2 w-full rounded-full bg-gray-100 shadow-inner sm:ml-2 sm:w-32">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-violet-600 rounded-full"
                            />
                        </div>
                        <span className="text-[10px] font-black text-violet-600 sm:ml-2">{Math.round(progress)}%</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 pb-10 shrink-0 sm:grid-cols-2 md:gap-8 xl:grid-cols-3">
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
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[#1A1D20] text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <Clock size={12} /> 15 min
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[#1A1D20] text-[10px] font-black uppercase tracking-widest opacity-60">
                                        <Sparkles size={12} /> +100 XP
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 border-t border-gray-50 pt-6 sm:flex-row">
                                <a href={t.video_url} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-[#1A1D20] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:shadow-xl transition-all active:scale-95">
                                    <Play size={16} /> Assistir Aula
                                </a>
                                {!t.watched && (
                                    <button onClick={async () => { await markWatched(t.id); toast.success('Conhecimento adquirido! +100 XP') }}
                                        className="flex-1 py-4 rounded-2xl bg-[#1A1D20] text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:shadow-2xl transition-all active:scale-95 shadow-lg shadow-gray-200">
                                        <CheckCircle size={16} /> Concluir
                                    </button>
                                )}
                                {t.watched && (
                                    <div className="flex items-center justify-center px-4 py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex-1 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle size={16} className="mr-2" /> Finalizado
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {trainings.length === 0 && !loading && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center inner-card border-dashed bg-gray-50/50">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-inner ring-8 ring-gray-100/50">
                            <BookOpen size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 tracking-tight">Novos Módulos em Breve</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Seu mentor está preparando novos conteúdos estratégicos</p>
                    </div>
                )}
            </div>
        </div>
    )
}
