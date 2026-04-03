import { supabase } from '@/lib/supabase'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import type { DigitalProduct } from '@/types/database'
import { Package, Plus, X, Save, ExternalLink, Search, MoreHorizontal, Sparkles, LayoutDashboard, Globe, Database, Smartphone, Laptop, Layers, RefreshCw, Trash2, Edit2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { z } from 'zod'

const productSchema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    description: z.string().min(5, 'Descrição necessária'),
    link: z.string().url('URL inválida. Use https://...')
})

export default function ProdutosDigitais() {
    const { role } = useAuth()
    const [products, setProducts] = useState<DigitalProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', link: '' })
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('digital_products').select('*').order('created_at', { ascending: false });
            if (error) throw error
            if (data) setProducts(data);
        } catch (e) {
            console.error('Audit Error [29]: fetchProducts fail ->', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        // 2. Security: Admin check
        if (role !== 'admin') { toast.error('Permissão negada.'); return }

        // 1. Validation: Zod schema
        const result = productSchema.safeParse(form)
        if (!result.success) {
            toast.error(result.error.errors[0].message)
            return
        }

        setSaving(true)
        const { error } = await supabase.from('digital_products').insert(form)
        setSaving(false);
        
        if (error) { toast.error(error.message); return }
        
        toast.success('Produto digital ativado no ecossistema!');
        setShowForm(false);
        setForm({ name: '', description: '', link: '' });
        // 6. Contador fix: manual fetch instead of waiting for effect
        fetchProducts()
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Remover este produto da vitrine digital?")) {
            const { error } = await supabase.from('digital_products').delete().eq('id', id)
            if (error) toast.error('Erro ao remover produto.')
            else {
                toast.info('Ativo removido.')
                fetchProducts()
            }
        }
    }

    // 11. Performance: Memoized search
    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [products, searchTerm])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Vitrine Digital...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">Vitrine <span className="text-orange-600">Digital</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">
                            {products.length} Ativos de Conversão Ativos
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                    <button 
                        onClick={() => { setIsRefetching(true); fetchProducts().then(() => setIsRefetching(false)) }}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="relative w-full sm:w-64 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar solução..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-full pl-11 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-orange-200 shadow-sm transition-all"
                        />
                    </div>
                    {role === 'admin' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group"
                        >
                            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Ativo
                        </button>
                    )}
                </div>
            </div>

            {/* Form Area */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="shrink-0 z-50 rounded-[2.5rem] p-1 bg-gradient-to-b from-orange-50 to-white shadow-3xl mb-10"
                    >
                        <form onSubmit={handleCreate} className="inner-card p-8 md:p-12 space-y-10 relative overflow-hidden bg-white border-none">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[80px] pointer-events-none -mt-40 -mr-40" />

                            <div className="flex items-center justify-between border-b border-gray-50 pb-8 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-2xl transform rotate-2">
                                        <Layers size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-2">Implantar Ativo Digital</h3>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Registro na Vitrine Operacional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:rotate-90 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Título Comercial</label>
                                    <input
                                        value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Ex: Academy Masterclass" required autoFocus
                                        className="premium-input !rounded-[1.5rem]"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Gateway de Destino</label>
                                    <div className="relative group">
                                        <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
                                        <input
                                            value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                                            placeholder="https://plataforma.mx" required
                                            className="premium-input !pl-14 !rounded-[1.5rem]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Briefing do Produto</label>
                                <textarea
                                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Destaque os benefícios e o valor estratégico desta solução..." rows={3}
                                    className="premium-input !rounded-[2rem] resize-none py-6 h-32"
                                />
                            </div>

                            <div className="relative z-10 flex justify-end pt-8 border-t border-gray-50">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full sm:w-auto px-12 py-5 rounded-full bg-pure-black text-white font-black flex items-center justify-center gap-4 hover:bg-black hover:shadow-elevation transition-all disabled:opacity-50 active:scale-95 text-[10px] uppercase tracking-[0.3em] group/btn"
                                >
                                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Ativar na Vitrine</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 pb-32">
                <AnimatePresence mode="popLayout">
                    {filteredProducts.map((p, i) => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-elevation hover:-translate-y-2 transition-all group overflow-hidden relative flex flex-col h-full"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50/50 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none group-hover:bg-orange-100/50 transition-colors z-0" />

                            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-start justify-between relative z-10">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-pure-black group-hover:text-white transition-all transform group-hover:rotate-3 shadow-inner">
                                    <Package size={28} className={cn("transition-colors", "text-orange-500 group-hover:text-white")} />
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm">ATIVO</Badge>
                                    {role === 'admin' && (
                                        <button onClick={() => handleDelete(p.id)} className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-8 flex-1 flex flex-col justify-between relative z-10">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-tight group-hover:text-orange-600 transition-colors line-clamp-2 uppercase">{p.name}</h3>
                                    {/* 8. Contrast fix */}
                                    <p className="text-sm font-bold text-gray-500 line-clamp-3 leading-relaxed opacity-80">{p.description || 'Solução estratégica sem ementa técnica definida.'}</p>
                                </div>

                                <div className="pt-8 mt-8 border-t border-gray-50 flex flex-col gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300"><Smartphone size={16} /></div>
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300"><Laptop size={16} /></div>
                                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest ml-auto">V2.4</span>
                                    </div>
                                    
                                    {/* 5. Direct click logic fix */}
                                    <button 
                                        onClick={() => window.open(p.link, '_blank')}
                                        className="w-full py-4 rounded-2xl bg-gray-50 border border-gray-100 text-pure-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-pure-black hover:text-white hover:border-pure-black transition-all active:scale-95 shadow-sm group/btn"
                                    >
                                        Acessar Plataforma <ExternalLink size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredProducts.length === 0 && !loading && (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[4rem] border-dashed border-2 border-gray-200 group">
                        <div className="w-32 h-32 rounded-full bg-white border border-gray-100 shadow-2xl flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform duration-500">
                            <Layers size={48} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Vitrine Silenciosa</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto mb-10">
                            Nenhuma solução digital localizada para os critérios de busca no cluster atual.
                        </p>
                        <button onClick={() => setSearchTerm('')} className="px-12 py-5 bg-pure-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-3xl transition-all active:scale-95">
                            Resetar Catálogo
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
