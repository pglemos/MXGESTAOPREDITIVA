import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Target, Zap, 
    RefreshCw, MessageCircle, FileDown,
    Activity, History, Mail, ArrowLeft, BarChart3
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
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { useAuth } from '@/hooks/useAuth'
import { DataGrid, Column } from '@/components/organisms/DataGrid'
import { Link } from 'react-router-dom'

export default function MorningReport() {
    const { storeId, memberships } = useAuth()
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
        const text = formatWhatsAppMorningReport(storeName, referenceDateLabel, metrics, ranking)
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }, [referenceDateLabel, metrics, ranking, storeName])

    const handleSendEmail = useCallback(async () => {
        setIsSendingEmail(true)
        try {
            await new Promise(r => setTimeout(r, 1500))
            toast.success('Relatório enviado!')
        } finally { setIsSendingEmail(false) }
    }, [])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), fetchMetaRules(), refetchRanking(), refetchTeam()])
            toast.success('Snapshot atualizado!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, fetchMetaRules, refetchRanking, refetchTeam])

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'user_name',
            header: 'ESPECIALISTA',
            render: (r) => (
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface-alt flex items-center justify-center font-black text-[10px] shrink-0 border border-border-default">{r.user_name.substring(0, 2).toUpperCase()}</div>
                    <Typography variant="h3" className="text-xs sm:text-sm uppercase font-black truncate">{r.user_name}</Typography>
                </div>
            )
        },
        { key: 'leads', header: 'LDS', align: 'center', render: (r) => <span className="tabular-nums font-bold opacity-60">{r.leads}</span> },
        { key: 'agd_total', header: 'AGD', align: 'center', render: (r) => <span className="tabular-nums font-bold opacity-60">{r.agd_total}</span> },
        { key: 'vnd_total', header: 'MÊS', align: 'center', render: (r) => <span className="font-black text-brand-primary tabular-nums">{r.vnd_total}</span> },
        {
            key: 'status',
            header: 'SINC',
            align: 'right',
            render: (r) => {
                const isDone = sellers.find(s => s.id === r.user_id)?.checkin_today
                return <div className={cn("w-2 h-2 rounded-full", isDone ? "bg-status-success" : "bg-status-error animate-pulse")} />
            }
        }
    ], [sellers])

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" className="font-black uppercase tracking-widest animate-pulse">Consolidando...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-4 p-4 overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col gap-4 border-b border-border-default pb-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <Typography variant="h1" className="text-2xl font-black uppercase">Matinal</Typography>
                        <Typography variant="tiny" tone="muted" className="font-black uppercase text-[8px] tracking-widest">{referenceDateLabel}</Typography>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="w-10 h-10 rounded-xl bg-white"><RefreshCw size={18} className={cn(isRefetching && "animate-spin")} /></Button>
                        <Button onClick={handleShareWhatsApp} className="h-10 px-4 rounded-xl bg-status-success shadow-sm"><MessageCircle size={18} /></Button>
                        <Button variant="secondary" onClick={handleSendEmail} disabled={isSendingEmail} className="h-10 px-4 rounded-xl shadow-sm">{isSendingEmail ? <RefreshCw className="animate-spin" size={18} /> : <Mail size={18} />}</Button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                <Card className="p-4 border-none shadow-sm bg-white flex flex-col justify-between">
                    <Typography variant="tiny" className="font-black uppercase opacity-40 text-[8px]">Meta Mensal</Typography>
                    <Typography variant="h1" className="text-4xl font-mono-numbers leading-none">{metrics.teamGoal}</Typography>
                    <Typography variant="tiny" tone="brand" className="font-black uppercase text-[10px]">{metrics.reaching}% ATG</Typography>
                </Card>

                <Card className="p-4 border-none shadow-sm bg-brand-secondary text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                    <Typography variant="tiny" className="font-black uppercase opacity-50 text-[8px] relative z-10">Projeção MX</Typography>
                    <Typography variant="h1" tone="white" className="text-4xl font-mono-numbers leading-none relative z-10">{metrics.projection}</Typography>
                    <Typography variant="tiny" className="font-black uppercase text-[10px] opacity-40 relative z-10">GAP: {metrics.gap} UND</Typography>
                </Card>

                <Card className="p-4 border-none shadow-sm bg-white flex flex-col justify-between">
                    <Typography variant="tiny" className="font-black uppercase opacity-40 text-[8px]">Saúde Malha</Typography>
                    <Typography variant="h1" className="text-4xl font-mono-numbers leading-none">{metrics.checkedInCount}<span className="text-text-tertiary text-xl">/{(sellers || []).length}</span></Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase text-[10px]">SINCRONIA D-0</Typography>
                </Card>
            </div>

            <section className="flex flex-col gap-4 pb-32">
                <Card className="border-none shadow-mx-xl bg-white overflow-hidden">
                    <CardHeader className="p-4 bg-surface-alt/30 border-b border-border-default flex flex-row items-center justify-between">
                        <Typography variant="h2" className="text-lg font-black uppercase">Grade Time</Typography>
                        <Badge variant="brand" className="text-[8px] font-black uppercase">LIVE</Badge>
                    </CardHeader>
                    <DataGrid columns={columns} data={ranking} emptyMessage="Sem dados." />
                </Card>

                {metrics.pendingSellers.length > 0 && (
                    <Card className="p-6 bg-status-error-surface border-none shadow-inner space-y-4">
                        <header className="flex justify-between items-center">
                            <Typography variant="h3" className="text-status-error font-black uppercase">Cobrar Registro</Typography>
                            <Badge variant="danger" className="animate-pulse">CRÍTICO</Badge>
                        </header>
                        <div className="flex flex-wrap gap-2">
                            {metrics.pendingSellers.map(name => (
                                <Badge key={name} variant="outline" className="bg-white border-status-error/20 text-status-error font-black uppercase text-[10px]">{name}</Badge>
                            ))}
                        </div>
                        <Button variant="danger" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg">Notificar Time</Button>
                    </Card>
                )}
            </section>
        </main>
    )
}
