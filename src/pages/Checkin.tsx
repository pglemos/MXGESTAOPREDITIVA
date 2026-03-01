import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins } from '@/hooks/useCheckins'
import { validarFunil, calcularTotais } from '@/lib/calculations'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { CheckSquare, Users, Globe, Car, Eye, Send, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react'

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

    const NumberInput = ({ label, icon: Icon, field, color }: { label: string; icon: any; field: string; color: string }) => (
        <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-sm transition-all hover:border-gray-200">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.replace('bg-', 'bg-').replace('-600', '-100')}`}>
                    <Icon size={16} className={color.replace('bg-', 'text-').replace('-600', '-600')} />
                </div>
                <span className="text-[#1A1D20] font-bold text-sm tracking-tight">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => updateField(field, (form as any)[field] - 1)}
                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 flex items-center justify-center text-lg font-bold transition-colors">−</button>
                <input type="number" value={(form as any)[field]} min={0}
                    onChange={e => updateField(field, parseInt(e.target.value) || 0)}
                    className="w-14 text-center bg-gray-50 border border-gray-200 rounded-lg text-[#1A1D20] font-black py-1.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all no-spinners" />
                <button type="button" onClick={() => updateField(field, (form as any)[field] + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 flex items-center justify-center text-lg font-bold transition-colors">+</button>
            </div>
        </div>
    )

    return (
        <div className="max-w-xl mx-auto h-full pb-10">
            {showConfetti && <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">🎉</motion.div>
            </div>}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="soft-card p-6 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10" />

                <div className="flex sm:items-center gap-4 sm:gap-6 mb-8 flex-col sm:flex-row">
                    <div className="w-16 h-16 shrink-0 rounded-[1.5rem] bg-blue-100 flex items-center justify-center shadow-inner border border-blue-200">
                        <CheckSquare size={32} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#1A1D20] mb-1">Check-in do Dia</h1>
                        <p className="text-gray-500 text-sm font-medium capitalize">{dateStr}</p>
                    </div>
                    {todayCheckin && <span className="sm:ml-auto self-start bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">Editando</span>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Prospecção */}
                    <div className="inner-card p-5 sm:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center"><Users size={14} className="text-violet-600" /></span> Prospecção
                        </h3>
                        <NumberInput label="Leads recebidos" icon={Users} field="leads" color="bg-violet-600" />
                    </div>

                    {/* Agendamentos */}
                    <div className="inner-card p-5 sm:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center"><Globe size={14} className="text-blue-600" /></span> Agendamentos
                        </h3>
                        <div className="space-y-3">
                            <NumberInput label="AGD Carteira" icon={Users} field="agd_cart" color="bg-blue-600" />
                            <NumberInput label="AGD Internet" icon={Globe} field="agd_net" color="bg-cyan-600" />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <span className="text-xs text-blue-700 font-extrabold bg-blue-100 border border-blue-200 px-4 py-1.5 rounded-full shadow-sm">
                                Total AGD: {totals.agd_total}
                            </span>
                        </div>
                    </div>

                    {/* Visitas */}
                    <div className="inner-card p-5 sm:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center"><Eye size={14} className="text-amber-600" /></span> Visitas
                        </h3>
                        <NumberInput label="Visitas realizadas" icon={Eye} field="visitas" color="bg-amber-600" />
                    </div>

                    {/* Vendas */}
                    <div className="inner-card p-5 sm:p-6 shadow-sm border border-gray-100 bg-emerald-50/30">
                        <h3 className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center"><Car size={14} className="text-emerald-600" /></span> Vendas
                        </h3>
                        <div className="space-y-3">
                            <NumberInput label="VND Porta (loja)" icon={Car} field="vnd_porta" color="bg-emerald-600" />
                            <NumberInput label="VND Carteira" icon={Users} field="vnd_cart" color="bg-teal-600" />
                            <NumberInput label="VND Internet" icon={Globe} field="vnd_net" color="bg-green-600" />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <span className="text-xs text-emerald-800 font-extrabold bg-emerald-200 border border-emerald-300 px-4 py-1.5 rounded-full shadow-sm">
                                Total VND: {totals.vnd_total}
                            </span>
                        </div>
                    </div>

                    {/* Funnel validation */}
                    {funnelError && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <div className="bg-red-100 p-2 rounded-full shrink-0"><AlertTriangle size={16} className="text-red-600" /></div>
                            <p className="text-red-800 text-sm font-semibold leading-tight">{funnelError}</p>
                        </div>
                    )}

                    {/* Zero reason */}
                    {allZero && (
                        <div className="inner-card p-5 sm:p-6 shadow-sm border border-amber-200 bg-amber-50/50">
                            <p className="text-amber-900 font-bold text-sm mb-3">Nenhuma atividade hoje? Selecione o motivo:</p>
                            <select value={form.zero_reason} onChange={e => setForm(prev => ({ ...prev, zero_reason: e.target.value }))}
                                className="w-full bg-white border border-amber-200 shadow-sm rounded-xl px-4 py-3 text-[#1A1D20] font-semibold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer">
                                <option value="">Selecione...</option>
                                {ZERO_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Observação */}
                    <div className="inner-card p-5 sm:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center"><MessageSquare size={14} className="text-gray-600" /></span> Observação
                        </h3>
                        <textarea value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
                            maxLength={280} rows={2} placeholder="Ocorreu algo diferente no dia (opcional)"
                            className="w-full bg-gray-50 border border-gray-200 shadow-sm rounded-xl px-4 py-3 text-[#1A1D20] font-medium text-sm placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        <p className="text-right text-gray-400 font-bold text-xs mt-2">{form.note.length}/280</p>
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                        <button type="submit" disabled={saving}
                            className="w-full py-5 rounded-[2rem] bg-[#1A1D20] text-white font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-[0_8px_30px_rgba(0,0,0,0.12)] active:scale-[0.98] group relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                            {saving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                                todayCheckin ? <><Send size={20} className="relative z-10" /> <span className="relative z-10">Atualizar Check-in</span></> : <><Sparkles size={20} className="relative z-10" /> <span className="relative z-10">Enviar Check-in</span></>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
