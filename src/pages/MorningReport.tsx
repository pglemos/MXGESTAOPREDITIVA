import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Target, Zap, AlertTriangle, CheckCircle2, 
    RefreshCw, MessageCircle, BarChart3, Mail, FileDown,
    Users, UserCheck, Calendar
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { calcularProjecao, getDiasInfo, calcularAtingimento, somarVendas } from '@/lib/calculations'

export default function MorningReport() {
    const { profile, membership, storeId, role } = useAuth()
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
        const pendingSellers = (sellers || []).filter(s => !s.checkin_today)
        
        return { currentSales, teamGoal, projection, reaching, gap, checkedInCount, pendingSellers }
    }, [checkins, metaRules, storeGoal, daysInfo, sellers])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), fetchMetaRules(), refetchRanking(), refetchTeam()])
            toast.success('Sincronizado!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Matinal...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-10 bg-brand-primary rounded-full" aria-hidden="true" />
                    <div>
                        <Typography variant="caption" tone="brand">Unidade Operacional</Typography>
                        <Typography variant="h1">Matinal Oficial</Typography>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-xl"><FileDown size={18} className="mr-2" /> Planilha</Button>
                    <Button variant="success" className="h-12 px-6 rounded-xl text-white shadow-mx-lg"><MessageCircle size={18} className="mr-2" /> WhatsApp</Button>
                    <Button variant="secondary" className="h-12 px-6 rounded-xl shadow-mx-xl" disabled={isSendingEmail}>
                        {isSendingEmail ? <RefreshCw size={18} className="animate-spin mr-2" /> : <Mail size={18} className="mr-2" />}
                        E-mail Direção
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-mx-lg shrink-0">
                <Card className="p-8 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner" aria-hidden="true"><Target size={20} /></div>
                            <Badge variant="info">Meta Mês</Badge>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none mb-2">{metrics.teamGoal}</Typography>
                        <Typography variant="caption" tone="muted">Vendido: {metrics.currentSales} ({metrics.reaching}%)</Typography>
                    </div>
                </Card>

                <Card className="p-8 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10" aria-hidden="true"><TrendingUp size={20} /></div>
                            <Badge variant="outline" className="text-white border-white/20">Projeção MX</Badge>
                        </div>
                        <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none mb-2">{metrics.projection}</Typography>
                        <Typography variant="caption" tone="white" className="opacity-50">Falta X: {metrics.gap} unidades</Typography>
                    </div>
                </Card>

                <Card className={cn("p-8 transition-colors", metrics.pendingSellers.length > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                    <div className="flex items-center justify-between mb-6">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", metrics.pendingSellers.length > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
                            {metrics.pendingSellers.length > 0 ? <AlertTriangle size={20} /> : <UserCheck size={20} />}
                        </div>
                        <Badge variant={metrics.pendingSellers.length > 0 ? 'danger' : 'success'}>Disciplina</Badge>
                    </div>
                    <Typography variant="h1" tone={metrics.pendingSellers.length > 0 ? 'error' : 'success'} className="text-5xl tabular-nums leading-none mb-2">
                        {metrics.checkedInCount}/{sellers.length}
                    </Typography>
                    <Typography variant="caption" tone={metrics.pendingSellers.length > 0 ? 'error' : 'success'}>
                        {metrics.pendingSellers.length > 0 ? `${metrics.pendingSellers.length} Pendências` : '100% Sincronizada'}
                    </Typography>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg pb-32">
                <section className="xl:col-span-8">
                    <Card className="overflow-hidden">
                        <div className="p-8 border-b border-border-default bg-surface-alt/30 flex items-center justify-between">
                            <div>
                                <Typography variant="h3">Grade Operacional</Typography>
                                <Typography variant="caption" tone="muted" className="mt-1">Auditado em {referenceDateLabel}</Typography>
                            </div>
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <Calendar size={16} aria-hidden="true" />
                                <Typography variant="caption">{referenceDateLabel}</Typography>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <caption className="sr-only">Desempenho operacional por especialista</caption>
                                <thead>
                                    <tr className="bg-surface-alt border-b border-border-default">
                                        <th scope="col" className="px-8 py-4 text-[10px] font-black text-text-tertiary uppercase tracking-widest">Especialista</th>
                                        <th scope="col" className="py-4 text-center text-[10px] font-black text-text-tertiary uppercase tracking-widest">Leads</th>
                                        <th scope="col" className="py-4 text-center text-[10px] font-black text-text-tertiary uppercase tracking-widest">Agend.</th>
                                        <th scope="col" className="py-4 text-center text-[10px] font-black text-brand-primary uppercase tracking-widest">Vendas</th>
                                        <th scope="col" className="px-8 py-4 text-right text-[10px] font-black text-text-tertiary uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default">
                                    {(ranking || []).map((r) => (
                                        <tr key={r.user_id} className="hover:bg-surface-alt transition-colors group h-20">
                                            <td className="px-8 py-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-alt text-text-tertiary flex items-center justify-center text-[10px] font-black group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner" aria-hidden="true">{r.user_name.substring(0, 2)}</div>
                                                    <Typography variant="h3" className="text-xs">{r.user_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="text-center font-bold text-slate-700 tabular-nums text-sm">{r.leads}</td>
                                            <td className="text-center font-bold text-slate-700 tabular-nums text-sm">{r.agd_total}</td>
                                            <td className="text-center font-black text-brand-primary tabular-nums text-lg">{r.vnd_total}</td>
                                            <td className="px-8 py-2 text-right">
                                                <Badge variant={sellers.find(s => s.id === r.user_id)?.checkin_today ? 'success' : 'danger'} className="px-3">
                                                    {sellers.find(s => s.id === r.user_id)?.checkin_today ? 'OK' : 'FALTA'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                <aside className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-8 space-y-8">
                        <Typography variant="h3" className="flex items-center gap-2">
                            <Zap size={16} className="text-brand-primary" aria-hidden="true" /> Foco do Dia
                        </Typography>
                        <div className="space-y-4">
                            {metrics.pendingSellers.length > 0 && (
                                <div className="p-5 rounded-2xl bg-status-error-surface border border-status-error/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <Typography variant="h3" className="text-xs text-status-error">Cobrar Registro</Typography>
                                        <Badge variant="danger">Alta</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {metrics.pendingSellers.slice(0, 3).map(s => (
                                            <Button key={s.id} variant="outline" size="sm" className="h-8 rounded-lg bg-white text-status-error border-status-error/20"><MessageCircle size={12} className="mr-1" /> {s.name.split(' ')[0]}</Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="p-5 rounded-2xl bg-surface-alt border border-border-default space-y-2">
                                <Typography variant="h3" className="text-xs">Validar Agendamentos</Typography>
                                <Typography variant="caption" tone="muted">Conferir agenda digital D-0</Typography>
                            </div>
                        </div>
                    </Card>

                    <section className="bg-brand-primary rounded-[2.5rem] p-10 text-white shadow-mx-xl text-center">
                        <BarChart3 className="mx-auto mb-4 opacity-40" size={32} aria-hidden="true" />
                        <Typography variant="caption" tone="white" className="opacity-50 mb-2">Ritmo Ideal</Typography>
                        <Typography variant="h1" tone="white" className="text-4xl tabular-nums">
                            {(metrics.gap / Math.max(daysInfo.total - daysInfo.decorridos, 1)).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" tone="white" className="opacity-30 mt-4 leading-relaxed">Vendas necessárias por dia para meta oficial.</Typography>
                    </section>
                </aside>
            </div>
        </main>
    )
}
