import React, { useState, useMemo } from 'react'
import { useTeam } from '@/hooks/useTeam'
import { calculateReferenceDate, useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useManagerRoutine } from '@/hooks/useManagerRoutine'
import { useFeedbacks, usePDIs, useNotifications } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { somarVendas, calcularFunil, gerarDiagnosticoMX, getDiasInfo } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckCircle2, Clock, Activity, CalendarDays,
    Zap, FileCheck, Target, TrendingUp,
    MessageSquare, Award, ChevronRight, Mail,
    BarChart3, RefreshCw, User, X, ShieldCheck, ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { startOfWeek, isSameWeek, parseISO } from 'date-fns'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { supabase } from '@/lib/supabase'

type RoutineTab = 'diario' | 'semanal' | 'mensal'

export default function RotinaGerente() {
    const [tab, setTab] = useState<RoutineTab>('diario')
    const { sellers } = useTeam()
    const { membership } = useAuth()
    const { checkins } = useCheckins()
    const { storeGoal } = useGoals()
    const { ranking } = useRanking()
    const { routineLog, history: routineHistory, registerRoutine } = useManagerRoutine()
    const { feedbacks } = useFeedbacks()
    const { pdis } = usePDIs()
    const { sendNotification } = useNotifications()
    const navigate = useNavigate()
    
    const [executing, setExecuting] = useState(false)
    const [cobrando, setCobrando] = useState(false)
    const [reuniaoDone, setReuniaoDone] = useState(false)
    const [agendaValidated, setAgendaDone] = useState(false)
    const [showAgendaModal, setShowAgendaModal] = useState(false)
    const [routineNotes, setRoutineNotes] = useState('')
    const [savingRoutine, setSavingRoutine] = useState(false)

    const diasInfo = useMemo(() => getDiasInfo(), [])
    const expectedAttainment = useMemo(() => (diasInfo.decorridos / diasInfo.total) * 100, [diasInfo])

    const atRiskSellers = useMemo(() => {
        return ranking
            .filter(item => !item.is_venda_loja && item.atingimento < (expectedAttainment - 10))
            .sort((a, b) => a.atingimento - b.atingimento)
    }, [ranking, expectedAttainment])

    const referenceDate = calculateReferenceDate()
    const previousDayCheckins = useMemo(() => checkins.filter(c => c.reference_date === referenceDate), [checkins, referenceDate])
    const pendingSellers = useMemo(() => (sellers || []).filter(s => !s.checkin_today), [sellers])
    const totalAgendamentosHoje = useMemo(() => previousDayCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0), [previousDayCheckins])
    
    const canTriggerMatinal = useMemo(() => reuniaoDone && agendaValidated && pendingSellers.length === 0, [reuniaoDone, agendaValidated, pendingSellers])
    const funilUnidade = useMemo(() => calcularFunil(checkins), [checkins])
    const diagUnidade = useMemo(() => gerarDiagnosticoMX(funilUnidade), [funilUnidade])

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekStartDateStr = weekStart.toISOString().split('T')[0]

    const weeklyCheckins = useMemo(() => checkins.filter(c => c.reference_date >= weekStartDateStr), [checkins, weekStartDateStr])
    const weeklyFunnel = useMemo(() => calcularFunil(weeklyCheckins), [weeklyCheckins])

    const feedbackStatus = useMemo(() => {
        return (sellers || []).map(s => {
            const hasFeedback = feedbacks.some(f => f.seller_id === s.id && isSameWeek(parseISO(f.week_reference), weekStart))
            return { ...s, hasFeedback }
        })
    }, [sellers, feedbacks, weekStart])

    const pdiStatus = useMemo(() => {
        return (sellers || []).map(s => {
            const latestPDI = pdis.find(p => p.seller_id === s.id)
            return { ...s, latestPDI }
        })
    }, [sellers, pdis])

    const pdiDueCount = useMemo(() => {
        return pdis.filter(p => p.due_date && new Date(p.due_date).getMonth() === new Date().getMonth()).length
    }, [pdis])
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

    const handleWhatsAppShareGroup = () => {
        const storeName = membership?.store?.name || 'Unidade'
        const header = `*MATINAL OFICIAL - ${storeName.toUpperCase()}*\n_Referência: ${referenceDate}_\n\n`
        const metricsStr = `*Vendas Ontem:* ${somarVendas(previousDayCheckins)}\n*Agendamentos Hoje:* ${totalAgendamentosHoje}\n*Gap Unidade:* ${Math.max((storeGoal?.target || 0) - somarVendas(checkins), 0)} un\n\n`
        const top5 = ranking.slice(0, 5).map(item => `${item.position}º ${item.user_name} - ${item.vnd_total}v (${item.atingimento}%)`).join('\n')
        window.open(`https://wa.me/?text=${encodeURIComponent(header + metricsStr + "*TOP 5 ATUAL:*\n" + top5)}`, '_blank')
    }

    const handleCobrarTropaWhatsApp = () => {
        if (pendingSellers.length === 0) return
        const message = `*MX ALERTA*\nOs especialistas abaixo ainda não registraram produção D-1:\n\n${pendingSellers.map(s => `• ${s.name}`).join('\n')}\n\nFavor regularizar.`
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    }

    const handleCobrarTropa = async () => {
        if (pendingSellers.length === 0) return
        setCobrando(true)
        const promises = pendingSellers.map(s => sendNotification({
            recipient_id: s.id, store_id: s.store_id || '', title: 'ALERTA: Check-in Pendente',
            message: `Registro de produção atrasado.`,
            type: 'discipline', priority: 'high', link: '/checkin'
        }))
        await Promise.all(promises)
        setCobrando(false)
        toast.success(`Notificados ${pendingSellers.length} especialistas!`)
    }

    const handleRegisterRoutine = async () => {
        setSavingRoutine(true)
        const { error } = await registerRoutine({
            reference_date: referenceDate,
            checkins_pending_count: pendingSellers.length,
            notes: routineNotes,
        })
        setSavingRoutine(false)
        if (error) toast.error(error); else toast.success('Rotina diária firmada!')
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <Typography variant="caption" tone="brand">Gestão de Unidade • Ciclo Operacional</Typography>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-secondary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Central de <span className="text-brand-primary">Rotinas</span></Typography>
                    </div>
                </div>

                <nav aria-label="Navegação de Ciclos" className="flex bg-surface-alt p-1.5 rounded-full border border-border-default shadow-inner" role="tablist">
                    {[
                        { id: 'diario', label: 'Diário', icon: Zap },
                        { id: 'semanal', label: 'Semanal', icon: BarChart3 },
                        { id: 'mensal', label: 'Estratégico', icon: Target }
                    ].map((t) => (
                        <button
                            key={t.id} role="tab" aria-selected={tab === t.id}
                            onClick={() => setTab(t.id as RoutineTab)}
                            className={cn(
                                "px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary", 
                                tab === t.id ? "bg-white text-brand-primary shadow-mx-sm" : "text-text-tertiary hover:text-text-primary"
                            )}
                        >
                            <t.icon size={14} aria-hidden="true" /> {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {tab === 'diario' && (
                        <motion.div key="diario" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                            <div className="lg:col-span-7 flex flex-col gap-mx-lg">
                                <Card className="p-10 space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner" aria-hidden="true"><Zap size={24} /></div>
                                            <div>
                                                <Typography variant="h3">Trilha de Comando Matinal</Typography>
                                                <Typography variant="caption" tone="muted">Sequência Obrigatória • Limite 10:30</Typography>
                                            </div>
                                        </div>
                                        <Badge variant="danger" className="animate-pulse shadow-mx-sm px-4">ALTA PRIORIDADE</Badge>
                                    </div>

                                    <div className="space-y-4" role="list">
                                        {[
                                            { done: reuniaoDone, set: setReuniaoDone, label: 'Reunião Individual (D-0)', desc: 'Alinhamento de metas e energia', idx: '01' },
                                            { done: agendaValidated, set: () => setShowAgendaModal(true), label: 'Validação de Agenda', desc: `${totalAgendamentosHoje} compromissos registrados`, idx: '02' }
                                        ].map(step => (
                                            <div 
                                                key={step.idx} role="checkbox" aria-checked={step.done} tabIndex={0}
                                                className={cn("flex items-center justify-between p-6 rounded-mx-xl border transition-all cursor-pointer group focus-visible:ring-4 focus-visible:ring-brand-primary/10 outline-none", step.done ? "bg-status-success-surface border-status-success/30" : "bg-surface-alt border-border-default hover:bg-white hover:shadow-mx-lg")} 
                                                onClick={() => step.set(!step.done)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", step.done ? "bg-white text-status-success border-status-success/30" : "bg-white text-text-tertiary border-border-default")}>
                                                        {step.done ? <CheckCircle2 size={20} strokeWidth={3} /> : <span className="font-black text-xs">{step.idx}</span>}
                                                    </div>
                                                    <div>
                                                        <Typography variant="h3" className={cn("text-sm", step.done ? "text-status-success" : "")}>{step.label}</Typography>
                                                        <Typography variant="caption" tone="muted">{step.desc}</Typography>
                                                    </div>
                                                </div>
                                                {!step.done && <Typography variant="caption" tone="brand" className="bg-white border border-border-default px-3 py-1.5 rounded-lg shadow-mx-sm">Concluir</Typography>}
                                            </div>
                                        ))}

                                        <div className={cn("flex items-center justify-between p-6 rounded-mx-xl border transition-all", canTriggerMatinal ? "bg-brand-secondary border-none text-white shadow-mx-xl" : "bg-surface-alt border-border-default opacity-50")}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", canTriggerMatinal ? "bg-white/10 text-white border-white/10" : "bg-white text-text-tertiary")}>
                                                    <Mail size={20} />
                                                </div>
                                                <div>
                                                    <Typography variant="h3" tone={canTriggerMatinal ? 'white' : 'default'} className="text-sm">Disparar Matinal</Typography>
                                                    <Typography variant="caption" tone={canTriggerMatinal ? 'white' : 'muted'} className={canTriggerMatinal ? 'opacity-50' : ''}>Direção & Governança</Typography>
                                                </div>
                                            </div>
                                            <Button variant={canTriggerMatinal ? 'primary' : 'outline'} disabled={!canTriggerMatinal} onClick={handleTriggerMatinal} className="h-10 px-6">Disparar</Button>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-status-info-surface text-status-info flex items-center justify-center border border-status-info/20 shadow-inner" aria-hidden="true"><BarChart3 size={20} /></div>
                                        <Typography variant="h3">Agenda Consolidada (Hoje)</Typography>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6" role="list">
                                        <div className="p-6 rounded-2xl bg-surface-alt border border-border-default shadow-inner text-center">
                                            <Typography variant="caption" tone="muted" className="mb-1">Porta</Typography>
                                            <Typography variant="h1" className="text-3xl tabular-nums">{previousDayCheckins.reduce((s, c) => s + (c.agd_cart_today || 0), 0)}</Typography>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-surface-alt border border-border-default shadow-inner text-center">
                                            <Typography variant="caption" tone="muted" className="mb-1">Digital</Typography>
                                            <Typography variant="h1" className="text-3xl tabular-nums">{previousDayCheckins.reduce((s, c) => s + (c.agd_net_today || 0), 0)}</Typography>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <aside className="lg:col-span-5 flex flex-col gap-mx-lg">
                                <section className="bg-brand-primary rounded-[2.5rem] p-10 text-white shadow-mx-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" aria-hidden="true" />
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true"><Clock size={24} /></div>
                                                <Typography variant="h3" tone="white">Status do Dia</Typography>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={handleWhatsAppShareGroup} className="text-white hover:bg-emerald-500 rounded-xl"><MessageSquare size={20} /></Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                                            <div><Typography variant="caption" tone="white" className="opacity-50 mb-1">Agendamentos</Typography><Typography variant="h1" tone="white" className="text-4xl tabular-nums">{totalAgendamentosHoje}</Typography></div>
                                            <div><Typography variant="caption" tone="white" className="opacity-50 mb-1">Pendências</Typography><Typography variant="h1" tone="white" className="text-4xl tabular-nums">{pendingSellers.length}</Typography></div>
                                        </div>
                                    </div>
                                </section>

                                <Card className="p-10 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-status-error-surface flex items-center justify-center border border-status-error/20 shadow-inner" aria-hidden="true"><ShieldAlert size={24} className="text-status-error" /></div>
                                        <div>
                                            <Typography variant="h3" className="text-status-error">Zonas de Risco</Typography>
                                            <Typography variant="caption" tone="muted">Ação prioritária necessária</Typography>
                                        </div>
                                    </div>
                                    <div className="space-y-4" role="list">
                                        {atRiskSellers.slice(0, 3).map(s => (
                                            <div key={s.user_id} className="p-5 rounded-2xl bg-status-error-surface border border-status-error/10 flex items-center justify-between group hover:bg-white hover:shadow-mx-lg transition-all" role="listitem">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-border-default flex items-center justify-center text-xs font-black text-status-error shadow-mx-sm" aria-hidden="true">{s.user_name.charAt(0)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-xs">{s.user_name}</Typography>
                                                        <Typography variant="caption" tone="error" className="text-[8px] mt-0.5">Ritmo: {s.atingimento}%</Typography>
                                                    </div>
                                                </div>
                                                <Button asChild size="icon" variant="ghost" className="text-status-error hover:bg-status-error hover:text-white rounded-xl shadow-mx-sm">
                                                    <Link to={`/feedback?seller=${s.user_id}`}><TrendingUp size={16} /></Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-10 space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-status-success-surface flex items-center justify-center border border-status-success/20 shadow-inner" aria-hidden="true"><ShieldCheck size={24} className="text-status-success" /></div>
                                        <div><Typography variant="h3">Auditoria</Typography><Typography variant="caption" tone="muted">{routineLog ? 'Sincronizado Hoje' : 'Pendente'}</Typography></div>
                                    </div>
                                    <textarea 
                                        value={routineNotes} onChange={e => setRoutineNotes(e.target.value)} placeholder="Nota operacional do dia..." 
                                        className="w-full min-h-[100px] rounded-mx-xl border border-border-default bg-surface-alt p-5 text-sm font-bold text-slate-950 outline-none focus:border-brand-primary focus:bg-white transition-all resize-none shadow-inner" 
                                    />
                                    <Button onClick={handleRegisterRoutine} disabled={savingRoutine || !!routineLog} className="w-full h-14 rounded-full shadow-mx-xl">
                                        {savingRoutine ? <RefreshCw className="animate-spin" /> : <FileCheck size={18} className="mr-2" />} Firmar Auditoria
                                    </Button>
                                </Card>
                            </aside>
                        </motion.div>
                    )}

                    {tab === 'semanal' && (
                        <motion.div key="semanal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                            <div className="lg:col-span-8 flex flex-col gap-mx-lg">
                                <Card className="p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-status-warning-surface text-status-warning flex items-center justify-center border border-status-warning/20 shadow-inner" aria-hidden="true"><MessageSquare size={24} /></div>
                                            <div>
                                                <Typography variant="h2" className="text-xl">Mapa de Feedbacks</Typography>
                                                <Typography variant="caption" tone="muted">Ritual de Segunda • Ciclo Semanal</Typography>
                                            </div>
                                        </div>
                                        <Badge variant="warning">OBRIGATÓRIO</Badge>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {feedbackStatus.map(s => (
                                            <div key={s.id} className={cn("p-6 rounded-mx-xl border transition-all flex items-center justify-between group", s.hasFeedback ? "bg-status-success-surface border-status-success/20" : "bg-surface-alt border-border-default hover:bg-white hover:shadow-mx-lg")}>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black uppercase border shadow-mx-sm transition-all", s.hasFeedback ? "bg-white text-status-success border-status-success/20" : "bg-white text-text-tertiary border-border-default group-hover:bg-status-warning group-hover:text-white")}>{s.name.charAt(0)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-xs">{s.name}</Typography>
                                                        <Typography variant="caption" tone={s.hasFeedback ? "success" : "warning"}>{s.hasFeedback ? "Concluído" : "Pendente"}</Typography>
                                                    </div>
                                                </div>
                                                {!s.hasFeedback && (
                                                    <Button asChild size="icon" variant="ghost" className="hover:bg-status-warning hover:text-white rounded-xl">
                                                        <Link to={`/feedback?seller=${s.id}`}><ChevronRight size={16} /></Link>
                                                    </Button>
                                                )}
                                                {s.hasFeedback && <CheckCircle2 className="text-status-success" size={20} />}
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card className="p-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center border border-brand-primary/10 shadow-inner" aria-hidden="true"><TrendingUp size={24} /></div>
                                        <div>
                                            <Typography variant="h2" className="text-xl">Funil de Performance Semanal</Typography>
                                            <Typography variant="caption" tone="muted">Heurística de Conversão MX</Typography>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Leads', val: weeklyFunnel.leads, icon: Users, tone: 'brand' },
                                            { label: 'Agend.', val: weeklyFunnel.agendamentos, icon: CalendarDays, tone: 'info' },
                                            { label: 'Visitas', val: weeklyFunnel.visitas, icon: Award, tone: 'warning' },
                                            { label: 'Vendas', val: weeklyFunnel.vendas, icon: Zap, tone: 'success' }
                                        ].map(item => (
                                            <div key={item.label} className="p-6 rounded-[2rem] bg-surface-alt border border-border-default text-center">
                                                <item.icon size={16} className={`mx-auto mb-2 text-text-${item.tone as any}`} />
                                                <Typography variant="caption" tone="muted" className="mb-1">{item.label}</Typography>
                                                <Typography variant="h1" className="text-2xl tabular-nums">{item.val}</Typography>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                                <div className="bg-brand-secondary rounded-[2.5rem] p-10 text-white shadow-mx-xl relative overflow-hidden">
                                    <div className="relative z-10 space-y-6">
                                        <Typography variant="h3" tone="white" className="flex items-center gap-3"><Award className="text-status-warning" /> Top Performance</Typography>
                                        <div className="space-y-4">
                                            {ranking.slice(0, 3).map((item, idx) => (
                                                <div key={item.user_id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black text-white/30">{idx + 1}º</span>
                                                        <Typography variant="h3" tone="white" className="text-xs">{item.user_name}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-xs text-brand-primary">{item.vnd_total}v</Typography>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </motion.div>
                    )}

                    {tab === 'mensal' && (
                        <motion.div key="mensal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                            <div className="lg:col-span-7 flex flex-col gap-mx-lg">
                                <Card className="p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-status-error-surface text-status-error flex items-center justify-center border border-status-error/20 shadow-inner" aria-hidden="true"><Target size={24} /></div>
                                        <div>
                                            <Typography variant="h2" className="text-xl">Controle de Metas & Sell-out</Typography>
                                            <Typography variant="caption" tone="muted">Status de Entrega Mensal</Typography>
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        <div>
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <Typography variant="caption" tone="muted" className="mb-1">Atingimento Real</Typography>
                                                    <Typography variant="h1" className="text-4xl tabular-nums">{calcularAtingimento(somarVendas(checkins), storeGoal?.target || 0)}%</Typography>
                                                </div>
                                                <div className="text-right">
                                                    <Typography variant="caption" tone="muted" className="mb-1">Meta: {storeGoal?.target || 0} un</Typography>
                                                    <Typography variant="h3" tone="brand">{somarVendas(checkins)} / {storeGoal?.target || 0}</Typography>
                                                </div>
                                            </div>
                                            <div className="h-4 bg-surface-alt rounded-full overflow-hidden border border-border-default">
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${Math.min(calcularAtingimento(somarVendas(checkins), storeGoal?.target || 0), 100)}%` }} 
                                                    className={cn("h-full rounded-full shadow-mx-sm", calcularAtingimento(somarVendas(checkins), storeGoal?.target || 0) >= 100 ? "bg-status-success" : "bg-brand-primary")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary/5 text-brand-primary flex items-center justify-center border border-brand-primary/10 shadow-inner" aria-hidden="true"><Award size={24} /></div>
                                        <div>
                                            <Typography variant="h2" className="text-xl">Mapa de PDIs</Typography>
                                            <Typography variant="caption" tone="muted">Plano de Desenvolvimento Individual</Typography>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {pdiStatus.map(s => (
                                            <div key={s.id} className={cn("p-6 rounded-mx-xl border transition-all flex items-center justify-between group", s.latestPDI ? "bg-brand-primary/5 border-brand-primary/10" : "bg-surface-alt border-border-default hover:bg-white hover:shadow-mx-lg")}>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black uppercase border shadow-mx-sm transition-all", s.latestPDI ? "bg-white text-brand-primary border-brand-primary/20" : "bg-white text-text-tertiary border-border-default group-hover:bg-brand-primary group-hover:text-white")}>{s.name.charAt(0)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-xs">{s.name}</Typography>
                                                        <Typography variant="caption" tone={s.latestPDI ? "brand" : "muted"}>{s.latestPDI ? "PDI ATIVO" : "SEM PDI"}</Typography>
                                                    </div>
                                                </div>
                                                <Button asChild size="icon" variant="ghost" className="hover:bg-brand-primary hover:text-white rounded-xl">
                                                    <Link to="/pdi"><ChevronRight size={16} /></Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            <aside className="lg:col-span-5 flex flex-col gap-mx-lg">
                                <div className="bg-brand-primary rounded-[2.5rem] p-10 text-white shadow-mx-xl relative overflow-hidden">
                                    <div className="relative z-10 space-y-6">
                                        <Typography variant="h3" tone="white">Projeção Final</Typography>
                                        <div className="pt-6 border-t border-white/10">
                                            <Typography variant="h1" tone="white" className="text-5xl tabular-nums mb-2">{Math.round(calcularAtingimento(somarVendas(checkins), storeGoal?.target || 0) * (diasInfo.total / diasInfo.decorridos))}%</Typography>
                                            <Typography variant="caption" tone="white" className="opacity-50 uppercase tracking-[0.2em]">Atingimento Projetado</Typography>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
