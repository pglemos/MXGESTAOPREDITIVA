import { Link } from 'react-router-dom'
import { usePDIs } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo } from 'react'
import { 
    Plus, Calendar, TrendingUp, 
    Search, RefreshCw, Printer, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/atoms/Badge"
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card } from '@/components/molecules/Card'
import { WizardPDI } from '@/features/pdi/WizardPDI'

const statusCfg = {
    aberto: { variant: 'danger' as const, label: 'ABERTO' },
    em_andamento: { variant: 'warning' as const, label: 'EM EXECUÇÃO' },
    concluido: { variant: 'success' as const, label: 'CONCLUÍDO' },
    draft: { variant: 'warning' as const, label: 'RASCUNHO' }
}

export default function GerentePDI() {
    const { role } = useAuth()
    const { pdis, loading, refetch } = usePDIs()
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const canManagePDI = role === 'admin' || role === 'gerente' || role === 'dono'

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Matriz de PDI sincronizada!')
    }, [refetch])

    const filteredPDIs = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return pdis.filter((p: any) =>
            (p.meta_6m || p.objective || '').toLowerCase().includes(term) ||
            (p.seller_name || '').toLowerCase().includes(term)
        )
    }, [pdis, searchTerm])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt" role="status">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse uppercase font-black tracking-widest">Computando Planos...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt" id="main-content">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0" role="banner">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <Typography variant="h1">Ciclo de <span className="text-brand-primary">Evolução</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black opacity-40">PERSONAL DEVELOPMENT PLAN (PDI) • MX ACADEMY</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                        <Input
                            placeholder="BUSCAR PLANO..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 uppercase tracking-widest text-[10px] font-black"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12 bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    {canManagePDI && (
                        <Button onClick={() => setShowForm(true)} className="h-12 px-8 shadow-mx-lg bg-brand-secondary uppercase font-black tracking-widest text-xs">
                            <Plus size={18} className="mr-2" /> NOVO PDI
                        </Button>
                    )}
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <WizardPDI 
                        onClose={() => setShowForm(false)} 
                        onSuccess={() => { setShowForm(false); refetch() }} 
                    />
                )}
            </AnimatePresence>

            {/* PDI Grid */}
            <div className="flex-1 min-h-0 pb-32">
                {filteredPDIs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredPDIs.map((p, i) => {
                                const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                                return (
                                    <motion.article key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                        <Card className="p-8 h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <div>
                                                <header className="flex items-start justify-between mb-10 border-b border-border-default pb-6 relative z-10">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-14 h-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-xl shadow-mx-inner group-hover:bg-brand-secondary group-hover:text-white transition-all transform group-hover:rotate-3 uppercase">
                                                            {(p as any).seller_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Typography variant="h3" className="text-base uppercase tracking-tight truncate group-hover:text-brand-primary transition-colors font-black">{(p as any).seller_name}</Typography>
                                                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest opacity-40">ESPECIALISTA</Typography>
                                                        </div>
                                                    </div>
                                                    <Badge variant={status.variant} className="px-4 py-1 rounded-lg text-[10px] font-black shadow-sm uppercase border-none">{status.label}</Badge>
                                                </header>

                                                <div className="space-y-8 relative z-10">
                                                    <div className="space-y-2">
                                                        <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest mb-2 block">Objetivo 06 Meses</Typography>
                                                        <Typography variant="h2" className="text-xl leading-snug line-clamp-2 uppercase tracking-tighter font-black">"{(p as any).meta_6m || (p as any).objective || 'N/A'}"</Typography>
                                                    </div>
                                                </div>
                                            </div>

                                            <footer className="pt-8 border-t border-border-default flex items-center justify-between mt-10 relative z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-brand-primary" />
                                                        <Typography variant="mono" tone="muted" className="text-[10px] font-black uppercase opacity-40">
                                                            {p.due_date ? format(parseISO(p.due_date), 'dd/MM/yy') : '--/--'}
                                                        </Typography>
                                                    </div>
                                                    <Link to={`/pdi/print/${p.id}`}>
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-text-tertiary hover:text-brand-primary hover:bg-mx-indigo-50 bg-white shadow-sm border border-border-default">
                                                            <Printer size={18} />
                                                        </Button>
                                                    </Link>
                                                </div>
                                                <Button variant="secondary" size="icon" className="w-12 h-12 rounded-xl shadow-mx-md hover:scale-110 active:scale-95 transition-all">
                                                    <ChevronRight size={24} strokeWidth={2.5} />
                                                </Button>
                                            </footer>
                                        </Card>
                                    </motion.article>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-border-default bg-white/50 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="w-24 h-24 rounded-mx-3xl bg-surface-alt shadow-mx-xl flex items-center justify-center mb-8 border border-border-default group-hover:rotate-12 transition-transform duration-500">
                            <TrendingUp size={48} className="text-text-tertiary opacity-20" />
                        </div>
                        <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Matriz de Evolução Limpa</Typography>
                        <Typography variant="caption" tone="muted" className="max-w-sm mx-auto uppercase tracking-widest mb-10 font-black opacity-40">Não localizamos planos de desenvolvimento ativos na malha.</Typography>
                        {canManagePDI && (
                            <Button onClick={() => setShowForm(true)} className="h-16 px-12 rounded-full shadow-mx-elite font-black uppercase tracking-widest text-xs">
                                <Plus size={20} className="mr-3" /> INICIAR PRIMEIRO PDI
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
