import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTrainings } from '@/hooks/useData'
import { useTacticalPrescription } from '@/hooks/useTacticalPrescription'
import { useSellerMetrics } from '@/hooks/useSellerMetrics'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import { Target, TrendingUp, Trophy, Car, Users, Globe, BarChart3, ArrowRight, Crown, Flame, RefreshCw, CalendarDays, History, GraduationCap, Play, Clock, Zap, MessageSquare } from 'lucide-react'
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
        toast.success('Cockpit atualizado!')
    }, [refetchCheckins, refetchGoals, refetchRanking, refetchTrainings])

    const handleShareWhatsApp = useCallback(() => {
        if (!metrics || !profile) return
        const text = formatWhatsAppMorningReport(
            profile.name || 'Especialista',
            { vnd_total: metrics.vendasOntem, leads: 0, visitas: 0, agd_total: metrics.agendamentosHoje },
            { label: 'EM EVOLUÇÃO', color: '' },
            metrics.projecao,
            metrics.meta || 0,
            metrics.atingimento
        )
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [metrics, profile])

    if (checkisLoading || goalsLoading || rankingLoading || trainingsLoading || !metrics) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <Skeleton className="h-mx-14 w-full max-w-mx-2xl" />
                <Skeleton className="h-mx-14 w-48 rounded-mx-xl" />
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg">
                {[1,2,3,4].map(i => <MXScoreCard.Skeleton key={i} />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">

            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-md md:gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <Typography variant="h1">Olá, <span className="text-brand-primary">{profile?.name?.split(' ')[0]}</span> 👋</Typography>
                    </div>
                    <Typography variant="caption" className="uppercase tracking-widest font-black text-mx-micro sm:text-xs">PERFORMANCE INDIVIDUAL • MX ELITE</Typography>
                </div>
                
                <div className="flex flex-row items-center justify-center lg:justify-end gap-mx-sm w-full lg:w-auto">
                    <Button variant="outline" size="icon" onClick={handleShareWhatsApp} className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-status-success-surface text-status-success border-status-success/20">
                        <MessageSquare size={18} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-mx-sm bg-white border border-border-default p-mx-tiny px-4 rounded-mx-2xl shadow-mx-sm">
                        <Trophy size={16} className="text-status-warning" />
                        <Typography variant="h3" className="text-xs sm:text-lg font-black">{metrics.myRank?.position || '--'}º LUGAR</Typography>
                    </div>
                </div>
            </header>

            {!todayCheckin && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
                    <Button asChild className="w-full h-auto p-6 md:p-14 bg-mx-black border-none rounded-mx-3xl text-left shadow-mx-xl group relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-mx-lg">
                        <Link to="/checkin">
                            <div className="flex flex-col sm:flex-row items-center gap-mx-md relative z-10">
                                <div className="w-mx-14 h-mx-14 md:w-mx-20 rounded-mx-xl bg-brand-primary flex items-center justify-center border-4 border-white/10 shrink-0"><Zap size={28} className="text-white" /></div>
                                <div className="text-center sm:text-left">
                                    <Typography variant="h1" tone="white" className="text-xl sm:text-4xl uppercase leading-none">Check-in Pendente</Typography>
                                    <Typography variant="p" tone="white" className="text-[10px] sm:text-lg opacity-60 font-black uppercase tracking-tight">Consolide sua produção no terminal.</Typography>
                                </div>
                            </div>
                            <div className="w-mx-12 h-mx-12 sm:w-mx-2xl rounded-mx-full bg-white text-mx-black flex items-center justify-center shadow-mx-xl mt-4 sm:mt-0"><ArrowRight size={20} strokeWidth={3} /></div>
                        </Link>
                    </Button>
                </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-md md:gap-mx-lg shrink-0">
                <MXScoreCard label="Produção Ontem" value={metrics.vendasOntem} sub="CONSOLIDADO" icon={History} tone="success" />
                <MXScoreCard label="Agenda de Hoje" value={metrics.agendamentosHoje} sub="COMPROMISSOS" icon={CalendarDays} tone="brand" />
                <MXScoreCard label="Projeção MX" value={metrics.projecao} sub="PREDICTIVE" icon={Zap} tone="brand" isHighlight />
                <MXScoreCard label="Meta do Mês" value={metrics.meta || '--'} sub={`${metrics.atingimento}% ATG`} icon={Target} tone="warning" />
            </div>

            <Card className="bg-surface-alt/50 p-mx-lg md:p-14 border-border-default shadow-mx-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-mx-md relative z-10">
                    <Typography variant="h2" className="text-xl md:text-2xl uppercase tracking-tighter">Arena de Elite</Typography>
                    <Button variant="ghost" asChild className="rounded-mx-full px-8 bg-white border border-border-default shadow-sm text-xs font-black w-full sm:w-auto"><Link to="/ranking">Ver Arena Completa</Link></Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg relative z-10">
                    <Card className="p-6 bg-mx-black text-white shadow-mx-elite border-none relative overflow-hidden flex flex-col justify-between py-10 order-first md:order-none mb-2">
                        <div className="text-center relative z-10">
                            <Typography variant="caption" tone="brand" className="mb-2 block font-black uppercase text-[10px]">STATUS ATUAL</Typography>
                            <Typography variant="h1" tone="white" className="text-6xl sm:text-8xl tabular-nums leading-none tracking-tighter">{metrics.myRank?.position || '--'}º</Typography>
                            <Typography variant="tiny" tone="white" className="opacity-40 uppercase font-black text-[10px]">NA UNIDADE</Typography>
                        </div>
                        <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                            <div className="text-center w-1/2 border-r border-white/10"><Typography variant="tiny" tone="white" className="opacity-30 mb-1 block uppercase text-[10px]">VENDIDO</Typography><Typography variant="h3" tone="white" className="text-xl font-mono-numbers">{metrics.vendasMes}</Typography></div>
                            <div className="text-center w-1/2"><Typography variant="tiny" tone="white" className="opacity-30 mb-1 block uppercase text-[10px]">EFICIÊNCIA</Typography><Typography variant="h3" tone="success" className="text-xl font-mono-numbers">{metrics.atingimento}%</Typography></div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-white border-2 border-dashed border-mx-amber-100 flex flex-col justify-center text-center">
                        <Trophy size={32} className="text-status-warning mx-auto mb-4" />
                        <Typography variant="caption" tone="warning" className="font-black uppercase text-[10px]">FOCO NO LÍDER</Typography>
                    </Card>
                    <Card className="p-6 bg-white border-2 border-dashed border-mx-rose-100 flex flex-col justify-center text-center">
                        <Flame size={32} className="text-status-error mx-auto mb-4" />
                        <Typography variant="caption" tone="error" className="font-black uppercase text-[10px]">RETAGUARDA ATIVA</Typography>
                    </Card>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32">
                <div className="lg:col-span-8 space-y-mx-lg">
                    <Card className="p-mx-lg md:p-14 relative overflow-hidden border-none shadow-mx-lg bg-white">
                        <header className="mb-8"><Typography variant="h2" className="text-xl md:text-2xl uppercase tracking-tighter">Matrix de Canais</Typography></header>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-mx-sm">
                            {[
                                { label: 'Porta', value: metrics.porCanal.porta, icon: Car, tone: 'success', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, tone: 'info', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, tone: 'brand', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map((ch, idx) => (
                                <Card key={ch.label} className={cn("p-4 border border-border-default bg-surface-alt/30", idx === 2 && "col-span-2 md:col-span-1")}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-mx-8 h-mx-8 rounded-mx-lg bg-white flex items-center justify-center border border-border-default"><ch.icon size={16} className={cn(ch.tone === 'success' ? "text-status-success" : ch.tone === 'brand' ? "text-brand-primary" : "text-status-info")} /></div>
                                        <Badge variant="outline" className="text-[8px] font-black">{ch.pct}%</Badge>
                                    </div>
                                    <Typography variant="h1" className="text-2xl sm:text-5xl font-mono-numbers mb-0.5 leading-none">{ch.value}</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-widest uppercase font-black text-[8px] opacity-40">{ch.label}</Typography>
                                </Card>
                            ))}
                        </div>
                    </Card>
                </div>
                <aside className="lg:col-span-4">
                    <Card className="bg-mx-black text-white p-mx-lg h-full border-none shadow-mx-xl relative overflow-hidden py-12">
                        <div className="relative z-10 text-center space-y-mx-md">
                            <TrendingUp size={32} className="mx-auto mb-6 opacity-30 text-brand-primary" />
                            <Typography variant="tiny" tone="white" className="opacity-40 font-black uppercase text-[10px]">SPRINT SEMANAL</Typography>
                            <Typography variant="h1" tone="white" className="text-5xl sm:text-7xl font-mono-numbers leading-none tracking-tighter">{metrics.vendasSemana}</Typography>
                            <Typography variant="p" tone="white" className="text-sm italic opacity-60 font-bold uppercase">"O sucesso é o resultado de pequenos esforços."</Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
