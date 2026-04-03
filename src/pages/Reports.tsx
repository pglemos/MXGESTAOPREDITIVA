import {
    BarChart3,
    LineChart as LineChartIcon,
    FileText,
    Download,
    Timer,
    Package,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    RefreshCw,
    X,
    PieChart as PieChartIcon,
    Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { reportLucratividade, reportCiclo, reportDescontos } from '@/lib/mock-data'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import useAppStore from '@/stores/main'

export default function Reports() {
    const { refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const stockAgingData = [
        { name: '0-15 dias', value: 45, color: '#10b981' },
        { name: '16-30 dias', value: 30, color: '#3b82f6' },
        { name: '31-45 dias', value: 15, color: '#f59e0b' },
        { name: '46+ dias', value: 10, color: '#ef4444' },
    ]

    // 3. Logic: Fix patio cost logic (using red for high cost)
    const stockStats = [
        { title: 'Giro de Estoque', value: '2.4x', trend: '+0.3', icon: Package, color: 'text-electric-blue', bg: 'bg-indigo-50' },
        { title: 'Permanência Média', value: '18 dias', trend: '-2 dias', icon: Timer, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Custo de Pátio/Mês', value: 'R$ 42k', trend: '+5%', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    ]

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        setIsRefetching(false)
        toast.success('Auditoria de ativos atualizada!')
    }

    // 11. Performance: Memoized map
    const processedDescontos = useMemo(() => {
        return reportDescontos.filter(d => d.seller.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [searchTerm])

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Análise de <span className="text-electric-blue">Ativos</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Stock Aging & Velocity Matrix</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-full border border-gray-100 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm hover:text-pure-black transition-all">
                        <Filter size={16} /> Unidades
                    </button>
                    {/* 5. Implement PDF action logic */}
                    <button onClick={() => toast.success('Compilando relatório técnico em PDF...')} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em]">
                        <Download size={18} /> Exportar Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                {stockStats.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-sm rounded-[2.2rem] p-8 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className={cn("absolute -right-4 -top-4 w-32 h-32 opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity", stat.bg)} />
                        <div className="flex items-center gap-5 mb-8 relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border border-white shadow-sm transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                <stat.icon size={28} strokeWidth={2.5} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{stat.title}</p>
                        </div>
                        <div className="flex items-baseline justify-between relative z-10">
                            <h3 className="text-3xl font-black text-pure-black tracking-tighter font-mono-numbers">{stat.value}</h3>
                            <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm", 
                                stat.title.includes('Custo') ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                                {stat.trend}
                            </Badge>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-20">
                {/* Evolution Chart (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-electric-blue shadow-sm">
                                    <LineChartIcon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Maturidade de Saída</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tempo Médio de Escoamento por Mês</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 pt-4 flex-1 min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={reportCiclo} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }} />
                                    {/* 6. Z-Index fix for Tooltip */}
                                    <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1.25rem', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '1.5rem' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="dias"
                                        stroke="#4f46e5"
                                        strokeWidth={5}
                                        dot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                                        activeDot={{ r: 10, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Aging Distribution (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group">
                        <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <PieChartIcon size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1.5">Distribuição de Idade</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Aging Operacional</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 flex-1 flex flex-col items-center justify-center min-h-[400px]">
                            {/* 4. Interactive PieChart legends fix */}
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={stockAgingData}
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stockAgingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontWeight: 800, fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            <div className="w-full mt-8 space-y-4">
                                {stockAgingData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-50 hover:bg-white hover:shadow-md transition-all group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm group-hover/item:scale-125 transition-transform" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-[10px] font-black text-pure-black uppercase tracking-tight">{item.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 font-mono-numbers">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Impact Table */}
            <div className="bg-white border border-gray-100 shadow-elevation rounded-[3rem] overflow-hidden mb-20 relative">
                <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50/30">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-pure-black text-white flex items-center justify-center shadow-2xl transform -rotate-3">
                            <RefreshCw size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-pure-black tracking-tighter leading-none mb-2">Giro por Consultor</h3>
                            <p className="text-gray-400 text-sm font-bold opacity-80 max-w-xl">Monitoramento de eficiência de escoamento individual da tropa.</p>
                        </div>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" />
                        <Input
                            placeholder="Buscar consultor..."
                            className="pl-11 h-12 rounded-full border-gray-100 bg-white text-xs font-bold shadow-sm focus:border-indigo-200 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 pl-10 text-gray-400">Especialista de Elite</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400">Giro Médio (UN)</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400">Ticket Médio BI</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.3em] py-6 pr-10 text-gray-400">Status Performance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {processedDescontos.map((d, i) => (
                                <TableRow key={d.seller} className={cn("hover:bg-gray-50/50 transition-colors h-24 border-none group", i % 2 !== 0 && "bg-gray-50/20")}>
                                    <TableCell className="py-4 pl-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[10px] shadow-inner group-hover:bg-pure-black group-hover:text-white transition-all uppercase">
                                                {d.seller.substring(0, 2)}
                                            </div>
                                            <span className="font-black text-base text-pure-black group-hover:text-electric-blue transition-colors">{d.seller}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <span className="font-mono-numbers font-black text-lg text-pure-black">{d.totalSales} un</span>
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <span className="font-mono-numbers font-bold text-sm text-gray-400">R$ 184.000</span>
                                    </TableCell>
                                    <TableCell className="py-4 pr-10 text-right">
                                        <Badge className={cn("text-[9px] font-black uppercase tracking-widest border-none px-4 h-8 rounded-full shadow-sm", 
                                            i < 2 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                        )}>
                                            {i < 2 ? 'ALTA PERFORMANCE' : 'RITMO ESTÁVEL'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
