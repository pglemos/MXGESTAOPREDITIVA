import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CHECKIN_DEADLINE_LABEL, CHECKIN_EDIT_LIMIT_LABEL, canEditCurrentCheckin, isCheckinLate, useCheckins } from '@/hooks/useCheckins'
import { validarFunil, calcularTotais } from '@/lib/calculations'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckSquare, Users, Globe, Car, Eye, Send, Sparkles,
    MessageSquare, AlertTriangle, ChevronLeft, Minus, Plus, Zap,
    ArrowLeft, Target, TrendingUp, Info, RefreshCw, Trash2,
    X, History, CalendarDays, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ZERO_REASONS = ['Folga', 'Treinamento', 'Feriado', 'Dia administrativo', 'Outro']
const MAX_INPUT_VALUE = 999 

interface CheckinForm {
    leads: number
    agd_cart_prev: number
    agd_net_prev: number
    agd_cart: number
    agd_net: number
    vnd_porta: number
    vnd_cart: number
    vnd_net: number
    visitas: number
    note: string
    zero_reason: string
}

export default function Checkin() {
    const { profile, role, membership, storeId } = useAuth()
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const [changedFields, setChangedFields] = useState<Set<keyof CheckinForm>>(new Set())
    const [metricScope, setMetricScope] = useState<'daily' | 'adjustment'>('daily')
    
    const [form, setForm] = useState<CheckinForm>({
        leads: 0, agd_cart_prev: 0, agd_net_prev: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0, note: '', zero_reason: '',
    })

    const { todayCheckin, saveCheckin, loading: hookLoading, referenceDate, fetchCheckinByDate } = useCheckins()
    const [historicalCheckin, setHistoricalCheckin] = useState<any>(null)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [customReferenceDate, setCustomReferenceDate] = useState('')

    useEffect(() => {
        if (referenceDate) setCustomReferenceDate(referenceDate)
    }, [referenceDate])

    // Load record based on date/scope
    useEffect(() => {
        if (!customReferenceDate || !referenceDate) return

        if (customReferenceDate === referenceDate && metricScope === 'daily') {
            setHistoricalCheckin(todayCheckin)
        } else {
            setLoadingHistory(true)
            fetchCheckinByDate(customReferenceDate, metricScope).then(res => {
                setHistoricalCheckin(res)
                setLoadingHistory(false)
            })
        }
    }, [customReferenceDate, metricScope, todayCheckin, referenceDate, fetchCheckinByDate])

    useEffect(() => {
        if (historicalCheckin) {
            setForm({
                leads: historicalCheckin.leads_prev_day || 0,
                agd_cart_prev: historicalCheckin.agd_cart_prev_day || 0,
                agd_net_prev: historicalCheckin.agd_net_prev_day || 0,
                agd_cart: historicalCheckin.agd_cart_today || 0,
                agd_net: historicalCheckin.agd_net_today || 0,
                vnd_porta: historicalCheckin.vnd_porta_prev_day || 0,
                vnd_cart: historicalCheckin.vnd_cart_prev_day || 0,
                vnd_net: historicalCheckin.vnd_net_prev_day || 0,
                visitas: historicalCheckin.visit_prev_day || 0,
                note: historicalCheckin.note || '',
                zero_reason: historicalCheckin.zero_reason || '',
            })
        } else {
            setForm({ leads: 0, agd_cart_prev: 0, agd_net_prev: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0, note: '', zero_reason: '' })
        }
    }, [historicalCheckin])

    const totals = useMemo(() => calcularTotais(form), [form])
    
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (changedFields.size > 0 && !saving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [changedFields, saving])

    const now = new Date()
    const isLate = isCheckinLate(now)
    const canEditExisting = canEditCurrentCheckin(now)

    const allZero = useMemo(() => 
        form.leads === 0 && totals.agd_total === 0 && form.visitas === 0 && totals.vnd_total === 0
    , [form.leads, totals])

    const funnelError = useMemo(() => {
        try {
            return validarFunil(form)
        } catch (e) {
            return "Erro interno de validação"
        }
    }, [form])

    const updateField = (field: keyof CheckinForm, value: number | string) => {
        setForm(prev => ({ ...prev, [field]: typeof value === 'number' ? Math.min(MAX_INPUT_VALUE, Math.max(0, value)) : value }))
        setChangedFields(prev => new Set(prev).add(field))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (saving) return 
        if (todayCheckin && !canEditExisting) {
            toast.error(`Correções ficam disponíveis somente até ${CHECKIN_EDIT_LIMIT_LABEL}.`)
            return
        }
        if (allZero && !form.zero_reason) { toast.error('Selecione o motivo da ausência de atividade'); return }
        if (funnelError) { toast.error(funnelError); return }

        setSaving(true)
        const formDataToSave = {
            ...form,
            agd_cart_prev: form.agd_cart_prev || 0,
            agd_net_prev: form.agd_net_prev || 0
        }
        const { error } = await saveCheckin(formDataToSave, metricScope, customReferenceDate)
        
        if (error) { 
            setSaving(false)
            toast.error(error)
            return 
        }

        if (totals.vnd_total > 0) {
            setShowConfetti(true)
            toast.success(`🎉 Vitória! ${totals.vnd_total} venda${totals.vnd_total > 1 ? 's' : ''} registrada${totals.vnd_total > 1 ? 's' : ''}!`)
            timerRef.current = setTimeout(() => navigate('/home'), 2500)
        } else {
            toast.success('Check-in MX sincronizado com sucesso!')
            navigate('/home')
        }
    }

    const todayDisplay = new Date(referenceDate + 'T12:00:00')
    const dateStr = todayDisplay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    const NumberInput = ({ label, icon: Icon, field, color, bg, tooltip }: { label: string; icon: any; field: keyof CheckinForm; color: string; bg: string; tooltip?: string }) => (
        <div className={cn(
            "flex flex-col gap-4 rounded-[2rem] border p-5 shadow-sm transition-all group/input hover:shadow-lg sm:flex-row sm:items-center sm:justify-between",
            changedFields.has(field) ? "border-indigo-600/30 bg-white" : "border-gray-100 bg-white/80"
        )}>
            <div className="flex items-center gap-5 min-w-0">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover/input:scale-110 group-hover/input:rotate-3", bg, color)} aria-hidden="true">
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <label htmlFor={`input-${field}`} className="text-gray-600 font-black text-[10px] uppercase tracking-[0.2em]">{label}</label>
                        {tooltip && (
                            <div className="relative group/tooltip flex items-center justify-center">
                                <button type="button" aria-label={`Informação sobre ${label}`} className="focus:outline-none"><Info size={12} className="text-gray-400 hover:text-emerald-500 cursor-help transition-colors" /></button>
                                <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-56 p-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-[10px] uppercase font-black tracking-widest leading-relaxed shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all pointer-events-none text-center">
                                    {tooltip}
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
                                </div>
                            </div>
                        )}
                    </div>
                    <span id={`val-${field}`} className="text-4xl font-black tabular-nums tracking-tighter text-slate-950 leading-none">{form[field] as number}</span>
                </div>
            </div>
            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={() => updateField(field, (form[field] as number) - 1)}
                    aria-label={`Diminuir ${label}`}
                    className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600 border border-gray-100 flex items-center justify-center transition-all active:scale-90 focus-visible:ring-4 focus-visible:ring-rose-500/10 outline-none"
                >
                    <Minus size={20} strokeWidth={2.5} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={() => updateField(field, (form[field] as number) + 1)}
                    aria-label={`Aumentar ${label}`}
                    className="w-12 h-12 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-100 flex items-center justify-center transition-all active:scale-90 focus-visible:ring-4 focus-visible:ring-emerald-500/10 outline-none"
                >
                    <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
                </button>
            </div>
        </div>
    )

    if (hookLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl" role="status">
            <div className="w-16 h-16 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin shadow-xl" aria-hidden="true"></div>
            <p className="mt-6 text-gray-500 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Sincronizando Terminal MX...</p>
        </div>
    )

    if (role !== 'vendedor') {
        return (
            <main className="h-full w-full flex flex-col items-center justify-center text-center p-10 bg-white">
                <ShieldCheck size={48} className="text-gray-300 mb-6" aria-hidden="true" />
                <h1 className="text-2xl font-black text-slate-950 tracking-tight mb-2 uppercase">Lançamento Individual</h1>
                <p className="text-gray-500 text-sm font-bold max-w-sm mx-auto">O check-in diário é exclusivo do vendedor. Dono acompanha, gerente opera a rotina e admin audita.</p>
            </main>
        )
    }

    return (
        <main className="w-full h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-slate-950 p-4 md:p-8 bg-white">

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm" aria-hidden="true">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.5, 1], rotate: 0 }} className="text-[12rem] drop-shadow-3xl">🎉</motion.div>
                </div>
            )}

            {/* Header / Toolbar com Seletor de Escopo/Data */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">Terminal MX</h1>
                    </div>
                    <div className="flex flex-col gap-2 pl-6 mt-2">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner" role="group" aria-label="Tipo de Registro">
                                <button 
                                    type="button"
                                    onClick={() => setMetricScope('daily')}
                                    aria-pressed={metricScope === 'daily'}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-slate-500 outline-none", metricScope === 'daily' ? "bg-white text-slate-950 shadow-sm" : "text-gray-500")}
                                >
                                    Registro Diário
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setMetricScope('adjustment')}
                                    aria-pressed={metricScope === 'adjustment'}
                                    className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-amber-500 outline-none", metricScope === 'adjustment' ? "bg-amber-500 text-white shadow-sm" : "text-gray-500")}
                                >
                                    Ajuste Técnico
                                </button>
                            </div>
                            <div className="flex items-center gap-2 px-3 bg-white h-10 rounded-xl shadow-sm border border-gray-100">
                                <CalendarDays size={14} className="text-gray-400" aria-hidden="true" />
                                <label htmlFor="reference-date" className="sr-only">Data de Referência</label>
                                <input 
                                    id="reference-date"
                                    name="reference-date"
                                    type="date" 
                                    value={customReferenceDate} 
                                    onChange={e => setCustomReferenceDate(e.target.value)} 
                                    className="text-[10px] font-black uppercase text-slate-700 bg-transparent focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        type="button"
                        onClick={() => navigate('/home')}
                        aria-label="Fechar Terminal e voltar"
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-slate-950 transition-all active:scale-90 focus-visible:ring-4 focus-visible:ring-slate-500/10 outline-none"
                    >
                        <X size={20} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    {historicalCheckin && (
                        <div className="hidden sm:flex items-center justify-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-5 py-3 shadow-sm">
                            <Sparkles size={14} className="text-amber-500" aria-hidden="true" />
                            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{canEditExisting || metricScope === 'adjustment' ? 'Edição Habilitada' : 'Visualização (Bloqueado)'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto w-full pb-32">

                {/* Form Column */}
                <div className="flex-1 space-y-12">
                    <form onSubmit={handleSubmit} className="space-y-14" aria-live="polite">

                        {/* REFERÊNCIA: Contrato temporal do registro */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Data de referência', value: dateStr, tone: 'bg-slate-950 text-white' },
                                { label: 'Loja', value: membership?.store?.name || storeId || 'Loja ativa', tone: 'bg-gray-50 text-slate-950' },
                                { label: 'Vendedor', value: profile?.name || 'Vendedor', tone: 'bg-gray-50 text-slate-950' },
                                { label: 'Status do envio', value: isLate ? `Fora do prazo (${CHECKIN_DEADLINE_LABEL})` : `No prazo (${CHECKIN_DEADLINE_LABEL})`, tone: isLate ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700' },
                            ].map(item => (
                                <div key={item.label} className={cn("rounded-[2rem] border border-gray-100 p-6 shadow-sm", item.tone)}>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 mb-2">{item.label}</p>
                                    <p className="text-sm font-black uppercase tracking-tight leading-snug">{item.value}</p>
                                </div>
                            ))}
                            <div className="md:col-span-4 rounded-[2rem] border border-indigo-100 bg-indigo-50/40 p-6 flex flex-col gap-2">
                                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Contrato temporal MX</p>
                                <p className="text-sm font-bold text-indigo-900/80 leading-relaxed">
                                    Produção, leads, visitas e vendas sempre se referem ao dia anterior. Agendamentos representam a agenda de hoje.
                                    Correções do registro já enviado ficam abertas até {CHECKIN_EDIT_LIMIT_LABEL}.
                                </p>
                            </div>
                        </div>

                        {/* RETROSPECTIVA: Produção do Dia Anterior */}
                        <fieldset className="space-y-8">
                            <legend className="sr-only">Retrospectiva de Produção - Dia Anterior</legend>
                            <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg transform -rotate-3" aria-hidden="true">
                                        <History size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-950 text-xl font-black uppercase tracking-tighter leading-none">Retrospectiva MX</h2>
                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mt-1 italic">Produção Consolidada: Ontem</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                                        Vendas Totais: {totals.vnd_total}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-emerald-50/20 border border-emerald-100/50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" aria-hidden="true" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <NumberInput label="LEADS NOVOS RECEBIDOS NO DIA ANTERIOR" icon={Users} field="leads" bg="bg-white" color="text-indigo-600" tooltip="Contabilize todos os contatos novos que entraram na sua base ontem (WhatsApp, Telefone, Porta)." />
                                    <NumberInput label="COMPARECIMENTO DE VISITAS (ONTEM)" icon={Eye} field="visitas" bg="bg-white" color="text-amber-600" tooltip="Número total de pessoas que estiveram fisicamente na loja ontem para atendimento com você." />
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-emerald-100/50">
                                        <NumberInput label="VENDAS PORTA (ONTEM)" icon={Car} field="vnd_porta" bg="bg-white" color="text-emerald-600" tooltip="Votos de confiança e contratos fechados de clientes que vieram por fluxo de porta ontem." />
                                        <NumberInput label="VENDAS CARTEIRA VENDEDOR (ONTEM)" icon={Users} field="vnd_cart" bg="bg-white" color="text-emerald-600" tooltip="Fechamentos realizados através de prospecção ativa da sua própria carteira ontem." />
                                        <NumberInput label="VENDAS INTERNET (ONTEM)" icon={Globe} field="vnd_net" bg="bg-white" color="text-emerald-600" tooltip="Vendas convertidas oriundas de leads digitais (Net) ontem." />
                                    </div>
                                </div>
                            </div>
                        </fieldset>

                        {/* AGENDA: Compromissos do Dia Atual */}
                        <fieldset className="space-y-8 mt-20">
                            <legend className="sr-only">Agenda Operacional de Hoje</legend>
                            <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg transform rotate-3" aria-hidden="true">
                                        <CalendarDays size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-slate-950 text-xl font-black uppercase tracking-tighter leading-none">Agenda Operacional</h2>
                                        <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] mt-1 italic">Compromissos Firmados: Hoje</p>
                                    </div>
                                </div>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                                    Total Agendado: {totals.agd_total}
                                </span>
                            </div>
                            <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/30 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" aria-hidden="true" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <NumberInput label="AGENDAMENTOS CARTEIRA (HOJE)" icon={Users} field="agd_cart" bg="bg-white" color="text-indigo-600" tooltip="Clientes da sua base que confirmaram visita presencial para o dia de HOJE." />
                                    <NumberInput label="AGENDAMENTOS INTERNET (HOJE)" icon={Globe} field="agd_net" bg="bg-indigo-600" color="text-white" tooltip="Leads digitais que agendaram comparecimento físico para o dia de HOJE." />
                                </div>
                            </div>
                        </fieldset>

                        {/* Error Handling */}
                        <AnimatePresence mode="popLayout">
                            {funnelError && (
                                <motion.div role="alert" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-6 rounded-[2.5rem] border-2 border-rose-500 bg-rose-50 p-8 shadow-xl shadow-rose-500/5 sm:flex-row sm:items-center">
                                    <div className="bg-rose-500 p-5 rounded-2xl shadow-lg shadow-rose-200 shrink-0 transform -rotate-3" aria-hidden="true"><AlertTriangle size={32} className="text-white" strokeWidth={2.5} /></div>
                                    <div>
                                        <h2 className="font-black text-rose-900 text-xl tracking-tight leading-none mb-2 uppercase">Inconsistência Operacional</h2>
                                        <p className="text-rose-800 font-bold leading-relaxed">{funnelError}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Zero States */}
                        <AnimatePresence>
                            {allZero && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-100 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/50 rounded-full blur-[60px] -mr-20 -mt-20" aria-hidden="true" />
                                    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 transform group-hover:rotate-12 transition-transform" aria-hidden="true">
                                            <AlertTriangle size={28} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-amber-900 font-black text-2xl tracking-tighter leading-none mb-1 uppercase">Produção Zero</p>
                                            <p className="text-amber-800/80 text-[10px] font-black uppercase tracking-[0.2em]">Justificativa obrigatória pela Metodologia MX</p>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <label htmlFor="zero-reason-select" className="sr-only">Motivo da ausência de atividade operacional</label>
                                        <Select id="zero-reason-select" value={form.zero_reason} onValueChange={v => updateField('zero_reason', v)}>
                                            <SelectTrigger className="w-full bg-white border-amber-200 rounded-2xl h-16 px-8 text-slate-950 font-black shadow-sm focus:ring-8 focus:ring-amber-500/5 transition-all outline-none">
                                                <SelectValue placeholder="Selecione o motivo da ausência..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-amber-100 shadow-3xl">
                                                {ZERO_REASONS.map(r => <SelectItem key={r} value={r} className="font-bold py-4">{r.toUpperCase()}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Finalization */}
                        <div className="pt-10 flex flex-col gap-8">
                            <div className="space-y-4">
                                <label htmlFor="checkin-note" className="flex items-center gap-3 px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
                                    <MessageSquare size={14} className="text-indigo-600" aria-hidden="true" /> Observações Operacionais
                                </label>
                                <textarea
                                    id="checkin-note"
                                    name="checkin-note"
                                    value={form.note}
                                    onChange={e => updateField('note', e.target.value)}
                                    maxLength={280}
                                    aria-describedby="note-char-count"
                                    placeholder="Detalhamento de eventos ou fechamentos estratégicos..."
                                    className="w-full bg-white border border-gray-100 rounded-[2.5rem] px-8 py-8 text-base font-bold text-slate-950 placeholder:text-gray-300 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 focus:shadow-2xl transition-all resize-none shadow-sm min-h-[160px]"
                                />
                                <div className="flex justify-end pr-4">
                                    <span id="note-char-count" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{form.note.length}/280</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving || (!!todayCheckin && !canEditExisting)}
                                className="w-full py-10 rounded-[3rem] bg-slate-950 text-white font-black text-3xl tracking-tighter flex items-center justify-center gap-6 hover:bg-black transition-all hover:shadow-3xl hover:-translate-y-2 active:scale-[0.98] group relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-8 focus-visible:ring-slate-500/20 outline-none uppercase"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true" />
                                {saving ? (
                                    <RefreshCw className="w-12 h-12 animate-spin text-indigo-400" aria-hidden="true" />
                                ) : (
                                    <><Send size={40} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" aria-hidden="true" /> <span>{todayCheckin ? (canEditExisting ? 'ATUALIZAR RITUAL' : 'RITUAL BLOQUEADO') : 'CONGELAR PERFORMANCE'}</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>


                {/* Info Sidebar */}
                <aside className="lg:w-[420px] space-y-10">
                    <section className="bg-emerald-50/30 border border-emerald-100 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-sm" aria-labelledby="sidebar-ritual-title">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200" aria-hidden="true">
                                <History size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 id="sidebar-ritual-title" className="font-black text-emerald-900 uppercase text-xs tracking-[0.4em] leading-none mb-1">Ritual de Ontem</h3>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Auditoria de Resultados</p>
                            </div>
                        </div>
                        <ul className="space-y-8 relative z-10" role="list">
                            {[
                                "Declare leads recebidos com precisão forense.",
                                "Visitas refletem a taxa de conversão do showroom.",
                                "As vendas são imutáveis após o fechamento do dia.",
                                "Justificativa MX obrigatória para produção zero."
                            ].map((text, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px] text-emerald-600 shadow-sm border border-white" aria-hidden="true">{i+1}</div>
                                    <span className="text-sm font-bold text-emerald-900/80 leading-relaxed group-hover:text-emerald-900 transition-colors uppercase tracking-tight">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-sm" aria-labelledby="sidebar-agenda-title">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200" aria-hidden="true">
                                <CalendarDays size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 id="sidebar-agenda-title" className="font-black text-indigo-900 uppercase text-xs tracking-[0.4em] leading-none mb-1">Agenda de Hoje</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Planejamento Operacional</p>
                            </div>
                        </div>
                        <ul className="space-y-8 relative z-10" role="list">
                            {[
                                "Agendamentos garantem o escoamento do funil.",
                                "O Digital exige velocidade de resposta (SLR).",
                                "Sua agenda de hoje é o resultado de amanhã."
                            ].map((text, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px] text-indigo-600 shadow-sm border border-white" aria-hidden="true">{i+1}</div>
                                    <span className="text-sm font-bold text-indigo-900/80 leading-relaxed group-hover:text-indigo-900 transition-colors uppercase tracking-tight">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none z-0" aria-hidden="true" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" aria-hidden="true">
                            <Zap size={200} fill="currentColor" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em] mb-10">Impacto Consolidado</h3>
                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-8xl font-black tracking-tighter leading-none" aria-live="polite">{totals.vnd_total}</span>
                                <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">Unidades</span>
                            </div>
                            <p className="text-gray-400 text-sm font-bold leading-relaxed max-w-[240px] uppercase tracking-tight">
                                Sua contribuição hoje representa <span className="text-white font-black">{totals.vnd_total} fechamentos</span> reportados à rede.
                            </p>
                        </div>
                    </div>
                </aside>

            </div>
        </main>
    )
}
