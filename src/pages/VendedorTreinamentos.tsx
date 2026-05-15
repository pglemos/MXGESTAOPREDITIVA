import { useDevelopmentRecommendations, useDevelopmentTracks, useTrainings } from '@/hooks/useData'
import { useCheckins } from '@/hooks/useCheckins'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { 
    GraduationCap, Play, CheckCircle, ExternalLink, Clock, 
    Users, Target, BookOpen, ChevronRight, Sparkles, 
    RefreshCw, Search, X, Zap, ShieldCheck, History,
    Smartphone, Star, Send, Lock, Unlock
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { startOfWeek } from 'date-fns'
import {
    buildNewCollaboratorTrack,
    DEVELOPMENT_THEMES,
    filterDevelopmentContent,
    inferDevelopmentTheme,
    recommendDevelopmentThemeFromGap,
    type DevelopmentTheme,
} from '@/lib/development-content'

export default function VendedorTreinamentos() {
    const { treinamentos, loading, error, markWatched, rateTraining, suggestContent, refetch } = useTrainings()
    const { recommendations, updateRecommendation } = useDevelopmentRecommendations()
    const { assignments, progress: trackProgress, completeTrackStep } = useDevelopmentTracks()
    const { checkins } = useCheckins()
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTheme, setSelectedTheme] = useState<DevelopmentTheme | 'todos'>('todos')
    const [isRefetching, setIsRefetching] = useState(false)
    const [suggestionTitle, setSuggestionTitle] = useState('')
    const [suggestionTheme, setSuggestionTheme] = useState<DevelopmentTheme>('funil')

    // 🚀 Lógica de Prescrição Real MX
    const gapAnalysis = useMemo(() => {
        if (!checkins) return null
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
        const weekStartStr = weekStart.toISOString().split('T')[0]
        const recentCheckins = checkins.filter(c => c.reference_date >= weekStartStr)
        if (recentCheckins.length === 0) return null

        const funil = calcularFunil(recentCheckins)
        const diag = gerarDiagnosticoMX(funil)

        if (!diag.gargalo) return null

        const category = recommendDevelopmentThemeFromGap(diag.gargalo)
        const recommended = treinamentos?.find(t => t.type === category && !t.watched) || treinamentos?.find(t => t.type === category)

        return { gargalo: diag.gargalo, label: diag.diagnostico, recommended }
    }, [checkins, treinamentos])

    const watched = useMemo(() => treinamentos?.filter(t => t.watched).length || 0, [treinamentos])
    const progress = useMemo(() => (treinamentos?.length || 0) > 0 ? (watched / treinamentos.length) * 100 : 0, [watched, treinamentos])

    const filteredTrainings = useMemo(() => {
        if (!treinamentos) return []
        return filterDevelopmentContent(treinamentos, { search: searchTerm, theme: selectedTheme })
    }, [selectedTheme, treinamentos, searchTerm])
    const onboardingTrack = useMemo(() => buildNewCollaboratorTrack(), [])
    const activeAssignment = assignments.find((assignment: { status?: string }) => assignment.status === 'active')
    const activeTrackProgress = useMemo(() => {
        if (!activeAssignment) return []
        return trackProgress.filter((item: { assignment_id?: string }) => item.assignment_id === activeAssignment.id)
    }, [activeAssignment, trackProgress])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch?.(); setIsRefetching(false)
        toast.success('Academy sincronizada!')
    }, [refetch])

    const handleSuggestContent = useCallback(async () => {
        if (!suggestionTitle.trim()) {
            toast.error('Informe o tema que você precisa estudar.')
            return
        }
        const { error } = await suggestContent({ title: suggestionTitle.trim(), theme: suggestionTheme, priority: 'medium' })
        if (error) toast.error(error)
        else {
            toast.success('Sugestão enviada para a curadoria MX.')
            setSuggestionTitle('')
        }
    }, [suggestContent, suggestionTheme, suggestionTitle])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Academy...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Academy Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Meu <span className="text-mx-green-700">Desenvolvimento</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">BIBLIOTECA • RECOMENDAÇÕES • PLANO DE CARREIRA</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Card className="flex items-center gap-mx-md px-6 py-2 bg-white border border-border-default shadow-mx-sm rounded-mx-xl">
                        <div className="flex flex-col items-end">
                            <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase">Status Desenvolvimento</Typography>
                            <Typography variant="mono" tone="brand" className="text-sm font-black">{watched} / {treinamentos?.length || 0}</Typography>
                        </div>
                        <div className="w-mx-20 h-1.5 bg-surface-alt rounded-mx-full overflow-hidden p-0.5 shadow-inner border border-border-default">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-brand-primary rounded-mx-full" />
                        </div>
                    </Card>
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="relative group w-full lg:w-mx-card-lg shrink-0 mb-4">
                <Search className="absolute left-mx-5 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} />
                <Input
                    placeholder="BUSCAR TEMA OU HABILIDADE..." value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!pl-14 !h-14 !text-mx-tiny uppercase tracking-widest"
                />
            </div>

            <div className="flex gap-mx-xs overflow-x-auto pb-mx-xs">
                <Button
                    type="button"
                    variant={selectedTheme === 'todos' ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTheme('todos')}
                    className="shrink-0 rounded-mx-full uppercase font-black text-mx-tiny"
                >
                    Todos
                </Button>
                {DEVELOPMENT_THEMES.map(theme => (
                    <Button
                        key={theme.key}
                        type="button"
                        variant={selectedTheme === theme.key ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTheme(theme.key)}
                        className="shrink-0 rounded-mx-full uppercase font-black text-mx-tiny"
                    >
                        {theme.label}
                    </Button>
                ))}
            </div>

            <section className="flex-1 min-h-0 pb-32" aria-live="polite">
                {!searchTerm && selectedTheme === 'todos' && (
                    <Card className="mb-mx-lg p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg">
                            <div>
                                <Typography variant="h3" className="uppercase tracking-tight">Trilha de novo colaborador</Typography>
                                <Typography variant="p" tone="muted" className="text-sm">
                                    {activeAssignment ? 'Sua trilha persistida esta ativa. Conclua em ordem para liberar os proximos meses.' : 'Fundamentos para entrar na rotina antes da liberação operacional pelo gestor.'}
                                </Typography>
                            </div>
                            <div className="flex flex-wrap gap-mx-xs">
                                {(activeTrackProgress.length ? activeTrackProgress : onboardingTrack).map((item: any) => {
                                    const step = item.step || item
                                    const status = item.status || (step.locked ? 'locked' : 'available')
                                    const isCompleted = status === 'completed'
                                    const isLocked = status === 'locked'
                                    return (
                                        <button
                                            key={item.id || step.key}
                                            type="button"
                                            disabled={!item.id || isLocked || isCompleted}
                                            onClick={async () => {
                                                const { error } = await completeTrackStep({ progressId: item.id })
                                                if (error) toast.error(error)
                                                else toast.success('Etapa concluída. Próximo passo liberado quando aplicável.')
                                            }}
                                            className="text-left"
                                        >
                                            <Badge variant={isCompleted ? 'success' : isLocked ? 'outline' : 'brand'} className="rounded-mx-full px-3 py-1 gap-mx-xs">
                                                {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                                                {step.title}
                                            </Badge>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </Card>
                )}

                {!searchTerm && selectedTheme === 'todos' && recommendations.length > 0 && (
                    <Card className="mb-mx-lg p-mx-lg border border-brand-primary/20 shadow-mx-lg bg-white">
                        <div className="flex flex-col gap-mx-md">
                            <div>
                                <Typography variant="h3" className="uppercase tracking-tight">Recomendações do seu PDI e feedback</Typography>
                                <Typography variant="p" tone="muted" className="text-sm">Conteúdos ligados às lacunas registradas pelo gestor.</Typography>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-sm">
                                {recommendations.slice(0, 4).map(rec => (
                                    <div key={rec.id} className="border border-border-default rounded-mx-xl p-mx-md bg-surface-alt/60">
                                        <div className="flex items-start justify-between gap-mx-sm">
                                            <div>
                                                <Badge variant={rec.priority === 'high' ? 'danger' : 'brand'} className="rounded-mx-full">{rec.theme}</Badge>
                                                <Typography variant="p" className="mt-mx-xs text-sm font-black">{rec.training?.title || 'Conteúdo recomendado'}</Typography>
                                                <Typography variant="caption" tone="muted" className="line-clamp-2">{rec.reason}</Typography>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => updateRecommendation({ id: rec.id, status: 'in_progress' })}>Iniciar</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* AI Prescription Card */}
                {gapAnalysis?.recommended && !searchTerm && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-14">
                        <Card className="bg-brand-secondary text-white p-mx-10 md:p-14 border-none shadow-mx-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-transparent pointer-events-none" />
                            <div className="flex flex-col lg:flex-row lg:items-center gap-mx-10 relative z-10">
                                <div className="w-mx-20 h-mx-header rounded-mx-3xl bg-white text-brand-secondary flex items-center justify-center shadow-mx-xl group-hover:rotate-6 transition-transform shrink-0">
                                    <Sparkles size={40} />
                                </div>
                                <div className="flex-1 space-y-mx-sm">
                                    <div className="flex items-center gap-mx-xs">
                                        <Badge variant="danger" className="px-4 py-1 uppercase font-black shadow-sm">Gap Detectado: {gapAnalysis.gargalo}</Badge>
                                        <Typography variant="caption" tone="white" className="tracking-widest font-black">PRESCRIÇÃO TÁTICA MX</Typography>
                                    </div>
                                    <Typography variant="h2" tone="white" className="text-3xl tracking-tight leading-none uppercase">{gapAnalysis.recommended.title}</Typography>
                                    <Typography variant="p" tone="white" className="text-base opacity-60 max-w-3xl italic">"{gapAnalysis.label} Este módulo foi indexado pela rede para corrigir sua conversão imediata."</Typography>
                                </div>
                                <Button size="lg" variant="secondary" onClick={() => window.open(gapAnalysis.recommended?.video_url, '_blank')} className="rounded-mx-full px-12 h-mx-2xl shadow-mx-xl font-black uppercase tracking-mx-wide text-mx-tiny">
                                    <Play size={18} className="fill-current mr-2" /> INICIAR CORREÇÃO
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-mx-lg">
                    <AnimatePresence mode="popLayout">
                        {filteredTrainings.map((t, i) => (
                            <motion.div key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
                                <Card className="p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div>
                                        <header className="flex items-start justify-between mb-10 border-b border-border-default pb-6 relative z-10">
                                            <div className={cn("w-mx-14 h-mx-14 rounded-mx-2xl flex items-center justify-center border shadow-inner transition-all transform group-hover:rotate-3", 
                                                t.watched ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-surface-alt text-text-tertiary group-hover:bg-brand-primary group-hover:text-white"
                                            )}>
                                                {t.watched ? <CheckCircle size={24} strokeWidth={2} /> : <Play size={24} strokeWidth={2} className="ml-1" />}
                                            </div>
                                            <div className="flex flex-col items-end gap-mx-xs">
                                                <Badge variant="brand" className="px-4 py-1 rounded-mx-full uppercase text-mx-micro font-black">{inferDevelopmentTheme(t).replaceAll('_', ' ')}</Badge>
                                                {t.watched && <Typography variant="caption" tone="success" className="text-mx-micro font-black tracking-widest uppercase flex items-center gap-mx-tiny"><CheckCircle size={10} /> VALIDADO</Typography>}
                                            </div>
                                        </header>

                                        <div className="mb-8 flex-1 relative z-10 space-y-mx-xs">
                                            <Typography variant="h3" className="text-xl uppercase tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2">{t.title}</Typography>
                                            <Typography variant="p" tone="muted" className="text-xs font-bold leading-relaxed line-clamp-3 italic opacity-60">"{t.description || 'Domine esta técnica para acelerar seus resultados operacionais.'}"</Typography>
                                            
                                            <div className="flex flex-wrap gap-mx-xs pt-4">
                                                <div className="flex items-center gap-mx-xs px-3 py-1.5 rounded-mx-lg bg-surface-alt border border-border-default text-text-tertiary text-mx-micro font-black uppercase tracking-widest"><Clock size={12} /> 15 MIN</div>
                                                <div className="flex items-center gap-mx-xs px-3 py-1.5 rounded-mx-lg bg-mx-indigo-50 border border-mx-indigo-100 text-brand-primary text-mx-micro font-black uppercase tracking-widest"><Sparkles size={12} /> +{t.xp_reward || 100} XP</div>
                                                <div className="flex items-center gap-mx-xs px-3 py-1.5 rounded-mx-lg bg-status-warning-surface border border-status-warning/20 text-status-warning text-mx-micro font-black uppercase tracking-widest">
                                                    <Star size={12} className="fill-current" /> {t.average_rating || 0} ({t.rating_count || 0})
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <footer className="pt-8 border-t border-border-default flex flex-col sm:flex-row gap-mx-sm mt-auto relative z-10">
                                        <Button variant="outline" className="flex-1 h-mx-xl rounded-mx-xl font-black uppercase text-mx-micro shadow-sm border-border-strong hover:border-brand-primary" onClick={() => window.open(t.video_url, '_blank')}>
                                            <Play size={14} className="mr-2" /> ASSISTIR AULA
                                        </Button>
                                        {!t.watched ? (
                                            <Button onClick={() => { markWatched?.(t.id); toast.success('Evolução registrada! +100 XP') }} className="flex-1 h-mx-xl rounded-mx-xl bg-brand-secondary text-white hover:bg-brand-primary shadow-mx-lg font-black uppercase text-mx-micro border border-brand-secondary">
                                                CONCLUIR MÓDULO
                                            </Button>
                                        ) : (
                                            <div className="flex-1 h-mx-xl rounded-mx-xl bg-status-success-surface text-status-success border border-status-success/20 flex items-center justify-center shadow-inner gap-mx-xs">
                                                <Typography variant="tiny" as="span" className="font-black uppercase"><ShieldCheck size={14} className="inline-block" /> CERTIFICADO</Typography>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-center gap-mx-tiny sm:w-mx-32">
                                            {[1, 2, 3, 4, 5].map(value => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
                                                    onClick={() => rateTraining({ trainingId: t.id, rating: value })}
                                                    className={cn('text-status-warning/30 hover:text-status-warning transition-colors', (t.user_rating || 0) >= value && 'text-status-warning')}
                                                >
                                                    <Star size={16} className={(t.user_rating || 0) >= value ? 'fill-current' : ''} />
                                                </button>
                                            ))}
                                        </div>
                                    </footer>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <Card className="mt-mx-lg p-mx-lg border border-border-default shadow-mx-lg bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-mx-sm items-end">
                        <div>
                            <Typography variant="h3" className="uppercase tracking-tight">Sugerir conteúdo</Typography>
                            <Typography variant="p" tone="muted" className="text-sm">A curadoria MX recebe sua necessidade e prioriza novos módulos.</Typography>
                            <Input
                                value={suggestionTitle}
                                onChange={(event) => setSuggestionTitle(event.target.value)}
                                placeholder="Ex: quero uma aula sobre financiamento para autônomo"
                                className="mt-mx-sm"
                            />
                        </div>
                        <select value={suggestionTheme} onChange={(event) => setSuggestionTheme(event.target.value as DevelopmentTheme)} className="h-mx-xl rounded-mx-xl border border-border-default bg-surface-alt px-mx-md text-sm font-black uppercase">
                            {DEVELOPMENT_THEMES.map(theme => <option key={theme.key} value={theme.key}>{theme.label}</option>)}
                        </select>
                        <Button onClick={handleSuggestContent} className="h-mx-xl rounded-mx-xl font-black uppercase">
                            <Send size={16} className="mr-mx-xs" /> Enviar
                        </Button>
                    </div>
                </Card>
            </section>
        </main>
    )
}
