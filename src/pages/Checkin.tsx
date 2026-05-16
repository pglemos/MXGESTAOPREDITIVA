import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { CHECKIN_DEADLINE_LABEL, CHECKIN_EDIT_LIMIT_LABEL, CHECKIN_MAX_INPUT_VALUE, CHECKIN_ZERO_REASONS, canEditCurrentCheckin, isCheckinLate, useCheckins } from '@/hooks/useCheckins'
import { validarFunil, calcularTotais } from '@/lib/calculations'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckSquare, Users, Globe, Car, Eye, Send, Sparkles,
    MessageSquare, AlertTriangle, ChevronLeft, Minus, Plus, Zap,
    ArrowLeft, Target, TrendingUp, Info, RefreshCw, Trash2,
    X, History, CalendarDays, ShieldCheck, Smartphone, UserCheck
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import type { DailyCheckin } from '@/types/database'
import { DAILY_ROUTINE_MVP_FIELDS } from '@/lib/daily-routine'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'

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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [changedFields, setChangedFields] = useState<Set<keyof CheckinForm>>(new Set())
    const [metricScope, setMetricScope] = useState<'daily' | 'adjustment'>('daily')
    const [currentTime, setCurrentTime] = useState(() => new Date())
    const [inputError, setInputError] = useState<string | null>(null)
    const [numberDrafts, setNumberDrafts] = useState<Partial<Record<keyof CheckinForm, string>>>({})
    
    const [form, setForm] = useState<CheckinForm>({
        leads: 0, agd_cart_prev: 0, agd_net_prev: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0, note: '', zero_reason: '',
    })

    const { todayCheckin, saveCheckin, loading: hookLoading, referenceDate, fetchCheckinByDate, error: checkinLoadError } = useCheckins()
    const [historicalCheckin, setHistoricalCheckin] = useState<DailyCheckin | null>(null)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [customReferenceDate, setCustomReferenceDate] = useState('')

    useEffect(() => {
        if (referenceDate) setCustomReferenceDate(referenceDate)
    }, [referenceDate])

    useEffect(() => {
        if (!customReferenceDate || !referenceDate) return
        if (customReferenceDate === referenceDate && metricScope === 'daily') {
            setHistoricalCheckin(todayCheckin)
        } else {
            setLoadingHistory(true)
            fetchCheckinByDate(customReferenceDate, metricScope)
                .then(res => setHistoricalCheckin(res))
                .catch(() => toast.error('Não foi possível carregar o lançamento selecionado.'))
                .finally(() => setLoadingHistory(false))
        }
    }, [customReferenceDate, metricScope, todayCheckin, referenceDate, fetchCheckinByDate])

    useEffect(() => {
        if (changedFields.size > 0) return
        setNumberDrafts({})
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
    }, [historicalCheckin, changedFields.size])

    const totals = useMemo(() => calcularTotais(form), [form])
    
    useEffect(() => {
        const clock = setInterval(() => setCurrentTime(new Date()), 30000)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (changedFields.size > 0 && !saving) { e.preventDefault(); e.returnValue = '' }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(clock)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [changedFields, saving])

    const isLate = isCheckinLate(currentTime); const canEditExisting = canEditCurrentCheckin(currentTime)
    const allZero = useMemo(() => form.leads === 0 && totals.agd_total === 0 && form.visitas === 0 && totals.vnd_total === 0, [form.leads, totals])
    const funnelError = useMemo(() => { try { return validarFunil(form) } catch { return "Erro de validação" } }, [form])

    const updateField = (field: keyof CheckinForm, value: number | string) => {
        if (typeof value === 'number' && (!Number.isFinite(value) || value < 0 || value > CHECKIN_MAX_INPUT_VALUE)) {
            setInputError(`Informe um valor entre 0 e ${CHECKIN_MAX_INPUT_VALUE}.`)
            return
        }
        setInputError(null)
        setForm(prev => ({ ...prev, [field]: value }))
        setChangedFields(prev => new Set(prev).add(field))
    }

    const updateNumberField = (field: keyof CheckinForm, rawValue: string) => {
        setNumberDrafts(prev => ({ ...prev, [field]: rawValue }))
        setChangedFields(prev => new Set(prev).add(field))
        if (rawValue === '') {
            setInputError(null)
            return
        }
        const numericValue = Number(rawValue)
        updateField(field, numericValue)
    }

    const commitNumberField = (field: keyof CheckinForm) => {
        setNumberDrafts(prev => {
            if (prev[field] !== '') return prev
            const next = { ...prev }
            delete next[field]
            return next
        })
        if (numberDrafts[field] === '') updateField(field, 0)
    }

    const handleExit = () => {
        if (changedFields.size > 0 && !saving) {
            requestToastConfirmation({
                key: 'checkin-unsaved-exit',
                title: 'Sair sem salvar?',
                description: 'Existem alterações no lançamento atual.',
                label: 'Sair',
                onConfirm: async () => navigate('/home'),
            })
            return
        }
        navigate('/home')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (saving) return 
        if (Object.values(numberDrafts).some(value => value === '')) {
            toast.error('Preencha os campos numéricos vazios antes de salvar.')
            return
        }
        if (!canEditExisting && metricScope === 'daily') {
            toast.error(`Lançamentos diários ficam bloqueados após ${CHECKIN_EDIT_LIMIT_LABEL}.`); return
        }
        if (allZero && !form.zero_reason) { toast.error('Justificativa obrigatória para produção zero.'); return }
        if (allZero && form.zero_reason === 'Outro' && form.note.trim().length < 8) {
            toast.error('Descreva o motivo quando selecionar Outro.')
            return
        }
        if (funnelError) { toast.error(funnelError); return }

        setSaving(true)
        const { error } = await saveCheckin(form, metricScope, customReferenceDate)
        if (error) { setSaving(false); toast.error(error); return }
        setChangedFields(new Set())

        if (totals.vnd_total > 0) {
            setShowConfetti(true); toast.success(`🎉 Vitória! ${totals.vnd_total} vendas consolidadas!`)
            timerRef.current = setTimeout(() => navigate('/home'), 2500)
        } else {
            toast.success('Ritual MX sincronizado!'); navigate('/home')
        }
    }

    const todayDisplay = new Date(referenceDate + 'T12:00:00')
    const dateStr = todayDisplay.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const previousDayFieldsCount = DAILY_ROUTINE_MVP_FIELDS.filter(field => field.scope === 'previous_day').length
    const todayFieldsCount = DAILY_ROUTINE_MVP_FIELDS.filter(field => field.scope === 'today').length

    const NumberInput = ({ label, icon: Icon, field, tone }: { label: string; icon: LucideIcon; field: keyof CheckinForm; tone: 'brand' | 'success' | 'warning' | 'info' | 'error' }) => (
        <Card className={cn(
            "flex min-h-mx-32 flex-col justify-between gap-mx-md rounded-mx-2xl border bg-white p-mx-md shadow-mx-sm transition-all hover:shadow-mx-md",
            changedFields.has(field) ? "border-brand-primary/40 ring-2 ring-brand-primary/10" : "border-border-default"
        )}>
            <div className="flex items-center gap-mx-sm min-w-0">
                <div className={cn("w-mx-xl h-mx-xl rounded-mx-xl flex items-center justify-center border shrink-0",
                    tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                    tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                    tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                    tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                    'bg-status-error-surface border-mx-rose-100 text-status-error'
                )}>
                    <Icon size={20} strokeWidth={2} />
                </div>
                <Typography variant="caption" tone="muted" className="min-w-0 truncate font-black uppercase tracking-mx-wide leading-tight">{label}</Typography>
            </div>
            <div className="flex items-end justify-between gap-mx-sm">
                <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={CHECKIN_MAX_INPUT_VALUE}
                    name={String(field)}
                    aria-label={label}
                    aria-describedby={inputError ? 'checkin-input-error' : undefined}
                    value={numberDrafts[field] ?? String(form[field] as number)}
                    onChange={(event) => updateNumberField(field, event.target.value)}
                    onBlur={() => commitNumberField(field)}
                    className="min-w-0 w-mx-24 bg-transparent text-4xl tabular-nums leading-none font-black text-text-primary outline-none focus:ring-2 focus:ring-brand-primary/20 rounded-mx-md sm:text-5xl"
                />
                <div className="flex items-center gap-mx-xs shrink-0">
                    <Button
                        type="button" variant="outline" size="icon"
                        aria-label={`Diminuir ${label}`}
                        onClick={() => updateField(field, (form[field] as number) - 1)}
                        className="w-mx-11 h-mx-11 rounded-mx-xl border-border-default hover:bg-status-error-surface hover:text-status-error hover:border-mx-rose-100 shadow-sm"
                    >
                        <Minus size={18} strokeWidth={2} />
                    </Button>
                    <Button
                        type="button" variant="outline" size="icon"
                        aria-label={`Aumentar ${label}`}
                        onClick={() => updateField(field, (form[field] as number) + 1)}
                        className="w-mx-11 h-mx-11 rounded-mx-xl border-border-default hover:bg-status-success-surface hover:text-status-success hover:border-mx-emerald-100 shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2} />
                    </Button>
                </div>
            </div>
        </Card>
    )

    if (hookLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Terminal...</Typography>
        </div>
    )

    if (role !== 'vendedor') return (
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-mx-xl bg-white">
            <ShieldCheck size={64} className="text-text-tertiary/20 mb-8" aria-hidden="true" />
            <Typography variant="h2" className="mb-4">Acesso Reservado</Typography>
            <Typography variant="p" tone="muted" className="max-w-sm mx-auto uppercase tracking-widest leading-relaxed opacity-60">O lançamento diário operacional é restrito ao corpo de vendas. Gestores e equipe MX auditam via malha de rede.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt relative">
            {checkinLoadError && (
                <div role="alert" className="rounded-mx-2xl border border-status-error/20 bg-status-error-surface px-mx-md py-mx-sm text-sm font-bold text-status-error">
                    {checkinLoadError}
                </div>
            )}
            
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm" aria-hidden="true">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.5, 1], rotate: 0 }} className="text-mx-huge">🎉</motion.div>
                </div>
            )}

            {/* Header / Engine Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-8 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Terminal <span className="text-mx-green-700">MX</span></Typography>
                    </div>
                    <Typography variant="caption" tone="muted" className="pl-0 sm:pl-6">
                        Referência operacional: {dateStr}
                    </Typography>
                    <div className="flex flex-col items-stretch gap-mx-sm pl-0 mt-2 sm:flex-row sm:items-center sm:pl-6">
                        <div className="flex w-full p-mx-tiny bg-white border border-border-default rounded-mx-full shadow-mx-sm sm:w-auto" role="group" aria-label="Tipo de lançamento">
                            <Button 
                                variant={metricScope === 'daily' ? 'secondary' : 'ghost'} size="sm"
                                onClick={() => setMetricScope('daily')}
                                className="h-mx-9 flex-1 px-4 rounded-mx-full text-mx-tiny uppercase font-black sm:flex-none sm:px-6"
                            >
                                REGISTRO DIÁRIO
                            </Button>
                            <Button 
                                variant={metricScope === 'adjustment' ? 'secondary' : 'ghost'} size="sm"
                                onClick={() => setMetricScope('adjustment')}
                                disabled
                                title="Ajuste técnico é restrito a gestores e perfis internos MX."
                                className={cn("h-mx-9 flex-1 px-4 rounded-mx-full text-mx-tiny uppercase font-black sm:flex-none sm:px-6", metricScope === 'adjustment' && "bg-mx-amber-400 text-mx-black")}
                            >
                                AJUSTE TÉCNICO
                            </Button>
                        </div>
                        <label htmlFor="checkin-reference-date" className="flex w-full items-center gap-mx-xs bg-white border border-border-default px-5 h-mx-12 rounded-mx-full shadow-mx-sm sm:w-auto">
                            <CalendarDays size={16} className="text-brand-primary" />
                            <input
                                id="checkin-reference-date"
                                name="reference_date"
                                type="date"
                                value={customReferenceDate}
                                onChange={e => setCustomReferenceDate(e.target.value)}
                                className="min-w-0 flex-1 bg-transparent text-sm font-black uppercase text-text-primary outline-none sm:w-mx-32 sm:text-mx-tiny"
                                aria-label="Data de referência do lançamento"
                            />
                        </label>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Badge variant={isLate ? 'warning' : 'success'} className="px-5 py-2 rounded-mx-full uppercase tracking-widest font-black">
                        {isLate ? `Após ${CHECKIN_DEADLINE_LABEL}` : `Até ${CHECKIN_DEADLINE_LABEL}`}
                    </Badge>
                    {historicalCheckin && (
                        <Badge variant={canEditExisting || metricScope === 'adjustment' ? 'success' : 'outline'} className="px-6 py-2 rounded-mx-full uppercase tracking-widest font-black">
                            {canEditExisting || metricScope === 'adjustment' ? 'Edição Habilitada' : 'Visualização Somente'}
                        </Badge>
                    )}
                    <Button variant="outline" size="icon" onClick={handleExit} aria-label="Voltar ao início" className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm">
                        <X size={24} />
                    </Button>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row gap-mx-lg max-w-mx-elite-canvas mx-auto w-full pb-32">
                
                {/* Form Core */}
                <div className="flex-1 space-y-mx-lg">
                    <Card className="p-mx-md sm:p-mx-lg border border-border-default shadow-mx-sm bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md">
                            <div className="rounded-mx-xl bg-status-success-surface border border-status-success/10 p-mx-md">
                                <Typography variant="tiny" tone="success" className="font-black uppercase tracking-widest">Dia anterior</Typography>
                                <Typography variant="p" className="font-black mt-1">{previousDayFieldsCount} campos de producao</Typography>
                                <Typography variant="tiny" tone="muted">Leads, visitas, vendas e justificativa quando tudo estiver zerado.</Typography>
                            </div>
                            <div className="rounded-mx-xl bg-brand-primary/5 border border-brand-primary/10 p-mx-md">
                                <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest">Hoje</Typography>
                                <Typography variant="p" className="font-black mt-1">{todayFieldsCount} campos de rotina</Typography>
                                <Typography variant="tiny" tone="muted">Agenda carteira, agenda internet e observacao operacional.</Typography>
                            </div>
                        </div>
                    </Card>

                    {/* Retro Grid */}
                    <Card className="p-mx-md sm:p-mx-lg md:p-mx-xl space-y-mx-lg border border-border-default shadow-mx-md bg-white relative overflow-hidden">
                        <header className="flex flex-col gap-mx-md border-b border-border-default pb-8 relative z-10 sm:flex-row sm:items-center sm:justify-between sm:pb-10">
                            <div className="flex items-center gap-mx-md">
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-status-success text-white flex items-center justify-center shadow-mx-md"><History size={28} strokeWidth={2} /></div>
                                <div>
                                    <Typography variant="h2" className="text-xl tracking-tight sm:text-2xl md:text-3xl">
                                        Retrospectiva <span className="ml-1 text-mx-green-700">MX</span>
                                    </Typography>
                                    <Typography variant="caption" tone="success" className="tracking-widest mt-1">CONSOLIDAÇÃO DE PRODUÇÃO: ONTEM</Typography>
                                </div>
                            </div>
                            <div className="text-right">
                                <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest">SELL-OUT TOTAL</Typography>
                                <Typography variant="h1" tone="success" className="text-5xl tabular-nums leading-none">{totals.vnd_total}</Typography>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md relative z-10">
                            <NumberInput label="Leads de Ontem" icon={Users} field="leads" tone="brand" />
                            <NumberInput label="Visitas de Ontem" icon={Eye} field="visitas" tone="warning" />
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-mx-md pt-mx-lg border-t border-border-default">
                                <NumberInput label="Vendas Porta" icon={Car} field="vnd_porta" tone="success" />
                                <NumberInput label="Vendas Carteira" icon={Smartphone} field="vnd_cart" tone="success" />
                                <NumberInput label="Vendas Internet" icon={Globe} field="vnd_net" tone="success" />
                            </div>
                        </div>
                    </Card>

                    {/* Today Grid */}
                    <Card className="p-mx-md sm:p-mx-lg md:p-mx-xl space-y-mx-lg border border-border-default shadow-mx-md bg-white relative overflow-hidden">
                        <header className="flex flex-col gap-mx-md border-b border-border-default pb-8 relative z-10 sm:flex-row sm:items-center sm:justify-between sm:pb-10">
                            <div className="flex items-center gap-mx-md">
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-md"><CalendarDays size={28} strokeWidth={2} /></div>
                                <div>
                                    <Typography variant="h2" className="text-xl tracking-tight sm:text-2xl md:text-3xl">Agenda Operacional</Typography>
                                    <Typography variant="caption" tone="brand" className="tracking-widest mt-1">COMPROMISSOS FIRMADOS: HOJE</Typography>
                                </div>
                            </div>
                            <div className="text-right">
                                <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest">TOTAL AGENDADO</Typography>
                                <Typography variant="h1" tone="brand" className="text-5xl tabular-nums leading-none">{totals.agd_total}</Typography>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-md relative z-10">
                            <NumberInput label="Agenda Carteira" icon={UserCheck} field="agd_cart" tone="brand" />
                            <NumberInput label="Agenda Internet" icon={Globe} field="agd_net" tone="info" />
                        </div>
                    </Card>

                    {/* Validation Error */}
                    <AnimatePresence>
                        {funnelError && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                <Card className="p-mx-lg bg-status-error-surface border-2 border-status-error/20 flex flex-col sm:flex-row sm:items-center gap-mx-lg shadow-mx-xl">
                                    <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-status-error text-white flex items-center justify-center shadow-mx-lg transform -rotate-3 shrink-0"><AlertTriangle size={32} strokeWidth={2} /></div>
                                    <div className="space-y-mx-tiny">
                                        <Typography variant="h3" tone="error" className="text-xl leading-none">INCONSISTÊNCIA OPERACIONAL</Typography>
                                        <Typography variant="p" tone="error" className="font-bold leading-relaxed">{funnelError}</Typography>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {inputError && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                                <Card id="checkin-input-error" role="alert" className="p-mx-md bg-status-warning-surface border border-status-warning/20">
                                    <Typography variant="p" tone="warning" className="font-black uppercase tracking-tight">{inputError}</Typography>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Zero Reason */}
                    <AnimatePresence>
                        {allZero && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                                <Card className="p-mx-10 border-none shadow-mx-xl bg-status-warning text-mx-black space-y-mx-10 relative overflow-hidden group">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-white/20 rounded-mx-full blur-3xl -mr-mx-32 -mt-mx-32" />
                                    <header className="flex items-center gap-mx-md relative z-10">
                                        <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-lg group-hover:rotate-12 transition-transform"><AlertTriangle size={32} strokeWidth={2} /></div>
                                        <div>
                                            <Typography variant="h2" tone="default">Produção Zero</Typography>
                                            <Typography variant="caption" className="font-black uppercase tracking-widest mt-1 opacity-60">JUSTIFICATIVA OBRIGATÓRIA MX</Typography>
                                        </div>
                                    </header>
                                    <div className="relative z-10">
                                        <label htmlFor="checkin-zero-reason" className="sr-only">Motivo da produção zero</label>
                                        <select 
                                            id="checkin-zero-reason"
                                            name="zero_reason"
                                            value={form.zero_reason} onChange={e => updateField('zero_reason', e.target.value)}
                                            className="w-full h-mx-2xl px-8 bg-mx-black text-white rounded-mx-2xl text-lg font-black uppercase tracking-widest outline-none shadow-mx-xl border-none focus:ring-8 focus:ring-white/10 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione o motivo...</option>
                                            {CHECKIN_ZERO_REASONS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Finalization */}
                    <Card className="p-mx-md sm:p-mx-10 md:p-14 space-y-mx-8 md:space-y-mx-10 border-none shadow-mx-lg bg-white">
                        <div className="space-y-mx-sm">
                            <label htmlFor="checkin-note" className="flex items-center gap-mx-xs px-4 text-mx-tiny font-black text-text-tertiary uppercase tracking-mx-wider">
                                <MessageSquare size={16} className="text-brand-primary" /> OBSERVAÇÕES OPERACIONAIS {allZero && form.zero_reason === 'Outro' ? '(Obrigatório)' : '(Opcional)'}
                            </label>
                            <textarea
                                id="checkin-note"
                                name="note"
                                value={form.note} onChange={e => updateField('note', e.target.value)} maxLength={280}
                                placeholder="Descreva aqui eventos críticos ou detalhes de fechamento estratégico..."
                                className="w-full bg-surface-alt border border-border-default rounded-mx-2xl p-mx-10 text-lg font-bold text-text-primary placeholder:text-text-tertiary/30 focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all resize-none shadow-inner min-h-mx-48"
                            />
                            <div className="flex justify-end pr-6">
                                <Typography variant="mono" tone="muted" className="text-mx-tiny">{form.note.length}/280</Typography>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={saving || (!canEditExisting && metricScope === 'daily')}
                            className="w-full min-h-mx-20 rounded-mx-2xl px-mx-md text-lg font-black tracking-tight uppercase shadow-mx-elite hover:-translate-y-1 active:scale-95 transition-all sm:min-h-mx-24 sm:text-2xl"
                        >
                            {saving ? <RefreshCw className="w-mx-xl h-mx-xl animate-spin" /> : <><Send size={28} className="mr-2 sm:mr-4" /> Salvar Lançamento</>}
                        </Button>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <aside className="lg:w-mx-aside space-y-mx-lg shrink-0">
                    <Card className="p-mx-10 border-none shadow-mx-lg bg-white space-y-mx-10">
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                            <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-status-success-surface text-status-success flex items-center justify-center shadow-inner"><ShieldCheck size={24} /></div>
                            <Typography variant="h3">Contrato MX</Typography>
                        </header>
                        <ul className="space-y-mx-lg" role="list">
                            {[
                                `Envie o registro diário até ${CHECKIN_DEADLINE_LABEL}.`,
                                `Correções ficam disponíveis até ${CHECKIN_EDIT_LIMIT_LABEL}.`,
                                "A agenda de hoje determina o ritmo de amanhã.",
                                "Justificativa obrigatória para KPIs zerados.",
                            ].map((text, i) => (
                                <li key={i} className="flex gap-mx-sm items-start group">
                                    <div className="w-mx-md h-mx-md rounded-mx-full bg-surface-alt flex items-center justify-center shrink-0 mt-0.5 font-black text-mx-tiny text-text-tertiary shadow-sm border border-border-default group-hover:bg-brand-primary group-hover:text-white transition-all" aria-hidden="true">{i+1}</div>
                                    <Typography variant="p" tone="muted" className="text-xs font-black uppercase tracking-tight leading-relaxed group-hover:text-text-primary transition-colors">{text}</Typography>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="p-mx-10 bg-pure-black text-white border-none shadow-mx-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent pointer-events-none z-0" aria-hidden="true" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" aria-hidden="true">
                            <Zap size={240} fill="currentColor" />
                        </div>
                        <div className="relative z-10">
                            <Typography variant="caption" tone="white" className="tracking-mx-widest mb-10 block">IMPACTO EM REDE</Typography>
                            <div className="flex items-baseline gap-mx-sm mb-6">
                                <Typography variant="h1" tone="white" className="text-8xl tabular-nums leading-none tracking-tighter" aria-live="polite">{totals.vnd_total}</Typography>
                                <Typography variant="h3" tone="brand" className="text-xl">VENDAS</Typography>
                            </div>
                            <Typography variant="p" tone="white" className="text-sm font-bold leading-relaxed opacity-60 uppercase tracking-tight italic">
                                "O sucesso é o somatório de registros precisos e execução impecável."
                            </Typography>
                        </div>
                    </Card>
                </aside>

            </form>
        </main>
    )
}
