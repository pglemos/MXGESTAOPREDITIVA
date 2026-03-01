import { useNotifications } from '@/hooks/useData'
import { useStores } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Plus, X, Send, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function ConsultorNotificacoes() {
    const { notifications, loading, sendNotification } = useNotifications()
    const { stores } = useStores()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', message: '', target_type: 'all' as 'all' | 'store', target_store_id: '' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!form.title || !form.message) { toast.error('Preencha título e mensagem'); return }
        setSaving(true)
        const { error } = await sendNotification({ ...form, target_store_id: form.target_type === 'store' ? form.target_store_id : undefined })
        setSaving(false); if (error) { toast.error(error); return }
        toast.success('Notificação enviada!'); setShowForm(false); setForm({ title: '', message: '', target_type: 'all', target_store_id: '' })
    }

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center"><Bell size={20} className="text-white" /></div><h1 className="text-xl font-bold text-white">Notificações</h1></div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"><Plus size={16} /> Nova</button>
            </div>
            <AnimatePresence>{showForm && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSubmit} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between"><h3 className="text-white font-medium">Nova Notificação</h3><button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button></div>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none" />
                    <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Mensagem" rows={3} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none" />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setForm(p => ({ ...p, target_type: 'all' }))} className={`flex-1 py-2 rounded-xl text-sm ${form.target_type === 'all' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>Todas as lojas</button>
                        <button type="button" onClick={() => setForm(p => ({ ...p, target_type: 'store' }))} className={`flex-1 py-2 rounded-xl text-sm ${form.target_type === 'store' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>Loja específica</button>
                    </div>
                    {form.target_type === 'store' && (
                        <select value={form.target_store_id} onChange={e => setForm(p => ({ ...p, target_store_id: e.target.value }))} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                            <option value="">Selecione...</option>{stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-red-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-red-500 transition disabled:opacity-50"><Send size={16} /> Enviar</button>
                </motion.form>
            )}</AnimatePresence>
            <div className="space-y-2">{notifications.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <p className="text-white font-medium text-sm">{n.title}</p><p className="text-white/50 text-xs mt-1">{n.message}</p>
                    <div className="flex justify-between mt-2 text-[10px] text-white/30"><span>{n.target_type === 'all' ? '🌍 Todas' : '🏪 Loja'}</span><span>{new Date(n.sent_at).toLocaleDateString('pt-BR')}</span></div>
                </motion.div>
            ))}</div>
        </div>
    )
}
