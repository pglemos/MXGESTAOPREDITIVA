import React, { useState, useMemo } from 'react'
import { useTeam } from '@/hooks/useTeam'
import { CHECKIN_DEADLINE_LABEL, calculateReferenceDate, useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { useManagerRoutine } from '@/hooks/useManagerRoutine'
import { useFeedbacks, usePDIs, useNotifications } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { somarVendas, calcularAtingimento, calcularFunil, gerarDiagnosticoMX, getDiasInfo } from '@/lib/calculations'
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
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

type RoutineTab = 'diario' | 'semanal' | 'mensal'

export default function RotinaGerente() {
    const [tab, setTab] = useState<RoutineTab>('diario')
    const { sellers, loading: loadingTeam } = useTeam()
    const { membership } = useAuth()
    const { checkins, loading: loadingCheckins } = useCheckins()
    const { storeGoal } = useGoals()
    const { ranking, loading: loadingRanking } = useRanking()
    const { routineLog, history: routineHistory, loading: loadingRoutine, registerRoutine } = useManagerRoutine()
    const { feedbacks, loading: loadingFeedbacks } = useFeedbacks()
    const { pdis, loading: loadingPDIs } = usePDIs()
    const { sendNotification } = useNotifications()
    const navigate = useNavigate()
    
    const [executing, setExecuting] = useState(false)
    const [cobrando, setCobrando] = useState(false)
    const [reuniaoDone, setReuniaoDone] = useState(false)
    const [agendaValidated, setAgendaDone] = useState(false)
    const [showAgendaModal, setShowAgendaModal] = useState(false)
    const [routineNotes, setRoutineNotes] = useState('')
    const [savingRoutine, setSavingRoutine] = useState(false)

    // Expected attainment calculation (DRR context)
    const diasInfo = useMemo(() => getDiasInfo(), [])
    const expectedAttainment = useMemo(() => (diasInfo.decorridos / diasInfo.total) * 100, [diasInfo])

    // Sellers in risk zone (attainment < expectedAttainment - 10%)
    const atRiskSellers = useMemo(() => {
        return ranking
            .filter(item => !item.is_venda_loja && item.atingimento < (expectedAttainment - 10))
            .sort((a, b) => a.atingimento - b.atingimento)
    }, [ranking, expectedAttainment])

    // Derived State - Metrics
    const referenceDate = calculateReferenceDate()
    const previousDayCheckins = useMemo(() => checkins.filter(c => c.reference_date === referenceDate), [checkins, referenceDate])
    const pendingSellers = useMemo(() => (sellers || []).filter(s => !s.checkin_today), [sellers])
    const totalAgendamentosHoje = useMemo(() => previousDayCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0) + (c.agd_net_today || 0), 0), [previousDayCheckins])
    const previousDaySummary = useMemo(() => ({
        leads: previousDayCheckins.reduce((acc, c) => acc + (c.leads_prev_day || 0), 0),
        visitas: previousDayCheckins.reduce((acc, c) => acc + (c.visit_prev_day || 0), 0),
        agendamentos: previousDayCheckins.reduce((acc, c) => acc + (c.agd_cart_prev_day || 0) + (c.agd_net_prev_day || 0), 0),
        vendas: somarVendas(previousDayCheckins),
    }), [previousDayCheckins])
    
    // Agendamentos do dia por vendedor
    const todayAgendas = useMemo(() => {
        const usersMap = new Map()
        previousDayCheckins.forEach(c => {
            if ((c.agd_cart_today || 0) > 0 || (c.agd_net_today || 0) > 0) {
                if (!usersMap.has(c.seller_user_id)) {
                    usersMap.set(c.seller_user_id, {
                        id: c.seller_user_id,
                        seller_name: sellers?.find(s => s.id === c.seller_user_id)?.name || 'Vendedor',
                        agd_cart_today: 0,
                        agd_net_today: 0
                    })
                }
                const entry = usersMap.get(c.seller_user_id)
                entry.agd_cart_today += (c.agd_cart_today || 0)
                entry.agd_net_today += (c.agd_net_today || 0)
            }
        })
        return Array.from(usersMap.values())
    }, [previousDayCheckins, sellers])

    const canTriggerMatinal = useMemo(() => {
        return reuniaoDone && agendaValidated && pendingSellers.length === 0
    }, [reuniaoDone, agendaValidated, pendingSellers])
    const funilUnidade = useMemo(() => calcularFunil(checkins), [checkins])
    const diagUnidade = useMemo(() => gerarDiagnosticoMX(funilUnidade), [funilUnidade])

    // Feedback do Time na Semana
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const feedbackStatus = useMemo(() => {
        return (sellers || []).map(s => {
            const hasFeedback = feedbacks.some(f => f.seller_id === s.id && isSameWeek(parseISO(f.week_reference), weekStart))
            return { ...s, hasFeedback }
        })
    }, [sellers, feedbacks, weekStart])

    const pdiDueCount = useMemo(() => {
        return pdis.filter(p => p.due_date && new Date(p.due_date).getMonth() === new Date().getMonth()).length
    }, [pdis])

    const handleRegisterRoutine = async () => {
        setSavingRoutine(true)
        const { error } = await registerRoutine({
            reference_date: referenceDate,
            checkins_pending_count: pendingSellers.length,
            sem_registro_count: pendingSellers.length,
            agd_cart_today: previousDayCheckins.reduce((acc, c) => acc + (c.agd_cart_today || 0), 0),
            agd_net_today: previousDayCheckins.reduce((acc, c) => acc + (c.agd_net_today || 0), 0),
            previous_day_leads: previousDaySummary.leads,
            previous_day_sales: previousDaySummary.vendas,
            ranking_snapshot: ranking.slice(0, 10).map(item => ({
                user_id: item.user_id,
                user_name: item.user_name,
                position: item.position,
                vnd_total: item.vnd_total,
                meta: item.meta,
                atingimento: item.atingimento,
            })),
            notes: routineNotes,
        })
        setSavingRoutine(false)

        if (error) {
            toast.error(error)
            return
        }

        toast.success('Rotina diária registrada para auditoria MX.')
    }

    const handleTriggerMatinal = async () => {
        setExecuting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relatorio-matinal`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json'
                }
            })
            if (response.ok) {
                toast.success('Relatório Matinal disparado para a diretoria!')
            } else {
                toast.error('Falha no disparo do relatório.')
            }
        } catch (e) {
            toast.error('Erro de conexão com o servidor.')
        } finally {
            setExecuting(false)
        }
    }

    const handleWhatsAppShareGroup = () => {
        const storeName = membership?.store?.name || 'Unidade Operacional'
        const header = `*MATINAL OFICIAL - ${storeName.toUpperCase()}*\n_Referência: ${referenceDate}_\n\n`
        const metricsStr = `*Vendas Ontem:* ${previousDaySummary.vendas}\n*Agendamentos Hoje:* ${totalAgendamentosHoje}\n*Gap Unidade:* ${Math.max((storeGoal?.target || 0) - somarVendas(checkins), 0)} un\n\n`
        const top5 = ranking.slice(0, 5).map(item => `${item.position}º ${item.user_name} - ${item.vnd_total}v (${item.atingimento}%)`).join('\n')
        
        const message = encodeURIComponent(header + metricsStr + "*TOP 5 ATUAL:*\n" + top5)
        window.open(`https://wa.me/?text=${message}`, '_blank')
        toast.success('Preparando compartilhamento no WhatsApp...')
    }

    const handleCobrarTropaWhatsApp = () => {
        if (pendingSellers.length === 0) return
        const storeName = membership?.store?.name || 'Unidade'
        const header = `*MX ALERTA - ${storeName.toUpperCase()}*\n_BLOQUEIO DE MATINAL_\n\n`
        const body = `Os especialistas abaixo ainda não registraram sua produção D-1:\n\n`
        const list = pendingSellers.map(s => `• ${s.name}`).join('\n')
        const footer = `\n\n_Prazo de edição: ${CHECKIN_DEADLINE_LABEL}_\nFavor regularizar imediatamente.`
        
        const message = encodeURIComponent(header + body + list + footer)
        window.open(`https://wa.me/?text=${message}`, '_blank')
        toast.success('Lista de cobrança enviada para o WhatsApp!')
    }

    const handleCobrarTropa = async () => {
        if (pendingSellers.length === 0) return
        setCobrando(true)
        const promises = pendingSellers.map(s => sendNotification({
            recipient_id: s.id,
            store_id: s.store_id || '',
            title: 'ALERTA: Check-in Pendente',
            message: `Seu registro de produção está atrasado (Prazo: ${CHECKIN_DEADLINE_LABEL}). Lance seus dados para o matinal.`,
            type: 'discipline',
            priority: 'high',
            link: '/checkin'
        }))
        await Promise.all(promises)
        setCobrando(false)
        toast.success(`Notificação enviada para ${pendingSellers.length} especialistas!`)
    }

    if (loadingTeam || loadingCheckins || loadingRanking || loadingFeedbacks || loadingPDIs || loadingRoutine) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-white" role="status">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-4" aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">Sincronizando Central MX...</p>
            </div>
        )
    }

    return (
        <main className="w-full h-full flex flex-col gap-10 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-indigo-700 mb-2 block font-black tracking-[0.4em] uppercase">Gestão de Unidade • Ciclo Operacional</span>
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Central de <span className="text-indigo-600">Rotinas</span></h1>
                    </div>
                </div>

                <nav aria-label="Navegação de Ciclos" className="flex bg-gray-100 p-1.5 rounded-full border border-gray-200 shadow-inner" role="tablist">
                    {[
                        { id: 'diario', label: 'Diário', icon: Zap },
                        { id: 'semanal', label: 'Semanal', icon: BarChart3 },
                        { id: 'mensal', label: 'Estratégico', icon: Target }
                    ].map((t) => (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={tab === t.id}
                            onClick={() => setTab(t.id as RoutineTab)}
                            className={cn(
                                "px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-500", 
                                tab === t.id ? "bg-white text-indigo-700 shadow-md" : "text-gray-500 hover:text-slate-900"
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
                        <motion.div key="diario" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Ritual Matinal Checklist */}
                            <div className="lg:col-span-7 flex flex-col gap-10">
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner" aria-hidden="true">
                                                <Zap size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-950">Trilha de Comando Matinal</h3>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Sequência Obrigatória • Limite 10:30</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2 mr-4" aria-label="Progresso da trilha">
                                                <div className={cn("w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black", reuniaoDone ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500")} aria-label="Passo 1">1</div>
                                                <div className={cn("w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black", agendaValidated ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500")} aria-label="Passo 2">2</div>
                                                <div className={cn("w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black", pendingSellers.length === 0 ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500")} aria-label="Passo 3">3</div>
                                            </div>
                                            <Badge className="bg-rose-600 text-white border-none font-black text-[10px] px-4 py-1.5 rounded-lg animate-pulse">ALTA PRIORIDADE</Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-4" role="list" aria-label="Lista de rituais">
                                        {/* Passo 1: Reunião */}
                                        <div 
                                            role="button"
                                            aria-pressed={reuniaoDone}
                                            tabIndex={0}
                                            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setReuniaoDone(!reuniaoDone)}
                                            className={cn("flex items-center justify-between p-6 rounded-[1.5rem] border transition-all cursor-pointer group focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none", reuniaoDone ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-lg")} 
                                            onClick={() => setReuniaoDone(!reuniaoDone)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", reuniaoDone ? "bg-white text-emerald-600 border-emerald-300 shadow-sm" : "bg-white text-gray-400 border-gray-200")}>
                                                    {reuniaoDone ? <CheckCircle2 size={20} strokeWidth={3} aria-hidden="true" /> : <span className="font-black text-xs text-slate-400">01</span>}
                                                </div>
                                                <div>
                                                    <p className={cn("text-sm font-black uppercase tracking-tight", reuniaoDone ? "text-emerald-800" : "text-slate-950")}>Reunião Individual (D-0)</p>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Alinhamento de metas e energia da tropa</p>
                                                </div>
                                            </div>
                                            {!reuniaoDone && <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm">Marcar Concluído</span>}
                                        </div>

                                        {/* Passo 2: Validação de Agenda */}
                                        <div 
                                            role="button"
                                            aria-pressed={agendaValidated}
                                            tabIndex={0}
                                            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (agendaValidated ? setAgendaDone(false) : setShowAgendaModal(true))}
                                            className={cn("flex items-center justify-between p-6 rounded-[1.5rem] border transition-all cursor-pointer group focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none", agendaValidated ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-lg")} 
                                            onClick={() => { if (!agendaValidated) setShowAgendaModal(true); else setAgendaDone(false) }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", agendaValidated ? "bg-white text-emerald-600 border-emerald-300 shadow-sm" : "bg-white text-gray-400 border-gray-200")}>
                                                    {agendaValidated ? <CheckCircle2 size={20} strokeWidth={3} aria-hidden="true" /> : <span className="font-black text-xs text-slate-400">02</span>}
                                                </div>
                                                <div>
                                                    <p className={cn("text-sm font-black uppercase tracking-tight", agendaValidated ? "text-emerald-800" : "text-slate-950")}>Fechamento de Agendamentos</p>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Validar {totalAgendamentosHoje} compromissos registrados</p>
                                                </div>
                                            </div>
                                            {!agendaValidated && <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest bg-white border border-indigo-200 px-3 py-1.5 rounded-lg shadow-sm">Abrir Validação</span>}
                                        </div>

                                        {/* Passo 3: Disparo Final */}
                                        <div className={cn("flex items-center justify-between p-6 rounded-[1.5rem] border transition-all", canTriggerMatinal ? "bg-slate-950 border-slate-800 text-white shadow-2xl" : "bg-gray-50 border-gray-100 opacity-50")}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", canTriggerMatinal ? "bg-white/10 text-indigo-400 border-white/10" : "bg-white text-gray-400 border-gray-200")}>
                                                    <Mail size={20} aria-hidden="true" />
                                                </div>
                                                <div>
                                                    <p className={cn("text-sm font-black uppercase tracking-tight", canTriggerMatinal ? "text-white" : "text-slate-500")}>Disparar Matinal Direção</p>
                                                    <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", canTriggerMatinal ? "text-white/50" : "text-gray-400")}>
                                                        {pendingSellers.length > 0 ? "Aguardando Check-ins" : "Pronto para Envio"}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleTriggerMatinal} 
                                                disabled={executing || !canTriggerMatinal} 
                                                aria-label="Disparar relatório matinal"
                                                className={cn(
                                                    "px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all focus-visible:ring-4 outline-none",
                                                    canTriggerMatinal ? "bg-indigo-600 hover:bg-indigo-700 text-white focus-visible:ring-indigo-500/20" : "bg-gray-200 text-gray-500 focus-visible:ring-gray-500/10"
                                                )}
                                            >
                                                {executing ? <RefreshCw size={14} className="animate-spin" aria-hidden="true" /> : <FileCheck size={14} aria-hidden="true" />}
                                                Executar Disparo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Agenda Consolidada */}
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-inner" aria-hidden="true">
                                            <CalendarDays size={20} />
                                        </div>
                                        <h3 className="text-lg font-black uppercase tracking-tight leading-none text-slate-950">Agenda Consolidada (Hoje)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Agendamentos Porta</p>
                                            <p className="text-3xl font-black text-slate-950 font-mono-numbers">{checkins.reduce((s, c) => s + (c.agd_cart_today || 0), 0)}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Agendamentos Digital</p>
                                            <p className="text-3xl font-black text-slate-950 font-mono-numbers">{checkins.reduce((s, c) => s + (c.agd_net_today || 0), 0)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-950">Vendedores Pendentes</h3>
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1">Bloqueio de visibilidade em vigor</p>
                                        </div>
                                        {pendingSellers.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={handleCobrarTropa} 
                                                    disabled={cobrando}
                                                    className="px-6 h-10 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 outline-none focus-visible:ring-4 focus-visible:ring-slate-500/10"
                                                >
                                                    Notificar App
                                                </button>
                                                <button 
                                                    onClick={handleCobrarTropaWhatsApp} 
                                                    disabled={cobrando}
                                                    className="px-6 h-10 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 border border-emerald-500 outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
                                                >
                                                    Cobrança (WhatsApp)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="Especialistas pendentes">
                                        {pendingSellers.map(s => (
                                            <div key={s.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-rose-200 transition-all" role="listitem">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[11px] font-black uppercase shadow-sm group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all" aria-hidden="true">{s.name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-slate-950 tracking-tight">{s.name}</p>
                                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Sem Registro</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => window.open(`https://wa.me/${s.phone?.replace(/\D/g, '')}`, '_blank')} aria-label={`Cobrar ${s.name} no WhatsApp`} className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all focus-visible:ring-4 focus-visible:ring-emerald-500/10 outline-none"><MessageSquare size={16} aria-hidden="true" /></button>
                                            </div>
                                        ))}
                                        {pendingSellers.length === 0 && (
                                            <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-100 rounded-[2rem] bg-emerald-50/20">
                                                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-40" aria-hidden="true" />
                                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Toda a tropa registrou produção!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar - Context */}
                            <aside className="lg:col-span-5 flex flex-col gap-10">
                                <section className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden" aria-labelledby="status-dia-title">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" aria-hidden="true" />
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true">
                                                    <Clock size={24} className="text-white" />
                                                </div>
                                                <h3 id="status-dia-title" className="text-xl font-black uppercase tracking-tight">Status do Dia</h3>
                                            </div>
                                            <button 
                                                onClick={handleWhatsAppShareGroup}
                                                className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 hover:bg-emerald-500 hover:border-emerald-400 transition-all group focus-visible:ring-4 focus-visible:ring-white/20 outline-none"
                                                aria-label="Enviar Resumo no Grupo de WhatsApp"
                                            >
                                                <MessageSquare size={20} className="text-white" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Agendamentos D-0</p>
                                                <p className="text-4xl font-black tracking-tighter tabular-nums">{totalAgendamentosHoje}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Sem Registro</p>
                                                <p className="text-4xl font-black tracking-tighter tabular-nums">{pendingSellers.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-8" aria-labelledby="risco-title">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-200 shadow-inner" aria-hidden="true">
                                            <ShieldAlert size={24} className="text-rose-600" />
                                        </div>
                                        <div>
                                            <h3 id="risco-title" className="text-lg font-black uppercase tracking-tight leading-none text-rose-700">Zonas de Risco</h3>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Ação prioritária necessária</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4" role="list" aria-label="Especialistas em risco">
                                        {atRiskSellers.length > 0 ? atRiskSellers.slice(0, 3).map(s => (
                                            <div key={s.user_id} className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:border-rose-200 transition-all" role="listitem">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-xs font-black text-rose-700 shadow-sm" aria-hidden="true">{s.user_name.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-slate-950">{s.user_name}</p>
                                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-0.5">Ritmo: {s.atingimento}% (Alvo: {Math.round(expectedAttainment)}%)</p>
                                                    </div>
                                                </div>
                                                <Link to={`/feedback?seller=${s.user_id}`} aria-label={`Dar feedback para ${s.user_name}`} className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-rose-200 focus-visible:ring-4 focus-visible:ring-rose-500/20 outline-none"><TrendingUp size={16} aria-hidden="true" /></Link>
                                            </div>
                                        )) : (
                                            <div className="py-8 text-center border-2 border-dashed border-emerald-100 rounded-3xl bg-emerald-50/20">
                                                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-40" aria-hidden="true" />
                                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Nenhum especialista abaixo do ritmo!</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-6" aria-labelledby="ranking-side-title">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-200" aria-hidden="true">
                                                <Award size={24} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <h3 id="ranking-side-title" className="text-lg font-black uppercase tracking-tight leading-none text-slate-950">Ranking do Momento</h3>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Ritmo mensal da loja</p>
                                            </div>
                                        </div>
                                        <Link to="/ranking" className="text-[10px] font-black text-indigo-700 uppercase tracking-widest hover:underline outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1">Ver todos</Link>
                                    </div>
                                    <div className="space-y-3" role="list" aria-label="Top 5 vendedores">
                                        {ranking.slice(0, 5).map(item => (
                                            <div key={item.user_id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white transition-all" role="listitem">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-slate-950 shadow-sm" aria-hidden="true">{item.position}</span>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-tight text-slate-900">{item.user_name}</p>
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">{item.vnd_total} vendas / meta {item.meta}</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-indigo-600 text-white border-none text-[10px] font-black rounded-lg h-6 px-2">{item.atingimento}%</Badge>
                                            </div>
                                        ))}
                                        {ranking.length === 0 && (
                                            <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aguardando dados de check-in.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-6" aria-labelledby="auditoria-title">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-200 shadow-inner" aria-hidden="true">
                                            <ShieldCheck size={24} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 id="auditoria-title" className="text-lg font-black uppercase tracking-tight leading-none text-slate-950">Registro de Auditoria</h3>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                                                {routineLog ? `Salva às ${new Date(routineLog.executed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Auditoria não registrada hoje'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <label htmlFor="routine-notes" className="sr-only">Nota operacional do dia</label>
                                        <textarea
                                            id="routine-notes"
                                            value={routineNotes}
                                            onChange={event => setRoutineNotes(event.target.value)}
                                            placeholder="Nota operacional do dia..."
                                            className="w-full min-h-[80px] rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none shadow-inner"
                                        />
                                        <button
                                            onClick={handleRegisterRoutine}
                                            disabled={savingRoutine || !!routineLog}
                                            className="h-14 px-8 rounded-2xl bg-slate-950 text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl hover:bg-emerald-600 transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none"
                                        >
                                            {savingRoutine ? <RefreshCw size={16} className="animate-spin" aria-hidden="true" /> : <FileCheck size={16} aria-hidden="true" />}
                                            {routineLog ? 'Registro Efetuado' : 'Firmar Auditoria'}
                                        </button>
                                    </div>
                                    {routineHistory.length > 0 && (
                                        <div className="pt-6 border-t border-gray-100 space-y-3 mt-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Log Recente</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {routineHistory.slice(0, 3).map(log => (
                                                    <div key={log.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-[10px] font-black uppercase text-gray-600 group hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                                                        <span className="text-slate-900"><time dateTime={log.routine_date}>{new Date(`${log.routine_date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</time></span>
                                                        <Badge className="bg-white border-gray-200 text-gray-500 font-black h-5">{log.checkins_pending_count} Pendências</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </aside>
                        </motion.div>
                    )}

                    {tab === 'semanal' && (
                        <motion.section key="semanal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10" aria-label="Visão Semanal">
                            {/* Unidade Gap Diagnostic */}
                            <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                                <div className="relative z-10 grid lg:grid-cols-2 gap-14">
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center border-4 border-white/10 shadow-2xl group-hover:rotate-12 transition-transform" aria-hidden="true">
                                                <BarChart3 size={32} className="text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">Gargalo da Unidade</h2>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2 opacity-90 italic">Diagnóstico Estratégico MX</p>
                                            </div>
                                        </div>
                                        <div className={cn("p-8 rounded-[2rem] border relative overflow-hidden", diagUnidade.gargalo ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400")}>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-70">Status do Funil</h4>
                                            <p className="text-2xl font-black uppercase tracking-tight leading-tight">{diagUnidade.diagnostico}</p>
                                            <div className="mt-6 flex items-center gap-3">
                                                <Zap size={18} className="text-indigo-400" aria-hidden="true" />
                                                <p className="text-sm font-bold italic text-white/90">{diagUnidade.sugestao}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 border-l border-white/10 pl-14">
                                        {[
                                            { label: 'Eficiência Leads', val: funilUnidade.tx_lead_agd, bench: 20 },
                                            { label: 'Eficiência Agd', val: funilUnidade.tx_agd_visita, bench: 60 },
                                            { label: 'Eficiência Vnd', val: funilUnidade.tx_visita_vnd, bench: 33 },
                                            { label: 'Vendas Acum.', val: funilUnidade.vnd_total, bench: null }
                                        ].map(m => (
                                            <div key={m.label}>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">{m.label}</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={cn("text-4xl font-black tracking-tighter tabular-nums", m.bench && m.val < m.bench ? "text-rose-400" : "text-white")}>{m.val}{m.bench ? '%' : ''}</span>
                                                    {m.bench && <span className="text-[10px] font-black text-white/30 uppercase">/ {m.bench}%</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Matrix */}
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-950">Feedback Estruturado</h3>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Status de Mentorias da Semana</p>
                                    </div>
                                    <Link to="/feedback" className="h-12 px-8 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">Iniciar Feedback <ChevronRight size={16} aria-hidden="true" /></Link>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Situação de feedback dos especialistas">
                                    {feedbackStatus.map(s => {
                                        const sellerCheckins = checkins.filter(c => c.seller_user_id === s.id && isSameWeek(parseISO(c.reference_date), weekStart))
                                        const sellerFunil = calcularFunil(sellerCheckins)
                                        
                                        return (
                                            <div key={s.id} className={cn("p-8 rounded-[2.5rem] border flex flex-col gap-6 transition-all group", s.hasFeedback ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1")} role="listitem">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-sm transition-all", s.hasFeedback ? "bg-white text-emerald-700 border-emerald-300" : "bg-gray-50 text-gray-400 border-gray-200 group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950")} aria-hidden="true">{s.name.charAt(0)}</div>
                                                        <div>
                                                            <p className={cn("text-base font-black uppercase tracking-tight", s.hasFeedback ? "text-emerald-800" : "text-slate-950")}>{s.name}</p>
                                                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none px-3 h-6 mt-1.5 rounded-lg", s.hasFeedback ? "bg-emerald-600 text-white" : "bg-rose-600 text-white shadow-lg shadow-rose-100 animate-pulse")}>
                                                                {s.hasFeedback ? 'Ritual Concluído' : 'Pendente Auditoria'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {!s.hasFeedback && (
                                                        <Link to={`/feedback?seller=${s.id}`} aria-label={`Dar feedback para ${s.name}`} className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20">
                                                            <Zap size={20} fill="currentColor" aria-hidden="true" />
                                                        </Link>
                                                    )}
                                                </div>

                                                {!s.hasFeedback && (
                                                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                                                        <div>
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Vendas (Semana)</p>
                                                            <p className="text-xl font-black text-slate-950 font-mono-numbers">{sellerFunil.vnd_total}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-indigo-700 uppercase tracking-widest mb-1">Eficiência Vnd</p>
                                                            <p className="text-xl font-black text-indigo-700 font-mono-numbers">{sellerFunil.tx_visita_vnd}%</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {tab === 'mensal' && (
                        <motion.section key="mensal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10" aria-label="Visão Estratégica">
                            {/* Career & PDI Monitor */}
                            <div className="lg:col-span-8 flex flex-col gap-10">
                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-inner" aria-hidden="true">
                                                <Target size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-950">Consolidação de PDIs</h3>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Planos de Desenvolvimento Individual</p>
                                            </div>
                                        </div>
                                        <Link to="/pdi" className="text-[10px] font-black text-indigo-700 uppercase tracking-widest border-b-2 border-indigo-200 hover:border-indigo-700 transition-all pb-1 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none rounded">Gerenciar Matriz</Link>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all">
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Revisões no Mês</span>
                                                <p className="text-5xl font-black text-slate-950 tracking-tighter tabular-nums">{pdiDueCount}</p>
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-500 mt-6 uppercase leading-tight italic opacity-80">Especialistas aguardando ajuste de rota este mês.</p>
                                        </div>
                                        <div className="p-8 bg-slate-950 rounded-[2rem] text-white flex flex-col justify-between shadow-2xl shadow-indigo-100 group relative overflow-hidden">
                                            <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4" aria-hidden="true"><Award size={120} /></div>
                                            <div className="space-y-2 relative z-10">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Planos Ativos</span>
                                                <p className="text-5xl font-black text-white tracking-tighter tabular-nums">{pdis.length}</p>
                                            </div>
                                            <p className="text-[11px] font-bold text-white/50 mt-6 uppercase leading-tight relative z-10 italic">Compromisso firmado com {Math.round((pdis.length / (sellers?.length || 1)) * 100)}% da tropa.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-8 text-slate-950">Trilho de Evolução</h3>
                                    <div className="space-y-4" role="list" aria-label="PDIs em andamento">
                                        {pdis.slice(0, 5).map(p => (
                                            <div key={p.id} className="p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex flex-col gap-6 group hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all" role="listitem">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all transform group-hover:scale-105" aria-hidden="true">
                                                            <User size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black uppercase text-slate-950 tracking-tight">{(p as any).seller_name}</p>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 italic">{(p as any).meta_6m}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase py-1 border-indigo-200 text-indigo-700 bg-white">Rev: {p.due_date ? <time dateTime={p.due_date}>{new Date(p.due_date).toLocaleDateString('pt-BR')}</time> : '--'}</Badge>
                                                        <button onClick={() => navigate('/pdi')} aria-label={`Ver PDI de ${(p as any).seller_name}`} className="w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"><ChevronRight size={18} aria-hidden="true" /></button>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Ação Prioritária</p>
                                                        <p className="text-xs font-bold text-slate-700 line-clamp-1">{p.action_1}</p>
                                                    </div>
                                                    <div className="flex items-center justify-end">
                                                        <div className="flex -space-x-2" aria-label="Progresso de ações">
                                                            {[1,2,3,4,5].map(i => (
                                                                <div key={i} className={cn("w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black", (p as any)[`action_${i}`] ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500")} aria-label={`Ação ${i}`}>
                                                                    <span className="sr-only">Ação {i}: {(p as any)[`action_${i}`] ? 'Definida' : 'Pendente'}</span>
                                                                    {i}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar - Focus */}
                            <aside className="lg:col-span-4 flex flex-col gap-10">
                                <div className="bg-amber-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-amber-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" aria-hidden="true" />
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true">
                                                <TrendingUp size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tight">Retenção MX</h3>
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed italic opacity-95 border-t border-white/10 pt-8">
                                            "PDIs atualizados reduzem a rotatividade em 40%. O foco do mês é consolidar a visão de 24 meses para os top performers."
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            {/* Modal de Validação de Agendamentos D-0 */}
            <AnimatePresence>
                {showAgendaModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="modal-agenda-title">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAgendaModal(false)} className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" aria-hidden="true" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg" aria-hidden="true"><CalendarDays size={24} /></div>
                                    <div>
                                        <h2 id="modal-agenda-title" className="text-xl font-black uppercase tracking-tight text-slate-950">Validação de Agenda D-0</h2>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Auditagem de Compromissos do Dia</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAgendaModal(false)} aria-label="Fechar modal" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-all outline-none focus-visible:ring-4 focus-visible:ring-rose-500/10"><X size={20} aria-hidden="true" /></button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                                <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-6">
                                    "Atenção: A validação de agenda é o fechamento dos agendamentos captados ontem para comparecimento hoje. Confirme se cada especialista já validou o 'OK' do cliente."
                                </p>
                                
                                <div className="space-y-4" role="list" aria-label="Agendamentos por especialista">
                                    {todayAgendas.map(c => (
                                        <div key={c.id} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-indigo-300 transition-all" role="listitem">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xs font-black uppercase shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all" aria-hidden="true">{(c as any).seller_name?.charAt(0) || 'S'}</div>
                                                <div>
                                                    <p className="text-sm font-black uppercase text-slate-950">{(c as any).seller_name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-black text-indigo-700 uppercase">Porta: {c.agd_cart_today}</span>
                                                        <div className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
                                                        <span className="text-[10px] font-black text-cyan-700 uppercase">Digital: {c.agd_net_today}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge className="bg-white border-gray-200 text-gray-500 text-[10px] font-black uppercase h-6 px-3">Auditado</Badge>
                                        </div>
                                    ))}
                                    {todayAgendas.length === 0 && (
                                        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nenhum agendamento para hoje.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-10 bg-gray-50 border-t border-gray-100">
                                <button 
                                    onClick={() => { setAgendaDone(true); setShowAgendaModal(false); toast.success('Agenda D-0 validada!') }}
                                    className="w-full py-6 rounded-full bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-xl outline-none focus-visible:ring-8 focus-visible:ring-slate-500/20"
                                >
                                    <ShieldCheck size={20} strokeWidth={3} aria-hidden="true" /> Confirmar Validação MX
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}
