import React, { useState, useMemo, useCallback, useEffect } from 'react'
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
    Smartphone, History, AlertTriangle, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Textarea } from '@/components/atoms/Textarea'
import { Card } from '@/components/molecules/Card'
import { supabase } from '@/lib/supabase'

import { useStoreSales } from '@/hooks/useStoreSales'
import { useStoreMetaRules } from '@/hooks/useGoals'
import { useCheckinAuditor } from '@/hooks/useCheckinAuditor'

type RoutineTab = 'diario' | 'semanal' | 'mensal' | 'ajustes'

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
    const { fetchPendingRequests, approveRequest, rejectRequest, loading: auditorLoading } = useCheckinAuditor()
    
    const [pendingRequests, setPendingRequests] = useState<any[]>([])
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

    const referenceDate = calculateReferenceDate()
    const previousDayCheckins = useMemo(() => checkins.filter(c => c.reference_date === referenceDate), [checkins, referenceDate])
    const pendingSellers = useMemo(() => (sellers || []).filter(s => !s.checkin_today), [sellers])
    const totalAgendamentosHoje = useMemo(() => previousDayCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0), [previousDayCheckins])
    
    const canTriggerMatinal = useMemo(() => reuniaoDone && agendaValidated && pendingSellers.length === 0, [reuniaoDone, agendaValidated, pendingSellers])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        const [reqs] = await Promise.all([
            fetchPendingRequests(),
            fetchCheckins(), 
            fetchGoals(), 
            refetchRanking(), 
            refetchTeam(), 
            refetchFeedbacks(), 
            refetchPDIs()
        ])
        setPendingRequests(reqs)
        setIsRefetching(false)
        toast.success('Rituais sincronizados!')
    }, [fetchCheckins, fetchGoals, refetchRanking, refetchTeam, refetchFeedbacks, refetchPDIs, fetchPendingRequests])

    useEffect(() => {
        fetchPendingRequests().then(setPendingRequests)
    }, [fetchPendingRequests])

    const handleApproveCorrection = async (req: any) => {
        const { error } = await approveRequest(req)
        if (error) toast.error(error)
        else {
            toast.success('Correção aprovada e aplicada ao histórico!')
            handleRefresh()
        }
    }

    const handleRejectCorrection = async (id: string) => {
        const { error } = await rejectRequest(id)
        if (error) toast.error(error)
        else {
            toast.success('Solicitação de ajuste rejeitada.')
            handleRefresh()
        }
    }

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
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Centro de <span className="text-brand-primary">Comando</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">GESTÃO DE UNIDADE • CICLO OPERACIONAL MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <nav className="flex bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm mr-4" role="tablist">
                        {(['diario', 'semanal', 'mensal', 'ajustes'] as const).map((t) => (
                            <Button 
                                key={t} variant={tab === t ? 'secondary' : 'ghost'} size="sm"
                                onClick={() => setTab(t)} className="h-mx-10 px-8 rounded-mx-full font-black uppercase text-tiny relative"
                            >
                                {t === 'ajustes' && pendingRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-mx-xs h-mx-xs bg-status-error text-white rounded-full flex items-center justify-center text-mx-tiny shadow-mx-sm border-2 border-white animate-bounce">{pendingRequests.length}</span>
                                )}
                                {t === 'diario' ? <Zap size={14} className="mr-2" /> : t === 'semanal' ? <BarChart3 size={14} className="mr-2" /> : t === 'mensal' ? <Target size={14} className="mr-2" /> : <ShieldAlert size={14} className="mr-2" />}
                                {t}
                            </Button>
                        ))}
                    </nav>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {tab === 'diario' && (
                        <motion.div key="diario" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                            <section className="lg:col-span-7 flex flex-col gap-mx-lg">
                                <Card className="p-mx-10 md:p-14 space-y-mx-xl border-none shadow-mx-xl bg-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-32 -mt-32" aria-hidden="true" />
                                    <header className="flex items-center justify-between border-b border-border-default pb-8 relative z-10">
                                        <div className="flex items-center gap-mx-md">
                                            <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform -rotate-2"><Zap size={32} /></div>
                                            <div>
                                                <Typography variant="h2" className="uppercase tracking-tighter leading-none">Ritual Matinal</Typography>
                                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SEQUÊNCIA MANDATÁRIA • LIMITE 10:30</Typography>
                                            </div>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse shadow-mx-md px-6 py-2 rounded-mx-full font-black uppercase text-tiny">Prioridade 01</Badge>
                                    </header>

                                    <div className="space-y-mx-md relative z-10">
                                        {[
                                            { done: reuniaoDone, set: setReuniaoDone, label: 'Reunião Individual (D-0)', desc: 'Alinhamento tático e motivação do corpo de vendas', idx: '01' },
                                            { done: agendaValidated, set: setAgendaDone, label: 'Validação de Agenda', desc: `${totalAgendamentosHoje} compromissos firmados para hoje`, idx: '02' }
                                        ].map(step => (
                                            <Card 
                                                key={step.idx} 
                                                onClick={() => step.set(!step.done)}
                                                className={cn("p-mx-lg cursor-pointer group transition-all border-2", step.done ? "bg-status-success-surface/30 border-status-success/20" : "bg-surface-alt border-transparent hover:bg-white hover:border-brand-primary/20 hover:shadow-mx-lg")}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-mx-md">
                                                        <div className={cn("w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center border shadow-mx-inner transition-all", step.done ? "bg-white text-status-success border-status-success/30" : "bg-white text-text-tertiary border-border-default group-hover:scale-110")}>
                                                            {step.done ? <CheckCircle2 size={24} strokeWidth={3} /> : <Typography variant="h3" className="text-base leading-none">{step.idx}</Typography>}
                                                        </div>
                                                        <div>
                                                            <Typography variant="h3" className={cn("text-base uppercase tracking-tight", step.done && "text-status-success")}>{step.label}</Typography>
                                                            <Typography variant="tiny" tone="muted" className="italic mt-1 opacity-60 font-black">"{step.desc}"</Typography>
                                                        </div>
                                                    </div>
                                                    {!step.done && <Button variant="outline" size="sm" className="rounded-mx-full px-6 h-mx-10 font-black text-tiny uppercase tracking-widest bg-white shadow-sm">Concluir</Button>}
                                                </div>
                                            </Card>
                                        ))}

                                        <Card className={cn("p-mx-10 border-none transition-all flex flex-col md:flex-row md:items-center justify-between gap-mx-lg", canTriggerMatinal ? "bg-mx-black text-white shadow-mx-elite" : "bg-surface-alt opacity-40")}>
                                            <div className="flex items-center gap-mx-md">
                                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border transition-all", canTriggerMatinal ? "bg-white/10 text-white border-white/10 shadow-mx-inner" : "bg-white text-text-tertiary")}>
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
                                                className={cn("h-mx-14 px-10 rounded-mx-full font-black uppercase tracking-widest text-tiny", canTriggerMatinal ? "bg-brand-primary shadow-mx-xl" : "bg-white border-border-default")}
                                            >
                                                {executing ? <RefreshCw className="animate-spin mr-2" /> : <Zap size={18} className="mr-2" />} DISPARAR AGORA
                                            </Button>
                                        </Card>
                                    </div>
                                </Card>
                            </section>

                            <aside className="lg:col-span-5 flex flex-col gap-mx-lg">
                                <Card className="p-mx-10 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-50" aria-hidden="true" />
                                    <div className="relative z-10 space-y-mx-lg">
                                        <header className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                                            <div className="flex items-center gap-mx-sm">
                                                <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-mx-inner"><History size={24} /></div>
                                                <Typography variant="h3" tone="white" className="uppercase tracking-tight leading-none">Snapshot Hoje</Typography>
                                            </div>
                                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black text-tiny">Real-time</Badge>
                                        </header>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-lg">
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

                                <Card className="p-mx-10 md:p-12 space-y-mx-lg border-none shadow-mx-lg bg-white">
                                    <header className="flex items-center gap-mx-sm mb-4">
                                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-status-success-surface text-status-success flex items-center justify-center border border-status-success/20 shadow-mx-inner"><ShieldCheck size={24} /></div>
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
                                        className="w-full h-mx-2xl rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest text-tiny"
                                    >
                                        {savingRoutine ? <RefreshCw className="animate-spin mr-2" /> : <FileCheck size={20} className="mr-2" />} FIRMAR AUDITORIA
                                    </Button>
                                </Card>
                            </aside>
                        </motion.div>
                    )}

                    {tab === 'ajustes' && (
                        <motion.div key="ajustes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-mx-lg">
                            <Card className="p-mx-10 md:p-14 border-none shadow-mx-xl bg-white relative overflow-hidden">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-32 -mt-32" aria-hidden="true" />
                                <header className="flex items-center justify-between border-b border-border-default pb-8 mb-10 relative z-10">
                                    <div className="flex items-center gap-mx-md">
                                        <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-pure-black text-white flex items-center justify-center shadow-mx-xl transform rotate-2"><ShieldAlert size={32} className="text-brand-primary" /></div>
                                        <div>
                                            <Typography variant="h2" className="uppercase tracking-tighter leading-none">Auditoria de Ajustes</Typography>
                                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black opacity-40">SOLICITAÇÕES RETROATIVAS PENDENTES</Typography>
                                        </div>
                                    </div>
                                    <Badge variant={pendingRequests.length > 0 ? "warning" : "success"} className="shadow-mx-md px-6 py-2 rounded-mx-full font-black uppercase text-tiny">
                                        {pendingRequests.length} PENDÊNCIAS
                                    </Badge>
                                </header>

                                <div className="space-y-mx-md relative z-10">
                                    {pendingRequests.length === 0 ? (
                                        <div className="py-20 text-center flex flex-col items-center justify-center gap-mx-md bg-surface-alt rounded-mx-3xl border-2 border-dashed border-border-default">
                                            <ShieldCheck size={48} className="text-text-tertiary/20" />
                                            <Typography variant="p" tone="muted" className="uppercase tracking-widest font-black">Malha 100% Sincronizada</Typography>
                                        </div>
                                    ) : (
                                        pendingRequests.map((req) => (
                                            <Card key={req.id} className="p-mx-lg border border-border-default bg-surface-alt/30 hover:bg-white hover:shadow-mx-lg transition-all group">
                                                <div className="flex flex-col lg:flex-row gap-mx-lg">
                                                    <div className="flex-1 space-y-mx-md">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-mx-sm">
                                                                <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-inner font-black text-sm uppercase">{req.seller?.name?.charAt(0) || '?'}</div>
                                                                <div>
                                                                    <Typography variant="h3" className="text-base uppercase font-black">{req.seller?.name || 'Vendedor'}</Typography>
                                                                    <Typography variant="tiny" tone="muted" className="font-black uppercase opacity-40">Solicitado em {new Date(req.created_at).toLocaleDateString('pt-BR')}</Typography>
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className="font-mono-numbers">{req.id.split('-')[0]}</Badge>
                                                        </div>

                                                        <div className="bg-white p-mx-md rounded-mx-xl shadow-inner border border-border-default space-y-mx-sm">
                                                            <header className="flex items-center gap-mx-xs border-b border-border-default pb-2 mb-2">
                                                                <MessageSquare size={14} className="text-brand-primary" />
                                                                <Typography variant="tiny" className="font-black uppercase tracking-widest text-brand-primary">Justificativa Operacional</Typography>
                                                            </header>
                                                            <Typography variant="p" className="text-sm font-bold italic leading-relaxed">"{req.reason}"</Typography>
                                                        </div>
                                                    </div>

                                                    <div className="lg:w-mx-card-md space-y-mx-md">
                                                        <Typography variant="tiny" tone="muted" className="ml-2 font-black uppercase tracking-widest">Valores Solicitados</Typography>
                                                        <div className="grid grid-cols-3 gap-mx-xs">
                                                            {[
                                                                { l: 'L', v: req.requested_values.leads, t: 'brand' },
                                                                { l: 'V', v: req.requested_values.visitas, t: 'warning' },
                                                                { l: 'VND', v: (req.requested_values.vnd_porta || 0) + (req.requested_values.vnd_cart || 0) + (req.requested_values.vnd_net || 0), t: 'success' }
                                                            ].map(val => (
                                                                <div key={val.l} className="bg-white p-mx-sm rounded-mx-xl border border-border-default shadow-sm text-center">
                                                                    <Typography variant="tiny" tone="muted" className="font-black opacity-40 block">{val.l}</Typography>
                                                                    <Typography variant="h3" tone={val.t as any} className="text-xl tabular-nums font-black">{val.v}</Typography>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-mx-sm pt-4">
                                                            <Button 
                                                                variant="outline" size="sm" 
                                                                onClick={() => handleRejectCorrection(req.id)}
                                                                className="flex-1 h-mx-11 rounded-mx-xl font-black text-mx-micro uppercase hover:bg-status-error-surface hover:text-status-error transition-all"
                                                            >
                                                                REJEITAR
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleApproveCorrection(req)}
                                                                className="flex-1 h-mx-11 rounded-mx-xl font-black text-mx-micro uppercase shadow-mx-md"
                                                            >
                                                                APROVAR AJUSTE
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
