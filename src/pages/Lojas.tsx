import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useStorePerformance } from '@/hooks/useRanking'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { 
    Store, Plus, X, Save, Mail, Building2, ChevronRight, 
    Search, RefreshCw, Activity, Database, Globe, Zap,
    Target, TrendingUp, AlertCircle, CheckCircle2, LayoutGrid, List
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const storeSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('E-mail inválido').or(z.literal(''))
})

export default function Lojas() {
    const { profile, role, setActiveStoreId } = useAuth()
    const { stores, loading: storesLoading, createStore } = useStores()
    const { performance, loading: perfLoading, refetch: refetchPerf } = useStorePerformance()
    const canManageStores = role === 'admin'
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [formErrors, setFormErrors] = useState<{name?: string, email?: string}>({})

    const loading = storesLoading || perfLoading

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
        refetchPerf()
    }

    const filteredPerformance = useMemo(() => {
        return (performance || []).filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => b.realizado - a.realizado)
    }, [performance, searchTerm])

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header / Toolbar - Elite Aligned */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">{canManageStores ? 'GEOFENCING COMANDO CENTRAL' : 'VISÃO EXECUTIVA'}</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">{canManageStores ? 'Gestão de Unidades' : 'Minhas Lojas'}</h1>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                        <div className="mx-text-caption !text-[10px] opacity-60 uppercase">{loading ? <Skeleton className="h-3 w-20" /> : `${performance.length} Lojas Ativas na Rede`}</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="flex bg-mx-slate-50 p-1 rounded-xl border border-border-default mr-2">
                        <button onClick={() => setViewMode('table')} className={cn("p-2 rounded-lg transition-all", viewMode === 'table' ? "bg-white text-brand-primary shadow-sm" : "text-text-tertiary")}>
                            <List size={20} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-brand-primary shadow-sm" : "text-text-tertiary")}>
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                    <div className="relative w-full sm:w-72 group">
                        <Search size={18} className="absolute left-mx-md top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <input 
                            type="text" placeholder="BUSCAR UNIDADE..." value={searchTerm}
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
                        {/* ... form content ... */}
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
                {loading ? (
                    <div className="grid gap-mx-md">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />)}
                    </div>
                ) : filteredPerformance.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                            {filteredPerformance.map((p, i) => (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-xl flex flex-col group hover:shadow-mx-xl transition-all relative overflow-hidden">
                                     <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 opacity-20", 
                                        p.status === 'green' ? 'bg-status-success' : p.status === 'yellow' ? 'bg-status-warning' : 'bg-status-error'
                                    )} />
                                    
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-2xl group-hover:bg-slate-950 group-hover:text-white transition-all">
                                            {p.name.charAt(0)}
                                        </div>
                                        <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none", 
                                            p.status === 'green' ? 'bg-status-success text-white' : p.status === 'yellow' ? 'bg-status-warning text-white' : 'bg-status-error text-white'
                                        )}>
                                            {p.status === 'green' ? 'NO RITMO' : p.status === 'yellow' ? 'ALERTA' : 'CRÍTICO'}
                                        </Badge>
                                    </div>

                                    <h3 className="text-2xl font-black text-text-primary tracking-tighter uppercase mb-6 truncate">{p.name}</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-4 rounded-mx-xl bg-mx-slate-50">
                                            <p className="text-[8px] font-black tracking-widest text-text-tertiary uppercase mb-1">Vendido</p>
                                            <p className="text-xl font-black text-text-primary">{p.realizado}</p>
                                        </div>
                                        <div className="p-4 rounded-mx-xl bg-mx-slate-50">
                                            <p className="text-[8px] font-black tracking-widest text-text-tertiary uppercase mb-1">Meta</p>
                                            <p className="text-xl font-black text-brand-primary">{p.meta}</p>
                                        </div>
                                    </div>

                                    <div className="pt-mx-lg border-t border-border-default flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-text-tertiary uppercase">Projeção</span>
                                            <span className="text-sm font-black text-text-primary">{p.projecao} Und.</span>
                                        </div>
                                        <Link to={`/loja?id=${p.id}`} onClick={() => setActiveStoreId(p.id)} className="w-10 h-10 rounded-mx-lg bg-slate-950 text-white flex items-center justify-center hover:scale-110 transition-all">
                                            <ChevronRight size={20} />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-border-default rounded-[2.5rem] overflow-hidden shadow-mx-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-mx-slate-50/50">
                                        <th className="px-8 py-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest">Unidade Operacional</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest">Semáforo</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest">Realizado / Meta</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest">Falta (GAP)</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest">Projeção Final</th>
                                        <th className="px-8 py-6 text-[9px] font-black text-text-tertiary uppercase tracking-widest text-center">Disciplina</th>
                                        <th className="px-8 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredPerformance.map((p, i) => (
                                            <motion.tr 
                                                key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                className="border-t border-border-subtle hover:bg-mx-slate-50/30 transition-colors group"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-mx-lg bg-mx-slate-100 flex items-center justify-center font-black text-text-primary group-hover:bg-slate-950 group-hover:text-white transition-all">{p.name.charAt(0)}</div>
                                                        <span className="text-sm font-black text-text-primary uppercase tracking-tight">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-3 h-3 rounded-full animate-pulse shadow-sm", 
                                                            p.status === 'green' ? 'bg-status-success shadow-status-success/20' : 
                                                            p.status === 'yellow' ? 'bg-status-warning shadow-status-warning/20' : 
                                                            'bg-status-error shadow-status-error/20'
                                                        )} />
                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest",
                                                            p.status === 'green' ? 'text-status-success' : 
                                                            p.status === 'yellow' ? 'text-status-warning' : 
                                                            'text-status-error'
                                                        )}>
                                                            {p.efficiency}% Ritmo
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-black text-text-primary">{p.realizado}</span>
                                                        <span className="text-[10px] font-bold text-text-tertiary uppercase">de {p.meta}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[10px] px-3 py-1">-{p.gap} UND</Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                         <span className="text-sm font-black text-text-primary uppercase tracking-tight">{p.projecao}</span>
                                                         <span className="text-[8px] font-bold text-brand-primary uppercase tracking-widest">Est. Fechamento</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1">
                                                            {p.disciplina.ok ? <CheckCircle2 size={14} className="text-status-success" /> : <AlertCircle size={14} className="text-status-error" />}
                                                            <span className={cn("text-[10px] font-black", p.disciplina.ok ? "text-status-success" : "text-status-error")}>{p.disciplina.done}/{p.disciplina.total}</span>
                                                        </div>
                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                            <div className={cn("h-full transition-all", p.disciplina.ok ? "bg-status-success" : "bg-status-error")} style={{ width: `${(p.disciplina.done / Math.max(p.disciplina.total, 1)) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Link to={`/loja?id=${p.id}`} onClick={() => setActiveStoreId(p.id)} className="inline-flex items-center justify-center w-10 h-10 rounded-mx-lg bg-mx-slate-50 border border-border-default text-text-tertiary hover:bg-slate-950 hover:text-white transition-all">
                                                        <ChevronRight size={18} />
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-mx-slate-50/20 border-2 border-dashed border-border-default rounded-[3rem]">
                        <div className="w-24 h-24 rounded-mx-3xl bg-white shadow-mx-lg flex items-center justify-center mb-mx-lg"><Building2 size={48} className="text-mx-slate-200" /></div>
                        <h3 className="text-3xl font-black text-text-primary tracking-tighter uppercase mb-2">Aquecendo Unidades</h3>
                        <p className="mx-text-caption text-text-tertiary max-w-xs leading-relaxed uppercase">Aguardando consolidação de dados para liberar a visão operacional.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
