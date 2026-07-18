import { useNavigate } from 'react-router-dom'
import { usePDISessions } from '@/hooks/usePDI_MX'
import { useAuth } from '@/hooks/useAuth'
import { canManagePDI as canManagePDICapability } from '@/lib/auth/capabilities'
import { useState, useCallback, useMemo } from 'react'
import { 
    Plus, Calendar, TrendingUp, 
    Search, RefreshCw, Printer, ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from '@/lib/toast'
import { format, parseISO } from 'date-fns'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/atoms/Badge"
import { Typography } from '@/components/atoms/Typography'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Avatar } from '@/components/atoms/Avatar'
import { Card } from '@/components/molecules/Card'
import { SellerPageHeader } from '@/components/seller/SellerPageHeader'
import { WizardPDI } from '@/features/pdi/WizardPDI'

const statusCfg = {
    aberto: { variant: 'danger' as const, label: 'ABERTO' },
    em_andamento: { variant: 'warning' as const, label: 'EM EXECUÇÃO' },
    concluido: { variant: 'success' as const, label: 'CONCLUÍDO' },
    draft: { variant: 'warning' as const, label: 'RASCUNHO' }
}

function formatSafeDate(value?: string | null) {
    if (!value) return '--/--'
    try {
        return format(parseISO(value), 'dd/MM/yy')
    } catch {
        return '--/--'
    }
}

