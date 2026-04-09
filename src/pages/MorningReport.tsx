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
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento, formatWhatsAppMorningReport } from '@/lib/calculations'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { useAuth } from '@/hooks/useAuth'

export default function MorningReport() {
    const { profile, storeId, memberships } = useAuth()
    const { checkins, loading: loadingCheckins, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals: refetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    const { ranking, refetch: refetchRanking } = useRanking()
    const { sellers, refetch: refetchTeam } = useTeam()

    const [isRefetching, setIsRefetching] = useState(false)
    const [isSendingEmail, setIsSendingEmail] = useState(false)

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
        const pendingSellers = (sellers || []).filter(s => !s.checkin_today).map(s => s.name)
        
        return { currentSales, teamGoal, projection, reaching, gap, checkedInCount, pendingSellers }
    }, [checkins, metaRules, storeGoal, daysInfo, sellers])

    const activeStore = memberships.find(m => m.store_id === storeId)?.store
    const storeName = activeStore?.name || 'Unidade MX'

    const handleShareWhatsApp = useCallback(() => {
        const text = formatWhatsAppMorningReport(
            storeName,
            referenceDateLabel,
            metrics,
            ranking
        )
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [referenceDateLabel, metrics, ranking, storeName])

    const handleSendEmail = useCallback(async () => {
        setIsSendingEmail(true)
        try {
            await new Promise(r => setTimeout(r, 2000))
            toast.success('Relatório enviado para a Direção MX!')
        } catch (e) {
            toast.error('Falha ao enviar e-mail.')
        } finally {
            setIsSendingEmail(false)
        }
    }, [])

    const handleDownloadXlsx = useCallback(async () => {
        toast.info('Gerando planilha operacional...')
        const exportData = ranking.map(r => ({
            'Especialista': r.user_name,
            'Vendas': r.vnd_total,
            'Leads': r.leads,
            'Agendamentos': r.agd_total,
            'Visitas': r.visitas,
            'Meta': r.meta,
            'Atingimento (%)': r.atingimento,
            'Projeção': r.projecao,
            'Ritmo': r.ritmo
        }))
        
        const { exportToExcel } = await import('@/lib/export')
        const success = exportToExcel(exportData, `Matinal_${storeName.replace(/\s+/g, '_')}`)
        if (success) toast.success('Planilha gerada com sucesso!')
        else toast.error('Falha ao gerar planilha.')
    }, [ranking, storeName])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), fetchMetaRules(), refetchRanking(), refetchTeam()])
            toast.success('Snapshot operacional atualizado!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" aria-hidden="true" />
            <Typography variant="caption" tone="muted" className="animate-pulse uppercase font-black tracking-widest">Consolidando Matinal...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Matinal <Typography as="span" className="text-brand-primary">Oficial</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">Unidade Operacional • Ritual D+1 • {referenceDateLabel}</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm h-12 w-12 bg-white" aria-label="Sincronizar relatório matinal">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" onClick={handleDownloadXlsx} className="h-12 px-6 rounded-full shadow-mx-sm uppercase tracking-widest bg-white">
                        <FileDown size={16} className="mr-2" aria-hidden="true" /> <Typography variant="tiny" as="span" className="font-black">PLANILHA</Typography>
                    </Button>
                    <Button onClick={handleShareWhatsApp} className="h-12 px-8 rounded-full bg-status-success shadow-mx-lg uppercase tracking-widest hover:bg-status-success/90">
                        <MessageCircle size={16} className="mr-2 fill-white/20" aria-hidden="true" /> <Typography variant="tiny" as="span" tone="white" className="font-black">WHATSAPP</Typography>
                    </Button>
                    <Button variant="secondary" onClick={handleSendEmail} className="h-12 px-8 rounded-full shadow-mx-xl uppercase tracking-widest" disabled={isSendingEmail} aria-label="Enviar relatório para a direção">
                        {isSendingEmail ? <RefreshCw size={16} className="animate-spin mr-2" aria-hidden="true" /> : <Mail size={16} className="mr-2" aria-hidden="true" />}
                        <Typography variant="tiny" as="span" className="font-black">DIREÇÃO MX</Typography>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                <Card className="p-8 md:p-10 group relative overflow-hidden border-none shadow-mx-lg bg-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-mx-2xl bg-mx-indigo-50 text-brand-primary flex items-center justify-center shadow-inner border border-mx-indigo-100" aria-hidden="true"><Target size={24} /></div>
                            <Badge variant="brand" className="px-4 py-1 uppercase font-black shadow-sm">
                                <Typography variant="tiny" as="span">META MENSAL</Typography>
                            </Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.teamGoal}</Typography>
                        <div className="flex items-center gap-3">
                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">REALIZADO: {metrics.currentSales}</Typography>
                            <div className="w-1 h-1 rounded-full bg-border-strong opacity-20" aria-hidden="true" />
                            <Typography variant="h3" tone="brand" className="text-sm font-black">{metrics.reaching}%</Typography>
                        </div>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black">
                                <Typography variant="tiny" as="span" tone="white">PROJEÇÃO MX</Typography>
                            </Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.projection}</Typography>
                        <Typography variant="tiny" tone="white" className="opacity-50 font-black uppercase tracking-widest">GAP RESIDUAL: {metrics.gap} UNIDADES</Typography>
                    </div>
                </Card>

                <Card className="p-8 md:p-10 border-none shadow-mx-lg bg-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-status-success-surface rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-14 h-14 rounded-mx-2xl bg-status-success-surface text-status-success flex items-center justify-center shadow-inner border border-mx-emerald-100" aria-hidden="true"><Activity size={24} /></div>
                            <Badge variant="success" className="px-4 py-1 uppercase font-black shadow-sm">
                                <Typography variant="tiny" as="span">SAÚDE DA MALHA</Typography>
                            </Badge>
                        </div>
                        <Typography variant="h1" className="text-6xl tabular-nums leading-none mb-3 tracking-tighter font-black">{metrics.checkedInCount}<Typography as="span" variant="h3" tone="muted" className="text-2xl font-black">/{(sellers || []).length}</Typography></Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-40">SINCRONIA DISCIPLINAR D-0</Typography>
                    </div>
                </Card>
            </div>

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <Card className="xl:col-span-8 border-none shadow-mx-lg bg-white overflow-hidden">
                    <CardHeader className="p-10 bg-surface-alt/30 border-b border-border-default flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white border border-border-default flex items-center justify-center shadow-mx-sm" aria-hidden="true"><BarChart3 size={24} className="text-brand-primary" /></div>
                            <div>
                                <CardTitle className="text-xl uppercase tracking-tighter">Grade Operacional do Time</CardTitle>
                                <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block mt-1 opacity-40">EFICIÊNCIA INDIVIDUAL ACUMULADA</Typography>
                            </div>
                        </div>
                        <Badge variant="brand" className="px-4 py-1.5 rounded-full shadow-sm">
                            <Typography variant="tiny" as="span" className="font-black uppercase">Atualizado Live</Typography>
                        </Badge>
                    </CardHeader>
                    
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-alt/50 border-b border-border-default">
                                    <th scope="col" className="pl-10 py-6"><Typography variant="caption" className="font-black uppercase tracking-[0.2em]">ESPECIALISTA</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-[0.2em]">LEADS</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-[0.2em]">AGEND.</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-[0.2em]">VND (ONTEM)</Typography></th>
                                    <th scope="col" className="py-6 text-center"><Typography variant="caption" tone="brand" className="font-black uppercase tracking-[0.2em]">TOTAL (MÊS)</Typography></th>
                                    <th scope="col" className="pr-10 py-6 text-right"><Typography variant="caption" className="font-black uppercase tracking-[0.2em]">STATUS</Typography></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default bg-white">
                                {(ranking || []).map((r) => {
                                    const isDone = sellers.find(s => s.id === r.user_id)?.checkin_today
                                    return (
                                        <tr key={r.user_id} className="hover:bg-surface-alt/30 transition-colors group h-24">
                                            <td className="pl-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center group-hover:bg-brand-primary transition-all shadow-mx-inner" aria-hidden="true">
                                                        <Typography variant="tiny" className="font-black text-text-primary group-hover:text-white uppercase">{r.user_name.substring(0, 2)}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-base group-hover:text-brand-primary transition-colors uppercase tracking-tight font-black">{r.user_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <Typography variant="mono" className="text-lg text-text-primary opacity-60 tabular-nums">{r.leads}</Typography>
                                            </td>
                                            <td className="text-center">
                                                <Typography variant="mono" className="text-lg text-text-primary opacity-60 tabular-nums">{r.agd_total}</Typography>
                                            </td>
                                            <td className="text-center">
                                                <Typography variant="mono" tone="success" className="text-lg tabular-nums">{r.vnd_yesterday || 0}</Typography>
                                            </td>
                                            <td className="text-center">
                                                <Typography variant="mono" tone="brand" className="text-2xl tabular-nums">{r.vnd_total}</Typography>
                                            </td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={isDone ? 'success' : 'danger'} className="px-6 py-1.5 rounded-lg shadow-sm border uppercase border-none">
                                                    <Typography variant="tiny" as="span" className="font-black tracking-widest">{isDone ? 'SINCRONIZADO' : 'PENDENTE'}</Typography>
                                                </Badge>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

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
                                            <Typography variant="tiny" tone="error" className="font-black opacity-60 uppercase tracking-widest">Ação Imediata Necessária</Typography>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse shadow-sm border-none">
                                            <Typography variant="tiny" as="span" className="font-black uppercase">CRÍTICO</Typography>
                                        </Badge>
                                    </header>
                                    <div className="space-y-3">
                                        {metrics.pendingSellers.map(name => (
                                            <div key={name} className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-status-error" aria-hidden="true" />
                                                <Typography variant="caption" tone="error" className="font-black uppercase">{name}</Typography>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="danger" className="w-full h-12 rounded-xl shadow-mx-lg">
                                        <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest">Notificar Time</Typography>
                                    </Button>
                                </Card>
                            )}

                            <div className="p-8 bg-surface-alt rounded-mx-2xl border border-border-default shadow-inner">
                                <Typography variant="caption" tone="muted" className="mb-4 block font-black uppercase tracking-widest">Sugestão MX</Typography>
                                <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-text-secondary">
                                    "Manter o ritmo de agendamentos D-0 para garantir o escoamento projetado."
                                </Typography>
                            </div>
                        </div>
                    </Card>
                </aside>
            </section>
        </main>
    )
}
