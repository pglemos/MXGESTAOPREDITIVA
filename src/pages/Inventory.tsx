import { useState, useMemo, useCallback, useEffect } from 'react'
import {
    Car,
    Filter,
    Search,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Plus,
    LayoutGrid,
    List,
    Calendar,
    Gauge,
    Fuel,
    CircleDollarSign,
    Box,
    RefreshCw,
    X,
    Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

    // 12. Performance: Memoized inventory filtering
    const filteredInventory = useMemo(() => {
        return mockInventory.filter((item) => {
            const matchesSearch = item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.plate.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter

            if (!matchesSearch || !matchesStatus) return false

            // 3. Security Risk: Filter by active agency
            if (role === 'admin' && activeAgencyId) {
                if (item.agencyId !== activeAgencyId) return false
            }

            return true
        })
    }, [searchTerm, statusFilter, role, activeAgencyId])

    // 5. & 17. Logic: Dynamic stats summation and Aging sync
    const stats = useMemo(() => {
        const totalValue = filteredInventory.reduce((sum, item) => sum + item.price, 0)
        const avgAging = filteredInventory.length > 0 
            ? Math.round(filteredInventory.reduce((sum, item) => sum + item.aging, 0) / filteredInventory.length) 
            : 0
        const avgMargin = 9.4 // Placeholder for real calc

        return [
            { title: 'Total em Estoque', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 }).format(totalValue / 1000000) + 'M', trend: '+5.2%', icon: CircleDollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { title: 'Aging Médio', value: `${avgAging} dias`, trend: '-2.4%', icon: Box, color: 'text-rose-600', bg: 'bg-rose-50' },
            { title: 'Margem Média', value: `${avgMargin}%`, trend: '+0.8%', icon: ArrowUpRight, color: 'text-electric-blue', bg: 'bg-indigo-50' },
            { title: 'Unidades', value: filteredInventory.length, trend: '+4', icon: Car, color: 'text-pure-black', bg: 'bg-gray-50' },
        ]
    }, [filteredInventory])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        setIsRefetching(false)
        toast.success('Inventário sincronizado com a base central!')
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Gestão de <span className="text-electric-blue">Estoque</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Monitoramento de Ativos Operacionais</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    
                    <div className="bg-gray-100/50 p-1 rounded-2xl flex border border-gray-100 shadow-inner">
                        <button 
                            onClick={() => setView('grid')} 
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", view === 'grid' ? "bg-white text-pure-black shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <LayoutGrid size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                            onClick={() => setView('list')} 
                            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", view === 'list' ? "bg-white text-pure-black shadow-sm" : "text-gray-400 hover:text-pure-black")}
                        >
                            <List size={18} strokeWidth={2.5} />
                        </button>
                    </div>

                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Novo Ativo
                    </button>
                </div>
            </div>

            {/* 9. Responsive Grid improvement */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-sm rounded-[2rem] p-6 hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className={cn("absolute -right-4 -top-4 w-24 h-24 opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity", stat.bg)} />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-white shadow-sm", stat.bg, stat.color)}>
                                <stat.icon size={18} strokeWidth={2.5} />
                            </div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.title}</p>
                        </div>
                        <div className="flex items-baseline justify-between relative z-10">
                            <h3 className="text-2xl font-black text-pure-black tracking-tighter font-mono-numbers">{stat.value}</h3>
                            <span className={cn("text-[9px] font-black px-2 py-1 rounded-lg border", 
                                stat.trend.includes('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                {stat.trend}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between shrink-0">
                <div className="relative w-full lg:w-[480px] group">
                    {/* 10. Acessibilidade: aria-hidden added */}
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" size={18} aria-hidden="true" />
                    <input
                        placeholder="Buscar por modelo, marca ou placa..."
                        className="w-full pl-14 pr-12 h-14 bg-white border border-gray-100 rounded-full font-bold text-sm shadow-sm focus:outline-none focus:border-electric-blue/30 focus:shadow-lg transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-rose-500"><X size={18} /></button>}
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="flex-1 md:w-48 rounded-2xl h-14 border-gray-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm">
                            <SelectValue placeholder="Status Ativo" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="Normal" className="text-emerald-600 font-bold">Saudável</SelectItem>
                            <SelectItem value="Crítico" className="text-rose-600 font-bold">Crítico (Aging)</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-14 h-14 rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-sm hover:text-pure-black hover:border-gray-200 transition-all flex items-center justify-center shrink-0">
                                <Download size={20} />
                            </button>
                        </DropdownMenuTrigger>
                        {/* 6. Z-Index fix */}
                        <DropdownMenuContent className="rounded-2xl border border-gray-100 shadow-3xl p-2 bg-white/95 backdrop-blur-xl z-[70]">
                            <DropdownMenuItem className="font-black text-[10px] uppercase tracking-widest rounded-xl h-12 px-6 flex items-center gap-3 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer">
                                <Download size={14} /> PDF Técnico
                            </DropdownMenuItem>
                            <DropdownMenuItem className="font-black text-[10px] uppercase tracking-widest rounded-xl h-12 px-6 flex items-center gap-3 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer">
                                <Download size={14} /> Planilha BI
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32">
                <AnimatePresence mode="wait">
                    {view === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                        >
                            {filteredInventory.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    // 15. contain: layout fix
                                    className="bg-white border border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-elevation transition-all cursor-pointer relative flex flex-col h-full"
                                    style={{ contain: 'layout' }}
                                >
                                    <div className="aspect-[16/10] bg-gray-50 relative flex items-center justify-center overflow-hidden border-b border-gray-100">
                                        <div className="absolute top-5 left-5 z-10">
                                            <Badge className={cn("font-black text-[8px] uppercase tracking-widest border-none px-3 py-1 rounded-lg shadow-sm",
                                                item.status === 'Normal' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                            )}>
                                                {item.status === 'Normal' ? 'Saudável' : 'Crítico'}
                                            </Badge>
                                        </div>
                                        {/* 8. Car icon visibility improved */}
                                        <Car size={80} className="text-gray-200/40 group-hover:scale-110 transition-transform duration-700" strokeWidth={1.5} />
                                        <div className="absolute bottom-5 right-5 text-[10px] font-black bg-white/80 border border-white/50 backdrop-blur-md px-4 py-1.5 rounded-full text-pure-black shadow-sm uppercase tracking-widest">
                                            {item.plate}
                                        </div>
                                    </div>
                                    <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-black text-xl text-pure-black tracking-tighter group-hover:text-electric-blue transition-colors line-clamp-1">{item.model}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                Ano {item.year} • Automático • Flex
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2.5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                                                <Gauge size={14} className="text-electric-blue" /> {Math.floor(Math.random() * 50)}k km
                                            </div>
                                            <div className="flex items-center gap-2.5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 p-2.5 rounded-xl border border-gray-50">
                                                <Fuel size={14} className="text-electric-blue" /> Optimized
                                            </div>
                                        </div>

                                        <div className="pt-6 flex items-end justify-between border-t border-gray-50 mt-2">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1.5 leading-none">Preço de Venda</p>
                                                <p className="text-2xl font-black font-mono-numbers text-pure-black tracking-tight leading-none">R$ {(item.price / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1.5 leading-none">Aging</p>
                                                <p className={cn("text-xl font-black font-mono-numbers leading-none", item.aging > 45 ? "text-rose-500" : "text-emerald-500")}>{item.aging}d</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                        >
                            <div className="bg-white border border-gray-100 shadow-elevation rounded-[2.5rem] overflow-hidden">
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left min-w-[900px]">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-10 py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Ativo Comercial</th>
                                                <th className="py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Aging Operacional</th>
                                                <th className="py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Valor Unitário</th>
                                                <th className="py-6 font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Status Saúde</th>
                                                <th className="px-10 py-6 text-right font-black text-[10px] uppercase tracking-[0.3em] text-gray-400">Gestão</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 bg-white">
                                            {filteredInventory.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group cursor-default">
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner group-hover:bg-pure-black transition-all">
                                                                <Car size={22} className="text-gray-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm text-pure-black group-hover:text-electric-blue transition-colors uppercase tracking-tight">{item.model}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.plate} • {item.year}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <div className="flex items-center gap-4">
                                                            <span className={cn("text-sm font-black font-mono-numbers", item.aging > 45 ? "text-rose-500" : "text-emerald-500")}>{item.aging} dias</span>
                                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner p-px">
                                                                <div className={cn("h-full rounded-full transition-all duration-1000 shadow-sm", item.aging > 45 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(item.aging * 2, 100)}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-6">
                                                        <p className="font-black text-base text-pure-black font-mono-numbers tracking-tight">R$ {(item.price / 1000).toFixed(0)}k</p>
                                                    </td>
                                                    <td className="py-6">
                                                        {/* 19. Contrast fix for plate badge */}
                                                        <div className={cn("inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                            item.status === 'Normal' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                                        )}>
                                                            <div className={cn("w-1.5 h-1.5 rounded-full mr-2", item.status === 'Normal' ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                                                            {item.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right">
                                                        {/* 4. Opacity fix for action button */}
                                                        <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-pure-black hover:bg-white hover:shadow-xl transition-all active:scale-90">
                                                            <MoreHorizontal size={18} strokeWidth={2.5} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
