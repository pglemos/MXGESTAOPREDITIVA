import { useTrainings } from '@/hooks/useData'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { GraduationCap, Play, CheckCircle, ExternalLink } from 'lucide-react'

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando treinamentos...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">Treinamentos</h1>
                    <span className="bg-white border border-gray-100 text-xs font-bold px-3 py-1 rounded-full text-gray-500">{watched}/{trainings.length} assistidos</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="bg-gray-100/80 rounded-full h-2.5 overflow-hidden shadow-inner border border-gray-200/50 shrink-0">
                <div className="bg-[#1A1D20] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${trainings.length > 0 ? (watched / trainings.length) * 100 : 0}%` }} />
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 shrink-0 pb-10">
                {trainings.map((t, i) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 flex flex-col justify-between group h-full relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gray-50 rounded-full blur-2xl group-hover:bg-blue-50/50 transition-colors" />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${t.watched ? 'bg-emerald-50 border-emerald-100' : 'bg-[#F8FAFC] border-gray-100 group-hover:bg-white group-hover:shadow-sm'}`}>
                                {t.watched ? <CheckCircle size={20} className="text-emerald-500" /> : <Play size={20} className="text-gray-400 ml-0.5" />}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border ${typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                {t.type}
                            </span>
                        </div>

                        <div className="relative z-10 flex-1 mb-4">
                            <h3 className="text-lg font-extrabold text-[#1A1D20] mb-1 leading-tight line-clamp-2">{t.title}</h3>
                            {t.description && <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed">{t.description}</p>}
                        </div>

                        <div className="mt-2 pt-4 border-t border-gray-100 relative z-10 flex gap-3">
                            <a href={t.video_url} target="_blank" rel="noopener noreferrer"
                                className="flex-1 py-3 rounded-xl bg-[#F8FAFC] border border-gray-200 text-[#1A1D20] text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                <ExternalLink size={16} /> Assistir
                            </a>
                            {!t.watched && (
                                <button onClick={async () => { await markWatched(t.id); toast.success('Marcado como assistido!') }}
                                    className="flex-1 py-3 rounded-xl bg-[#1A1D20] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95">
                                    <CheckCircle size={16} /> Assistido
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}

                {trainings.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center inner-card flex flex-col items-center justify-center border-dashed">
                        <GraduationCap size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-[#1A1D20] mb-2">Nenhum treinamento disponível</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Os treinamentos aparecerão aqui quando forem cadastrados pelo consultor.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
