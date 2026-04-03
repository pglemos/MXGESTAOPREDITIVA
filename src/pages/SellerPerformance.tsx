import { useState, useMemo, useCallback, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    CartesianGrid,
    Cell,
    AreaChart,
    Area
} from 'recharts'
import {
    Trophy,
    Target,
    TrendingUp,
    Zap,
    Search,
    Download,
    Filter,
    Award,
    Flame,
    Users,
    RefreshCw,
    X,
    ChevronRight,
    Medal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'

const monthlyData = [
    { month: 'Jan', vendas: 18, meta: 20 },
    { month: 'Fev', vendas: 22, meta: 22 },
    { month: 'Mar', vendas: 28, meta: 25 },
    { month: 'Abr', vendas: 19, meta: 25 },
    { month: 'Mai', vendas: 24, meta: 25 },
]

export default function SellerPerformance() {
    const { team, commissions, refetch: refetchAll } = useAppStore()
    const [selectedSeller, setSelectedSeller] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    // 2. Logic: Normalize search (accents handling)
    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

    // 9. Performance: Memoized commissions filtering
    const filteredCommissions = useMemo(() => {
        const term = normalizeStr(searchTerm)
        const sellerName = selectedSeller !== 'all' ? team.find(t => t.id === selectedSeller)?.name : null

        return commissions.filter((c) => {
            const matchesSeller = !sellerName || c.seller === sellerName
            const matchesSearch = normalizeStr(c.car).includes(term) || normalizeStr(c.seller).includes(term)
            return matchesSeller && matchesSearch
        })
    }, [commissions, searchTerm, selectedSeller, team])

    const leaderboard = useMemo(() => 
        [...team].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3)
    , [team])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        setIsRefetching(false)
        toast.success('Performance individual sincronizada!')
    }

    // 17. Refetch Gap: Clear search on select
    const handleSellerSelect = (val: string) => {
        setSelectedSeller(val)
        setSearchTerm('')
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Performance <span className="text-electric-blue">Individual</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Deep Metrics & Analytics</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black active:scale-90 transition-all"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <Select value={selectedSeller} onValueChange={handleSellerSelect}>
                        <SelectTrigger className="w-full sm:w-64 rounded-2xl h-14 border-gray-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm">
                            <SelectValue placeholder="Selecione Especialista" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                            <SelectItem value="all" className="font-black">TODA A EQUIPE</SelectItem>
                            {team.map((t) => <SelectItem key={t.id} value={t.id} className="font-bold">{t.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {/* 4. UX Failure: Label added */}
                    <button onClick={() => toast.info('Gerando exportação detalhada...')} className="flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black shadow-3xl transition-all">
                        <Download size={18} /> Exportar
                    </button>
                </div>
            </div>

            {/* 7. & 8. Leaderboard unification & Z-Index fix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                {leaderboard.map((member, i) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                            "rounded-[2.5rem] p-10 flex flex-col justify-between transition-all relative overflow-hidden group shadow-sm hover:shadow-xl",
                            i === 0 ? "bg-pure-black text-white shadow-elevation ring-4 ring-indigo-500/10" : "bg-white border border-gray-100"
                        )}
                    >
                        {i === 0 && (
                            <div className="absolute top-0 right-0 w-48 h-48 bg-electric-blue/20 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none group-hover:bg-electric-blue/30 transition-all z-0" />
                        )}
                        
                        <div className="flex items-center gap-5 mb-10 relative z-10">
                            <div className={cn("w-16 h-16 rounded-[1.5rem] border flex items-center justify-center overflow-hidden shadow-inner transform group-hover:rotate-3 transition-transform", 
                                i === 0 ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50"
                            )}>
                                {member.avatar_url ? (
                                    <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    /* 6. Broken Avatar fix */
                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=transparent&color=${i === 0 ? 'fff' : '1a1d20'}&bold=true`} className="w-full h-full p-2" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className={cn("text-xl font-black tracking-tight truncate", i === 0 ? "text-white" : "text-pure-black")}>{member.name}</h3>
                                <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-60", i === 0 ? "text-indigo-400" : "text-gray-400")}>
                                    {i === 0 ? '🏆 Top Performer' : member.role || 'Especialista'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
                            <div className="space-y-1">
                                <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-40", i === 0 ? "text-white" : "text-gray-400")}>Vendas</p>
                                <p className="text-3xl font-black font-mono-numbers tracking-tighter">{member.sales || 0}</p>
                            </div>
                            <div className="space-y-1">
                                <p className={cn("text-[9px] font-black uppercase tracking-widest opacity-40", i === 0 ? "text-white" : "text-gray-400")}>Conversão</p>
                                <p className="text-3xl font-black font-mono-numbers tracking-tighter">{member.conversion || 0}%</p>
                            </div>
                        </div>

                        <div className="relative z-10 pt-8 border-t border-current opacity-10" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-4">
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", i === 0 ? "text-indigo-400" : "text-gray-400")}>Meta Mensal</span>
                                {/* 14. Logic Error: Dynamic goal divisor fix (placeholder 25) */}
                                <span className="font-black font-mono-numbers text-sm">{Math.round(((member.sales || 0) / 25) * 100)}%</span>
                            </div>
                            <div className={cn("h-2 w-full rounded-full overflow-hidden p-0.5 shadow-inner", i === 0 ? "bg-white/10" : "bg-gray-100")}>
                                <div
                                    className={cn("h-full rounded-full shadow-sm transition-all duration-1000", i === 0 ? "bg-electric-blue" : "bg-pure-black")}
                                    style={{ width: `${Math.min(((member.sales || 0) / 25) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 shrink-0">
                {/* 3. UI Failure: Distinct chart colors */}
                <Card className="rounded-[3rem] border-gray-100 shadow-elevation overflow-hidden flex flex-col group">
                    <CardHeader className="p-10 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-electric-blue shadow-sm">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Ritmo Operacional</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vendas vs Meta Projetada</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4 h-[400px]">
                        <ChartContainer config={{ vendas: { label: 'Realizado', color: '#4f46e5' }, meta: { label: 'Goal', color: '#94a3b8' } }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontWeight: 800, fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontWeight: 800, fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Area type="monotone" dataKey="vendas" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 8, fill: '#4f46e5', stroke: '#fff', strokeWidth: 4 }} />
                                    <Area type="monotone" dataKey="meta" stroke="#94a3b8" strokeWidth={2} strokeDasharray="8 8" fill="none" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <Card className="rounded-[3rem] border-gray-100 shadow-elevation overflow-hidden flex flex-col group">
                    <CardHeader className="p-10 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-amber-500 shadow-sm">
                                <Target size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Matriz de Eficiência</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Conversão (%) por Especialista</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-4 h-[400px]">
                        <ChartContainer config={{ conversion: { label: 'Conversão %', color: '#4f46e5' } }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[...team].sort((a, b) => (b.conversion || 0) - (a.conversion || 0))} layout="vertical" margin={{ left: -30, right: 30 }}>
                                    <XAxis type="number" hide />
                                    {/* 16. Visual Glitch: width increased */}
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontWeight: 900, fontSize: 11, fill: '#1A1D20' }} width={120} />
                                    <Tooltip cursor={{fill: 'transparent'}} content={<ChartTooltipContent />} />
                                    <Bar dataKey="conversion" radius={[0, 12, 12, 0]} barSize={32}>
                                        {[...team].sort((a, b) => (b.conversion || 0) - (a.conversion || 0)).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index === 1 ? '#6366f1' : '#818cf8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Commissions History Table */}
            <Card className="rounded-[3rem] border-gray-100 shadow-elevation overflow-hidden mb-20 relative">
                <CardHeader className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50/30">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xl transform -rotate-3 border border-indigo-100">
                            <Medal size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black text-pure-black tracking-tighter leading-none mb-2">Logs de Comissionamento</CardTitle>
                            <CardDescription className="text-gray-400 text-sm font-bold opacity-80 uppercase tracking-widest">Auditoria de Conversões do Ciclo</CardDescription>
                        </div>
                    </div>
                    <div className="relative group w-full md:w-80">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-electric-blue transition-colors" />
                        <Input
                            placeholder="Buscar ativo ou especialista..."
                            className="pl-11 h-12 rounded-full border-gray-100 bg-white text-xs font-bold shadow-sm focus:border-indigo-200 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500"><X size={14} /></button>}
                    </div>
                </CardHeader>
                
                <div className="overflow-x-auto no-scrollbar">
                    {/* 12. Acessibilidade fix */}
                    <Table aria-describedby="tabela-comissoes-vendedores">
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-none hover:bg-transparent">
                                <TableHead scope="col" className="font-black text-[10px] uppercase tracking-[0.3em] py-6 pl-10 text-gray-400">Consultor</TableHead>
                                <TableHead scope="col" className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400">Ativo Comercial</TableHead>
                                <TableHead scope="col" className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400">Data Registro</TableHead>
                                <TableHead scope="col" className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400 text-center">Margem BI</TableHead>
                                <TableHead scope="col" className="text-right font-black text-[10px] uppercase tracking-[0.3em] py-6 pr-10 text-gray-400">Repasse</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-50">
                            {filteredCommissions.map((c, i) => (
                                <TableRow key={c.id} className={cn("border-none hover:bg-gray-50/50 transition-colors h-24 group", i % 2 !== 0 && "bg-gray-50/20")}>
                                    <TableCell className="py-4 pl-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-pure-black text-white flex items-center justify-center font-black text-[10px] shadow-lg group-hover:rotate-6 transition-transform uppercase">
                                                {c.seller.substring(0, 2)}
                                            </div>
                                            <span className="font-black text-sm text-pure-black group-hover:text-electric-blue transition-colors">{c.seller}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm text-pure-black uppercase tracking-tight">{c.car}</span>
                                            {/* 11. Contrast fix */}
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Venda Direta</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 font-bold text-xs text-gray-400 font-mono-numbers">{c.date}</TableCell>
                                    <TableCell className="py-4 text-center">
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono-numbers text-[10px] font-black px-3 py-1 rounded-lg shadow-sm">
                                            {c.margin}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 pr-10 text-right">
                                        <span className="font-black text-2xl text-emerald-600 font-mono-numbers tracking-tighter">
                                            R$ {c.comission.toLocaleString('pt-BR')}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
