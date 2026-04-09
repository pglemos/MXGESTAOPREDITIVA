import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useStorePerformance } from '@/hooks/useRanking'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { 
    LayoutGrid, List, Plus, Search, RefreshCw, Database, 
    Building2, X, ChevronRight, Share2, MessageCircle, 
    CheckCircle2, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'

export default function Lojas() {
    const { role, storeId: activeStoreId, setActiveStoreId } = useAuth()
    const { stores, loading: storesLoading, createStore, refetch } = useStores()
    const { performance, loading: performanceLoading } = useStorePerformance()
    
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [saving, setSaving] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const canManageStores = role === 'admin' || role === 'dono'

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormErrors({})
        if (!name) { setFormErrors({ name: 'Nome obrigatório' }); return }
        
        setSaving(true)
        const { error } = await createStore(name, email)
        setSaving(false)
        
        if (error) {
            toast.error(`Falha ao implantar unidade: ${error}`)
        } else {
            toast.success('Unidade MX implantada com sucesso!')
            setShowForm(false); setName(''); setEmail('')
            refetch()
        }
    }

    const filteredPerformance = useMemo(() => {
        return performance.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name))
    }, [performance, searchTerm])

    const loading = storesLoading || performanceLoading

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-2">
                    <Typography variant="caption" tone="brand">{canManageStores ? 'GEOFENCING COMANDO CENTRAL' : 'VISÃO EXECUTIVA'}</Typography>
                    <Typography variant="h1">{canManageStores ? 'Gestão de Unidades' : 'Minhas Lojas'}</Typography>
                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" aria-hidden="true" />
                        <Typography variant="caption">{loading ? <Skeleton className="h-3 w-20" /> : `${performance.length} Lojas Ativas na Rede`}</Typography>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="flex bg-surface-alt p-1 rounded-full border border-border-default mr-2" role="tablist">
                        <Button 
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('table')}
                            className="rounded-full px-4"
                            aria-label="Visualizar em lista"
                        >
                            <List size={20} aria-hidden="true" />
                        </Button>
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                            size="sm" 
                            onClick={() => setViewMode('grid')}
                            className="rounded-full px-4"
                            aria-label="Visualizar em grade"
                        >
                            <LayoutGrid size={20} aria-hidden="true" />
                        </Button>
                    </div>
                    <div className="relative w-full sm:w-72 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="search-store" className="sr-only">Buscar unidade por nome</label>
                        <input 
                            id="search-store"
                            name="search-store"
                            type="text" 
                            placeholder="BUSCAR UNIDADE..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-border-default rounded-mx-md h-14 pl-12 pr-4 text-xs font-black tracking-widest uppercase focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all"
                        />
                    </div>
                    {canManageStores && (
                        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto h-14 px-8 shadow-mx-lg">
                            <Plus size={20} aria-hidden="true" /> NOVA LOJA
                        </Button>
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
                                        <Typography variant="h2" id="form-create-store-title">Implantar Unidade</Typography>
                                        <Typography variant="caption">Configuração de Ponto Operacional</Typography>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} aria-label="Fechar formulário" className="rounded-full w-12 h-12"><X size={20} aria-hidden="true" /></Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-mx-lg">
                                <FormField 
                                    id="new-store-name" 
                                    label="Nome da Unidade" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    placeholder="EX: MX CAMPINAS" 
                                    error={formErrors.name} 
                                />
                                <FormField 
                                    id="new-store-email" 
                                    label="E-mail do Gestor" 
                                    type="email"
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="GESTOR@UNIDADE.MX" 
                                    error={formErrors.email} 
                                />
                            </div>

                            <div className="pt-mx-lg flex justify-end gap-mx-sm border-t border-gray-100">
                                <Button type="submit" disabled={saving} className="h-14 px-12">
                                    {saving ? <RefreshCw className="animate-spin" aria-hidden="true" /> : 'CONFIRMAR IMPLANTAÇÃO'}
                                </Button>
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
                                <motion.article key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-mx-2xl border border-border-default p-8 flex flex-col group hover:shadow-mx-xl transition-all relative overflow-hidden bg-white">
                                     <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 opacity-20", 
                                        p.status === 'green' ? 'bg-status-success' : p.status === 'yellow' ? 'bg-status-warning' : 'bg-status-error'
                                    )} aria-hidden="true" />
                                    
                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-surface-alt border border-border-default flex items-center justify-center font-black text-2xl group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner" aria-hidden="true">
                                            {p.name.charAt(0)}
                                        </div>
                                        <Badge variant={p.status === 'green' ? 'success' : p.status === 'yellow' ? 'warning' : 'danger'}>
                                            {p.status === 'green' ? 'NO RITMO' : p.status === 'yellow' ? 'ALERTA' : 'CRÍTICO'}
                                        </Badge>
                                    </div>

                                    <Typography variant="h3" className="mb-6 truncate relative z-10">{p.name}</Typography>

                                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                                        <div className="p-5 rounded-2xl bg-surface-alt border border-border-default shadow-inner">
                                            <Typography variant="caption" className="mb-1">Vendido</Typography>
                                            <Typography variant="h2" className="font-mono-numbers">{p.realizado}</Typography>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-surface-alt border border-border-default shadow-inner">
                                            <Typography variant="caption" className="mb-1">Meta</Typography>
                                            <Typography variant="h2" tone="brand" className="font-mono-numbers">{p.meta}</Typography>
                                        </div>
                                    </div>

                                    <div className="pt-mx-lg border-t border-border-default flex items-center justify-between relative z-10">
                                        <div className="flex flex-col">
                                            <Typography variant="caption">Projeção Final</Typography>
                                            <Typography variant="h3" className="text-sm">{p.projecao} Unidades</Typography>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" size="sm"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const url = `${window.location.origin}/dashboard/${p.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success('Link da unidade copiado!');
                                                    }}
                                                    className="w-10 h-10 p-0 rounded-xl"
                                                    aria-label={`Copiar link da unidade ${p.name}`}
                                                >
                                                    <Share2 size={16} aria-hidden="true" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" size="sm"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const url = `${window.location.origin}/dashboard/${p.id}`;
                                                        const text = `Acesse o Painel MX da unidade ${p.name}: ${url}`;
                                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    className="w-10 h-10 p-0 rounded-xl text-status-success hover:bg-status-success-surface"
                                                    aria-label={`Compartilhar unidade ${p.name} no WhatsApp`}
                                                >
                                                    <MessageCircle size={16} aria-hidden="true" />
                                                </Button>
                                            </div>
                                            <Button asChild size="icon" variant="secondary" className="w-12 h-12 rounded-xl">
                                                <Link to={`/loja?id=${p.id}`} onClick={() => setActiveStoreId(p.id)} aria-label={`Ver dashboard da loja ${p.name}`}>
                                                    <ChevronRight size={24} aria-hidden="true" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-border-default rounded-[2.5rem] overflow-hidden shadow-mx-sm">
                            <table className="w-full text-left border-collapse">
                                <caption className="sr-only">Listagem consolidada do desempenho de todas as unidades da rede</caption>
                                <thead>
                                    <tr className="bg-surface-alt border-b border-border-default">
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest">Unidade Operacional</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Status Ritmo</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Realizado / Meta</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">GAP Residual</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Projeção</th>
                                        <th scope="col" className="px-8 py-6 text-[10px] font-black text-text-tertiary uppercase tracking-widest text-center">Disciplina</th>
                                        <th scope="col" className="px-8 py-6 text-right" aria-label="Ações"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {filteredPerformance.map((p, i) => (
                                            <motion.tr 
                                                key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                                className="border-t border-border-default hover:bg-surface-alt transition-colors group h-24"
                                            >
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner" aria-hidden="true">{p.name.charAt(0)}</div>
                                                        <Typography variant="h3" className="text-base">{p.name}</Typography>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className={cn("w-3 h-3 rounded-full animate-pulse shadow-sm", 
                                                            p.status === 'green' ? 'bg-status-success shadow-status-success/20' : 
                                                            p.status === 'yellow' ? 'bg-status-warning shadow-status-warning/20' : 
                                                            'bg-status-error shadow-status-error/20'
                                                        )} aria-hidden="true" />
                                                        <Typography variant="caption" tone={p.status === 'green' ? 'success' : p.status === 'yellow' ? 'brand' : 'error'}>
                                                            {p.efficiency}% Eficiência
                                                        </Typography>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-baseline gap-2">
                                                            <Typography variant="h3" className="text-xl tabular-nums">{p.realizado}</Typography>
                                                            <Typography variant="caption" tone="muted">de {p.meta}</Typography>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <Badge variant="danger" className="px-4 py-1.5 rounded-lg shadow-sm border">-{p.gap} UNIDADES</Badge>
                                                </td>
                                                <td className="px-8 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                         <Typography variant="h3" className="text-lg tabular-nums">{p.projecao}</Typography>
                                                         <Typography variant="caption" tone="brand">FECHAMENTO</Typography>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {p.disciplina.ok ? <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" /> : <AlertCircle size={14} className="text-status-error" aria-hidden="true" />}
                                                            <Typography variant="caption" tone={p.disciplina.ok ? 'success' : 'error'}>
                                                                {p.disciplina.done}/{p.disciplina.total} <span className="sr-only">especialistas registraram</span>
                                                            </Typography>
                                                        </div>
                                                        <div className="w-20 h-2 bg-surface-alt rounded-full overflow-hidden border border-border-default shadow-inner">
                                                            <div className={cn("h-full transition-all duration-1000", p.disciplina.ok ? "bg-status-success" : "bg-status-error")} style={{ width: `${(p.disciplina.done / Math.max(p.disciplina.total, 1)) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button 
                                                                variant="ghost" size="sm"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const url = `${window.location.origin}/dashboard/${p.id}`;
                                                                    navigator.clipboard.writeText(url);
                                                                    toast.success('Link copiado!');
                                                                }}
                                                                className="w-10 h-10 p-0 rounded-xl"
                                                                aria-label="Copiar link"
                                                            >
                                                                <Share2 size={16} aria-hidden="true" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" size="sm"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    const url = `${window.location.origin}/dashboard/${p.id}`;
                                                                    const text = `Acesse o Painel MX: ${url}`;
                                                                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                                                }}
                                                                className="w-10 h-10 p-0 rounded-xl text-status-success hover:bg-status-success-surface"
                                                                aria-label="WhatsApp"
                                                            >
                                                                <MessageCircle size={16} aria-hidden="true" />
                                                            </Button>
                                                        </div>
                                                        <Button asChild size="icon" variant="ghost" className="w-12 h-12 rounded-xl hover:bg-brand-secondary hover:text-white">
                                                            <Link to={`/loja?id=${p.id}`} onClick={() => setActiveStoreId(p.id)} aria-label={`Ver dashboard de ${p.name}`}>
                                                                <ChevronRight size={20} aria-hidden="true" />
                                                            </Link>
                                                        </Button>
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
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-mx-xl bg-surface-alt/50 border-2 border-dashed border-border-default rounded-[3rem]">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-mx-lg border border-border-default" aria-hidden="true"><Building2 size={48} className="text-text-tertiary" /></div>
                        <Typography variant="h2" className="mb-2">Aquecendo Unidades</Typography>
                        <Typography variant="p" tone="muted" className="max-w-xs uppercase">Aguardando consolidação de dados para liberar a visão operacional da rede.</Typography>
                    </div>
                )}
            </div>
        </main>
    )
}
