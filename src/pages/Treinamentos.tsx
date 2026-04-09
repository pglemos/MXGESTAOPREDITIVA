import { useCourses } from '@/hooks/useData'
import { useState, useMemo, useCallback } from 'react'
import { GraduationCap, Search, RefreshCw, Clock, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { toast } from 'sonner'

export default function Treinamentos() {
    const { courses, loading, refetch } = useCourses()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Academy atualizada!')
    }, [refetch])

    const filteredCourses = useMemo(() => {
        return courses.filter(c => 
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.category?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [courses, searchTerm])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Academy...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase text-slate-950">
                            MX <span className="text-brand-primary">Academy</span>
                        </h1>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Evolução Técnica & Comportamental</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                        <label htmlFor="search-academy" className="sr-only">Buscar treinamentos</label>
                        <input
                            id="search-academy"
                            type="text" placeholder="BUSCAR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-alt border border-border-default rounded-full h-12 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all shadow-inner"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {filteredCourses.length > 0 ? (
                    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredCourses.map((course, i) => (
                                <motion.li key={course.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                    <Card className="p-8 h-full flex flex-col group hover:shadow-mx-xl transition-all">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner group-hover:bg-brand-secondary group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                                <GraduationCap size={28} className="text-brand-primary group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant="brand">{course.category}</Badge>
                                                <Typography variant="caption" className="text-[8px]">{course.instructor}</Typography>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-1">
                                            <Typography variant="h3" className="line-clamp-2">{course.title}</Typography>
                                            <Typography variant="p" tone="muted" className="text-xs line-clamp-3 italic">"{course.description}"</Typography>
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-border-default space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-end">
                                                    <Typography variant="caption" className="text-[8px]">Progresso Aluno</Typography>
                                                    <Typography variant="mono" className="text-xs text-brand-primary">0%</Typography>
                                                </div>
                                                <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
                                                    <div className="h-full bg-brand-primary w-0" />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-brand-primary" aria-hidden="true" />
                                                    <Typography variant="mono" className="text-[10px]">{course.duration}</Typography>
                                                </div>
                                                <Button asChild size="sm" className="h-10 px-6 rounded-xl">
                                                    <a href={course.url} target="_blank" rel="noopener noreferrer">
                                                        INICIAR <ArrowRight size={14} className="ml-2" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-surface-alt/50 border-2 border-dashed border-border-default rounded-[3rem]">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-8 border border-border-default" aria-hidden="true">
                            <GraduationCap size={48} className="text-text-tertiary" />
                        </div>
                        <Typography variant="h2" className="mb-2">Academy em Expansão</Typography>
                        <Typography variant="p" tone="muted" className="max-w-xs uppercase">Nenhum treinamento localizado para "{searchTerm}".</Typography>
                    </div>
                )}
            </div>
        </main>
    )
}
