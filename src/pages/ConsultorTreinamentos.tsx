import { useTrainings } from '@/hooks/useData'
import { useState } from 'react'
import { toast } from 'sonner'
import { GraduationCap, Plus, X, Save, ExternalLink, CheckCircle, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const types = ['prospeccao', 'fechamento', 'atendimento', 'gestao', 'pre-vendas']
const audiences = ['vendedor', 'gerente', 'todos']
const typeColors: Record<string, string> = {
    prospeccao: 'bg-violet-50 text-violet-700 border-violet-100',
    fechamento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    atendimento: 'bg-blue-50 text-blue-700 border-blue-100',
    gestao: 'bg-amber-50 text-amber-700 border-amber-100',
    'pre-vendas': 'bg-pink-50 text-pink-700 border-pink-100'
}

export default function ConsultorTreinamentos() {
    const { trainings, loading, createTraining } = useTrainings()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', type: 'prospeccao', video_url: '', target_audience: 'todos' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.video_url) { toast.error('Preencha título e URL'); return }
        setSaving(true)
        const { error } = await createTraining(form)
        setSaving(false)
        if (error) { toast.error(error); return }
        toast.success('Treinamento criado!')
        setShowForm(false); setForm({ title: '', description: '', type: 'prospeccao', video_url: '', target_audience: 'todos' })
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando treinamentos...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">Treinamentos</h1>
                    <span className="bg-white border border-gray-100 text-xs font-bold px-3 py-1 rounded-full text-gray-500">{trainings.length} cadastrados</span>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1A1D20] text-white font-bold hover:bg-black transition-all shadow-md active:scale-95 text-sm"
                    >
                        <Plus size={18} /> Novo Treinamento
                    </button>
                </div>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="overflow-hidden shrink-0"
                    >
                        <form onSubmit={handleSubmit} className="inner-card p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-50 rounded-full blur-3xl z-0" />

                            <div className="flex items-center justify-between relative z-10 mb-6">
                                <div>
                                    <h3 className="text-xl font-extrabold text-[#1A1D20]">Novo Treinamento</h3>
                                    <p className="text-gray-500 text-sm font-medium mt-1">Preencha as informações do treinamento.</p>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">Título</label>
                                    <input
                                        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Ex: Técnicas de fechamento" required autoFocus
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">URL do vídeo</label>
                                    <input
                                        value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                                        placeholder="https://youtube.com/..." required
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">Descrição</label>
                                <textarea
                                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Descreva o conteúdo do treinamento" rows={3}
                                    className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all resize-none"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 relative z-10">
                                <div>
                                    <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">Tipo</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] focus:outline-none focus:border-gray-400 focus:bg-white transition-all capitalize">
                                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[#1A1D20] mb-2 ml-1">Público-alvo</label>
                                    <select value={form.target_audience} onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))}
                                        className="w-full px-5 py-4 bg-[#F8FAFC] border border-gray-200 rounded-2xl text-base font-medium text-[#1A1D20] focus:outline-none focus:border-gray-400 focus:bg-white transition-all capitalize">
                                        {audiences.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 relative z-10 flex justify-end">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full md:w-auto px-8 py-4 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Criar Treinamento</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 shrink-0 pb-10">
                {trainings.map((t, i) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 flex flex-col justify-between group h-full relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-gray-50 rounded-full blur-2xl group-hover:bg-violet-50/50 transition-colors" />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${t.watched ? 'bg-emerald-50 border-emerald-100' : 'bg-[#F8FAFC] border-gray-100 group-hover:bg-white group-hover:shadow-sm'}`}>
                                {t.watched ? <CheckCircle size={20} className="text-emerald-500" /> : <Play size={20} className="text-gray-400 ml-0.5" />}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border ${typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                {t.type}
                            </span>
                        </div>

                        <div className="relative z-10 flex-1 mb-2">
                            <h3 className="text-lg font-extrabold text-[#1A1D20] mb-1 leading-tight line-clamp-2">{t.title}</h3>
                            {t.description && <p className="text-gray-500 text-sm font-medium line-clamp-2 leading-relaxed">{t.description}</p>}
                            <div className="flex gap-2 mt-3">
                                <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">{t.target_audience}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 relative z-10 flex justify-end">
                            <a href={t.video_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </motion.div>
                ))}

                {trainings.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center inner-card flex flex-col items-center justify-center border-dashed">
                        <GraduationCap size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-[#1A1D20] mb-2">Nenhum treinamento cadastrado</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Crie seu primeiro treinamento utilizando o botão no topo da página.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
