import { useNotifications } from '@/hooks/useData'
import { useStores } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Plus, X, Send, Target, Zap, Building2, Globe, AlertCircle, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function ConsultorNotificacoes() {
    const { notifications, loading, sendNotification } = useNotifications()
    const { stores } = useStores()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', message: '', target_type: 'all' as 'all' | 'store', target_store_id: '' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.message) { toast.error('Preencha título e mensagem'); return }
        setSaving(true)
        const { error } = await sendNotification({ ...form, target_store_id: form.target_type === 'store' ? form.target_store_id : undefined })
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Alerta disparado para a rede!')
        setShowForm(false)
        setForm({ title: '', message: '', target_type: 'all', target_store_id: '' })
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Alertas...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Central de Alertas
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">System Broadcast • {notifications.length} Sent</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-[#1A1D20] text-white font-black hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Disparar Alerta
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="shrink-0 z-50 rounded-[3rem] p-1 bg-gradient-to-b from-rose-50 to-white shadow-2xl shadow-rose-500/10 mb-6"
                    >
                        <form onSubmit={handleSubmit} className="inner-card p-10 md:p-14 space-y-10 relative overflow-hidden bg-white border-none">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(225,29,72,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                            <div className="absolute -right-40 -top-40 w-96 h-96 bg-rose-50 rounded-full blur-[100px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-[#1A1D20] text-white flex items-center justify-center shadow-2xl shadow-black/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
                                        <AlertCircle size={28} className="text-rose-400 fill-white/10" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none mb-2">Compor Alerta</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Network Broadcast</p>
                                    </div>
                                    <button type="button" onClick={() => setShowForm(false)} className="w-14 h-14 rounded-full bg-[#F8FAFC] border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-red-500 hover:border-red-100 hover:shadow-xl hover:rotate-90 transition-all active:scale-90">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-8">
                                    <div className="space-y-4 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-rose-600 transition-colors">
                                            <Target size={12} /> Assunto
                                        </label>
                                        <input
                                            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="Descreva o motivo do alerta..." required autoFocus
                                            className="w-full px-6 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[2.5rem] text-base font-black text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-rose-400 focus:shadow-2xl focus:shadow-rose-500/5 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-4 group">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-rose-600 transition-colors">
                                            <AlertCircle size={12} /> Conteúdo da Notificação
                                        </label>
                                        <textarea
                                            value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                            placeholder="Detalhes para os usuários..." rows={4} required
                                            className="w-full px-6 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[2.5rem] text-base font-bold text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-rose-400 focus:shadow-2xl focus:shadow-rose-500/5 transition-all shadow-sm resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                        <Zap size={12} className="text-amber-500" /> Direcionamento
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, target_type: 'all' }))}
                                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-3 text-center ${form.target_type === 'all'
                                                ? 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-500/10'
                                                : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center ${form.target_type === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Globe size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${form.target_type === 'all' ? 'text-indigo-900' : 'text-gray-500'}`}>Broadcast Global</span>
                                                <span className={`text-xs font-bold leading-tight ${form.target_type === 'all' ? 'text-indigo-700/70' : 'text-gray-400'}`}>Todas as unidades operacionais</span>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, target_type: 'store' }))}
                                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-3 text-center ${form.target_type === 'store'
                                                ? 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10'
                                                : 'bg-white border-gray-100 hover:border-amber-100 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center ${form.target_type === 'store' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Building2 size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${form.target_type === 'store' ? 'text-amber-900' : 'text-gray-500'}`}>Node Específico</span>
                                                <span className={`text-xs font-bold leading-tight ${form.target_type === 'store' ? 'text-amber-700/70' : 'text-gray-400'}`}>Selecionar unidade destino</span>
                                            </div>
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {form.target_type === 'store' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                exit={{ opacity: 0, y: 10, height: 0 }}
                                            >
                                                <select
                                                    value={form.target_store_id}
                                                    onChange={e => setForm(p => ({ ...p, target_store_id: e.target.value }))}
                                                    required
                                                    className="w-full px-6 py-5 bg-[#F8FAFC] border border-amber-200 rounded-[2rem] text-sm font-black text-[#1A1D20] focus:outline-none focus:bg-white focus:border-amber-400 focus:shadow-2xl focus:shadow-amber-500/10 transition-all shadow-sm cursor-pointer appearance-none"
                                                >
                                                    <option value="" disabled>Selecione o Node destino...</option>
                                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="pt-8 relative z-10 flex flex-col-reverse sm:flex-row justify-end gap-4 border-t border-gray-50">
                                <button
                                    type="button" onClick={() => setShowForm(false)}
                                    className="px-10 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#1A1D20] hover:bg-gray-50 transition-all"
                                >
                                    Abortar
                                </button>
                                <button
                                    type="submit" disabled={saving}
                                    className="px-12 py-5 rounded-[2.5rem] bg-rose-600 text-white font-black flex items-center justify-center gap-3 hover:bg-rose-700 hover:shadow-[0_20px_40px_-10px_rgba(225,29,72,0.5)] transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Disparar Broadcast <Send size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /></>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col gap-6 shrink-0 pb-20">
                {notifications.length === 0 ? (
                    <div className="py-32 rounded-[4rem] text-center inner-card flex flex-col items-center justify-center border-dashed border-2 border-gray-200 bg-gray-50/50 relative overflow-hidden group max-w-4xl w-full mx-auto">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Bell size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-[#1A1D20] mb-4 tracking-tighter">Histórico Vazio</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-md mx-auto">
                            O sistema não registrou disparos de notificação partindo do seu usuário nesta sessão.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative rounded-[2.5rem] p-8 bg-white border border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all group flex flex-col h-full overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-br from-indigo-50 to-transparent rounded-full blur-[40px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex flex-col relative z-10 flex-1">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-[1.2rem] bg-[#F8FAFC] text-gray-400 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-[#1A1D20] group-hover:text-white transition-colors group-hover:rotate-12">
                                                {n.title === 'alert' ? <AlertCircle size={20} /> :
                                                    n.title === 'system' ? <Zap size={20} /> :
                                                        <Bell size={20} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-lg tracking-tight text-[#1A1D20] truncate group-hover:text-indigo-600 transition-colors">
                                                    {n.title}
                                                </h3>
                                            </div>
                                        </div>

                                        <p className="text-sm font-bold leading-relaxed text-gray-500 mb-6 flex-1 line-clamp-3">
                                            {n.message}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${n.target_type === 'all'
                                                ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
                                                : 'bg-amber-50 border-amber-100 text-amber-600'
                                                }`}>
                                                {n.target_type === 'all' ? <Globe size={10} /> : <Building2 size={10} />}
                                                {n.target_type === 'all' ? 'Global' : 'Node Esp.'}
                                            </span>

                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {new Date(n.sent_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div >
    )
}
