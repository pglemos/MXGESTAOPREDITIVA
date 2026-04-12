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
import { Input } from '@/components/atoms/Input'
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
                totals: calcularTotais(c)
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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Recuperando Memória...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / History Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Histórico <span className="text-brand-primary">Operacional</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Registros Sincronizados na Malha MX</Typography>
                </div>

                <div className="flex flex-wrap items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-mx-sidebar-expanded">
                        <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input 
                            placeholder="BUSCAR REGISTRO..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-mx-tiny uppercase tracking-widest"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="rounded-mx-xl h-mx-xl w-mx-xl shadow-mx-sm">
                        <ArrowUpDown size={18} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            {processedCheckins.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-40 rounded-mx-3xl text-center border-dashed border-2 border-border-default bg-white/50 shadow-inner">
                    <History size={48} className="text-text-tertiary mb-6 opacity-30" />
                    <Typography variant="h2" className="mb-2">Memória Vazia</Typography>
                    <Typography variant="p" tone="muted" className="max-w-xs uppercase tracking-tight">Nenhum registro localizado para o termo buscado na rede.</Typography>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-mx-lg pb-32" aria-live="polite">
                    <AnimatePresence mode="popLayout">
                        {processedCheckins.map((c, i) => (
                            <motion.div key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                <Card className="p-4 md:p-mx-lg md:p-10 group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl -mr-16 -mt-16" />
                                    
                                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-mx-md mb-8 border-b border-border-default pb-8 relative z-10">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shadow-inner group-hover:bg-brand-primary group-hover:text-white transition-all">
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <Typography variant="h3" className="text-base">
                                                    <time dateTime={c.reference_date}>{format(c.parsedDate, "eeee, dd 'de' MMMM", { locale: ptBR })}</time>
                                                </Typography>
                                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest">SNAPSHOT OPERACIONAL</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={c.totals.vnd_total > 0 ? 'success' : c.zero_reason ? 'warning' : 'outline'} className="px-6 py-2 rounded-mx-full shadow-mx-sm font-black uppercase tracking-widest">
                                            {c.totals.vnd_total > 0 ? `${c.totals.vnd_total} VENDAS` : c.zero_reason || 'INATIVO'}
                                        </Badge>
                                    </header>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-mx-sm mb-10 relative z-10">
                                        {[
                                            { label: 'LEADS', val: c.leads_prev_day, icon: Phone, tone: 'brand' },
                                            { label: 'AGEND.', val: c.totals.agd_total, icon: CalendarDays, tone: 'info' },
                                            { label: 'VISITAS', val: c.visit_prev_day, icon: Eye, tone: 'warning' },
                                            { label: 'VENDAS', val: c.totals.vnd_total, icon: Car, tone: 'success' },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-surface-alt rounded-mx-2xl p-mx-5 text-center border border-border-default shadow-inner group-hover:bg-white group-hover:shadow-mx-sm transition-all">
                                                <stat.icon size={16} className={cn("mx-auto mb-3 opacity-40", 
                                                    stat.tone === 'brand' ? 'text-brand-primary' : 
                                                    stat.tone === 'info' ? 'text-status-info' : 
                                                    stat.tone === 'warning' ? 'text-status-warning' : 
                                                    'text-status-success'
                                                )} />
                                                <Typography variant="h2" className="text-2xl font-mono-numbers mb-1">{stat.val}</Typography>
                                                <Typography variant="caption" tone="muted" className="text-mx-micro uppercase tracking-widest">{stat.label}</Typography>
                                            </div>
                                        ))}
                                    </div>

                                    {c.note && (
                                        <footer className="pt-8 border-t border-border-default flex items-start gap-mx-sm relative z-10">
                                            <div className="w-mx-lg h-mx-lg rounded-mx-full bg-mx-indigo-50 flex items-center justify-center text-brand-primary shrink-0 shadow-inner">
                                                <MessageSquare size={14} />
                                            </div>
                                            <Typography variant="p" className="text-xs italic leading-relaxed text-text-secondary uppercase tracking-tight line-clamp-2">
                                                "{c.note}"
                                            </Typography>
                                        </footer>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </main>
    )
}
