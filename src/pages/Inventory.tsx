import { useState, useMemo } from 'react'
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
    Box
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

export default function Inventory() {
    const { role } = useAuth()
    const { activeAgencyId } = useAppStore()
    const [searchTerm, setSearchTerm] = useState('')
    const [view, setView] = useState<'grid' | 'list'>('grid')

    const filteredInventory = mockInventory.filter((item) => {
        const matchesSearch = item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.plate.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // Filter by active agency if Admin
        if (role === 'admin' && activeAgencyId) {
            if (item.agencyId !== activeAgencyId) return false
        }

        return true
    })

    const stats = [
        { title: 'Total em Estoque', value: 'R$ 4.3M', trend: '+5.2%', icon: CircleDollarSign, color: 'text-emerald-500' },
        { title: 'Aging Médio', value: '42 dias', trend: '-2.4%', icon: Box, color: 'text-mars-orange' },
        { title: 'Margem Média', value: '9.4%', trend: '+0.8%', icon: ArrowUpRight, color: 'text-electric-blue' },
        { title: 'Units', value: '38', trend: '+4', icon: Car, color: 'text-pure-black dark:text-off-white' },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">GESTÃO DE ATIVOS</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">Controle de <span className="text-electric-blue">Estoque</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Gerencie seu inventário com inteligência e precisão estratégica.</p>
                </div>
                <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                    <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl w-full sm:w-auto justify-center">
                        <Button variant="ghost" size="icon" onClick={() => setView('grid')} className={cn("rounded-xl", view === 'grid' && "bg-white dark:bg-black shadow-sm")}>
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setView('list')} className={cn("rounded-xl", view === 'list' && "bg-white dark:bg-black shadow-sm")}>
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button className="w-full sm:w-auto bg-electric-blue hover:bg-electric-blue/90 text-white rounded-xl px-6 font-bold h-11 shadow-lg shadow-electric-blue/20">
                        <Plus className="w-4 h-4 mr-2" /> Novo Veículo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="border-none shadow-sm bg-white dark:bg-black rounded-3xl overflow-hidden relative group">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={cn("p-2 rounded-xl bg-black/5 dark:bg-white/5", stat.color)}><stat.icon className="w-4 h-4" /></div>
                                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                                </div>
                                <div className="flex items-end justify-between">
                                    <h3 className="text-2xl font-black font-mono-numbers text-pure-black dark:text-off-white">{stat.value}</h3>
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-lg", stat.trend.includes('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por modelo ou placa..."
                        className="pl-10 h-12 bg-white dark:bg-black border-none rounded-2xl font-bold shadow-sm focus-visible:ring-electric-blue"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold border-none bg-white dark:bg-black shadow-sm">
                        <Filter className="w-4 h-4 mr-2" /> Filtros
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex-1 md:flex-none rounded-2xl h-12 px-6 font-bold border-none bg-white dark:bg-black shadow-sm">
                                Exportar <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                            <DropdownMenuItem className="font-bold rounded-xl h-10 px-4">PDF Profissional</DropdownMenuItem>
                            <DropdownMenuItem className="font-bold rounded-xl h-10 px-4">Excel Estruturado</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {view === 'grid' ? (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredInventory.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border-none bg-white dark:bg-black shadow-xl rounded-[2.5rem] overflow-hidden group hover:shadow-electric-blue/10 transition-all cursor-pointer">
                                    <div className="aspect-[16/10] bg-black/5 dark:bg-white/5 relative flex items-center justify-center overflow-hidden">
                                        <div className="absolute top-4 left-4 z-10">
                                            <Badge className={cn("font-bold text-[9px] uppercase border-none px-2.5",
                                                item.status === 'Normal' ? "bg-emerald-500 text-white" : "bg-mars-orange text-white"
                                            )}>
                                                {item.status}
                                            </Badge>
                                        </div>
                                        <Car className="w-16 h-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute bottom-4 right-4 text-xs font-black bg-white/50 dark:bg-black/50 backdrop-blur-md px-3 py-1 rounded-xl text-pure-black dark:text-off-white">
                                            {item.plate}
                                        </div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div>
                                            <h4 className="font-black text-xl text-pure-black dark:text-off-white group-hover:text-electric-blue transition-colors">{item.model}</h4>
                                            <p className="text-sm font-bold text-muted-foreground">
                                                {item.year} • Automático
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                <Gauge className="w-3 h-3 text-electric-blue" /> {Math.floor(Math.random() * 50)}k km
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                                                <Fuel className="w-3 h-3 text-electric-blue" /> Flex
                                            </div>
                                        </div>
                                        <div className="pt-4 flex items-end justify-between border-t border-black/5 dark:border-white/5">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Preço de Venda</p>
                                                <p className="text-2xl font-black font-mono-numbers text-pure-black dark:text-off-white">R$ {(item.price / 1000).toFixed(0)}k</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Aging</p>
                                                <p className={cn("text-lg font-black font-mono-numbers", item.aging > 45 ? "text-mars-orange" : "text-emerald-500")}>{item.aging}d</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Card className="border-none bg-white dark:bg-black shadow-xl rounded-3xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest first:pl-8">Veículo</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest">Aging</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest">Preço</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest">Status</th>
                                            <th className="p-6 font-black text-[10px] uppercase tracking-widest text-right last:pr-8">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                        {filteredInventory.map((item) => (
                                            <tr key={item.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                                <td className="p-6 first:pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center"><Car className="w-5 h-5 opacity-40" /></div>
                                                        <div>
                                                            <p className="font-extrabold text-sm text-pure-black dark:text-off-white">{item.model}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.plate} • {item.year}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("text-sm font-black font-mono-numbers", item.aging > 45 ? "text-mars-orange" : "text-emerald-500")}>{item.aging}d</span>
                                                        <div className="w-16 h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                                            <div className={cn("h-full rounded-full", item.aging > 45 ? "bg-mars-orange" : "bg-emerald-500")} style={{ width: `${Math.min(item.aging * 2, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <p className="font-black text-sm text-pure-black dark:text-off-white font-mono-numbers">R$ {(item.price / 1000).toFixed(0)}k</p>
                                                </td>
                                                <td className="p-6">
                                                    <Badge className={cn("border-none font-bold uppercase text-[9px]",
                                                        item.status === 'Normal' ? "bg-emerald-500/10 text-emerald-500" : "bg-mars-orange/10 text-mars-orange"
                                                    )}>
                                                        {item.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-6 text-right last:pr-8">
                                                    <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
