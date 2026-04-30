import { useStores, useStoresStats } from '@/hooks/useTeam'
import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Building2, Search, Plus, RefreshCw, X, Mail, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardContent } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Link } from 'react-router-dom'
import { DataGrid, Column } from '@/components/organisms/DataGrid'

export default function Lojas() {
    const { lojas, loading: storesLoading, refetch: refetchStores, createStore, toggleStoreStatus } = useStores()
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
        return (lojas || [])
            .filter(s => s.active === filterActive)
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [lojas, searchTerm, filterActive])

    // Corporate Consolidated View Calculation
    const corporateMetrics = useMemo(() => {
        if (!lojas || !stats) return { totalSellers: 0, totalStores: 0, activeStores: 0, avgDiscipline: 0 }
        
        let totalSellers = 0
        let totalDiscipline = 0
        let activeStoresCount = 0

        filteredStores.forEach(s => {
            const sStat = stats[s.id]
            if (sStat) {
                totalSellers += sStat.sellers
                if (sStat.sellers > 0) {
                    totalDiscipline += sStat.disciplinePct
                    activeStoresCount++
                }
            }
        })

        return {
            totalSellers,
            totalStores: filteredStores.length,
            activeStores: activeStoresCount,
            avgDiscipline: activeStoresCount > 0 ? Math.round(totalDiscipline / activeStoresCount) : 0
        }
    }, [filteredStores, stats])

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

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'name',
            header: 'UNIDADE',
            render: (store) => (
                <div className="flex items-center gap-mx-sm relative z-10 min-w-0">
                    <div className="w-mx-8 h-mx-8 sm:w-mx-14 sm:h-mx-14 rounded-mx-lg sm:rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all transform group-hover:rotate-3 shrink-0" aria-hidden="true">
                        <Building2 size={18} className="sm:size-mx-md" />
                    </div>
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm sm:text-base uppercase tracking-tight group-hover:text-brand-primary transition-colors truncate max-w-mx-2xl font-black">{store.name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-mx-nano sm:text-mx-tiny font-black uppercase mt-0.5">ID: {store.id.split('-')[0]}</Typography>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'center',
            desktopOnly: true,
            render: (store) => {
                const sStat = stats[store.id] || { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                return (
                    <Badge variant={sStat.sellers > 0 ? "success" : "outline"} className="px-3 py-1 rounded-mx-full text-mx-tiny font-black shadow-sm uppercase border-none">
                        {sStat.sellers > 0 ? "Ativa" : "Vazia"}
                    </Badge>
                )
            }
        },
        {
            key: 'metrics',
            header: 'OPERACIONAL',
            align: 'center',
            render: (store) => {
                const sStat = stats[store.id] || { sellers: 0, checkedIn: 0, disciplinePct: 0 }
                return (
                    <div className="flex items-center justify-center gap-mx-xs sm:gap-mx-md">
                        <div className="text-center">
                            <Typography variant="tiny" className="font-black text-text-label uppercase text-mx-nano sm:text-mx-tiny">Tropa</Typography>
                            <Typography variant="h3" className="text-xs sm:text-base tabular-nums">{sStat.sellers}</Typography>
                        </div>
                        <div className="w-px h-mx-sm sm:h-mx-md bg-border-default mx-1 sm:mx-2" aria-hidden="true" />
                        <div className="text-center">
                            <Typography variant="tiny" className="font-black text-text-label uppercase text-mx-nano sm:text-mx-tiny">Sinc.</Typography>
                            <Typography variant="h3" tone={sStat.disciplinePct < 80 ? 'error' : 'success'} className="text-xs sm:text-base tabular-nums">{sStat.disciplinePct}%</Typography>
                        </div>
                    </div>
                )
            }
        },
        {
            key: 'actions',
            header: 'AÇÕES',
            align: 'right',
            render: (store) => (
                <div className="flex items-center justify-end gap-mx-tiny sm:gap-mx-xs relative z-10" onClick={(e) => e.stopPropagation()}>
                    {store.active ? (
                        <>
                            <Button asChild variant="secondary" size="sm" className="h-mx-lg sm:h-mx-xl px-3 sm:px-4 rounded-mx-lg shadow-mx-md font-black uppercase text-mx-nano sm:text-mx-tiny">
                                <Link to={`/loja/${store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>DASH</Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-mx-lg sm:h-mx-xl px-3 sm:px-4 rounded-mx-lg shadow-mx-md font-black uppercase text-mx-nano sm:text-mx-tiny border-border-strong bg-white">
                                <Link to={`/equipe?id=${store.id}`}>EQUIPE</Link>
                            </Button>
                            {isPerfilInternoMx(role) && (
                                <Button variant="ghost" size="icon" onClick={() => { if(confirm('Desativar unidade?')) toggleStoreStatus(store.id, false) }} className="h-mx-lg w-mx-lg sm:h-mx-xl sm:w-mx-xl rounded-mx-lg text-text-tertiary hover:text-status-error hover:bg-status-error-surface" aria-label={`Desativar ${store.name}`}>
                                    <X size={16} />
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button variant="secondary" size="sm" onClick={() => toggleStoreStatus(store.id, true)} className="h-mx-lg sm:h-mx-xl px-4 rounded-mx-lg shadow-mx-md font-black uppercase text-mx-nano sm:text-mx-tiny bg-status-success hover:opacity-90 text-white">
                            REST.
                        </Button>
                    )}
                </div>
            )
        }
    ], [stats, role, toggleStoreStatus])

    if (loading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg bg-surface-alt animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10">
                <div className="space-y-mx-xs text-center lg:text-left">
                    <Skeleton className="h-mx-10 w-mx-64 mx-auto lg:mx-0" />
                    <Skeleton className="h-mx-xs w-mx-48 mx-auto lg:mx-0" />
                </div>
                <div className="flex justify-center gap-mx-sm">
                    <Skeleton className="h-mx-14 w-mx-14 rounded-mx-xl" />
                    <Skeleton className="h-mx-14 w-mx-48 rounded-mx-xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-mx-64 rounded-mx-2xl" />)}
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-mx-green-700">Lojas</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">CONTROLE DE UNIDADES & GOVERNANÇA MX</Typography>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="hidden sm:flex rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white border-border-strong" aria-label="Atualizar lista de lojas">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <div className="relative group w-full sm:w-mx-sidebar-expanded order-2 sm:order-none">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <label htmlFor="search-lojas" className="sr-only">Buscar unidade por nome</label>
                        <Input 
                            id="search-lojas"
                            placeholder="LOCALIZAR LOJA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-mx-11 !h-mx-12 uppercase tracking-mx-wide text-mx-nano font-black"
                        />
                    </div>
                    {isPerfilInternoMx(role) && (
                        <div className="flex w-full sm:w-auto gap-mx-sm order-1 sm:order-none">
                            <nav className="hidden md:flex bg-white p-mx-tiny rounded-mx-full shadow-mx-sm border border-border-default gap-mx-tiny mr-2" role="tablist">
                                <Button variant={filterActive ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterActive(true)} className="h-mx-10 px-6 rounded-mx-full uppercase font-black tracking-widest text-mx-tiny">ATIVAS</Button>
                                <Button variant={!filterActive ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterActive(false)} className="h-mx-10 px-6 rounded-mx-full uppercase font-black tracking-widest text-mx-tiny">ARQUIVADAS</Button>
                            </nav>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="flex-1 sm:flex-none h-mx-xl px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                                <Plus size={18} className="mr-2" aria-hidden="true" /> NOVA LOJA
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Painel Corporativo / Visão Cruzada */}
            <section className="mb-mx-md">
                <Card className="bg-white shadow-mx-md border border-border-default overflow-hidden rounded-mx-2xl">
                    <CardContent className="p-mx-md sm:p-mx-lg flex flex-wrap gap-mx-md items-center justify-between sm:justify-start">
                        <div className="flex flex-col min-w-mx-20">
                            <Typography variant="tiny" className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny">Rede / Corporativo</Typography>
                            <Typography variant="h2" className="text-brand-primary">{corporateMetrics.totalStores}</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">Unidades Totais</Typography>
                        </div>
                        <div className="w-px h-mx-12 bg-border-default hidden sm:block" />
                        <div className="flex flex-col min-w-mx-20">
                            <Typography variant="tiny" className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny">Força de Vendas</Typography>
                            <Typography variant="h2" className="text-status-success">{corporateMetrics.totalSellers}</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">Especialistas Ativos</Typography>
                        </div>
                        <div className="w-px h-mx-12 bg-border-default hidden sm:block" />
                        <div className="flex flex-col min-w-mx-20">
                            <Typography variant="tiny" className="font-black text-text-label uppercase tracking-mx-widest mb-mx-tiny">Aderência</Typography>
                            <Typography variant="h2" tone={corporateMetrics.avgDiscipline < 80 ? 'error' : 'success'}>{corporateMetrics.avgDiscipline}%</Typography>
                            <Typography variant="tiny" tone="muted" className="uppercase font-black text-mx-tiny">Sincronia Média</Typography>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <Card className="border-none shadow-mx-xl bg-white overflow-hidden p-mx-0">
                    <DataGrid 
                        columns={columns}
                        data={filteredStores}
                        emptyMessage="Nenhuma unidade localizada na rede MX."
                    />
                </Card>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-mx-md bg-mx-black/60 backdrop-blur-md" role="dialog" aria-modal="true">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg">
                            <Card className="p-mx-lg md:p-14 border-none shadow-mx-2xl bg-white overflow-hidden relative rounded-mx-3xl">
                                <form onSubmit={handleCreateStore} className="space-y-mx-xl relative z-10">
                                    <header className="flex items-center justify-between border-b border-border-default pb-8">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-indigo-50 flex items-center justify-center text-brand-primary border border-mx-indigo-100 shadow-inner shrink-0"><Building2 size={28} /></div>
                                            <div>
                                                <Typography variant="h3">Nova Unidade</Typography>
                                                <Typography variant="caption" tone="muted" className="mt-1 block uppercase tracking-widest">Protocolo de Expansão MX</Typography>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" size="sm" 
                                            onClick={() => setIsCreateModalOpen(false)} 
                                            className="rounded-mx-full w-mx-xl h-mx-xl bg-surface-alt hover:bg-white shadow-sm transition-all"
                                            aria-label="Fechar modal"
                                        >
                                            <X size={24} />
                                        </Button>
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
                                                <Badge variant="outline" className="text-mx-micro font-black uppercase">Opcional</Badge>
                                            </div>
                                            <div className="relative group">
                                                <Mail size={18} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
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
                                        <Button type="submit" disabled={creating} className="w-full sm:w-auto h-mx-2xl px-12 rounded-mx-full shadow-mx-xl bg-brand-secondary font-black uppercase tracking-widest">
                                            {creating ? <RefreshCw className="animate-spin mr-2" /> : <Plus size={20} className="mr-2" />}
                                            ESTABELECER LOJA
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
