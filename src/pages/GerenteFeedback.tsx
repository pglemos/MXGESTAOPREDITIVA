import { useFeedbacks } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Plus, X, Send, CheckCircle, Clock, User, Award, AlertCircle, Zap, ChevronRight, LayoutDashboard, Target, TrendingUp, Sparkles, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function GerenteFeedback() {
    const { feedbacks, loading, createFeedback } = useFeedbacks()
    const { sellers } = useTeam()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ seller_id: '', positives: '', attention_points: '', action: '', notes: '' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.positives || !form.attention_points || !form.action) {
            toast.error('Preencha os campos obrigatórios')
            return
        }
        setSaving(true)
        const { error } = await createFeedback(form)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Feedback enviado para o vendedor!')
        setShowForm(false)
        setForm({ seller_id: '', positives: '', attention_points: '', action: '', notes: '' })
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando feedbacks...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-pink-600 rounded-full shadow-[0_0_15px_rgba(219,39,119,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Feedbacks da Equipe
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Cultura de Desenvolvimento e Mentoria</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <button className="flex items-center justify-center gap-2 px-6 py-5 rounded-[2rem] bg-white border border-gray-100 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 hover:text-pink-600 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all shadow-sm active:scale-95 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Filter size={16} /> Filtrar
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-[#1A1D20] text-white font-black hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Feedback
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.95 }} className="overflow-hidden shrink-0">
                        <form onSubmit={handleSubmit} className="inner-card p-10 space-y-10 bg-white border-gray-100 shadow-2xl shadow-blue-100/30 relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-50/50 rounded-full blur-[100px] z-0 pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#1A1D20] text-white flex items-center justify-center shadow-lg">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight">Novo Registro de Feedback</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Documentação Formal de Desempenho</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 opacity-60">Consultor Vinculado</label>
                                        <select
                                            value={form.seller_id}
                                            onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[#1A1D20] font-black text-sm focus:outline-none focus:border-blue-500/30 transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="">Selecione o membro da equipe...</option>
                                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 ml-1">
                                            <Award size={14} /> Pontos Positivos e Vitórias
                                        </label>
                                        <textarea
                                            value={form.positives}
                                            onChange={e => setForm(p => ({ ...p, positives: e.target.value }))}
                                            rows={3} required
                                            placeholder="Descreva o que o consultor superou recentemente..."
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[#1A1D20] font-bold text-sm placeholder:text-gray-300 focus:outline-none focus:border-emerald-500/30 focus:bg-white transition-all shadow-inner resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 ml-1">
                                            <AlertCircle size={14} /> Pontos de Melhoria
                                        </label>
                                        <textarea
                                            value={form.attention_points}
                                            onChange={e => setForm(p => ({ ...p, attention_points: e.target.value }))}
                                            rows={3} required
                                            placeholder="Quais comportamentos ou KPI's precisam de atenção?"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[#1A1D20] font-bold text-sm placeholder:text-gray-300 focus:outline-none focus:border-amber-500/30 focus:bg-white transition-all shadow-inner resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 ml-1">
                                            <Zap size={14} /> Próximo Passo Estratégico
                                        </label>
                                        <textarea
                                            value={form.action}
                                            onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                                            rows={3} required
                                            placeholder="Qual o plano de ação imediato acordado?"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-[#1A1D20] font-black text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500/30 focus:bg-white transition-all shadow-inner resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit" disabled={saving}
                                className="w-full py-6 rounded-[2.5rem] bg-[#1A1D20] text-white font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black hover:shadow-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Validar e Enviar Feedback</>}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0 pb-10">
                {feedbacks.map(f => (
                    <motion.div
                        key={f.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inner-card p-8 flex flex-col justify-between hover:shadow-2xl hover:border-blue-100 transition-all border border-gray-100 bg-white relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full blur-[60px] -mr-10 -mt-10 opacity-40 group-hover:bg-blue-50 transition-colors pointer-events-none" />

                        <div className="space-y-8 relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[#1A1D20] text-lg shadow-inner group-hover:scale-110 transition-transform">
                                        {(f as any).seller_name?.charAt(0) || <User size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-[#1A1D20] tracking-tight truncate max-w-[140px]">{(f as any).seller_name}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                {f.acknowledged ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                        <CheckCircle size={12} /> Lido
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                                        <Clock size={12} /> Pendente
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5">
                                <div className="p-5 rounded-3xl bg-emerald-50/30 border border-emerald-100/30 group-hover:bg-white transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award size={12} className="text-emerald-600" />
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Fortalezas</span>
                                    </div>
                                    <p className="text-[#1A1D20] text-[13px] font-bold leading-relaxed italic opacity-80">"{f.positives}"</p>
                                </div>

                                <div className="p-5 rounded-3xl bg-amber-50/30 border border-amber-100/30 group-hover:bg-white transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={12} className="text-amber-600" />
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Ajustes</span>
                                    </div>
                                    <p className="text-[#1A1D20] text-[13px] font-bold leading-relaxed italic opacity-80">"{f.attention_points}"</p>
                                </div>

                                <div className="p-6 rounded-3xl bg-[#1A1D20] text-white shadow-xl shadow-gray-200 group-hover:shadow-blue-200 transition-all transform group-hover:translate-x-1">
                                    <div className="flex items-center gap-2 mb-3 opacity-60">
                                        <Target size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Objetivo Imediato</span>
                                    </div>
                                    <p className="text-[14px] font-black leading-tight tracking-tight">🎯 {f.action}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {feedbacks.length === 0 && !loading && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center inner-card border-dashed bg-gray-50/50">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-inner ring-8 ring-gray-100/50">
                            <MessageSquare size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-400 tracking-tight">O Silêncio de Mentoria</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">Nenhum feedback registrado no histórico</p>
                    </div>
                )}
            </div>
        </div>
    )
}
