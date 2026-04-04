import { useTrainings, useTeamTrainings } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { GraduationCap, Play, CheckCircle, Clock, Users, Target, BookOpen, ChevronRight, Sparkles, RefreshCw, Search, X, Filter } from 'lucide-react'
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner'

const typeColors: Record<string, string> = {
    prospeccao: 'bg-violet-50 text-violet-700 border-violet-100',
    fechamento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    atendimento: 'bg-blue-50 text-blue-700 border-blue-100',
    gestao: 'bg-amber-50 text-amber-700 border-amber-100',
    'pre-vendas': 'bg-pink-50 text-pink-700 border-pink-100',
}

export default function GerenteTreinamentos() {
    const [tab, setTab] = useState<'meus' | 'equipe'>('equipe')
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    // Meus Treinamentos
    const { trainings, loading: tLoading, markWatched, refetch: refetchMe } = useTrainings()
    const watched = useMemo(() => trainings.filter(t => t.watched).length, [trainings])
    const progress = useMemo(() => trainings.length > 0 ? (watched / trainings.length) * 100 : 0, [watched, trainings.length])

    // Progresso da Equipe
    const { teamProgress, loading: tpLoading, refetch: refetchTeam } = useTeamTrainings()

    const isLoading = tab === 'meus' ? tLoading : tpLoading

    // 4. Search Filter
    const filteredMe = useMemo(() => {
        return trainings.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [trainings, searchTerm])

    const filteredTeam = useMemo(() => {
        return teamProgress.filter(p => p.seller_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [teamProgress, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        if (tab === 'meus') await refetchMe()
        else await refetchTeam()
        setIsRefetching(false)
        toast.success('Base de conhecimento atualizada!')
    }, [tab, refetchMe, refetchTeam])

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Módulos...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-violet-600 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Evolução de <span className="text-violet-600">Tropa</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Gestão de Conhecimento Estratégico</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="bg-gray-100/50 p-1 rounded-2xl flex border border-gray-100 shadow-inner">
                        <button 
                            onClick={() => setTab('equipe')} 
                            className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", tab === 'equipe' ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <Users size={14} /> Equipe
                        </button>
                        <button 
                            onClick={() => setTab('meus')} 
                            className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all", tab === 'meus' ? "bg-white text-violet-600 shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <Target size={14} /> Meu Plano
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

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between shrink-0">
                <div className="relative group w-full lg:w-[480px]">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={18} />
                    <input
                        placeholder={tab === 'equipe' ? "Buscar especialista..." : "Buscar aula ou tema..."}
                        className="w-full pl-14 pr-12 h-14 bg-white border border-gray-100 rounded-full font-bold text-sm shadow-sm focus:outline-none focus:border-violet-200 focus:shadow-lg transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"><X size={18} /></button>}
                </div>
                
                {tab === 'meus' && (
                    <div className="flex items-center gap-4 bg-violet-50 border border-violet-100 px-6 py-3 rounded-2xl shadow-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest leading-none mb-1">Seu Progresso</span>
                            <span className="text-sm font-black text-violet-700 font-mono-numbers">{watched} / {trainings.length}</span>
                        </div>
                        <div className="w-24 h-2 bg-white/50 rounded-full overflow-hidden border border-violet-200/50 shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-violet-600" />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto shrink-0 pb-32">
                <AnimatePresence mode="wait">
                    {tab === 'meus' ? (
                        <motion.div
                            key="meus"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3"
                        >
                            {filteredMe.map((t, i) => (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover:rotate-3", 
                                            t.watched ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-pure-black border-gray-100 group-hover:bg-white"
                                        )}>
                                            {t.watched ? <CheckCircle size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} className="ml-1" />}
                                        </div>
                                        <Badge className={cn("font-black text-[8px] uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm", typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100')}>
                                            {t.type}
                                        </Badge>
                                    </div>

                                    <div className="flex-1 mb-8 relative z-10">
                                        <h3 className="text-xl font-black text-pure-black mb-3 tracking-tight group-hover:text-violet-600 transition-colors line-clamp-2 leading-tight">{t.title}</h3>
                                        <p className="text-sm font-bold text-gray-400 line-clamp-3 leading-relaxed opacity-80">{t.description || 'Sem ementa detalhada para este módulo.'}</p>
                                    </div>

                                    <div className="pt-8 border-t border-gray-50 flex gap-4 mt-auto relative z-10">
                                        {/* 1. & 3. Validation and UI fix for videos */}
                                        <button 
                                            onClick={() => {
                                                if (!t.video_url) { toast.error('Link indisponível'); return }
                                                window.open(t.video_url, '_blank')
                                            }}
                                            className="flex-1 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-pure-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:shadow-lg transition-all active:scale-95 shadow-sm group/btn"
                                        >
                                            <Play size={16} strokeWidth={3} className="group-hover/btn:scale-110" /> Assistir
                                        </button>
                                        {!t.watched && (
                                            <button
                                                onClick={() => { markWatched(t.id); toast.success('Módulo Validado! +100 XP') }}
                                                className="w-14 rounded-2xl bg-pure-black text-white flex items-center justify-center hover:bg-violet-600 hover:shadow-elevation transition-all active:scale-90"
                                                title="Concluir Etapa"
                                            >
                                                <CheckCircle size={20} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="equipe"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredTeam.map((p, i) => (
                                    <motion.div
                                        key={p.seller_id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation hover:border-violet-100 transition-all group relative overflow-hidden flex flex-col gap-8"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-sm shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all">
                                                    {p.seller_name.charAt(0)}
                                                </div>
                                                <h3 className="text-base font-black text-pure-black truncate uppercase tracking-tight">{p.seller_name}</h3>
                                            </div>
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", 
                                                p.percentage === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 
                                                p.percentage > 0 ? 'bg-blue-50 border-blue-100 text-blue-500' : 
                                                'bg-gray-50 border-gray-100 text-gray-300'
                                            )}>
                                                {p.percentage === 100 ? <CheckCircle size={18} strokeWidth={2.5} /> : p.percentage > 0 ? <Clock size={18} strokeWidth={2.5} /> : <BookOpen size={18} strokeWidth={2.5} />}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none">Absorção</span>
                                                <span className={cn("text-sm font-black font-mono-numbers", p.percentage === 100 ? 'text-emerald-500' : 'text-violet-600')}>{Math.round(p.percentage)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner p-0.5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${p.percentage}%` }}
                                                    transition={{ duration: 1.5, ease: "circOut" }}
                                                    className={cn("h-full rounded-full shadow-sm", p.percentage === 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                                                />
                                            </div>
                                            
                                            {/* Diagnóstico de Gargalo Real no Painel do Gerente */}
                                            {p.current_gap && (
                                                <div className={cn("mt-4 p-4 rounded-2xl border flex flex-col gap-2", 
                                                    p.gap_training_completed ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100 animate-pulse shadow-lg shadow-rose-100"
                                                )}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Gargalo Atual</span>
                                                        <Badge className={cn("text-[7px] border-none font-black uppercase", p.gap_training_completed ? "bg-emerald-500" : "bg-rose-600")}>
                                                            {p.current_gap}
                                                        </Badge>
                                                    </div>
                                                    <p className={cn("text-[10px] font-bold uppercase tracking-tight", p.gap_training_completed ? "text-emerald-700" : "text-rose-700")}>
                                                        {p.gap_training_completed ? "✅ Correção Concluída" : "⚠️ Correção Pendente"}
                                                    </p>
                                                </div>
                                            )}

                                            <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 text-center bg-gray-50 py-2 rounded-lg border border-gray-100">
                                                {p.watched.length} de {p.total_trainings} Concluídos
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
