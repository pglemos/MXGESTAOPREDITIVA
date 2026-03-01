import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { validarFunil, calcularTotais } from '@/lib/calculations'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'motion/react'
import {
    CheckSquare, Users, Globe, Car, Eye, Send, Sparkles,
    MessageSquare, AlertTriangle, ChevronLeft, Minus, Plus, Zap,
    ArrowLeft, Target, TrendingUp, Info
} from 'lucide-react'

const ZERO_REASONS = ['Folga', 'Treinamento', 'Feriado', 'Dia administrativo', 'Outro']

export default function Checkin() {
    const { profile } = useAuth()
    const { todayCheckin, saveCheckin } = useCheckins()
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    const [form, setForm] = useState({
        leads: 0, agd_cart: 0, agd_net: 0, vnd_porta: 0, vnd_cart: 0, vnd_net: 0, visitas: 0, note: '', zero_reason: '',
    })

    useEffect(() => {
        if (todayCheckin) {
            setForm({
                leads: todayCheckin.leads, agd_cart: todayCheckin.agd_cart, agd_net: todayCheckin.agd_net,
                vnd_porta: todayCheckin.vnd_porta, vnd_cart: todayCheckin.vnd_cart, vnd_net: todayCheckin.vnd_net,
                visitas: todayCheckin.visitas, note: todayCheckin.note || '', zero_reason: todayCheckin.zero_reason || '',
            })
        }
    }, [todayCheckin])

    const totals = calcularTotais(form)
    const allZero = form.leads === 0 && totals.agd_total === 0 && form.visitas === 0 && totals.vnd_total === 0
    const funnelError = validarFunil(form)

    const updateField = (field: string, value: number) => {
        setForm(prev => ({ ...prev, [field]: Math.max(0, value) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (allZero && !form.zero_reason) { toast.error('Selecione o motivo do dia sem atividade'); return }
        if (funnelError) { toast.error(funnelError); return }

        setSaving(true)
        const { error } = await saveCheckin(form)
        setSaving(false)

        if (error) { toast.error(error); return }

        if (totals.vnd_total > 0) {
            setShowConfetti(true)
            toast.success(`🎉 Parabéns! ${totals.vnd_total} venda${totals.vnd_total > 1 ? 's' : ''} registrada${totals.vnd_total > 1 ? 's' : ''}!`)
            setTimeout(() => navigate('/home'), 2000)
        } else {
            toast.success('Check-in salvo com sucesso!')
            navigate('/home')
        }
    }

    const today = new Date()
    const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    const NumberInput = ({ label, icon: Icon, field, color, bg }: { label: string; icon: any; field: string; color: string; bg: string }) => (
        <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-100/50 shadow-sm group/input hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg} ${color} shadow-sm group-hover/input:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[#1A1D20] font-black text-[10px] uppercase tracking-widest opacity-40 group-hover/input:opacity-100 transition-opacity">{label}</span>
                    <span className="text-xl font-black tabular-nums">{(form as any)[field]}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => updateField(field, (form as any)[field] - 1)}
                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 border border-gray-100 flex items-center justify-center transition-all active:scale-90"
                >
                    <Minus size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => updateField(field, (form as any)[field] + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white border border-gray-100 flex items-center justify-center transition-all active:scale-90"
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-8 md:gap-12 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.2, 1], rotate: 0 }} className="text-9xl">🎉</motion.div>
                </div>
            )}

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0 border-b border-gray-50 pb-8">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-[#1A1D20] rounded-full" />
                        <h1 className="text-[36px] font-black tracking-tighter leading-none">Ponto de Vendas</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-1">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                            Registro de Performance • {dateStr}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-3 px-6 py-3 rounded-full bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-[#1A1D20] transition-all"
                    >
                        <ArrowLeft size={16} /> Cancelar
                    </button>
                    {todayCheckin && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-5 py-2 rounded-full shadow-sm">
                            <Sparkles size={14} className="text-amber-500" />
                            <span className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Modo Edição Ativo</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto w-full">

                {/* Form Column */}
                <div className="flex-1 space-y-10 pb-20">
                    <form onSubmit={handleSubmit} className="space-y-12">

                        {/* Prospecção & Fluxo */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <Target size={16} className="text-indigo-600" />
                                </div>
                                <h3 className="text-[#1A1D20] text-xs font-black uppercase tracking-[0.2em]">Fluxo Diário</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NumberInput label="Leads Atendidos" icon={Users} field="leads" bg="bg-indigo-600" color="text-white" />
                                <NumberInput label="Vendas de Porta" icon={Car} field="vnd_porta" bg="bg-emerald-600" color="text-white" />
                            </div>
                        </div>

                        {/* Agendamentos */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <Globe size={16} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-[#1A1D20] text-xs font-black uppercase tracking-[0.2em]">Agendamentos no Showroom</h3>
                                </div>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                    Total: {totals.agd_total}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NumberInput label="Da Carteira" icon={Users} field="agd_cart" bg="bg-blue-600" color="text-white" />
                                <NumberInput label="Pelo Digital" icon={Globe} field="agd_net" bg="bg-cyan-500" color="text-white" />
                            </div>
                        </div>

                        {/* Fechamentos */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <TrendingUp size={16} className="text-emerald-600" />
                                    </div>
                                    <h3 className="text-[#1A1D20] text-xs font-black uppercase tracking-[0.2em]">Fechamentos do Dia</h3>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                    Total: {totals.vnd_total}
                                </span>
                            </div>
                            <div className="inner-card p-8 bg-emerald-50/20 border-emerald-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 opacity-5 rounded-full blur-3xl" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    <NumberInput label="Vendas Carteira" icon={Users} field="vnd_cart" bg="bg-teal-600" color="text-white" />
                                    <NumberInput label="Vendas Digital" icon={Globe} field="vnd_net" bg="bg-emerald-500" color="text-white" />
                                </div>
                                <div className="mt-6 flex flex-col gap-2">
                                    <NumberInput label="Fluxo de Loja (Visitas)" icon={Eye} field="visitas" bg="bg-amber-500" color="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Error Handling */}
                        <AnimatePresence>
                            {funnelError && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-50 border border-red-100 rounded-[2rem] p-8 flex items-center gap-6 shadow-xl shadow-red-500/10">
                                    <div className="bg-red-600 p-4 rounded-2xl shadow-lg shadow-red-200"><AlertTriangle size={32} className="text-white" /></div>
                                    <div>
                                        <h4 className="font-black text-red-900 text-lg tracking-tight">Inconsistência de Dados</h4>
                                        <p className="text-red-800/80 text-sm font-bold leading-relaxed">{funnelError}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Zero States */}
                        <AnimatePresence>
                            {allZero && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inner-card p-10 bg-amber-50/50 border-amber-100 shadow-xl shadow-amber-500/5">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-amber-900 font-black text-lg tracking-tight leading-none">Movimento Zero</p>
                                            <p className="text-amber-800 opacity-60 text-[10px] font-black underline uppercase tracking-widest mt-1">É obrigatório justificar ausência de dados</p>
                                        </div>
                                    </div>
                                    <div className="relative group/select">
                                        <select value={form.zero_reason} onChange={e => setForm(prev => ({ ...prev, zero_reason: e.target.value }))}
                                            className="w-full bg-white border border-amber-200 rounded-[1.5rem] px-8 py-5 text-[#1A1D20] font-black text-sm focus:outline-none focus:border-amber-500 focus:ring-8 focus:ring-amber-500/5 transition-all appearance-none cursor-pointer shadow-sm">
                                            <option value="">Selecione o motivo corporativo...</option>
                                            {ZERO_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Finalization */}
                        <div className="pt-10 flex flex-col gap-6">
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <MessageSquare size={14} /> Notas do Período
                                </label>
                                <textarea
                                    value={form.note}
                                    onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                                    maxLength={280}
                                    placeholder="Caso precise detalhar algum fechamento ou evento atípico..."
                                    className="w-full bg-white border border-gray-100 rounded-[2rem] px-8 py-6 text-sm font-bold text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 focus:shadow-2xl transition-all resize-none shadow-sm min-h-[120px]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-8 rounded-[3rem] bg-[#1A1D20] text-white font-black text-2xl flex items-center justify-center gap-4 hover:bg-black transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] hover:-translate-y-2 active:scale-[0.98] group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {saving ? (
                                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Send size={32} /> <span>{todayCheckin ? 'ATUALIZAR DADOS' : 'LANÇAR NO SISTEMA'}</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Sidebar */}
                <div className="lg:w-[380px] space-y-8 h-fit lg:sticky lg:top-10">
                    <div className="inner-card p-10 bg-indigo-50/30 border-indigo-100/50">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                                <Info size={20} />
                            </div>
                            <h4 className="font-black text-indigo-900 uppercase text-[10px] tracking-widest">Importante</h4>
                        </div>
                        <ul className="space-y-6 text-sm font-bold text-indigo-900/70 leading-relaxed">
                            <li className="flex gap-3">
                                <span className="text-indigo-600">•</span>
                                <span>Certifique-se que o volume de agendamentos é condizente com as vendas registradas.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-600">•</span>
                                <span>Vendas de "Porta" representam o fluxo orgânico da loja física.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-600">•</span>
                                <span>O digital engloba todas as plataformas online (Zap, FB, IG, Site).</span>
                            </li>
                        </ul>
                    </div>

                    <div className="inner-card p-10 bg-[#1A1D20] text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-40">Impacto Atual</h4>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-6xl font-black tracking-tighter">{totals.vnd_total}</span>
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Unidades</span>
                        </div>
                        <p className="text-gray-400 text-xs font-bold leading-relaxed max-w-[200px]">
                            Seu desempenho hoje representa <span className="text-white">{totals.vnd_total} vendas</span> acumuladas neste ciclo.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
