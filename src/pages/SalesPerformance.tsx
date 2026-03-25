import { TrendingUp, Briefcase, Calendar, Download, Users, ArrowUpRight, Filter } from 'lucide-react'
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

export default function SalesPerformance() {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)

    const stats = [
        { title: 'Volume Total (Ano)', value: 'R$ 14.8M', trend: '+18.4%', icon: TrendingUp, color: 'text-electric-blue' },
        { title: 'Ticket Médio', value: 'R$ 184k', trend: '+5.2%', icon: Briefcase, color: 'text-emerald-500' },
        { title: 'Conversão Média', value: '14.2%', trend: '+2.1%', icon: Users, color: 'text-amber-500' },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ANÁLISE ESTRATÉGICA</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">Performance de <span className="text-electric-blue">Vendas</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Visão completa dos resultados comerciais e tendências de mercado.</p>
                </div>
                <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="w-full md:w-auto rounded-xl font-bold h-11 bg-white dark:bg-[#111] border-black/10 dark:border-white/10">
                        <Filter className="w-4 h-4 mr-2" /> Filtrar Período
                    </Button>
                    <Button className="w-full md:w-auto rounded-xl font-bold h-11 bg-electric-blue text-white shadow-lg">
                        <Download className="w-4 h-4 mr-2" /> Exportar Dados
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm bg-white dark:bg-[#111] rounded-3xl overflow-hidden relative group">
                        <CardContent className="p-6 flex items-center gap-5">
                            <div className={cn("p-4 rounded-2xl bg-black/5 dark:bg-white/5 transition-colors group-hover:bg-electric-blue/10", stat.color)}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-extrabold text-pure-black dark:text-off-white font-mono-numbers">{stat.value}</h3>
                                    <div className="flex items-center text-[10px] font-bold text-emerald-500">
                                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stat.trend}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Evolution Chart */}
                <Card className="lg:col-span-8 border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white">Evolução de Vendas</CardTitle>
                                <CardDescription className="font-medium text-muted-foreground">Volume de vendas e margem bruta por mês.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="rounded-lg bg-emerald-500/10 text-emerald-500 border-none font-bold">
                                    2024
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[400px]">
                        <ChartContainer config={{
                            sales: { label: 'Vendas', color: 'var(--electric-blue)' },
                            margin: { label: 'Margem', color: 'var(--emerald-500)' }
                        }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockYearlySales} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0062ff" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0062ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 10 }}
                                        tickFormatter={(val) => `R$ ${val / 1000}k`}
                                    />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#0062ff"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="margin"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Category Mix */}
                <Card className="lg:col-span-4 border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white">Mix por Categoria</CardTitle>
                        <CardDescription className="font-medium text-muted-foreground">Distribuição de vendas por segmento.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[400px]">
                        <ChartContainer config={{ value: { label: 'Volume', color: 'var(--electric-blue)' } }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockCategorySales} layout="vertical" margin={{ left: -20, right: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="category"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 11 }}
                                        width={80}
                                    />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                        {mockCategorySales.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0062ff' : index === 1 ? '#3b82f6' : '#93c5fd'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="mt-8 space-y-4">
                            {mockCategorySales.map((cat, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2.5 h-2.5 rounded-full", i === 0 ? "bg-[#0062ff]" : i === 1 ? "bg-[#3b82f6]" : "bg-[#93c5fd]")}></div>
                                        <span className="text-xs font-bold text-pure-black dark:text-off-white">{cat.category}</span>
                                    </div>
                                    <span className="text-xs font-mono-numbers font-extrabold text-muted-foreground">
                                        {((cat.value / mockCategorySales.reduce((acc, c) => acc + c.value, 0)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
