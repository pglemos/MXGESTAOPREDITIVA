import { Share2, Zap, ArrowRight, ShieldCheck, Heart, Layers, TrendingUp, RefreshCw, X, Download, Filter, MessageCircle, BarChart3, PieChart } from 'lucide-react'
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
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

export default function CrossSalesReports() {
    const { refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)

    // 14. Dynamic colors for products
    const crossSalesData = [
        { name: 'Financiamento', value: 78, color: '#4f46e5' },
        { name: 'Seguros', value: 45, color: '#10b981' },
        { name: 'Blindagem', value: 12, color: '#f59e0b' },
        { name: 'Acessórios', value: 92, color: '#8b5cf6' },
        { name: 'Garantia Ext', value: 34, color: '#ef4444' },
    ]

    const opportunities = [
        { client: 'Pedro Santos', car: 'Porsche 911', potential: 'Blindagem/Seguro', score: 94, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
        { client: 'Mariana Lima', car: 'BMW M2', potential: 'Financiamento/Acessórios', score: 88, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
        { client: 'Roberto Silva', car: 'Audi RS6', potential: 'Seguro/Garantia', score: 72, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
    ]

    // 19. Logic: revenue sum
    const stats = useMemo(() => {
        const totalRev = 2400000 // Mock base
        return [
            { title: 'Taxa Cross-Sell', value: '42%', trend: '+8.4%', icon: Share2, sub: 'Média Global' },
            { title: 'Receita Agregada', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 1 }).format(totalRev / 1000000) + 'M', trend: '+12%', icon: TrendingUp, sub: 'Margem Incremental' },
            { title: 'Satisfação', value: '4.8/5.0', trend: '+0.2', icon: Heart, sub: 'NPS Pós-Venda' },
            { title: 'Conversão Seguros', value: '58%', trend: '-2.1%', icon: ShieldCheck, sub: 'Renovações Ativas' },
        ]
    }, [])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        setIsRefetching(false)
        toast.success('Matrix de agregação atualizada!')
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Vendas <span className="text-electric-blue">Cruzadas</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Revenue Maximization BI</p>
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
                        <Filter size={16} /> Configurar Mix
                    </button>
                    <button onClick={() => toast.info('Iniciando scan de novas propensões...')} className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group">
                        <Zap size={18} className="group-hover:fill-current" /> Identificar Novos
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0">
                {/* Penetration Chart (8/12) */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation overflow-hidden flex flex-col h-full group">
                        <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-electric-blue shadow-sm">
                                    {/* 10. Icon corrected */}
                                    <BarChart3 size={24} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Penetração de Adicionais</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Produtos Agregados por Volume de Fechamento</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 pt-4 flex-1 min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={crossSalesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1.25rem', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '1rem' }} />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={48}>
                                        {crossSalesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Integration Panel (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-10">
                    {/* 5. Design: Unified color pattern */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden flex flex-col h-full relative group">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-electric-blue/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-electric-blue/10 transition-all" />
                        
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Oportunidades IA</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Propensão de Conversão High-End</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6 flex-1 relative z-10">
                            {opportunities.map((opt, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ x: 5 }}
                                    // 15. Acessibilidade fix
                                    tabIndex={0}
                                    role="button"
                                    className="bg-gray-50/50 border border-gray-100 p-5 rounded-3xl hover:bg-white hover:shadow-xl transition-all cursor-pointer group/item relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-black text-sm text-pure-black uppercase tracking-tight">{opt.client}</h4>
                                        {/* 11. Typography fix for score */}
                                        <Badge className={cn("text-[10px] font-black border shadow-sm px-2.5 py-1 rounded-lg", opt.bg, opt.color)}>
                                            {opt.score}% <span className="ml-1 opacity-60">SCORE</span>
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{opt.car}</p>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                        <span className="text-[9px] font-black text-electric-blue uppercase tracking-[0.3em]">{opt.potential}</span>
                                        <ArrowRight size={14} className="text-gray-300 group-hover/item:text-pure-black group-hover/item:translate-x-1 transition-all" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        <div className="p-8 pt-0 relative z-10">
                            <button className="w-full py-4 rounded-full bg-pure-black text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-lg">
                                <MessageCircle size={16} /> Disparar Insights
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-32 shrink-0">
                {stats.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border border-gray-100 shadow-sm rounded-[2.2rem] p-8 hover:shadow-xl transition-all group relative overflow-hidden"
                    >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <card.icon size={22} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 uppercase tracking-widest shadow-sm">
                                <TrendingUp size={12} strokeWidth={3} /> {card.trend}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">{card.title}</p>
                            <h3 className="text-3xl font-black text-pure-black tracking-tighter font-mono-numbers mb-1">{card.value}</h3>
                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{card.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
