import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { validarFunil, calcularTotais } from '@/lib/calculations'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckSquare, Users, Globe, Car, Eye, Send, Sparkles,
    MessageSquare, AlertTriangle, ChevronLeft, Minus, Plus, Zap,
    ArrowLeft, Target, TrendingUp, Info, RefreshCw, Trash2,
    X, History, CalendarDays
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ZERO_REASONS = ['Folga', 'Treinamento', 'Feriado', 'Dia administrativo', 'Outro']
const MAX_INPUT_VALUE = 999 // 5. Added max limit

interface CheckinForm {
    leads: number
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
    const { profile } = useAuth()
    const { todayCheckin, saveCheckin, loading: hookLoading } = useCheckins()
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const [form, setForm] = useState<CheckinForm>({
        leads: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0, note: '', zero_reason: '',
    })

    // 16. Track changes for highlight
    const [changedFields, setChangedFields] = useState<Set<keyof CheckinForm>>(new Set())

    useEffect(() => {
        if (todayCheckin) {
            setForm({
                leads: todayCheckin.leads, agd_cart: todayCheckin.agd_cart, agd_net: todayCheckin.agd_net,
                vnd_porta: todayCheckin.vnd_porta, vnd_cart: todayCheckin.vnd_cart, vnd_net: todayCheckin.vnd_net,
                visitas: todayCheckin.visitas, note: todayCheckin.note || '', zero_reason: todayCheckin.zero_reason || '',
            })
        }
    }, [todayCheckin])

    // 20. & 12. Performance & Memory Leak Fix
    const totals = useMemo(() => calcularTotais(form), [form])
    
