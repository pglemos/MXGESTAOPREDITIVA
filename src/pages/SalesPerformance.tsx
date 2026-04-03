import { TrendingUp, Briefcase, Calendar, Download, Users, ArrowUpRight, Filter, Tag, DollarSign, RefreshCw, X, ChevronDown, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, CartesianGrid } from 'recharts'
import { mockYearlySales, mockCategorySales } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { motion } from 'motion/react'

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default function SalesPerformance() {
    const { refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)

    const stats = useMemo(() => {
        const total = mockYearlySales.reduce((acc, curr) => acc + curr.sales, 0)
        const avg = total / 12
        return [
            { title: 'Volume Bruto', value: formatCurrency(total), trend: '+18.4%', icon: TrendingUp, color: 'text-brand-primary', bg: 'bg-brand-primary-surface' },
            { title: 'Ticket Médio', value: formatCurrency(avg / 10), trend: '+5.2%', icon: Tag, color: 'text-status-success', bg: 'bg-status-success-surface' },
            { title: 'Market Share', value: '24.2%', trend: '+2.1%', icon: Activity, color: 'text-status-warning', bg: 'bg-status-warning-surface' },
        ]
    }, [])

    const categoryStats = useMemo(() => {
        const total = mockCategorySales.reduce((acc, curr) => acc + curr.value, 0)
        return mockCategorySales.map(cat => ({
            ...cat,
            pct: Math.round((cat.value / total) * 100)
        }))
    }, [])

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Análise de <span className="text-brand-primary">Performance</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Business Intelligence • Cluster Hub</p>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <button onClick={() => { setIsRefetching(true); refetchAll?.().then(() => setIsRefetching(false)) }} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <div className="flex items-center gap-3 px-mx-md py-4 rounded-full border border-border-default bg-white shadow-mx-sm"><Calendar size={18} className="text-brand-primary" /><span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Ciclo: 2024</span><ChevronDown size={14} className="text-mx-slate-200" /></div>
                    <button className="mx-button-primary bg-brand-secondary flex items-center gap-2"><Download size={18} /> Exportar BI</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-mx-lg shrink-0">
                {stats.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-lg hover:shadow-mx-lg transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-mx-md relative z-10">
                            <div className={cn("w-14 h-14 rounded-mx-lg flex items-center justify-center border border-border-default shadow-inner transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={28} strokeWidth={2.5} /></div>
                            <div className="flex-1">
                                <p className="mx-text-caption mb-1">{stat.title}</p>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black tracking-tighter font-mono-numbers">{stat.value}</h3>
                                    <Badge variant="secondary" className="bg-status-success-surface text-status-success border-none text-[8px] px-2">{stat.trend}</Badge>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                <div className="lg:col-span-8"><Card className="h-full overflow-hidden"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Evolução de Sellout</CardTitle><CardDescription>Volume Consolidado Mensal</CardDescription></div><Badge className="bg-brand-primary-surface text-brand-primary border-none">LIVE MATRIX</Badge></CardHeader><div className="p-mx-lg flex items-center justify-center min-h-[420px]">
                    <ResponsiveContainer width="100%" height={380}>
                        <AreaChart data={mockYearlySales} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
                            <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 800 }} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 10 }} tickFormatter={(v) => `R$${v/1000}k`} />
                            <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                            <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div></Card></div>

                <div className="lg:col-span-4"><Card className="h-full flex flex-col"><CardHeader><CardTitle>Mix por Categoria</CardTitle><CardDescription>Distribuição de Ativos</CardDescription></CardHeader><div className="p-mx-lg flex-1 flex flex-col items-center">
                    <div className="h-[160px] w-full mb-mx-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryStats} layout="vertical" margin={{ left: -20, right: 30 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1D20', fontWeight: 900, fontSize: 10 }} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px' }} />
                                <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={24}>
                                    {categoryStats.map((_, i) => (<Cell key={i} fill={i === 0 ? '#4f46e5' : i === 1 ? '#6366f1' : '#818cf8'} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-2">
                        {categoryStats.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-mx-lg bg-mx-slate-50 border border-border-subtle group hover:bg-white transition-all">
                                <div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-brand-primary" : "bg-status-info")} /><span className="text-[10px] font-black uppercase tracking-tight text-text-primary">{cat.category}</span></div>
                                <span className="text-xs font-black font-mono-numbers text-brand-primary">{cat.pct}%</span>
                            </div>
                        ))}
                    </div>
                </div></Card></div>
            </div>
        </div>
    )
}
