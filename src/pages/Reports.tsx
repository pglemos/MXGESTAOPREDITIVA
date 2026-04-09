import { BarChart3, LineChart as LineChartIcon, FileText, Download, Timer, Package, TrendingDown, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, X, PieChart as PieChartIcon, Search, Target, Zap, History } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { reportLucratividade, reportCiclo, reportDescontos } from '@/lib/mock-data'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, AreaChart, Area } from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import useAppStore from '@/stores/main'

export default function Reports() {
    const { refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const stockAgingData = [
        { name: '0-15 dias', value: 45, color: '#10b981' },
        { name: '16-30 dias', value: 30, color: '#4f46e5' },
        { name: '31-45 dias', value: 15, color: '#f59e0b' },
        { name: '46+ dias', value: 10, color: '#ef4444' },
    ]

    const stockStats = [
        { title: 'Giro de Estoque', value: '2.4x', trend: '+0.3', icon: Package, tone: 'brand' },
        { title: 'Permanência Média', value: '18 dias', trend: '-2 dias', icon: Timer, tone: 'success' },
        { title: 'Custo de Pátio', value: 'R$ 42k', trend: '+5%', icon: TrendingDown, tone: 'error' },
    ]

    const handleRefresh = async () => {
        setIsRefetching(true); await refetchAll?.(); setIsRefetching(false); toast.success('Auditoria de ativos atualizada!')
    }

    const processedDescontos = useMemo(() => {
        return reportDescontos.filter(d => d.seller.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [searchTerm])

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Reports Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Giro de <span className="text-brand-primary">Estoque</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">STOCK AGING & VELOCITY MATRIX • MX PERFORMANCE</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <Button variant="outline" className="h-12 px-6 rounded-full shadow-mx-sm uppercase font-black tracking-widest text-[10px]">
                        <Filter size={16} className="mr-2" /> UNIDADES
                    </Button>
                    <Button onClick={() => toast.success('Compilando Snapshot...')} className="h-12 px-8 rounded-full shadow-mx-lg bg-brand-secondary">
                        <Download size={18} className="mr-2" /> EXPORTAR REPORT
                    </Button>
                </div>
            </header>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {stockStats.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className="p-8 border-none shadow-mx-sm hover:shadow-mx-lg transition-all group relative overflow-hidden bg-white">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
                            <div className="flex items-center gap-6 relative z-10">
                                <div className={cn("w-14 h-14 rounded-mx-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", 
                                    stat.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                    stat.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                                    'bg-status-error-surface border-mx-rose-100 text-status-error'
                                )}>
                                    <stat.icon size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1">
                                    <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-widest text-[8px]">{stat.title}</Typography>
                                    <div className="flex items-center justify-between">
                                        <Typography variant="h1" className="text-3xl tabular-nums leading-none">{stat.value}</Typography>
                                        <Badge variant={stat.tone as any} className="text-[8px] px-2 h-5">{stat.trend}</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main BI Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                <section className="lg:col-span-8">
                    <Card className="h-full border-none shadow-mx-lg bg-white overflow-hidden">
                        <CardHeader className="bg-surface-alt/20 border-b border-border-default p-8 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Maturidade de Saída</CardTitle>
                                <CardDescription className="uppercase font-black text-[9px] tracking-widest mt-1">TEMPO MÉDIO DE ESCOAMENTO (D+1)</CardDescription>
                            </div>
                            <LineChartIcon size={24} className="text-brand-primary" strokeWidth={2.5} />
                        </CardHeader>
                        <CardContent className="p-10 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={reportCiclo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                                    <Line type="monotone" dataKey="dias" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                <aside className="lg:col-span-4">
                    <Card className="h-full border-none shadow-mx-lg bg-white flex flex-col group overflow-hidden">
                        <CardHeader className="bg-surface-alt/20 border-b border-border-default p-8">
                            <CardTitle className="text-xl">Distribuição de Idade</CardTitle>
                            <CardDescription className="uppercase font-black text-[9px] tracking-widest mt-1">AGING OPERACIONAL DA REDE</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 flex-1 flex flex-col items-center">
                            <div className="h-[200px] w-full mb-10 group-hover:scale-105 transition-transform duration-700">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stockAgingData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                                            {stockAgingData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-full space-y-3">
                                {stockAgingData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-mx-xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-md transition-all group/legend">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                                            <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase group-hover/legend:text-text-primary transition-colors">{item.name}</Typography>
                                        </div>
                                        <Typography variant="mono" className="text-xs font-black">{item.value}%</Typography>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>

            {/* Performance by Seller Table */}
            <Card className="mb-20 border-none shadow-mx-xl bg-white overflow-hidden">
                <CardHeader className="bg-surface-alt/30 border-b border-border-default p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform -rotate-3"><RefreshCw size={28} /></div>
                        <div>
                            <Typography variant="h2" className="text-2xl uppercase">Giro por Consultor</Typography>
                            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">AUDITORIA DE ESCOAMENTO INDIVIDUAL</Typography>
                        </div>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="BUSCAR ESPECIALISTA..." className="!h-12 !pl-11 !text-[10px] uppercase tracking-widest" />
                    </div>
                </CardHeader>
                
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="bg-surface-alt/50 border-b border-border-default text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary">
                                <th scope="col" className="pl-10 py-6">ESPECIALISTA DE ELITE</th>
                                <th scope="col" className="py-6 text-center">GIRO MÉDIO (UN)</th>
                                <th scope="col" className="py-6 text-center">TICKET MÉDIO</th>
                                <th scope="col" className="pr-10 py-6 text-right">STATUS PERFORMANCE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default">
                            {processedDescontos.map((d, i) => (
                                <tr key={d.seller} className={cn("hover:bg-surface-alt/30 transition-colors h-24 group")}>
                                    <td className="pl-10 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center font-black text-[11px] text-text-tertiary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner uppercase">{d.seller.substring(0, 2)}</div>
                                            <Typography variant="h3" className="text-sm uppercase tracking-tight group-hover:text-brand-primary transition-colors">{d.seller}</Typography>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <Typography variant="h1" className="text-2xl tabular-nums text-text-primary">{d.totalSales} <span className="text-xs font-black opacity-30">UN</span></Typography>
                                    </td>
                                    <td className="py-4 text-center">
                                        <Typography variant="mono" tone="muted" className="text-sm font-black">R$ 184.000</Typography>
                                    </td>
                                    <td className="pr-10 py-4 text-right">
                                        <Badge variant={i < 2 ? 'success' : 'warning'} className="px-6 py-2 rounded-full font-black text-[8px] tracking-widest shadow-sm border-none uppercase">
                                            {i < 2 ? 'ALTA PERFORMANCE' : 'ESTÁVEL'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </main>
    )
}
