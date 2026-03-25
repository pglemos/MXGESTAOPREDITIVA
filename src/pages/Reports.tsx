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
    Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { reportLucratividade, reportCiclo, reportDescontos } from '@/lib/mock-data'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Reports() {
    const stockAgingData = [
        { name: '0-15 dias', value: 45, color: '#10b981' },
        { name: '16-30 dias', value: 30, color: '#3b82f6' },
        { name: '31-45 dias', value: 15, color: '#f59e0b' },
        { name: '46+ dias', value: 10, color: '#ef4444' },
    ]

    const stockStats = [
        { title: 'Giro de Estoque', value: '2.4x', trend: '+0.3', icon: Package, color: 'text-electric-blue' },
        { title: 'Permanência Média', value: '18 dias', trend: '-2 dias', icon: Timer, color: 'text-emerald-500' },
        { title: 'Custo de Pátio/Mês', value: 'R$ 42k', trend: '+5%', icon: TrendingDown, color: 'text-mars-orange' },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">OTIMIZAÇÃO DE ATIVOS</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">Análise de <span className="text-electric-blue">Estoque</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Gestão de idade, giro e maturidade do inventário.</p>
                </div>
                <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="w-full md:w-auto rounded-xl font-bold h-11 bg-white dark:bg-[#111] border-black/10 dark:border-white/10">
                        <Filter className="w-4 h-4 mr-2" /> Unidades
                    </Button>
                    <Button className="w-full md:w-auto rounded-xl font-bold h-11 bg-electric-blue text-white shadow-lg">
                        <Download className="w-4 h-4 mr-2" /> PDF Completo
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stockStats.map((stat) => (
                    <Card key={stat.title} className="border-none shadow-sm bg-white dark:bg-[#111] rounded-3xl overflow-hidden group">
                        <CardContent className="p-6 flex items-center gap-5">
                            <div className={cn("p-4 rounded-2xl bg-black/5 dark:bg-white/5 transition-all group-hover:scale-110", stat.color)}>
                                <stat.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-extrabold text-pure-black dark:text-off-white font-mono-numbers">{stat.value}</h3>
                                    <Badge variant="secondary" className={cn("text-[8px] font-extrabold border-none", stat.trend.startsWith('+') ? "bg-mars-orange/10 text-mars-orange" : "bg-emerald-500/10 text-emerald-500")}>
                                        {stat.trend}
                                    </Badge>
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
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white flex items-center gap-2">
                            <LineChartIcon className="w-5 h-5 text-electric-blue" /> Histórico de Ciclo de Venda
                        </CardTitle>
                        <CardDescription className="font-medium text-muted-foreground">Média de dias em estoque por mês de saída.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ChartContainer config={{ dias: { label: 'Média Dias', color: '#0062ff' } }} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={reportCiclo} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Line
                                        type="monotone"
                                        dataKey="dias"
                                        stroke="#0062ff"
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: '#0062ff', strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#0062ff', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Aging Distribution */}
                <Card className="lg:col-span-4 border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white">Idade do Estoque</CardTitle>
                        <CardDescription className="font-medium text-muted-foreground">Distribuição por faixas de permanência.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ChartContainer config={{ value: { label: 'Veículos', color: '#0062ff' } }} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stockAgingData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stockAgingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        <div className="mt-4 space-y-3">
                            {stockAgingData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-xs font-bold text-pure-black dark:text-off-white">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-mono-numbers font-extrabold text-muted-foreground">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Seller Impact Table */}
            <Card className="border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="p-8 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div>
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white">Giro por Consultor</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Eficiência de escoamento individual</CardDescription>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-5 pl-8">Consultor</TableHead>
                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest py-5">Giro Médio</TableHead>
                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest py-5">Ticket Médio</TableHead>
                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest py-5 pr-8">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportDescontos.map((d, i) => (
                                <TableRow key={d.seller} className="border-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <TableCell className="py-5 pl-8 font-extrabold text-sm">{d.seller}</TableCell>
                                    <TableCell className="py-5 text-right font-mono-numbers font-bold">{d.totalSales}un</TableCell>
                                    <TableCell className="py-5 text-right font-mono-numbers font-bold text-muted-foreground">R$ 184k</TableCell>
                                    <TableCell className="py-5 pr-8 text-right">
                                        <Badge variant="secondary" className={cn("text-[8px] font-extrabold uppercase border-none", i < 2 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                            {i < 2 ? 'Alta Performance' : 'Estável'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