    useEffect(() => {
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [])

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

    const resetForm = () => {
        if (window.confirm("Zerar todos os dados do formulário?")) {
            setForm({ leads: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0, note: '', zero_reason: '' })
            setChangedFields(new Set())
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (saving) return // 3. Prevent double submit
        if (allZero && !form.zero_reason) { toast.error('Selecione o motivo da ausência de atividade'); return }
        if (funnelError) { toast.error(funnelError); return }

        setSaving(true)
        const { error } = await saveCheckin(form)
        
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
            toast.success('Performance sincronizada com sucesso!')
            navigate('/home')
        }
    }

    const today = new Date()
    const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    const NumberInput = ({ label, icon: Icon, field, color, bg }: { label: string; icon: any; field: keyof CheckinForm; color: string; bg: string }) => (
        <div className={cn(
            "flex flex-col gap-4 rounded-[2rem] border p-5 shadow-sm transition-all group/input hover:shadow-lg sm:flex-row sm:items-center sm:justify-between",
            changedFields.has(field) ? "border-electric-blue/30 bg-white" : "border-gray-100 bg-white/80"
        )}>
            <div className="flex items-center gap-5 min-w-0">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover/input:scale-110 group-hover/input:rotate-3", bg, color)}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-400 font-black text-[9px] uppercase tracking-[0.2em] mb-1">{label}</span>
                    <span className="text-4xl font-black tabular-nums tracking-tighter text-pure-black leading-none">{form[field] as number}</span>
                </div>
            </div>
            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={() => updateField(field, (form[field] as number) - 1)}
                    className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 border border-gray-100 flex items-center justify-center transition-all active:scale-90"
                >
                    <Minus size={20} strokeWidth={3} />
                </button>
                <button
                    type="button"
                    onClick={() => updateField(field, (form[field] as number) + 1)}
                    className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-100 flex items-center justify-center transition-all active:scale-90"
                >
                    <Plus size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
    )

    if (hookLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase animate-pulse">Sincronizando Terminal de Vendas...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.5, 1], rotate: 0 }} className="text-[12rem] drop-shadow-3xl">🎉</motion.div>
                </div>
            )}

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-pure-black rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Terminal de Registro</h1>
                    </div>
                    <div className="flex flex-col gap-2 pl-6 mt-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                                Data de Referência: {dateStr} • Prazo Operacional: 09:30
                            </p>
                        </div>
                        <div className="inline-flex mt-1">
                            <p className="text-rose-600 text-[9px] font-black uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                                Atrasos geram status de SEM REGISTRO na rede
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => navigate('/home')}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={resetForm}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all active:scale-90"
                        title="Limpar tudo"
                    >
                        <Trash2 size={20} />
                    </button>
                    {todayCheckin && (
                        <div className="hidden sm:flex items-center justify-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-5 py-3 shadow-sm">
                            <Sparkles size={14} className="text-amber-500" />
                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Update Mode</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto w-full pb-32">

                {/* Form Column */}
                <div className="flex-1 space-y-12">
                    <form onSubmit={handleSubmit} className="space-y-14">

                        {/* Produção do Dia Anterior */}
                        <div className="space-y-8">
                            <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                                        <History size={20} className="text-emerald-600" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-pure-black text-sm font-black uppercase tracking-[0.2em] leading-none">Produção do Dia Anterior</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">O que aconteceu ontem</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">
                                    Vendas Totais (Ontem): {totals.vnd_total}
                                </span>
                            </div>
                            <div className="bg-gray-50/30 border border-gray-100 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <NumberInput label="Leads Recebidos (Ontem)" icon={Users} field="leads" bg="bg-indigo-50" color="text-indigo-600" />
                                    <NumberInput label="Visitas Realizadas (Ontem)" icon={Eye} field="visitas" bg="bg-amber-50" color="text-amber-600" />
                                    <NumberInput label="Vendas Porta (Ontem)" icon={Car} field="vnd_porta" bg="bg-emerald-50" color="text-emerald-600" />
                                    <NumberInput label="Vendas Carteira (Ontem)" icon={Users} field="vnd_cart" bg="bg-emerald-50" color="text-emerald-600" />
                                    <NumberInput label="Vendas Digital (Ontem)" icon={Globe} field="vnd_net" bg="bg-emerald-50" color="text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* Agenda do Dia Atual */}
                        <div className="space-y-8 mt-14">
                            <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-inner">
                                        <CalendarDays size={20} className="text-blue-600" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-pure-black text-sm font-black uppercase tracking-[0.2em] leading-none">Agenda do Dia Atual</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">O que vai acontecer hoje</p>
                                    </div>
                                </div>
                                <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                                    Compromissos (Hoje): {totals.agd_total}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NumberInput label="Agendamentos Carteira (Hoje)" icon={Users} field="agd_cart" bg="bg-blue-50" color="text-blue-600" />
                                <NumberInput label="Agendamentos Digital (Hoje)" icon={Globe} field="agd_net" bg="bg-cyan-50" color="text-cyan-600" />
                            </div>
                        </div>

                        {/* Error Handling */}
                        <AnimatePresence mode="popLayout">
                            {funnelError && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col gap-6 rounded-[2.5rem] border-2 border-rose-100 bg-rose-50/50 p-8 shadow-xl shadow-rose-500/5 sm:flex-row sm:items-center">
                                    <div className="bg-rose-500 p-5 rounded-2xl shadow-lg shadow-rose-200 shrink-0 transform -rotate-3"><AlertTriangle size={32} className="text-white" strokeWidth={2.5} /></div>
                                    <div>
                                        <h4 className="font-black text-rose-900 text-xl tracking-tight leading-none mb-2">Inconsistência de Dados</h4>
                                        <p className="text-rose-800/70 text-sm font-bold leading-relaxed">{funnelError}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Zero States */}
                        <AnimatePresence>
                            {allZero && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-100 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-amber-500/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/50 rounded-full blur-[60px] -mr-20 -mt-20" />
                                    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 transform group-hover:rotate-12 transition-transform">
                                            <AlertTriangle size={28} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-amber-900 font-black text-2xl tracking-tighter leading-none mb-1">Movimento Zero</p>
                                            <p className="text-amber-800/60 text-[10px] font-black uppercase tracking-[0.2em]">Justificativa de ausência de dados obrigatória</p>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        {/* 13. Replaced with custom styling select */}
                                        <Select value={form.zero_reason} onValueChange={v => updateField('zero_reason', v)}>
                                            <SelectTrigger className="w-full bg-white border-amber-200 rounded-2xl h-16 px-8 text-pure-black font-black shadow-sm focus:ring-8 focus:ring-amber-500/5 transition-all">
                                                <SelectValue placeholder="Selecione o motivo corporativo..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-amber-100 shadow-3xl">
                                                {ZERO_REASONS.map(r => <SelectItem key={r} value={r} className="font-bold py-4">{r}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Finalization */}
                        <div className="pt-10 flex flex-col gap-8">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                    <MessageSquare size={14} className="text-electric-blue" /> Observações do Plantão
                                </label>
                                <textarea
                                    value={form.note}
                                    onChange={e => updateField('note', e.target.value)}
                                    maxLength={280}
                                    placeholder="Detalhamento de eventos atípicos ou fechamentos estratégicos..."
                                    className="w-full bg-white border border-gray-100 rounded-[2.5rem] px-8 py-8 text-base font-bold text-pure-black placeholder:text-gray-200 focus:outline-none focus:border-electric-blue/30 focus:shadow-2xl transition-all resize-none shadow-sm min-h-[160px]"
                                />
                                <div className="flex justify-end pr-4">
                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{form.note.length}/280</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-10 rounded-full bg-pure-black text-white font-black text-3xl tracking-tighter flex items-center justify-center gap-6 hover:bg-black transition-all hover:shadow-3xl hover:-translate-y-2 active:scale-[0.98] group relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/20 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                {saving ? (
                                    <RefreshCw className="w-12 h-12 animate-spin text-electric-blue" />
                                ) : (
                                    <><Send size={40} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" /> <span>{todayCheckin ? 'ATUALIZAR REGISTRO' : 'LANÇAR PERFORMANCE'}</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Sidebar */}
                <div className="lg:w-[420px] space-y-10">
                    <div className="bg-indigo-50/30 border border-indigo-100 rounded-[2.5rem] p-10 relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Info size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="font-black text-indigo-900 uppercase text-[10px] tracking-[0.4em] leading-none mb-1">Protocolo MX</h4>
                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Integridade de Dados</p>
                            </div>
                        </div>
                        <ul className="space-y-8 relative z-10">
                            {[
                                "Volume de agendamentos deve ser condizente com leads.",
                                "Vendas de Porta refletem fluxo orgânico da unidade.",
                                "O Digital engloba WhatsApp, Meta, Google e Site.",
                                "Justificativa obrigatória para dias sem atividade."
                            ].map((text, i) => (
                                <li key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px] text-indigo-600 shadow-sm border border-white">{i+1}</div>
                                    <span className="text-sm font-bold text-indigo-900/60 leading-relaxed group-hover:text-indigo-900 transition-colors">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-pure-black rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none z-0" />
                        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                            <Zap size={200} fill="currentColor" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-40">Impacto Consolidado</h4>
                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-8xl font-black tracking-tighter leading-none">{totals.vnd_total}</span>
                                <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em]">Unidades</span>
                            </div>
                            <p className="text-gray-400 text-sm font-bold leading-relaxed max-w-[240px]">
                                Sua contribuição hoje representa <span className="text-white font-black">{totals.vnd_total} fechamentos</span> reportados à rede.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
