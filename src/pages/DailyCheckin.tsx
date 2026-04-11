import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
    Zap, Target, Calendar, CheckCircle2, AlertTriangle, 
    RefreshCw, MessageSquare, ArrowRight, Smartphone, 
    ShieldCheck, Activity, TrendingUp, Search, History,
    Globe
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCheckins, calculateReferenceDate } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { supabase } from '@/lib/supabase'

export default function DailyCheckin() {
    const { profile } = useAuth()
    const { checkins, loading: checkinsLoading, submitCheckin, refetch: refetchCheckins } = useCheckins()
    const { storeGoal } = useGoals()
    
    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    
    const referenceDate = useMemo(() => calculateReferenceDate(), [])
    const referenceDateLabel = useMemo(() => format(parseISO(referenceDate), "eeee, dd 'de' MMMM", { locale: ptBR }), [referenceDate])
    
    const todayCheckin = useMemo(() => {
        return (checkins || []).find(c => c.reference_date === referenceDate && c.seller_user_id === profile?.id)
    }, [checkins, referenceDate, profile])

    const [form, setForm] = useState({
        leads_prev_day: 0,
        agd_cart_prev_day: 0,
        agd_net_prev_day: 0,
        visit_prev_day: 0,
        vnd_porta_prev_day: 0,
        vnd_cart_prev_day: 0,
        vnd_net_prev_day: 0,
        agd_cart_today: 0,
        agd_net_today: 0,
        note: '',
        zero_reason: ''
    })

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetchCheckins(); setIsRefetching(false)
        toast.success('Sincronizado!')
    }, [refetchCheckins])

    const handleSubmit = async () => {
        setSaving(true)
        const { error } = await submitCheckin({ ...form, reference_date: referenceDate })
        setSaving(false)
        if (error) toast.error(error); else { toast.success('Check-in firmado com sucesso!'); setStep(1); refetchCheckins() }
    }

    if (checkinsLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-mx-10 h-mx-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Terminal...</Typography>
        </div>
    )

    if (todayCheckin) return (
        <main className="w-full h-full flex flex-col items-center justify-center p-mx-lg bg-surface-alt text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full space-y-mx-10">
                <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-status-success-surface border border-mx-emerald-100 text-status-success flex items-center justify-center mx-auto shadow-mx-xl" aria-hidden="true">
                    <ShieldCheck size={48} strokeWidth={2} />
                </div>
                <div className="space-y-mx-sm">
                    <Typography variant="h1">Check-in <Typography as="span" className="text-status-success">Firmado</Typography></Typography>
                    <Typography variant="p" tone="muted" className="max-w-xs mx-auto uppercase">Seu registro operacional para {referenceDateLabel} já está na malha.</Typography>
                </div>
                <Card className="p-mx-lg border-none bg-white shadow-mx-lg">
                    <div className="flex items-center justify-between mb-6">
                        <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">Status da Tropa</Typography>
                        <Badge variant="success">
                            <Typography variant="tiny" as="span" className="font-black">OK</Typography>
                        </Badge>
                    </div>
                    <Typography variant="p" className="text-sm font-bold text-text-secondary leading-relaxed italic">
                        "{todayCheckin.note || 'Operação em andamento. Foco no fechamento.'}"
                    </Typography>
                </Card>
                <div className="flex flex-col gap-mx-sm">
                    <Button variant="outline" onClick={handleRefresh} className="rounded-mx-full h-mx-14 uppercase tracking-widest bg-white">
                        <RefreshCw size={16} className={cn("mr-2", isRefetching && "animate-spin")} /> <Typography variant="tiny" as="span" className="font-black">Sincronizar Nuvem</Typography>
                    </Button>
                </div>
            </motion.div>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            {/* Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Terminal <Typography as="span" className="text-brand-primary">MX</Typography></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">Operational Check-in • {referenceDateLabel}</Typography>
                </div>
                
                <div className="flex items-center gap-mx-sm">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-mx-xl shadow-mx-sm bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <Badge variant="brand" className="px-6 py-3 rounded-mx-full shadow-mx-sm">
                        <Typography variant="tiny" as="span" className="font-black uppercase tracking-widest">Aguardando Registro</Typography>
                    </Badge>
                </div>
            </header>

            {/* Steps Container */}
            <div className="flex-1 min-h-0 pb-32">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto w-full"
                        >
                            <Card className="p-mx-10 md:p-14 space-y-mx-xl">
                                <div className="space-y-mx-sm">
                                    <Typography variant="h2">Resultados de Ontem</Typography>
                                    <Typography variant="p" tone="muted">Informe o volume transacional do último dia de operação.</Typography>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                                    <FormField 
                                        label="Leads Recebidos"
                                        type="number"
                                        icon={<Zap size={18} />}
                                        value={form.leads_prev_day}
                                        onChange={(e) => setForm(f => ({ ...f, leads_prev_day: Number(e.target.value) }))}
                                    />
                                    <FormField 
                                        label="Visitas Realizadas"
                                        type="number"
                                        icon={<Smartphone size={18} />}
                                        value={form.visit_prev_day}
                                        onChange={(e) => setForm(f => ({ ...f, visit_prev_day: Number(e.target.value) }))}
                                    />
                                    <div className="p-mx-md rounded-mx-2xl bg-surface-alt border-2 border-dashed border-border-default flex flex-col items-center justify-center text-center">
                                        <Typography variant="caption" tone="muted" className="mb-1">Total de Vendas</Typography>
                                        <Typography variant="h1" className="text-brand-primary">
                                            {form.vnd_porta_prev_day + form.vnd_cart_prev_day + form.vnd_net_prev_day}
                                        </Typography>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg pt-8 border-t border-border-default">
                                    <FormField 
                                        label="Vendas Porta"
                                        type="number"
                                        value={form.vnd_porta_prev_day}
                                        onChange={(e) => setForm(f => ({ ...f, vnd_porta_prev_day: Number(e.target.value) }))}
                                    />
                                    <FormField 
                                        label="Vendas Carteira"
                                        type="number"
                                        value={form.vnd_cart_prev_day}
                                        onChange={(e) => setForm(f => ({ ...f, vnd_cart_prev_day: Number(e.target.value) }))}
                                    />
                                    <FormField 
                                        label="Vendas Internet"
                                        type="number"
                                        value={form.vnd_net_prev_day}
                                        onChange={(e) => setForm(f => ({ ...f, vnd_net_prev_day: Number(e.target.value) }))}
                                    />
                                </div>

                                <div className="flex justify-end pt-10">
                                    <Button size="lg" onClick={() => setStep(2)} className="px-12 rounded-mx-full shadow-mx-xl">
                                        Próximo Passo <ArrowRight className="ml-2" />
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-4xl mx-auto w-full"
                        >
                            <Card className="p-mx-10 md:p-14 space-y-mx-xl">
                                <div className="space-y-mx-sm">
                                    <Typography variant="h2">Agenda de Hoje</Typography>
                                    <Typography variant="p" tone="muted">Quantos agendamentos você tem confirmados para este dia?</Typography>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                                    <FormField 
                                        label="Agendamentos Carteira"
                                        type="number"
                                        icon={<History size={18} />}
                                        value={form.agd_cart_today}
                                        onChange={(e) => setForm(f => ({ ...f, agd_cart_today: Number(e.target.value) }))}
                                    />
                                    <FormField 
                                        label="Agendamentos Internet"
                                        type="number"
                                        icon={<Globe size={18} />}
                                        value={form.agd_net_today}
                                        onChange={(e) => setForm(f => ({ ...f, agd_net_today: Number(e.target.value) }))}
                                    />
                                </div>

                                <div className="space-y-mx-sm pt-8 border-t border-border-default">
                                    <Typography variant="caption" tone="muted" className="uppercase font-black tracking-widest">Observações Táticas</Typography>
                                    <textarea 
                                        className="w-full min-h-mx-32 p-mx-md rounded-mx-2xl bg-surface-alt border border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm outline-none resize-none"
                                        placeholder="Algum desafio ou observação para o dia de hoje?"
                                        value={form.note}
                                        onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                                    />
                                </div>

                                <div className="flex justify-between pt-10">
                                    <Button variant="outline" onClick={() => setStep(1)} className="px-10 rounded-mx-full">
                                        Voltar
                                    </Button>
                                    <Button size="lg" onClick={handleSubmit} disabled={saving} className="px-16 rounded-mx-full shadow-mx-xl bg-brand-primary hover:bg-brand-primary/90">
                                        {saving ? <RefreshCw className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                        Firmar Check-in
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    )
}
 )
}
