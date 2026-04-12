import { supabase } from '@/lib/supabase'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import type { DigitalProduct } from '@/types/database'
import { Package, Plus, X, RefreshCw, Smartphone, Laptop, Layers, ExternalLink, Search, Globe, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Vitrine...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Showcase Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Vitrine <span className="text-brand-primary">Digital</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">CATÁLOGO DE SOLUÇÕES OPERACIONAIS • {products.length} ATIVOS</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={() => { setIsRefetching(true); fetchProducts().then(() => setIsRefetching(false)) }} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <Input 
                            placeholder="BUSCAR ATIVO..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest" 
                        />
                    </div>
                    {role === 'admin' && (
                        <Button onClick={() => setShowForm(true)} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary">
                            <Plus size={18} className="mr-2" /> NOVO ATIVO
                        </Button>
                    )}
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="shrink-0 mb-10">
                        <form onSubmit={handleCreate}>
                            <Card className="p-mx-10 md:p-14 border-none shadow-mx-xl bg-white overflow-hidden relative">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-mx-xl -mr-48 -mt-48" />
                                
                                <header className="flex items-center justify-between border-b border-border-default pb-8 mb-10 relative z-10">
                                    <div className="flex items-center gap-mx-md">
                                        <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform rotate-2"><Layers size={24} /></div>
                                        <div>
                                            <Typography variant="h3">Implantar Ativo</Typography>
                                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">VITRINE DIGITAL MX</Typography>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-white shadow-sm transition-all"><X size={24} /></Button>
                                </header>

                                <div className="grid lg:grid-cols-2 gap-mx-14 relative z-10">
                                    <div className="space-y-mx-lg">
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Título Comercial</Typography>
                                            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Plataforma de Blindagem" required className="!h-14 px-6 font-bold" />
                                        </div>
                                        <div className="space-y-mx-sm">
                                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Gateway URL</Typography>
                                            <Input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://gateway.mx/..." required className="!h-14 px-6 font-medium" />
                                        </div>
                                    </div>

                                    <div className="space-y-mx-sm">
                                        <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Briefing de Solução</Typography>
                                        <textarea 
                                            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                            className="w-full bg-surface-alt border border-border-default rounded-mx-xl p-4 md:p-mx-lg text-sm font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all resize-none shadow-inner h-mx-xl"
                                            placeholder="Descreva detalhadamente os diferenciais táticos desta solução..."
                                        />
                                    </div>
                                </div>

                                <footer className="pt-10 flex justify-end gap-mx-sm border-t border-border-default mt-10 relative z-10">
                                    <Button type="submit" disabled={saving} className="h-mx-2xl px-14 rounded-mx-full shadow-mx-xl font-black uppercase tracking-mx-wide text-mx-tiny">
                                        {saving ? <RefreshCw className="animate-spin mr-3" /> : <ShieldCheck size={20} className="mr-3" />} ATIVAR SOLUÇÃO
                                    </Button>
                                </footer>
                            </Card>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((p, i) => (
                            <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                                <Card className="p-4 md:p-mx-lg h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div>
                                        <header className="flex items-start justify-between mb-10 border-b border-border-default pb-6 relative z-10">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center shadow-inner group-hover:bg-brand-secondary transition-all transform group-hover:rotate-3" aria-hidden="true">
                                                <Package size={24} className="text-brand-primary group-hover:text-white transition-colors" />
                                            </div>
                                            <Badge variant="success" className="px-4 py-1 rounded-mx-full uppercase text-mx-micro font-black shadow-sm">ATIVO</Badge>
                                        </header>

                                        <div className="mb-8 flex-1 relative z-10 space-y-mx-xs">
                                            <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2">{(p.name || '').toUpperCase()}</Typography>
                                            <Typography variant="p" tone="muted" className="text-xs font-bold leading-relaxed line-clamp-3 italic">"{p.description}"</Typography>
                                        </div>
                                    </div>

                                    <footer className="pt-6 border-t border-border-default flex flex-col gap-mx-sm relative z-10 mt-auto">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-mx-xs">
                                                <div className="w-mx-lg h-mx-lg rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-tertiary shadow-inner" aria-hidden="true"><Smartphone size={14} /></div>
                                                <div className="w-mx-lg h-mx-lg rounded-mx-lg bg-surface-alt flex items-center justify-center text-text-tertiary shadow-inner" aria-hidden="true"><Globe size={14} /></div>
                                            </div>
                                            <Typography variant="caption" tone="muted" className="text-mx-micro font-black uppercase opacity-40">Gateway v2.4</Typography>
                                        </div>
                                        <Button variant="outline" className="w-full h-mx-xl rounded-mx-xl group/btn font-black uppercase tracking-widest text-mx-micro shadow-sm border-border-strong hover:border-brand-primary" onClick={() => window.open(p.link, '_blank')}>
                                            ACESSAR SOLUÇÃO <ExternalLink size={14} className="ml-2 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </Button>
                                    </footer>
                                </Card>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            </div>
        </main>
    )
}
