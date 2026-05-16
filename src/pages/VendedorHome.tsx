import { useAuth } from '@/hooks/useAuth'
import { CHECKIN_DEADLINE_LABEL, CHECKIN_EDIT_LIMIT_LABEL, useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTrainings } from '@/hooks/useData'
import { useTacticalPrescription } from '@/hooks/useTacticalPrescription'
import { useSellerMetrics } from '@/hooks/useSellerMetrics'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Target, TrendingUp, Trophy, Car, Users, Globe, BarChart3, ArrowRight, Crown, Flame,
    RefreshCw, CalendarDays, History, GraduationCap, Play, Clock, Zap, MessageSquare, ChevronRight, Bell, LifeBuoy, CheckSquare
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { MXScoreCard } from '@/components/molecules/MXScoreCard'
import { PageHeader } from '@/components/molecules/PageHeader'
import { LastUpdated } from '@/components/molecules/LastUpdated'
import { formatWhatsAppMorningReport } from '@/lib/calculations'
import { calculateDailyRoutineDiscipline } from '@/lib/daily-routine'

export default function VendedorHome() {
    const { profile } = useAuth()
    const { checkins, todayCheckin, loading: checkisLoading, fetchCheckins: refetchCheckins, referenceDate } = useCheckins()
    const { storeGoal, sellerGoals, loading: goalsLoading, fetchGoals: refetchGoals } = useGoals()
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
    const { treinamentos, loading: trainingsLoading, refetch: refetchTrainings } = useTrainings()
    const [isRefetching, setIsRefetching] = useState(false)
    const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
    const navigate = useNavigate()

    const tacticalPrescription = useTacticalPrescription({ checkins, treinamentos, userId: profile?.id })
    const metrics = useSellerMetrics({
        checkins,
        todayCheckin,
        profile,
        sellerGoals,
        storeGoal,
        ranking,
        projectionMode: storeGoal?.projection_mode
    })
    const referenceDateLabel = useMemo(() => {
        if (!referenceDate) return 'Referência D-1'
        return new Date(`${referenceDate}T12:00:00`).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        })
    }, [referenceDate])
    const discipline = useMemo(() => {
        if (!profile?.id || !referenceDate) return null
        const end = new Date(`${referenceDate}T12:00:00`)
        const referenceDates = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(end)
            date.setDate(end.getDate() - (6 - index))
            return date.toISOString().slice(0, 10)
        })
        return calculateDailyRoutineDiscipline({ referenceDates, checkins, sellerId: profile.id })
    }, [checkins, profile?.id, referenceDate])
    const referenceCheckin = useMemo(() => {
        if (!profile?.id || !referenceDate) return null
        return checkins.find(c => c.seller_user_id === profile.id && c.reference_date === referenceDate) || null
    }, [checkins, profile?.id, referenceDate])
    const weeklyProgressPct = useMemo(() => {
        if (!metrics?.meta) return 0
        const weeklyGoal = Math.max(Math.round(metrics.meta / 4), 1)
        return Math.min(100, Math.round((metrics.vendasSemana / weeklyGoal) * 100))
    }, [metrics?.meta, metrics?.vendasSemana])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([
                refetchCheckins(),
                refetchGoals(),
                refetchRanking?.() || Promise.resolve(),
                refetchTrainings?.() || Promise.resolve()
            ])
            setLastUpdatedAt(new Date())
            toast.success('Cockpit de performance atualizado!')
        } catch {
            toast.error('Não foi possível atualizar o cockpit.')
        } finally {
            setIsRefetching(false)
        }
    }, [refetchCheckins, refetchGoals, refetchRanking, refetchTrainings])

    const handleShareWhatsApp = useCallback(() => {
        if (!metrics || !profile) return
        const text = formatWhatsAppMorningReport(
            profile.name || 'Especialista',
            referenceDateLabel,
            {
                teamGoal: metrics.meta || 0,
                currentSales: metrics.vendasOntem,
                reaching: metrics.atingimento,
                projection: metrics.projecao,
                gap: Math.max((metrics.meta || 0) - metrics.vendasOntem, 0),
                vnd_total: metrics.vendasOntem,
                leads: referenceCheckin?.leads_prev_day || 0,
                visitas: referenceCheckin?.visit_prev_day || 0,
                agd_total: metrics.agendamentosHoje,
                pendingSellers: []
            },
            []
        )
        const opened = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
        if (!opened) toast.error('Não foi possível abrir o WhatsApp.')
    }, [metrics, profile, referenceCheckin, referenceDateLabel])

    if (checkisLoading || goalsLoading || rankingLoading || trainingsLoading || !metrics) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500 overflow-hidden">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs">
                    <Skeleton className="h-mx-10 w-mx-64" />
                    <Skeleton className="h-mx-xs w-mx-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <MXScoreCard.Skeleton />
                <MXScoreCard.Skeleton />
                <MXScoreCard.Skeleton />
                <MXScoreCard.Skeleton />
            </div>

            <Card className="p-mx-lg md:p-mx-xl bg-white/50 border-dashed border-2 border-border-default rounded-mx-4xl">
                <div className="flex justify-between mb-8">
                    <Skeleton className="h-mx-xs w-mx-48" />
                    <Skeleton className="h-mx-xs w-mx-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                    <Skeleton className="h-mx-64 rounded-mx-3xl" />
                    <Skeleton className="h-mx-96 rounded-mx-3xl" />
                    <Skeleton className="h-mx-64 rounded-mx-3xl" />
                </div>
            </Card>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">

            <PageHeader
                title={`Olá, ${profile?.name?.split(' ')[0]}`}
                description="Painel de performance individual"
                actions={
                    <div className="flex flex-wrap items-center justify-end gap-mx-sm">
                        <LastUpdated value={lastUpdatedAt} className="hidden xl:inline-flex" />
                        <Button
                            variant="outline"
                            onClick={handleShareWhatsApp}
                            className="h-mx-12 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-status-success-surface text-status-success border-status-success/10 hover:bg-status-success hover:text-white transition-all px-mx-md"
                            aria-label="Compartilhar no WhatsApp"
                        >
                            <MessageSquare size={18} />
                            Compartilhar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={isRefetching}
                            aria-label="Atualizar cockpit do vendedor"
                            className="h-mx-12 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white border-border-default px-mx-md"
                        >
                            <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                            Atualizar
                        </Button>
                        <div className="flex items-center gap-mx-sm bg-white border border-border-default p-mx-xs px-6 rounded-mx-2xl sm:rounded-mx-3xl shadow-mx-sm h-mx-14">
                            <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-status-warning text-white flex items-center justify-center shadow-mx-md">
                                <Trophy size={16} className="fill-white/20" />
                            </div>
                            <div className="min-w-0">
                                <Typography variant="tiny" tone="muted" className="mb-0 block uppercase font-black tracking-mx-wide text-mx-nano">Ranking</Typography>
                                <Typography variant="h3" className="text-sm sm:text-base font-black whitespace-nowrap uppercase leading-none">{metrics.myRank?.position || '--'}º LUGAR</Typography>
                            </div>
                        </div>
                    </div>
                }
            />

            <Card className="shrink-0 border border-border-default bg-white p-mx-md shadow-mx-sm">
                <div className="flex flex-col gap-mx-md lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <Typography variant="h3" className="uppercase tracking-tight">Ritual de hoje</Typography>
                        <Typography variant="p" tone="muted" className="text-sm">
                            Primeiro confira o lançamento obrigatório; depois veja alertas e suporte sem sair da rotina.
                        </Typography>
                    </div>
                    <div className="grid grid-cols-1 gap-mx-xs sm:grid-cols-3 lg:min-w-mx-card-lg">
                        <Button asChild variant={todayCheckin ? 'outline' : 'primary'} className="h-mx-12 rounded-mx-xl justify-start">
                            <Link to="/lancamento-diario">
                                <CheckSquare size={16} className="mr-2" />
                                {todayCheckin ? 'Revisar lançamento' : 'Fazer lançamento'}
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-mx-12 rounded-mx-xl justify-start bg-white">
                            <Link to="/notificacoes">
                                <Bell size={16} className="mr-2" />
                                Ver alertas
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-mx-12 rounded-mx-xl justify-start bg-white">
                            <Link to="/ajuda">
                                <LifeBuoy size={16} className="mr-2" />
                                Ajuda
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>

            {!todayCheckin && (
                <motion.section
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="shrink-0"
                    aria-labelledby="daily-checkin-title"
                >
                    <Link
                        to="/lancamento-diario"
                        className="group relative grid w-full min-w-0 gap-mx-lg overflow-hidden rounded-mx-3xl bg-brand-primary p-mx-md text-white shadow-mx-xl transition-all hover:-translate-y-0.5 hover:shadow-mx-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/30 md:grid-cols-[1fr_auto] md:items-center md:p-mx-lg"
                    >
                        <div className="absolute inset-y-mx-0 right-mx-0 w-1/2 bg-gradient-to-l from-white/15 to-transparent pointer-events-none" aria-hidden="true" />
                        <div className="relative z-10 flex min-w-0 flex-col gap-mx-md sm:flex-row sm:items-center">
                            <div className="flex h-mx-16 w-mx-16 shrink-0 items-center justify-center rounded-mx-2xl border border-white/15 bg-white/10 shadow-mx-lg transition-transform group-hover:rotate-3">
                                <Zap size={28} className="fill-white/20" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 space-y-mx-xs">
                                <div className="flex flex-wrap items-center gap-mx-xs">
                                    <Badge variant="outline" className="border-white/20 bg-white/15 px-3 py-1 text-white shadow-none">
                                        Pendente
                                    </Badge>
                                    <Typography variant="tiny" tone="white" className="font-black tracking-mx-widest opacity-75">
                                        Prazo {CHECKIN_DEADLINE_LABEL} · Edição até {CHECKIN_EDIT_LIMIT_LABEL}
                                    </Typography>
                                </div>
                                <Typography id="daily-checkin-title" variant="h2" tone="white" className="text-xl leading-tight sm:text-3xl">
                                    Lançamento Diário
                                </Typography>
                                <Typography variant="p" tone="white" className="max-w-3xl text-sm opacity-85">
                                    Etapa 1: produção de {referenceDateLabel}. Etapa 2: agenda de hoje. As datas ficam separadas para evitar troca no início do expediente.
                                </Typography>
                            </div>
                        </div>
                        <div className="relative z-10 flex min-w-0 items-center justify-between gap-mx-md rounded-mx-2xl bg-white px-mx-md py-mx-sm text-brand-secondary shadow-mx-lg md:min-w-mx-64">
                            <div className="min-w-0">
                                <Typography variant="tiny" className="block text-brand-secondary/60">Ação obrigatória</Typography>
                                <Typography variant="caption" className="block truncate text-brand-secondary">Abrir lançamento</Typography>
                            </div>
                            <div className="flex h-mx-12 w-mx-12 shrink-0 items-center justify-center rounded-mx-xl bg-brand-primary text-white transition-transform group-hover:translate-x-1">
                                <ArrowRight size={20} strokeWidth={3} aria-hidden="true" />
                            </div>
                        </div>
                    </Link>
                </motion.section>
            )}

            <AnimatePresence>
                {tacticalPrescription && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="shrink-0">
                        <Card className="bg-mx-black text-white p-mx-lg md:p-mx-xl border-none shadow-mx-xl relative overflow-hidden group rounded-mx-4xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-transparent pointer-events-none" />
                            <div className="flex flex-col lg:flex-row lg:items-center gap-mx-lg relative z-10">
                                <div className="w-mx-20 h-mx-20 rounded-mx-3xl bg-white text-brand-primary flex items-center justify-center shadow-mx-xl group-hover:rotate-6 transition-transform shrink-0 mx-auto lg:mx-0 border-4 border-white/10">
                                    <GraduationCap size={40} />
                                </div>
                                <div className="flex-1 space-y-mx-xs text-center lg:text-left">
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-mx-xs">
                                        <Badge variant="warning" className="px-4 py-1 uppercase font-black text-mx-nano shadow-sm bg-brand-primary border-none text-white">Reciclagem</Badge>
                                        <Typography variant="tiny" tone="white" className="opacity-60 uppercase font-black tracking-mx-widest text-mx-nano">Gap: {tacticalPrescription.gargalo}</Typography>
                                    </div>
                                    <Typography variant="h2" tone="white" className="text-2xl sm:text-4xl tracking-tighter uppercase leading-none font-black">Domine sua {tacticalPrescription.training.type}</Typography>
                                    <Typography variant="p" tone="white" className="opacity-80 max-w-2xl text-sm sm:text-lg font-bold italic line-clamp-2">"{tacticalPrescription.label}"</Typography>
                                </div>
                                <Button size="lg" variant="secondary" onClick={() => navigate('/treinamentos')} className="rounded-mx-full px-12 h-mx-16 shadow-mx-xl font-black uppercase tracking-mx-wide text-xs w-full lg:w-auto bg-white text-mx-black hover:bg-brand-primary hover:text-white transition-all border-none">
                                    <Play size={16} className="fill-current mr-2" /> TREINAR AGORA
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-md md:gap-mx-lg shrink-0">
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

            {discipline && (
                <Card className="p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg bg-white rounded-mx-4xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg">
                        <div className="flex items-center gap-mx-md min-w-0">
                            <div className={cn(
                                "w-mx-16 h-mx-16 rounded-mx-2xl flex items-center justify-center shadow-mx-inner border shrink-0",
                                discipline.status === 'consistent' ? 'bg-status-success-surface text-status-success border-status-success/20' : 'bg-status-warning-surface text-status-warning border-status-warning/20',
                            )}>
                                <Flame size={28} />
                            </div>
                            <div className="min-w-0">
                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest">Disciplina de lançamento</Typography>
                                <Typography variant="h2" className="text-2xl sm:text-3xl uppercase tracking-tight">{discipline.label}</Typography>
                                <Typography variant="p" tone="muted" className="text-sm">
                                    {discipline.submitted_days}/{discipline.expected_days} puxadas realizadas nos últimos 7 dias.
                                </Typography>
                            </div>
                        </div>
                        <div className="flex items-center gap-mx-md">
                            <Typography variant="h1" tone={discipline.status === 'consistent' ? 'success' : 'warning'} className="text-5xl tabular-nums leading-none">{discipline.percentage}%</Typography>
                            <Badge variant={discipline.status === 'consistent' ? 'success' : 'warning'} className="rounded-mx-full px-4 py-1">
                                {discipline.pending_days} pend.
                            </Badge>
                        </div>
                    </div>
                </Card>
            )}

            <Card className="bg-white p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg relative overflow-hidden group rounded-mx-4xl">
                <CardHeader className="flex flex-col sm:flex-row items-center justify-between mb-12 relative z-10 gap-mx-md p-mx-0 border-none bg-transparent">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-status-warning text-white flex items-center justify-center shadow-mx-md"><Trophy size={28} /></div>
                        <div>
                            <CardTitle className="text-2xl md:text-3xl leading-tight font-black">Ranking da Unidade</CardTitle>
                            <CardDescription className="font-black text-mx-tiny tracking-mx-wide mt-1">Sua posição no período atual</CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" asChild className="rounded-mx-full px-8 h-mx-12 bg-surface-alt border border-border-default shadow-mx-sm uppercase font-black tracking-widest text-mx-tiny w-full sm:w-auto hover:border-brand-primary transition-all">
                        <Link to="/classificacao">Ver ranking completo</Link>
                    </Button>
                </CardHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg relative z-10 items-stretch">
                    <Card className={cn("p-mx-lg border-2 border-dashed flex flex-col justify-center rounded-mx-3xl", metrics.competitors?.above ? "bg-white border-mx-green-100 shadow-mx-md" : "bg-surface-alt opacity-40 border-border-default")}>
                        {metrics.competitors?.above ? (
                            <>
                            <Typography variant="tiny" tone="brand" className="mb-6 block font-black uppercase tracking-mx-widest">Próxima referência</Typography>
                                <div className="flex items-center gap-mx-sm mb-8">
                                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-warning-surface text-status-warning flex items-center justify-center font-black text-xl border border-status-warning/10 shadow-inner shrink-0 font-mono-numbers">{metrics.myRank?.position ? metrics.myRank.position - 1 : '--'}º</div>
                                    <div className="min-w-0">
                                        <Typography variant="h3" className="text-lg uppercase tracking-tight truncate font-black">{metrics.competitors.above.user_name}</Typography>
                                        <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">{metrics.competitors.above.vnd_total} VENDAS</Typography>
                                    </div>
                                </div>
                                <div className="bg-status-success-surface rounded-mx-xl p-mx-sm text-center border border-status-success/10">
                                    <Typography variant="tiny" tone="brand" className="font-black uppercase text-mx-tiny">GAP: {metrics.competitors.above.vnd_total - metrics.vendasMes} VENDAS</Typography>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6 md:py-10">
                                <Crown size={48} className="text-status-warning mx-auto mb-4 animate-bounce" />
                                <Typography variant="caption" tone="brand" className="tracking-mx-widest font-black uppercase text-mx-tiny">Você está em 1º</Typography>
                            </div>
                        )}
                    </Card>

                    <Card className="p-mx-lg md:p-mx-xl bg-mx-black text-white shadow-mx-elite transform md:scale-105 border-none relative overflow-hidden flex flex-col justify-between py-12 md:py-16 order-first md:order-none mb-4 md:mb-0 rounded-mx-4xl">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/20 rounded-mx-full blur-mx-4xl" aria-hidden="true" />
                        <div className="text-center relative z-10">
                            <Typography variant="tiny" tone="brand" className="mb-4 block tracking-mx-widest font-black uppercase">STATUS ATUAL</Typography>
                            <Typography variant="h1" tone="white" className="text-7xl sm:text-9xl tabular-nums leading-none mb-2 tracking-tighter font-black font-mono-numbers">{metrics.myRank?.position || '--'}º</Typography>
                            <Typography variant="tiny" tone="white" className="uppercase tracking-mx-widest font-black text-mx-tiny opacity-40">NA UNIDADE</Typography>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                            <div>
                                <Typography variant="tiny" tone="white" className="opacity-30 mb-1 block uppercase font-black text-mx-nano">VENDIDO</Typography>
                                <Typography variant="h3" tone="white" className="text-xl sm:text-3xl font-mono-numbers font-black">{metrics.vendasMes}</Typography>
                            </div>
                            <div className="text-right">
                                <Typography variant="tiny" tone="white" className="opacity-30 mb-1 block uppercase font-black text-mx-nano">EFICIÊNCIA</Typography>
                                <Typography variant="h3" tone="brand" className="text-xl sm:text-3xl font-mono-numbers font-black">{metrics.atingimento}%</Typography>
                            </div>
                        </div>
                    </Card>

                    <Card className={cn("p-mx-lg border-2 border-dashed flex flex-col justify-center rounded-mx-3xl", metrics.competitors?.below ? "bg-white border-mx-rose-100 shadow-mx-md" : "bg-surface-alt opacity-40 border-border-default")}>
                        {metrics.competitors?.below ? (
                            <>
                                <Typography variant="tiny" tone="error" className="mb-6 block uppercase font-black tracking-mx-widest">Próximo na lista</Typography>
                                <div className="flex items-center gap-mx-sm mb-8">
                                    <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-status-error-surface text-status-error flex items-center justify-center font-black text-xl border border-status-error/10 shadow-inner shrink-0 font-mono-numbers">{metrics.myRank?.position ? metrics.myRank.position + 1 : '--'}º</div>
                                    <div className="min-w-0">
                                        <Typography variant="h3" className="text-lg uppercase tracking-tight truncate font-black">{metrics.competitors.below.user_name}</Typography>
                                        <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">{metrics.competitors.below.vnd_total} VENDAS</Typography>
                                    </div>
                                </div>
                                <div className="bg-status-error-surface rounded-mx-xl p-mx-sm text-center border border-status-error/10">
                                    <Typography variant="tiny" tone="error" className="font-black uppercase text-mx-tiny">VANTAGEM: {metrics.vendasMes - metrics.competitors.below.vnd_total} VENDAS</Typography>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6 md:py-10">
                                <Flame size={48} className="text-status-error mx-auto mb-4" />
                                <Typography variant="caption" tone="error" className="tracking-mx-widest font-black uppercase text-mx-tiny">Sem comparação inferior</Typography>
                            </div>
                        )}
                    </Card>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32 relative z-10">
                <div className="lg:col-span-8 space-y-mx-lg">
                    <Card className="p-mx-lg md:p-mx-xl relative overflow-hidden group border border-border-default shadow-mx-lg bg-white rounded-mx-4xl">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-mx-3xl -mr-48 -mt-48 pointer-events-none" aria-hidden="true" />
                        <CardHeader className="flex flex-row items-center justify-between mb-12 relative z-10 p-mx-0 bg-transparent border-none">
                            <div>
                                <CardTitle className="text-2xl md:text-3xl mb-2 uppercase tracking-tighter leading-none font-black">Matrix de Canais</CardTitle>
                                <CardDescription className="uppercase font-black text-mx-tiny tracking-mx-widest">DISTRIBUIÇÃO DE FECHAMENTOS POR ORIGEM</CardDescription>
                            </div>
                            <div className="w-mx-12 h-mx-12 md:w-mx-14 md:h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-text-tertiary shadow-mx-inner shrink-0"><BarChart3 size={24} /></div>
                        </CardHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-md md:gap-mx-lg relative z-10">
                            {[
                                { label: 'Porta', value: metrics.porCanal.porta, icon: Car, tone: 'success', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, tone: 'info', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, tone: 'brand', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <Card key={ch.label} className="p-mx-md md:p-mx-lg border border-border-default hover:border-brand-primary/20 hover:shadow-mx-xl transition-all group/item bg-surface-alt/30 rounded-mx-3xl">
                                    <div className="flex justify-between items-start mb-8 md:mb-10">
                                        <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-white flex items-center justify-center shadow-mx-sm border border-border-default group-hover/item:rotate-6 transition-transform shrink-0">
                                            <ch.icon size={20} className={cn(ch.tone === 'success' ? "text-status-success" : ch.tone === 'brand' ? "text-brand-primary" : "text-status-info")} />
                                        </div>
                                        <Badge variant="outline" className="text-mx-nano font-mono-numbers font-black border-border-strong px-2">{ch.pct}%</Badge>
                                    </div>
                                    <Typography variant="h1" className="text-4xl sm:text-6xl font-mono-numbers mb-1 leading-none font-black">{ch.value}</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-mx-widest uppercase font-black text-mx-nano">{ch.label}</Typography>
                                </Card>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-mx-lg md:p-mx-xl border border-border-default shadow-mx-lg bg-white rounded-mx-4xl">
                        <CardHeader className="flex flex-row items-center gap-mx-sm mb-12 p-mx-0 bg-transparent border-none">
                            <div className="w-mx-12 h-mx-12 md:w-mx-14 md:h-mx-14 rounded-mx-xl bg-status-info-surface text-status-info border border-status-info/10 flex items-center justify-center shadow-mx-inner shrink-0"><Clock size={24} /></div>
                            <div>
                                <CardTitle className="text-2xl md:text-3xl uppercase tracking-tighter leading-none font-black">Rotina MX</CardTitle>
                                <CardDescription className="uppercase font-black text-mx-tiny tracking-mx-widest">AGENDA DE ALTA PERFORMANCE</CardDescription>
                            </div>
                        </CardHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md">
                            {[
                                { time: '1', task: 'Energia', desc: 'Foco e preparação da abordagem.' },
                                { time: '2', task: 'Organização', desc: 'Terminal MX e estratégia.' },
                                { time: '3', task: 'Leads', desc: 'Boas-vindas e classificação.' },
                                { time: '4', task: 'Prospecção', desc: 'Carteira e redes sociais.' },
                                { time: '5', task: 'Atendimento', desc: 'Execução de agendados.' },
                                { time: '6', task: 'Recuperação', desc: 'Objeções e lista quente.' },
                                { time: '7', task: 'Fechamento', desc: 'Preparação D+1.' },
                            ].map((r, i) => (
                                <div key={i} className="flex items-center gap-mx-md p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all group/task">
                                    <Typography variant="mono" tone="brand" className="text-sm font-black shrink-0 font-mono-numbers">{r.time}</Typography>
                                    <div className="w-px h-mx-lg bg-border-strong opacity-30 group-hover/task:bg-brand-primary/30 transition-colors" />
                                    <div className="min-w-0">
                                        <Typography variant="h3" className="text-sm block mb-0.5 uppercase font-black truncate">{r.task}</Typography>
                                        <Typography variant="tiny" tone="muted" className="lowercase tracking-normal italic opacity-60 line-clamp-1 text-mx-tiny">"{r.desc}"</Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <aside className="lg:col-span-4 h-full">
                    <Card className="bg-mx-black text-white p-mx-lg md:p-mx-xl h-full border-none shadow-mx-xl relative overflow-hidden group min-h-mx-96 rounded-mx-4xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-transparent z-0 opacity-50 pointer-events-none" aria-hidden="true" />
                        <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:rotate-12 transition-transform duration-700 pointer-events-none" aria-hidden="true"><Zap size={400} fill="currentColor" /></div>

                        <CardHeader className="flex flex-row items-center justify-between mb-16 relative z-10 p-mx-0 bg-transparent border-none">
                            <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-mx-inner group-hover:bg-brand-primary transition-colors shrink-0">
                                <TrendingUp size={24} />
                            </div>
                            <Badge variant="outline" className="text-white border-white/20 px-4 font-black text-mx-nano h-mx-md uppercase tracking-mx-widest">WEEKLY SPRINT</Badge>
                        </CardHeader>

                        <div className="relative z-10 space-y-mx-2xl">
                            <div className="space-y-mx-lg">
                                <Typography variant="tiny" tone="brand" className="tracking-mx-widest font-black uppercase">PERFORMANCE DA SEMANA</Typography>
                                <div className="flex items-baseline gap-mx-sm">
                                    <Typography variant="h1" tone="white" className="text-6xl sm:text-8xl font-black font-mono-numbers leading-none tracking-tighter">{metrics.vendasSemana}</Typography>
                                    <Typography variant="tiny" tone="white" className="uppercase font-black text-mx-tiny opacity-40">UNIDADES</Typography>
                                </div>
                                <div className="h-mx-xs w-full bg-white/5 rounded-mx-full overflow-hidden border border-white/5 p-mx-tiny shadow-mx-inner">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${weeklyProgressPct}%` }} transition={{ duration: 2 }} className="h-full bg-gradient-to-r from-brand-primary to-brand-primary/50 rounded-mx-full shadow-mx-glow-brand" />
                                </div>
                            </div>
                            <Typography variant="p" tone="white" className="text-base md:text-lg italic opacity-60 leading-relaxed uppercase tracking-tight font-black italic">
                                "O sucesso é a soma de pequenos esforços repetidos dia após dia."
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
