import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useStorePerformance } from '@/hooks/useRanking'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { 
    Store, Plus, X, Save, Mail, Building2, ChevronRight, 
    Search, RefreshCw, Activity, Database, Globe, Zap,
    Target, TrendingUp, AlertCircle, CheckCircle2, LayoutGrid, List,
    ArrowLeft, MoreVertical, Share2, Copy, MessageCircle
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
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header / Toolbar - Elite Aligned */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-brand-primary mb-2 block font-black tracking-[0.3em] uppercase">{canManageStores ? 'GEOFENCING COMANDO CENTRAL' : 'VISÃO EXECUTIVA'}</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">{canManageStores ? 'Gestão de Unidades' : 'Minhas Lojas'}</h1>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" aria-hidden="true" />
                        <div className="text-gray-600 text-[10px] font-black uppercase tracking-widest">{loading ? <Skeleton className="h-3 w-20" /> : `${performance.length} Lojas Ativas na Rede`}</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="flex bg-mx-slate-50 p-1 rounded-xl border border-border-default mr-2" role="group" aria-label="Modo de visualização">
                        <button 
                            onClick={() => setViewMode('table')} 
                            aria-label="Visualizar em lista"
                            aria-pressed={viewMode === 'table'}
                            className={cn("p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-brand-primary outline-none", viewMode === 'table' ? "bg-white text-brand-primary shadow-sm" : "text-gray-500 hover:text-text-primary")}
                        >
                            <List size={20} aria-hidden="true" />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            aria-label="Visualizar em grade"
                            aria-pressed={viewMode === 'grid'}
                            className={cn("p-2 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-brand-primary outline-none", viewMode === 'grid' ? "bg-white text-brand-primary shadow-sm" : "text-gray-500 hover:text-text-primary")}
                        >
                            <LayoutGrid size={20} aria-hidden="true" />
                        </button>
                    </div>
                    <div className="relative w-full sm:w-72 group">
                        <Search size={18} className="absolute left-mx-md top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="search-store" className="sr-only">Buscar unidade por nome</label>
                        <input 
                            id="search-store"
                            name="search-store"
                            type="text" 
                            placeholder="BUSCAR UNIDADE..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mx-input !h-14 !pl-14 !text-[10px] !font-black !tracking-widest uppercase focus:ring-4 focus:ring-brand-primary/5 outline-none"
                        />
                    </div>
                    {canManageStores && (
                        <button onClick={() => setShowForm(true)} className="mx-button-primary bg-brand-secondary w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-3 shadow-mx-lg hover:shadow-mx-xl transition-all focus-visible:ring-4 focus-visible:ring-brand-primary/20 outline-none">
                            <Plus size={20} aria-hidden="true" /> NOVA LOJA
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && canManageStores && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="shrink-0 z-50 rounded-[2.5rem] p-1 bg-gradient-to-b from-indigo-50 to-white shadow-mx-xl mb-mx-lg">
                        <form onSubmit={handleCreate} className="bg-white rounded-[2.4rem] p-mx-xl space-y-mx-lg relative overflow-hidden" aria-labelledby="form-create-store-title">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-mx-lg">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-14 h-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg" aria-hidden="true"><Database size={24} /></div>
                                    <div>
                                        <h2 id="form-create-store-title" className="text-2xl font-black text-text-primary tracking-tighter leading-none mb-1 uppercase">Implantar Unidade</h2>
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Configuração de Ponto Operacional</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setShowForm(false)} aria-label="Fechar formulário" className="w-12 h-12 rounded-mx-lg bg-mx-slate-50 flex items-center justify-center text-text-tertiary hover:text-status-error transition-all focus-visible:ring-4 focus-visible:ring-rose-500/10 outline-none"><X size={20} aria-hidden="true" /></button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <div className="space-y-2">
                                    <label htmlFor="new-store-name" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nome da Unidade</label>
                                    <input id="new-store-name" name="name" value={name} onChange={e => setName(e.target.value)} placeholder="EX: MX CAMPINAS" required className={cn("mx-input h-14", formErrors.name && "border-status-error")} />
                                    {formErrors.name && <p className="text-rose-600 text-[10px] font-black uppercase ml-2" role="alert">{formErrors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="new-store-email" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">E-mail do Gestor</label>
                                    <input id="new-store-email" name="email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="GESTOR@UNIDADE.MX" className={cn("mx-input h-14", formErrors.email && "border-status-error")} />
                                    {formErrors.email && <p className="text-rose-600 text-[10px] font-black uppercase ml-2" role="alert">{formErrors.email}</p>}
                                </div>
                            </div>

                            <div className="pt-mx-lg flex justify-end gap-mx-sm border-t border-gray-100">
                                <button type="submit" disabled={saving} className="mx-button-primary bg-brand-primary hover:bg-brand-primary-hover h-14 px-12 focus-visible:ring-4 focus-visible:ring-brand-primary/20 outline-none">
                                    {saving ? <RefreshCw className="animate-spin" aria-hidden="true" /> : 'CONFIRMAR IMPLANTAÇÃO'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-0 pb-mx-xl" aria-live="polite">
                {loading ? (
                    <div className="grid gap-mx-md" role="status" aria-label="Carregando lojas">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />)}
                    </div>
                ) : filteredPerformance.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                            {filteredPerformance.map((p, i) => (
                                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-xl flex flex-col group hover:shadow-mx-xl transition-all relative overflow-hidden bg-white border border-gray-100 rounded-3xl">
                                     <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 opacity-20", 
                                        p.status === 'green' ? 'bg-status-success' : p.status === 'yellow' ? 'bg-status-warning' : 'bg-status-error'
                                    )} aria-hidden="true" />
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-2xl group-hover:bg-slate-950 group-hover:text-white transition-all shadow-inner" aria-hidden="true">
                                            {p.name.charAt(0)}
                                        </div>
                                        <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-none shadow-sm", 
                                            p.status === 'green' ? 'bg-emerald-500 text-white' : p.status === 'yellow' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'
                                        )}>
                                            {p.status === 'green' ? 'NO RITMO' : p.status === 'yellow' ? 'ALERTA' : 'CRÍTICO'}
                                        </Badge>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase mb-6 truncate relative z-10">{p.name}</h3>

                                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Vendido</p>
                                            <p className="text-2xl font-black text-slate-900 font-mono-numbers leading-none">{p.realizado}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner">
                                            <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mb-1">Meta</p>
                                            <p className="text-2xl font-black text-indigo-600 font-mono-numbers leading-none">{p.meta}</p>
                                        </div>
                                    </div>

                                    <div className="pt-mx-lg border-t border-gray-100 flex items-center justify-between relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Projeção Final</span>
                                            <span className="text-sm font-black text-slate-900">{p.projecao} Unidades</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const url = `${window.location.origin}/dashboard/${p.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success('Link da unidade copiado!');
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-all border border-gray-100 shadow-sm focus-visible:ring-4 focus-visible:ring-brand-primary/10 outline-none"
                                                    aria-label={`Copiar link da unidade ${p.name}`}
                                                >
                                                    <Share2 size={16} aria-hidden="true" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const url = `${window.location.origin}/dashboard/${p.id}`;
                                                        const text = `Acesse o Painel MX da unidade ${p.name}: ${url}`;
                                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-gray-100 shadow-sm focus-visible:ring-4 focus-visible:ring-emerald-500/10 outline-none"
                                                    aria-label={`Compartilhar unidade ${p.name} no WhatsApp`}
                                                >
                                                    <MessageCircle size={16} aria-hidden="true" />
                                                </button>
                                            </div>
                                            <Link 
                                                to={`/loja?id=${p.id}`} 
                                                onClick={() => setActiveStoreId(p.id)} 
                                                aria-label={`Ver dashboard da loja ${p.name}`}
                                                className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center hover:bg-black hover:scale-110 transition-all shadow-mx-md focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"
                                            >
                                                <ChevronRight size={24} aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-mx-sm">
                            <table className="w-full text-left border-collapse">
                                <caption className="sr-only">Listagem consolidada do desempenho de todas as unidades da rede</caption>
                                <thead>
                                    <tr className="bg-slate-50 border-b border-gray-100">
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Unidade Operacional</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Status Ritmo</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Realizado / Meta</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">GAP Residual</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Projeção</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Disciplina</th>
                                        <th scope="col" className="px-8 py-6 text-right" aria-label="Ações"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredPerformance.map((p, i) => (
                                            <motion.tr 
                                                key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                className="border-t border-gray-50 hover:bg-slate-50/50 transition-colors group h-24"
                                            >
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center font-black text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all shadow-inner" aria-hidden="true">{p.name.charAt(0)}</div>
                                                        <span className="text-base font-black text-slate-950 uppercase tracking-tight">{p.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className={cn("w-3 h-3 rounded-full animate-pulse shadow-sm", 
                                                            p.status === 'green' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                                                            p.status === 'yellow' ? 'bg-amber-500 shadow-amber-500/20' : 
                                                            'bg-rose-600 shadow-rose-600/20'
                                                        )} aria-hidden="true" />
                                                        <span className={cn("text-[10px] font-black uppercase tracking-widest",
                                                            p.status === 'green' ? 'text-emerald-600' : 
                                                            p.status === 'yellow' ? 'text-amber-600' : 
                                                            'text-rose-600'
                                                        )}>
                                                            {p.efficiency}% Eficiência
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-xl font-black text-slate-950 font-mono-numbers">{p.realizado}</span>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">de {p.meta}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-black text-[10px] px-4 py-1.5 rounded-lg shadow-sm border">-{p.gap} UNIDADES</Badge>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                         <span className="text-lg font-black text-slate-950 uppercase tracking-tight font-mono-numbers">{p.projecao}</span>
                                                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">FECHAMENTO</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {p.disciplina.ok ? <CheckCircle2 size={14} className="text-emerald-600" aria-hidden="true" /> : <AlertCircle size={14} className="text-rose-600" aria-hidden="true" />}
                                                            <span className={cn("text-[10px] font-black uppercase", p.disciplina.ok ? "text-emerald-600" : "text-rose-600")}>
                                                                {p.disciplina.done}/{p.disciplina.total} <span className="sr-only">especialistas registraram</span>
                                                            </span>
                                                        </div>
                                                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                                            <div className={cn("h-full transition-all duration-1000", p.disciplina.ok ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${(p.disciplina.done / Math.max(p.disciplina.total, 1)) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const url = `${window.location.origin}/dashboard/${p.id}`;
                                                                    navigator.clipboard.writeText(url);
                                                                    toast.success('Link copiado!');
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-500/10 outline-none"
                                                                aria-label="Copiar link"
                                                            >
                                                                <Share2 size={16} aria-hidden="true" />
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const url = `${window.location.origin}/dashboard/${p.id}`;
                                                                    const text = `Acesse o Painel MX: ${url}`;
                                                                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                                                }}
                                                                className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-emerald-500/10 outline-none"
                                                                aria-label="WhatsApp"
                                                            >
                                                                <MessageCircle size={16} aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                        <Link 
                                                            to={`/loja?id=${p.id}`} 
                                                            onClick={() => setActiveStoreId(p.id)} 
                                                            aria-label={`Ver dashboard de ${p.name}`}
                                                            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:bg-slate-950 hover:text-white transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none"
                                                        >
                                                            <ChevronRight size={20} aria-hidden="true" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-slate-50/50 border-2 border-dashed border-gray-200 rounded-[3rem]">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-mx-lg border border-gray-100" aria-hidden="true"><Building2 size={48} className="text-gray-200" /></div>
                        <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase mb-2">Aquecendo Unidades</h2>
                        <p className="text-gray-500 text-sm font-bold max-w-xs leading-relaxed uppercase tracking-wide">Aguardando consolidação de dados para liberar a visão operacional da rede.</p>
                    </div>
                )}
            </div>
        </main>
    )
}
