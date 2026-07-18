import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { 
    RefreshCw, Search, Trophy, BarChart3, TrendingUp, Activity, 
    Target, Zap, Phone, Users, CheckCircle2, XCircle, ArrowLeft,
    Flame, Crown, Wallet, Unlock, LockKeyhole
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useGlobalRanking } from '@/hooks/useRanking'
import type { RankingEntry } from '@/types/database'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Avatar } from '@/components/atoms/Avatar'
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
import { chartTokens } from '@/lib/charts/tokens'

type SellerRankingRow = RankingEntry & { id: string }

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

    const columns = useMemo<Column<SellerRankingRow>[]>(() => [
        {
            key: 'position',
            header: '#',
            width: '60px',
            align: 'center',
            render: (_row, index) => (
                <span className={cn(
                    "font-black tabular-nums",
                    index === 0 ? "text-amber-600" : "text-gray-500"
                )}>
                    {index + 1}
                </span>
            )
        },
        {
            key: 'user_name',
            header: 'ESPECIALISTA',
            render: (r) => (
                <div className="flex items-center gap-4">
                    <Avatar
                        src={r.avatar_url || undefined}
                        alt={`Avatar de ${r.user_name}`}
                        fallback={r.user_name}
                        size="sm"
                        className={cn(
                            "rounded-2xl",
                            r.is_venda_loja ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-800 border-gray-100",
                        )}
                    />
                    <div className="min-w-0">
                        <Typography variant="h3" className="text-sm uppercase font-black truncate">{r.user_name}</Typography>
                        <Typography variant="tiny" tone="muted" className="text-[8px] font-black uppercase">{r.store_name}</Typography>
                    </div>
                </div>
            )
        },
        { key: 'vnd_total', header: 'VENDAS', align: 'center', render: (r) => <span className="font-black text-lg font-mono tabular-nums">{r.vnd_total}</span> },
        { key: 'atingimento', header: '% META', align: 'center', render: (r) => <Badge variant={r.atingimento >= 100 ? 'success' : 'outline'} className="font-mono tabular-nums font-black">{r.atingimento}%</Badge> },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (r) => (
                <Button size="icon" variant="ghost" onClick={() => navigate(`/relatorios/performance-vendedor?id=${r.user_id}`)} className="text-gray-500 hover:text-emerald-600">
                    <TrendingUp size={18} />
                </Button>
            )
        }
    ], [navigate])

    if (loading && ranking.length === 0) return (
        <main className="h-full w-full overflow-y-auto bg-gray-50 p-8 no-scrollbar">
            <div className="flex h-full w-full flex-col items-center justify-center">
                <RefreshCw className="w-12 h-12 animate-spin text-emerald-600 mb-6" />
                <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Performance...</Typography>
            </div>
        </main>
    )

    if (sellerId && !seller) {
        return (
<main className="h-full w-full overflow-y-auto bg-gray-50 p-8 no-scrollbar">
                <Card className="p-12 border-none shadow-sm bg-white text-center space-y-8">
                    <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-500">
                        <Search size={34} />
                    </div>
                    <div className="space-y-2">
                        <Typography variant="h2" className="uppercase tracking-tight">Vendedor não localizado</Typography>
                        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">
                            O identificador informado não está disponível no ranking consolidado atual.
                        </Typography>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button variant="outline" onClick={() => navigate('/relatorios/performance-vendedor')} className="h-12 rounded-full font-black uppercase tracking-widest">
                            Ver lista de vendedores
                        </Button>
                        <Button onClick={handleRefresh} disabled={isRefetching} className="h-12 rounded-full font-black uppercase tracking-widest">
                            {isRefetching ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
                            Atualizar dados
                        </Button>
                    </div>
                </Card>
            </main>
        )
    }

    if (sellerId && seller) {
        return (
<main className="h-full w-full overflow-y-auto bg-gray-50 p-8 no-scrollbar">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-900 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14)_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    <div className="relative z-10 flex flex-col gap-1">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/10 mr-2">
                                <ArrowLeft size={20} />
                            </Button>
                            <div className="w-2 h-10 bg-emerald-600 rounded-full shadow-sm" />
                            <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl uppercase tracking-tighter">Ficha de <span className="text-emerald-600">Performance</span></Typography>
                        </div>
                        <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-widest text-[10px] ml-12">Detalhamento Individual do Especialista</Typography>
                    </div>

                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-12 h-12 rounded-2xl shadow-sm bg-white/5 border-white/10 text-white relative z-10" aria-label="Atualizar">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Perfil e Radar */}
                    <Card className="lg:col-span-4 p-12 bg-gray-900 text-white border-none shadow-sm relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
                        
                        <div className="relative mb-6">
                            <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-emerald-600 to-transparent shadow-sm">
                                <Avatar
                                    src={seller.avatar_url || undefined}
                                    alt={`Avatar de ${seller.user_name}`}
                                    fallback={seller.user_name}
                                    className="w-full h-full rounded-full border-4 border-gray-900"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border-2 border-emerald-600 text-emerald-600 font-black text-lg shadow-xl">
                                {seller.position}º
                            </div>
                        </div>

                        <Typography variant="h2" tone="white" className="text-3xl uppercase font-black mb-1">{seller.user_name}</Typography>
                        <Badge variant="outline" className="border-emerald-600/30 text-emerald-600 bg-emerald-600/5 uppercase font-black tracking-widest text-[8px] mb-8 px-4">
                            {seller.store_name}
                        </Badge>

                        <div className="w-full h-80 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={attributes}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: chartTokens.axisTickMuted(), fontSize: 10, fontWeight: 'bold' }} />
                                    <Radar name={seller.user_name} dataKey="A" stroke="var(--color-brand-primary)" strokeWidth={3} fill="var(--color-brand-primary)" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/5 text-center">
                                <Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">Atingimento</Typography>
                                <Typography variant="h2" className="text-3xl font-mono tabular-nums">{seller.atingimento}%</Typography>
                            </div>
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/5 text-center">
                                <Typography variant="tiny" tone="muted" className="uppercase font-black mb-1">Ritmo Atual</Typography>
                                <Typography variant="h2" className="text-3xl font-mono tabular-nums">{seller.ritmo} v/d</Typography>
                            </div>
                        </div>
                    </Card>

                    {/* Indicadores Detalhados */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'Vendas Totais', value: seller.vnd_total, icon: Zap, color: 'text-emerald-600' },
                                { label: 'Leads Captados', value: seller.leads, icon: Phone, color: 'text-blue-600' },
                                { label: 'Agendamentos', value: seller.agd_total, icon: Users, color: 'text-amber-600' },
                            ].map((stat) => (
                                <Card key={stat.label} className="p-8 bg-white border-none shadow-sm flex items-center gap-6">
                                    <div className="w-16 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                        <stat.icon className={stat.color} size={28} />
                                    </div>
                                    <div>
                                        <Typography variant="tiny" tone="muted" className="uppercase font-black tracking-widest">{stat.label}</Typography>
                                        <Typography variant="h2" className="text-3xl font-mono tabular-nums leading-none mt-1">{stat.value}</Typography>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Card className="p-12 bg-white border-none shadow-sm min-h-96">
                            <header className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <Typography variant="h3" className="uppercase font-black">Histórico de Performance</Typography>
                                    <Typography variant="tiny" tone="muted" className="uppercase font-bold tracking-widest">Evolução Mensal das Metas</Typography>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                        <span className="text-[8px] font-black uppercase text-gray-500">Realizado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-50 border border-gray-100" />
                                        <span className="text-[8px] font-black uppercase text-gray-500">Meta</span>
                                    </div>
                                </div>
                            </header>

                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[{ name: 'Mês Atual', sales: seller.vnd_total, goal: seller.meta }]}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontWeight: 900, fontSize: 10 }} />
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderRadius: '1rem', border: 'none', color: 'var(--color-chart-dot-stroke)' }} />
                                        <Bar dataKey="sales" fill="var(--color-brand-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                                        <Bar dataKey="goal" fill="var(--color-surface-alt)" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <Card className="p-8 bg-emerald-50 border border-emerald-600/10 shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm"><CheckCircle2 size={24} /></div>
                                    <div>
                                        <Typography variant="tiny" className="uppercase font-black text-emerald-600">Meta Individual</Typography>
                                        <Typography variant="h2" className="text-2xl font-black">{seller.meta} Vendas</Typography>
                                    </div>
                                </div>
                             </Card>
                             <Card className="p-8 bg-gray-900 border border-white/5 shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-600 shadow-sm"><Activity size={24} /></div>
                                    <div>
                                        <Typography variant="tiny" className="uppercase font-black text-emerald-600">Eficiência de Conversão</Typography>
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
<main className="h-full w-full overflow-y-auto bg-gray-50 p-8 no-scrollbar">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-900 p-8 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14)_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-emerald-600 rounded-full shadow-sm" />
                        <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl uppercase tracking-tighter">Performance <span className="text-emerald-600">Geral</span></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-widest text-[10px]">Terminal de Auditoria de Vendedores</Typography>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative group w-full md:w-72">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input 
                            id="search-seller-list"
                            name="search-seller-list"
                            placeholder="BUSCAR NOME..." 
                            value={search} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} 
                            className="!pl-10 !h-12 text-[10px] font-black uppercase bg-white/5 border-white/10 text-white" 
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="w-12 h-12 rounded-2xl shadow-sm bg-white/5 border-white/10 text-white" aria-label="Atualizar">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <Card className="xl:col-span-8 border-none shadow-sm bg-white overflow-hidden p-0">
                    <DataGrid 
                        columns={columns} 
                        data={filteredRanking} 
                        emptyMessage="Nenhum especialista localizado."
                    />
                </Card>

                <aside className="xl:col-span-4 space-y-8">
                    <Card className="p-8 bg-gray-900 text-white border-none shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
                        <header className="flex items-center gap-4 mb-8 relative z-10">
                            <Trophy size={20} className="text-amber-600" />
                            <Typography variant="h3" tone="white" className="uppercase font-black tracking-tight">Top Performance</Typography>
                        </header>
                        <div className="h-64 relative z-10" style={{ minHeight: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                <BarChart data={filteredRanking.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="user_name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-chart-dot-stroke)', fontWeight: 900, fontSize: 8 }} width={100} />
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--color-gray-900)', borderRadius: '1rem', border: 'none', color: 'var(--color-chart-dot-stroke)', fontSize: '10px', fontWeight: 900 }} />
                                    <Bar dataKey="vnd_total" radius={[0, 4, 4, 0]} barSize={20}>
                                        {filteredRanking.slice(0, 5).map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? 'var(--color-brand-primary)' : 'rgba(255,255,255,0.2)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-8 border-none shadow-sm bg-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-emerald-600 opacity-[0.02]" />
                        <div className="relative z-10 text-center py-8">
                            <BarChart3 className="mx-auto mb-6 text-emerald-600 opacity-20" size={48} />
                            <Typography variant="h2" className="text-lg mb-2 uppercase tracking-tight font-black">Meta Global</Typography>
                            <Typography variant="caption" tone="muted" className="text-[10px] font-black uppercase tracking-widest">PROGRESSÃO EM TEMPO REAL</Typography>
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
