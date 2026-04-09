import { useState, useMemo, useCallback } from 'react'
import { 
    TrendingUp, Calendar, Download, RefreshCw, 
    ChevronDown, Activity, Target, Zap, Award,
    History, ShieldCheck
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals, useStoreMetaRules } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { somarVendas, calcularProjecao, getDiasInfo, calcularAtingimento } from '@/lib/calculations'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SalesPerformance() {
    const { checkins, loading: loadingCheckins, fetchCheckins } = useCheckins()
    const { storeGoal, loading: loadingGoals, fetchGoals } = useGoals()
    const { metaRules, fetchMetaRules } = useStoreMetaRules()
    
    const [isRefetching, setIsRefetching] = useState(false)

    const daysInfo = useMemo(() => getDiasInfo(), [])
    
    const metrics = useMemo(() => {
        const currentSales = somarVendas(checkins)
        const teamGoal = metaRules?.monthly_goal ?? storeGoal?.target ?? 0
        const projection = calcularProjecao(currentSales, daysInfo.decorridos, daysInfo.total)
        const reaching = calcularAtingimento(currentSales, teamGoal)
        
        return { currentSales, teamGoal, projection, reaching }
    }, [checkins, metaRules, storeGoal, daysInfo])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await Promise.all([fetchCheckins(), fetchGoals(), fetchMetaRules()])
        setIsRefetching(false)
        toast.success('Performance sincronizada!')
    }, [fetchCheckins, fetchGoals, fetchMetaRules])

    if (loadingCheckins || loadingGoals) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Calculando Matriz BI...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / BI Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Análise de <span className="text-brand-primary">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">BUSINESS INTELLIGENCE • LIVE AUDIT MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-14 h-14 rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-3 px-6 h-14 rounded-full border border-border-default bg-white shadow-mx-sm">
                        <Calendar size={18} className="text-brand-primary" />
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Ciclo {format(new Date(), 'yyyy')}</Typography>
                    </div>
                    <Button variant="secondary" className="h-14 px-8 rounded-full shadow-mx-xl font-black uppercase tracking-widest text-[10px]">
                        <Download size={18} className="mr-2" /> EXPORTAR BI
                    </Button>
                </div>
            </header>

            {/* Tactical Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {[
                    { title: 'Volume Bruto', value: metrics.currentSales, trend: `${metrics.reaching}%`, icon: Zap, tone: 'brand' },
                    { title: 'Meta Mensal', value: metrics.teamGoal, trend: 'Alvo', icon: Target, tone: 'info' },
                    { title: 'Projeção MX', value: metrics.projection, trend: 'Predictive', icon: TrendingUp, tone: 'success' },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-8 border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className={cn("w-14 h-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.tone === 'info' ? 'bg-status-info-surface border-mx-blue-100 text-status-info' :
                                    'bg-status-success-surface border-mx-emerald-100 text-status-success'
                                )}>
                                    <stat.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase font-black tracking-widest text-[8px]">{stat.title}</Typography>
                                    <div className="flex items-center justify-between">
                                        <Typography variant="h1" className="text-3xl tabular-nums leading-none">{stat.value}</Typography>
                                        <Badge variant={stat.tone as any} className="text-[8px] px-3 py-1 font-black shadow-sm">{stat.trend}</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* BI Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-32">
                <section className="lg:col-span-8">
                    <Card className="h-full border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl uppercase">Evolução de Sell-out</CardTitle>
                                <CardDescription className="uppercase tracking-widest font-black text-[9px] mt-1 opacity-60">VOLUME CONSOLIDADO MENSAL • ARENA REDE</CardDescription>
                            </div>
                            <Badge variant="brand" className="animate-pulse px-4 py-1.5 rounded-full">LIVE MATRIX</Badge>
                        </CardHeader>
                        <CardContent className="p-10 h-[450px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1.5rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '16px' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" dot={{ r: 6, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 md:p-14 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden flex-1 group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                        
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-16 h-16 rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner mb-10 transform group-hover:rotate-6 transition-transform"><Activity size={32} /></div>
                                <Typography variant="h2" tone="white" className="text-3xl leading-none mb-4 uppercase tracking-tighter">Saúde da Rede</Typography>
                                <Typography variant="p" tone="white" className="opacity-60 text-xs font-bold uppercase tracking-[0.2em] italic leading-relaxed">"Ritmo operacional sincronizado com a meta projetada para o ciclo atual."</Typography>
                            </div>
                            
                            <div className="pt-14 border-t border-white/10 mt-14 space-y-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <Typography variant="caption" tone="white" className="opacity-40 font-black uppercase tracking-widest mb-2 block">Eficiência Real</Typography>
                                        <Typography variant="h1" tone="white" className="text-7xl tabular-nums leading-none tracking-tighter">{metrics.reaching}%</Typography>
                                    </div>
                                    <Badge variant="outline" className="text-white border-white/20 mb-2 uppercase font-black">TARGET OK</Badge>
                                </div>
                                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 shadow-inner border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(metrics.reaching, 100)}%` }} transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-1000" 
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
