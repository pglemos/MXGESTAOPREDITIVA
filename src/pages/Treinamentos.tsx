import { useCourses } from '@/hooks/useData'
import { useState, useMemo, useCallback } from 'react'
import { GraduationCap, Search, RefreshCw, Clock, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function Treinamentos() {
    const { courses, loading, refetch } = useCourses()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Academy atualizada!')
    }, [refetch])

    const filteredCourses = useMemo(() => {
        return courses.filter(c => 
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [courses, searchTerm])

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">
            {/* Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase">
                            MX <span className="text-indigo-600">Academy</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg animate-pulse" aria-hidden="true" />
                        <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">Evolução Técnica & Comportamental</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" aria-hidden="true" />
                        <label htmlFor="search-academy" className="sr-only">Pesquisar na Academy</label>
                        <input
                            id="search-academy"
                            name="search-academy"
                            type="text"
                            placeholder="Buscar treinamentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-indigo-200 shadow-sm transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleRefresh}
                        aria-label="Atualizar lista de treinamentos"
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Courses Feed */}
            <div className="flex-1 min-h-0 pb-32">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="status" aria-label="Carregando treinamentos">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 animate-pulse mb-8" />
                                <div className="h-8 w-2/3 bg-gray-50 animate-pulse mb-4 rounded-lg" />
                                <div className="h-4 w-1/2 bg-gray-50 animate-pulse rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-live="polite">
                        <AnimatePresence mode="popLayout">
                            {filteredCourses.map((course, i) => (
                                <motion.li
                                    key={course.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner group-hover:bg-pure-black transition-all group-hover:rotate-3" aria-hidden="true">
                                            <GraduationCap size={28} className="text-indigo-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] tracking-widest uppercase py-1 px-3">
                                                {course.category}
                                            </Badge>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {course.instructor}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 relative z-10">
                                        <h2 className="text-2xl font-black text-slate-950 leading-tight uppercase tracking-tight line-clamp-2">{course.title}</h2>
                                        <p className="text-sm font-bold text-gray-600 line-clamp-3 leading-relaxed uppercase tracking-tight opacity-80">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col gap-6 relative z-10">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Progresso do Aluno</span>
                                                <span className="text-sm font-black text-indigo-600 font-mono-numbers">0%</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-100" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100} aria-label={`Progresso no curso ${course.title}`}>
                                                <div className="h-full bg-indigo-600 transition-all duration-1000 w-0 shadow-[0_0_10px_rgba(79,70,229,0.4)]" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                <Clock size={14} className="text-indigo-600" aria-hidden="true" />
                                                {course.duration}
                                            </div>
                                            <a
                                                href={course.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none"
                                                aria-label={`Iniciar treinamento: ${course.title}`}
                                            >
                                                Iniciar Aula <ArrowRight size={14} aria-hidden="true" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-slate-50/50 border-2 border-dashed border-gray-200 rounded-[3rem] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" aria-hidden="true" />
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                            <GraduationCap size={48} className="text-gray-300" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-950 mb-4 tracking-tighter uppercase leading-none">Vácuo de Conteúdo</h2>
                        <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto mb-8 uppercase tracking-wide">
                            Nenhum treinamento localizado na Academy para "{searchTerm}".
                        </p>
                        <button onClick={() => setSearchTerm('')} className="px-10 py-4 bg-slate-950 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20">
                            Limpar Filtros
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}
