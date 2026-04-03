import { supabase } from '@/lib/supabase'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import type { DigitalProduct } from '@/types/database'
import { Package, Plus, X, Save, ExternalLink, Search, MoreHorizontal, Sparkles, LayoutDashboard, Globe, Database, Smartphone, Laptop, Layers, RefreshCw, Trash2, Edit2 } from 'lucide-react'
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
        if (!result.success) { toast.error(result.error.errors[0].message); return }

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-mx-amber-200 border-t-mx-amber-600 rounded-full animate-spin"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse">Sincronizando Vitrine...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-status-warning rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Vitrine <span className="text-status-warning">Digital</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Catálogo de Soluções Operacionais • {products.length} Ativos</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <button onClick={() => { setIsRefetching(true); fetchProducts().then(() => setIsRefetching(false)) }} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <div className="relative w-full sm:w-64 group">
                        <Search size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-status-warning" />
                        <input type="text" placeholder="Buscar solução..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mx-input !h-12 !pl-11" />
                    </div>
                    {role === 'admin' && <button onClick={() => setShowForm(true)} className="mx-button-primary bg-brand-secondary"><Plus size={18} /> Novo Ativo</button>}
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 z-50 rounded-mx-3xl p-1 bg-gradient-to-b from-mx-amber-50 to-white shadow-mx-xl mb-mx-md">
                        <form onSubmit={handleCreate} className="bg-white rounded-[2.8rem] p-mx-lg md:p-mx-xl space-y-mx-lg relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-14 h-14 rounded-mx-lg bg-status-warning text-white flex items-center justify-center shadow-mx-lg"><Layers size={24} /></div>
                                    <div><h3 className="text-2xl font-black text-text-primary tracking-tighter leading-none mb-1">Implantar Ativo</h3><p className="mx-text-caption">Vitrine Digital MX</p></div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-mx-md bg-mx-slate-50 flex items-center justify-center text-text-tertiary hover:text-status-error transition-all"><X size={20} /></button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <div className="space-y-2"><label className="mx-text-caption ml-2">Título Comercial</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Academy Pro" required className="mx-input" /></div>
                                <div className="space-y-2"><label className="mx-text-caption ml-2">Gateway URL</label><input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." required className="mx-input" /></div>
                            </div>
                            <div className="space-y-2"><label className="mx-text-caption ml-2">Briefing</label><textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Benefícios estratégicos..." rows={3} className="mx-input !rounded-mx-xl resize-none py-4" /></div>
                            <div className="pt-mx-md flex justify-end border-t border-border-subtle"><button type="submit" disabled={saving} className="mx-button-primary bg-brand-primary">Ativar Ativo</button></div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-mx-3xl">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                        {filteredProducts.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="mx-card flex flex-col h-full group hover:shadow-mx-xl hover:-translate-y-1 relative overflow-hidden">
                                <div className="p-mx-lg border-b border-border-subtle bg-mx-slate-50/30 flex items-start justify-between">
                                    <div className="w-14 h-14 rounded-mx-lg bg-white border border-border-default flex items-center justify-center shadow-mx-sm group-hover:bg-brand-secondary group-hover:text-white transition-all transform group-hover:rotate-3"><Package size={24} className="text-status-warning group-hover:text-white transition-colors" /></div>
                                    <Badge className="bg-status-success-surface text-status-success border-none text-[8px] px-3 h-6 rounded-md">ATIVO</Badge>
                                </div>
                                <div className="p-mx-lg flex flex-col justify-between flex-1">
                                    <div className="mb-mx-lg"><h3 className="text-xl font-black text-text-primary tracking-tight leading-tight group-hover:text-status-warning transition-colors line-clamp-2 uppercase">{p.name}</h3><p className="text-sm font-bold text-text-secondary line-clamp-3 leading-relaxed opacity-80 mt-2">"{p.description || 'Solução estratégica sem ementa.'}"</p></div>
                                    <div className="pt-mx-md border-t border-border-subtle flex flex-col gap-mx-md">
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-mx-sm bg-mx-slate-50 flex items-center justify-center text-text-tertiary"><Smartphone size={14} /></div><div className="w-8 h-8 rounded-mx-sm bg-mx-slate-50 flex items-center justify-center text-text-tertiary"><Laptop size={14} /></div><span className="mx-text-caption !text-[8px] ml-auto">V2.4</span></div>
                                        <button onClick={() => window.open(p.link, '_blank')} className="mx-button-primary !bg-mx-slate-50 !text-text-primary border border-border-default hover:!bg-brand-secondary hover:!text-white flex items-center gap-2 group/btn">Acessar <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-mx-slate-50/20 border-2 border-dashed border-border-default rounded-[3rem]">
                        <div className="w-24 h-24 rounded-mx-3xl bg-white shadow-mx-lg flex items-center justify-center mb-mx-lg"><Package size={48} className="text-mx-slate-200" /></div>
                        <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase mb-2">Prateleira Vazia</h3>
                        <p className="mx-text-caption text-text-tertiary max-w-xs leading-relaxed uppercase">Nenhum ativo digital implantado no catálogo do cluster.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
