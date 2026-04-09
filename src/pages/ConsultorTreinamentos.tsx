import { useTrainings } from '@/hooks/useData'
import { useState } from 'react'
import { toast } from 'sonner'
import { GraduationCap, Plus, X, Save, ExternalLink, CheckCircle, Play, Filter, Sparkles, BookOpen, Clock, Target, Users, LayoutDashboard, ChevronRight } from 'lucide-react'
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
    const { trainings, loading, error, createTraining } = useTrainings()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', type: 'prospeccao', video_url: '', target_audience: 'todos' })
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.video_url) { toast.error('Preencha os campos obrigatórios'); return }
        setSaving(true)
        const { error: createError } = await createTraining(form)

        setSaving(false)
        if (createError) { toast.error(createError); return }
        toast.success('Treinamento criado!')
        setShowForm(false); setForm({ title: '', description: '', type: 'prospeccao', video_url: '', target_audience: 'todos' })
    }

    if (error) return (
        <div role="alert" className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full p-8 text-center">
            <X size={48} className="text-red-500 mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Erro de Conexão</h2>
            <p className="text-slate-600">Não foi possível carregar os treinamentos. Por favor, tente novamente.</p>
        </div>
    )

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full" aria-busy="true" aria-live="polite">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" aria-hidden="true"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando treinamentos...</p>
        </div>
    )

    return (
        <main className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-text-primary">

            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Central de Treinamentos
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" aria-hidden="true" />
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] opacity-80 text-shadow-sm">Educação e Desenvolvimento de Alta Performance</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full sm:w-auto">
                    <button 
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-5 rounded-[2rem] bg-white border border-gray-100 font-black text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] text-gray-500 hover:text-blue-600 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all shadow-sm active:scale-95 group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus:outline-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        <Filter size={16} aria-hidden="true" /> Filtrar
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-4 sm:px-8 py-3 sm:py-5 rounded-[2rem] bg-brand-secondary text-white font-black hover:bg-brand-secondary-hover hover:shadow-mx-xl transition-all active:scale-95 text-sm uppercase tracking-[0.1em] sm:tracking-[0.2em] group relative overflow-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none"
                        aria-expanded={showForm}
                        aria-controls="form-novo-conteudo"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" aria-hidden="true" /> Novo Conteúdo
                    </button>
                </div>
            </header>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.section
                        id="form-novo-conteudo"
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="overflow-hidden shrink-0"
                        aria-label="Formulário de novo conteúdo"
                    >
                        <form onSubmit={handleSubmit} className="inner-card p-6 sm:p-8 md:p-10 space-y-10 bg-white border-gray-100 shadow-2xl shadow-blue-100/30 relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-50/50 rounded-full blur-[100px] z-0 pointer-events-none" aria-hidden="true" />

                            <div className="relative z-10 flex flex-col gap-4 border-b border-gray-50 pb-8 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-white flex items-center justify-center shadow-lg" aria-hidden="true">
                                        <GraduationCap size={24} aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Expandir Base de Conhecimento</h2>
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-1 opacity-80">Upload de Novos Módulos de Aprendizado</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none" aria-label="Fechar formulário">
                                    <X size={20} aria-hidden="true" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-8">
                                    <div>
                                        <label htmlFor="form-title" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-1 opacity-80">Título da Aula</label>
                                        <input
                                            id="form-title"
                                            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="Ex: Masterizando o Script de Fechamento" required autoFocus
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-text-primary font-black text-sm focus:outline-none focus:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary transition-all shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="form-desc" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-1 opacity-80">Ementa / Descrição</label>
                                        <textarea
                                            id="form-desc"
                                            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Descreva detalhadamente os objetivos desta aula..." rows={4}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-text-primary font-bold text-sm placeholder:text-gray-400 focus:outline-none focus:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary focus:bg-white transition-all shadow-inner resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label htmlFor="form-video" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-1 opacity-80">URL do Material (Vídeo)</label>
                                        <input
                                            id="form-video"
                                            value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))}
                                            placeholder="https://youtube.com/v/..." required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-text-primary font-medium text-sm focus:outline-none focus:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="form-type" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-1 opacity-80">Pilar de Vendas</label>
                                            <select 
                                                id="form-type"
                                                value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-text-primary font-black text-sm focus:outline-none focus:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary transition-all appearance-none cursor-pointer shadow-inner"
                                            >
                                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="form-audience" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 ml-1 opacity-80">Público Alvo</label>
                                            <select 
                                                id="form-audience"
                                                value={form.target_audience} onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-5 text-text-primary font-black text-sm focus:outline-none focus:border-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary transition-all appearance-none cursor-pointer shadow-inner"
                                            >
                                                {audiences.map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-2 text-right">
                                        <button
                                            type="submit" disabled={saving}
                                            className="w-full py-6 rounded-[2.5rem] bg-brand-secondary text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-secondary-hover hover:shadow-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none"
                                        >
                                            {saving ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /> : <><Save size={18} aria-hidden="true" /> Publicar Treinamento</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            {/* Grid */}
            <ul className="grid grid-cols-1 gap-6 pb-10 shrink-0 sm:grid-cols-2 md:gap-8 xl:grid-cols-3" aria-label="Lista de treinamentos disponíveis">
                {trainings.map((t, i) => (
                    <motion.li
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="inner-card p-8 flex flex-col justify-between hover:shadow-2xl hover:border-blue-100 transition-all border border-gray-100 bg-white relative overflow-hidden group h-full focus-within:ring-2 focus-within:ring-brand-primary"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full blur-[80px] -mr-16 -mt-16 opacity-40 group-hover:bg-blue-50 transition-colors pointer-events-none" aria-hidden="true" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${t.watched ? 'bg-emerald-50 border-emerald-100' : 'bg-surface-alt border-gray-100 group-hover:scale-110 group-hover:bg-white group-hover:rotate-3'}`} aria-hidden="true">
                                    {t.watched ? <CheckCircle size={24} className="text-emerald-500" aria-hidden="true" /> : <Play size={24} className="text-text-primary ml-1" aria-hidden="true" />}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`text-[10px] sm:text-xs uppercase font-black tracking-widest px-4 py-2 rounded-full border shadow-sm ${typeColors[t.type] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                        {t.type}
                                    </span>
                                    {t.watched && <span className="text-[10px] sm:text-xs font-black text-emerald-600 uppercase tracking-tighter" aria-label="Módulo Concluído">✔ Concluído</span>}
                                </div>
                            </div>

                            <div className="flex-1 mb-6">
                                <h3 className="text-xl font-black text-text-primary mb-3 leading-tight tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2" title={t.title}>{t.title}</h3>
                                {t.description && (
                                    <p className="text-gray-500 text-sm font-bold line-clamp-3 leading-relaxed opacity-80 mb-4" title={t.description}>{t.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-text-primary text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80">
                                        <Users size={12} aria-hidden="true" /> {t.target_audience}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-text-primary text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-80">
                                        <Clock size={12} aria-hidden="true" /> 12 min
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex -space-x-2" aria-hidden="true">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-black">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-xs font-black text-gray-500">
                                        +12
                                    </div>
                                </div>
                                <a href={t.video_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-secondary text-white hover:bg-brand-secondary-hover hover:shadow-xl transition-all active:scale-95 group-hover:translate-x-1 focus-visible:ring-2 focus-visible:ring-brand-primary focus:outline-none"
                                    aria-label={`Acessar material de ${t.title}`}
                                >
                                    <ExternalLink size={20} aria-hidden="true" />
                                </a>
                            </div>
                        </div>
                    </motion.li>
                ))}

                {trainings.length === 0 && !loading && !error && (
                    <li className="col-span-full py-32 flex flex-col items-center justify-center inner-card border-dashed bg-gray-50/50">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-inner ring-8 ring-gray-100/50" aria-hidden="true">
                            <GraduationCap size={40} className="text-gray-300" aria-hidden="true" />
                        </div>
                        <h3 className="text-xl font-black text-gray-500 tracking-tight">Academia Vazia</h3>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest mt-2 opacity-80">Comece a construir seu legado de conhecimento hoje</p>
                    </li>
                )}
            </ul>
        </main>
    )
}
