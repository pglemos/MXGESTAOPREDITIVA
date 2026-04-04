import { useState, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, CartesianGrid } from 'recharts'
import { Trophy, Target, TrendingUp, Zap, Search, Download, RefreshCw, X, ChevronRight, Medal, Flame, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

const monthlyData = [
    { month: 'Jan', vendas: 18, meta: 20 }, { month: 'Fev', vendas: 22, meta: 22 },
    { month: 'Mar', vendas: 28, meta: 25 }, { month: 'Abr', vendas: 19, meta: 25 },
    { month: 'Mai', vendas: 24, meta: 25 },
]

export default function SellerPerformance() {
    const { team, commissions, refetch: refetchAll } = useAppStore()
    const [selectedSeller, setSelectedSeller] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

    const filteredCommissions = useMemo(() => {
        const term = normalizeStr(searchTerm)
        const sellerName = selectedSeller !== 'all' ? team.find(t => t.id === selectedSeller)?.name : null
        return commissions.filter(c => (!sellerName || c.seller === sellerName) && (normalizeStr(c.car).includes(term) || normalizeStr(c.seller).includes(term)))
    }, [commissions, searchTerm, selectedSeller, team])

    const leaderboard = useMemo(() => [...team].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3), [team])

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Performance <span className="text-brand-primary">Individual</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Métricas de Especialistas • Live Audit</p>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <button onClick={() => refetchAll?.()} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary active:scale-90 transition-all"><RefreshCw size={20} className={cn(isRefetching && "animate-spin")} /></button>
                    <Select value={selectedSeller} onValueChange={v => { setSelectedSeller(v); setSearchTerm('') }}>
                        <SelectTrigger className="mx-input !h-12 !w-64 !px-mx-md mx-text-caption border-none"><SelectValue placeholder="Selecionar Elite" /></SelectTrigger>
                        <SelectContent className="rounded-mx-lg shadow-mx-xl"><SelectItem value="all">Toda a Equipe</SelectItem>{team.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <button className="mx-button-primary bg-brand-secondary flex items-center gap-2"><Download size={18} /> Exportar</button>
                </div>
            </div>

            {/* Leaderboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {leaderboard.map((member, i) => (
                    <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn("mx-card p-mx-lg flex flex-col justify-between group relative overflow-hidden", i === 0 ? "bg-brand-secondary text-white shadow-mx-elite ring-4 ring-brand-primary/5" : "bg-white border-border-default")}>
                        {i === 0 && <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none group-hover:bg-brand-primary/30 transition-all z-0" />}
                        <div className="flex items-center gap-mx-md mb-mx-lg relative z-10">
                            <div className={cn("w-16 h-16 rounded-mx-lg flex items-center justify-center overflow-hidden shadow-inner transform group-hover:rotate-3 transition-transform", i === 0 ? "bg-white/10" : "bg-mx-slate-50")}>
                                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=transparent&color=${i === 0 ? 'fff' : '1a1d20'}&bold=true`} className="w-full h-full p-2" />
                            </div>
                            <div className="min-w-0">
                                <h3 className={cn("text-xl font-black tracking-tight truncate uppercase", i === 0 ? "text-white" : "text-text-primary")}>{member.name}</h3>
                                <p className={cn("mx-text-caption !text-[8px] opacity-60 uppercase", i === 0 ? "text-mx-indigo-400" : "text-text-tertiary")}>{i === 0 ? '🏆 Top Performer' : member.role || 'Especialista'}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-mx-md mb-mx-lg relative z-10">
                            <div><p className={cn("mx-text-caption !text-[8px] mb-1", i === 0 ? "text-white/40" : "opacity-40")}>Vendas</p><p className="text-3xl font-black font-mono-numbers tracking-tighter">{member.sales || 0}</p></div>
                            <div><p className={cn("mx-text-caption !text-[8px] mb-1", i === 0 ? "text-white/40" : "opacity-40")}>Atingimento</p><p className="text-3xl font-black font-mono-numbers tracking-tighter">{member.conversion || 0}%</p></div>
                        </div>
                        <div className="relative z-10"><div className="h-1.5 w-full rounded-full overflow-hidden p-px shadow-inner bg-mx-slate-100/10"><div className={cn("h-full rounded-full transition-all duration-1000", i === 0 ? "bg-brand-primary" : "bg-brand-secondary")} style={{ width: `${Math.min(member.conversion || 0, 100)}%` }} /></div></div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg shrink-0">
                <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="!text-lg">Ritmo Operacional</CardTitle><CardDescription>Realizado vs Meta Projetada</CardDescription></div><TrendingUp size={24} className="text-brand-primary" /></CardHeader><div className="p-mx-lg flex items-center justify-center min-h-[380px]">
                    <ResponsiveContainer width="100%" height={340}>
                        <AreaChart data={monthlyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} /><stop offset="95%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontWeight: 800, fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 800, fontSize: 10, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="vendas" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }} />
                            <Area type="monotone" dataKey="meta" stroke="#94a3b8" strokeWidth={2} strokeDasharray="8 8" fill="none" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div></Card>

                <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="!text-lg">Matriz de Eficiência</CardTitle><CardDescription>Conversão (%) por Consultor</CardDescription></div><Target size={24} className="text-status-warning" /></CardHeader><div className="p-mx-lg h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[...team].sort((a,b) => (b.conversion || 0) - (a.conversion || 0))} layout="vertical" margin={{ left: -30, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontWeight: 900, fontSize: 10, fill: 'var(--color-mx-black)' }} width={100} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px' }} />
                            <Bar dataKey="conversion" radius={[0, 8, 8, 0]} barSize={24}>
                                {team.map((_, i) => (<Cell key={i} fill={i === 0 ? 'var(--color-brand-primary)' : i === 1 ? 'var(--color-mx-indigo-500)' : 'var(--color-mx-indigo-400)'} />))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div></Card>
            </div>

            <Card className="mb-mx-3xl overflow-hidden"><CardHeader className="flex-col md:flex-row md:items-center justify-between gap-mx-lg bg-mx-slate-50/30">
                <div className="flex items-center gap-mx-md"><div className="w-12 h-12 rounded-mx-md bg-status-info text-white flex items-center justify-center shadow-mx-lg transform -rotate-3"><Medal size={24} /></div><div><CardTitle className="!text-xl">Logs de Comissionamento</CardTitle><p className="mx-text-caption !text-[8px]">Auditoria de Conversões do Especialista</p></div></div>
                <div className="relative group w-full md:w-80"><Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar ativo..." className="mx-input !h-11 !pl-11 !text-[10px]" /></div>
            </CardHeader><div className="overflow-x-auto no-scrollbar"><table className="w-full text-left min-w-[800px]">
                <thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Ativo Comercial</th><th className="py-mx-md uppercase tracking-[0.3em]">Data Registro</th><th className="py-mx-md uppercase tracking-[0.3em] text-center">Margem BI</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Líquido Creditado</th></tr></thead>
                <tbody className="divide-y divide-border-subtle bg-white">
                    {filteredCommissions.map((c, i) => (
                        <tr key={c.id} className={cn("hover:bg-mx-slate-50/50 transition-colors h-24 group border-none", i % 2 !== 0 && "bg-mx-slate-50/20")}>
                            <td className="pl-mx-lg py-4"><span className="font-black text-sm text-text-primary uppercase tracking-tight group-hover:text-brand-primary transition-colors">{c.car}</span><p className="mx-text-caption !text-[8px] opacity-60">Venda Direta</p></td>
                            <td className="py-4 font-bold text-xs text-text-tertiary font-mono-numbers">{c.date}</td>
                            <td className="py-4 text-center"><Badge variant="secondary" className="bg-status-success-surface text-status-success border-mx-emerald-100 font-mono-numbers text-[10px]">{c.margin}</Badge></td>
                            <td className="pr-mx-lg py-4 text-right"><span className="font-black text-xl text-status-success font-mono-numbers tracking-tighter">R$ {c.comission.toLocaleString('pt-BR')}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table></div></Card>
        </div>
    )
}
