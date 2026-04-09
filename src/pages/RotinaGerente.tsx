import React, { useState, useMemo, useCallback } from 'react'
import { useTeam } from '@/hooks/useTeam'
import { calculateReferenceDate, useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useManagerRoutine } from '@/hooks/useManagerRoutine'
import { useFeedbacks, usePDIs, useNotifications } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { somarVendas, calcularFunil, gerarDiagnosticoMX, getDiasInfo, calcularAtingimento } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckCircle2, Clock, Activity, CalendarDays,
    Zap, FileCheck, Target, TrendingUp,
    MessageSquare, Award, ChevronRight, Mail,
    BarChart3, RefreshCw, User, X, ShieldCheck, ShieldAlert, Users,
    Smartphone, History, AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { startOfWeek, isSameWeek, parseISO } from 'date-fns'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { supabase } from '@/lib/supabase'

import { useStoreSales } from '@/hooks/useStoreSales'
import { useStoreMetaRules } from '@/hooks/useGoals'

type RoutineTab = 'diario' | 'semanal' | 'mensal'

export default function RotinaGerente() {
    const [tab, setTab] = useState<RoutineTab>('diario')
    const { sellers, refetch: refetchTeam } = useTeam()
    const { membership } = useAuth()
    const { checkins, fetchCheckins } = useCheckins()
    const { storeGoal, fetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    const { ranking, refetch: refetchRanking } = useRanking()
    const { routineLog, registerRoutine } = useManagerRoutine()
    const { feedbacks, refetch: refetchFeedbacks } = useFeedbacks()
    const { pdis, refetch: refetchPDIs } = usePDIs()
    const { sendNotification } = useNotifications()
    
    const [executing, setExecuting] = useState(false)
    const [reuniaoDone, setReuniaoDone] = useState(false)
    const [agendaValidated, setAgendaDone] = useState(false)
    const [routineNotes, setRoutineNotes] = useState('')
    const [savingRoutine, setSavingRoutine] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)

    const diasInfo = useMemo(() => getDiasInfo(), [])
    const expectedAttainment = useMemo(() => (diasInfo.decorridos / diasInfo.total) * 100, [diasInfo])

    const storeSales = useStoreSales({
        checkins: checkins as any,
        ranking: ranking,
        rules: metaRules || { monthly_goal: storeGoal?.target || 0 } as any
    })

    const atRiskSellers = useMemo(() => {
        return storeSales.processedRanking
            .filter(item => !item.is_venda_loja && item.atingimento < (expectedAttainment - 10))
            .sort((a, b) => a.atingimento - b.atingimento)
    }, [storeSales.processedRanking, expectedAttainment])

    const referenceDate = calculateReferenceDate()
    const previousDayCheckins = useMemo(() => checkins.filter(c => c.reference_date === referenceDate), [checkins, referenceDate])
    const pendingSellers = useMemo(() => (sellers || []).filter(s => !s.checkin_today), [sellers])
    const totalAgendamentosHoje = useMemo(() => previousDayCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0), [previousDayCheckins])
    
    const canTriggerMatinal = useMemo(() => reuniaoDone && agendaValidated && pendingSellers.length === 0, [reuniaoDone, agendaValidated, pendingSellers])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([fetchCheckins(), fetchGoals(), refetchRanking(), refetchTeam(), refetchFeedbacks(), refetchPDIs()])
        setIsRefetching(false)
        toast.success('Rituais sincronizados!')
    }, [fetchCheckins, fetchGoals, refetchRanking, refetchTeam, refetchFeedbacks, refetchPDIs])

    const handleTriggerMatinal = async () => {
        setExecuting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relatorio-matinal`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' }
            })
            if (response.ok) toast.success('Relatório Matinal disparado!'); else toast.error('Falha no disparo.')
        } catch (e) { toast.error('Erro de conexão.') } finally { setExecuting(false) }
    }

    const handleRegisterRoutine = async () => {
        setSavingRoutine(true)
        const { error } = await registerRoutine({
            reference_date: referenceDate,
            checkins_pending_count: pendingSellers.length,
            notes: routineNotes,
        })
        setSavingRoutine(false)
        if (error) toast.error(error); else { toast.success('Rotina diária firmada!'); refetchTeam() }
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Centro de <span className="text-brand-primary">Comando</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">GESTÃO DE UNIDADE • CICLO OPERACIONAL MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <nav className="flex bg-white p-1 rounded-full border border-border-default shadow-mx-sm mr-4" role="tablist">
                        {(['diario', 'semanal', 'mensal'] as const).map((t) => (
                            <Button 
                                key={t} variant={tab === t ? 'secondary' : 'ghost'} size="sm"
                                onClick={() => setTab(t)} className="h-10 px-8 rounded-full font-black uppercase text-tiny"
                            >
                                {t === 'diario' ? <Zap size={14} className="mr-2" /> : t === 'semanal' ? <BarChart3 size={14} className="mr-2" /> : <Target size={14} className="mr-2" />}
                                {t}
                            </Button>
                        ))}
                    </nav>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-14 h-14 rounded-xl shadow-mx-sm bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {tab === 'diario' && (
                        <motion.div key="diario" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                            
                            <section className="lg:col-span-7 flex flex-col gap-mx-lg">
                                <Card className="p-10 md:p-14 space-y-12 border-none shadow-mx-xl bg-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-mx-xl -mr-32 -mt-32" aria-hidden="true" />
                                    <header className="flex items-center justify-between border-b border-border-default pb-8 relative z-10">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform -rotate-2"><Zap size={32} /></div>
                                            <div>
                                                <Typography variant="h2" className="uppercase tracking-tighter leading-none">Ritual Matinal</Typography>
                                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SEQUÊNCIA MANDATÁRIA • LIMITE 10:30</Typography>
                                            </div>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse shadow-mx-md px-6 py-2 rounded-full font-black uppercase text-tiny">Prioridade 01</Badge>
                                    </header>

                                    <div className="space-y-6 relative z-10">
                                        {[
                                            { done: reuniaoDone, set: setReuniaoDone, label: 'Reunião Individual (D-0)', desc: 'Alinhamento tático e motivação do corpo de vendas', idx: '01' },
                                            { done: agendaValidated, set: setAgendaDone, label: 'Validação de Agenda', desc: `${totalAgendamentosHoje} compromissos firmados para hoje`, idx: '02' }
                                        ].map(step => (
                                            <Card 
                                                key={step.idx} 
                                                onClick={() => step.set(!step.done)}
                                                className={cn("p-8 cursor-pointer group transition-all border-2", step.done ? "bg-status-success-surface/30 border-status-success/20" : "bg-surface-alt border-transparent hover:bg-white hover:border-brand-primary/20 hover:shadow-mx-lg")}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-6">
                                                        <div className={cn("w-12 h-12 rounded-mx-xl flex items-center justify-center border shadow-mx-inner transition-all", step.done ? "bg-white text-status-success border-status-success/30" : "bg-white text-text-tertiary border-border-default group-hover:scale-110")}>
                                                            {step.done ? <CheckCircle2 size={24} strokeWidth={3} /> : <Typography variant="h3" className="text-base leading-none">{step.idx}</Typography>}
                                                        </div>
                                                        <div>
                                                            <Typography variant="h3" className={cn("text-base uppercase tracking-tight", step.done && "text-status-success")}>{step.label}</Typography>
                                                            <Typography variant="tiny" tone="muted" className="italic mt-1 opacity-60 font-black">"{step.desc}"</Typography>
                                                        </div>
                                                    </div>
                                                    {!step.done && <Button variant="outline" size="sm" className="rounded-full px-6 h-10 font-black text-tiny uppercase tracking-widest bg-white shadow-sm">Concluir</Button>}
                                                </div>
                                            </Card>
                                        ))}

                                        <Card className={cn("p-10 border-none transition-all flex flex-col md:flex-row md:items-center justify-between gap-8", canTriggerMatinal ? "bg-mx-black text-white shadow-mx-elite" : "bg-surface-alt opacity-40")}>
                                            <div className="flex items-center gap-6">
                                                <div className={cn("w-14 h-14 rounded-mx-xl flex items-center justify-center border transition-all", canTriggerMatinal ? "bg-white/10 text-white border-white/10 shadow-mx-inner" : "bg-white text-text-tertiary")}>
                                                    <Mail size={28} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <Typography variant="h3" tone={canTriggerMatinal ? 'white' : 'default'} className="text-lg uppercase tracking-tight leading-none">Disparar Matinal</Typography>
                                                    <Typography variant="caption" tone={canTriggerMatinal ? 'white' : 'muted'} className="uppercase tracking-widest mt-1 opacity-40 font-black">DIREÇÃO & GOVERNANÇA REDE</Typography>
                                                </div>
                                            </div>
                                            <Button 
                                                disabled={!canTriggerMatinal || executing} 
                                                onClick={handleTriggerMatinal}
                                                className={cn("h-14 px-10 rounded-full font-black uppercase tracking-widest text-tiny", canTriggerMatinal ? "bg-brand-primary shadow-mx-xl" : "bg-white border-border-default")}
                                            >
                                                {executing ? <RefreshCw className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />} DISPARAR AGORA
                                            </Button>
                                        </Card>
                                    </div>
                                </Card>
                            </section>

                            <aside className="lg:col-span-5 flex flex-col gap-mx-lg">
                                <Card className="p-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-50" aria-hidden="true" />
                                    <div className="relative z-10 space-y-8">
                                        <header className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-mx-inner"><History size={24} /></div>
                                                <Typography variant="h3" tone="white" className="uppercase tracking-tight leading-none">Snapshot Hoje</Typography>
                                            </div>
                                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black text-tiny">Real-time</Badge>
                                        </header>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div>
                                                <Typography variant="tiny" tone="white" className="opacity-40 mb-2 block uppercase font-black">AGENDAMENTOS</Typography>
                                                <Typography variant="h1" tone="white" className="text-5xl tabular-nums leading-none tracking-tighter">{totalAgendamentosHoje}</Typography>
                                            </div>
                                            <div>
                                                <Typography variant="tiny" tone="white" className="opacity-40 mb-2 block uppercase font-black">PENDÊNCIAS</Typography>
                                                <Typography variant="h1" tone={pendingSellers.length > 0 ? 'brand' : 'white'} className="text-5xl tabular-nums leading-none tracking-tighter">{pendingSellers.length}</Typography>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-10 md:p-12 space-y-8 border-none shadow-mx-lg bg-white">
                                    <header className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-mx-xl bg-status-success-surface text-status-success flex items-center justify-center border border-status-success/20 shadow-mx-inner"><ShieldCheck size={24} /></div>
                                        <div>
                                            <Typography variant="h3" className="uppercase tracking-tight leading-none">Auditoria Diária</Typography>
                                            <Typography variant="caption" tone="muted" className="uppercase font-black text-tiny tracking-widest mt-1">{routineLog ? 'LOG SINCRONIZADO' : 'AGUARDANDO FIRMA'}</Typography>
                                        </div>
                                    </header>
                                    <Textarea 
                                        value={routineNotes} onChange={e => setRoutineNotes(e.target.value)}
                                        placeholder="Observações táticas da operação de hoje..."
                                        className="min-h-mx-xl"
                                    />
                                    <Button 
                                        onClick={handleRegisterRoutine} 
                                        disabled={savingRoutine || !!routineLog} 
                                        className="w-full h-16 rounded-full shadow-mx-xl font-black uppercase tracking-widest text-tiny"
                                    >
                                        {savingRoutine ? <RefreshCw className="animate-spin mr-2" /> : <FileCheck size={20} className="mr-2" />} FIRMAR AUDITORIA
                                    </Button>
                                </Card>
                            </aside>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
