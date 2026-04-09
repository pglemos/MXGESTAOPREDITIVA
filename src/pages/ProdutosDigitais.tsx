import { supabase } from '@/lib/supabase'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import type { DigitalProduct } from '@/types/database'
import { Package, Plus, X, RefreshCw, Smartphone, Laptop, Layers, ExternalLink, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
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
        setLoading(true)
        try {
            const { data } = await supabase.from('digital_products').select('*').order('created_at', { ascending: false })
            if (data) setProducts(data)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (role !== 'admin') { toast.error('Permissão negada.'); return }
        const result = productSchema.safeParse(form)
        if (!result.success) { toast.error("Verifique os campos"); return }

        setSaving(true)
        const { error } = await supabase.from('digital_products').insert(form)
        setSaving(false)
        if (error) { toast.error(error.message); return }
        toast.success('Ativo digital ativado!')
        setShowForm(false); setForm({ name: '', description: '', link: '' }); fetchProducts()
    }

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [products, searchTerm])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Vitrine...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Vitrine <span className="text-brand-primary">Digital</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Catálogo de Soluções Operacionais • {products.length} Ativos</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={() => { setIsRefetching(true); fetchProducts().then(() => setIsRefetching(false)) }} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <div className="relative w-full sm:w-64 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                        <input 
                            type="text" placeholder="BUSCAR..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-surface-alt border border-border-default rounded-full h-12 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all shadow-inner" 
                        />
                    </div>
                    {role === 'admin' && (
                        <Button onClick={() => setShowForm(true)} className="h-12 px-8 shadow-mx-lg">
                            <Plus size={18} aria-hidden="true" /> NOVO ATIVO
                        </Button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 z-50 rounded-mx-3xl p-1 bg-gradient-to-b from-brand-primary/10 to-white shadow-mx-xl mb-mx-lg">
                        <form onSubmit={handleCreate} className="bg-white rounded-[2.8rem] p-mx-lg space-y-mx-lg relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border-default pb-mx-md">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-14 h-14 rounded-mx-lg bg-brand-primary text-white flex items-center justify-center shadow-lg" aria-hidden="true"><Layers size={24} /></div>
                                    <div>
                                        <Typography variant="h2">Implantar Ativo</Typography>
                                        <Typography variant="caption">Vitrine Digital MX</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-full w-12 h-12"><X size={20} aria-hidden="true" /></Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <FormField id="prod-name" label="Título Comercial" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                                <FormField id="prod-link" label="Gateway URL" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} required />
                            </div>
                            <div className="space-y-3">
                                <Typography variant="caption" tone="muted" className="ml-2">Briefing</Typography>
                                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full bg-surface-alt border border-border-default rounded-mx-xl p-5 text-sm font-bold text-slate-950 outline-none focus:border-brand-primary focus:bg-white transition-all resize-none shadow-inner" />
                            </div>
                            <div className="pt-mx-md flex justify-end">
                                <Button type="submit" disabled={saving} className="px-10 h-12 rounded-full shadow-mx-xl">
                                    {saving ? <RefreshCw className="animate-spin" /> : 'ATIVAR ATIVO'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((p, i) => (
                            <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                                <Card className="p-8 flex flex-col h-full group hover:shadow-mx-xl transition-all">
                                    <div className="flex items-start justify-between mb-8 pb-6 border-b border-border-default">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner group-hover:bg-brand-secondary transition-all transform group-hover:rotate-3" aria-hidden="true">
                                            <Package size={24} className="text-brand-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <Badge variant="success">ATIVO</Badge>
                                    </div>
                                    <div className="mb-8 flex-1">
                                        <Typography variant="h3" className="mb-3 group-hover:text-brand-primary transition-colors line-clamp-2">{(p.name || '').toUpperCase()}</Typography>
                                        <Typography variant="p" tone="muted" className="text-xs line-clamp-3 italic opacity-80">"{p.description}"</Typography>
                                    </div>
                                    <div className="pt-6 border-t border-border-default flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-surface-alt flex items-center justify-center text-text-tertiary" aria-hidden="true"><Smartphone size={14} /></div>
                                            <div className="w-8 h-8 rounded-xl bg-surface-alt flex items-center justify-center text-text-tertiary" aria-hidden="true"><Laptop size={14} /></div>
                                            <Typography variant="caption" tone="muted" className="ml-auto">Versão 2.4</Typography>
                                        </div>
                                        <Button variant="outline" className="w-full h-12 rounded-xl group/btn" onClick={() => window.open(p.link, '_blank')}>
                                            ACESSAR SOLUÇÃO <ExternalLink size={14} className="ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </div>
        </main>
    )
}
