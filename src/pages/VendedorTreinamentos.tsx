import { useTrainings } from '@/hooks/useData'
import { useCheckins } from '@/hooks/useCheckins'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { GraduationCap, Play, CheckCircle, ExternalLink, Clock, Users, Target, BookOpen, ChevronRight, Sparkles, RefreshCw, Search, X } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { startOfWeek } from 'date-fns'

const typeColors: Record<string, string> = {
    prospeccao: 'bg-violet-50 text-violet-700 border-violet-100',
    fechamento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    atendimento: 'bg-blue-50 text-blue-700 border-blue-100',
    gestao: 'bg-amber-50 text-amber-700 border-amber-100',
    'pre-vendas': 'bg-pink-50 text-pink-700 border-pink-100',
}

export default function VendedorTreinamentos() {
    const { trainings, loading, markWatched, refetch } = useTrainings()
    const { checkins } = useCheckins()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    // 🚀 Lógica de Prescrição Real MX
    const gapAnalysis = useMemo(() => {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        const recentCheckins = checkins.filter(c => new Date(c.reference_date) >= weekStart)
        if (recentCheckins.length === 0) return null

        const funil = calcularFunil(recentCheckins)
        const diag = gerarDiagnosticoMX(funil)

        if (!diag.gargalo) return null

        // Mapear gargalo para categoria de vídeo
        const categoryMap: Record<string, string> = {
            'LEAD_AGD': 'prospeccao',
            'AGD_VISITA': 'atendimento',
            'VISITA_VND': 'fechamento'
        }

        const category = categoryMap[diag.gargalo]
        const recommended = trainings.find(t => t.type === category && !t.watched) || trainings.find(t => t.type === category)

        return { 
            gargalo: diag.gargalo, 
            label: diag.diagnostico, 
            recommended 
        }
    }, [checkins, trainings])

    const watched = useMemo(() => trainings.filter(t => t.watched).length, [trainings])
    const progress = useMemo(() => trainings.length > 0 ? (watched / trainings.length) * 100 : 0, [watched, trainings.length])

    // 4. Search integration
    const filteredTrainings = useMemo(() => {
        return trainings.filter(t => 
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            t.type.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [trainings, searchTerm])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetch?.()
        setIsRefetching(false)
        toast.success('Plano de treinamento atualizado!')
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Preparando sua evolução...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-violet-600 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Minha <span className="text-violet-600">Evolução</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Academia de Vendas MX</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="flex items-center gap-4 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status Global</span>
                            <span className="text-sm font-black text-violet-700 font-mono-numbers">{watched} / {trainings.length} Módulos</span>
                        </div>
                        <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-violet-600" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="relative group w-full lg:w-[480px] shrink-0">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={18} />
                <input
                    placeholder="O que você deseja aprender hoje?"
                    className="w-full pl-14 pr-12 h-14 bg-white border border-gray-100 rounded-full font-bold text-sm shadow-sm focus:outline-none focus:border-violet-200 focus:shadow-lg transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"><X size={18} /></button>}
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto shrink-0 pb-32">
                
                {/* STORY-12.1 / 12.2: Prescrição Direta Baseada em Gargalo REAL */}
                {gapAnalysis?.recommended && !searchTerm && (
                    <div className="mb-mx-xl">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4 flex items-center gap-2">
                            <Target size={14} /> Prescrição Tática (Baseada em seu Funil)
                        </h3>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden group shadow-xl shadow-indigo-500/5">
                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-200/30 transition-colors" />
                            
                            <div className="w-20 h-20 rounded-2xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xl shrink-0 relative z-10 transform group-hover:rotate-3 transition-transform">
                                <Sparkles size={32} />
                            </div>
                            
                            <div className="flex-1 relative z-10">
                                <Badge className="bg-rose-600 text-white border-none text-[8px] px-3 h-6 uppercase font-black tracking-widest mb-3">Gap Detectado: {gapAnalysis.gargalo}</Badge>
                                <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tight mb-2">{gapAnalysis.recommended.title}</h4>
                                <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-2xl">{gapAnalysis.label} Este módulo foi selecionado pela Metodologia MX para corrigir sua performance imediata.</p>
                            </div>

                            <div className="shrink-0 w-full md:w-auto relative z-10">
                                <button 
                                    onClick={() => window.open(gapAnalysis.recommended?.video_url, '_blank')}
                                    className="w-full md:w-auto px-10 py-5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-lg"
                                >
                                    <Play size={16} strokeWidth={3} /> Iniciar Correção
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredTrainings.map((t, i) => (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover:rotate-3", 
                                        t.watched ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-pure-black border-gray-100 group-hover:bg-white shadow-inner"
                                    )}>
                                        {t.watched ? <CheckCircle size={24} strokeWidth={2.5} /> : <Play size={24} strokeWidth={2.5} className="ml-1" />}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {gapAnalysis?.recommended?.id === t.id && (
                                            <Badge className="bg-rose-600 text-white border-none text-[7px] px-2 h-5 uppercase font-black tracking-widest animate-pulse mb-1">Correção de Gargalo</Badge>
                                        )}
                                        <Badge className={cn("font-black text-[8px] uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm", typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100')}>
                                            {t.type}
                                        </Badge>
                                        {t.watched && (
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <CheckCircle size={10} strokeWidth={3} /> Concluído
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 mb-8 relative z-10">
                                    <h3 className="text-xl font-black text-pure-black mb-3 tracking-tight group-hover:text-violet-600 transition-colors line-clamp-2 leading-tight uppercase">{t.title}</h3>
                                    <p className="text-sm font-bold text-gray-400 line-clamp-3 leading-relaxed opacity-80">{t.description || 'Domine esta técnica para acelerar seus resultados operacionais.'}</p>
                                    
                                    <div className="flex flex-wrap gap-3 mt-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50/50 border border-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest">
                                            <Clock size={12} strokeWidth={2.5} /> 15 MIN
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-50/50 border border-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-widest">
                                            <Sparkles size={12} strokeWidth={2.5} /> +100 XP
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row gap-4 mt-auto relative z-10">
                                    {/* 1. & 3. Video validation and UI */}
                                    <button 
                                        onClick={() => {
                                            if (!t.video_url) { toast.error('Material indisponível'); return }
                                            window.open(t.video_url, '_blank')
                                        }}
                                        className="flex-1 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-pure-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:shadow-lg transition-all active:scale-95 shadow-sm group/btn"
                                    >
                                        <Play size={16} strokeWidth={3} className="group-hover/btn:scale-110" /> Assistir Aula
                                    </button>
                                    {!t.watched ? (
                                        <button
                                            onClick={async () => { await markWatched(t.id); toast.success('Evolução Registrada! +100 XP ✨') }}
                                            className="flex-1 py-4 rounded-2xl bg-pure-black text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-secondary-hover hover:shadow-2xl transition-all active:scale-95 shadow-lg shadow-gray-200"
                                        >
                                            <CheckCircle size={16} strokeWidth={3} /> Concluir
                                        </button>
                                    ) : (
                                        <div className="flex-1 py-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckCircle size={16} strokeWidth={3} /> Validado
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>

                {filteredTrainings.length === 0 && !loading && (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[3rem] border-dashed border-2 border-gray-200 group">
                        <div className="w-24 h-24 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform duration-500">
                            <BookOpen size={40} className="text-gray-200" />
                        </div>
                        <h4 className="text-2xl font-black text-pure-black tracking-tighter mb-3">Academia em Recesso</h4>
                        <p className="text-gray-400 text-sm font-bold max-w-xs mx-auto opacity-80 mb-8">Novos módulos estratégicos estão sendo preparados pelo seu mentor.</p>
                        <button onClick={() => setSearchTerm('')} className="px-10 py-4 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all">
                            Ver Todos
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
