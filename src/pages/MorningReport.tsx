import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Target, Zap, AlertTriangle, CheckCircle2, 
    RefreshCw, MessageCircle, BarChart3, Mail, FileDown,
    Users, UserCheck, Calendar, ArrowRight, Smartphone,
    Globe, Eye, History, Award, Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento } from '@/lib/calculations'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function MorningReport() {
    const { checkins, loading: loadingCheckins, fetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals } = useGoals()
    const { ranking, loading: loadingRanking, refetch: refetchRanking } = useRanking()
    const { sellers, refetch: refetchTeam } = useTeam()

    const daysInfo = useMemo(() => getDiasInfo(), [])
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const referenceDateLabel = useMemo(() => format(parseISO(referenceDate), 'dd/MM/yyyy', { locale: ptBR }), [referenceDate])
    
    const metrics = useMemo(() => {
        const currentSales = somarVendas(checkins)
        const teamGoal = storeGoal?.target || 0
        const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
        const reaching = calcularAtingimento(currentSales, teamGoal)
        
        return {
            currentSales,
            teamGoal,
            projection,
            reaching,
            gap: Math.max(0, teamGoal - currentSales)
        }
    }, [checkins, storeGoal, daysInfo])

    const [isRefetching, setIsRefetching] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

    const handleShareWhatsApp = useCallback(() => {
        const text = `*MATINAL OFICIAL MX — ${referenceDateLabel}*\n\n` +
            `🎯 *META MENSAL:* ${metrics.teamGoal}\n` +
            `📈 *REALIZADO:* ${metrics.currentSales} (${metrics.reaching}%)\n` +
            `🚀 *PROJEÇÃO:* ${metrics.projection}\n\n` +
            `📊 *GRADE OPERACIONAL:*\n` +
            ranking.map(r => `• ${r.user_name}: ${r.vnd_total}v | ${r.agd_total} agd`).join('\n') +
            `\n\n*FOCO DO DIA:* Validar agenda digital D-0.`
        
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [referenceDateLabel, metrics, ranking])

    const handleSendEmail = useCallback(async () => {
        setIsSendingEmail(true)
        try {
            // Simular chamada ao backend/edge function
            await new Promise(r => setTimeout(r, 2000))
            toast.success('Relatório enviado para a Direção MX!')
        } catch (e) {
            toast.error('Falha ao enviar e-mail.')
        } finally {
            setIsSendingEmail(false)
        }
    }, [])

    const handleDownloadXlsx = useCallback(() => {
        toast.info('Gerando planilha operacional...')
        // Futura integração com xlsx-generator.ts
    }, [])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([fetchCheckins(), fetchGoals(), refetchRanking(), refetchTeam()])
        setIsRefetching(false)
        toast.success('Matinal Atualizado!')
    }, [fetchCheckins, fetchGoals, refetchRanking, refetchTeam])

    const loading = loadingCheckins || loadingGoals || loadingRanking

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse tracking-[0.3em] font-black uppercase">Consolidando Matinal...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Matinal <span className="text-brand-primary">Oficial</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">RITUAL DE ALINHAMENTO MX • {referenceDateLabel}</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm h-12 w-12">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-12 px-6 rounded-full shadow-mx-sm uppercase tracking-widest text-[10px] font-black">
                        <FileDown size={16} className="mr-2" /> PLANILHA
                    </Button>
                    <Button onClick={handleShareWhatsApp} className="h-12 px-8 rounded-full bg-status-success shadow-mx-lg uppercase tracking-widest text-[10px] font-black hover:bg-status-success/90">
                        <MessageCircle size={16} className="mr-2 fill-white/20" /> WHATSAPP
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-12 px-8 rounded-full shadow-mx-xl uppercase tracking-widest text-[10px] font-black" disabled={isSendingEmail}>
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Mail size={16} className="mr-2" />}
                        DIREÇÃO MX
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                {/* Main Stats */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-mx-lg">
                    {[
                        { label: 'Realizado', val: metrics.currentSales, icon: Zap, tone: 'brand' },
                        { label: 'Projeção', val: metrics.projection, icon: TrendingUp, tone: 'success' },
                        { label: 'Atingimento', val: `${metrics.reaching}%`, icon: Target, tone: 'info' },
                    ].map((stat, i) => (
                        <Card key={i} className="p-8 border-none shadow-mx-md bg-white overflow-hidden relative group">
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner group-hover:rotate-6 transition-transform", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 text-brand-primary border-mx-indigo-100' :
                                    stat.tone === 'info' ? 'bg-status-info-surface text-status-info border-mx-blue-100' :
                                    'bg-status-success-surface text-status-success border-mx-emerald-100'
                                )}>
                                    <stat.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase font-black tracking-widest text-[9px]">{stat.label}</Typography>
                                    <Typography variant="h1" className="text-4xl tabular-nums leading-none tracking-tighter">{stat.val}</Typography>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Network Health Side */}
                <aside className="lg:col-span-4">
                    <Card className="p-10 bg-brand-secondary text-white border-none shadow-mx-xl h-full flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" />
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner mb-8"><Activity size={28} /></div>
                            <Typography variant="h2" tone="white" className="text-3xl mb-2">Gap Residual</Typography>
                            <Typography variant="p" tone="white" className="opacity-60 text-xs font-bold uppercase tracking-widest leading-relaxed">Faltam <span className="text-white font-black">{metrics.gap} unidades</span> para bater a meta do mês.</Typography>
                        </div>
                        
                        <div className="pt-10 border-t border-white/10 mt-10 relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <Typography variant="caption" tone="white" className="opacity-60 font-black uppercase">Esforço Diário Sugerido</Typography>
                                <Badge variant="brand" className="bg-white/20 border-none text-[8px] px-2">{Math.ceil(metrics.gap / Math.max(daysInfo.restantes, 1))}v / dia</Badge>
                            </div>
                            <Typography variant="caption" tone="white" className="text-[9px] opacity-40 uppercase font-black leading-relaxed">
                                Produção necessária por dia para atingimento da meta oficial.
                            </Typography>
                        </div>
                    </Card>
                </aside>
            </div>

            {/* Performance Ranking */}
            <Card className="flex-1 border-none shadow-mx-lg bg-white overflow-hidden mb-32">
                <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-border-default flex items-center justify-center shadow-sm"><BarChart3 size={24} className="text-brand-primary" /></div>
                        <div>
                            <CardTitle className="text-xl uppercase">Grade Operacional do Time</CardTitle>
                            <CardDescription className="uppercase tracking-widest font-black text-[9px] mt-1">PRODUÇÃO INDIVIDUAL ACUMULADA</CardDescription>
                        </div>
                    </div>
                    <Badge variant="brand" className="px-4 py-1.5 rounded-full text-[8px] font-black uppercase">Atualizado D-0</Badge>
                </CardHeader>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-surface-alt/50 border-b border-border-default">
                                <th className="px-10 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest">Especialista</th>
                                <th className="px-10 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Ritmo</th>
                                <th className="px-10 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Vendas</th>
                                <th className="px-10 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Agendamentos</th>
                                <th className="px-10 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Visitas</th>
                                <th className="px-10 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Eficiência</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {ranking.map((r, i) => (
                                <tr key={r.user_id} className={cn("hover:bg-surface-alt transition-colors group h-24", i === 0 && "bg-mx-indigo-50/20")}>
                                    <td className="px-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner uppercase">{r.user_name.charAt(0)}</div>
                                            <div className="flex flex-col">
                                                <Typography variant="h3" className="text-base truncate max-w-[180px]">{r.user_name}</Typography>
                                                <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase tracking-widest">{i === 0 ? '🏆 TOP PERFORMER' : 'ESPECIALISTA'}</Typography>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 text-center">
                                        <div className="flex justify-center">
                                            <Badge variant={r.atingimento >= 100 ? 'success' : r.atingimento >= 70 ? 'warning' : 'danger'} className="px-4 py-1.5 rounded-lg font-mono-numbers text-[10px]">
                                                {r.atingimento}%
                                            </Badge>
                                        </div>
                                    </td>
                                    <td className="px-10 text-center">
                                        <Typography variant="h3" className="text-xl tabular-nums">{r.vnd_total}</Typography>
                                    </td>
                                    <td className="px-10 text-center">
                                        <Typography variant="h3" className="text-xl tabular-nums opacity-40 group-hover:opacity-100 transition-opacity">{r.agd_total}</Typography>
                                    </td>
                                    <td className="px-10 text-center">
                                        <Typography variant="h3" className="text-xl tabular-nums opacity-40 group-hover:opacity-100 transition-opacity">{r.visitas}</Typography>
                                    </td>
                                    <td className="px-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-24 h-1.5 bg-surface-alt rounded-full overflow-hidden border border-border-default p-px">
                                                <div className={cn("h-full rounded-full transition-all duration-1000", r.atingimento >= 100 ? "bg-status-success" : "bg-brand-primary")} style={{ width: `${Math.min(r.atingimento, 100)}%` }} />
                                            </div>
                                            <Typography variant="caption" className="text-[8px] font-black opacity-40">PERFORMANCE ATUAL</Typography>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </main>
    )
}
