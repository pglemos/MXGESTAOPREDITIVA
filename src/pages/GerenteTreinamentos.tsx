import { useContentSuggestions, useDevelopmentTracks, useTrainings, useTeamTrainings, useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useMemo, useCallback } from 'react'
import { 
    GraduationCap, Play, CheckCircle, Search, 
    Filter, RefreshCw, X, Award, Users, LayoutDashboard, Target, Send, Star, Route, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabNavPill } from '@/components/molecules/TabNavPill'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Avatar } from '@/components/atoms/Avatar'
import { Card, CardHeader } from '@/components/molecules/Card'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { AulasAoVivoSection } from '@/features/universidade/sections/AulasAoVivoSection'

export default function GerenteTreinamentos() {
    const { role } = useAuth()
    const isOwner = role === 'dono'
    const canManageTeamTrainings = !isOwner
    const [tab, setTab] = useState<'meus' | 'equipe' | 'matriz'>(() => isOwner ? 'matriz' : 'equipe')
    const trainingTabs = useMemo(() => (
        isOwner
            ? [
                { key: 'matriz' as const, label: 'Matriz da Equipe', icon: LayoutDashboard },
                { key: 'meus' as const, label: 'Minha Trilha', icon: Target },
            ]
            : [
                { key: 'equipe' as const, label: 'Equipe', icon: Users },
                { key: 'matriz' as const, label: 'Matriz da Equipe', icon: LayoutDashboard },
                { key: 'meus' as const, label: 'Minha Trilha', icon: Target },
            ]
    ), [isOwner])
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [assigningTo, setAssigningTo] = useState<string | null>(null)
    const [isAssigning, setIsAssigning] = useState(false)
    const [institutionalForm, setInstitutionalForm] = useState({ title: '', description: '', video_url: '' })
    const [savingInstitutional, setSavingInstitutional] = useState(false)

    // Meus Treinamentos
    const { treinamentos, loading: tLoading, error: tError, markWatched, createTraining, refetch: refetchMe } = useTrainings()
    const watched = useMemo(() => treinamentos?.filter(t => t.watched).length || 0, [treinamentos])
    const progress = useMemo(() => (treinamentos?.length || 0) > 0 ? (watched / treinamentos.length) * 100 : 0, [watched, treinamentos])

    // Progresso da Equipe
    const { teamProgress, loading: tpLoading, error: tpError, refetch: refetchTeam } = useTeamTrainings()
    const { suggestions } = useContentSuggestions()
    const { assignments, assignDefaultTrack } = useDevelopmentTracks()
    
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
            link: '/treinamentos'
        })
        setIsAssigning(false)
        if (error) toast.error('Falha ao enviar lembrete.')
        else toast.success('Lembrete enviado ao especialista!')
    }

    const handleRemindAll = async (trainingId: string) => {
        const training = treinamentos.find(t => t.id === trainingId)
        const pendents = teamProgress.filter(p => !p.watched.includes(trainingId))
        
        if (pendents.length === 0) return toast.info('Todos já assistiram este módulo!')

        setIsAssigning(true)
        const promises = pendents.map(p => sendNotification({
            recipient_id: p.seller_id,
            title: '🔥 CONVOCAÇÃO MX ACADEMY',
            message: `O gerente solicitou a conclusão do treinamento: "${training?.title}". Todos devem concluir este módulo nas próximas 24h.`,
            type: 'training',
            priority: 'high',
            link: '/treinamentos'
        }))

        await Promise.all(promises)
        setIsAssigning(false)
        toast.success(`Convocação enviada para ${pendents.length} especialistas!`)
    }

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await (tab === 'meus' ? refetchMe() : refetchTeam())
        setIsRefetching(false)
        toast.success('Desenvolvimento sincronizado!')
    }, [tab, refetchMe, refetchTeam])

    const handleAssignTraining = async (trainingId: string) => {
        if (!assigningTo) return
        const seller = teamProgress.find(p => p.seller_id === assigningTo)
        const training = treinamentos.find(t => t.id === trainingId)
        
        setIsAssigning(true)
        const { error } = await sendNotification({
            recipient_id: assigningTo,
            title: '🎯 NOVO TREINAMENTO ATRIBUÍDO',
            message: `Seu gestor solicitou que você assista ao módulo: "${training?.title}". Foco na melhoria do seu gargalo tático.`,
            type: 'training',
            priority: 'high',
            link: '/treinamentos'
        })
        setIsAssigning(false)

        if (error) toast.error('Falha ao atribuir treinamento.')
        else {
            toast.success(`Treinamento atribuído para ${seller?.seller_name}!`)
            setAssigningTo(null)
        }
    }

    const handleAssignOnboarding = async (sellerId: string) => {
        setIsAssigning(true)
        const { error } = await assignDefaultTrack({ sellerId })
        setIsAssigning(false)
        if (error) toast.error(error)
        else toast.success('Trilha de novo colaborador atribuída.')
    }

    const handleCreateInstitutionalContent = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!institutionalForm.title || !institutionalForm.video_url) {
            toast.error('Informe título e link do conteúdo institucional.')
            return
        }
        setSavingInstitutional(true)
        const { error } = await createTraining({
            title: institutionalForm.title,
            description: institutionalForm.description,
            video_url: institutionalForm.video_url,
            type: 'institucional',
            target_audience: 'todos',
            source_kind: 'loja_institucional',
            editorial_status: 'active',
            duration_minutes: 12,
            xp_reward: 80,
            curation_notes: 'Conteúdo institucional publicado pelo gestor da loja.',
        })
        setSavingInstitutional(false)
        if (error) {
            toast.error(error)
            return
        }
        setInstitutionalForm({ title: '', description: '', video_url: '' })
        await refetchMe()
        toast.success('Conteúdo institucional publicado para a loja.')
    }

    const filteredMe = useMemo(() => {
        if (!treinamentos) return []
        return treinamentos.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [treinamentos, searchTerm])

    const filteredTeam = useMemo(() => {
        if (!teamProgress) return []
        return teamProgress.filter(p => p.seller_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [teamProgress, searchTerm])

    if (isLoading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg">
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
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-mx-tiny min-w-0">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                        <Typography variant="h1">{isOwner ? 'Treinamentos da Rede' : 'Desenvolvimento '}<span className="text-mx-green-700">{isOwner ? 'MX' : 'Gerencial'}</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black text-text-label">
                        {isOwner ? 'ACOMPANHE ABSORÇÃO E CURADORIA; EXECUÇÃO FICA COM O GERENTE' : 'Biblioteca, PDI, devolutivas e absorção MX'}
                    </Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full xl:w-auto max-w-full">
                    <TabNavPill
                        tabs={trainingTabs}
                        activeTab={tab}
                        onTabChange={setTab}
                    />
                    <div className="flex items-center gap-mx-sm w-full sm:w-auto">
                        <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                        <div className="relative group flex-1 sm:flex-none">
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
                {!isOwner && (
                    <Card className="mb-mx-lg border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
                        <Typography variant="h3" className="uppercase tracking-tight text-status-info">Desenvolvimento do gerente</Typography>
                        <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
                            Separe a leitura por tarefa: equipe mostra progresso individual, matriz compara cobertura de conteúdos e minha trilha reúne seus próprios módulos. Conteúdo institucional e sugestões ficam como governança, não como competição.
                        </Typography>
                    </Card>
                )}
                {isOwner && (
                    <Card className="mb-mx-lg border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
                        <Typography variant="h3" className="uppercase tracking-tight text-status-info">Uso executivo dos treinamentos</Typography>
                        <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
                            Dono acompanha absorção, gargalos e consistência da trilha. Cobranças, atribuições e publicação de conteúdo institucional devem ser feitas pelo gerente ou Admin MX.
                        </Typography>
                    </Card>
                )}
                <div className="mb-mx-lg">
                    <AulasAoVivoSection />
                </div>
                {suggestions.length > 0 && (
                    <Card className="mb-mx-lg p-mx-lg border border-border-default shadow-mx-lg bg-white">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md">
                            <div>
                                <Typography variant="h3" className="uppercase tracking-tight">Sugestões de conteúdo da equipe</Typography>
                                <Typography variant="p" tone="muted" className="text-sm">Fila de curadoria enviada por vendedores e gestores.</Typography>
                            </div>
                            <div className="flex flex-wrap gap-mx-xs">
                                {suggestions.slice(0, 6).map(suggestion => (
                                    <Badge key={suggestion.id} variant={suggestion.priority === 'high' ? 'danger' : 'brand'} className="rounded-mx-full px-3 py-1">
                                        {suggestion.theme}: {suggestion.title}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}
                {tab === 'equipe' && canManageTeamTrainings && (
                    <Card className="mb-mx-lg p-mx-lg border border-border-default shadow-mx-lg bg-white">
                        <form onSubmit={handleCreateInstitutionalContent} className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.4fr_1.2fr_auto] gap-mx-sm items-end">
                            <div>
                                <Typography variant="h3" className="uppercase tracking-tight">Conteúdo institucional</Typography>
                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest">História, valores, cultura e processos da loja</Typography>
                            </div>
                            <Input
                                value={institutionalForm.title}
                                onChange={event => setInstitutionalForm(prev => ({ ...prev, title: event.target.value }))}
                                placeholder="TÍTULO DO CONTEÚDO"
                                className="!h-12 uppercase tracking-widest text-mx-tiny font-black"
                            />
                            <Input
                                value={institutionalForm.video_url}
                                onChange={event => setInstitutionalForm(prev => ({ ...prev, video_url: event.target.value }))}
                                placeholder="LINK DO VÍDEO OU MATERIAL"
                                className="!h-12 text-mx-tiny font-bold"
                            />
                            <Button type="submit" disabled={savingInstitutional} className="h-mx-12 rounded-mx-xl font-black uppercase text-mx-micro shadow-mx-md">
                                {savingInstitutional ? <RefreshCw size={14} className="mr-2 animate-spin" /> : <Plus size={14} className="mr-2" />}
                                Publicar
                            </Button>
                            <textarea
                                value={institutionalForm.description}
                                onChange={event => setInstitutionalForm(prev => ({ ...prev, description: event.target.value }))}
                                placeholder="Descreva o que o novo colaborador precisa entender sobre a loja."
                                className="lg:col-start-2 lg:col-span-2 w-full bg-surface-alt border border-border-default rounded-mx-xl p-mx-md text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all resize-none min-h-mx-20"
                            />
                        </form>
                    </Card>
                )}
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
                                            <div className="flex items-center gap-mx-tiny text-status-warning">
                                                <Star size={14} className="fill-current" />
                                                <Typography variant="tiny" as="span" className="font-black">{t.average_rating || 0} ({t.rating_count || 0})</Typography>
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
                                            <Typography variant="h3" className="font-black uppercase">Matriz de Cobertura</Typography>
                                            <Typography variant="caption" tone="muted" className="font-black uppercase">Mapeamento de conteúdo por pessoa</Typography>
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
                                                {treinamentos.map(t => (
                                                    <th key={t.id} scope="col" className="px-4 py-6 text-center group relative min-w-mx-32">
                                                        <span className="truncate block max-w-mx-20 mx-auto">{t.title}</span>
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-brand-secondary text-white text-mx-micro font-black uppercase tracking-widest rounded-mx-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[70] whitespace-nowrap shadow-mx-lg">
                                                            {t.title}
                                                            {canManageTeamTrainings && (
                                                                <Button onClick={() => handleRemindAll(t.id)} className="block mt-2 w-full h-mx-10 bg-brand-primary text-mx-nano font-black">COBRAR EQUIPE</Button>
                                                            )}
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
                                                            <Avatar src={p.avatar_url || undefined} alt={`Avatar de ${p.seller_name}`} fallback={p.seller_name} className="w-mx-10 h-mx-10 rounded-mx-xl shadow-inner" />
                                                            <Typography variant="p" className="text-sm font-black uppercase tracking-tight truncate max-w-mx-label-lg">{p.seller_name}</Typography>
                                                        </div>
                                                    </td>
                                                    {treinamentos.map(t => {
                                                        const isWatched = p.watched.includes(t.id)
                                                        return (
                                                            <td key={t.id} className="px-4 text-center">
                                                                <div className="flex flex-col items-center justify-center gap-mx-tiny">
                                                                    <div className={cn("w-mx-9 h-mx-9 rounded-mx-lg flex items-center justify-center border shadow-sm transition-all", 
                                                                        isWatched ? 'bg-status-success-surface text-status-success border-mx-emerald-100' : 'bg-surface-alt text-text-tertiary/30'
                                                                    )}>
                                                                        {isWatched ? <CheckCircle size={16} /> : <X size={16} />}
                                                                    </div>
                                                                    {!isWatched && canManageTeamTrainings && (
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
                                            <Avatar src={p.avatar_url || undefined} alt={`Avatar de ${p.seller_name}`} fallback={p.seller_name} className="w-full h-full rounded-mx-full" />
                                        </div>

                                        <div className="relative z-10 w-full">
                                            <Typography variant="h3" className="text-base uppercase font-black truncate">{p.seller_name}</Typography>
                                            <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase mb-6 block">Especialista da equipe</Typography>
                                            
                                            <div className="space-y-mx-sm mb-8">
                                                <div className="flex justify-between items-end px-2">
                                                    <Typography variant="tiny" className="font-black text-text-label uppercase">Conclusão</Typography>
                                                    <Typography variant="mono" tone="brand" className="text-sm font-black">{Math.round((p.watched.length / treinamentos.length) * 100)}%</Typography>
                                                </div>
                                                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default p-mx-px">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${(p.watched.length / treinamentos.length) * 100}%` }} className="h-full bg-brand-primary rounded-mx-full" />
                                                </div>
                                            </div>

                                            {canManageTeamTrainings ? (
                                                <>
                                                    <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => setAssigningTo(p.seller_id)}
                                                        className="w-full h-mx-11 rounded-mx-xl font-black uppercase text-mx-micro shadow-sm bg-white border-border-strong hover:border-brand-primary transition-all"
                                                    >
                                                        <Award size={14} className="mr-2" /> PLANO DE REFORÇO
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleAssignOnboarding(p.seller_id)}
                                                        disabled={isAssigning || assignments.some((assignment: { seller_id?: string; status?: string }) => assignment.seller_id === p.seller_id && assignment.status === 'active')}
                                                        className="w-full h-mx-11 mt-mx-sm rounded-mx-xl font-black uppercase text-mx-micro shadow-sm"
                                                    >
                                                        <Route size={14} className="mr-2" /> TRILHA ENTRADA
                                                    </Button>
                                                </>
                                            ) : (
                                                <Badge variant="outline" className="w-full justify-center rounded-mx-xl py-mx-sm font-black uppercase">
                                                    Acompanhar
                                                </Badge>
                                            )}
                                        </div>
                                    </Card>
                                </motion.article>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {assigningTo && canManageTeamTrainings && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-mx-black/60 backdrop-blur-sm">
                        <Card className="w-full max-w-mx-2xl max-h-full overflow-y-auto no-scrollbar shadow-mx-2xl border-none bg-white rounded-mx-3xl">
                            <header className="p-mx-lg border-b border-border-default flex items-center justify-between sticky top-mx-0 bg-white z-10">
                                <div className="flex items-center gap-mx-sm">
                                    <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-md"><Target size={20} /></div>
                                    <div>
                                        <Typography variant="h3" className="font-black uppercase">Atribuir Reforço</Typography>
                                        <Typography variant="caption" tone="muted" className="font-black uppercase">Destino: {teamProgress.find(p => p.seller_id === assigningTo)?.seller_name}</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setAssigningTo(null)} className="rounded-mx-full w-mx-10 h-mx-10"><X size={20} /></Button>
                            </header>
                            <div className="p-mx-lg grid grid-cols-1 gap-mx-sm">
                                {treinamentos.map(t => (
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
