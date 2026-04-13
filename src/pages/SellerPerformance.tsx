import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { 
    Users, TrendingUp, Target, Search, ArrowLeft, RefreshCw, Filter, 
    ChevronRight, Trophy, Crown, Flame, BarChart3
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/molecules/Card'
import { Input } from '@/components/atoms/Input'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { DataGrid } from '@/components/organisms/DataGrid'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function SellerPerformance() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const [loading, setLoading] = useState(true)
    const [isRefetching, setIsRefetching] = useState(false)
    const [search, setSearch] = useState('')
    const [ranking, setRanking] = useState<any[]>([])

    const fetchPerformance = async () => {
        setIsRefetching(true)
        try {
            const { data, error } = await supabase.rpc('get_global_ranking', {
                p_start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                p_end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd')
            })
            if (error) throw error
            setRanking(data || [])
        } catch (err) {
            console.error('Error fetching performance:', err)
        } finally {
            setLoading(false)
            setIsRefetching(false)
        }
    }

    useEffect(() => {
        fetchPerformance()
    }, [])

    const filteredRanking = useMemo(() => {
        return ranking.filter(r => r.user_name.toLowerCase().includes(search.toLowerCase()))
    }, [ranking, search])

    const columns = useMemo(() => [
        {
            key: 'position',
            header: '#',
            width: '60px',
            align: 'center',
            render: (_: any, __: any, index: number) => (
                <span className={cn(
                    "font-black tabular-nums",
                    index === 0 ? "text-status-warning" : "text-text-tertiary"
                )}>
                    {index + 1}
                </span>
            )
        },
        {
            key: 'user_name',
            header: 'ESPECIALISTA',
            render: (r: any) => (
                <div className="flex items-center gap-mx-sm">
                    <div className={cn(
                        "w-mx-8 h-mx-8 rounded-mx-lg flex items-center justify-center font-black text-xs uppercase border shrink-0",
                        r.is_venda_loja ? "bg-brand-primary text-white border-brand-primary" : "bg-surface-alt text-text-primary border-border-default"
                    )}>
                        {r.user_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm uppercase font-black truncate">{r.user_name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-mx-nano font-black uppercase opacity-40">{r.store_name}</Typography>
                    </div>
                </div>
            )
        },
        { key: 'vnd_total', header: 'VENDAS', align: 'center', render: (r: any) => <span className="font-black text-lg font-mono-numbers">{r.vnd_total}</span> },
        { key: 'atingimento', header: '% META', align: 'center', render: (r: any) => <Badge variant={r.atingimento >= 100 ? 'success' : 'outline'} className="font-mono-numbers font-black">{r.atingimento}%</Badge> },
        {
            key: 'status',
            header: 'EFICIÊNCIA',
            align: 'right',
            render: (r: any) => (
                <div className="flex flex-col items-end" style={{ gap: '0.25rem' }}>
                    <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden border border-border-default" style={{ width: '5rem' }}>
                        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(r.atingimento, 100)}%` }} />
                    </div>
                    <Typography variant="tiny" className="text-mx-nano font-black opacity-40 uppercase">{r.ritmo} V/DIA</Typography>
                </div>
            )
        }
    ], [])

    if (loading) return null

    return (
        <main className="p-mx-md sm:p-mx-lg lg:p-mx-xl mx-auto space-y-mx-lg" style={{ maxWidth: '1600px' }}>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md bg-mx-black p-mx-lg rounded-mx-2xl shadow-mx-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-mx-matrix opacity-20" />
                <div className="relative z-10 flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                        <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl uppercase tracking-tighter">Performance <span className="text-brand-primary">Elite</span></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-mx-widest text-mx-tiny">Ranking Geral de Vendedores</Typography>
                </div>

                <div className="flex items-center gap-mx-sm relative z-10">
                    <div className="relative group w-full md:w-mx-sidebar-expanded">
                        <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <Input 
                            placeholder="BUSCAR NOME..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            className="!pl-10 !h-12 text-mx-tiny font-black uppercase bg-white/5 border-white/10 text-white" 
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchPerformance} disabled={isRefetching} className="w-mx-12 h-mx-12 rounded-mx-xl shadow-mx-sm bg-white/5 border-white/10 text-white">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg">
                <Card className="xl:col-span-8 border-none shadow-mx-xl bg-white overflow-hidden p-mx-0">
                    <DataGrid 
                        columns={columns} 
                        data={filteredRanking} 
                        emptyMessage="Nenhum especialista localizado."
                    />
                </Card>

                <aside className="xl:col-span-4 space-y-mx-lg">
                    <Card className="p-mx-lg bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/20 rounded-mx-full blur-3xl -mr-16 -mt-16" />
                        <header className="flex items-center gap-mx-sm mb-8 relative z-10">
                            <Trophy size={20} className="text-status-warning" />
                            <Typography variant="h3" tone="white" className="uppercase font-black tracking-tight">Top Performance</Typography>
                        </header>
                        <div className="h-mx-64 relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={filteredRanking.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="user_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontWeight: 900, fontSize: 8 }} width={100} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                                    <Bar dataKey="vnd_total" radius={[0, 4, 4, 0]} barSize={20}>
                                        {filteredRanking.slice(0, 5).map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? '#4f46e5' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-mx-lg border-none shadow-mx-lg bg-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-brand-primary opacity-[0.02]" />
                        <div className="relative z-10 text-center py-8">
                            <BarChart3 className="mx-auto mb-6 text-brand-primary opacity-20" size={48} />
                            <Typography variant="h2" className="text-lg mb-2 uppercase tracking-tight font-black">Meta Global</Typography>
                            <Typography variant="caption" tone="muted" className="text-mx-tiny font-black uppercase tracking-widest opacity-40">PROGRESSÃO EM TEMPO REAL</Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
