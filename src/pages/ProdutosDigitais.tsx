import { supabase } from '@/lib/supabase'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import type { DigitalProduct } from '@/types/database'
import { Package, Plus, X, Save, ExternalLink, Search, RefreshCw, Smartphone, Laptop, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { z } from 'zod'

const productSchema = z.object({
    name: z.string().min(3, 'Nome muito curto'),
    description: z.string().min(5, 'Descrição necessária'),
    link: z.string().url('URL inválida')
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
            const { data } = await supabase.from('digital_products').select('*').order('created_at', { ascending: false });
            if (data) setProducts(data);
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (role !== 'admin') { toast.error('Permissão negada.'); return }
        const result = productSchema.safeParse(form)
        if (!result.success) { toast.error("Verifique os campos preenchidos"); return }

        setSaving(true)
        const { error } = await supabase.from('digital_products').insert(form)
        setSaving(false);
        if (error) { toast.error(error.message); return }
        toast.success('Ativo digital ativado!');
        setShowForm(false); setForm({ name: '', description: '', link: '' }); fetchProducts()
    }

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [products, searchTerm])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl" role="status">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin shadow-xl" aria-hidden="true"></div>
            <p className="mt-mx-md text-xs font-black text-gray-500 uppercase tracking-widest animate-pulse">Sincronizando Vitrine...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary bg-white">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-gray-100 pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-amber-500 rounded-full shadow-mx-md" aria-hidden="true" />
                        <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Vitrine <span className="text-amber-500">Digital</span></h1>
                    </div>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest pl-mx-md opacity-80">Catálogo de Soluções Operacionais • {products.length} Ativos</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <button onClick={() => { setIsRefetching(true); fetchProducts().then(() => setIsRefetching(false)) }} aria-label="Atualizar catálogo de produtos" className="w-12 h-12 rounded-mx-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-slate-950 transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-amber-500/10 outline-none">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                    <div className="relative w-full sm:w-64 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" aria-hidden="true" />
                        <label htmlFor="search-products" className="sr-only">Buscar solução digital</label>
                        <input 
                            id="search-products"
                            name="search-products"
                            type="text" 
                            placeholder="Buscar solução..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="mx-input !h-12 !pl-11 !text-xs font-bold focus:ring-4 focus:ring-amber-500/5 outline-none" 
                        />
                    </div>
                    {role === 'admin' && (
                        <button onClick={() => setShowForm(true)} className="mx-button-primary bg-brand-secondary h-12 px-6 flex items-center gap-2 shadow-mx-md hover:shadow-mx-lg transition-all focus-visible:ring-4 focus-visible:ring-amber-500/20 outline-none">
                            <Plus size={18} aria-hidden="true" /> Novo Ativo
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 z-50 rounded-mx-3xl p-1 bg-gradient-to-b from-amber-50 to-white shadow-mx-xl mb-mx-md">
                        <form onSubmit={handleCreate} className="bg-white rounded-[2.8rem] p-mx-lg md:p-mx-xl space-y-mx-lg relative overflow-hidden" aria-labelledby="form-product-title">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-mx-md">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-14 h-14 rounded-mx-lg bg-amber-500 text-white flex items-center justify-center shadow-lg" aria-hidden="true"><Layers size={24} /></div>
                                    <div>
                                        <h2 id="form-product-title" className="text-2xl font-black text-slate-950 tracking-tighter leading-none mb-1 uppercase">Implantar Ativo</h2>
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Vitrine Digital MX</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário" className="w-12 h-12 rounded-mx-md bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-all focus-visible:ring-4 focus-visible:ring-rose-500/10 outline-none"><X size={20} aria-hidden="true" /></button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <div className="space-y-2">
                                    <label htmlFor="prod-name" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Título Comercial</label>
                                    <input id="prod-name" name="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Academy Pro" required className="mx-input h-12" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="prod-link" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Gateway URL</label>
                                    <input id="prod-link" name="link" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." required className="mx-input h-12" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="prod-desc" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Briefing</label>
                                <textarea id="prod-desc" name="description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Benefícios estratégicos..." rows={3} className="mx-input !rounded-2xl resize-none py-4" />
                            </div>
                            <div className="pt-mx-md flex justify-end border-t border-gray-100">
                                <button type="submit" disabled={saving} className="mx-button-primary bg-slate-950 text-white px-10 h-12 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">
                                    {saving ? <RefreshCw className="animate-spin" aria-hidden="true" /> : 'Ativar Ativo'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {filteredProducts.length > 0 ? (
                    <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                        {filteredProducts.map((p, i) => (
                            <motion.li key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="mx-card flex flex-col h-full group hover:shadow-mx-xl hover:-translate-y-1 relative overflow-hidden bg-white border border-gray-100 rounded-3xl">
                                <div className="p-mx-lg border-b border-gray-100 bg-slate-50/30 flex items-start justify-between">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:bg-slate-950 group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                        <Package size={24} className="text-amber-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black uppercase tracking-widest px-3 h-6 rounded-md shadow-sm">ATIVO</Badge>
                                </div>
                                <div className="p-mx-lg flex flex-col justify-between flex-1">
                                    <div className="mb-mx-lg">
                                        <h2 className="text-xl font-black text-slate-950 tracking-tight leading-tight group-hover:text-amber-600 transition-colors line-clamp-2 uppercase">{p.name}</h2>
                                        <p className="text-sm font-bold text-gray-600 line-clamp-3 leading-relaxed opacity-80 mt-2 italic">
                                            "{p.description || 'Solução estratégica sem ementa.'}"
                                        </p>
                                    </div>
                                    <div className="pt-mx-md border-t border-gray-100 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400" aria-hidden="true"><Smartphone size={14} /></div>
                                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400" aria-hidden="true"><Laptop size={14} /></div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto">Versão 2.4</span>
                                        </div>
                                        <button 
                                            onClick={() => window.open(p.link, '_blank')} 
                                            className="mx-button-primary !bg-gray-100 !text-slate-950 border border-gray-200 hover:!bg-slate-950 hover:!text-white flex items-center justify-center gap-2 group/btn focus-visible:ring-4 focus-visible:ring-slate-500/10 outline-none font-black text-[10px] tracking-widest"
                                            aria-label={`Acessar gateway da solução ${p.name}`}
                                        >
                                            ACESSAR SOLUÇÃO <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-slate-50/50 border-2 border-dashed border-gray-200 rounded-[3rem] group hover:bg-gray-50 transition-all">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-mx-lg border border-gray-100 group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                            <Package size={48} className="text-gray-300" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase mb-2">Prateleira Vazia</h2>
                        <p className="text-gray-500 text-sm font-bold max-w-xs leading-relaxed uppercase tracking-widest">Nenhum ativo digital implantado no catálogo da rede.</p>
                    </div>
                )}
            </div>
        </main>
    )
}
