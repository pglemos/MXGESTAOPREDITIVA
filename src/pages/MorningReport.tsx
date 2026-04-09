import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Target, Zap, AlertTriangle, CheckCircle2, 
    RefreshCw, MessageCircle, BarChart3, Mail, FileDown,
    Users, UserCheck, Calendar, ArrowRight, Smartphone,
    ChevronRight, ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calcularProjecao, getDiasInfo, calcularAtingimento, somarVendas, formatWhatsAppMorningReport } from '@/lib/calculations'

export default function MorningReport() {
    const { profile, storeId } = useAuth()
    const { checkins, loading: loadingCheckins, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals: refetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    const { ranking, refetch: refetchRanking } = useRanking()
    const { sellers, refetch: refetchTeam } = useTeam()

    const daysInfo = useMemo(() => getDiasInfo(), [])
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const referenceDateLabel = useMemo(() => format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR }), [referenceDate])
    
    const metrics = useMemo(() => {
        const currentSales = somarVendas(checkins)
        const teamGoal = metaRules?.monthly_goal ?? storeGoal?.target ?? 0
        const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
        const reaching = calcularAtingimento(currentSales, teamGoal)
        const gap = Math.max(teamGoal - currentSales, 0)
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        const pendingSellers = (sellers || []).filter(s => !s.checkin_today)
        
        return { currentSales, teamGoal, projection, reaching, gap, checkedInCount, pendingSellers }
    }, [checkins, metaRules, storeGoal, daysInfo, sellers])

    const [isRefetching, setIsRefetching] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

    const handleShareWhatsApp = useCallback(() => {
        const text = formatWhatsAppMorningReport(
            'Unidade MX',
            referenceDateLabel,
            metrics,
            ranking
        )
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [referenceDateLabel, metrics, ranking])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), fetchMetaRules(), refetchRanking(), refetchTeam()])
            toast.success('Snapshot operacional atualizado!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    const handleDownloadXlsx = () => toast.info('Compilando planilha de performance...')
    const handleSendEmail = () => toast.info('Protocolo de e-mail estratégico iniciado...')

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt" role="status" aria-live="polite">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse uppercase font-black tracking-widest">Consolidando Matinal...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Matinal <span className="text-brand-primary">Oficial</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">Unidade Operacional • Ritual D+1 • {referenceDateLabel}</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm h-12 w-12 bg-white" aria-label="Sincronizar relatório matinal">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-12 px-6 rounded-full shadow-mx-sm uppercase tracking-widest text-tiny font-black bg-white border-border-strong hover:border-brand-primary" aria-label="Baixar planilha de performance">
                        <FileDown size={16} className="mr-2" aria-hidden="true" /> PLANILHA
                    </Button>
                    <Button onClick={handleShareWhatsApp} className="h-12 px-8 rounded-full bg-status-success shadow-mx-lg uppercase tracking-widest text-tiny font-black hover:bg-status-success/90" aria-label="Compartilhar resumo no WhatsApp">
                        <MessageCircle size={16} className="mr-2 fill-white/20" aria-hidden="true" /> WHATSAPP
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-12 px-8 rounded-full shadow-mx-xl uppercase tracking-widest text-tiny font-black" disabled={isSendingEmail} aria-label="Enviar relatório para a direção">
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Mail size={16} className="mr-2" aria-hidden="true" />}
                        DIREÇÃO MX
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                <Card className="p-8 md:p-10 group relative overflow-hidden border-none shadow-mx-lg bg-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-mx-2xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-mx-inner border border-mx-indigo-100" aria-hidden="true"><Target size={24} /></div>
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black text-tiny shadow-sm border-none">META MENSAL</Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.teamGoal}</Typography>
                        <div className="flex items-center gap-3">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-40">REALIZADO: {metrics.currentSales}</Typography>
                            <div className="w-1 h-1 rounded-full bg-border-strong opacity-20" aria-hidden="true" />
                            <Typography variant="h3" tone="brand" className="text-sm font-black">{metrics.reaching}%</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-mx-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black text-tiny">PROJEÇÃO MX</Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.projection}</Typography>
                        <Typography variant="tiny" tone="white" className="opacity-50 font-black uppercase tracking-widest">GAP RESIDUAL: {metrics.gap} UNIDADES</Typography>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 transition-all border-none shadow-mx-lg relative overflow-hidden bg-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-success-surface rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className={cn("w-14 h-14 rounded-mx-2xl flex items-center justify-center shadow-mx-inner border transition-all", 
                                metrics.pendingSellers.length > 0 ? "bg-status-error-surface text-status-error border-mx-rose-100" : "bg-status-success-surface text-status-success border-mx-emerald-100"
                            )} aria-hidden="true">
                                {metrics.pendingSellers.length > 0 ? <AlertTriangle size={24} className="animate-pulse" /> : <UserCheck size={24} />}
                            </div>
                            <Badge variant={metrics.pendingSellers.length > 0 ? 'danger' : 'success'} className="px-4 py-1 uppercase font-black text-tiny shadow-sm border-none">DISCIPLINA</Badge>
                        </div>
                        <Typography variant="h1" tone={metrics.pendingSellers.length > 0 ? 'error' : 'success'} className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">
                            {metrics.checkedInCount}<Typography as="span" variant="h3" tone="muted" className="text-2xl font-black ml-1 opacity-20">/{sellers.length}</Typography>
                        </Typography>
                        <Typography variant="tiny" tone={metrics.pendingSellers.length > 0 ? 'error' : 'success'} className="font-black uppercase tracking-widest">
                            {metrics.pendingSellers.length > 0 ? `${metrics.pendingSellers.length} PENDÊNCIAS EM MALHA` : 'TROPA 100% SINCRONIZADA'}
                        </Typography>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-10 bg-surface-alt/20 border-b border-border-default">
                            <div>
                                <CardTitle className="text-3xl uppercase tracking-tighter">Grade Operacional</CardTitle>
                                <CardDescription className="uppercase font-black tracking-widest mt-1 opacity-40 text-tiny">CONSOLIDAÇÃO INDIVIDUAL • CICLO MX</CardDescription>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-border-default shadow-mx-sm">
                                <Calendar size={16} className="text-brand-primary" aria-hidden="true" />
                                <Typography variant="tiny" className="font-black uppercase tracking-widest">{referenceDateLabel}</Typography>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <caption className="sr-only">Desempenho operacional detalhado dos especialistas da unidade</caption>
                                <thead>
                                    <tr className="bg-surface-alt/50 border-b border-border-default text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                        <th scope="col" className="pl-10 py-6">ESPECIALISTA</th>
                                        <th scope="col" className="py-6 text-center">LEADS</th>
                                        <th scope="col" className="py-6 text-center">AGEND.</th>
                                        <th scope="col" className="py-6 text-center text-brand-primary">VENDAS</th>
                                        <th scope="col" className="pr-10 py-6 text-right">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default bg-white">
                                    {(ranking || []).map((r) => {
                                        const isDone = sellers.find(s => s.id === r.user_id)?.checkin_today
                                        return (
                                            <tr key={r.user_id} className="hover:bg-surface-alt/30 transition-colors group h-24">
                                                <td className="pl-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-sm group-hover:bg-brand-primary group-hover:text-white transition-all shadow-mx-inner uppercase" aria-hidden="true">{r.user_name.substring(0, 2)}</div>
                                                        <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{r.user_name}</Typography>
                                                    </div>
                                                </td>
                                                <td className="text-center font-black text-lg tabular-nums text-text-primary font-mono-numbers opacity-60">{r.leads}</td>
                                                <td className="text-center font-black text-lg tabular-nums text-text-primary font-mono-numbers opacity-60">{r.agd_total}</td>
                                                <td className="text-center font-black text-2xl tabular-nums text-brand-primary font-mono-numbers">{r.vnd_total}</td>
                                                <td className="pr-10 text-right">
                                                    <Badge variant={isDone ? 'success' : 'danger'} className="px-6 py-1.5 rounded-lg shadow-sm border uppercase font-black tracking-widest text-[8px] border-none">
                                                        {isDone ? 'SINCRONIZADO' : 'PENDENTE'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 md:p-14 space-y-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                        <header className="flex items-center gap-4 border-b border-border-default pb-8 relative z-10">
                            <div className="w-14 h-14 rounded-mx-xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-mx-sm" aria-hidden="true"><Zap size={28} /></div>
                            <Typography variant="h3" className="uppercase tracking-tight font-black">Foco do Dia</Typography>
                        </header>
                        
                        <div className="space-y-6 relative z-10">
                            {metrics.pendingSellers.length > 0 && (
                                <Card className="p-8 bg-status-error-surface border-none shadow-mx-inner space-y-6">
                                    <header className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <Typography variant="h3" className="text-base text-status-error leading-none uppercase tracking-tight font-black">COBRAR REGISTRO</Typography>
                                            <Typography variant="tiny" className="font-black text-status-error/60 uppercase tracking-widest">Ação Imediata Necessária</Typography>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse uppercase font-black text-tiny shadow-sm border-none">CRÍTICO</Badge>
                                    </header>
                                    <div className="flex flex-wrap gap-3">
                                        {metrics.pendingSellers.slice(0, 4).map(s => (
                                            <Button key={s.id} variant="outline" size="sm" className="h-10 rounded-mx-lg bg-white text-status-error border-status-error/20 hover:bg-status-error-surface shadow-sm text-tiny font-black px-4 uppercase" aria-label={`Cobrar registro de ${s.name}`}>
                                                <Smartphone size={14} className="mr-2" aria-hidden="true" /> {s.name.split(' ')[0]}
                                            </Button>
                                        ))}
                                    </div>
                                </Card>
                            )}
                            
                            <Card className="p-8 bg-surface-alt border border-border-default shadow-mx-inner space-y-4 group hover:bg-white hover:shadow-mx-sm transition-all rounded-mx-2xl cursor-pointer">
                                <header className="flex items-center justify-between">
                                    <Typography variant="h3" className="text-base uppercase tracking-tight font-black group-hover:text-brand-primary transition-colors">VALIDAR AGENDAMENTOS</Typography>
                                    <ChevronRight size={18} className="text-text-tertiary group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                                </header>
                                <Typography variant="tiny" tone="muted" className="italic leading-relaxed uppercase tracking-tight font-black opacity-40">Conferir agenda digital D-0 e confirmar comparecimento para hoje.</Typography>
                            </Card>
                        </div>
                    </Card>

                    <Card className="bg-brand-primary rounded-[3rem] p-12 text-white shadow-mx-xl text-center border-none relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" aria-hidden="true" />
                        <div className="relative z-10">
                            <BarChart3 className="mx-auto mb-8 opacity-30 transform group-hover:scale-110 transition-transform" size={48} aria-hidden="true" />
                            <Typography variant="tiny" tone="white" className="opacity-50 mb-4 block font-black uppercase tracking-widest">RITMO DE TRAÇÃO IDEAL</Typography>
                            <div className="flex items-baseline justify-center gap-3 mb-4">
                                <Typography variant="h1" tone="white" className="text-8xl tabular-nums leading-none tracking-tighter font-black">
                                    {(metrics.gap / Math.max(daysInfo.total - daysInfo.decorridos, 1)).toFixed(1)}
                                </Typography>
                                <Typography variant="h3" tone="white" className="text-2xl opacity-40 uppercase font-black">VND/DIA</Typography>
                            </div>
                            <Typography variant="tiny" tone="white" className="opacity-60 leading-relaxed uppercase tracking-widest font-black max-w-xs mx-auto block italic">
                                Produção necessária por dia para atingimento da meta oficial.
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
