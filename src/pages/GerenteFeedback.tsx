import { useFeedbacks } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Plus, X, Send, Award, AlertCircle, Zap, Target, Sparkles, RefreshCw, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

export default function GerenteFeedback() {
    const { feedbacks, loading, createFeedback, refetch } = useFeedbacks()
    const { sellers } = useTeam()
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [form, setForm] = useState({ seller_id: '', positives: '', attention_points: '', action: '', notes: '' })
    const [saving, setSaving] = useState(false)

    // 1. & 11. Search Filter & Performance
    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter(f => 
            (f as any).seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.positives.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.action.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [feedbacks, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Matrix de feedback da equipe sincronizada!')
    }, [refetch])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.seller_id || !form.positives || !form.attention_points || !form.action) {
            toast.error('Preencha os campos mandatórios de mentoria.')
            return
        }
        setSaving(true)
        const { error } = await createFeedback(form)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Feedback enviado para o cockpit do vendedor!')
        setShowForm(false)
        setForm({ seller_id: '', positives: '', attention_points: '', action: '', notes: '' })
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Mentoria...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header / 10. Typography fixed */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                            Ciclo de <span className="text-indigo-600">Mentoria</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Gestão de Performance & Desenvolvimento</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Buscar por vendedor ou tema..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-10 py-3 text-xs font-bold focus:outline-none focus:border-indigo-200 shadow-sm transition-all"
                        />
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Feedback
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 z-50 rounded-[3rem] p-1 bg-gradient-to-b from-indigo-50 to-white shadow-3xl mb-10">
                        <form onSubmit={handleSubmit} className="inner-card p-10 md:p-14 space-y-10 relative overflow-hidden bg-white border-none">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />

                            <div className="flex items-center justify-between relative z-10 border-b border-gray-50 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl transform rotate-2">
                                        <Sparkles size={24} className="text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2 uppercase">Registrar Mentoria</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Documentação de Desempenho Regional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 leading-none">Consultor Alvo</label>
                                        <select
                                            value={form.seller_id}
                                            onChange={e => setForm(p => ({ ...p, seller_id: e.target.value }))}
                                            required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-pure-black font-black text-sm focus:outline-none focus:bg-white focus:border-indigo-400 focus:shadow-xl transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="">Selecione o especialista...</option>
                                            {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-2 leading-none">
                                            <Award size={14} /> Vitórias & Superação
                                        </label>
                                        <textarea
                                            value={form.positives}
                                            onChange={e => setForm(p => ({ ...p, positives: e.target.value }))}
                                            rows={3} required
                                            placeholder="Descreva resultados acima da média ou conquistas..."
                                            className="premium-input !rounded-[2rem] h-32 resize-none py-6"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest ml-2 leading-none">
                                            <AlertCircle size={14} /> Gaps Operacionais
                                        </label>
                                        <textarea
                                            value={form.attention_points}
                                            onChange={e => setForm(p => ({ ...p, attention_points: e.target.value }))}
                                            rows={3} required
                                            placeholder="Quais indicadores ou comportamentos precisam de ajuste?"
                                            className="premium-input !rounded-[2rem] h-32 resize-none py-6"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-2 leading-none">
                                            <Zap size={14} /> Próxima Ação Mandatória
                                        </label>
                                        <textarea
                                            value={form.action}
                                            onChange={e => setForm(p => ({ ...p, action: e.target.value }))}
                                            rows={3} required
                                            placeholder="Qual o plano tático imediato para este vendedor?"
                                            className="premium-input !rounded-[2rem] h-32 resize-none py-6"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-50 flex justify-end">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-black hover:shadow-elevation transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                >
                                    {saving ? <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" /> : <><Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" /> Enviar Feedback Oficial</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0 pb-32">
                <AnimatePresence mode="popLayout">
                    {filteredFeedbacks.map((f, i) => (
                        <motion.div
                            key={f.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-elevation transition-all group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-start justify-between mb-10 relative z-10 border-b border-gray-50 pb-6">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-pure-black text-lg shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all">
                                        {(f as any).seller_name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-black text-pure-black truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{(f as any).seller_name}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className={cn("px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm shrink-0", 
                                    f.acknowledged ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                )}>
                                    {f.acknowledged ? 'LIDO' : 'PENDENTE'}
                                </div>
                            </div>

                            <div className="space-y-6 flex-1 relative z-10">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                                        <Award size={12} /> Pontos Positivos
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 line-clamp-2 leading-relaxed italic">"{f.positives}"</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest leading-none">
                                        <AlertCircle size={12} /> Atenção
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 line-clamp-2 leading-relaxed italic">"{f.attention_points}"</p>
                                </div>
                                <div className="pt-6 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-3">
                                        <Target size={14} strokeWidth={2.5} /> Missão Definida
                                    </div>
                                    <p className="text-base font-black text-pure-black leading-tight uppercase tracking-tight">{f.action}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredFeedbacks.length === 0 && !loading && (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <MessageSquare size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter uppercase">Diário de Mentoria Vazio</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto mb-8">
                            Nenhum registro de feedback localizado para "{searchTerm}" no cluster atual.
                        </p>
                        <button onClick={() => {setSearchTerm(''); setShowForm(true)}} className="px-10 py-4 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all active:scale-95">
                            Iniciar Primeira Mentoria
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
