import { useMyPDIs } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useState, useMemo, useCallback } from 'react'
import { 
    Target, Zap, TrendingUp, Calendar, Award, 
    RefreshCw, ChevronRight, LayoutDashboard, Sparkles,
    ShieldCheck, Star, History, CheckCircle2
    } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

export default function VendedorPDI() {
    const { profile } = useAuth()
    const { pdis, loading, refetch } = useMyPDIs()
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Plano de evolução sincronizado!')
    }, [refetch])

    const activePDI = useMemo(() => pdis.find((p: any) => p.status !== 'concluido') || pdis[0], [pdis])

    const radarData = useMemo(() => {
        if (!activePDI) return []
        return [
            { subject: 'Prospecção', A: (activePDI as any).comp_prospeccao || 0 },
            { subject: 'Abordagem', A: (activePDI as any).comp_abordagem || 0 },
            { subject: 'Demons.', A: (activePDI as any).comp_demonstracao || 0 },
            { subject: 'Fecham.', A: (activePDI as any).comp_fechamento || 0 },
            { subject: 'CRM', A: (activePDI as any).comp_crm || 0 },
            { subject: 'Digital', A: (activePDI as any).comp_digital || 0 },
        ]
    }, [activePDI])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-mx-10 h-mx-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Carreira...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Meu Plano de <span className="text-brand-primary">Carreira</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Personal Development Plan • MX ACADEMY</Typography>
                </div>

                <div className="flex items-center gap-mx-sm">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Badge variant="brand" className="px-6 py-3 rounded-mx-full shadow-mx-sm uppercase tracking-widest">Ativo</Badge>
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {!activePDI ? (
                    <div className="h-full min-h-mx-section-sm flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-mx-3xl">
                        <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-surface-alt shadow-xl flex items-center justify-center mb-8 border border-border-default" aria-hidden="true">
                            <Star size={48} className="text-text-tertiary" />
                        </div>
                        <Typography variant="h2" className="mb-2">Próximo Nível</Typography>
                        <Typography variant="p" tone="muted" className="max-w-xs uppercase">Seu PDI oficial ainda está sendo desenhado pela gerência.</Typography>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg">
                        
                        <div className="xl:col-span-8 space-y-mx-lg">
                            <Card className="p-mx-10 md:p-14 relative overflow-hidden group">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-sidebar-expanded h-mx-64 bg-brand-primary/5 rounded-mx-full blur-3xl -mr-32 -mt-32" aria-hidden="true" />
                                <div className="relative z-10 space-y-mx-xl">
                                    <div className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                                        <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg" aria-hidden="true"><Target size={28} className="text-brand-primary/80" /></div>
                                        <div>
                                            <Typography variant="h3">Objetivo de Curto Prazo</Typography>
                                            <Typography variant="caption" tone="muted">Horizonte 06 Meses</Typography>
                                        </div>
                                    </div>
                                    <Typography variant="h1" className="text-3xl md:text-4xl leading-tight">
                                        "{(activePDI as any).meta_6m || (activePDI as any).objective}"
                                    </Typography>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg pt-8">
                                        <div className="p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default shadow-inner">
                                            <Typography variant="caption" tone="muted" className="mb-2 block">12 Meses</Typography>
                                            <Typography variant="h3" className="text-base">{(activePDI as any).meta_12m || 'Definir na próxima revisão'}</Typography>
                                        </div>
                                        <div className="p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default shadow-inner">
                                            <Typography variant="caption" tone="muted" className="mb-2 block">24 Meses</Typography>
                                            <Typography variant="h3" className="text-base">{(activePDI as any).meta_24m || 'Plano em expansão'}</Typography>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-mx-10 md:p-14 space-y-mx-10">
                                <div className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                                    <div className="w-mx-14 h-mx-14 rounded-mx-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner" aria-hidden="true"><Zap size={28} /></div>
                                    <Typography variant="h3">Plano de Ação Imediato</Typography>
                                </div>
                                <div className="grid gap-mx-md">
                                    {[
                                        (activePDI as any).action_1, (activePDI as any).action_2, 
                                        (activePDI as any).action_3, (activePDI as any).action_4
                                    ].filter(Boolean).map((action, idx) => (
                                        <div key={idx} className="flex items-center gap-mx-md p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default hover:bg-white hover:shadow-mx-lg transition-all group">
                                            <div className="w-mx-10 h-mx-10 rounded-mx-xl bg-white border border-border-default flex items-center justify-center font-black text-xs text-text-tertiary group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all shadow-sm" aria-hidden="true">{idx + 1}</div>
                                            <Typography variant="p" className="text-sm font-bold text-text-secondary flex-1 uppercase tracking-tight">{action}</Typography>
                                            <CheckCircle2 size={20} className="text-text-tertiary/20 group-hover:text-status-success transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <aside className="xl:col-span-4 space-y-mx-lg">
                            <Card className="p-mx-10 flex flex-col items-center">
                                <Typography variant="h3" className="mb-8 w-full border-b border-border-default pb-6">Radar Técnico</Typography>
                                <div className="w-full aspect-square relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
                                            <Radar name="Competências" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeWidth={3} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <Typography variant="caption" tone="muted" className="mt-6 text-center">Referência MX de Alta Performance</Typography>
                            </Card>

                            <Card className="p-mx-10 space-y-mx-lg bg-brand-secondary text-white border-none shadow-mx-xl relative overflow-hidden">
                                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12" aria-hidden="true"><TrendingUp size={160} /></div>
                                <Typography variant="h3" tone="white">Próxima Revisão</Typography>
                                <div className="flex items-center gap-mx-sm">
                                    <Calendar size={32} className="text-brand-primary/80" aria-hidden="true" />
                                    <div>
                                        <Typography variant="h1" tone="white" className="text-3xl tabular-nums">
                                            {activePDI.due_date ? format(parseISO(activePDI.due_date), 'dd/MM/yy') : '--/--'}
                                        </Typography>
                                        <Typography variant="caption" tone="white" className="opacity-50">Auditado por Gestor</Typography>
                                    </div>
                                </div>
                            </Card>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    )
}
