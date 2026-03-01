import { useFeedbacks } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Plus, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function GerenteFeedback() {
    const { feedbacks, loading, createFeedback } = useFeedbacks()
    const { sellers } = useTeam()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ seller_id: '', positives: '', attention_points: '', action: '', notes: '' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.positives || !form.attention_points || !form.action) { toast.error('Preencha todos os campos obrigatórios'); return }
        setSaving(true)
        const { error } = await createFeedback(form)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Feedback criado!')
        setShowForm(false)
        setForm({ seller_id: '', positives: '', attention_points: '', action: '', notes: '' })
    }

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center"><MessageSquare size={20} className="text-white" /></div>
                    <h1 className="text-xl font-bold text-white">Feedbacks</h1>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition"><Plus size={16} /> Novo</button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between"><h3 className="text-white font-medium">Novo Feedback</h3><button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button></div>
                        <select value={form.seller_id} onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))} required
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50">
                            <option value="">Selecione o vendedor...</option>
                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <textarea value={form.positives} onChange={e => setForm(p => ({ ...p, positives: e.target.value }))} rows={2} required placeholder="Pontos positivos"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-emerald-500/50" />
                        <textarea value={form.attention_points} onChange={e => setForm(p => ({ ...p, attention_points: e.target.value }))} rows={2} required placeholder="Pontos de atenção"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-amber-500/50" />
                        <textarea value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))} rows={2} required placeholder="Ação sugerida"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-blue-500/50" />
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={1} placeholder="Observações (opcional)"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none" />
                        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-500 transition disabled:opacity-50">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Enviar Feedback</>}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {feedbacks.length === 0 ? <p className="text-center py-10 text-white/40">Nenhum feedback criado</p> :
                <div className="space-y-3">
                    {feedbacks.map(f => (
                        <div key={f.id} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-2">
                            <div className="flex justify-between"><span className="text-white text-sm font-medium">{f.seller_name}</span>
                                <span className={`text-xs ${f.acknowledged ? 'text-emerald-400' : 'text-amber-400'}`}>{f.acknowledged ? '✅ Lido' : '⏳ Não lido'}</span></div>
                            <p className="text-emerald-300/80 text-xs">✅ {f.positives}</p>
                            <p className="text-amber-300/80 text-xs">⚠️ {f.attention_points}</p>
                            <p className="text-blue-300/80 text-xs">🎯 {f.action}</p>
                            <p className="text-white/30 text-[10px]">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                    ))}
                </div>
            }
        </div>
    )
}
