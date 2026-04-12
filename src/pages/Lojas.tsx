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
import { Card } from '@/components/molecules/Card'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Link } from 'react-router-dom'
import { DataGrid, Column } from '@/components/organisms/DataGrid'

export default function Lojas() {
    const { stores, loading: storesLoading, refetch: refetchStores, createStore, toggleStoreStatus } = useStores()
    const { stats, loading: statsLoading, refetch: refetchStats } = useStoresStats()
    const { role } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterActive] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newStore, setNewStore] = useState({ name: '', manager_email: '' })
    const [creating, setCreating] = useState(false)

    const loading = storesLoading || statsLoading

    const filteredStores = useMemo(() => {
        return (stores || [])
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
        if (!newStore.name) return toast.error('Nome é obrigatório')
        setCreating(true)
        const { error } = await createStore(newStore.name, newStore.manager_email)
        setCreating(false)
        if (error) toast.error(error)
        else {
            toast.success('Unidade criada!')
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
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0"><Building2 size={16} /></div>
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm uppercase font-black truncate">{store.name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[8px] font-black uppercase opacity-40">ID: {store.id.split('-')[0]}</Typography>
                    </div>
                </div>
            )
        },
        {
            key: 'metrics',
            header: 'INFO',
            align: 'center',
            render: (store) => {
                const sStat = stats[store.id] || { sellers: 0, disciplinePct: 0 }
                return (
                    <div className="flex items-center gap-2">
                        <div className="text-center"><Typography variant="h3" className="text-xs">{sStat.sellers}</Typography><Typography variant="tiny" className="text-[8px] opacity-40">TRP</Typography></div>
                        <div className="text-center"><Typography variant="h3" className="text-xs" tone={sStat.disciplinePct < 80 ? 'error' : 'success'}>{sStat.disciplinePct}%</Typography><Typography variant="tiny" className="text-[8px] opacity-40">SINC</Typography></div>
                    </div>
                )
            }
        },
        {
            key: 'actions',
            header: 'AÇÃO',
            align: 'right',
            render: (store) => (
                <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="secondary" size="sm" className="h-8 px-3 rounded-lg font-black uppercase text-[8px]"><Link to={`/loja/${store.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${store.id}`}>DASH</Link></Button>
                    {role === 'admin' && (
                        <Button variant="ghost" size="icon" onClick={() => toggleStoreStatus(store.id, false)} className="h-8 w-8 text-text-tertiary hover:text-status-error"><X size={14} /></Button>
                    )}
                </div>
            )
        }
    ], [stats, role, toggleStoreStatus])

    if (loading && !isRefetching) return (
        <main className="w-full h-full flex flex-col gap-4 p-4 bg-surface-alt">
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-1 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-4 p-4 overflow-y-auto no-scrollbar bg-surface-alt">
            <header className="flex flex-col gap-4 border-b border-border-default pb-6 shrink-0">
                <div className="flex items-center justify-between">
                    <Typography variant="h1" className="text-2xl uppercase font-black">Lojas</Typography>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl h-10 w-10 bg-white"><RefreshCw size={18} className={cn(isRefetching && "animate-spin")} /></Button>
                        {role === 'admin' && <Button onClick={() => setIsCreateModalOpen(true)} className="h-10 px-4 bg-brand-secondary text-[10px] font-black uppercase rounded-xl"><Plus size={16} className="mr-1" /> NOVO</Button>}
                    </div>
                </div>
                <div className="relative group">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <Input placeholder="BUSCAR UNIDADE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="!pl-9 !h-10 text-[10px] font-black uppercase" />
                </div>
            </header>

            <div className="flex-1 pb-32">
                <Card className="border-none shadow-mx-xl bg-white overflow-hidden p-0">
                    <DataGrid columns={columns} data={filteredStores} emptyMessage="Nenhuma unidade." />
                </Card>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-mx-black/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
                            <Card className="p-6 bg-white rounded-3xl">
                                <form onSubmit={handleCreateStore} className="space-y-6">
                                    <div className="flex items-center justify-between"><Typography variant="h3">Nova Unidade</Typography><Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}><X size={20} /></Button></div>
                                    <div className="space-y-4">
                                        <div className="space-y-1"><Typography variant="tiny" className="font-black uppercase opacity-40 ml-1">Nome</Typography><Input required value={newStore.name} onChange={e => setNewStore(p => ({ ...p, name: e.target.value.toUpperCase() }))} className="!h-12 !px-4" /></div>
                                        <div className="space-y-1"><Typography variant="tiny" className="font-black uppercase opacity-40 ml-1">E-mail Gestor</Typography><Input type="email" value={newStore.manager_email} onChange={e => setNewStore(p => ({ ...p, manager_email: e.target.value }))} className="!h-12 !px-4" /></div>
                                    </div>
                                    <Button type="submit" disabled={creating} className="w-full h-14 bg-brand-secondary font-black uppercase rounded-full">{creating ? <RefreshCw className="animate-spin mr-2" /> : <Plus size={18} className="mr-2" />} ESTABELECER</Button>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    )
}
