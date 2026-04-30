import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
    Zap, Target, Calendar, CheckCircle2, AlertTriangle, 
    RefreshCw, MessageSquare, ArrowRight, Smartphone, 
    ShieldCheck, Activity, TrendingUp, Search, History,
    AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useFeedbacks } from '@/hooks/useData'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'

export default function VendedorFeedback() {
    const { profile } = useAuth()
    const { feedbacks, loading, acknowledge, refetch } = useFeedbacks()
    const [isAcknowledging, setIsAcknowledging] = useState<string | null>(null)
    const [isRefetching, setIsRefetching] = useState(false)

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Feedbacks sincronizados!')
    }, [refetch])

    const handleAcknowledge = async (id: string) => {
        setIsAcknowledging(id)
        await acknowledge(id)
        setIsAcknowledging(null)
        toast.success('Ciência registrada com sucesso!')
    }

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-mx-10 h-mx-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Feedbacks...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Meus <span className="text-mx-green-700">Feedbacks</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Histórico de Performance e Ajustes Táticos</Typography>
                </div>

                <div className="flex items-center gap-mx-sm">
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" disabled={isRefetching} className="rounded-mx-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Badge variant="brand" className="px-6 py-3 rounded-mx-full shadow-mx-sm uppercase tracking-widest">Atualizado</Badge>
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32">
                {feedbacks.length === 0 ? (
                    <div className="h-full min-h-mx-section-sm flex flex-col items-center justify-center text-center p-mx-xl bg-white border-2 border-dashed border-border-default rounded-mx-3xl">
                        <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-surface-alt shadow-xl flex items-center justify-center mb-8 border border-border-default" aria-hidden="true">
                            <MessageSquare size={48} className="text-text-tertiary" />
                        </div>
                        <Typography variant="h2" className="mb-2">Nenhuma Devolutiva</Typography>
                        <Typography variant="p" tone="muted" className="max-w-xs uppercase">Seu gestor ainda não registrou rituais de devolutiva para você.</Typography>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-mx-lg">
                        <AnimatePresence>
                            {feedbacks.map((f) => (
                                <motion.article 
                                    key={f.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative"
                                >
                                    <Card className="p-mx-10 md:p-14 h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg">
                                        <div className="space-y-mx-10">
                                            <div className="flex items-center justify-between border-b border-border-default pb-8">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-xl h-mx-xl rounded-mx-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner" aria-hidden="true">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <Typography variant="h3">Semana {f.week_reference}</Typography>
                                                        <Typography variant="caption" tone="muted">Auditado por {f.manager_name}</Typography>
                                                    </div>
                                                </div>
                                                {!f.acknowledged && <Badge variant="danger" className="animate-pulse">Pendente</Badge>}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-lg">
                                                <div className="space-y-mx-tiny">
                                                    <Typography variant="caption" tone="success" className="flex items-center gap-mx-xs font-black"><TrendingUp size={14} /> Pontos Fortes</Typography>
                                                    <p className="text-sm font-bold text-text-secondary leading-relaxed italic bg-status-success-surface p-mx-5 rounded-mx-2xl border border-mx-emerald-100 shadow-inner">"{f.positives}"</p>
                                                </div>
                                                <div className="space-y-mx-tiny">
                                                    <Typography variant="caption" tone="error" className="flex items-center gap-mx-xs font-black"><AlertCircle size={14} /> Oportunidades</Typography>
                                                    <p className="text-sm font-bold text-text-secondary leading-relaxed italic bg-status-error-surface p-mx-5 rounded-mx-2xl border border-mx-rose-100 shadow-inner">"{f.attention_points}"</p>
                                                </div>
                                            </div>

                                            <div className="pt-8 border-t border-border-default">
                                                <Typography variant="caption" tone="brand" className="mb-4 flex items-center gap-mx-xs font-black"><Target size={16} /> Próximo Passo</Typography>
                                                <Typography variant="h3" className="text-base text-brand-primary">{f.action}</Typography>
                                            </div>
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-border-default">
                                            {!f.acknowledged ? (
                                                <Button 
                                                    onClick={() => handleAcknowledge(f.id)}
                                                    disabled={isAcknowledging === f.id}
                                                    className="w-full h-mx-14 rounded-mx-full shadow-mx-xl"
                                                >
                                                    {isAcknowledging === f.id ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck size={18} className="mr-2" />}
                                                    CIENTE DO FEEDBACK
                                                </Button>
                                            ) : (
                                                <div className="flex items-center justify-center gap-mx-xs text-status-success">
                                                    <CheckCircle2 size={16} aria-hidden="true" />
                                                    <Typography variant="caption" tone="success">LEITURA CONFIRMADA EM {format(parseISO(f.acknowledged_at!), 'dd/MM/yy')}</Typography>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.article>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </main>
    )
}
