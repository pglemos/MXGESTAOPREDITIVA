import { useCourses } from '@/hooks/useData'
import { useState, useMemo, useCallback } from 'react'
import { GraduationCap, Search, RefreshCw, Clock, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Academy...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">MX <span className="text-brand-primary">Academy</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Evolução Técnica & Comportamental</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <Input
                            placeholder="BUSCAR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredCourses.map((course, i) => (
                                <motion.div key={course.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                    <Card className="p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg">
                                        <div>
                                            <div className="flex items-start justify-between mb-10">
                                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner group-hover:bg-brand-secondary group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                                    <GraduationCap size={32} className="text-brand-primary group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex flex-col items-end gap-mx-xs">
                                                    <Badge variant="brand">{course.category}</Badge>
                                                    <Typography variant="caption" className="text-mx-micro opacity-50 uppercase">{course.instructor}</Typography>
                                                </div>
                                            </div>

                                            <div className="space-y-mx-sm">
                                                <Typography variant="h3" className="line-clamp-2 text-lg">{course.title}</Typography>
                                                <Typography variant="p" tone="muted" className="text-xs line-clamp-3 italic leading-relaxed">"{course.description}"</Typography>
                                            </div>
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-border-default space-y-mx-lg">
                                            <div className="space-y-mx-xs">
                                                <div className="flex justify-between items-end">
                                                    <Typography variant="caption" className="text-mx-micro font-black">PROGRESSO ALUNO</Typography>
                                                    <Typography variant="mono" tone="brand" className="text-mx-tiny">0%</Typography>
                                                </div>
                                                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner">
                                                    <div className="h-full bg-brand-primary w-mx-0 shadow-mx-sm" />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-mx-xs">
                                                    <Clock size={14} className="text-brand-primary" aria-hidden="true" />
                                                    <Typography variant="mono" className="text-mx-tiny">{course.duration}</Typography>
                                                </div>
                                                <Button asChild size="sm" className="h-mx-11 px-8 rounded-mx-full shadow-mx-md">
                                                    <a href={course.url} target="_blank" rel="noopener noreferrer">
                                                        INICIAR <ArrowRight size={16} className="ml-2" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full min-h-mx-section-sm flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-mx-3xl">
                        <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-surface-alt shadow-xl flex items-center justify-center mb-8 border border-border-default" aria-hidden="true">
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
