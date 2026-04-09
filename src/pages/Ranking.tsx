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
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Consolidando Arena...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Arena Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Arena de <span className="text-brand-primary">Performance</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Meritocracia Real-time • MX ELITE TRACKING</Typography>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input 
                            placeholder="BUSCAR ESPECIALISTA..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="flex items-center gap-4 bg-white border border-border-default px-8 h-12 rounded-full shadow-mx-sm">
                        <Trophy size={18} className="text-status-warning" />
                        <Typography variant="caption" className="whitespace-nowrap">{sortedRanking.length} EM ARENA</Typography>
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-mx-xl" aria-live="polite">
                <ol className="grid gap-mx-lg m-0 p-0 list-none">
                    <AnimatePresence mode="popLayout">
                        {sortedRanking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop1 = i === 0 && !r.is_venda_loja
                            
                            return (
                                <motion.li key={r.user_id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className={cn(
                                        "p-8 md:p-10 flex flex-col lg:flex-row lg:items-center gap-10 border-none shadow-mx-lg transition-all",
                                        isTop1 ? "bg-brand-secondary text-white shadow-mx-xl ring-2 ring-mx-amber-400 ring-offset-4" : 
                                        isMe ? "bg-mx-indigo-50 border-2 border-brand-primary shadow-mx-sm" : "bg-white"
                                    )}>
                                        <div className="flex items-center gap-8 flex-1 min-w-0">
                                            <div className={cn(
                                                "w-20 h-20 rounded-mx-2xl border-4 flex items-center justify-center font-black text-3xl shadow-mx-lg",
                                                isTop1 ? "bg-mx-amber-400 border-mx-amber-300 text-mx-black rotate-3 scale-110" : "bg-surface-alt border-white text-text-primary"
                                            )}>
                                                {isTop1 ? <Crown size={36} fill="currentColor" /> : <span>#{i + 1}</span>}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <Typography variant="h2" tone={isTop1 ? 'white' : 'default'} className="truncate text-2xl md:text-3xl">{r.user_name}</Typography>
                                                    {isTop1 && <Badge variant="warning" className="animate-pulse shadow-mx-md">LÍDER</Badge>}
                                                    {isMe && !isTop1 && <Badge variant="brand">VOCÊ</Badge>}
                                                </div>
                                                <div className="flex items-center gap-10">
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="mb-1">EFICIÊNCIA</Typography>
                                                        <Typography variant="h3" tone={isTop1 ? 'white' : 'success'} className="text-xl">{r.atingimento}%</Typography>
                                                    </div>
                                                    <div className="w-px h-8 bg-border-default/20" aria-hidden="true" />
                                                    <div className="flex flex-col">
                                                        <Typography variant="caption" tone={isTop1 ? 'white' : 'muted'} className="mb-1">RITMO</Typography>
                                                        <Typography variant="h3" tone={isTop1 ? 'white' : 'default'} className="text-xl">{r.ritmo}</Typography>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "flex items-center gap-10 border-t lg:border-t-0 lg:border-l pt-8 lg:pt-0 lg:pl-10",
                                            isTop1 ? "border-white/10" : "border-border-default"
                                        )}>
                                            <div className="text-right">
                                                <Typography variant="caption" tone={isTop1 ? 'white' : 'brand'} className="mb-1 block">VENDAS</Typography>
                                                <Typography variant="h1" tone={isTop1 ? 'white' : 'default'} className="text-7xl tabular-nums leading-none tracking-tighter">{r.vnd_total}</Typography>
                                            </div>
                                            <Button asChild size="icon" variant={isTop1 ? 'secondary' : 'primary'} className="w-16 h-16 rounded-mx-xl shadow-mx-xl hover:scale-110 active:scale-95 transition-all">
                                                <Link to={`/dashboard?id=${r.user_id}`} aria-label={`Analisar performance de ${r.user_name}`}>
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
