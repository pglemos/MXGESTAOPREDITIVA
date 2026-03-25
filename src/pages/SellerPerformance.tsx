import { useState } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    CartesianGrid,
    Cell,
    AreaChart,
    Area
} from 'recharts'
import {
    Trophy,
    Target,
    TrendingUp,
    Zap,
    Search,
    Download,
    Filter,
    Award,
    Flame,
    Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'

const monthlyData = [
    { month: 'Jan', vendas: 18, meta: 20 },
    { month: 'Fev', vendas: 22, meta: 22 },
    { month: 'Mar', vendas: 28, meta: 25 },
    { month: 'Abr', vendas: 19, meta: 25 },
    { month: 'Mai', vendas: 24, meta: 25 },
]

export default function SellerPerformance() {
    const { team, commissions } = useAppStore()
    const [selectedSeller, setSelectedSeller] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredCommissions = commissions.filter((c) => {
        const matchesSeller = selectedSeller === 'all' || c.seller === team.find((t) => t.id === selectedSeller)?.name
        const matchesSearch = c.car.toLowerCase().includes(searchTerm.toLowerCase()) || c.seller.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSeller && matchesSearch
    })

    const leaderboard = [...team].sort((a, b) => b.sales - a.sales).slice(0, 3)

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">INSIGHTS INDIVIDUAIS</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">Performance <span className="text-electric-blue">Vendedores</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Liderança, conversão e resultados por consultor.</p>
                </div>
                <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                    <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                        <SelectTrigger className="w-full sm:w-[200px] rounded-xl h-11 bg-white dark:bg-[#111] border-black/10 dark:border-white/10 font-bold">
                            <SelectValue placeholder="Vendedor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">Todos</SelectItem>
                            {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl font-bold h-11 bg-white dark:bg-[#111] border-black/10 dark:border-white/10">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Leaderboard Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leaderboard.map((member, i) => (
                    <Card key={member.id} className={cn(
                        "border-none shadow-xl rounded-3xl overflow-hidden relative group transition-all hover:scale-[1.02]",
                        i === 0 ? "bg-gradient-to-br from-electric-blue to-blue-700 text-white" : "bg-white dark:bg-[#111]"
                    )}>
                        {i === 0 && <Flame className="absolute top-4 right-4 w-6 h-6 text-white/20 animate-bounce" />}
                        <CardContent className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className="h-16 w-16 border-2 border-white/20">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} />
                                    <AvatarFallback>{member.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className={cn("text-xl font-extrabold", i === 0 ? "text-white" : "text-pure-black dark:text-off-white")}>{member.name}</h3>
                                    <p className={cn("text-xs font-bold uppercase tracking-widest opacity-60", i === 0 ? "text-white" : "text-muted-foreground")}>
                                        {i === 0 ? 'Top Performer' : member.role}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", i === 0 ? "text-white" : "text-muted-foreground")}>Vendas</p>
                                    <p className="text-2xl font-extrabold font-mono-numbers">{member.sales}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", i === 0 ? "text-white" : "text-muted-foreground")}>Conversão</p>
                                    <p className="text-2xl font-extrabold font-mono-numbers">{member.conversion}%</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest mb-2 opacity-60">
                                    <span>Meta Mensal</span>
                                    <span>{Math.round((member.sales / 25) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-1000", i === 0 ? "bg-white" : "bg-electric-blue")}
                                        style={{ width: `${Math.min((member.sales / 25) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Evolution Chart */}
                <Card className="border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-electric-blue" /> Vendas vs Metas
                            </CardTitle>
                            <CardDescription className="font-medium text-muted-foreground">Consistência de performance no semestre.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ChartContainer config={{ vendas: { label: 'Realizado', color: '#0062ff' }, meta: { label: 'Meta', color: '#94a3b8' } }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0062ff" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0062ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 600, fontSize: 11 }} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Area type="monotone" dataKey="vendas" stroke="#0062ff" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                    <Area type="monotone" dataKey="meta" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Conversion Chart */}
                <Card className="border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-electric-blue" /> Ranking de Conversão
                        </CardTitle>
                        <CardDescription className="font-medium text-muted-foreground">Eficiência comercial por vendededor.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ChartContainer config={{ conversion: { label: 'Conversão %', color: '#0062ff' } }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[...team].sort((a, b) => b.conversion - a.conversion)} layout="vertical" margin={{ left: -30, right: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontWeight: 700, fontSize: 11 }} width={100} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="conversion" radius={[0, 8, 8, 0]} barSize={28}>
                                        {[...team].sort((a, b) => b.conversion - a.conversion).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0062ff' : index === 1 ? '#3b82f6' : '#93c5fd'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Commissions History Table */}
            <Card className="border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="p-8 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div>
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white">Histórico de Comissões</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Últimas conversões validadas</CardDescription>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por carro ou vendedor..."
                            className="pl-10 h-10 rounded-xl bg-white dark:bg-black border-none text-xs font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-5 pl-8">Admin</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-5">Veículo</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-5">Data</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-5">Margem</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-5 pr-8 text-right">Comissão</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCommissions.map((c) => (
                                <TableRow key={c.id} className="border-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                                    <TableCell className="py-5 pl-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-electric-blue/10 flex items-center justify-center text-electric-blue font-extrabold text-[10px]">
                                                {c.seller.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-extrabold text-sm">{c.seller}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-pure-black dark:text-off-white">{c.car}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Venda Direta</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 font-bold text-xs text-muted-foreground">{c.date}</TableCell>
                                    <TableCell className="py-5">
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-mono-numbers text-[10px] font-extrabold">
                                            {c.margin}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5 pr-8 text-right">
                                        <span className="font-extrabold text-sm text-electric-blue font-mono-numbers">
                                            R$ {c.comission.toLocaleString('pt-BR')}
                                        </span>
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
