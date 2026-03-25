import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Calendar, PiggyBank, Receipt, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mockFinance, reportLucratividade } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/main'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { motion } from 'motion/react'

export default function Financeiro() {
    const { commissions } = useAppStore()
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)

    const fluxData = [
        { month: 'Jan', entrada: 420000, saida: 380000 },
        { month: 'Fev', entrada: 510000, saida: 410000 },
        { month: 'Mar', entrada: 480000, saida: 430000 },
        { month: 'Abr', entrada: 610000, saida: 520000 },
        { month: 'Mai', entrada: 550000, saida: 490000 },
        { month: 'Jun', entrada: 720000, saida: 580000 },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">CENTRAL FINANCEIRA</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-pure-black dark:text-off-white">Performance <span className="text-emerald-500">Financeira</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Visão holística de margens, comissões e saúde do fluxo de caixa.</p>
                </div>
                <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="w-full md:w-auto rounded-2xl border-none h-12 px-6 font-bold bg-white dark:bg-[black] shadow-sm">
                        <Calendar className="w-4 h-4 mr-2" /> Fevereiro 2024
                    </Button>
                    <Button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-8 font-bold shadow-lg shadow-emerald-500/20">
                        <PiggyBank className="w-4 h-4 mr-2" /> Novo Aporte
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-none shadow-xl bg-white dark:bg-[black] rounded-[2.5rem] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-600"><TrendingUp className="w-8 h-8" /></div>
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3 py-1 uppercase tracking-wider">Mão Forte +12%</Badge>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Faturamento Bruto</p>
                            <p className="text-3xl sm:text-4xl font-black font-mono-numbers text-pure-black dark:text-off-white tracking-tighter">{formatCurrency(mockFinance.entradas)}</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="border-none shadow-xl bg-white dark:bg-[black] rounded-[2.5rem] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-mars-orange/5 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-mars-orange/10 transition-colors"></div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 bg-mars-orange/10 rounded-2xl text-mars-orange"><TrendingDown className="w-8 h-8" /></div>
                                <Badge className="bg-mars-orange/10 text-mars-orange border-none font-black text-[10px] px-3 py-1 uppercase tracking-wider">Controlado -5%</Badge>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Investimento / Custos</p>
                            <p className="text-3xl sm:text-4xl font-black font-mono-numbers text-pure-black dark:text-off-white tracking-tighter">{formatCurrency(mockFinance.saidas)}</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="border-none shadow-2xl bg-pure-black text-white dark:bg-off-white dark:text-pure-black rounded-[2.5rem] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none"></div>
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="p-4 bg-white/10 dark:bg-black/10 rounded-2xl text-white dark:text-black"><Wallet className="w-8 h-8" /></div>
                                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">SAUDÁVEL <ArrowUpRight className="w-4 h-4" /></div>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 dark:text-black/50 mb-1">EBITDA Projetado</p>
                            <p className="text-3xl sm:text-4xl font-black font-mono-numbers tracking-tighter">{formatCurrency(mockFinance.saldoProjetado)}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none bg-white dark:bg-[black] shadow-xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black text-pure-black dark:text-off-white">Fluxo de Caixa Mensal</CardTitle>
                        <CardDescription className="font-bold text-muted-foreground">Monitoramento de entradas vs saídas em tempo real.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={fluxData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 11 }} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                                />
                                <Area type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEntrada)" />
                                <Area type="monotone" dataKey="saida" stroke="#f97316" strokeWidth={4} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none bg-white dark:bg-[black] shadow-xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-black/5 dark:border-white/5 pb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-black/5 dark:bg-white/10 rounded-[1.5rem]"><Receipt className="h-6 w-6 text-pure-black dark:text-off-white" /></div>
                            <div>
                                <CardTitle className="text-xl font-black text-pure-black dark:text-off-white">Repasses de Comissão</CardTitle>
                                <CardDescription className="font-bold text-muted-foreground">Últimos comissionamentos validados.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <div className="p-4 pt-0 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-none">
                                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground first:pl-8">Vendedor</th>
                                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Veículo</th>
                                    <th className="p-6 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right last:pr-8">Comissão</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {commissions.slice(0, 5).map((c) => (
                                    <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-all group">
                                        <td className="p-6 first:pl-8 font-black text-sm text-pure-black dark:text-off-white">{c.seller}</td>
                                        <td className="p-6 font-bold text-xs text-muted-foreground">{c.car}</td>
                                        <td className="p-6 text-right last:pr-8 group-hover:scale-105 transition-transform">
                                            <span className="font-mono-numbers font-black text-lg text-emerald-500">{formatCurrency(c.comission)}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Card className="border-none bg-white dark:bg-[black] shadow-2xl rounded-[3rem] overflow-hidden mt-12 bg-gradient-to-br from-white to-black/5 dark:from-[black] dark:to-white/5">
                <CardHeader className="p-10 border-b border-black/5 dark:border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                            <div className="p-4 bg-emerald-500 text-white rounded-[2rem] shadow-lg shadow-emerald-500/20"><CreditCard className="h-8 w-8" /></div>
                            <div>
                                <CardTitle className="text-2xl sm:text-3xl font-black text-pure-black dark:text-off-white tracking-tight">Extrato Detalhado de Margens</CardTitle>
                                <CardDescription className="font-bold text-muted-foreground text-sm sm:text-lg">Análise técnica de lucratividade operacional por transação.</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-none bg-white/50 dark:bg-black/50 shadow-sm backdrop-blur-md w-full md:w-auto">Filtrar por Vendedor</Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-black/5 dark:bg-white/5">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 pl-10">Colaborador</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-6">Ativo</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-6">Data</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-6">Margem (%)</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest py-6 pr-10">Líquido Receber</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {commissions.map((c, i) => (
                                <TableRow key={c.id} className={cn('border-none transition-colors h-20', i % 2 === 0 ? 'bg-transparent' : 'bg-black/[0.01] dark:bg-white/[0.01]', 'hover:bg-emerald-500/[0.03] group')}>
                                    <TableCell className="font-black text-base py-4 pl-10 text-pure-black dark:text-off-white">{c.seller}</TableCell>
                                    <TableCell className="font-bold text-sm text-muted-foreground py-4">{c.car}</TableCell>
                                    <TableCell className="font-bold text-sm text-muted-foreground py-4">{c.date}</TableCell>
                                    <TableCell className="text-right py-4">
                                        <Badge className={cn("font-mono-numbers font-black text-sm border-none rounded-xl px-4 py-1.5",
                                            parseFloat(c.margin) > 9 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                        )}>
                                            {c.margin}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono-numbers font-black text-xl text-emerald-600 py-4 pr-10 group-hover:translate-x-[-4px] transition-transform">
                                        {formatCurrency(c.comission)}
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
