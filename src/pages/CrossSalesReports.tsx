import { Share2, Zap, ArrowRight, ShieldCheck, Heart, Layers, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

export default function CrossSalesReports() {
    const crossSalesData = [
        { name: 'Financiamento', value: 78, color: '#0062ff' },
        { name: 'Seguros', value: 45, color: '#10b981' },
        { name: 'Blindagem', value: 12, color: '#f59e0b' },
        { name: 'Acessórios', value: 92, color: '#8b5cf6' },
        { name: 'Garantia Ext', value: 34, color: '#ef4444' },
    ]

    const opportunities = [
        { client: 'Pedro Santos', car: 'Porsche 911', potential: 'Blindagem/Seguro', score: 94, color: 'text-emerald-500' },
        { client: 'Mariana Lima', car: 'BMW M2', potential: 'Financiamento/Acessórios', score: 88, color: 'text-emerald-500' },
        { client: 'Roberto Silva', car: 'Audi RS6', potential: 'Seguro/Garantia', score: 72, color: 'text-amber-500' },
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">MAXIMIZAÇÃO DE MARGEM</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">Vendas <span className="text-electric-blue">Cruzadas</span></h1>
                    <p className="text-muted-foreground font-medium mt-1">Análise de penetração de produtos agregados e serviços.</p>
                </div>
                <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                    <Button variant="outline" className="w-full md:w-auto rounded-xl font-bold h-11 bg-white dark:bg-[#111] border-black/10 dark:border-white/10">
                        Configurar Mix
                    </Button>
                    <Button className="w-full md:w-auto rounded-xl font-bold h-11 bg-electric-blue text-white shadow-lg">
                        Identificar Novos
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Penetration Chart */}
                <Card className="lg:col-span-8 border-none bg-white dark:bg-[#111] shadow-xl rounded-3xl overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-extrabold text-pure-black dark:text-off-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-electric-blue" /> Penetração por Produto
                        </CardTitle>
                        <CardDescription className="font-medium text-muted-foreground">Porcentagem de vendas que incluem produtos adicionais.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 h-[350px]">
                        <ChartContainer config={{ value: { label: 'Penetração %', color: 'var(--electric-blue)' } }} className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={crossSalesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 10 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 10 }}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                        {crossSalesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Integration Panel */}
                <Card className="lg:col-span-4 border-none bg-gradient-to-br from-[#111] to-[#000] text-white shadow-2xl rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-electric-blue/10 rounded-full blur-[80px] -mr-24 -mt-24"></div>
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-extrabold">Oportunidades IA</CardTitle>
                        <CardDescription className="text-white/60 font-medium">Propensão de compra identificada.</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 space-y-6">
                        {opportunities.map((opt, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-sm">{opt.client}</h4>
                                    <Badge variant="outline" className={cn("text-[8px] font-extrabold border-none bg-white/5", opt.color)}>
                                        {opt.score}% SCORE
                                    </Badge>
                                </div>
                                <p className="text-[10px] text-white/50 font-bold mb-3">{opt.car}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-extrabold text-electric-blue uppercase tracking-widest">{opt.potential}</span>
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                        <Button className="w-full h-11 rounded-xl bg-electric-blue hover:bg-electric-blue/90 text-white font-bold text-xs mt-4">
                            Enviar Insights p/ Time
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Taxa Cross-Sell', value: '42%', trend: '+8.4%', icon: Share2, sub: 'Média Global' },
                    { title: 'Receita Agregada', value: 'R$ 2.4M', trend: '+12%', icon: TrendingUp, sub: 'Margem Incremental' },
                    { title: 'Satisfação', value: '4.8/5.0', trend: '+0.2', icon: Heart, sub: 'NPS Pós-Venda' },
                    { title: 'Conversão Seguros', value: '58%', trend: '-2.1%', icon: ShieldCheck, sub: 'Renovações Ativas' },
                ].map((card, i) => (
                    <Card key={i} className="border-none bg-white dark:bg-[#111] shadow-sm rounded-3xl p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-electric-blue">
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <Badge variant="secondary" className="text-[8px] font-extrabold bg-emerald-500/10 text-emerald-500 border-none">{card.trend}</Badge>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{card.title}</p>
                                <h3 className="text-xl font-extrabold text-pure-black dark:text-off-white font-mono-numbers">{card.value}</h3>
                                <p className="text-[9px] font-medium text-muted-foreground mt-1">{card.sub}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
