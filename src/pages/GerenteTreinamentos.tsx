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
    const { trainings, loading: tLoading, error: tError, markWatched, refetch: refetchMe } = useTrainings()
    const watched = useMemo(() => trainings?.filter(t => t.watched).length || 0, [trainings])
    const progress = useMemo(() => (trainings?.length || 0) > 0 ? (watched / trainings.length) * 100 : 0, [watched, trainings])

    // Progresso da Equipe
    const { teamProgress, loading: tpLoading, error: tpError, refetch: refetchTeam } = useTeamTrainings()

    const isLoading = tab === 'meus' ? tLoading : tpLoading
    const hasError = tab === 'meus' ? tError : tpError

    // 4. Search Filter
    const filteredMe = useMemo(() => {
        if (!trainings) return []
        return trainings.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [trainings, searchTerm])

    const filteredTeam = useMemo(() => {
        if (!teamProgress) return []
        return teamProgress.filter(p => p.seller_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [teamProgress, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        if (tab === 'meus') await refetchMe?.()
        else await refetchTeam?.()
        setIsRefetching(false)
        toast.success('Base de conhecimento atualizada!')
    }, [tab, refetchMe, refetchTeam])

    if (hasError) return (
        <div role="alert" className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl p-8 text-center">
            <X size={48} className="text-red-500 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Erro de Conexão</h2>
            <p className="text-slate-600">Não foi possível carregar os dados. Por favor, tente novamente.</p>
        </div>
    )

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl" aria-busy="true" aria-live="polite">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin shadow-xl" aria-hidden="true"></div>
            <p className="mt-6 text-gray-500 text-xs font-black tracking-[0.2em] uppercase">Sincronizando Módulos...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-violet-600 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)]" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Evolução de <span className="text-violet-600">Tropa</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" aria-hidden="true" />
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] opacity-80">Gestão de Conhecimento Estratégico</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="bg-gray-100/50 p-1 rounded-2xl flex border border-gray-100 shadow-inner" role="tablist" aria-label="Selecione a visualização">
                        <button 
                            role="tab"
                            aria-selected={tab === 'equipe'}
                            onClick={() => setTab('equipe')} 
                            className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-violet-600 focus:outline-none", tab === 'equipe' ? "bg-white text-violet-600 shadow-sm" : "text-gray-500 hover:text-pure-black")}
                        >
                            <Users size={16} aria-hidden="true" /> Equipe
                        </button>
                        <button 
                            role="tab"
                            aria-selected={tab === 'meus'}
                            onClick={() => setTab('meus')} 
                            className={cn("px-6 py-3 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-violet-600 focus:outline-none", tab === 'meus' ? "bg-white text-violet-600 shadow-sm" : "text-gray-500 hover:text-pure-black")}
                        >
                            <Target size={16} aria-hidden="true" /> Meu Plano
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-pure-black active:scale-90 transition-all focus-visible:ring-2 focus-visible:ring-violet-600 focus:outline-none"
                        aria-label="Atualizar módulos"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between shrink-0">
                <div className="relative group w-full lg:w-[480px]">
                    <label htmlFor="search-input" className="sr-only">Buscar treinamentos</label>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={18} aria-hidden="true" />
                    <input
                        id="search-input"
                        placeholder={tab === 'equipe' ? "Buscar especialista..." : "Buscar aula ou tema..."}
                        className="w-full pl-14 pr-12 h-14 bg-white border border-gray-100 rounded-full font-bold text-sm shadow-sm focus:outline-none focus:border-violet-200 focus:shadow-lg focus-visible:ring-2 focus-visible:ring-violet-600 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
                            aria-label="Limpar busca"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>
                
                {tab === 'meus' && (
                    <div className="flex items-center gap-4 bg-violet-50 border border-violet-100 px-6 py-3 rounded-2xl shadow-sm" aria-label="Progresso do meu plano">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-violet-500 uppercase tracking-widest leading-none mb-1">Seu Progresso</span>
                            <span className="text-sm font-black text-violet-700 font-mono-numbers" aria-label={`${watched} de ${trainings?.length || 0} concluídos`}>{watched} / {trainings?.length || 0}</span>
                        </div>
                        <div className="w-24 h-2 bg-white/50 rounded-full overflow-hidden border border-violet-200/50 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${progress}%` }} 
                                className="h-full bg-violet-600" 
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>
                )}
            </div>

            <section className="flex-1 w-full max-w-7xl mx-auto shrink-0 pb-32">
                <AnimatePresence mode="wait">
                    {tab === 'meus' ? (
                        <motion.ul
                            key="meus"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3"
                            aria-label="Meus Treinamentos"
                        >
                            {filteredMe.map((t, i) => (
                                <motion.li
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full focus-within:ring-2 focus-within:ring-violet-600"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover:rotate-3", 
                                            t.watched ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-pure-black border-gray-100 group-hover:bg-white"
                                        )} aria-hidden="true">
                                            {t.watched ? <CheckCircle size={24} strokeWidth={2.5} aria-hidden="true" /> : <Play size={24} strokeWidth={2.5} className="ml-1" aria-hidden="true" />}
                                        </div>
                                        <Badge className={cn("font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm", typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100')}>
                                            {t.type}
                                        </Badge>
                                    </div>

                                    <div className="flex-1 mb-8 relative z-10">
                                        <h3 className="text-xl font-black text-pure-black mb-3 tracking-tight group-hover:text-violet-600 transition-colors line-clamp-2 leading-tight" title={t.title}>{t.title}</h3>
                                        <p className="text-sm font-bold text-gray-500 line-clamp-3 leading-relaxed opacity-90" title={t.description || 'Sem ementa detalhada para este módulo.'}>{t.description || 'Sem ementa detalhada para este módulo.'}</p>
                                    </div>

                                    <div className="pt-8 border-t border-gray-50 flex gap-4 mt-auto relative z-10">
                                        <button 
                                            onClick={() => {
                                                if (!t.video_url) { toast.error('Link indisponível'); return }
                                                window.open(t.video_url, '_blank')
                                            }}
                                            className="flex-1 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-pure-black text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:shadow-lg transition-all active:scale-95 shadow-sm group/btn focus-visible:ring-2 focus-visible:ring-violet-600 focus:outline-none"
                                            aria-label={`Assistir aula: ${t.title}`}
                                        >
                                            <Play size={16} strokeWidth={2.5} className="group-hover/btn:scale-110" aria-hidden="true" /> Assistir
                                        </button>
                                        {!t.watched && (
                                            <button
                                                onClick={() => { markWatched?.(t.id); toast.success('Módulo Validado! +100 XP') }}
                                                className="w-14 rounded-2xl bg-pure-black text-white flex items-center justify-center hover:bg-violet-600 hover:shadow-elevation transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-violet-600 focus:outline-none"
                                                aria-label={`Marcar módulo ${t.title} como concluído`}
                                                title="Concluir Etapa"
                                            >
                                                <CheckCircle size={20} aria-hidden="true" />
                                            </button>
                                        )}
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    ) : (
                        <motion.ul
                            key="equipe"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            aria-label="Progresso da Equipe"
                        >
                            {filteredTeam.map((p, i) => (
                                <motion.li
                                    key={p.seller_id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation hover:border-violet-100 transition-all group relative overflow-hidden flex flex-col gap-8 focus-within:ring-2 focus-within:ring-violet-600"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-sm shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all" aria-hidden="true">
                                                {p.seller_name.charAt(0)}
                                            </div>
                                            <h3 className="text-base font-black text-pure-black truncate uppercase tracking-tight" title={p.seller_name}>{p.seller_name}</h3>
                                        </div>
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", 
                                            p.percentage === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 
                                            p.percentage > 0 ? 'bg-blue-50 border-blue-100 text-blue-500' : 
                                            'bg-gray-50 border-gray-100 text-gray-400'
                                        )} aria-hidden="true">
                                            {p.percentage === 100 ? <CheckCircle size={18} strokeWidth={2.5} aria-hidden="true" /> : p.percentage > 0 ? <Clock size={18} strokeWidth={2.5} aria-hidden="true" /> : <BookOpen size={18} strokeWidth={2.5} aria-hidden="true" />}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-[0.1em] text-gray-500 leading-none">Absorção</span>
                                            <span className={cn("text-sm font-black font-mono-numbers", p.percentage === 100 ? 'text-emerald-500' : 'text-violet-600')} aria-label={`Absorção: ${Math.round(p.percentage)}%`}>{Math.round(p.percentage)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner p-0.5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${p.percentage}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={cn("h-full rounded-full shadow-sm", p.percentage === 100 ? 'bg-emerald-500' : 'bg-violet-600')}
                                                role="progressbar"
                                                aria-valuenow={Math.round(p.percentage)}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                        
                                        {/* Diagnóstico de Gargalo Real no Painel do Gerente */}
                                        {p.current_gap && (
                                            <div className={cn("mt-4 p-4 rounded-2xl border flex flex-col gap-2", 
                                                p.gap_training_completed ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100 animate-pulse shadow-lg shadow-rose-100"
                                            )}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Gargalo Atual</span>
                                                    <Badge className={cn("text-[9px] sm:text-xs border-none font-black uppercase", p.gap_training_completed ? "bg-emerald-500 text-white" : "bg-rose-600 text-white")}>
                                                        {p.current_gap}
                                                    </Badge>
                                                </div>
                                                <p className={cn("text-xs font-bold uppercase tracking-tight", p.gap_training_completed ? "text-emerald-700" : "text-rose-700")}>
                                                    {p.gap_training_completed ? "✅ Correção Concluída" : "⚠️ Correção Pendente"}
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-xs uppercase font-black tracking-widest text-gray-500 text-center bg-gray-50 py-2 rounded-lg border border-gray-100" aria-label={`${p.watched.length} de ${p.total_trainings} Concluídos`}>
                                            {p.watched.length} de {p.total_trainings} Concluídos
                                        </p>
                                    </div>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </section>
        </main>
    )
}
