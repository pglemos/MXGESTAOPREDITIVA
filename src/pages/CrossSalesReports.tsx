import { Share2, Zap, ArrowRight, ShieldCheck, Heart, Layers, TrendingUp, RefreshCw, X, Download, Filter, MessageCircle, BarChart3, Bot, Star, ChevronRight, Target } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

export default function CrossSalesReports() {
    const { refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)

    const crossSalesData = [
        { name: 'Financiamento', value: 78, color: '#4f46e5' },
        { name: 'Seguros', value: 45, color: '#10b981' },
        { name: 'Blindagem', value: 12, color: '#f59e0b' },
        { name: 'Acessórios', value: 92, color: '#6366f1' },
        { name: 'Garantia Ext', value: 34, color: '#ef4444' },
    ]

    const opportunities = [
        { client: 'Pedro Santos', car: 'Porsche 911', potential: 'Blindagem/Seguro', score: 94, tone: 'success' },
        { client: 'Mariana Lima', car: 'BMW M2', potential: 'Financiamento/Acessórios', score: 88, tone: 'success' },
        { client: 'Roberto Silva', car: 'Audi RS6', potential: 'Seguro/Garantia', score: 72, tone: 'warning' },
    ]

    const stats = [
        { title: 'Taxa Cross-Sell', value: '42%', trend: '+8.4%', icon: Share2, sub: 'MÉDIA GLOBAL', tone: 'brand' },
        { title: 'Receita Agregada', value: 'R$ 2.4M', trend: '+12%', icon: TrendingUp, sub: 'MARGEM INCREMENTAL', tone: 'success' },
        { title: 'Satisfação', value: '4.8/5.0', trend: '+0.2', icon: Heart, sub: 'NPS PÓS-VENDA', tone: 'error' },
        { title: 'Conversão Seguro', value: '58%', trend: '-2.1%', icon: ShieldCheck, sub: 'RENOVAÇÕES ATIVAS', tone: 'info' },
    ]

    const handleRefresh = async () => {
        setIsRefetching(true); await refetchAll?.(); setIsRefetching(false)
        toast.success('BI atualizado com sucesso!')
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / BI Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Vendas <span className="text-brand-primary">Cruzadas</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">REVENUE MAXIMIZATION • BUSINESS INTELLIGENCE</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-full shadow-mx-sm uppercase font-black tracking-widest text-[10px]">
                        <Filter size={16} className="mr-2" /> CONFIGURAR MIX
                    </Button>
                    <Button onClick={() => toast.info('Scan de propensões ativo...')} className="h-12 px-8 rounded-full shadow-mx-lg bg-brand-secondary">
                        <Zap size={18} className="mr-2" /> IDENTIFICAR NOVOS
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                <section className="lg:col-span-8">
                    <Card className="h-full border-none shadow-mx-lg bg-white overflow-hidden group">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-8 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-mx-xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm group-hover:scale-110 transition-transform"><BarChart3 size={24} strokeWidth={2.5} /></div>
                                <div>
                                    <Typography variant="h3">Penetração de Adicionais</Typography>
                                    <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">PRODUTOS AGREGADOS POR VOLUME</Typography>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={crossSalesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}} 
                                        contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '12px' }} 
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                        {crossSalesData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                <aside className="lg:col-span-4">
                    <Card className="h-full border-none shadow-mx-lg bg-white relative overflow-hidden group flex flex-col">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                        
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-8 flex flex-row items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform -rotate-2"><Bot size={24} /></div>
                            <div>
                                <Typography variant="h3">Oportunidades IA</Typography>
                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1">PROPENSÃO HIGH-END</Typography>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 space-y-4 flex-1 relative z-10 overflow-y-auto no-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {opportunities.map((opt, i) => (
                                    <motion.article key={i} whileHover={{ x: 5 }} className="bg-surface-alt/50 border border-border-default p-6 rounded-mx-xl hover:bg-white hover:shadow-mx-md transition-all cursor-pointer group/item">
                                        <div className="flex justify-between items-start mb-4">
                                            <Typography variant="h3" className="text-sm uppercase tracking-tight">{opt.client}</Typography>
                                            <Badge variant={opt.tone as any} className="text-[9px] font-black border-none px-3 py-1 rounded-full shadow-sm">{opt.score}% SCORE</Badge>
                                        </div>
                                        <Typography variant="caption" tone="muted" className="text-[8px] opacity-60 mb-6 block uppercase">{opt.car}</Typography>
                                        <div className="flex items-center justify-between border-t border-border-default pt-4">
                                            <Typography variant="caption" tone="brand" className="text-[9px] font-black uppercase tracking-widest">{opt.potential}</Typography>
                                            <ArrowRight size={14} className="text-text-tertiary group-hover/item:text-brand-primary group-hover/item:translate-x-1 transition-all" />
                                        </div>
                                    </motion.article>
                                ))}
                            </AnimatePresence>
                        </CardContent>
                        
                        <footer className="p-8 pt-0 relative z-10 mt-auto">
                            <Button className="w-full h-14 rounded-full shadow-mx-lg bg-brand-secondary font-black uppercase tracking-widest text-[10px]">
                                <MessageCircle size={16} className="mr-2" /> DISPARAR INSIGHTS
                            </Button>
                        </footer>
                    </Card>
                </aside>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg pb-32 shrink-0">
                {stats.map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-8 border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className={cn("w-14 h-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    card.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    card.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                                    card.tone === 'error' ? 'bg-status-error-surface border-mx-rose-100 text-status-error' :
                                    'bg-status-info-surface border-mx-blue-100 text-status-info'
                                )}>
                                    <card.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-status-success bg-status-success-surface px-4 py-1.5 rounded-full border border-mx-emerald-100 uppercase tracking-widest shadow-sm">
                                    <TrendingUp size={12} strokeWidth={3} /> {card.trend}
                                </div>
                            </div>
                            <div className="relative z-10">
                                <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest">{card.title}</Typography>
                                <Typography variant="h1" className="text-4xl tabular-nums leading-none mb-2">{card.value}</Typography>
                                <Typography variant="caption" tone="muted" className="text-[8px] font-black tracking-tighter opacity-40">{card.sub}</Typography>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </main>
    )
}
