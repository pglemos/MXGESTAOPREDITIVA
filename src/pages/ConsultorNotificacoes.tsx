import { useNotifications } from '@/hooks/useData';
import { Badge } from '@/components/ui/badge'
import { useStores } from '@/hooks/useTeam'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Bell, Plus, X, Send, Target, Zap, Building2, Globe, AlertCircle, Calendar, RefreshCw, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

export default function ConsultorNotificacoes() {
    const { notifications, loading, sendNotification, refetch } = useNotifications()
    const { stores } = useStores()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', message: '', target_type: 'all' as 'all' | 'store', target_store_id: '' })
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.message) { toast.error('Preencha título e mensagem corporativa'); return }
        setSaving(true)
        const { error } = await sendNotification({ ...form, target_store_id: form.target_type === 'store' ? form.target_store_id : undefined })
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Comunicado disparado para a rede!')
        setShowForm(false)
        setForm({ title: '', message: '', target_type: 'all', target_store_id: '' })
    }

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
    }, [refetch])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Gateway de Alertas...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-rose-600 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Broadcast <span className="text-rose-600">Center</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Gestão de Comunicação de Rede • {notifications.length} Alertas</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
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
                        className="shrink-0 z-50 rounded-[2.5rem] p-1 bg-gradient-to-b from-rose-50 to-white shadow-3xl mb-10"
                    >
                        <form onSubmit={handleSubmit} className="inner-card p-10 md:p-14 space-y-10 relative overflow-hidden bg-white border-none">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(225,29,72,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-2">
                                        <AlertCircle size={24} className="text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2">Compor Mensagem</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Network Intelligence Broadcast</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Assunto Estratégico</label>
                                        <input
                                            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="Ex: Alerta de Pacing Semanal" required autoFocus
                                            className="premium-input !rounded-[1.5rem]"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Corpo da Notificação</label>
                                        <textarea
                                            value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                            placeholder="Detalhes técnicos ou operacionais para os usuários..." rows={4} required
                                            className="premium-input !rounded-[2rem] resize-none py-6 h-40"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Público Alvo (Segmentação)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, target_type: 'all' }))}
                                            className={cn(
                                                "p-8 rounded-[2.2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 text-center",
                                                form.target_type === 'all' ? 'bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-500/10' : 'bg-white border-gray-100 hover:border-indigo-100'
                                            )}
                                        >
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", form.target_type === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-300')}>
                                                <Globe size={24} />
                                            </div>
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", form.target_type === 'all' ? 'text-indigo-900' : 'text-gray-400')}>Toda a Rede</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, target_type: 'store' }))}
                                            className={cn(
                                                "p-8 rounded-[2.2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 text-center",
                                                form.target_type === 'store' ? 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10' : 'bg-white border-gray-100 hover:border-amber-100'
                                            )}
                                        >
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", form.target_type === 'store' ? 'bg-amber-500 text-white' : 'bg-gray-50 text-gray-300')}>
                                                <Building2 size={24} />
                                            </div>
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest", form.target_type === 'store' ? 'text-amber-900' : 'text-gray-400')}>Node Unit</span>
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {form.target_type === 'store' && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-4">
                                                <select
                                                    value={form.target_store_id}
                                                    onChange={e => setForm(p => ({ ...p, target_store_id: e.target.value }))}
                                                    required
                                                    className="w-full px-6 py-5 bg-gray-50 border border-amber-200 rounded-[1.5rem] text-sm font-black text-pure-black focus:outline-none focus:bg-white focus:shadow-xl transition-all appearance-none cursor-pointer shadow-inner"
                                                >
                                                    <option value="" disabled>Selecionar unidade operacional...</option>
                                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="pt-8 relative z-10 flex justify-end gap-4 border-t border-gray-50">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-12 py-5 rounded-full bg-rose-600 text-white font-black flex items-center justify-center gap-4 hover:bg-rose-700 hover:shadow-elevation transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                >
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Disparar na Rede <Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /></>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
                {notifications.length === 0 ? (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <Bell size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Zero Broadcasts</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">Nenhum alerta disparado pelo seu usuário no histórico atual.</p>
                    </div>
                ) : (
                    notifications.map((n, i) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-start justify-between mb-10 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-pure-black group-hover:text-white shadow-inner transition-all transform group-hover:rotate-6">
                                    <Zap size={24} />
                                </div>
                                <Badge className={cn(
                                    "font-black text-[8px] uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm",
                                    n.target_type === 'all' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                )}>
                                    {n.target_type === 'all' ? 'GLOBAL' : 'NODE UNIT'}
                                </Badge>
                            </div>

                            <div className="flex-1 mb-8 relative z-10">
                                <h3 className="text-xl font-black text-pure-black mb-3 tracking-tight group-hover:text-rose-600 transition-colors uppercase leading-tight line-clamp-2">{n.title}</h3>
                                <p className="text-sm font-bold text-gray-500 line-clamp-4 leading-relaxed opacity-80">{n.message}</p>
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between mt-auto relative z-10">
                                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    <Calendar size={14} className="text-rose-500" /> {new Date(n.sent_at).toLocaleDateString('pt-BR')}
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{new Date(n.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
