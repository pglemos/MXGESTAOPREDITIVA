import { useTrainings, useTeamTrainings, useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { 
    GraduationCap, Play, CheckCircle, Clock, Users, Target, 
    BookOpen, ChevronRight, Sparkles, RefreshCw, Search, X, 
    Filter, LayoutDashboard, History, Smartphone, ShieldCheck,
    Send, Award
} from 'lucide-react'
import { cn } from "@/lib/utils";
import { Badge } from "@/components/atoms/Badge"
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { toast } from 'sonner'

export default function GerenteTreinamentos() {
    const [tab, setTab] = useState<'meus' | 'equipe'>('equipe')
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [assigningTo, setAssigningTo] = useState<string | null>(null)
    const [isAssigning, setIsAssigning] = useState(false)

    // Meus Treinamentos
    const { trainings, loading: tLoading, error: tError, markWatched, refetch: refetchMe } = useTrainings()
    const watched = useMemo(() => trainings?.filter(t => t.watched).length || 0, [trainings])
    const progress = useMemo(() => (trainings?.length || 0) > 0 ? (watched / trainings.length) * 100 : 0, [watched, trainings])

    // Progresso da Equipe
    const { teamProgress, loading: tpLoading, error: tpError, refetch: refetchTeam } = useTeamTrainings()
    
    // Notificações para Atribuição
    const { sendNotification } = useNotifications()

    const isLoading = tab === 'meus' ? tLoading : tpLoading
    const hasError = tab === 'meus' ? tError : tpError

    const handleAssignTraining = async (trainingId: string) => {
        if (!assigningTo) return
        const seller = teamProgress.find(p => p.seller_id === assigningTo)
        const training = trainings.find(t => t.id === trainingId)
        
        setIsAssigning(true)
        const { error } = await sendNotification({
            recipient_id: assigningTo,
            title: '🎯 NOVO TREINAMENTO ATRIBUÍDO',
            message: `Seu gestor solicitou que você assista ao módulo: "${training?.title}". Foco na melhoria do seu gargalo tático.`,
            type: 'training',
            priority: 'high',
            link: '/vendedor/treinamentos'
        })
        setIsAssigning(false)

        if (error) toast.error('Falha ao atribuir treinamento.')
        else {
            toast.success(`Treinamento atribuído para ${seller?.seller_name}!`)
            setAssigningTo(null)
        }
    }

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
        toast.success('Academy sincronizada!')
    }, [tab, refetchMe, refetchTeam])

    if (isLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse uppercase font-black tracking-widest">Sincronizando Módulos...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Academy Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Evolução de <Typography as="span" className="text-brand-primary">Tropa</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">GESTÃO DE CONHECIMENTO ESTRATÉGICO • MX ACADEMY</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="bg-white p-mx-tiny rounded-mx-full flex border border-border-default shadow-mx-sm" role="tablist">
                        <Button 
                            variant={tab === 'equipe' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setTab('equipe')} className="h-mx-10 px-6 rounded-mx-full uppercase"
                        >
                            <Users size={14} className="mr-2" /> <Typography variant="tiny" as="span" className="font-black">Equipe</Typography>
                        </Button>
                        <Button 
                            variant={tab === 'meus' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setTab('meus')} className="h-mx-10 px-6 rounded-mx-full uppercase"
                        >
                            <Target size={14} className="mr-2" /> <Typography variant="tiny" as="span" className="font-black">Meu Plano</Typography>
                        </Button>
                    </div>
                    
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-mx-md items-center justify-between shrink-0 mb-4">
                <div className="relative group w-full lg:w-mx-card-lg">
                    <Search className="absolute left-mx-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} />
                    <Input
                        placeholder={tab === 'equipe' ? "BUSCAR ESPECIALISTA..." : "BUSCAR AULA OU TEMA..."}
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="!pl-14 !h-14 uppercase tracking-widest font-black !text-xs"
                    />
                </div>
                
                {tab === 'meus' && (
                    <Card className="flex items-center gap-mx-md px-8 py-4 bg-mx-indigo-50 border-mx-indigo-100 shadow-inner rounded-mx-2xl">
                        <div className="flex flex-col items-end">
                            <Typography variant="caption" tone="brand" className="leading-none mb-1 font-black">Seu Progresso</Typography>
                            <Typography variant="mono" className="text-sm font-black">{watched} / {trainings?.length || 0}</Typography>
                        </div>
                        <div className="w-mx-4xl h-mx-xs bg-white rounded-mx-full overflow-hidden p-0.5 shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-brand-primary rounded-mx-full" />
                        </div>
                    </Card>
                )}
            </div>

            <section className="flex-1 min-h-0 pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {tab === 'meus' ? (
                        <motion.div key="meus" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-mx-lg">
                            {filteredMe.map((t, i) => (
                                <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
                                    <Card className="p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div>
                                            <header className="flex items-start justify-between mb-10 border-b border-border-default pb-6 relative z-10">
                                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-2xl flex items-center justify-center border shadow-inner transition-all transform group-hover:rotate-3", 
                                                    t.watched ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-surface-alt text-text-tertiary group-hover:bg-brand-secondary group-hover:text-white"
                                                )}>
                                                    {t.watched ? <CheckCircle size={24} /> : <Play size={24} className="ml-1" />}
                                                </div>
                                                <Badge variant="brand" className="px-4 py-1 rounded-mx-full shadow-sm">
                                                    <Typography variant="tiny" as="span" className="font-black uppercase">{t.type}</Typography>
                                                </Badge>
                                            </header>

                                            <div className="space-y-mx-sm relative z-10">
                                                <Typography variant="h3" className="text-xl leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">{t.title}</Typography>
                                                <Typography variant="p" tone="muted" className="text-xs font-bold leading-relaxed line-clamp-3">"{t.description || 'Sem ementa detalhada para este módulo.'}"</Typography>
                                            </div>
                                        </div>

                                        <footer className="pt-8 border-t border-border-default flex gap-mx-sm mt-10 relative z-10">
                                            <Button 
                                                variant="outline" size="sm" 
                                                onClick={() => window.open(t.video_url, '_blank')}
                                                className="flex-1 h-mx-xl rounded-mx-xl shadow-sm bg-white"
                                            >
                                                <Typography variant="tiny" as="span" className="font-black uppercase"><Play size={16} className="mr-2 inline-block" /> ASSISTIR</Typography>
                                            </Button>
                                            {!t.watched && (
                                                <Button
                                                    size="icon"
                                                    onClick={() => { markWatched?.(t.id); toast.success('Módulo Validado! +100 XP') }}
                                                    className="w-mx-xl h-mx-xl rounded-mx-xl bg-mx-black text-white hover:bg-brand-primary shadow-mx-md"
                                                >
                                                    <CheckCircle size={20} />
                                                </Button>
                                            )}
                                        </footer>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div key="equipe" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                            {filteredTeam.map((p, i) => (
                                <motion.div key={p.seller_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                    <Card className="p-mx-lg h-full border-none shadow-mx-lg bg-white group hover:shadow-mx-xl transition-all relative overflow-hidden flex flex-col gap-mx-10">
                                        <header className="flex items-center justify-between border-b border-border-default pb-6">
                                            <div className="flex items-center gap-mx-sm min-w-0">
                                                <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-sm shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all uppercase" aria-hidden="true">{p.seller_name.charAt(0)}</div>
                                                <Typography variant="h3" className="text-base uppercase tracking-tight truncate font-black">{p.seller_name}</Typography>
                                            </div>
                                            <div className={cn("w-mx-10 h-mx-10 rounded-mx-xl flex items-center justify-center border shadow-sm", 
                                                p.percentage === 100 ? 'bg-status-success-surface text-status-success border-mx-emerald-100' : 'bg-surface-alt text-text-tertiary'
                                            )}>
                                                {p.percentage === 100 ? <CheckCircle size={18} /> : <BookOpen size={18} />}
                                            </div>
                                        </header>

                                        <div className="space-y-mx-md">
                                            <div className="flex justify-between items-end">
                                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest leading-none">Absorção Técnica</Typography>
                                                <Typography variant="mono" tone={p.percentage === 100 ? 'success' : 'brand'} className="text-sm font-black">{Math.round(p.percentage)}%</Typography>
                                            </div>
                                            <div className="w-full h-mx-xs bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-0.5">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${p.percentage}%` }} transition={{ duration: 1.5, ease: "circOut" }} className={cn("h-full rounded-mx-full shadow-sm", p.percentage === 100 ? 'bg-status-success' : 'bg-brand-primary')} />
                                            </div>
                                            
                                            {p.current_gap && (
                                                <Card className={cn("p-mx-md border-none flex flex-col gap-mx-xs", p.gap_training_completed ? "bg-status-success-surface shadow-inner" : "bg-status-error-surface animate-pulse shadow-mx-lg shadow-rose-100")}>
                                                    <div className="flex justify-between items-center">
                                                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block opacity-40">Gargalo Atual</Typography>
                                                        <Badge variant={p.gap_training_completed ? 'success' : 'danger'} className="border-none shadow-sm">
                                                            <Typography variant="tiny" as="span" className="font-black uppercase">{p.current_gap}</Typography>
                                                        </Badge>
                                                    </div>
                                                    <Typography variant="tiny" tone={p.gap_training_completed ? 'success' : 'error'} className="font-black uppercase tracking-tight">
                                                        {p.gap_training_completed ? "✔ Correção Concluída" : "⚠️ Correção Pendente"}
                                                    </Typography>
                                                </Card>
                                            )}

                                            <div className="bg-surface-alt py-3 rounded-mx-xl border border-border-default">
                                                <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest text-center block">
                                                    {p.watched.length} de {p.total_trainings} Módulos OK
                                                </Typography>
                                            </div>

                                            <Button 
                                                variant="outline" size="sm" 
                                                onClick={() => setAssigningTo(p.seller_id)}
                                                className="w-full h-mx-xl rounded-mx-xl mt-4 border-2 border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm bg-white"
                                            >
                                                <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest"><Target size={14} className="mr-2 inline-block" /> Atribuir Reforço</Typography>
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Modal de Atribuição */}
            <AnimatePresence>
                {assigningTo && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-mx-sm md:p-10 bg-mx-black/60 backdrop-blur-sm"
                    >
                        <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto no-scrollbar shadow-mx-2xl border-none flex flex-col bg-white rounded-mx-2xl">
                            <header className="p-mx-lg border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                                <div className="flex items-center gap-mx-sm">
                                    <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-md"><Target size={20} /></div>
                                    <div>
                                        <Typography variant="h3" className="font-black uppercase">Atribuir Reforço</Typography>
                                        <Typography variant="caption" tone="muted" className="font-black uppercase opacity-40">Selecione o módulo para {teamProgress.find(p => p.seller_id === assigningTo)?.seller_name}</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setAssigningTo(null)} className="rounded-mx-full w-mx-10 h-mx-10 hover:bg-surface-alt"><X size={20} /></Button>
                            </header>

                            <div className="p-mx-lg space-y-mx-sm">
                                {trainings.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => handleAssignTraining(t.id)}
                                        disabled={isAssigning}
                                        className="w-full p-mx-md bg-surface-alt hover:bg-white border border-border-default hover:border-brand-primary hover:shadow-mx-md rounded-mx-2xl transition-all text-left flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-white flex items-center justify-center text-text-tertiary group-hover:text-brand-primary shadow-sm border border-border-default transition-colors">
                                                <Play size={18} />
                                            </div>
                                            <div>
                                                <Typography variant="p" className="font-black uppercase text-xs leading-none mb-1 group-hover:text-brand-primary transition-colors">{t.title}</Typography>
                                                <Badge variant="outline" className="shadow-none border-border-default">
                                                    <Typography variant="tiny" as="span" className="font-black uppercase">{t.type}</Typography>
                                                </Badge>
                                            </div>
                                        </div>
                                        <Send size={16} className="text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
