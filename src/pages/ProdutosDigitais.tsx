import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { DigitalProduct } from '@/types/database'
import { Package, Plus, X, Save, ExternalLink, Search, MoreHorizontal, Sparkles, LayoutDashboard, Globe, Database, Smartphone, Laptop, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function ProdutosDigitais() {
    const [products, setProducts] = useState<DigitalProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', link: '' })
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const fetch = async () => {
        setLoading(true);
        const { data } = await supabase.from('digital_products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data);
        setLoading(false)
    }

    useEffect(() => { fetch() }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.link) return;
        setSaving(true)
        const { error } = await supabase.from('digital_products').insert(form)
        setSaving(false);
        if (error) { toast.error(error.message); return }
        toast.success('Produto digital ativado no ecossistema!');
        setShowForm(false);
        setForm({ name: '', description: '', link: '' });
        fetch()
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (loading) return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center soft-card px-6 text-center">
            <h1 className="text-3xl font-black tracking-tighter text-[#1A1D20]">Vitrine Digital</h1>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Catalogo em carregamento</p>
            <div className="mt-6 w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-black tracking-widest uppercase">Indexando catálogo digital...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Vitrine Digital</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">
                            {products.length} Soluções Disponíveis
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-stretch gap-4 shrink-0 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-80 group">
                        <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#1A1D20] transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar solução..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent rounded-[2rem] pl-14 pr-6 py-4 font-black text-sm focus:outline-none focus:bg-white focus:border-gray-100 focus:shadow-xl focus:shadow-gray-100 transition-all placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex w-full items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-[#1A1D20] text-white font-black hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group relative overflow-hidden sm:w-auto"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Produto
                    </button>
                </div>
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -20 }}
                        className="shrink-0 z-20"
                    >
                        <form onSubmit={handleCreate} className="inner-card p-6 sm:p-8 md:p-10 space-y-8 relative overflow-hidden bg-white border border-gray-100 shadow-2xl">
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-50/50 rounded-full blur-[100px] z-0 pointer-events-none" />

                            <div className="flex flex-col gap-4 relative z-10 mb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Layers size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-[#1A1D20] tracking-tight">Registro de Ativos</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Configuração de novo produto digital</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Título do Produto</label>
                                    <input
                                        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Ex: Academy Masterclass" required autoFocus
                                        className="w-full px-6 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[1.5rem] text-base font-black text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:shadow-xl focus:border-indigo-400 transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">URL de Destino</label>
                                    <div className="relative">
                                        <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input
                                            value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                                            placeholder="https://suaplataforma.com" required
                                            className="w-full px-6 pl-14 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[1.5rem] text-base font-black text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:shadow-xl focus:border-indigo-400 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Visão Geral/Descrição</label>
                                <textarea
                                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Destaque as principais funcionalidades e objetivos deste produto..." rows={3}
                                    className="w-full px-6 py-5 bg-[#F8FAFC] border border-gray-100 rounded-[1.5rem] text-base font-black text-[#1A1D20] placeholder:text-gray-300 focus:outline-none focus:bg-white focus:shadow-xl focus:border-indigo-400 transition-all resize-none"
                                />
                            </div>

                            <div className="relative z-10 flex justify-end pt-4 border-t border-gray-50">
                                <button
                                    type="submit" disabled={saving}
                                    className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1A1D20] px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 hover:bg-black hover:shadow-2xl disabled:opacity-50 md:w-auto md:px-12"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Ativar Produto na Rede</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 pb-16 shrink-0 sm:grid-cols-2 md:gap-8 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="inner-card relative flex h-full cursor-pointer flex-col justify-between overflow-hidden border border-gray-100 bg-white p-6 transition-all hover:-translate-y-3 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-8 md:p-10 group"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-orange-50/50 transition-colors z-0 pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-16 h-16 rounded-[1.8rem] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center shadow-inner group-hover:bg-white group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all">
                                    <Package size={28} className="text-orange-500" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <button className="w-10 h-10 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center hover:bg-[#1A1D20] hover:text-white transition-all">
                                        <MoreHorizontal size={20} />
                                    </button>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Disponível</span>
                                </div>
                            </div>

                            <div className="flex-1 mb-8">
                                <h3 className="text-2xl font-black text-[#1A1D20] mb-3 leading-tight tracking-tighter group-hover:text-orange-600 transition-colors line-clamp-2">{p.name}</h3>
                                {p.description ? (
                                    <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest line-clamp-3 leading-relaxed opacity-60">{p.description}</p>
                                ) : (
                                    <p className="text-gray-300 text-[10px] font-black uppercase tracking-widest italic opacity-40">Solução sem documentação técnica</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 border-t border-gray-50 pt-8 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Smartphone size={14} />
                                    </div>
                                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                        <Laptop size={14} />
                                    </div>
                                </div>
                                <a href={p.link} target="_blank" rel="noopener noreferrer"
                                    className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-6 py-3 text-[#1A1D20] shadow-sm transition-all active:scale-95 hover:bg-[#1A1D20] hover:text-white hover:shadow-2xl group-hover:scale-105 sm:w-auto">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Acessar</span>
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {products.length === 0 && !loading && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center inner-card border-2 border-dashed border-gray-100 bg-gray-50/20 rounded-[4rem]">
                        <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center mb-8 shadow-2xl border border-gray-50">
                            <Layers size={48} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-[#1A1D20] tracking-tighter mb-2">Catálogo Vazio</h3>
                        <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest opacity-60 mb-8 max-w-sm text-center leading-loose">Sua unidade ainda não possui produtos ou ativos digitais configurados.</p>
                        <button onClick={() => setShowForm(true)} className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1A1D20] px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 hover:bg-black sm:w-auto">
                            <Plus size={18} /> Adicionar Primeiro Produto
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
