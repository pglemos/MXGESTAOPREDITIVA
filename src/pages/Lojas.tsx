import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Store, Plus, X, Save, Mail, Building2, ChevronRight, Search, RefreshCw, Activity, Database, Globe, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

const storeSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido').or(z.literal(''))
})

export default function Lojas() {
    const { role, setActiveStoreId } = useAuth()
    const { stores, loading, createStore } = useStores()
    const canManageStores = role === 'admin'
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [formErrors, setFormErrors] = useState<{name?: string, email?: string}>({})

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canManageStores) {
            toast.error('Apenas admin pode criar lojas.')
            return
        }
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
        
        toast.success('Loja operacional ativada na rede!')
        setShowForm(false)
        setName(''); setEmail('')
    }

    const filteredStores = useMemo(() => {
        return (stores || []).filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.manager_email && s.manager_email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }, [stores, searchTerm])

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-brand-primary" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header / Toolbar - Elite Aligned */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">{canManageStores ? 'GESTOR DE REDE' : 'VISÃO EXECUTIVA'}</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">{canManageStores ? 'Gestão de Unidades' : 'Minhas Lojas'}</h1>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                        <p className="mx-text-caption !text-[10px] opacity-60 uppercase">{stores.length} Lojas Ativas na Rede</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative w-full sm:w-72 group">
                        <Search size={18} className="absolute left-mx-md top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <input 
                            type="text" placeholder="BUSCAR LOJA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mx-input !h-14 !pl-14 !text-[10px] !font-black !tracking-widest uppercase"
                        />
                    </div>
                    {canManageStores && (
                        <button onClick={() => setShowForm(true)} className="mx-button-primary bg-brand-secondary w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 shadow-mx-lg hover:shadow-mx-xl transition-all">
                            <Plus size={20} /> NOVA LOJA
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && canManageStores && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 z-50 rounded-[2.5rem] p-1 bg-gradient-to-b from-mx-indigo-50 to-white shadow-mx-xl mb-mx-lg">
                        <form onSubmit={handleCreate} className="bg-white rounded-[2.4rem] p-mx-xl space-y-mx-lg relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-border-subtle pb-mx-lg">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-14 h-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Database size={24} /></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-text-primary tracking-tighter leading-none mb-1 uppercase">Implantar Unidade</h3>
                                        <p className="mx-text-caption">Configuração de Ponto Operacional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 flex items-center justify-center text-text-tertiary hover:text-status-error transition-all"><X size={20} /></button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <div className="space-y-2">
                                    <label className="mx-text-caption ml-2 !text-[9px]">Nome da Unidade</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder="EX: MX CAMPINAS" required className={cn("mx-input h-14", formErrors.name && "border-status-error")} />
                                </div>
                                <div className="space-y-2">
                                    <label className="mx-text-caption ml-2 !text-[9px]">E-mail do Gestor</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="GESTOR@UNIDADE.MX" className={cn("mx-input h-14", formErrors.email && "border-status-error")} />
                                </div>
                            </div>

                            <div className="pt-mx-lg flex justify-end gap-mx-sm border-t border-border-subtle">
                                <button type="submit" disabled={saving} className="mx-button-primary bg-brand-primary hover:bg-brand-primary-hover h-14 px-12">
                                    {saving ? <RefreshCw className="animate-spin" /> : 'CONFIRMAR IMPLANTAÇÃO'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-mx-xl">
                {filteredStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        {filteredStores.map((s, i) => (
                            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-xl flex flex-col justify-between group hover:shadow-mx-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                                <div className="flex items-start justify-between mb-mx-xl">
                                    <div className="w-20 h-20 rounded-[2rem] bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-3xl text-text-primary group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-sm">
                                        {s.name.charAt(0)}
                                    </div>
                                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-none shadow-sm", s.active ? 'bg-status-success-surface text-status-success' : 'bg-status-error-surface text-status-error')}>
                                        {s.active ? 'OPERACIONAL' : 'INATIVO'}
                                    </Badge>
                                </div>

                                <div className="flex-1 mb-mx-xl">
                                    <p className="mx-text-caption !text-[9px] mb-2 opacity-40 uppercase tracking-[0.2em]">IDENTIFICADOR DA UNIDADE</p>
                                    <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">{s.name}</h3>
                                    <div className="flex items-center gap-3 p-4 rounded-mx-xl bg-mx-slate-50 border border-border-subtle mt-mx-lg group-hover:bg-white group-hover:border-mx-indigo-100 transition-colors">
                                        <div className="w-10 h-10 rounded-mx-lg bg-white flex items-center justify-center text-brand-primary shadow-sm"><Mail size={18} /></div>
                                        <span className="text-xs font-black text-text-primary truncate uppercase tracking-tight">{s.manager_email || 'S/ GESTOR DESIGNADO'}</span>
                                    </div>
                                </div>

                                <div className="pt-mx-lg border-t border-border-default flex items-center justify-between">
                                    <div className="flex items-center gap-2 mx-text-caption !text-[9px] font-black text-brand-primary">
                                        <Activity size={14} strokeWidth={3} className="animate-pulse" /> MONITORAMENTO LIVE
                                    </div>
                                    <Link to={`/loja?id=${s.id}`} onClick={() => setActiveStoreId(s.id)} className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 border border-border-default text-text-tertiary hover:text-white hover:bg-brand-secondary transition-all flex items-center justify-center shadow-sm">
                                        <ChevronRight size={22} strokeWidth={2.5} />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-mx-slate-50/20 border-2 border-dashed border-border-default rounded-[3rem]">
                        <div className="w-24 h-24 rounded-mx-3xl bg-white shadow-mx-lg flex items-center justify-center mb-mx-lg"><Building2 size={48} className="text-mx-slate-200" /></div>
                        <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase mb-2">Nenhuma Loja</h3>
                        <p className="mx-text-caption text-text-tertiary max-w-xs leading-relaxed uppercase">Nenhuma unidade operacional localizada na rede atual.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
