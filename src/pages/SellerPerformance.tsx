import { useState, useMemo, useCallback } from 'react'
import { 
    Trophy, Target, TrendingUp, Zap, Search, Download, 
    RefreshCw, X, ChevronRight, Medal, Star, User, Activity, LayoutDashboard
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function SellerPerformance() {
    const { ranking, loading, refetch } = useRanking()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const filteredRanking = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return ranking.filter(r => r.user_name.toLowerCase().includes(term))
    }, [ranking, searchTerm])

    const leaderboard = useMemo(() => [...ranking].sort((a, b) => b.vnd_total - a.vnd_total).slice(0, 3), [ranking])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
        toast.success('Performance do time atualizada!')
    }, [refetch])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Elite...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header Area */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Performance <Typography as="span" className="text-brand-primary">Individual</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md opacity-60 uppercase tracking-widest font-black">Métricas de Especialistas • Live Audit</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <Input
                            placeholder="BUSCAR ESPECIALISTA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 uppercase tracking-widest font-black !text-xs"
                        />
                    </div>
                    <Button variant="secondary" className="h-mx-xl px-8 rounded-mx-full shadow-mx-xl uppercase tracking-widest">
                        <Download size={18} className="mr-2" /> <Typography variant="tiny" as="span" className="font-black">EXPORTAR</Typography>
                    </Button>
                </div>
            </header>

            {/* Leaderboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg shrink-0">
                {leaderboard.map((member, i) => (
                    <motion.div key={member.user_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card className={cn("p-4 md:p-mx-lg flex flex-col justify-between group relative overflow-hidden border-none shadow-mx-lg bg-white", 
                            i === 0 ? "ring-2 ring-brand-primary/20" : ""
                        )}>
                            {i === 0 && <div className="absolute top-mx-0 right-mx-0 w-mx-xl h-mx-xl bg-brand-primary/5 rounded-mx-full blur-mx-huge -mr-20 -mt-20 pointer-events-none" />}
                            
                            <div className="flex items-center gap-mx-md mb-8 relative z-10">
                                <div className={cn("w-mx-2xl h-mx-2xl rounded-mx-2xl flex items-center justify-center overflow-hidden shadow-inner border transition-all transform group-hover:rotate-3", 
                                    i === 0 ? "bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary" : "bg-surface-alt border-border-default text-text-primary"
                                )}>
                                    <User size={32} />
                                </div>
                                <div className="min-w-0">
                                    <Typography variant="h3" className="text-xl uppercase tracking-tight truncate group-hover:text-brand-primary transition-colors font-black">{member.user_name}</Typography>
                                    <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest block opacity-40">{i === 0 ? '🏆 Top Performer' : 'Especialista'}</Typography>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-md mb-8 relative z-10">
                                <div>
                                    <Typography variant="tiny" tone="muted" className="text-center mb-1 block uppercase font-black opacity-40">Vendas</Typography>
                                    <Typography variant="h1" className="text-3xl font-mono-numbers tracking-tighter text-center">{member.vnd_total}</Typography>
                                </div>
                                <div>
                                    <Typography variant="tiny" tone="muted" className="text-center mb-1 block uppercase font-black opacity-40">Atingimento</Typography>
                                    <Typography variant="h1" className="text-3xl font-mono-numbers tracking-tighter text-center">{member.atingimento}%</Typography>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="h-mx-xs w-full rounded-mx-full overflow-hidden bg-surface-alt border border-border-default shadow-inner p-0.5">
                                    <div className={cn("h-full rounded-mx-full transition-all duration-1000", 
                                        i === 0 ? "bg-brand-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]" : "bg-brand-secondary"
                                    )} style={{ width: `${Math.min(member.atingimento, 100)}%` }} />
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Matrix of Efficiency */}
            <Card className="mb-32 border-none shadow-mx-lg bg-white overflow-hidden group">
                <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl uppercase tracking-tighter">Matriz de Eficiência</CardTitle>
                        <Typography variant="tiny" tone="muted" className="uppercase tracking-widest font-black block mt-1 opacity-40">CONVERSÃO (%) POR CONSULTOR EM TEMPO REAL</Typography>
                    </div>
                    <Target size={24} className="text-brand-primary opacity-40" />
                </CardHeader>
                <div className="p-mx-10 md:p-14">
                    <div className="h-mx-section-sm w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredRanking} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="user_name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#1A1D20', fontWeight: 900, fontSize: 8 }} width={120} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1A1D20', borderRadius: '1.5rem', border: 'none', color: '#fff', fontSize: '8px', fontWeight: 900 }} />
                                <Bar dataKey="atingimento" radius={[0, 12, 12, 0]} barSize={24}>
                                    {filteredRanking.map((_, i) => (
                                        <Cell key={i} fill={i === 0 ? '#4f46e5' : i === 1 ? '#6366f1' : '#818cf8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </Card>
        </main>
    )
}
onsiveContainer>
                    </div>
                </div>
            </Card>
        </main>
    )
}