export default function GerentePDI() {
    const { role } = useAuth()
    const navigate = useNavigate()
    const { pdis, loading, refetch } = usePDISessions()
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const isOwner = role === 'dono'
    const isManager = role === 'gerente'
    const canManagePDI = canManagePDICapability(role)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await refetch()
            toast.success('Matriz de PDI sincronizada.')
        } catch {
            toast.error('Não foi possível atualizar os PDIs.')
        } finally {
            setIsRefetching(false)
        }
    }, [refetch])

    const filteredPDIs = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return pdis.filter(p =>
            (p.meta_6m || '').toLowerCase().includes(term) ||
            (p.meta_12m || '').toLowerCase().includes(term) ||
            (p.meta_24m || '').toLowerCase().includes(term) ||
            (p.seller_name || '').toLowerCase().includes(term) ||
            (p.store_name || '').toLowerCase().includes(term)
        )
    }, [pdis, searchTerm])

    if (loading) return (
        <main
            className="w-full h-full flex flex-col gap-8 p-8 bg-gray-50 animate-in fade-in duration-500"
            aria-busy="true"
            aria-live="polite"
            aria-label="Carregando PDI"
        >
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-2 w-48" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <Skeleton className="h-14 w-48 rounded-2xl" />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-8 p-8 overflow-y-auto no-scrollbar bg-gray-50">
            <SellerPageHeader
                icon={TrendingUp}
                title={isOwner ? 'PDI da Rede' : 'Evolução do Vendedor'}
                subtitle={isOwner ? 'Acompanhamento executivo dos planos de desenvolvimento' : 'Planos de desenvolvimento da equipe'}
                actions={(
                    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full sm:w-auto">
                        <div className="relative group w-full sm:w-72">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-600 transition-colors" />
                            <label htmlFor="pdi-search" className="sr-only">Buscar plano de PDI</label>
                            <Input
                                id="pdi-search"
                                name="pdi-search"
                                placeholder="BUSCAR PLANO..." value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="!pl-11 !h-12 uppercase tracking-widest text-[10px] font-black"
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar lista de PDIs" className="rounded-2xl shadow-sm h-12 w-12 bg-white border-gray-100 hover:bg-gray-50">
                            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                        </Button>
                        {canManagePDI && (
                            <Button onClick={() => setShowForm(true)} className="h-12 px-8 shadow-sm bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-xs tracking-widest rounded-2xl text-white">
                                <Plus size={18} className="mr-2" /> NOVO PDI
                            </Button>
                        )}
                    </div>
                )}
            />

            {isManager && (
                <Card className="rounded-2xl border border-blue-600/20 bg-blue-50 p-6 shadow-sm">
                    <Typography variant="h3" className="uppercase tracking-tight text-blue-600">Escopo do gerente</Typography>
                    <Typography variant="p" className="mt-2 text-sm text-blue-600">
                        Esta tela mostra os PDIs da sua unidade. Use o botão de novo PDI para conduzir desenvolvimento da equipe; Admin MX e Dono usam a mesma rota em escopos diferentes.
                    </Typography>
                </Card>
            )}

            {isOwner && (
                <Card className="rounded-2xl border border-blue-600/20 bg-blue-50 p-6 shadow-sm">
                    <Typography variant="h3" className="uppercase tracking-tight text-blue-600">PDI como acompanhamento do Dono</Typography>
                    <Typography variant="p" className="mt-2 text-sm text-blue-600">
                        Esta visão mostra evolução, prazos e consistência dos planos. Criação e condução de PDI ficam com gerente/Admin MX; aqui o foco é decidir onde cobrar cadência.
                    </Typography>
                </Card>
            )}

            <AnimatePresence>
                {showForm && (
                    <WizardPDI 
                        onClose={() => setShowForm(false)} 
                        onSuccess={async (sessionId) => {
                            setShowForm(false)
                            await refetch()
                            if (sessionId) navigate(`/pdi/${sessionId}/print`)
                        }} 
                    />
                )}
            </AnimatePresence>

            {/* PDI Grid */}
            <div className="flex-1 min-h-0 pb-32">
                {filteredPDIs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredPDIs.map((p, i) => {
                                const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                                return (
                                    <motion.article key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                        <Card className="rounded-2xl border border-gray-100 p-6 h-full flex flex-col justify-between group hover:shadow-sm transition-all shadow-sm bg-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                            
                                            <div>
                                                <header className="flex items-start justify-between mb-10 border-b border-gray-100 pb-6 relative z-10">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <Avatar
                                                            src={p.seller_avatar_url || undefined}
                                                            alt={`Avatar de ${p.seller_name || 'vendedor'}`}
                                                            fallback={p.seller_name || 'U'}
                                                            size="lg"
                                                            className="w-14 h-14 rounded-2xl shadow-inner group-hover:border-emerald-600 transition-all transform group-hover:rotate-3"
                                                        />
                                                        <div className="min-w-0">
                                                            <Typography variant="h3" className="text-base uppercase tracking-tight truncate group-hover:text-emerald-600 transition-colors font-black">{p.seller_name}</Typography>
                                                            <Typography variant="tiny" tone="muted" className="font-black uppercase tracking-widest">ESPECIALISTA</Typography>
                                                        </div>
                                                    </div>
                                                    <Badge variant={status.variant} className="px-4 py-1 rounded-2xl text-[10px] font-black shadow-sm uppercase border-none">{status.label}</Badge>
                                                </header>

                                                <div className="space-y-8 relative z-10">
                                                    <div className="space-y-2">
                                                        <Typography variant="tiny" tone="brand" className="font-black uppercase tracking-widest mb-2 block">Objetivo 06 Meses</Typography>
                                                        <Typography variant="h2" className="text-xl leading-snug line-clamp-2 uppercase tracking-tighter font-black">"{p.meta_6m || 'N/A'}"</Typography>
                                                    </div>
                                                </div>
                                            </div>

                                            <footer className="pt-8 border-t border-gray-100 flex items-center justify-between mt-10 relative z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-emerald-600" />
                                                        <Typography variant="mono" tone="muted" className="text-[10px] font-black uppercase">
                                                            {formatSafeDate(p.due_date)}
                                                        </Typography>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/pdi/${p.id}/print`)} className="w-10 h-10 rounded-2xl text-gray-500 hover:text-emerald-600 hover:bg-indigo-50 bg-white shadow-sm border border-gray-100" aria-label={`Imprimir PDI de ${p.seller_name || 'vendedor'}`}>
                                                        <Printer size={18} />
                                                    </Button>
                                                </div>
                                                <Button type="button" variant="secondary" size="icon" onClick={() => navigate(`/pdi/${p.id}/print`)} className="w-12 h-12 rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all" aria-label={`Abrir PDI de ${p.seller_name || 'vendedor'}`}>
                                                    <ChevronRight size={24} strokeWidth={2} />
                                                </Button>
                                            </footer>
                                        </Card>
                                    </motion.article>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="col-span-full py-40 rounded-2xl text-center border border-dashed border-gray-100 bg-white shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="w-24 h-24 rounded-2xl bg-gray-50 shadow-sm flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <TrendingUp size={48} className="text-gray-500 opacity-20" />
                        </div>
                        <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Matriz de Evolução Limpa</Typography>
                        <Typography variant="caption" tone="muted" className="max-w-sm mx-auto uppercase tracking-widest mb-10 font-black">Não localizamos planos de desenvolvimento para os filtros atuais.</Typography>
                        {canManagePDI && (
                            <Button onClick={() => setShowForm(true)} className="h-16 px-12 rounded-2xl shadow-sm font-black uppercase tracking-widest text-xs">
                                <Plus size={20} className="mr-3" /> INICIAR PRIMEIRO PDI
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
