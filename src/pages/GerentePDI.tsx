import { usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { 
    Plus, Target, CheckCircle2, Calendar, User, TrendingUp, 
    Search, X, Clock, RefreshCw, Printer, Award, Zap, 
    ChevronLeft, ChevronRight, LayoutDashboard, Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/atoms/Badge"
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

const statusCfg = {
    aberto: { variant: 'danger' as const, label: 'Aberto' },
    em_andamento: { variant: 'warning' as const, label: 'Em Execução' },
    concluido: { variant: 'success' as const, label: 'Concluído' }
}

const steps = [
    { id: 'goals', label: 'Metas de Carreira', icon: Target },
    { id: 'skills', label: 'Radar de Competências', icon: LayoutDashboard },
    { id: 'actions', label: 'Plano de Ação', icon: Zap }
]

const competences = [
    { id: 'comp_prospeccao', label: 'Prospecção' },
    { id: 'comp_abordagem', label: 'Abordagem' },
    { id: 'comp_demonstracao', label: 'Demonstração' },
    { id: 'comp_fechamento', label: 'Fechamento' },
    { id: 'comp_crm', label: 'Gestão CRM' },
    { id: 'comp_digital', label: 'Venda Digital' },
    { id: 'comp_disciplina', label: 'Disciplina' },
    { id: 'comp_organizacao', label: 'Organização' },
    { id: 'comp_negociacao', label: 'Negociação' },
    { id: 'comp_produto', label: 'Prod. Técnico' }
]

export default function GerentePDI() {
    const { role } = useAuth()
    const { pdis, loading, createPDI, updateStatus, createReview, refetch } = usePDIs()
    const { sellers } = useTeam()
    const navigate = useNavigate()
    const [showForm, setShowForm] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [showReviewForm, setShowReviewForm] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const canManagePDI = role === 'admin' || role === 'gerente'

    const [form, setForm] = useState({
        seller_id: '', meta_6m: '', meta_12m: '', meta_24m: '',
        comp_prospeccao: 6, comp_abordagem: 6, comp_demonstracao: 6, comp_fechamento: 6, comp_crm: 6,
        comp_digital: 6, comp_disciplina: 6, comp_organizacao: 6, comp_negociacao: 6, comp_produto: 6,
        action_1: '', action_2: '', action_3: '', action_4: '', action_5: '', due_date: ''
    })

    const [reviewForm, setReviewForm] = useState({ evolution: '', next_review_date: '' })

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
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Computando Planos...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg bg-white">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Ciclo de <span className="text-brand-primary">Evolução</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Personal Development Plan (PDI)</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                        <label htmlFor="search-pdi" className="sr-only">Buscar PDI</label>
                        <input
                            id="search-pdi"
                            type="text"
                            placeholder="BUSCAR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-alt border border-border-default rounded-full h-12 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    {canManagePDI && (
                        <Button onClick={() => setShowForm(true)} className="h-12 px-8 shadow-mx-lg">
                            <Plus size={18} aria-hidden="true" /> NOVO PDI
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg shrink-0 pb-32" aria-live="polite">
                <AnimatePresence mode="popLayout">
                    {filteredPDIs.map((p, i) => {
                        const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                        return (
                            <motion.article
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.01 }}
                                className="bg-white border border-border-default rounded-[2.5rem] p-8 shadow-mx-sm hover:shadow-mx-xl transition-all group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-8 relative z-10 border-b border-border-default pb-6">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-slate-950 text-xl shadow-inner group-hover:bg-brand-secondary group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                            {(p as any).seller_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <Typography variant="h3" className="text-lg truncate">{(p as any).seller_name}</Typography>
                                            <Typography variant="caption" tone="muted">VENDEDOR</Typography>
                                        </div>
                                    </div>
                                    <Badge variant={status.variant} className="h-7 px-4 rounded-lg">
                                        {status.label}
                                    </Badge>
                                </div>

                                <div className="space-y-8 flex-1 relative z-10 mb-8">
                                    <div className="space-y-2">
                                        <Typography variant="caption" tone="brand">Horizonte 06 Meses</Typography>
                                        <Typography variant="h2" className="text-xl line-clamp-2">{(p as any).meta_6m || 'PDI ATIVO'}</Typography>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Typography variant="caption" tone="muted">Ação Prioritária</Typography>
                                            <Badge variant="outline" className="text-[8px] h-5">#1</Badge>
                                        </div>
                                        <p className="text-sm font-bold text-gray-700 line-clamp-3 leading-relaxed bg-surface-alt p-4 rounded-2xl border border-border-default shadow-inner italic uppercase tracking-tight">
                                            "{p.action_1}"
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border-default flex items-center justify-between mt-auto relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-brand-primary" aria-hidden="true" />
                                            <Typography variant="mono" className="text-xs">
                                                {p.due_date ? format(parseISO(p.due_date), 'dd/MM/yy') : '--/--'}
                                            </Typography>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => {}} className="w-10 h-10 p-0 rounded-xl" aria-label="Imprimir PDI">
                                            <Printer size={18} aria-hidden="true" />
                                        </Button>
                                    </div>
                                    <Button variant="secondary" size="icon" className="w-12 h-12 rounded-xl shadow-mx-md">
                                        <ChevronRight size={24} aria-hidden="true" />
                                    </Button>
                                </div>
                            </motion.article>
                        )
                    })}
                </AnimatePresence>

                {filteredPDIs.length === 0 && !loading && (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-border-default bg-surface-alt/30 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-surface-alt transition-all">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-border-default group-hover:rotate-12 transition-transform duration-500" aria-hidden="true">
                            <TrendingUp size={48} className="text-text-tertiary" />
                        </div>
                        <Typography variant="h2" className="mb-2">Matriz Limpa</Typography>
                        <Typography variant="p" tone="muted" className="max-w-sm mx-auto mb-10 uppercase">Não localizamos planos de desenvolvimento ativos nesta unidade.</Typography>
                        {canManagePDI && (
                            <Button onClick={() => setShowForm(true)} className="px-12 py-6 rounded-full shadow-mx-xl">
                                INICIAR PRIMEIRO PDI
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
