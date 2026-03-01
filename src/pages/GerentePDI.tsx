import { usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useState } from 'react'
import { Plus, Target, CheckCircle2, Calendar, User, TrendingUp, Search, Briefcase, X, MessageSquare, AlertCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

const statusCfg = {
    aberto: { color: 'bg-red-50 text-red-600 border-red-100', label: 'Aberto' },
    em_andamento: { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Em andamento' },
    concluido: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Concluído' }
}

export default function GerentePDI() {
    const { pdis, loading, createPDI, updateStatus, refetch } = usePDIs()
    const { sellers } = useTeam()
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        seller_id: '',
        objective: '',
        action: '',
        due_date: ''
    })

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.objective || !form.action) {
            toast.error('Preencha os campos obrigatórios')
            return
        }
        setSaving(true)
        const { error } = await createPDI(form)
        setSaving(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('PDI criado com sucesso!')
            setShowForm(false)
            setForm({ seller_id: '', objective: '', action: '', due_date: '' })
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando planos de desenvolvimento...</p>
        </div>
    )

    const filteredPDIs = pdis?.filter(p =>
        p.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p as any).seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Planos de Desenvolvimento
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Acompanhamento e Evolução Individual</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative w-full sm:w-80 group">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1A1D20] transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar PDI ou vendedor..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent rounded-[2rem] pl-14 pr-6 py-4 font-black text-sm focus:outline-none focus:bg-white focus:border-gray-100 focus:shadow-xl focus:shadow-gray-100 transition-all placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-[#1A1D20] text-white font-black hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo PDI
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden shrink-0">
                        <form onSubmit={handleCreate} className="inner-card p-8 bg-white border-2 border-indigo-100/50 shadow-xl relative overflow-hidden space-y-8">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 z-0" />

                            <div className="flex items-center justify-between relative z-10">
                                <h3 className="text-xl font-black">Adicionar Plano de Desenvolvimento</h3>
                                <button type="button" onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Para quem é o plano?</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={form.seller_id}
                                                onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                                required
                                                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl pl-12 pr-6 py-4 font-bold appearance-none cursor-pointer focus:outline-none focus:border-indigo-400 focus:bg-white"
                                            >
                                                <option value="">Selecione o vendedor...</option>
                                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Título do Objetivo</label>
                                        <div className="relative">
                                            <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={form.objective}
                                                onChange={e => setForm(p => ({ ...p, objective: e.target.value }))}
                                                required
                                                placeholder="Ex: Melhorar taxa de conversão"
                                                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl pl-12 pr-6 py-4 font-bold focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Prazo para conclusão</label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="date"
                                                value={form.due_date}
                                                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                                                required
                                                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl pl-12 pr-6 py-4 font-bold focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Descrição e Plano de Ação</label>
                                    <textarea
                                        value={form.action}
                                        onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                                        rows={8} required
                                        placeholder="Descreva as etapas, treinamentos ou mudanças de comportamento necessárias..."
                                        className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl px-6 py-6 font-medium placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none h-full min-h-[220px]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={saving}
                                className="w-full py-5 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 relative z-10"
                            >
                                {saving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={22} /> Publicar PDI</>}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0 pb-10">
                {filteredPDIs.map((p, i) => {
                    const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                    return (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="inner-card p-8 flex flex-col justify-between hover:shadow-xl transition-all bg-white border border-gray-100 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-50 transition-colors z-0" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-bold shadow-sm">
                                            {(p as any).seller_name?.charAt(0) || <User size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-sm truncate max-w-[120px]">{(p as any).seller_name}</p>
                                            <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded-full inline-flex">
                                                <Briefcase size={8} /> Vendedor
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                                            {status.label}
                                        </span>
                                        <select
                                            value={p.status}
                                            onChange={e => updateStatus(p.id, e.target.value)}
                                            className="text-[10px] font-bold text-gray-400 bg-transparent focus:outline-none cursor-pointer hover:text-[#1A1D20]"
                                        >
                                            <option value="aberto">Aberto</option>
                                            <option value="em_andamento">Em andamento</option>
                                            <option value="concluido">Concluído</option>
                                        </select>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black mb-4 leading-tight group-hover:text-indigo-600 transition-colors">{p.objective}</h3>
                                <p className="text-gray-500 text-sm font-medium line-clamp-3 mb-8 leading-relaxed">
                                    {p.action}
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between pt-6 border-t border-gray-50 bg-white">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar size={14} />
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        {p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                    </span>
                                </div>
                                {p.acknowledged ? (
                                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase">
                                        <CheckCircle2 size={12} /> Lido
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-gray-300 text-[10px] font-black uppercase">
                                        <Clock size={12} /> Não lido
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}

                {filteredPDIs.length === 0 && !loading && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center inner-card border-dashed bg-gray-50/30 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
                            <TrendingUp size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#1A1D20]">Nenhum PDI encontrado</h3>
                        <p className="text-gray-400 text-sm mt-1">Estimule o crescimento trocando feedbacks e criando PDIs.</p>
                        <button onClick={() => setShowForm(true)} className="mt-8 px-8 py-3 rounded-full bg-[#1A1D20] text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">
                            Criar Primeiro PDI
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
