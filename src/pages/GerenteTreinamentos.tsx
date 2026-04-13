import { useTrainings, useTeamTrainings, useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { 
    GraduationCap, Play, CheckCircle, Search, 
    Filter, RefreshCw, X, Award, Users, LayoutDashboard, Target, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader } from '@/components/molecules/Card'
import { toast } from 'sonner'

export default function GerenteTreinamentos() {
    const [tab, setTab] = useState<'meus' | 'equipe' | 'matriz'>('equipe')
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

    const handleRemindSeller = async (sellerId: string, trainingTitle: string) => {
        setIsAssigning(true)
        const { error } = await sendNotification({
            recipient_id: sellerId,
            title: '⚠️ PENDÊNCIA DE TREINAMENTO',
            message: `Olá! Notamos que o módulo "${trainingTitle}" ainda não foi concluído. Este conteúdo é vital para o seu atingimento de meta esta semana.`,
            type: 'training',
            priority: 'medium',
            link: '/vendedor/treinamentos'
        })
        setIsAssigning(false)
        if (error) toast.error('Falha ao enviar lembrete.')
        else toast.success('Lembrete enviado ao especialista!')
    }

    const handleRemindAll = async (trainingId: string) => {
        const training = trainings.find(t => t.id === trainingId)
        const pendents = teamProgress.filter(p => !p.watched.includes(trainingId))
        
        if (pendents.length === 0) return toast.info('Todos já assistiram este módulo!')

        setIsAssigning(true)
        const promises = pendents.map(p => sendNotification({
            recipient_id: p.seller_id,
            title: '🔥 CONVOCAÇÃO MX ACADEMY',
            message: `O gerente convocou a tropa para o treinamento: "${training?.title}". Todos devem concluir este módulo nas próximas 24h.`,
            type: 'training',
            priority: 'high',
            link: '/vendedor/treinamentos'
        }))

        await Promise.all(promises)
        setIsAssigning(false)
        toast.success(`Convocação enviada para ${pendents.length} especialistas!`)
    }

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await (tab === 'meus' ? refetchMe() : refetchTeam())
        setIsRefetching(false)
        toast.success('Academy sincronizado!')
    }, [tab, refetchMe, refetchTeam])

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

    if (isLoading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <div className="h-mx-10 w-mx-64 bg-border-default rounded animate-pulse" />
                    <div className="h-mx-xs w-mx-48 bg-border-default rounded animate-pulse" />
                </div>
                <div className="flex gap-mx-sm">
                    <div className="h-mx-14 w-mx-64 rounded-mx-full bg-border-default animate-pulse" />
                    <div className="h-mx-14 w-mx-48 rounded-mx-full bg-border-default animate-pulse" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                {[1,2,3].map(i => <div key={i} className="h-mx-64 rounded-mx-2xl bg-white animate-pulse" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                        <Typography variant="h1">Academy <span className="text-brand-primary">Gerencial</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">Mapeamento de Competências & Absorção MX</Typography>
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
                            variant={tab === 'matriz' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setTab('matriz')} className="h-mx-10 px-6 rounded-mx-full uppercase"
                        >
                            <LayoutDashboard size={14} className="mr-2" /> <Typography variant="tiny" as="span" className="font-black">Matriz</Typography>
                        </Button>
                        <Button 
                            variant={tab === 'meus' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setTab('meus')} className="h-mx-10 px-6 rounded-mx-full uppercase"
                        >
                            <Target size={14} className="mr-2" /> <Typography variant="tiny" as="span" className="font-black">Meu Plano</Typography>
                        </Button>
                    </div>
                    <div className="flex items-center gap-mx-sm">
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                        <div className="relative group">
                            <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                            <Input 
                                placeholder="BUSCAR CONTEÚDO..." value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="!pl-11 !h-12 uppercase tracking-widest text-mx-tiny font-black"
                            />
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {tab === 'meus' ? (
                        <motion.div key="meus" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                            {filteredMe.map((t, i) => (
                                <motion.article key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                    <Card className="p-mx-lg h-full border-none shadow-mx-lg bg-white group hover:shadow-mx-xl transition-all relative overflow-hidden flex flex-col gap-mx-10">
                                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <header className="flex justify-between items-start relative z-10">
                                            <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-all", t.watched ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-surface-alt text-text-tertiary border-border-default group-hover:bg-brand-primary group-hover:text-white")}>
                                                <GraduationCap size={28} strokeWidth={2} />
                                            </div>
                                            {t.watched && <Badge variant="success" className="px-4 py-1 rounded-mx-full uppercase font-black text-mx-micro shadow-sm">CONCLUÍDO</Badge>}
                                        </header>
                                        <div className="flex-1 space-y-mx-xs relative z-10">
                                            <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">{t.type}</Typography>
                                            <Typography variant="h3" className="text-lg uppercase leading-tight group-hover:text-brand-primary transition-colors">{t.title}</Typography>
                                            <Typography variant="p" tone="muted" className="text-xs font-bold leading-relaxed opacity-60">"{t.description}"</Typography>
                                        </div>
                                        <footer className="pt-8 border-t border-border-default flex items-center justify-between mt-auto relative z-10">
                                            <div className="flex items-center gap-mx-xs text-mx-micro font-black text-text-tertiary uppercase">
                                                <Award size={14} className="text-status-warning" /> {t.watched ? 'ABSORVIDO' : 'PENDENTE'}
                                            </div>
                                            {!t.watched && (
                                                <Button size="sm" onClick={() => markWatched(t.id)} className="h-mx-10 px-6 rounded-mx-full font-black uppercase text-mx-micro shadow-mx-md">
                                                    ASSISTIR <Play size={14} className="ml-2 fill-white" />
                                                </Button>
                                            )}
                                        </footer>
                                    </Card>
                                </motion.article>
                            ))}
                        </motion.div>
                    ) : tab === 'matriz' ? (
                        <motion.div key="matriz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                            <Card className="border-none shadow-mx-xl bg-white overflow-hidden flex flex-col">
                                <header className="p-mx-md md:p-10 border-b border-border-default bg-surface-alt/30 flex items-center justify-between">
                                    <div className="flex items-center gap-mx-sm">
                                        <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md"><LayoutDashboard size={20} /></div>
                                        <div>
                                            <Typography variant="h3" className="font-black uppercase">Matriz de Absorção</Typography>
                                            <Typography variant="caption" tone="muted" className="font-black uppercase opacity-40">Mapeamento Cruzado de Conhecimento</Typography>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="px-4 py-1.5 rounded-mx-full uppercase font-black text-mx-micro shadow-sm border-border-strong">
                                        {teamProgress.length} Especialistas Ativos
                                    </Badge>
                                </header>

                                <div className="flex-1 overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left min-w-mx-elite-table">
                                        <thead>
                                            <tr className="bg-surface-alt/50 border-b border-border-default text-mx-micro font-black uppercase tracking-mx-wider text-text-tertiary">
                                                <th scope="col" className="pl-10 py-6 sticky left-mx-0 bg-surface-alt/50 z-20">VENDEDOR</th>
                                                {trainings.map(t => (
                                                    <th key={t.id} scope="col" className="px-4 py-6 text-center group relative min-w-mx-32">
                                                        <span className="truncate block max-w-mx-20 mx-auto">{t.title}</span>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-brand-secondary text-white text-mx-micro font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[70] whitespace-nowrap shadow-mx-lg">
                                                            {t.title}
                                                            <Button onClick={() => handleRemindAll(t.id)} className="block mt-2 w-full h-mx-10 bg-brand-primary text-mx-nano font-black">COBRAR TROPA</Button>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-default bg-white">
                                            {teamProgress.map((p) => (
                                                <tr key={p.seller_id} className="hover:bg-surface-alt/30 transition-colors h-mx-20 group">
                                                    <td className="pl-10 sticky left-mx-0 bg-white group-hover:bg-surface-alt/30 z-10 border-r border-border-default">
                                                        <div className="flex items-center gap-mx-sm">
                                                            <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-surface-alt flex items-center justify-center font-black text-text-tertiary text-xs shadow-inner uppercase">{p.seller_name.charAt(0)}</div>
                                                            <Typography variant="p" className="text-sm font-black uppercase tracking-tight truncate max-w-mx-label-lg">{p.seller_name}</Typography>
                                                        </div>
                                                    </td>
                                                    {trainings.map(t => {
                                                        const isWatched = p.watched.includes(t.id)
                                                        return (
                                                            <td key={t.id} className="px-4 text-center">
                                                                <div className="flex flex-col items-center justify-center gap-mx-tiny">
                                                                    <div className={cn("w-mx-9 h-mx-9 rounded-mx-lg flex items-center justify-center border shadow-sm transition-all", 
                                                                        isWatched ? 'bg-status-success-surface text-status-success border-mx-emerald-100' : 'bg-surface-alt text-text-tertiary/30'
                                                                    )}>
                                                                        {isWatched ? <CheckCircle size={16} /> : <X size={16} />}
                                                                    </div>
                                                                    {!isWatched && (
                                                                        <button 
                                                                            onClick={() => handleRemindSeller(p.seller_id, t.title)}
                                                                            disabled={isAssigning}
                                                                            className="text-mx-nano font-black text-brand-primary uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            COBRAR
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div key="equipe" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                            {filteredTeam.map((p, i) => (
                                <motion.article key={p.seller_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                    <Card className="p-mx-lg bg-white border-none shadow-mx-lg group hover:shadow-mx-xl transition-all relative overflow-hidden flex flex-col items-center text-center">
                                        <div className="absolute top-mx-0 right-mx-0 w-mx-32 h-mx-32 bg-brand-primary/5 rounded-mx-full blur-2xl -mr-16 -mt-16" />
                                        
                                        <div className="w-mx-20 h-mx-20 rounded-mx-full border-4 border-white shadow-mx-md overflow-hidden bg-surface-alt mb-6 group-hover:scale-105 transition-transform relative z-10">
                                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.seller_name)}&background=4f46e5&color=fff&bold=true`} alt={p.seller_name} className="w-full h-full object-cover" />
                                        </div>

                                        <div className="relative z-10 w-full">
                                            <Typography variant="h3" className="text-base uppercase font-black truncate">{p.seller_name}</Typography>
                                            <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase opacity-40 mb-6 block">Especialista de Elite</Typography>
                                            
                                            <div className="space-y-mx-sm mb-8">
                                                <div className="flex justify-between items-end px-2">
                                                    <Typography variant="tiny" className="font-black opacity-40 uppercase">Absorção</Typography>
                                                    <Typography variant="mono" tone="brand" className="text-sm font-black">{Math.round((p.watched.length / trainings.length) * 100)}%</Typography>
                                                </div>
                                                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default p-mx-px">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.watched.length / trainings.length) * 100}%` }} className="h-full bg-brand-primary rounded-mx-full" />
                                                </div>
                                            </div>

                                            <Button 
                                                variant="outline" size="sm" 
                                                onClick={() => setAssigningTo(p.seller_id)}
                                                className="w-full h-mx-11 rounded-mx-xl font-black uppercase text-mx-micro shadow-sm bg-white border-border-strong hover:border-brand-primary transition-all"
                                            >
                                                <Award size={14} className="mr-2" /> REFORÇO TÁTICO
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.article>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {assigningTo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-mx-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-mx-2xl max-h-full overflow-y-auto no-scrollbar shadow-mx-2xl border-none bg-white rounded-mx-3xl">
                            <header className="p-mx-lg border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                                <div className="flex items-center gap-mx-sm">
                                    <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-md"><Target size={20} /></div>
                                    <div>
                                        <Typography variant="h3" className="font-black uppercase">Atribuir Reforço</Typography>
                                        <Typography variant="caption" tone="muted" className="font-black uppercase opacity-40">Destino: {teamProgress.find(p => p.seller_id === assigningTo)?.seller_name}</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setAssigningTo(null)} className="rounded-mx-full w-mx-10 h-mx-10"><X size={20} /></Button>
                            </header>
                            <div className="p-mx-lg grid grid-cols-1 gap-mx-sm">
                                {trainings.map(t => (
                                    <button 
                                        key={t.id} onClick={() => handleAssignTraining(t.id)} disabled={isAssigning}
                                        className="flex items-center justify-between p-mx-md rounded-mx-2xl border border-border-default hover:border-brand-primary hover:bg-mx-indigo-50 transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-mx-md">
                                            <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt flex items-center justify-center text-text-tertiary group-hover:bg-white transition-all shadow-inner"><GraduationCap size={20} /></div>
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
