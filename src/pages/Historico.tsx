import { useMyCheckins } from '@/hooks/useCheckins'
import { calcularTotais } from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    History, Calendar, Car, Users, Globe, Eye, 
    MessageSquare, Search, ArrowUpDown, RefreshCw, X,
    CalendarDays, Phone
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/molecules/Card'
import { toast } from 'sonner'

export default function Historico() {
    const { checkins, loading, refetch } = useMyCheckins()
    const [searchTerm, setSearchTerm] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Histórico sincronizado!')
    }, [refetch])

    const processedCheckins = useMemo(() => {
        return checkins
            .map(c => ({
                ...c,
                parsedDate: parseISO(c.reference_date),
                totals: calcularTotais({
                    leads: c.leads_prev_day,
                    agd_cart_prev: c.agd_cart_prev_day,
                    agd_net_prev: c.agd_net_prev_day,
                    agd_cart: c.agd_cart_today,
                    agd_net: c.agd_net_today,
                    vnd_porta: c.vnd_porta_prev_day,
                    vnd_cart: c.vnd_cart_prev_day,
                    vnd_net: c.vnd_net_prev_day,
                    visitas: c.visit_prev_day
                })
            }))
            .filter(c => 
                c.reference_date.includes(searchTerm) || 
                c.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.zero_reason?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const timeA = a.parsedDate.getTime(); const timeB = b.parsedDate.getTime()
                return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
            })
    }, [checkins, searchTerm, sortOrder])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Recuperando Memória...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Histórico <span className="text-brand-primary">Operacional</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Registros Sincronizados na Malha</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                        <input 
                            type="text" placeholder="BUSCAR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-border-default rounded-full h-12 pl-11 pr-10 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all shadow-mx-sm"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="rounded-xl">
                        <ArrowUpDown size={18} aria-hidden="true" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {processedCheckins.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-40 rounded-[2.5rem] text-center border-dashed border-2 border-border-default bg-surface-alt/50">
                    <History size={48} className="text-text-tertiary mb-4 opacity-40" aria-hidden="true" />
                    <Typography variant="h2" className="mb-2">Memória Vazia</Typography>
                    <Typography variant="p" tone="muted" className="max-w-xs uppercase">Nenhum registro localizado para o termo buscado.</Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg pb-32" aria-live="polite">
                    <AnimatePresence mode="popLayout">
                        {processedCheckins.map((c, i) => (
                            <motion.article key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                <Card className="p-8 group hover:shadow-mx-xl transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-border-default pb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shadow-inner" aria-hidden="true">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <Typography variant="h3" className="text-sm">
                                                    <time dateTime={c.reference_date}>{format(c.parsedDate, "eeee, dd 'de' MMMM", { locale: ptBR })}</time>
                                                </Typography>
                                                <Typography variant="caption" tone="muted">SNAPSHOT OPERACIONAL</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={c.totals.vnd_total > 0 ? 'success' : c.zero_reason ? 'warning' : 'outline'} className="px-4">
                                            {c.totals.vnd_total > 0 ? `${c.totals.vnd_total} VENDAS` : c.zero_reason || 'INATIVO'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { label: 'Leads', val: c.leads_prev_day, icon: Phone, color: 'text-indigo-500' },
                                            { label: 'Agd', val: c.totals.agd_total, icon: CalendarDays, color: 'text-blue-500' },
                                            { label: 'Visitas', val: c.visit_prev_day, icon: Eye, color: 'text-amber-500' },
                                            { label: 'Vendas', val: c.totals.vnd_total, icon: Car, color: 'text-emerald-500' },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-surface-alt rounded-2xl p-4 text-center border border-border-default shadow-inner">
                                                <stat.icon size={14} className={cn("mx-auto mb-2 opacity-40", stat.color)} aria-hidden="true" />
                                                <Typography variant="h2" className="text-xl tabular-nums">{stat.val}</Typography>
                                                <Typography variant="caption" className="text-[8px]">{stat.label}</Typography>
                                            </div>
                                        ))}
                                    </div>

                                    {c.note && (
                                        <div className="pt-6 border-t border-border-default flex items-start gap-3">
                                            <MessageSquare size={14} className="text-text-tertiary mt-1 shrink-0" aria-hidden="true" />
                                            <p className="text-xs font-bold text-gray-500 italic leading-relaxed uppercase tracking-tight line-clamp-2">"{c.note}"</p>
                                        </div>
                                    )}
                                </Card>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </main>
    )
}
