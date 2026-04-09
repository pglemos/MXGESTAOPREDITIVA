import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTrainings } from '@/hooks/useData'
import { calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, Link } from 'react-router-dom'
import { Target, TrendingUp, Trophy, CheckSquare, Car, Users, Globe, BarChart3, AlertTriangle, ArrowRight, Star, ArrowUpRight, Zap, Sparkles, LayoutDashboard, Crown, Flame, RefreshCw, Phone, CalendarDays, History, GraduationCap, Play, Clock } from 'lucide-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { startOfWeek } from 'date-fns'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function VendedorHome() {
    const { profile } = useAuth()
    const { checkins, todayCheckin, loading: checkisLoading, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, sellerGoals, loading: goalsLoading, fetchGoals: refetchGoals } = useGoals()
    const { ranking, loading: rankingLoading, refetch: refetchRanking } = useRanking()
    const { trainings, loading: trainingsLoading, refetch: refetchTrainings } = useTrainings()
    const [isRefetching, setIsRefetching] = useState(false)
    const navigate = useNavigate()

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

    // 🚀 Lógica de Prescrição MX na Home
    const tacticalPrescription = useMemo(() => {
        if (!checkins.length || !trainings.length) return null
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split('T')[0]
        const recentCheckins = checkins.filter(c => c.seller_user_id === profile?.id && c.reference_date >= weekStart)
        if (recentCheckins.length === 0) return null

        const funil = calcularFunil(recentCheckins)
        const diag = gerarDiagnosticoMX(funil)
        if (!diag.gargalo) return null

        const categoryMap: Record<string, string> = {
            'LEAD_AGD': 'prospeccao',
            'AGD_VISITA': 'atendimento',
            'VISITA_VND': 'fechamento'
        }

        const category = categoryMap[diag.gargalo]
        const recommended = trainings.find(t => t.type === category && !t.watched)
        if (!recommended) return null

        return { gargalo: diag.gargalo, label: diag.diagnostico, training: recommended }
    }, [checkins, trainings, profile?.id])

    const metrics = useMemo(() => {
        const myCheckins = checkins.filter(c => c.seller_user_id === profile?.id)
        const vendasMes = somarVendas(myCheckins)
        const porCanal = somarVendasPorCanal(myCheckins)
        const dias = getDiasInfo()

        const myGoal = sellerGoals.find(g => g.user_id === profile?.id)
        const meta = myGoal?.target || (storeGoal ? Math.round(storeGoal.target / Math.max(ranking.length, 1)) : 0)
        const atingimento = calcularAtingimento(vendasMes, meta)
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        const myRank = ranking.find(r => r.user_id === profile?.id)
        const myRankIndex = ranking.findIndex(r => r.user_id === profile?.id)
        const competitors = {
            above: myRankIndex > 0 ? ranking[myRankIndex - 1] : null,
            below: myRankIndex < ranking.length - 1 ? ranking[myRankIndex + 1] : null
        }

        const yesterdayStr = new Date(); yesterdayStr.setDate(yesterdayStr.getDate() - 1)
        const yesterdayFormatted = yesterdayStr.toISOString().split('T')[0]
        const checkinOntem = myCheckins.find(c => c.reference_date === yesterdayFormatted)
        
        const vendasOntem = checkinOntem ? (checkinOntem.vnd_porta_prev_day || 0) + (checkinOntem.vnd_cart_prev_day || 0) + (checkinOntem.vnd_net_prev_day || 0) : 0
        const agendamentosHoje = todayCheckin ? (todayCheckin.agd_cart_today || 0) + (todayCheckin.agd_net_today || 0) : 0

        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
        const weekStr = weekAgo.toISOString().split('T')[0]
        const vendasSemana = somarVendas(myCheckins.filter(c => c.reference_date >= weekStr))

        return { 
            vendasMes, porCanal, meta, atingimento, projecao, myRank, 
            vendasOntem, agendamentosHoje, vendasSemana, competitors 
        }
    }, [checkins, profile, sellerGoals, storeGoal, ranking, todayCheckin])


    if (checkisLoading || goalsLoading || rankingLoading || trainingsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Suas Metas...</Typography>
        </div>
    )

    const StatCard = ({ icon: Icon, label, value, sub, tone, index }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="p-8 h-full flex flex-col justify-between group hover:shadow-mx-xl hover:-translate-y-1 transition-all border-none shadow-mx-lg">
                <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-mx-sm transition-transform group-hover:scale-110", 
                        tone === 'success' ? "bg-status-success-surface border-mx-emerald-100 text-status-success" : 
                        tone === 'info' ? "bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary" : 
                        tone === 'warning' ? "bg-status-warning-surface border-mx-amber-100 text-status-warning" : 
                        "bg-mx-black text-mx-indigo-400 border-white/5")}>
                        <Icon size={24} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="relative z-10">
                    <Typography variant="caption" tone="muted" className="mb-2 block">{label}</Typography>
                    <div className="flex items-baseline gap-3">
                        <Typography variant="h1" className="text-4xl font-mono-numbers">{value}</Typography>
                        {sub && <Badge variant="outline" className="text-[8px]">{sub}</Badge>}
                    </div>
                </div>
            </Card>
        </motion.div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">

            {/* Header / Top Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Olá, <span className="text-brand-primary">{profile?.name?.split(' ')[0]}</span> 👋</Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Painel de Performance Individual • MX ELITE</Typography>
                </div>
                
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <div className="flex items-center gap-4 bg-white border border-border-default p-2 pr-8 rounded-mx-3xl shadow-mx-sm">
                        <div className="w-12 h-12 rounded-mx-xl bg-status-warning text-white flex items-center justify-center shadow-mx-md">
                            <Trophy size={22} className="fill-white/20" />
                        </div>
                        <div>
                            <Typography variant="caption" tone="muted" className="mb-0.5">Status Arena</Typography>
                            <Typography variant="h3" className="text-lg">{metrics.myRank?.position || '--'}º POSIÇÃO</Typography>
                        </div>
                    </div>
                </div>
            </header>

            {/* Prescrição Tática MX */}
            <AnimatePresence>
                {tacticalPrescription && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="shrink-0">
                        <Card className="bg-brand-primary text-white p-10 md:p-14 border-none shadow-mx-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" aria-hidden="true" />
                            <div className="flex flex-col lg:flex-row lg:items-center gap-10 relative z-10">
                                <div className="w-20 h-20 rounded-mx-3xl bg-white text-brand-primary flex items-center justify-center shadow-mx-xl transform group-hover:rotate-6 transition-transform">
                                    <GraduationCap size={40} />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="danger" className="px-4 py-1">Correção Obrigatória</Badge>
                                        <Typography variant="caption" tone="white" className="opacity-60">Gap: {tacticalPrescription.gargalo}</Typography>
                                    </div>
                                    <Typography variant="h2" tone="white">Masterize sua {tacticalPrescription.training.type}</Typography>
                                    <Typography variant="p" tone="white" className="opacity-80 max-w-2xl">{tacticalPrescription.label}</Typography>
                                </div>
                                <Button size="lg" variant="secondary" onClick={() => navigate('/treinamentos')} className="rounded-full px-12 h-16 shadow-mx-xl">
                                    <Play size={18} className="fill-current mr-2" /> INICIAR AGORA
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Check-in CTA */}
            {!todayCheckin && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="shrink-0">
                    <Button 
                        asChild
                        className="w-full h-auto p-10 md:p-14 bg-pure-black border-none rounded-mx-3xl text-left shadow-mx-xl group relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-10"
                    >
                        <Link to="/checkin">
                            <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                            <div className="flex flex-col lg:flex-row lg:items-center gap-10 relative z-10">
                                <div className="w-20 h-20 rounded-mx-3xl bg-brand-primary flex items-center justify-center border-4 border-white/10 shadow-mx-xl group-hover:rotate-12 transition-transform">
                                    <Zap size={40} className="text-white fill-white/20" />
                                </div>
                                <div className="max-w-2xl space-y-2">
                                    <Typography variant="h1" tone="white" className="text-4xl tracking-tighter">Status Pendente</Typography>
                                    <Typography variant="p" tone="white" className="text-lg opacity-60">Sua produção de ontem ainda não foi indexada no terminal MX.</Typography>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 relative z-10 group/btn">
                                <Typography variant="caption" tone="white" className="opacity-40 group-hover/btn:opacity-100 transition-opacity">CONSOLIDAR ONTEM</Typography>
                                <div className="w-16 h-16 rounded-full bg-white text-pure-black flex items-center justify-center shadow-mx-xl group-hover:scale-110 transition-transform">
                                    <ArrowRight size={28} strokeWidth={2.5} />
                                </div>
                            </div>
                        </Link>
                    </Button>
                </motion.div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <StatCard index={0} icon={History} label="Produção Ontem" value={metrics.vendasOntem} sub="CONSOLIDADO" tone="success" />
                <StatCard index={1} icon={CalendarDays} label="Agenda de Hoje" value={metrics.agendamentosHoje} sub="COMPROMISSOS" tone="info" />
                <StatCard index={2} icon={Zap} label="Projeção MX" value={metrics.projecao} sub="PREDICTIVE" />
                <StatCard index={3} icon={Target} label="Meta do Mês" value={metrics.meta || '--'} sub={`${metrics.atingimento}% ATG`} tone="warning" />
            </div>

            {/* Arena de Elite */}
            <Card className="bg-surface-alt/50 p-10 md:p-14 border-border-default shadow-mx-sm relative overflow-hidden group">
                <div className="flex items-center justify-between mb-12 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-status-warning text-white flex items-center justify-center shadow-mx-md"><Trophy size={28} /></div>
                        <div>
                            <Typography variant="h2">Arena de Elite</Typography>
                            <Typography variant="caption" tone="muted">Sua Posição no Campo de Batalha</Typography>
                        </div>
                    </div>
                    <Button variant="ghost" asChild className="rounded-full px-6 uppercase tracking-widest text-[10px]">
                        <Link to="/ranking">Ver Arena Completa</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg relative z-10 items-stretch">
                    {/* Próximo Alvo */}
                    <Card className={cn("p-8 border-2 border-dashed flex flex-col justify-center", metrics.competitors.above ? "bg-white border-mx-amber-100 shadow-mx-md" : "bg-surface-alt/50 border-border-default opacity-40")}>
                        {metrics.competitors.above ? (
                            <>
                                <Typography variant="caption" tone="warning" className="mb-6 block">Próximo Alvo</Typography>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-mx-xl bg-mx-amber-50 text-status-warning flex items-center justify-center font-black text-xl border border-mx-amber-100 shadow-inner">{metrics.myRank?.position ? metrics.myRank.position - 1 : '--'}º</div>
                                    <div>
                                        <Typography variant="h3" className="text-base">{metrics.competitors.above.user_name}</Typography>
                                        <Typography variant="caption" tone="muted">{metrics.competitors.above.vnd_total} VENDAS</Typography>
                                    </div>
                                </div>
                                <div className="bg-mx-amber-50 rounded-mx-xl p-4 text-center border border-mx-amber-100/50">
                                    <Typography variant="caption" tone="warning" className="text-[9px]">GAP: {metrics.competitors.above.vnd_total - metrics.vendasMes} VENDAS PARA SUPERAR</Typography>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <Crown size={48} className="text-status-warning mx-auto mb-4" />
                                <Typography variant="caption" tone="brand" className="tracking-[0.4em]">VOCÊ É O TOPO DA ARENA</Typography>
                            </div>
                        )}
                    </Card>

                    {/* Posição Atual */}
                    <Card className="p-10 bg-pure-black text-white shadow-mx-elite transform md:scale-105 border-none relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl" aria-hidden="true" />
                        <div className="text-center relative z-10">
                            <Typography variant="caption" tone="brand" className="mb-4 block tracking-[0.4em]">STATUS ATUAL</Typography>
                            <Typography variant="h1" tone="white" className="text-8xl tabular-nums leading-none mb-2">{metrics.myRank?.position || '--'}º</Typography>
                            <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest">NA UNIDADE</Typography>
                        </div>
                        <div className="mt-10 pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                            <div>
                                <Typography variant="caption" tone="white" className="opacity-30 mb-1 block">VENDIDO</Typography>
                                <Typography variant="h3" tone="white" className="text-2xl">{metrics.vendasMes}</Typography>
                            </div>
                            <div className="text-right">
                                <Typography variant="caption" tone="white" className="opacity-30 mb-1 block">EFICIÊNCIA</Typography>
                                <Typography variant="h3" tone="success" className="text-2xl">{metrics.atingimento}%</Typography>
                            </div>
                        </div>
                    </Card>

                    {/* Na Cola */}
                    <Card className={cn("p-8 border-2 border-dashed flex flex-col justify-center", metrics.competitors.below ? "bg-white border-mx-rose-100 shadow-mx-md" : "bg-surface-alt/50 border-border-default opacity-40")}>
                        {metrics.competitors.below ? (
                            <>
                                <Typography variant="caption" tone="error" className="mb-6 block">Na sua retaguarda</Typography>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-mx-xl bg-mx-rose-50 text-status-error flex items-center justify-center font-black text-xl border border-mx-rose-100 shadow-inner">{metrics.myRank?.position ? metrics.myRank.position + 1 : '--'}º</div>
                                    <div>
                                        <Typography variant="h3" className="text-base">{metrics.competitors.below.user_name}</Typography>
                                        <Typography variant="caption" tone="muted">{metrics.competitors.below.vnd_total} VENDAS</Typography>
                                    </div>
                                </div>
                                <div className="bg-mx-rose-50 rounded-mx-xl p-4 text-center border border-mx-rose-100/50">
                                    <Typography variant="caption" tone="error" className="text-[9px]">VANTAGEM: {metrics.vendasMes - metrics.competitors.below.vnd_total} VENDAS</Typography>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <Flame size={48} className="text-status-error mx-auto mb-4" />
                                <Typography variant="caption" tone="error" className="tracking-[0.4em]">MANTENHA A DISTÂNCIA</Typography>
                            </div>
                        )}
                    </Card>
                </div>
            </Card>

            {/* Bottom Grid: Channels & Routine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-20">
                <div className="lg:col-span-8 space-y-mx-lg">
                    {/* Matrix de Canais */}
                    <Card className="p-10 md:p-14 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -mr-48 -mt-48" aria-hidden="true" />
                        <header className="flex items-center justify-between mb-12 relative z-10">
                            <div>
                                <Typography variant="h2" className="mb-2">Matrix de Canais</Typography>
                                <Typography variant="p" tone="muted">Distribuição de fechamentos por origem.</Typography>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border-default flex items-center justify-center text-text-tertiary shadow-inner"><BarChart3 size={28} /></div>
                        </header>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-lg relative z-10">
                            {[
                                { label: 'Porta', value: metrics.porCanal.porta, icon: Car, tone: 'success', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, tone: 'info', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, tone: 'brand', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <Card key={ch.label} className="p-8 border border-border-default hover:border-brand-primary/20 hover:shadow-mx-lg transition-all group/item bg-surface-alt/30">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-12 h-12 rounded-mx-xl bg-white flex items-center justify-center shadow-mx-sm border border-border-default group-hover/item:rotate-6 transition-transform">
                                            <ch.icon size={22} className={cn(ch.tone === 'success' ? "text-status-success" : ch.tone === 'brand' ? "text-brand-primary" : "text-status-info")} />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-mono-numbers">{ch.pct}%</Badge>
                                    </div>
                                    <Typography variant="h1" className="text-5xl font-mono-numbers mb-1">{ch.value}</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-widest">{ch.label}</Typography>
                                </Card>
                            ))}
                        </div>
                    </Card>

                    {/* Routine */}
                    <Card className="p-10 md:p-14">
                        <header className="flex items-center gap-4 mb-12">
                            <div className="w-14 h-14 rounded-2xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-mx-sm"><Clock size={28} /></div>
                            <div>
                                <Typography variant="h2">Rotina MX</Typography>
                                <Typography variant="caption" tone="muted">Agenda de Alta Performance</Typography>
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
                                <div key={i} className="flex items-center gap-6 p-6 rounded-mx-xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-sm transition-all group/task">
                                    <Typography variant="h3" tone="brand" className="text-sm font-mono-numbers shrink-0">{r.time}</Typography>
                                    <div className="w-px h-8 bg-border-strong group-hover/task:bg-brand-primary/30 transition-colors" />
                                    <div>
                                        <Typography variant="caption" className="text-text-primary block mb-0.5">{r.task}</Typography>
                                        <Typography variant="p" className="text-[10px] opacity-50 lowercase tracking-normal">{r.desc}</Typography>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Weekly Sprint */}
                <aside className="lg:col-span-4">
                    <Card className="bg-pure-black text-white p-10 md:p-14 h-full border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-transparent z-0" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:rotate-12 transition-transform duration-700"><Zap size={240} fill="currentColor" /></div>
                        
                        <header className="flex items-center justify-between mb-16 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-brand-primary transition-colors">
                                <TrendingUp size={28} className="text-white" />
                            </div>
                            <Badge variant="outline" className="text-white border-white/20 px-4">WEEKLY SPRINT</Badge>
                        </header>

                        <div className="relative z-10 space-y-12">
                            <div className="space-y-6">
                                <Typography variant="caption" tone="white" className="opacity-40 tracking-[0.4em]">PERFORMANCE DA SEMANA</Typography>
                                <div className="flex items-baseline gap-4">
                                    <Typography variant="h1" tone="white" className="text-7xl font-mono-numbers leading-none">{metrics.vendasSemana}</Typography>
                                    <Typography variant="caption" tone="white" className="opacity-40">UNIDADES</Typography>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 2 }} className="h-full bg-gradient-to-r from-brand-primary to-mx-indigo-400 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                                </div>
                            </div>
                            <Typography variant="p" tone="white" className="text-base italic opacity-60 leading-relaxed">
                                "O sucesso é a soma de pequenos esforços repetidos dia após dia."
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
