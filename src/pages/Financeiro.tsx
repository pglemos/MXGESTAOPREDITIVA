import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Calendar, PiggyBank, Receipt, CreditCard, RefreshCw, Download, Filter, Search, X, Activity, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCommissions } from '@/hooks/useData'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts'
import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

export default function Financeiro() {
    const { commissions, loading, refetch } = useCommissions()
    const [isRefetching, setIsRefetching] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSeller, setSelectedSeller] = useState('all')

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(val)

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Matriz Financeira Sincronizada!')
    }

    const stats = useMemo(() => {
        const total = commissions.reduce((sum, c) => sum + (c.commission_amount || 0), 0)
        const tax = total * 0.06 // Simulação de impostos/custos operacionais
        return { bruto: total, custos: tax, ebitda: total - tax }
    }, [commissions])

    const fluxData = useMemo(() => {
        return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map(m => ({
            month: m, entrada: stats.bruto * (0.8 + Math.random() * 0.4), saida: stats.custos * (0.8 + Math.random() * 0.4)
        }))
    }, [stats])

    const filteredCommissions = useMemo(() => {
        return commissions.filter(c => {
            const matches = (c.seller_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.car || '').toLowerCase().includes(searchTerm.toLowerCase())
            return matches && (selectedSeller === 'all' || c.seller_id === selectedSeller)
        })
    }, [commissions, searchTerm, selectedSeller])

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-emerald-600" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-10 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-emerald-600 rounded-full shadow-lg" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Tesouraria & <span className="text-emerald-600">Margens</span></h1>
                    </div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] pl-6 mt-2">Controle de Lucratividade Operacional • MX Method</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button onClick={handleRefresh} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-emerald-600 active:scale-90 transition-all">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-6 py-3 shadow-sm">
                        <Calendar size={18} className="text-emerald-600" />
                        <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest">Ciclo: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <button onClick={() => toast.success('Gerando Report Financeiro...')} className="w-12 h-12 rounded-2xl border border-gray-100 bg-white text-gray-400 shadow-sm hover:text-emerald-600 transition-all flex items-center justify-center">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                {[
                    { label: 'Comissionamento Bruto', value: stats.bruto, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', status: 'Performance Alta' },
                    { label: 'Deduções Operacionais', value: stats.custos, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50', status: 'Taxas & Impostos' },
                    { label: 'Líquido de Repasse', value: stats.ebitda, icon: Wallet, color: 'text-white', bg: 'bg-slate-950', elite: true }
                ].map((item, i) => (
                    <div key={i} className={cn("bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-xl transition-all", item.elite && "bg-slate-950 text-white shadow-2xl shadow-indigo-100")}>
                        {!item.elite && <div className={cn("absolute -right-4 -top-4 w-32 h-32 opacity-5 rounded-full blur-3xl transition-opacity", item.bg)} />}
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110", item.elite ? "bg-white/10 border-white/10" : "bg-white border-gray-100", item.color)}>
                                <item.icon size={28} strokeWidth={2.5} />
                            </div>
                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none px-4 py-1.5 h-7 rounded-lg shadow-sm", item.elite ? "bg-emerald-500 text-white" : "bg-gray-50 text-gray-400")}>{item.status || 'EBITDA Saudável'}</Badge>
                        </div>
                        <div className="relative z-10">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2", item.elite ? "text-white/40" : "text-gray-400")}>{item.label}</p>
                            <p className="text-4xl font-black tracking-tighter font-mono-numbers leading-none">{formatCurrency(item.value)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0">
                <div className="lg:col-span-7">
                    <Card className="h-full border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="flex-row items-center justify-between p-10 bg-gray-50/30 border-b border-gray-50">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Fluxo de Distribuição</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest mt-1">Entradas vs Saídas de Margem</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2 rounded-xl shadow-sm text-[8px] font-black uppercase tracking-widest animate-pulse">
                                <Activity size={12} className="text-emerald-500" /> Live Matrix
                            </div>
                        </CardHeader>
                        <div className="p-10 flex items-center justify-center min-h-[350px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={fluxData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1.5rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 900, fontSize: 10 }} />
                                    <YAxis hide />
                                    <Area type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrada)" />
                                    <Area type="monotone" dataKey="saida" stroke="#f97316" strokeWidth={2} fill="transparent" strokeDasharray="8 8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-5">
                    <Card className="h-full flex flex-col border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-950 border-b border-slate-900 p-10 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-lg border border-white/10">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black uppercase tracking-tight">Repasses Recentes</CardTitle>
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">Últimas 5 Conversões</p>
                                </div>
                            </div>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-gray-50">
                                    {commissions.slice(0, 5).map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group h-24">
                                            <td className="pl-10 py-4">
                                                <p className="font-black text-sm text-slate-950 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{c.seller_name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{c.car}</p>
                                            </td>
                                            <td className="pr-10 py-4 text-right">
                                                <p className="font-mono-numbers font-black text-xl text-emerald-600 leading-none mb-1">{formatCurrency(c.commission_amount)}</p>
                                                <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">Liquidado</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="mb-20 overflow-hidden border-gray-100 shadow-sm rounded-[3rem]">
                <CardHeader className="flex-col xl:flex-row xl:items-center justify-between gap-10 bg-gray-50/30 border-b border-gray-50 p-10 md:p-14">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center shadow-xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                            <CreditCard size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black uppercase tracking-tighter">Painel de Comissões</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-2">Detalhamento tático de lucratividade por unidade.</CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative group w-full sm:w-72">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="Filtrar especialista ou veículo..." 
                                className="w-full h-12 pl-12 pr-6 bg-white border border-gray-200 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-emerald-400 transition-all shadow-inner" 
                            />
                        </div>
                        <button className="h-12 px-8 bg-white border border-gray-200 text-slate-950 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all">
                            <Filter size={14} /> Filtrar Tropa
                        </button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="pl-14 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Especialista</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Ativo Comercial</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Data Fixada</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 text-center">Margem</th>
                                <th className="pr-14 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 text-right">Líquido Creditado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCommissions.map((c, i) => (
                                <tr key={c.id} className={cn('hover:bg-gray-50/50 transition-colors h-24 group', i % 2 !== 0 && 'bg-gray-50/20')}>
                                    <td className="pl-14 py-4">
                                        <span className="font-black text-base text-slate-950 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{c.seller_name}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.car}</span>
                                    </td>
                                    <td className="py-4 font-black text-xs text-gray-400 font-mono-numbers">{new Date(c.sale_date).toLocaleDateString('pt-BR')}</td>
                                    <td className="py-4 text-center">
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 font-mono-numbers text-[10px] font-black px-3 h-6">{c.margin}</Badge>
                                    </td>
                                    <td className="pr-14 py-4 text-right">
                                        <span className="font-black text-2xl text-emerald-600 font-mono-numbers tracking-tighter leading-none">{formatCurrency(c.commission_amount)}</span>
                                    </td>
                                </tr>
                            ))}
                            {filteredCommissions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.4em]">Nenhum repasse localizado</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
