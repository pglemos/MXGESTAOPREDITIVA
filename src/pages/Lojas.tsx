import { useStores } from '@/hooks/useTeam'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Store, Plus, X, Save, Edit2, Mail, MapPin, Building2, ChevronRight, Globe, Zap, ArrowRight, Activity, ShieldCheck, Database, Search, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const storeSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido').or(z.literal(''))
})

export default function Lojas() {
    const { stores, loading, createStore } = useStores()
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [formErrors, setFormErrors] = useState<{name?: string, email?: string}>({})

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormErrors({})
        
        const result = storeSchema.safeParse({ name, email })
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors
            setFormErrors({ name: errors.name?.[0], email: errors.email?.[0] })
            return
        }

        setSaving(true)
        const { error } = await createStore(name, email)
        setSaving(false)
        
        if (error) { toast.error(`Falha na implantação: ${error}`); return }
        
        toast.success('Node operacional ativado no cluster!')
        setShowForm(false)
        setName(''); setEmail('')
    }

    const filteredStores = useMemo(() => {
        return stores.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.manager_email && s.manager_email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }, [stores, searchTerm])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse">Escaneando topologia...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header / Toolbar - Tokenized */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg relative z-10 w-full shrink-0 border-b border-border-default pb-mx-lg">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Gestão de Unidades</h1>
                    </div>
                    <div className="flex items-center gap-2 pl-mx-md mt-2">
                        <div className="w-2 h-2 rounded-full bg-status-success shadow-lg animate-pulse" />
                        <p className="mx-text-caption opacity-60">Rede de Cluster • {stores.length} Nodes Ativos</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative w-full sm:w-64 group">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <input 
                            type="text" placeholder="Buscar Unidade..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mx-input !h-12 !pl-11"
                        />
                    </div>
                    <button onClick={() => setShowForm(true)} className="mx-button-primary w-full sm:w-auto flex items-center justify-center gap-3">
                        <Plus size={18} /> Novo Node
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 z-50 rounded-mx-3xl p-1 bg-gradient-to-b from-mx-indigo-50 to-white shadow-mx-xl mb-mx-md">
                        <form onSubmit={handleCreate} className="bg-white rounded-[2.8rem] p-mx-lg md:p-mx-xl space-y-mx-lg relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border-subtle pb-mx-md">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-14 h-14 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-text-primary tracking-tighter leading-none mb-1">Implantar Node</h3>
                                        <p className="mx-text-caption">Topologia Operacional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-mx-md bg-mx-slate-50 flex items-center justify-center text-text-tertiary hover:text-status-error transition-all"><X size={20} /></button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <div className="space-y-2">
                                    <label className="mx-text-caption ml-2">Nome da Unidade</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: MX Campinas" required className={cn("mx-input", formErrors.name && "border-status-error")} />
                                </div>
                                <div className="space-y-2">
                                    <label className="mx-text-caption ml-2">Admin Email</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="admin@unidade.mx" className={cn("mx-input", formErrors.email && "border-status-error")} />
                                </div>
                            </div>

                            <div className="pt-mx-md flex justify-end gap-mx-sm border-t border-border-subtle">
                                <button type="submit" disabled={saving} className="mx-button-primary bg-brand-primary hover:bg-brand-primary-hover">
                                    {saving ? <RefreshCw className="animate-spin" /> : 'Confirmar Implantação'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-mx-md pb-mx-3xl md:grid-cols-2 lg:grid-cols-3">
                {filteredStores.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-lg flex flex-col justify-between group h-full relative overflow-hidden hover:shadow-mx-xl hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-mx-lg">
                            <div className="w-16 h-16 rounded-mx-lg bg-mx-slate-50 border border-border-default flex items-center justify-center group-hover:bg-brand-secondary group-hover:text-white transition-all text-text-primary font-black text-2xl">
                                {s.name.charAt(0)}
                            </div>
                            <span className={cn("flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest px-mx-sm py-1.5 rounded-full border", s.active ? 'bg-status-success-surface text-status-success border-mx-emerald-100' : 'bg-status-error-surface text-status-error border-mx-rose-100')}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", s.active ? "bg-status-success animate-pulse" : "bg-status-error")} />
                                {s.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>

                        <div className="flex-1 mb-mx-lg">
                            <p className="mx-text-caption mb-1 opacity-60">Node ID</p>
                            <h3 className="text-2xl font-black text-text-primary tracking-tighter leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">{s.name}</h3>
                            <div className="flex items-center gap-mx-sm p-mx-sm rounded-mx-md bg-mx-slate-50 border border-border-subtle mt-mx-md group-hover:bg-white group-hover:border-mx-indigo-100 transition-colors">
                                <Mail size={14} className="text-text-tertiary" />
                                <span className="text-xs font-bold text-text-primary truncate">{s.manager_email || 'S/ Admin'}</span>
                            </div>
                        </div>

                        <div className="pt-mx-md border-t border-border-default flex items-center justify-between">
                            <div className="flex items-center gap-2 mx-text-caption">
                                <Activity size={12} className="text-brand-primary" /> Tracking On
                            </div>
                            <Link to={`/loja?id=${s.id}`} className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default text-text-tertiary hover:text-white hover:bg-brand-secondary transition-all flex items-center justify-center">
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
