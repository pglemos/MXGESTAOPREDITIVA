import { BarChart3, LineChart as LineChartIcon, FileText, Download, Timer, Package, TrendingDown, ArrowUpRight, ArrowDownRight, Filter, RefreshCw, X, PieChart as PieChartIcon, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { reportLucratividade, reportCiclo, reportDescontos } from '@/lib/mock-data'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts'
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
        { name: '0-15 dias', value: 45, color: 'var(--color-status-success)' },
        { name: '16-30 dias', value: 30, color: 'var(--color-brand-primary)' },
        { name: '31-45 dias', value: 15, color: 'var(--color-status-warning)' },
        { name: '46+ dias', value: 10, color: 'var(--color-status-error)' },
    ]

    const stockStats = [
        { title: 'Giro de Estoque', value: '2.4x', trend: '+0.3', icon: Package, color: 'text-brand-primary', bg: 'bg-brand-primary-surface' },
        { title: 'Permanência Média', value: '18 dias', trend: '-2 dias', icon: Timer, color: 'text-status-success', bg: 'bg-status-success-surface' },
        { title: 'Custo de Pátio', value: 'R$ 42k', trend: '+5%', icon: TrendingDown, color: 'text-status-error', bg: 'bg-status-error-surface' },
    ]

    const handleRefresh = async () => {
        setIsRefetching(true); await refetchAll?.(); setIsRefetching(false); toast.success('Auditoria de ativos atualizada!')
    }

    const processedDescontos = useMemo(() => {
        return reportDescontos.filter(d => d.seller.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [searchTerm])

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Giro de <span className="text-brand-primary">Estoque</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase tracking-widest">Stock Aging & Velocity Matrix</p>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={handleRefresh} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <button className="mx-button-primary bg-white !text-text-primary border border-border-default flex items-center gap-2"><Filter size={16} /> Unidades</button>
                    <button onClick={() => toast.success('Compilando Report...')} className="mx-button-primary bg-brand-secondary"><Download size={18} /> Exportar Report</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {stockStats.map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="mx-card p-mx-lg hover:shadow-mx-lg transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-mx-md relative z-10">
                            <div className={cn("w-14 h-14 rounded-mx-lg flex items-center justify-center border border-border-default shadow-inner transition-transform group-hover:scale-110", stat.bg, stat.color)}><stat.icon size={28} strokeWidth={2.5} /></div>
                            <div>
                                <p className="mx-text-caption mb-1">{stat.title}</p>
                                <div className="flex items-baseline gap-mx-sm">
                                    <h3 className="text-2xl font-black tracking-tighter font-mono-numbers">{stat.value}</h3>
                                    <Badge className={cn("text-[8px] border-none px-2", stat.title.includes('Custo') ? 'bg-status-error-surface text-status-error' : 'bg-status-success-surface text-status-success')}>{stat.trend}</Badge>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                <div className="lg:col-span-8"><Card className="h-full"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Maturidade de Saída</CardTitle><CardDescription>Tempo Médio de Escoamento</CardDescription></div><LineChartIcon size={24} className="text-brand-primary" /></CardHeader><div className="p-mx-lg h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportCiclo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 10 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 10 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 800 }} />
                            <Line type="monotone" dataKey="dias" stroke="#4f46e5" strokeWidth={5} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div></Card></div>

                <div className="lg:col-span-4"><Card className="h-full flex flex-col"><CardHeader><CardTitle>Distribuição de Idade</CardTitle><CardDescription>Aging Operacional</CardDescription></CardHeader><div className="p-mx-lg flex-1 flex flex-col items-center">
                    <div className="h-[180px] w-full mb-mx-md">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stockAgingData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                                    {stockAgingData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-2">
                        {stockAgingData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-mx-md bg-mx-slate-50 border border-border-subtle hover:bg-white transition-all">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[10px] font-black uppercase tracking-tight">{item.name}</span></div>
                                <span className="text-xs font-black font-mono-numbers text-text-tertiary">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div></Card></div>
            </div>

            <Card className="mb-mx-3xl overflow-hidden"><CardHeader className="flex-col md:flex-row md:items-center justify-between gap-mx-lg bg-mx-slate-50/30">
                <div className="flex items-center gap-mx-md"><div className="w-14 h-14 rounded-mx-lg bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg transform -rotate-3"><RefreshCw size={28} strokeWidth={2.5} /></div><div><CardTitle className="!text-3xl">Giro por Consultor</CardTitle><CardDescription className="!text-xs">Eficiência de escoamento individual da tropa.</CardDescription></div></div>
                <div className="relative group w-full md:w-80"><Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar consultor..." className="mx-input !h-11 !pl-11 !text-[10px]" /></div>
            </CardHeader><div className="overflow-x-auto no-scrollbar"><table className="w-full text-left min-w-[800px]">
                <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Especialista de Elite</th><th className="py-mx-md uppercase tracking-[0.3em] text-right">Giro Médio (UN)</th><th className="py-mx-md uppercase tracking-[0.3em] text-right">Ticket Médio</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-border-subtle bg-white">
                    {processedDescontos.map((d, i) => (
                        <tr key={d.seller} className={cn("hover:bg-mx-slate-50/50 transition-colors h-20 group border-none", i % 2 !== 0 && "bg-mx-slate-50/20")}>
                            <td className="pl-mx-lg py-4"><div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-[10px] shadow-inner group-hover:bg-brand-secondary group-hover:text-white transition-all uppercase">{d.seller.substring(0, 2)}</div><span className="font-black text-sm text-text-primary uppercase tracking-tight group-hover:text-brand-primary transition-colors">{d.seller}</span></div></td>
                            <td className="py-4 text-right"><span className="font-black text-lg text-text-primary font-mono-numbers">{d.totalSales} un</span></td>
                            <td className="py-4 text-right"><span className="font-bold text-xs text-text-tertiary font-mono-numbers">R$ 184.000</span></td>
                            <td className="pr-mx-lg py-4 text-right"><Badge className={cn("text-[8px] font-black h-8 rounded-full", i < 2 ? "bg-status-success-surface text-status-success border-mx-emerald-100" : "bg-status-warning-surface text-status-warning border-mx-amber-100")}>{i < 2 ? 'ALTA PERFORMANCE' : 'ESTÁVEL'}</Badge></td>
                        </tr>
                    ))}
                </tbody>
            </table></div></Card>
        </div>
    )
}
