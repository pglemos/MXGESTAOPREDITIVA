import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { useState, useMemo, useCallback } from 'react'
import { 
    Trophy, Medal, Award, Crown, TrendingUp, RefreshCw, 
    ChevronRight, Search, Building2, Filter, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Ranking() {
    const { ranking, loading, refetch } = useRanking()
    const { profile } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
    }, [refetch])

    const sortedRanking = useMemo(() => {
        return ranking.filter(r => r.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    }, [ranking, searchTerm])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Arena...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <Typography variant="caption" tone="brand">MERITOCRACIA REAL-TIME</Typography>
                    <Typography variant="h1">Arena de <span className="text-brand-primary">Performance</span></Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                        <label htmlFor="rank-search" className="sr-only">Buscar especialista</label>
                        <input 
                            id="rank-search" type="text" placeholder="BUSCAR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-alt border border-border-default rounded-full h-12 pl-11 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all shadow-inner"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={24} aria-hidden="true" className={cn((isRefetching || loading) && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-3 rounded-full border border-border-default bg-white px-8 py-4 shadow-mx-sm">
                        <Trophy size={20} aria-hidden="true" className="text-amber-500" />
                        <Typography variant="caption">{sortedRanking.length} Vendedores em Arena</Typography>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-mx-xl" aria-live="polite">
                <ol id="ranking-list" className="grid gap-mx-md m-0 p-0 list-none">
                    <AnimatePresence mode="popLayout">
                        {sortedRanking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop1 = i === 0 && !r.is_venda_loja
                            
                            return (
                                <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className={cn(
                                        "p-8 flex flex-col lg:flex-row lg:items-center gap-10",
                                        isTop1 ? "bg-brand-secondary border-amber-400 shadow-mx-xl" : 
                                        isMe ? "border-brand-primary bg-brand-primary/5" : "bg-white"
                                    )}>
                                        <div className="flex items-center gap-8 flex-1 min-w-0">
                                            <div className={cn(
                                                "w-20 h-20 rounded-[2rem] border-4 flex items-center justify-center font-black text-3xl shadow-mx-lg transition-transform",
                                                isTop1 ? "bg-amber-400 border-amber-300 text-slate-950 rotate-3" : "bg-surface-alt border-white text-slate-950"
                                            )}>
                                                {isTop1 ? <Crown size={36} fill="currentColor" /> : <span>#{i + 1}</span>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate">{r.user_name}</Typography>
                                                    {isTop1 && <Badge variant="warning" className="animate-pulse">LÍDER</Badge>}
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'}>Eficiência</Typography>
                                                        <Typography variant="h3" tone={isTop1 ? 'white' : 'default'} className="text-emerald-600">{r.atingimento}%</Typography>
                                                    </div>
                                                    <div className="w-px h-6 bg-border-default/20" aria-hidden="true" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'}>Ritmo</Typography>
                                                        <Typography variant="h3" tone={isTop1 ? 'white' : 'default'}>{r.ritmo}</Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10 border-t lg:border-t-0 lg:border-l border-border-default/10 pt-8 lg:pt-0 lg:pl-10">
                                            <div className="text-right">
                                                <Typography variant="caption" tone={isTop1 ? 'white' : 'brand'}>VENDAS</Typography>
                                                <Typography variant="h1" tone={isTop1 ? 'white' : 'default'} className="text-6xl tabular-nums leading-none tracking-tighter">{r.vnd_total}</Typography>
                                            </div>
                                            <Button asChild size="icon" variant={isTop1 ? 'success' : 'secondary'} className="w-16 h-16 rounded-[1.5rem] shadow-mx-xl">
                                                <Link to={`/dashboard?id=${r.user_id}`} aria-label={`Ver performance de ${r.user_name}`}>
                                                    <ChevronRight size={32} strokeWidth={3} />
                                                </Link>
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.li>
                            )
                        })}
                    </AnimatePresence>
                </ol>
            </div>
        </main>
    )
}
