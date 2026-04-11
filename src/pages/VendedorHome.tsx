import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTrainings } from '@/hooks/useData'
import { useTacticalPrescription } from '@/hooks/useTacticalPrescription'
import { useSellerMetrics } from '@/hooks/useSellerMetrics'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import { Target, TrendingUp, Trophy, Car, Users, Globe, BarChart3, ArrowRight, Crown, Flame, RefreshCw, CalendarDays, History, GraduationCap, Play, Clock, Zap, MessageSquare, ChevronRight } from 'lucide-react'
import { useCallback, useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { MXScoreCard } from '@/components/molecules/MXScoreCard'
import { formatWhatsAppMorningReport } from '@/lib/calculations'

export default function VendedorHome() {
    const { profile } = useAuth()
    const { checkins, todayCheckin, loading: checkisLoading, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, sellerGoals, loading: goalsLoading, fetchGoals: refetchGoals } = useGoals()
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
    const { trainings, loading: trainingsLoading, refetch: refetchTrainings } = useTrainings()
    const [isRefetching, setIsRefetching] = useState(false)
    const navigate = useNavigate()

    // 🧠 Specialized Logic Sharding
    const tacticalPrescription = useTacticalPrescription({ checkins, trainings, userId: profile?.id })
    const metrics = useSellerMetrics({ 
        checkins, 
        todayCheckin, 
        profile, 
        sellerGoals, 
        storeGoal, 
        ranking,
        projectionMode: storeGoal?.projection_mode 
    })

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([
            refetchCheckins(), 
            refetchGoals(), 
            refetchRanking?.() || Promise.resolve(),
            refetchTrainings?.() || Promise.resolve()
        ])
        setIsRefetching(false)
        toast.success('Cockpit de performance atualizado!')
    }, [refetchCheckins, refetchGoals, refetchRanking, refetchTrainings])

    const handleShareWhatsApp = useCallback(() => {
        if (!metrics || !profile) return
        const text = formatWhatsAppMorningReport(
            profile.name || 'Especialista',
            { 
                vnd_total: metrics.vendasOntem, 
                leads: 0, 
                visitas: 0, 
                agd_total: metrics.agendamentosHoje 
            },
            { label: 'EM EVOLUÇÃO', color: '' },
            metrics.projecao,
            metrics.meta || 0,
            metrics.atingimento
        )
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [metrics, profile])

    if (checkisLoading || goalsLoading || rankingLoading || trainingsLoading || !metrics) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-mx-64" />
                    <Skeleton className="h-mx-xs w-mx-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-3xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg">
                <MXScoreCard.Skeleton />
                <MXScoreCard.Skeleton />
                <MXScoreCard.Skeleton />
                <MXScoreCard.Skeleton />
            </div>

            <Card className="p-mx-10 bg-white/50 border-dashed border-2">
                <div className="flex justify-between mb-8">
                    <Skeleton className="h-mx-sm w-mx-48" />
                    <Skeleton className="h-mx-sm w-mx-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                    <Skeleton className="h-mx-64 rounded-mx-2xl" />
                    <Skeleton className="h-mx-72 rounded-mx-2xl" />
                    <Skeleton className="h-mx-64 rounded-mx-2xl" />
                </div>
            </Card>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">

            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Olá, <span className="text-brand-primary">{profile?.name?.split(' ')[0]}</span> 👋</Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">PAINEL DE PERFORMANCE INDIVIDUAL • MX ELITE</Typography>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-mx-sm w-full lg:w-auto">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleShareWhatsApp}
                        className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm bg-status-success-surface text-status-success border-status-success/20 hover:bg-status-success hover:text-white transition-all"
                        aria-label="Compartilhar performance no WhatsApp"
                    >
                        <MessageSquare size={20} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-mx-sm bg-white border border-border-default p-mx-xs pr-8 rounded-mx-3xl shadow-mx-sm">
                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-status-warning text-white flex items-center justify-center shadow-mx-md">
                            <Trophy size={22} className="fill-white/20" />
                        </div>
                        <div>
                            <Typography variant="tiny" tone="muted" className="mb-0.5 uppercase font-black tracking-widest text-mx-micro">Status Arena</Typography>
                            <Typography variant="h3" className="text-base sm:text-lg font-black">{metrics.myRank?.position || '--'}º POSIÇÃO</Typography>
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {tacticalPrescription && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="shrink-0">
                        <Card className="bg-brand-primary text-white p-mx-lg md:p-14 border-none shadow-mx-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-transparent pointer-events-none" />
                            <div className="flex flex-col lg:flex-row lg:items-center gap-mx-lg relative z-10">
                                <div className="w-mx-20 h-mx-header rounded-mx-3xl bg-white text-brand-primary flex items-center justify-center shadow-mx-xl group-hover:rotate-6 transition-transform shrink-0 mx-auto lg:mx-0">
                                    <GraduationCap size={40} />
                                </div>
                                <div className="flex-1 space-y-mx-sm text-center lg:text-left">
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-mx-xs">
                                        <Badge variant="danger" className="px-4 py-1 uppercase font-black text-tiny shadow-sm">Correção Obrigatória</Badge>
                                        <Typography variant="tiny" tone="white" className="opacity-60 uppercase font-black tracking-widest">Gap: {tacticalPrescription.gargalo}</Typography>
                                    </div>
                                    <Typography variant="h2" tone="white" className="text-2xl sm:text-3xl tracking-tighter uppercase leading-none">Masterize sua {tacticalPrescription.training.type}</Typography>
                                    <Typography variant="p" tone="white" className="opacity-80 max-w-2xl text-base font-bold italic">"{tacticalPrescription.label}"</Typography>
                                </div>
                                <Button size="lg" variant="secondary" onClick={() => navigate('/treinamentos')} className="rounded-mx-full px-12 h-mx-2xl shadow-mx-xl font-black uppercase tracking-mx-wide text-xs w-full lg:w-auto">
                                    <Play size={18} className="fill-current mr-2" /> INICIAR AGORA
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {!todayCheckin && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
                    <Button 
                        asChild
                        className="w-full h-auto p-mx-lg md:p-14 bg-mx-black border-none rounded-mx-3xl text-left shadow-mx-xl group relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg"
                    >
                        <Link to="/checkin">
                            <div className="absolute top-mx-0 right-mx-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                            <div className="flex flex-col lg:flex-row lg:items-center gap-mx-lg relative z-10">
                                <div className="w-mx-20 h-mx-header rounded-mx-3xl bg-brand-primary flex items-center justify-center border-4 border-white/10 shadow-mx-xl group-hover:rotate-12 transition-transform shrink-0 mx-auto lg:mx-0">
                                    <Zap size={40} className="text-white fill-white/20" />
                                </div>
                                <div className="max-w-2xl space-y-mx-xs text-center lg:text-left">
                                    <Typography variant="h1" tone="white" className="text-3xl sm:text-4xl tracking-tighter uppercase leading-none">Status Pendente</Typography>
                                    <Typography variant="p" tone="white" className="text-base sm:text-lg opacity-60 font-bold uppercase tracking-tight">Sua produção de ontem ainda não foi indexada no terminal MX.</Typography>
                                </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-mx-md relative z-10 group/btn mt-6 lg:mt-0 w-full lg:w-auto">
                                <Typography variant="caption" tone="white" className="opacity-40 group-hover/btn:opacity-100 transition-opacity uppercase font-black text-xs tracking-widest">CONSOLIDAR ONTEM</Typography>
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-full bg-white text-mx-black flex items-center justify-center shadow-mx-xl group-hover:scale-110 transition-transform">
                                    <ArrowRight size={28} strokeWidth={2} />
                                </div>
                            </div>
                        </Link>
                    </Button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <MXScoreCard 
                    label="Produção Ontem" value={metrics.vendasOntem} sub="CONSOLIDADO" icon={History} tone="success" 
                    description="Total de unidades vendidas no dia anterior"
                />
                <MXScoreCard 
                    label="Agenda de Hoje" value={metrics.agendamentosHoje} sub="COMPROMISSOS" icon={CalendarDays} tone="brand" 
                    description="Quantidade de atendimentos agendados para hoje"
                />
                <MXScoreCard 
                    label="Projeção MX" value={metrics.projecao} sub="PREDICTIVE" icon={Zap} tone="brand" 
                    description="Estimativa de vendas para o fechamento do mês baseada no ritmo atual"
                    isHighlight
                />
                <MXScoreCard 
                    label="Meta do Mês" value={metrics.meta || '--'} sub={`${metrics.atingimento}% ATG`} icon={Target} tone="warning" 
                    description="Objetivo de vendas definido para o mês vigente"
                />
            </div>

            <Card className="bg-surface-alt/50 p-mx-lg md:p-14 border-border-default shadow-mx-sm relative overflow-hidden group">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-12 relative z-10 gap-mx-md">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-status-warning text-white flex items-center justify-center shadow-mx-md"><Trophy size={28} /></div>
                        <div>
                            <Typography variant="h2" className="uppercase tracking-tighter leading-none">Arena de Elite</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase font-black text-xs tracking-widest opacity-40">SUA POSIÇÃO NO CAMPO DE BATALHA</Typography>
                        </div>
                    </div>
                    <Button variant="ghost" asChild className="rounded-mx-full px-8 h-mx-xl bg-white border border-border-default shadow-sm uppercase font-black tracking-widest text-xs w-full sm:w-auto">
                        <Link to="/ranking">Ver Arena Completa</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg relative z-10 items-stretch">
                    <Card className={cn("p-mx-lg border-2 border-dashed flex flex-col justify-center", metrics.competitors?.above ? "bg-white border-mx-amber-100 shadow-mx-md" : "bg-surface-alt/50 border-border-default opacity-40")}>
                        {metrics.competitors?.above ? (
                            <>
                                <Typography variant="tiny" tone="warning" className="mb-6 block font-black uppercase">Próximo Alvo</Typography>
                                <div className="flex items-center gap-mx-sm mb-8">
                                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-warning-surface text-status-warning flex items-center justify-center font-black text-xl border border-mx-amber-100 shadow-inner shrink-0">{metrics.myRank?.position ? metrics.myRank.position - 1 : '--'}º</div>
                                    <div className="min-w-0">
                                        <Typography variant="h3" className="text-base uppercase tracking-tight truncate">{metrics.competitors.above.user_name}</Typography>
                                        <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">{metrics.competitors.above.vnd_total} VENDAS</Typography>
                                    </div>
                                </div>
                                <div className="bg-status-warning-surface rounded-mx-xl p-mx-sm text-center border border-mx-amber-100/50">
                                    <Typography variant="tiny" tone="warning" className="font-black uppercase">GAP: {metrics.competitors.above.vnd_total - metrics.vendasMes} VENDAS PARA SUPERAR</Typography>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <Crown size={48} className="text-status-warning mx-auto mb-4 animate-bounce" />
                                <Typography variant="caption" tone="brand" className="tracking-mx-widest font-black uppercase">VOCÊ É O TOPO DA ARENA</Typography>
                            </div>
                        )}
                    </Card>

                    <Card className="p-mx-lg md:p-10 bg-mx-black text-white shadow-mx-elite transform md:scale-105 border-none relative overflow-hidden flex flex-col justify-between py-12 md:py-14">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/20 rounded-mx-full blur-3xl" aria-hidden="true" />
                        <div className="text-center relative z-10">
                            <Typography variant="caption" tone="brand" className="mb-4 block tracking-mx-widest font-black uppercase text-xs">STATUS ATUAL</Typography>
                            <Typography variant="h1" tone="white" className="text-6xl sm:text-8xl tabular-nums leading-none mb-2 tracking-tighter">{metrics.myRank?.position || '--'}º</Typography>
                            <Typography variant="tiny" tone="white" className="opacity-40 uppercase tracking-mx-wider font-black">NA UNIDADE</Typography>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                            <div>
                                <Typography variant="tiny" tone="white" className="opacity-30 mb-1 block uppercase font-black">VENDIDO</Typography>
                                <Typography variant="h3" tone="white" className="text-xl sm:text-2xl font-mono-numbers">{metrics.vendasMes}</Typography>
                            </div>
                            <div className="text-right">
                                <Typography variant="tiny" tone="white" className="opacity-30 mb-1 block uppercase font-black">EFICIÊNCIA</Typography>
                                <Typography variant="h3" tone="success" className="text-xl sm:text-2xl font-mono-numbers">{metrics.atingimento}%</Typography>
                            </div>
                        </div>
                    </Card>

                    <Card className={cn("p-mx-lg border-2 border-dashed flex flex-col justify-center", metrics.competitors?.below ? "bg-white border-mx-rose-100 shadow-mx-md" : "bg-surface-alt/50 border-border-default opacity-40")}>
                        {metrics.competitors?.below ? (
                            <>
                                <Typography variant="tiny" tone="error" className="mb-6 block uppercase font-black">Na sua retaguarda</Typography>
                                <div className="flex items-center gap-mx-sm mb-8">
                                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-error-surface text-status-error flex items-center justify-center font-black text-xl border border-mx-rose-100 shadow-inner shrink-0">{metrics.myRank?.position ? metrics.myRank.position + 1 : '--'}º</div>
                                    <div className="min-w-0">
                                        <Typography variant="h3" className="text-base uppercase tracking-tight truncate">{metrics.competitors.below.user_name}</Typography>
                                        <Typography variant="tiny" tone="muted" className="uppercase font-black opacity-40">{metrics.competitors.below.vnd_total} VENDAS</Typography>
                                    </div>
                                </div>
                                <div className="bg-status-error-surface rounded-mx-xl p-mx-sm text-center border border-mx-rose-100/50">
                                    <Typography variant="tiny" tone="error" className="font-black uppercase">VANTAGEM: {metrics.vendasMes - metrics.competitors.below.vnd_total} VENDAS</Typography>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <Flame size={48} className="text-status-error mx-auto mb-4" />
                                <Typography variant="caption" tone="error" className="tracking-mx-widest font-black uppercase">MANTENHA A DISTÂNCIA</Typography>
                            </div>
                        )}
                    </Card>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-20">
                <div className="lg:col-span-8 space-y-mx-lg">
                    <Card className="p-mx-lg md:p-14 relative overflow-hidden group border-none shadow-mx-lg bg-white">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-48 -mt-48" aria-hidden="true" />
                        <header className="flex items-center justify-between mb-12 relative z-10">
                            <div>
                                <Typography variant="h2" className="mb-2 uppercase tracking-tighter leading-none">Matrix de Canais</Typography>
                                <Typography variant="caption" tone="muted" className="uppercase font-black text-xs tracking-widest opacity-40">DISTRIBUIÇÃO DE FECHAMENTOS POR ORIGEM</Typography>
                            </div>
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-text-tertiary shadow-inner shrink-0"><BarChart3 size={28} /></div>
                        </header>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-lg relative z-10">
                            {[
                                { label: 'Porta', value: metrics.porCanal.porta, icon: Car, tone: 'success', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, tone: 'info', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, tone: 'brand', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <Card key={ch.label} className="p-mx-lg border border-border-default hover:border-brand-primary/20 hover:shadow-mx-lg transition-all group/item bg-surface-alt/30">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-white flex items-center justify-center shadow-mx-sm border border-border-default group-hover/item:rotate-6 transition-transform shrink-0">
                                            <ch.icon size={22} className={cn(ch.tone === 'success' ? "text-status-success" : ch.tone === 'brand' ? "text-brand-primary" : "text-status-info")} />
                                        </div>
                                        <Badge variant="outline" className="text-xs font-mono-numbers font-black border-border-strong px-3">{ch.pct}%</Badge>
                                    </div>
                                    <Typography variant="h1" className="text-4xl sm:text-5xl font-mono-numbers mb-1 leading-none">{ch.value}</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-widest uppercase font-black text-mx-micro opacity-40">{ch.label}</Typography>
                                </Card>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-mx-lg md:p-14 border-none shadow-mx-lg bg-white">
                        <header className="flex items-center gap-mx-sm mb-12">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-info-surface text-status-info border border-status-info/20 flex items-center justify-center shadow-inner shrink-0"><Clock size={28} /></div>
                            <div>
                                <Typography variant="h2" className="uppercase tracking-tighter leading-none">Rotina MX</Typography>
                                <Typography variant="caption" tone="muted" className="uppercase font-black text-xs tracking-widest opacity-40">AGENDA DE ALTA PERFORMANCE</Typography>
                            </div>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
                            {[
                                { time: '08:00', task: 'Motivacional', desc: 'Energização e Foco.' },
                                { time: '08:15', task: 'Organização', desc: 'Terminal MX e Estratégia.' },
                                { time: '08:55', task: 'Novos Leads', desc: 'Boas-vindas e Classificação.' },
                                { time: '11:00', task: 'Prospecção', desc: 'Carteira e Redes Sociais.' },
                                { time: '13:00', task: 'Atendimento', desc: 'Execução de Agendados.' },
                                { time: '16:00', task: 'Lista Quente', desc: 'Quebra de Objeções.' },
                                { time: '17:00', task: 'Fechamento', desc: 'Preparação D+1.' },
                            ].map((r, i) => (
                                <div key={i} className="flex items-center gap-mx-md p-mx-md rounded-mx-xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all group/task">
                                    <Typography variant="mono" tone="brand" className="text-sm font-black shrink-0">{r.time}</Typography>
                                    <div className="w-px h-mx-lg bg-border-strong opacity-30 group-hover/task:bg-brand-primary/30 transition-colors" />
                                    <div className="min-w-0">
                                        <Typography variant="caption" className="text-text-primary block mb-0.5 uppercase font-black text-xs truncate">{r.task}</Typography>
                                        <Typography variant="tiny" tone="muted" className="lowercase tracking-normal italic opacity-60 line-clamp-1">"{r.desc}"</Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <aside className="lg:col-span-4">
                    <Card className="bg-mx-black text-white p-mx-lg md:p-14 h-full border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-transparent z-0 opacity-50" aria-hidden="true" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" aria-hidden="true"><Zap size={240} fill="currentColor" /></div>
                        
                        <header className="flex items-center justify-between mb-16 relative z-10">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-brand-primary transition-colors shrink-0">
                                <TrendingUp size={28} className="text-white" />
                            </div>
                            <Badge variant="outline" className="text-white border-white/20 px-4 font-black text-mx-micro h-mx-md uppercase">WEEKLY SPRINT</Badge>
                        </header>

                        <div className="relative z-10 space-y-mx-xl">
                            <div className="space-y-mx-md">
                                <Typography variant="tiny" tone="white" className="opacity-40 tracking-mx-widest font-black uppercase">PERFORMANCE DA SEMANA</Typography>
                                <div className="flex items-baseline gap-mx-sm">
                                    <Typography variant="h1" tone="white" className="text-6xl sm:text-7xl font-mono-numbers leading-none tracking-tighter">{metrics.vendasSemana}</Typography>
                                    <Typography variant="tiny" tone="white" className="opacity-40 uppercase font-black">UNIDADES</Typography>
                                </div>
                                <div className="h-mx-xs w-full bg-white/5 rounded-mx-full overflow-hidden border border-white/5 p-mx-tiny shadow-inner">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 2 }} className="h-full bg-gradient-to-r from-brand-primary to-mx-indigo-400 rounded-mx-full shadow-mx-glow-brand" />
                                </div>
                            </div>
                            <Typography variant="p" tone="white" className="text-base italic opacity-60 leading-relaxed uppercase tracking-tight font-bold">
                                "O sucesso é a soma de pequenos esforços repetidos dia após dia."
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
