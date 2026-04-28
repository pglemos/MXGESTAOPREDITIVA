import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { 
    RefreshCw, Search, Trophy, BarChart3, TrendingUp, Activity, 
    Target, Zap, Phone, Users, CheckCircle2, XCircle, ArrowLeft,
    Flame, Crown, Wallet, Unlock, LockKeyhole
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useGlobalRanking } from '@/hooks/useRanking'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { DataGrid, type Column } from '@/components/organisms/DataGrid'
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export default function SellerPerformance() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const sellerId = searchParams.get('id')
    const { ranking, loading, refetch } = useGlobalRanking()
    const [isRefetching, setIsRefetching] = useState(false)
    const [search, setSearch] = useState('')

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
    }

    const seller = useMemo(() => {
        if (!sellerId) return null
        return ranking.find(r => r.user_id === sellerId)
    }, [ranking, sellerId])

    const filteredRanking = useMemo(() => {
        return ranking
            .filter(r => r.user_name.toLowerCase().includes(search.toLowerCase()))
            .map(r => ({ ...r, id: r.user_id }))
    }, [ranking, search])

    const attributes = useMemo(() => {
        if (!seller) return []
        return [
            { subject: 'Atingimento', A: Math.min(seller.atingimento, 100), fullMark: 100 },
            { subject: 'Volume', A: Math.min(((seller.leads + seller.visitas) / 100) * 100, 100), fullMark: 100 },
            { subject: 'Conversão', A: seller.leads > 0 ? Math.min((seller.vnd_total / seller.leads) * 100, 100) : 0, fullMark: 100 },
            { subject: 'Ritmo', A: Math.min(seller.ritmo * 10, 100), fullMark: 100 },
            { subject: 'Visitas', A: Math.min(seller.visitas * 5, 100), fullMark: 100 },
        ]
    }, [seller])

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'position',
            header: '#',
            width: '60px',
            align: 'center',
            render: (_: any, index: number) => (
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
                        <Typography variant="tiny" tone="muted" className="text-mx-nano font-black uppercase">{r.store_name}</Typography>
                    </div>
                </div>
            )
        },
        { key: 'vnd_total', header: 'VENDAS', align: 'center', render: (r: any) => <span className="font-black text-lg font-mono-numbers">{r.vnd_total}</span> },
        { key: 'atingimento', header: '% META', align: 'center', render: (r: any) => <Badge variant={r.atingimento >= 100 ? 'success' : 'outline'} className="font-mono-numbers font-black">{r.atingimento}%</Badge> },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (r: any) => (
                <Button size="icon" variant="ghost" onClick={() => navigate(`/relatorios/performance-vendedor?id=${r.user_id}`)} className="text-text-tertiary hover:text-brand-primary">
                    <TrendingUp size={18} />
                </Button>
            )
        }
    ], [navigate])

    if (loading && ranking.length === 0) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Performance...</Typography>
        </div>
    )

    if (sellerId && seller) {
        return (
            <main className="p-mx-md sm:p-mx-lg lg:p-mx-xl mx-auto space-y-mx-lg" style={{ maxWidth: '1600px' }}>
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md bg-mx-black p-mx-lg rounded-mx-2xl shadow-mx-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-mx-matrix opacity-20" />
                    <div className="relative z-10 flex flex-col gap-mx-tiny">
                        <div className="flex items-center gap-mx-sm">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10 mr-2">
                                <ArrowLeft size={20} />
                            </Button>
                            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                            <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl uppercase tracking-tighter">Ficha de <span className="text-brand-primary">Performance</span></Typography>
                        </div>
                        <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-mx-widest text-mx-tiny ml-12">Detalhamento Individual do Especialista</Typography>
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-mx-12 h-mx-12 rounded-mx-xl shadow-mx-sm bg-white/5 border-white/10 text-white relative z-10" aria-label="Atualizar">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                    {/* Perfil e Radar */}
                    <Card className="lg:col-span-4 p-mx-xl bg-mx-black text-white border-none shadow-mx-xl relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-64 h-mx-64 bg-brand-primary/10 rounded-mx-full blur-3xl -mr-20 -mt-20" />
                        
                        <div className="relative mb-6">
                            <div className="w-mx-40 h-mx-40 rounded-full p-mx-tiny bg-gradient-to-br from-brand-primary to-transparent shadow-mx-glow-brand">
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random&size=200`} 
                                    alt="" 
                                    className="w-full h-full rounded-full object-cover border-4 border-mx-black"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-mx-12 h-mx-12 bg-mx-black rounded-full flex items-center justify-center border-2 border-brand-primary text-brand-primary font-black text-lg shadow-xl">
                                {seller.position}º
                            </div>
                        </div>

                        <Typography variant="h2" tone="white" className="text-3xl uppercase font-black mb-1">{seller.user_name}</Typography>
                        <Badge variant="outline" className="border-brand-primary/30 text-brand-primary bg-brand-primary/5 uppercase font-black tracking-widest text-mx-nano mb-8 px-4">
                            {seller.store_name}
                        </Badge>

                        <div className="w-full h-mx-80 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={attributes}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                    <Radar name={seller.user_name} dataKey="A" stroke="var(--color-brand-primary)" strokeWidth={3} fill="var(--color-brand-primary)" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-mx-sm w-full mt-auto">
                            <div className="bg-white/5 p-mx-lg rounded-2xl border border-white/5 text-center">
                                <Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">Atingimento</Typography>
                                <Typography variant="h2" className="text-3xl font-mono-numbers">{seller.atingimento}%</Typography>
                            </div>
                            <div className="bg-white/5 p-mx-lg rounded-2xl border border-white/5 text-center">
                                <Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">Ritmo Atual</Typography>
                                <Typography variant="h2" className="text-3xl font-mono-numbers">{seller.ritmo} v/d</Typography>
                            </div>
                        </div>
                    </Card>

                    {/* Indicadores Detalhados */}
                    <div className="lg:col-span-8 space-y-mx-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                            {[
                                { label: 'Vendas Totais', value: seller.vnd_total, icon: Zap, color: 'text-status-success' },
                                { label: 'Leads Captados', value: seller.leads, icon: Phone, color: 'text-status-info' },
                                { label: 'Agendamentos', value: seller.agd_total, icon: Users, color: 'text-status-warning' },
                            ].map((stat) => (
                                <Card key={stat.label} className="p-mx-lg bg-white border-none shadow-mx-lg flex items-center gap-mx-md">
                                    <div className="w-mx-16 h-mx-14 rounded-mx-2xl bg-surface-alt flex items-center justify-center border border-border-default shrink-0">
                                        <stat.icon className={stat.color} size={28} />
                                    </div>
                                    <div>
                                        <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest">{stat.label}</Typography>
                                        <Typography variant="h2" className="text-3xl font-mono-numbers leading-none mt-1">{stat.value}</Typography>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Card className="p-mx-xl bg-white border-none shadow-mx-xl min-h-[400px]">
                            <header className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <Typography variant="h3" className="uppercase font-black">Histórico de Performance</Typography>
                                    <Typography variant="tiny" tone="muted" className="uppercase font-bold tracking-widest">Evolução Mensal das Metas</Typography>
                                </div>
                                <div className="flex items-center gap-mx-sm">
                                    <div className="flex items-center gap-mx-xs">
                                        <div className="w-mx-xs h-mx-xs rounded-full bg-brand-primary" />
                                        <span className="text-mx-nano font-black uppercase text-text-tertiary">Realizado</span>
                                    </div>
                                    <div className="flex items-center gap-mx-xs">
                                        <div className="w-mx-xs h-mx-xs rounded-full bg-surface-alt border border-border-default" />
                                        <span className="text-mx-nano font-black uppercase text-text-tertiary">Meta</span>
                                    </div>
                                </div>
                            </header>

                            <div className="h-mx-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[{ name: 'Mês Atual', sales: seller.vnd_total, goal: seller.meta }]}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-lg)', border: 'none', color: '#fff' }} />
                                        <Bar dataKey="sales" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                        <Bar dataKey="goal" fill="var(--color-surface-alt)" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                             <Card className="p-mx-lg bg-status-success-surface border border-status-success/10 shadow-mx-lg">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-white flex items-center justify-center text-status-success shadow-mx-sm"><CheckCircle2 size={24} /></div>
                                    <div>
                                        <Typography variant="tiny" className="uppercase font-black text-status-success">Meta Individual</Typography>
                                        <Typography variant="h2" className="text-2xl font-black">{seller.meta} Vendas</Typography>
                                    </div>
                                </div>
                             </Card>
                             <Card className="p-mx-lg bg-mx-black border border-white/5 shadow-mx-lg">
                                <div className="flex items-center gap-mx-md">
                                    <div className="w-mx-12 h-mx-12 rounded-mx-xl bg-white/5 flex items-center justify-center text-brand-primary shadow-mx-sm"><Activity size={24} /></div>
                                    <div>
                                        <Typography variant="tiny" className="uppercase font-black text-brand-primary">Eficiência de Conversão</Typography>
                                        <Typography variant="h2" tone="white" className="text-2xl font-black">
                                            {seller.leads > 0 ? ((seller.vnd_total / seller.leads) * 100).toFixed(1) : 0}%
                                        </Typography>
                                    </div>
                                </div>
                             </Card>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    // Fallback: If no seller ID or seller not found, show the ranking (as it was before)
    return (
        <main className="p-mx-md sm:p-mx-lg lg:p-mx-xl mx-auto space-y-mx-lg" style={{ maxWidth: '1600px' }}>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-mx-md bg-mx-black p-mx-lg rounded-mx-2xl shadow-mx-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-mx-matrix opacity-20" />
                <div className="relative z-10 flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                        <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl uppercase tracking-tighter">Performance <span className="text-brand-primary">Geral</span></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-mx-widest text-mx-tiny">Terminal de Auditoria de Vendedores</Typography>
                </div>

                <div className="flex items-center gap-mx-sm relative z-10">
                    <div className="relative group w-full md:w-mx-sidebar-expanded">
                        <Search size={14} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <Input 
                            id="search-seller-list"
                            name="search-seller-list"
                            placeholder="BUSCAR NOME..." 
                            value={search} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} 
                            className="!pl-10 !h-12 text-mx-tiny font-black uppercase bg-white/5 border-white/10 text-white" 
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-mx-12 h-mx-12 rounded-mx-xl shadow-mx-sm bg-white/5 border-white/10 text-white" aria-label="Atualizar">
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
                        <div className="h-mx-64 relative z-10" style={{ minHeight: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                <BarChart data={filteredRanking.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="user_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#fff', fontWeight: 900, fontSize: 8 }} width={100} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--color-mx-black)', borderRadius: 'var(--radius-mx-lg)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 900 }} />
                                    <Bar dataKey="vnd_total" radius={[0, 4, 4, 0]} barSize={20}>
                                        {filteredRanking.slice(0, 5).map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.2)'} />
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
                            <Typography variant="caption" tone="muted" className="text-mx-tiny font-black uppercase tracking-widest">PROGRESSÃO EM TEMPO REAL</Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
