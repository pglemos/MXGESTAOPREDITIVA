import { Share2, Zap, ArrowRight, ShieldCheck, Heart, Layers, TrendingUp, RefreshCw, X, Download, Filter, MessageCircle, BarChart3, Bot, Star, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'

export default function CrossSalesReports() {
    const { refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)

    const crossSalesData = [
        { name: 'Financiamento', value: 78, color: 'var(--color-brand-primary)' },
        { name: 'Seguros', value: 45, color: 'var(--color-status-success)' },
        { name: 'Blindagem', value: 12, color: 'var(--color-status-warning)' },
        { name: 'Acessórios', value: 92, color: 'var(--color-mx-indigo-500)' },
        { name: 'Garantia Ext', value: 34, color: 'var(--color-status-error)' },
    ]

    const opportunities = [
        { client: 'Pedro Santos', car: 'Porsche 911', potential: 'Blindagem/Seguro', score: 94, color: 'text-status-success', bg: 'bg-status-success-surface border-mx-emerald-100' },
        { client: 'Mariana Lima', car: 'BMW M2', potential: 'Financiamento/Acessórios', score: 88, color: 'text-status-success', bg: 'bg-status-success-surface border-mx-emerald-100' },
        { client: 'Roberto Silva', car: 'Audi RS6', potential: 'Seguro/Garantia', score: 72, color: 'text-status-warning', bg: 'bg-status-warning-surface border-mx-amber-100' },
    ]

    const stats = [
        { title: 'Taxa Cross-Sell', value: '42%', trend: '+8.4%', icon: Share2, sub: 'Média Global' },
        { title: 'Receita Agregada', value: 'R$ 2.4M', trend: '+12%', icon: TrendingUp, sub: 'Margem Incremental' },
        { title: 'Satisfação', value: '4.8/5.0', trend: '+0.2', icon: Heart, sub: 'NPS Pós-Venda' },
        { title: 'Conversão Seguro', value: '58%', trend: '-2.1%', icon: ShieldCheck, sub: 'Renovações Ativas' },
    ]

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Vendas <span className="text-brand-primary">Cruzadas</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Revenue Maximization BI</p>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <button onClick={() => refetchAll?.()} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <button className="mx-button-primary bg-white !text-text-primary border border-border-default flex items-center gap-2"><Filter size={16} /> Configurar Mix</button>
                    <button onClick={() => toast.info('Scan de propensões ativo...')} className="mx-button-primary bg-brand-secondary flex items-center gap-2"><Zap size={18} /> Identificar Novos</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                <div className="lg:col-span-8">
                    <div className="mx-card h-full flex flex-col overflow-hidden group">
                        <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-mx-slate-50/30">
                            <div className="flex items-center gap-mx-sm">
                                <div className="w-12 h-12 rounded-mx-lg bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm"><BarChart3 size={24} strokeWidth={2.5} /></div>
                                <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Penetração de Adicionais</h3><p className="mx-text-caption">Produtos Agregados por Volume</p></div>
                            </div>
                        </div>
                        <div className="p-mx-lg h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={crossSalesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1.25rem', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800 }} />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={48}>
                                        {crossSalesData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="mx-card h-full flex flex-col relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                        <div className="p-mx-lg border-b border-border-subtle flex items-center gap-mx-sm bg-mx-slate-50/30 relative z-10">
                            <div className="w-12 h-12 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Bot size={24} /></div>
                            <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Oportunidades IA</h3><p className="mx-text-caption">Propensão High-End</p></div>
                        </div>
                        <div className="p-mx-lg space-y-mx-sm flex-1 relative z-10">
                            {opportunities.map((opt, i) => (
                                <motion.div key={i} whileHover={{ x: 5 }} className="bg-mx-slate-50/50 border border-border-subtle p-mx-md rounded-mx-xl hover:bg-white hover:shadow-mx-lg transition-all cursor-pointer group/item">
                                    <div className="flex justify-between items-start mb-mx-sm">
                                        <h4 className="font-black text-sm text-text-primary uppercase tracking-tight">{opt.client}</h4>
                                        <Badge className={cn("text-[9px] font-black border-none px-2", opt.bg, opt.color)}>{opt.score}% <span className="ml-1 opacity-60">SCORE</span></Badge>
                                    </div>
                                    <p className="mx-text-caption !text-[8px] opacity-60 mb-mx-md">{opt.car}</p>
                                    <div className="flex items-center justify-between border-t border-border-subtle pt-mx-sm">
                                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">{opt.potential}</span>
                                        <ArrowRight size={14} className="text-mx-slate-200 group-hover/item:text-text-primary transition-all" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-mx-lg pt-0 relative z-10"><button className="mx-button-primary bg-brand-secondary w-full flex items-center justify-center gap-2"><MessageCircle size={16} /> Disparar Insights</button></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg pb-mx-3xl shrink-0">
                {stats.map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-lg hover:shadow-mx-lg transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-mx-lg relative z-10">
                            <div className="w-14 h-14 rounded-mx-lg bg-mx-indigo-50 text-brand-primary border border-mx-indigo-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><card.icon size={24} strokeWidth={2.5} /></div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-status-success bg-status-success-surface px-mx-sm py-1.5 rounded-full border border-mx-emerald-100 uppercase tracking-widest shadow-mx-sm"><TrendingUp size={12} strokeWidth={3} /> {card.trend}</div>
                        </div>
                        <div className="relative z-10">
                            <p className="mx-text-caption mb-1">{card.title}</p>
                            <h3 className="text-3xl font-black text-text-primary tracking-tighter font-mono-numbers mb-1">{card.value}</h3>
                            <p className="mx-text-caption !text-[8px] opacity-60 uppercase">{card.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
