import { useState, useMemo, useCallback } from 'react'
import {
    Car, Filter, Search, ChevronDown, ArrowUpRight, ArrowDownRight, 
    MoreHorizontal, Plus, LayoutGrid, List, Calendar, Gauge, 
    Fuel, CircleDollarSign, Box, RefreshCw, X, Download,
    ShieldCheck, TrendingUp
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { mockInventory } from '@/lib/mock-data'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function Inventory() {
    const { role } = useAuth()
    const { activeAgencyId, refetch: refetchAll } = useAppStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [view, setView] = useState<'grid' | 'list'>('grid')
    const [isRefetching, setIsRefetching] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'all' | 'Normal' | 'Crítico'>('all')

    const filteredInventory = useMemo(() => {
        return mockInventory.filter((item) => {
            const matchesSearch = item.model.toLowerCase().includes(searchTerm.toLowerCase()) || item.plate.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter
            if (!matchesSearch || !matchesStatus) return false
            if (role === 'admin' && activeAgencyId && item.agencyId !== activeAgencyId) return false
            return true
        })
    }, [searchTerm, statusFilter, role, activeAgencyId])

    const stats = useMemo(() => {
        const totalValue = filteredInventory.reduce((sum, item) => sum + item.price, 0)
        const avgAging = filteredInventory.length > 0 ? Math.round(filteredInventory.reduce((sum, item) => sum + item.aging, 0) / filteredInventory.length) : 0
        return [
            { title: 'Patrimônio Ativo', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 }).format(totalValue / 1000000) + 'M', icon: CircleDollarSign, tone: 'success' },
            { title: 'Permanência Média', value: `${avgAging} dias`, icon: Box, tone: 'error' },
            { title: 'Unidades Ativas', value: filteredInventory.length, icon: Car, tone: 'brand' },
        ]
    }, [filteredInventory])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetchAll?.(); setIsRefetching(false)
        toast.success('Estoque sincronizado!')
    }, [refetchAll])

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-brand-primary">Estoque</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">MONITORAMENTO DE ATIVOS OPERACIONAIS • MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white border-border-strong" aria-label="Sincronizar estoque">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <nav className="bg-white p-mx-tiny rounded-mx-full flex border border-border-default shadow-mx-sm" role="tablist" aria-label="Visualização do estoque">
                        <Button 
                            variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setView('grid')} className="w-mx-10 h-mx-10 p-mx-0 rounded-mx-full"
                            role="tab" aria-selected={view === 'grid'} aria-label="Ver em grade"
                        >
                            <LayoutGrid size={18} aria-hidden="true" />
                        </Button>
                        <Button 
                            variant={view === 'list' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setView('list')} className="w-mx-10 h-mx-10 p-mx-0 rounded-mx-full"
                            role="tab" aria-selected={view === 'list'} aria-label="Ver em lista"
                        >
                            <List size={18} aria-hidden="true" />
                        </Button>
                    </nav>
                    <Button className="h-mx-xl px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                        <Plus size={18} className="mr-2" aria-hidden="true" /> NOVO ATIVO
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-lg shrink-0">
                {stats.map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-mx-lg border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12 opacity-50" aria-hidden="true" />
                            <div className="flex items-center gap-mx-md relative z-10">
                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                                    'bg-status-error-surface border-mx-rose-100 text-status-error'
                                )} aria-hidden="true">
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                                <div className="space-y-mx-tiny">
                                    <Typography variant="tiny" tone="muted" className="block uppercase tracking-widest font-black opacity-40">{stat.title}</Typography>
                                    <Typography variant="h1" className="text-3xl tabular-nums leading-none tracking-tighter font-black">{stat.value}</Typography>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-mx-md items-center justify-between shrink-0 mb-4">
                <div className="relative w-full lg:max-w-mx-2xl group">
                    <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" size={18} aria-hidden="true" />
                    <label htmlFor="inventory-search" className="sr-only">Buscar veículo por modelo ou placa</label>
                    <Input 
                        id="inventory-search"
                        placeholder="BUSCAR MODELO OU PLACA..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="!h-14 !pl-12 uppercase tracking-widest text-mx-tiny font-black"
                    />
                </div>
                
                <div className="flex items-center gap-mx-sm w-full md:w-auto">
                    <label htmlFor="status-filter" className="sr-only">Filtrar por status de saúde</label>
                    <Select 
                        id="status-filter"
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                        className="!h-14 sm:!w-mx-2xl uppercase tracking-widest font-black text-xs"
                    >
                        <option value="all">TODOS OS STATUS</option>
                        <option value="Normal">SAUDÁVEL</option>
                        <option value="Crítico">CRÍTICO (AGING)</option>
                    </Select>
                    <Button variant="outline" size="icon" className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm border-border-strong hover:text-brand-primary bg-white" aria-label="Exportar estoque para Excel">
                        <Download size={20} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                <AnimatePresence mode="wait">
                    {view === 'grid' ? (
                        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg" role="list">
                            {filteredInventory.map((item, i) => (
                                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} role="listitem">
                                    <Card className="overflow-hidden group hover:shadow-mx-xl hover:-translate-y-1 cursor-pointer flex flex-col h-full border-none shadow-mx-lg bg-white">
                                        <div className="aspect-video bg-surface-alt relative flex items-center justify-center border-b border-border-default overflow-hidden">
                                            <Badge variant={item.status === 'Normal' ? 'success' : 'danger'} className="absolute top-mx-sm left-mx-sm font-black text-mx-micro px-3 h-mx-md rounded-mx-lg shadow-sm border-none uppercase">
                                                {item.status === 'Normal' ? 'SAUDÁVEL' : 'CRÍTICO'}
                                            </Badge>
                                            <Car size={64} className="text-text-tertiary/20 group-hover:scale-110 transition-transform duration-700" strokeWidth={2} aria-hidden="true" />
                                            <div className="absolute bottom-mx-sm right-mx-sm shadow-mx-sm bg-white/90 backdrop-blur-sm border border-border-default px-4 py-1.5 rounded-mx-full">
                                                <Typography variant="tiny" className="font-black text-text-primary uppercase tracking-widest">
                                                    {item.plate}
                                                </Typography>
                                            </div>
                                        </div>
                                        <div className="p-mx-lg flex flex-col justify-between flex-1">
                                            <div className="mb-8">
                                                <Typography variant="h3" className="text-lg uppercase group-hover:text-brand-primary transition-colors truncate font-black">{item.model}</Typography>
                                                <Typography variant="tiny" tone="muted" className="mt-1 opacity-40 font-black uppercase tracking-widest">ANO {item.year} • AUTO • FLEX</Typography>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-sm mb-8">
                                                <div className="flex items-center gap-mx-xs bg-surface-alt p-mx-xs rounded-mx-lg border border-border-default shadow-mx-inner">
                                                    <Gauge size={12} className="text-brand-primary" aria-hidden="true" />
                                                    <Typography variant="tiny" className="font-black uppercase tracking-widest opacity-60">{Math.floor(Math.random() * 50)}K KM</Typography>
                                                </div>
                                                <div className="flex items-center gap-mx-xs bg-surface-alt p-mx-xs rounded-mx-lg border border-border-default shadow-mx-inner">
                                                    <Fuel size={12} className="text-brand-primary" aria-hidden="true" />
                                                    <Typography variant="tiny" className="font-black uppercase tracking-widest opacity-60">OPTIMIZED</Typography>
                                                </div>
                                            </div>
                                            <footer className="pt-6 border-t border-border-default flex items-end justify-between">
                                                <div>
                                                    <Typography variant="tiny" tone="muted" className="mb-1 opacity-40 font-black uppercase tracking-widest">Preço Venda</Typography>
                                                    <Typography variant="h1" className="text-2xl tabular-nums tracking-tighter leading-none font-black">R$ {(item.price / 1000).toFixed(0)}k</Typography>
                                                </div>
                                                <div className="text-right">
                                                    <Typography variant="tiny" tone="muted" className="mb-1 opacity-40 font-black uppercase tracking-widest">Aging</Typography>
                                                    <Typography variant="mono" tone={item.aging > 45 ? 'error' : 'success'} className="text-lg leading-none font-black">{item.aging}d</Typography>
                                                </div>
                                            </footer>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <Card className="overflow-hidden border-none shadow-mx-lg bg-white">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left">
                                    <caption className="sr-only">Listagem detalhada do estoque operacional</caption>
                                    <thead>
                                        <tr className="bg-surface-alt/50 border-b border-border-default text-mx-tiny font-black uppercase tracking-mx-wide text-text-tertiary">
                                            <th scope="col" className="pl-10 py-6">ATIVO COMERCIAL</th>
                                            <th scope="col" className="px-6 py-6 text-center">AGING OPERACIONAL</th>
                                            <th scope="col" className="px-6 py-6 text-center">VALOR UNITÁRIO</th>
                                            <th scope="col" className="px-6 py-6 text-center">STATUS SAÚDE</th>
                                            <th scope="col" className="pr-10 py-6 text-right">GESTÃO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-default">
                                        {filteredInventory.map((item) => (
                                            <tr key={item.id} className="hover:bg-surface-alt/30 transition-colors h-mx-3xl group">
                                                <td className="pl-10">
                                                    <div className="flex items-center gap-mx-sm">
                                                        <div className="w-mx-xl h-mx-xl rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-text-tertiary group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-mx-inner" aria-hidden="true">
                                                            <Car size={22} strokeWidth={2} />
                                                        </div>
                                                        <div>
                                                            <Typography variant="h3" className="text-sm uppercase tracking-tight group-hover:text-brand-primary transition-colors font-black">{item.model}</Typography>
                                                            <Typography variant="tiny" tone="muted" className="font-black uppercase mt-1 opacity-40">{item.plate} • {item.year}</Typography>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center gap-mx-xs">
                                                        <Typography variant="mono" tone={item.aging > 45 ? 'error' : 'success'} className="text-sm font-black uppercase">{item.aging} DIAS</Typography>
                                                        <div className="w-mx-3xl h-1.5 bg-surface-alt rounded-mx-full overflow-hidden shadow-inner p-px border border-border-default" aria-hidden="true">
                                                            <div className={cn("h-full rounded-mx-full transition-all duration-1000", item.aging > 45 ? "bg-status-error" : "bg-status-success")} style={{ width: `${Math.min(item.aging * 2, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Typography variant="h3" className="text-lg font-mono-numbers tracking-tight font-black">R$ {(item.price / 1000).toFixed(0)}k</Typography>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge variant={item.status === 'Normal' ? 'success' : 'danger'} className="text-mx-micro font-black px-4 shadow-sm border-none uppercase">{item.status}</Badge>
                                                </td>
                                                <td className="pr-10 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="w-mx-10 h-mx-10 rounded-mx-xl text-text-tertiary hover:text-brand-primary hover:bg-mx-indigo-50 shadow-sm bg-white" aria-label={`Mais opções para ${item.model}`}>
                                                        <MoreHorizontal size={20} aria-hidden="true" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
