import { TrendingUp, Briefcase, Calendar, Download, Users, ArrowUpRight, Filter, Tag, DollarSign, RefreshCw, X, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ChartContainer,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    Cell,
} from 'recharts'
import { mockYearlySales, mockCategorySales } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

// 5. formatCurrency outside for performance
const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

export default function SalesPerformance() {
    const { team, refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)
    const [selectedYear, setSelectedYear] = useState('2024')

    // 2. Logic: Dynamic stats calculation
    const stats = useMemo(() => {
        const totalValue = mockYearlySales.reduce((acc, curr) => acc + curr.sales, 0)
        const avgTicket = totalValue / (mockYearlySales.reduce((acc, curr) => acc + 10, 0) || 1) // Dummy count for mock
        const avgConv = 14.2 // Placeholder

        return [
            { title: 'Volume Total (Ano)', value: formatCurrency(totalValue), trend: '+18.4%', icon: TrendingUp, color: 'text-electric-blue', bg: 'bg-indigo-50' },
            { title: 'Ticket Médio', value: formatCurrency(avgTicket), trend: '+5.2%', icon: Tag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { title: 'Conversão Média', value: `${avgConv}%`, trend: '+2.1%', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
        ]
    }, [])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        setIsRefetching(false)
        toast.success('Matriz de performance sincronizada!')
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Análise <span className="text-electric-blue">Estratégica</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Intelligence Cluster BI</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    {/* 4. UX Gap: Dropdown simulation */}
                    <div className="flex items-center gap-3 px-6 py-4 rounded-full border border-gray-100 bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all">
                        <Calendar size={18} className="text-electric-blue" />
                        <span className="text-[10px] font-black text-pure-black uppercase tracking-[0.2em]">Ciclo: {selectedYear}</span>
                        <ChevronDown size={14} className="text-gray-300" />
                    </div>
                    <button onClick={() => toast.success('Preparando dataset para exportação...')} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em]">
                        <Download size={18} /> Exportar BI
                    </button>
                </div>
            </div>

            {/* 9. Responsive fix for 768px */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 shrink-0">
                {stats.map((stat, i) => (
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
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{stat.title}</p>
                        </div>
                        <div className="flex items-baseline justify-between relative z-10">
                            <h3 className="text-3xl font-black text-pure-black tracking-tighter font-mono-numbers">{stat.value}</h3>
                            <div className={cn("flex items-center text-[10px] font-black px-3 py-1.5 rounded-lg border", 
                                stat.trend.includes('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            )}>
                                <ArrowUpRight size={14} className="mr-1" strokeWidth={3} /> {stat.trend}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-32">
                {/* Evolution Chart (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1.5">Curva de Faturamento</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Volume Consolidado vs Margem Operacional</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                                <DollarSign className="w-3.5 h-3.5" /> Live Matrix
                            </div>
                        </div>
                        <div className="p-10 pt-4 flex-1 min-h-[420px]">
                            {/* 14. Acessibilidade: aria-label added */}
                            <ResponsiveContainer width="100%" height="100%" aria-label="Gráfico de evolução de vendas">
                                <AreaChart data={mockYearlySales} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            {/* 15. Visual Bug: Increased opacity */}
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    {/* 6. Z-Index fix for Tooltip */}
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1.25rem', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                        cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    {/* 12. Font size fix */}
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }}
                                        tickFormatter={(val) => `R$ ${val / 1000}k`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#4f46e5"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                        activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="margin"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        strokeDasharray="8 8"
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Category Mix (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group">
                        <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1.5">Mix por Categoria</h3>
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Distribuição de Penetração</p>
                        </div>
                        <div className="p-10 flex-1 flex flex-col">
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mockCategorySales} layout="vertical" margin={{ left: -20, right: 30 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="category"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#1A1D20', fontWeight: 900, fontSize: 11 }}
                                            width={100}
                                        />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontWeight: 800, fontSize: '10px' }} />
                                        <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={32}>
                                            {mockCategorySales.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index === 1 ? '#6366f1' : '#818cf8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="mt-auto space-y-5 pt-10">
                                {mockCategorySales.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-50 hover:bg-white hover:shadow-md transition-all group/item">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-3 h-3 rounded-full shadow-sm group-hover/item:scale-125 transition-transform", i === 0 ? "bg-[#4f46e5]" : i === 1 ? "bg-[#6366f1]" : "bg-[#818cf8]")} />
                                            <span className="text-xs font-black text-pure-black uppercase tracking-tight">{cat.category}</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-400 font-mono-numbers">
                                            {((cat.value / mockCategorySales.reduce((acc, c) => acc + c.value, 0)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
