import { useState, useMemo, useCallback } from 'react'
import {
    Car, Filter, Search, ChevronDown, ArrowUpRight, ArrowDownRight, MoreHorizontal, Plus, LayoutGrid, List, Calendar, Gauge, Fuel, CircleDollarSign, Box, RefreshCw, X, Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
            { title: 'Patrimônio em Estoque', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 }).format(totalValue / 1000000) + 'M', icon: CircleDollarSign, color: 'text-status-success', bg: 'bg-status-success-surface' },
            { title: 'Permanência Média', value: `${avgAging} dias`, icon: Box, color: 'text-status-error', bg: 'bg-status-error-surface' },
            { title: 'Unidades Ativas', value: filteredInventory.length, icon: Car, color: 'text-text-primary', bg: 'bg-mx-slate-50' },
        ]
    }, [filteredInventory])

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Gestão de <span className="text-brand-primary">Estoque</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Monitoramento de Ativos Operacionais</p>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <button onClick={() => refetchAll?.()} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <div className="bg-mx-slate-50/50 p-1 rounded-mx-lg flex border border-border-default shadow-inner">
                        <button onClick={() => setView('grid')} className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center transition-all", view === 'grid' ? "bg-white text-text-primary shadow-mx-sm" : "text-text-tertiary")}><LayoutGrid size={18} /></button>
                        <button onClick={() => setView('list')} className={cn("w-10 h-10 rounded-mx-md flex items-center justify-center transition-all", view === 'list' ? "bg-white text-text-primary shadow-mx-sm" : "text-text-tertiary")}><List size={18} /></button>
                    </div>
                    <button className="mx-button-primary bg-brand-secondary"><Plus size={18} /> Novo Ativo</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-lg shrink-0">
                {stats.map((stat, i) => (
                    <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-md md:p-mx-lg hover:shadow-mx-lg transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-mx-md relative z-10">
                            <div className={cn("w-14 h-14 rounded-mx-lg flex items-center justify-center border border-border-default shadow-sm transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={24} strokeWidth={2.5} /></div>
                            <div><p className="mx-text-caption mb-1">{stat.title}</p><h3 className="text-2xl font-black tracking-tighter font-mono-numbers">{stat.value}</h3></div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-mx-md items-center justify-between shrink-0">
                <div className="relative w-full lg:w-[480px] group">
                    <Search className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" size={18} />
                    <input placeholder="Buscar por modelo ou placa..." className="mx-input !h-14 !pl-14" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                
                <div className="flex items-center gap-mx-sm w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="mx-input !h-14 !px-mx-lg mx-text-caption">
                            <SelectValue placeholder="Status Ativo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-mx-lg shadow-mx-xl">
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="Normal" className="text-status-success font-bold">Saudável</SelectItem>
                            <SelectItem value="Crítico" className="text-status-error font-bold">Crítico (Aging)</SelectItem>
                        </SelectContent>
                    </Select>
                    <button className="w-14 h-14 rounded-mx-lg border border-border-default bg-white text-text-tertiary shadow-mx-sm hover:text-brand-primary flex items-center justify-center shrink-0"><Download size={20} /></button>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32">
                <AnimatePresence mode="wait">
                    {view === 'grid' ? (
                        <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-mx-lg">
                            {filteredInventory.map((item, i) => (
                                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="mx-card overflow-hidden group hover:shadow-mx-xl hover:-translate-y-1 cursor-pointer flex flex-col h-full">
                                    <div className="aspect-[16/10] bg-mx-slate-50 relative flex items-center justify-center border-b border-border-default">
                                        <Badge className={cn("absolute top-mx-sm left-mx-sm font-black text-[8px] border-none px-3 h-6 rounded-md", item.status === 'Normal' ? "bg-status-success text-white" : "bg-status-error text-white")}>{item.status === 'Normal' ? 'SAUDÁVEL' : 'CRÍTICO'}</Badge>
                                        <Car size={64} className="text-mx-slate-200 group-hover:scale-110 transition-transform duration-700" strokeWidth={1.5} />
                                        <div className="absolute bottom-mx-sm right-mx-sm text-[10px] font-black bg-white/80 border border-border-subtle px-3 py-1 rounded-full text-text-primary uppercase tracking-widest">{item.plate}</div>
                                    </div>
                                    <div className="p-mx-lg flex flex-col justify-between flex-1">
                                        <div className="mb-mx-lg"><h4 className="font-black text-lg text-text-primary tracking-tight uppercase group-hover:text-brand-primary transition-colors truncate">{item.model}</h4><p className="mx-text-caption !text-[8px] mt-1 opacity-60">Ano {item.year} • Automático • Flex</p></div>
                                        <div className="grid grid-cols-2 gap-mx-sm mb-mx-lg">
                                            <div className="flex items-center gap-2 text-[9px] font-black text-text-tertiary uppercase bg-mx-slate-50/50 p-2 rounded-mx-md border border-border-subtle"><Gauge size={12} className="text-brand-primary" /> {Math.floor(Math.random() * 50)}k km</div>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-text-tertiary uppercase bg-mx-slate-50/50 p-2 rounded-mx-md border border-border-subtle"><Fuel size={12} className="text-brand-primary" /> Optimized</div>
                                        </div>
                                        <div className="pt-mx-md border-t border-border-subtle flex items-end justify-between">
                                            <div><p className="mx-text-caption !text-[8px] mb-1 opacity-40 uppercase">Preço Venda</p><p className="font-black text-xl font-mono-numbers text-text-primary tracking-tighter leading-none">R$ {(item.price / 1000).toFixed(0)}k</p></div>
                                            <div className="text-right"><p className="mx-text-caption !text-[8px] mb-1 opacity-40 uppercase">Aging</p><p className={cn("font-black text-lg font-mono-numbers leading-none", item.aging > 45 ? "text-status-error" : "text-status-success")}>{item.aging}d</p></div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="mx-card overflow-hidden"><table className="w-full text-left min-w-[900px]">
                            <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Ativo Comercial</th><th className="py-mx-md uppercase tracking-[0.3em]">Aging Operacional</th><th className="py-mx-md uppercase tracking-[0.3em]">Valor Unitário</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Status Saúde</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Gestão</th></tr></thead>
                            <tbody className="divide-y divide-border-subtle bg-white">
                                {filteredInventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-mx-slate-50/50 transition-colors h-20 group border-none">
                                        <td className="pl-mx-lg py-4"><div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center text-text-tertiary group-hover:bg-brand-secondary group-hover:text-white transition-all"><Car size={20} strokeWidth={2.5} /></div><div><p className="font-black text-sm text-text-primary uppercase tracking-tight group-hover:text-brand-primary transition-colors">{item.model}</p><p className="text-[10px] font-bold text-text-tertiary uppercase mt-0.5">{item.plate} • {item.year}</p></div></div></td>
                                        <td className="py-4"><div className="flex items-center gap-4"><span className={cn("text-sm font-black font-mono-numbers", item.aging > 45 ? "text-status-error" : "text-status-success")}>{item.aging} dias</span><div className="w-24 h-1.5 bg-mx-slate-100 rounded-full overflow-hidden shadow-inner p-px"><div className={cn("h-full rounded-full transition-all duration-1000", item.aging > 45 ? "bg-status-error shadow-mx-sm" : "bg-status-success")} style={{ width: `${Math.min(item.aging * 2, 100)}%` }}></div></div></div></td>
                                        <td className="py-4"><p className="font-black text-base text-text-primary font-mono-numbers tracking-tight">R$ {(item.price / 1000).toFixed(0)}k</p></td>
                                        <td className="py-4 text-center"><Badge variant="outline" className={cn("text-[8px] font-black", item.status === 'Normal' ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-status-error-surface text-status-error border-mx-rose-100")}>{item.status}</Badge></td>
                                        <td className="pr-mx-lg py-4 text-right"><button className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default text-text-tertiary hover:text-text-primary transition-all flex items-center justify-center mx-auto mr-0"><MoreHorizontal size={18} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
