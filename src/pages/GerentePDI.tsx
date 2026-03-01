import { usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Plus, X, Send, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const statusCfg = { aberto: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10', label: 'Aberto' }, em_andamento: { icon: Clock, color: 'text-amber-400 bg-amber-500/10', label: 'Em andamento' }, concluido: { icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10', label: 'Concluído' } }

export default function GerentePDI() {
    const { pdis, loading, createPDI, updateStatus } = usePDIs()
    const { sellers } = useTeam()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ seller_id: '', objective: '', action: '', due_date: '' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.objective || !form.action) { toast.error('Preencha os campos obrigatórios'); return }
        setSaving(true)
        const { error } = await createPDI(form)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('PDI criado!')
        setShowForm(false)
        setForm({ seller_id: '', objective: '', action: '', due_date: '' })
    }

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><FileText size={20} className="text-white" /></div>
                    <h1 className="text-xl font-bold text-white">PDIs</h1>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition"><Plus size={16} /> Novo</button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between"><h3 className="text-white font-medium">Novo PDI</h3><button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-white/40" /></button></div>
                        <select value={form.seller_id} onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none">
                            <option value="">Selecione o vendedor...</option>
                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input value={form.objective} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} required placeholder="Objetivo"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none" />
                        <textarea value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))} rows={2} required placeholder="Ação"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none" />
                        <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} placeholder="Prazo"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none" />
                        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-emerald-500 transition disabled:opacity-50">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Criar PDI</>}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            {pdis.length === 0 ? <p className="text-center py-10 text-white/40">Nenhum PDI criado</p> :
                <div className="space-y-3">
                    {pdis.map(p => {
                        const cfg = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                        return (
                            <div key={p.id} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-white text-sm font-medium">{p.seller_name}</span>
                                    <select value={p.status} onChange={e => updateStatus(p.id, e.target.value)}
                                        className={`text-xs px-2 py-0.5 rounded-full border-0 ${cfg.color} focus:outline-none`}>
                                        <option value="aberto">Aberto</option>
                                        <option value="em_andamento">Em andamento</option>
                                        <option value="concluido">Concluído</option>
                                    </select>
                                </div>
                                <p className="text-white/80 text-sm">🎯 {p.objective}</p>
                                <p className="text-blue-300/80 text-xs">📝 {p.action}</p>
                                <div className="flex justify-between text-[10px] text-white/30">
                                    {p.due_date && <span>Prazo: {new Date(p.due_date).toLocaleDateString('pt-BR')}</span>}
                                    <span>{p.acknowledged ? '✅ Lido' : '⏳ Não lido'}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            }
        </div>
    )
}
