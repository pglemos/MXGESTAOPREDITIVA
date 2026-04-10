import { useStores, useStoresStats } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Building2, Search, Plus, RefreshCw, X, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Link } from 'react-router-dom'

export default function Lojas() {
    const { stores, loading: storesLoading, refetch: refetchStores, createStore, toggleStoreStatus, deleteStore } = useStores()
    const { stats, loading: statsLoading, refetch: refetchStats } = useStoresStats()
    const { role } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterActive, setFilterActive] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newStore, setNewStore] = useState({ name: '', manager_email: '' })
    const [creating, setCreating] = useState(false)

    const loading = storesLoading || statsLoading

    const filteredStores = useMemo(() => {
        return stores
            .filter(s => s.active === filterActive)
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [stores, searchTerm, filterActive])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([refetchStores(), refetchStats()])
        setIsRefetching(false)
        toast.success('Rede sincronizada!')
    }, [refetchStores, refetchStats])

    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStore.name) return toast.error('Nome da unidade é obrigatório')
        setCreating(true)
        const { error } = await createStore(newStore.name, newStore.manager_email)
        setCreating(false)
        if (error) {
            toast.error(error)
        } else {
            toast.success('Unidade operacional criada com sucesso!')
            setIsCreateModalOpen(false)
            setNewStore({ name: '', manager_email: '' })
            handleRefresh()
        }
    }

    if (loading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-48 rounded-mx-xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
                <Skeleton className="h-64 rounded-mx-2xl" />
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-brand-primary">Unidades</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">CONTROLE DE FILIAIS & GOVERNANÇA MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white border-border-strong" aria-label="Atualizar lista de lojas">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="search-stores" className="sr-only">Buscar unidade por nome</label>
                        <Input 
                            id="search-stores"
                            placeholder="LOCALIZAR LOJA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 uppercase tracking-widest text-xs font-black"
                        />
                    </div>
                    {role === 'admin' && (
                        <nav className="bg-white p-mx-tiny rounded-mx-full shadow-mx-sm border border-border-default flex gap-mx-tiny mr-2" role="tablist">
                            <Button variant={filterActive ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterActive(true)} className="h-mx-10 px-6 rounded-mx-full uppercase font-black tracking-widest text-tiny">ATIVAS</Button>
                            <Button variant={!filterActive ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterActive(false)} className="h-mx-10 px-6 rounded-mx-full uppercase font-black tracking-widest text-tiny">ARQUIVADAS</Button>
                        </nav>
                    )}
                    {role === 'admin' && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                            <Plus size={18} className="mr-2" aria-hidden="true" /> NOVA UNIDADE
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {filteredStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg" role="list">
                        <AnimatePresence mode="popLayout">
                            {filteredStores.map((store, i) => {
                                const sStat = stats[store.id] || { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                                return (
                                <motion.div key={store.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} role="listitem">
                                    <Card className="overflow-hidden group hover:shadow-mx-xl hover:-translate-y-1 transition-all border-none shadow-mx-lg bg-white flex flex-col h-full">
                                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg flex flex-row items-center justify-between relative overflow-hidden">
                                            <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-mx-lg -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                            <div className="flex items-center gap-mx-sm relative z-10">
                                                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <Typography variant="h3" className="text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors truncate max-w-[140px] font-black">{store.name}</Typography>
                                                    <Typography variant="tiny" tone="muted" className="text-mx-tiny font-black uppercase mt-1 opacity-40">ID: {store.id.split('-')[0]}</Typography>
                                                </div>
                                            </div>
                                            <Badge variant={sStat.sellers > 0 ? "success" : "outline"} className="px-3 py-1 rounded-mx-full text-mx-tiny font-black shadow-sm uppercase border-none">
                                                {sStat.sellers > 0 ? "Ativa" : "Vazia"}
                                            </Badge>
                                        </CardHeader>

                                        <CardContent className="p-mx-lg space-y-mx-10 flex-1 relative z-10 flex flex-col justify-between">
                                            <div className="grid grid-cols-2 gap-mx-md">
                                                <div className="space-y-mx-tiny bg-surface-alt/50 p-mx-sm rounded-mx-xl border border-border-subtle shadow-mx-inner group-hover:bg-white transition-all">
                                                    <Typography variant="tiny" tone="muted" className="text-mx-tiny font-black uppercase opacity-40">Especialistas</Typography>
                                                    <div className="flex items-center gap-mx-xs">
                                                        <Typography variant="h2" className="text-xl font-mono-numbers leading-none">{sStat.sellers}</Typography>
                                                    </div>
                                                </div>
                                                <div className="space-y-mx-tiny bg-surface-alt/50 p-mx-sm rounded-mx-xl border border-border-subtle shadow-mx-inner group-hover:bg-white transition-all">
                                                    <Typography variant="tiny" tone="muted" className="font-black uppercase opacity-40">Disciplina</Typography>
                                                    <div className="flex items-center gap-mx-xs">
                                                        <Typography variant="h2" tone={sStat.disciplinePct < 80 ? "error" : "success"} className="text-xl font-mono-numbers leading-none">{sStat.disciplinePct}%</Typography>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-mx-sm">
                                                <div className="flex justify-between items-end">
                                                    <Typography variant="tiny" tone="muted" className="text-mx-tiny font-black uppercase tracking-widest opacity-40">Check-ins Hoje</Typography>
                                                    <Typography variant="mono" tone="brand" className="text-sm font-black">{sStat.checkedIn}/{sStat.sellers}</Typography>
                                                </div>
                                                <div className="h-mx-xs w-full bg-surface-alt rounded-mx-full overflow-hidden p-0.5 shadow-mx-inner border border-border-default">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${sStat.disciplinePct}%` }} transition={{ duration: 1.5 }} className={cn("h-full rounded-full shadow-mx-sm", sStat.disciplinePct < 80 ? "bg-status-error" : "bg-status-success")} />
                                                </div>
                                            </div>
                                        </CardContent>

                                        <footer className="p-mx-md border-t border-border-default bg-surface-alt/20 flex flex-col sm:flex-row gap-mx-xs relative z-10 mt-auto">
                                            {store.active ? (
                                                <>
                                                    <Button asChild variant="outline" size="sm" className="flex-1 h-mx-xl rounded-mx-lg bg-white shadow-sm font-black uppercase text-xs border-border-strong hover:border-brand-primary">
                                                        <Link to={`/metas?id=${store.id}`}>METAS</Link>
                                                    </Button>
                                                    <Button asChild variant="secondary" size="sm" className="flex-1 h-mx-xl rounded-mx-lg shadow-mx-md font-black uppercase text-xs">
                                                        <Link to={`/loja/${store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>DASHBOARD</Link>
                                                    </Button>
                                                    {role === 'admin' && (
                                                        <Button variant="ghost" size="sm" onClick={() => { if(confirm('Tem certeza que deseja DESATIVAR esta loja? Ela ficará inacessível na rede.')) toggleStoreStatus(store.id, false) }} className="flex-1 h-mx-xl rounded-mx-lg text-status-error hover:bg-status-error hover:text-white font-black uppercase text-xs">
                                                            DESATIVAR
                                                        </Button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="secondary" size="sm" onClick={() => toggleStoreStatus(store.id, true)} className="flex-1 h-mx-xl rounded-mx-lg shadow-mx-md font-black uppercase text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                                                        RESTAURAR
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => { if(confirm('⚠️ ALERTA VERMELHO: Tem certeza que deseja DELETAR PERMANENTEMENTE esta loja e TODOS OS SEUS DADOS do Supabase? Essa ação é IRREVERSÍVEL.')) deleteStore(store.id) }} className="flex-1 h-mx-xl rounded-mx-lg shadow-mx-md font-black uppercase text-xs">
                                                        EXCLUIR DEFINITIVO
                                                    </Button>
                                                </>
                                            )}
                                        </footer>
                                    </Card>
                                </motion.div>
                            )})}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full min-h-mx-section-sm flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-mx-3xl group hover:bg-surface-alt/20 transition-all" role="status">
                        <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-surface-alt shadow-mx-xl flex items-center justify-center mb-8 border border-border-default group-hover:scale-110 transition-transform" aria-hidden="true">
                            <Building2 size={48} className="text-text-tertiary opacity-20" />
                        </div>
                        <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Vácuo Operacional</Typography>
                        <Typography variant="caption" tone="muted" className="max-w-xs uppercase tracking-widest font-black text-xs leading-relaxed opacity-40">Aguardando consolidação de dados para liberar a visão operacional da rede.</Typography>
                    </div>
                )}
            </div>

            {/* Modal de Criação de Unidade */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-slate-950/60 backdrop-blur-md" role="dialog" aria-modal="true">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg">
                            <Card className="p-mx-10 md:p-14 border-none shadow-mx-xl bg-white overflow-hidden relative">
                                <form onSubmit={handleCreateStore} className="space-y-mx-xl relative z-10">
                                    <header className="flex items-center justify-between border-b border-border-default pb-8">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 flex items-center justify-center text-brand-primary border border-mx-indigo-100 shadow-inner"><Building2 size={28} /></div>
                                            <div>
                                                <Typography variant="h3">Nova Unidade</Typography>
                                                <Typography variant="caption" tone="muted" className="mt-1 block uppercase tracking-widest">Protocolo de Expansão MX</Typography>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-white shadow-sm transition-all"><X size={24} /></Button>
                                    </header>

                                    <div className="space-y-mx-lg">
                                        <div className="space-y-mx-xs">
                                            <Typography as="label" htmlFor="store-name" variant="caption" className="ml-2 font-black uppercase tracking-widest text-text-tertiary">Nome da Unidade</Typography>
                                            <Input 
                                                id="store-name"
                                                required autoFocus placeholder="EX: MX SÃO PAULO - LESTE" 
                                                value={newStore.name} onChange={e => setNewStore(p => ({ ...p, name: e.target.value.toUpperCase() }))}
                                                className="!h-14 !px-6 font-black uppercase tracking-widest"
                                            />
                                        </div>
                                        <div className="space-y-mx-xs">
                                            <div className="flex justify-between items-center ml-2">
                                                <Typography as="label" htmlFor="manager-email" variant="caption" className="font-black uppercase tracking-widest text-text-tertiary">E-mail do Gestor</Typography>
                                                <Badge variant="outline" className="text-[8px] font-black uppercase">Opcional</Badge>
                                            </div>
                                            <div className="relative group">
                                                <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                                                <Input 
                                                    id="manager-email"
                                                    type="email" placeholder="gestor@unidade.com.br"
                                                    value={newStore.manager_email} onChange={e => setNewStore(p => ({ ...p, manager_email: e.target.value }))}
                                                    className="!h-14 !pl-14 !px-6 font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <footer className="pt-10 flex justify-end border-t border-border-default">
                                        <Button type="submit" disabled={creating} className="h-mx-2xl px-12 rounded-mx-full shadow-mx-xl bg-brand-secondary font-black uppercase tracking-widest">
                                            {creating ? <RefreshCw className="animate-spin mr-2" /> : <Plus size={20} className="mr-2" />}
                                            ESTABELECER UNIDADE
                                        </Button>
                                    </footer>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}
