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
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Calculando Matriz BI...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / BI Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Análise de <span className="text-brand-primary">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">BUSINESS INTELLIGENCE • LIVE AUDIT MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="w-mx-14 h-mx-14 rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-mx-xs px-6 h-mx-14 rounded-mx-full border border-border-default bg-white shadow-mx-sm">
                        <Calendar size={18} className="text-brand-primary" />
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Ciclo {format(new Date(), 'yyyy')}</Typography>
                    </div>
                    <Button variant="secondary" className="h-mx-14 px-8 rounded-mx-full shadow-mx-xl font-black uppercase tracking-widest text-mx-tiny">
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
                        <Card className="p-4 md:p-mx-lg border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-mx-0 right-mx-0 w-mx-3xl h-mx-3xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-12 -mt-12" />
                            <div className="flex items-center gap-mx-md relative z-10">
                                <div className={cn("w-mx-14 h-mx-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                                    'bg-status-success-surface border-mx-emerald-100 text-status-success'
                                )}>
                                    <stat.icon size={24} strokeWidth={2} />
                                </div>
                                <div className="flex-1">
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase font-black tracking-widest text-mx-micro">{stat.title}</Typography>
                                    <div className="flex items-center justify-between">
                                        <Typography variant="h1" className="text-3xl tabular-nums leading-none">{stat.value}</Typography>
                                        <Badge variant={stat.tone as any} className="text-mx-micro px-3 py-1 font-black shadow-sm">{stat.trend}</Badge>
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
                        <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl uppercase">Evolução de Sell-out</CardTitle>
                                <CardDescription className="uppercase tracking-widest font-black text-mx-micro mt-1 opacity-60">VOLUME CONSOLIDADO MENSAL • ARENA REDE</CardDescription>
                            </div>
                            <Badge variant="brand" className="animate-pulse px-4 py-1.5 rounded-mx-full">LIVE MATRIX</Badge>
                        </CardHeader>
                        <CardContent className="p-mx-10 h-mx-section-md">
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
                    <Card className="p-mx-10 md:p-14 bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden flex-1 group">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/10 rounded-mx-full blur-mx-xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                        
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 shadow-inner mb-10 transform group-hover:rotate-6 transition-transform"><Activity size={32} /></div>
                                <Typography variant="h2" tone="white" className="text-3xl leading-none mb-4 uppercase tracking-tighter">Saúde da Rede</Typography>
                                <Typography variant="p" tone="white" className="opacity-60 text-xs font-bold uppercase tracking-mx-wide italic leading-relaxed">"Ritmo operacional sincronizado com a meta projetada para o ciclo atual."</Typography>
                            </div>
                            
                            <div className="pt-14 border-t border-white/10 mt-14 space-y-mx-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <Typography variant="caption" tone="white" className="opacity-40 font-black uppercase tracking-widest mb-2 block">Eficiência Real</Typography>
                                        <Typography variant="h1" tone="white" className="text-7xl tabular-nums leading-none tracking-tighter">{metrics.reaching}%</Typography>
                                    </div>
                                    <Badge variant="outline" className="text-white border-white/20 mb-2 uppercase font-black">TARGET OK</Badge>
                                </div>
                                <div className="h-mx-sm w-full bg-white/5 rounded-mx-full overflow-hidden p-mx-tiny shadow-inner border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(metrics.reaching, 100)}%` }} transition={{ duration: 2, ease: "circOut" }}
                                        className="h-full bg-white rounded-mx-full shadow-mx-glow-white transition-all duration-1000" 
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
