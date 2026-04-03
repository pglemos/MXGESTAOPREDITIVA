import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Calendar, PiggyBank, Receipt, CreditCard, RefreshCw, Download, Filter, Search, X, Activity, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/main'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function Financeiro() {
    const { commissions, refetch: refetchAll } = useAppStore()
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSeller, setSelectedSeller] = useState('all')

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

    const stats = useMemo(() => {
        const total = commissions.reduce((sum, c) => sum + (c.comission || 0), 0)
        const tax = total * 0.06
        return { bruto: total, custos: tax, ebitda: total - tax }
    }, [commissions])

    const fluxData = useMemo(() => {
        return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map(m => ({
            month: m, entrada: stats.bruto * (0.8 + Math.random() * 0.4), saida: stats.custos * (0.8 + Math.random() * 0.4)
        }))
    }, [stats])

    const filteredCommissions = useMemo(() => {
        return commissions.filter(c => {
            const matches = c.seller.toLowerCase().includes(searchTerm.toLowerCase()) || c.car.toLowerCase().includes(searchTerm.toLowerCase())
            return matches && (selectedSeller === 'all' || c.seller === selectedSeller)
        })
    }, [commissions, searchTerm, selectedSeller])

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-status-success rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Tesouraria & <span className="text-status-success">Margens</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Controle de Lucratividade Operacional</p>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm">
                    <button onClick={() => refetchAll?.()} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-90 transition-all"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <div className="flex items-center gap-2 px-mx-md py-4 rounded-full border border-border-default bg-white shadow-mx-sm"><Calendar size={18} className="text-status-success" /><span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Ciclo: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span></div>
                    <button onClick={() => toast.success('Gerando Report Financeiro...')} className="w-12 h-12 rounded-mx-lg border border-border-default bg-white text-text-tertiary shadow-mx-sm hover:text-status-success transition-all flex items-center justify-center"><Download size={20} /></button>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {[
                    { label: 'Comissionamento Bruto', value: stats.bruto, icon: TrendingUp, color: 'text-status-success', bg: 'bg-status-success-surface', status: 'Performance Alta' },
                    { label: 'Deduções Estimadas', value: stats.custos, icon: TrendingDown, color: 'text-status-error', bg: 'bg-status-error-surface', status: 'Taxas & Impostos' },
                    { label: 'Líquido de Repasse', value: stats.ebitda, icon: Wallet, color: 'text-mx-white', bg: 'bg-brand-secondary', elite: true }
                ].map((item, i) => (
                    <div key={i} className={cn("mx-card p-mx-lg flex flex-col justify-between group relative overflow-hidden", item.elite && "bg-brand-secondary text-white shadow-mx-elite")}>
                        {!item.elite && <div className={cn("absolute -right-4 -top-4 w-32 h-32 opacity-5 rounded-full blur-3xl transition-opacity", item.bg)} />}
                        <div className="flex items-center justify-between mb-mx-lg relative z-10">
                            <div className={cn("w-14 h-14 rounded-mx-lg flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", item.elite ? "bg-white/10 border-white/10" : "bg-white border-border-default", item.color)}>
                                <item.icon size={28} strokeWidth={2.5} />
                            </div>
                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none px-3 h-6 rounded-lg shadow-sm", item.elite ? "bg-status-success text-white" : "bg-white text-text-tertiary")}>{item.status || 'EBITDA Saudável'}</Badge>
                        </div>
                        <div className="relative z-10">
                            <p className={cn("mx-text-caption mb-1", item.elite ? "text-white/40" : "opacity-60")}>{item.label}</p>
                            <p className="text-4xl font-black tracking-tighter font-mono-numbers leading-none">{formatCurrency(item.value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                <div className="lg:col-span-7"><Card className="h-full overflow-hidden"><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Fluxo de Distribuição</CardTitle><CardDescription>Entradas vs Saídas de Margem</CardDescription></div><div className="flex items-center gap-2 bg-white border border-border-default px-mx-sm py-1.5 rounded-mx-md shadow-mx-sm mx-text-caption !text-[8px] uppercase animate-pulse"><Activity size={12} className="text-status-success" /> Live Matrix</div></CardHeader><div className="p-mx-lg" style={{ height: '350px', minHeight: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={fluxData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs><linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                            <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 800 }} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800, fontSize: 10 }} />
                            <YAxis hide />
                            <Area type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorEntrada)" />
                            <Area type="monotone" dataKey="saida" stroke="#f97316" strokeWidth={2} fill="transparent" strokeDasharray="10 10" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div></Card></div>

                <div className="lg:col-span-5"><Card className="h-full flex flex-col"><CardHeader className="bg-mx-slate-50/30 border-b border-border-subtle"><div className="flex items-center gap-mx-sm"><div className="w-10 h-10 rounded-mx-md bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Receipt size={20} /></div><div><CardTitle className="!text-lg">Repasses Recentes</CardTitle><p className="mx-text-caption !text-[8px]">Últimas 5 Conversões</p></div></div></CardHeader><div className="flex-1 overflow-y-auto no-scrollbar"><table className="w-full text-left">
                    <tbody className="divide-y divide-border-subtle">
                        {commissions.slice(0, 5).map((c) => (
                            <tr key={c.id} className="hover:bg-mx-slate-50/50 transition-colors group">
                                <td className="pl-mx-lg py-mx-md">
                                    <p className="font-black text-sm text-text-primary group-hover:text-status-success transition-colors uppercase tracking-tight">{c.seller}</p>
                                    <p className="mx-text-caption !text-[8px] opacity-60 uppercase">{c.car}</p>
                                </td>
                                <td className="pr-mx-lg py-mx-md text-right">
                                    <p className="font-mono-numbers font-black text-lg text-status-success leading-none mb-1">{formatCurrency(c.comission)}</p>
                                    <span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Liquidado</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table></div></Card></div>
            </div>

            <Card className="mb-mx-3xl overflow-hidden"><CardHeader className="flex-col xl:flex-row xl:items-center justify-between gap-mx-lg bg-mx-slate-50/30">
                <div className="flex items-center gap-mx-md"><div className="w-14 h-14 rounded-mx-lg bg-status-success text-white flex items-center justify-center shadow-mx-lg transform -rotate-3"><CreditCard size={28} strokeWidth={2.5} /></div><div><CardTitle className="!text-3xl">Painel de Comissões</CardTitle><CardDescription className="!text-xs">Detalhamento tático de lucratividade por unidade operacional.</CardDescription></div></div>
                <div className="flex flex-col sm:flex-row gap-mx-sm items-center"><div className="relative group w-full sm:w-64"><Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-status-success" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar especialista..." className="mx-input !h-11 !pl-11 !text-[10px]" /></div><button className="mx-button-primary !h-11 !px-6 !bg-white !text-text-primary border border-border-default flex items-center gap-2"><Filter size={14} /> Filtrar Tropa</button></div>
            </CardHeader><div className="overflow-x-auto no-scrollbar"><table className="w-full text-left min-w-[900px]">
                <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Especialista</th><th className="py-mx-md uppercase tracking-[0.3em]">Ativo Comercial</th><th className="py-mx-md uppercase tracking-[0.3em]">Data Fixada</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Margem BI</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Líquido Creditado</th></tr></thead>
                <tbody className="divide-y divide-border-subtle bg-white">
                    {filteredCommissions.map((c, i) => (
                        <tr key={c.id} className={cn('hover:bg-mx-slate-50/50 transition-colors h-20 group border-none', i % 2 !== 0 && 'bg-mx-slate-50/20')}>
                            <td className="pl-mx-lg py-4"><span className="font-black text-sm text-text-primary uppercase tracking-tight group-hover:text-status-success transition-colors">{c.seller}</span></td>
                            <td className="py-4"><span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{c.car}</span></td>
                            <td className="py-4 font-bold text-xs text-text-tertiary font-mono-numbers">{c.date}</td>
                            <td className="py-4 text-center"><Badge variant="secondary" className="bg-status-success-surface text-status-success border-mx-emerald-100 font-mono-numbers text-[10px]">{c.margin}</Badge></td>
                            <td className="pr-mx-lg py-4 text-right"><span className="font-black text-xl text-status-success font-mono-numbers tracking-tighter">{formatCurrency(c.comission)}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table></div></Card>
        </div>
    )
}
