import { useCheckins } from '@/hooks/useCheckins'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { 
    Filter, Search, RefreshCw, Zap, TrendingUp, 
    Target, AlertTriangle, CheckCircle2, ArrowRight,
    Users, Globe, Eye, History, LayoutDashboard
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function Funil() {
    const { role, storeId } = useAuth()
    const { checkins, loading, fetchCheckins } = useCheckins()
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)

    const funilData = useMemo(() => calcularFunil(checkins), [checkins])
    const diagnostico = useMemo(() => gerarDiagnosticoMX(funilData), [funilData])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        await fetchCheckins()
        setIsRefetching(false)
        toast.success('Funil sincronizado!')
    }, [fetchCheckins])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Escoamento...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Funil de <span className="text-indigo-600">Vendas</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Análise de Conversão & Escoamento MX</Typography>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefetching} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    <div className="bg-white p-1 rounded-full border border-border-default shadow-mx-sm flex gap-1">
                        <Button variant="secondary" size="sm" className="h-10 rounded-full px-6 shadow-mx-sm">Visão Geral</Button>
                        <Button variant="ghost" size="sm" className="h-10 rounded-full px-6">Por Vendedor</Button>
                    </div>
                </div>
            </div>

            {/* Diagnóstico da Unidade */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                <Card className="lg:col-span-8 bg-brand-secondary text-white p-10 shadow-mx-xl relative overflow-hidden border-none group">
                    <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-10">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center border-4 border-white/10 shadow-2xl group-hover:rotate-12 transition-transform shrink-0" aria-hidden="true">
                            <Zap size={40} className="text-white" />
                        </div>
                        <div className="space-y-4">
                            <Typography variant="caption" tone="white" className="opacity-50">Diagnóstico Automático</Typography>
                            <Typography variant="h2" tone="white" className="text-2xl md:text-3xl italic">"{diagnostico.diagnostico}"</Typography>
                            <div className="flex items-center gap-3 pt-4">
                                <TrendingUp size={20} className="text-indigo-400" aria-hidden="true" />
                                <Typography variant="p" tone="white" className="text-sm font-bold opacity-80">{diagnostico.sugestao}</Typography>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-4 p-10 flex flex-col justify-between">
                    <div className="space-y-2">
                        <Typography variant="caption" tone="muted">Eficiência Global</Typography>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none">{funilData.tx_visita_vnd}%</Typography>
                    </div>
                    <div className="pt-8 border-t border-border-default mt-8">
                        <div className="flex justify-between items-center mb-2">
                            <Typography variant="caption">Meta de Conversão</Typography>
                            <Typography variant="mono" className="text-xs">33%</Typography>
                        </div>
                        <div className="h-2 w-full bg-surface-alt rounded-full overflow-hidden" role="progressbar" aria-valuenow={funilData.tx_visita_vnd} aria-valuemin={0} aria-valuemax={100}>
                            <div className={cn("h-full transition-all duration-1000", funilData.tx_visita_vnd >= 33 ? "bg-status-success" : "bg-status-error")} style={{ width: `${Math.min(funilData.tx_visita_vnd, 100)}%` }} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Matrix de Conversão */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                {[
                    { label: 'Leads Novos', value: funilData.leads, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Agendamentos', value: funilData.agd_total, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Visitas Loja', value: funilData.visitas, icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Vendas Totais', value: funilData.vnd_total, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(item => (
                    <Card key={item.label} className="p-8 group hover:shadow-mx-xl transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", item.bg)} aria-hidden="true">
                                <item.icon size={22} className={item.color} />
                            </div>
                            <Typography variant="caption" tone="muted">{item.label}</Typography>
                        </div>
                        <Typography variant="h1" className="text-4xl tabular-nums">{item.value}</Typography>
                    </Card>
                ))}
            </div>

            {/* Funil Visual */}
            <Card className="w-full mb-32">
                <CardHeader>
                    <CardTitle>Fluxo de Escoamento</CardTitle>
                    <CardDescription>Taxas de conversão entre etapas do funil</CardDescription>
                </CardHeader>
                <CardContent className="p-10">
                    <div className="flex flex-col gap-10">
                        {[
                            { from: 'Leads', to: 'Agendamentos', val: funilData.tx_lead_agd, bench: 20 },
                            { from: 'Agendamentos', to: 'Visitas', val: funilData.tx_agd_visita, bench: 60 },
                            { from: 'Visitas', to: 'Vendas', val: funilData.tx_visita_vnd, bench: 33 },
                        ].map((step, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row items-center gap-10">
                                <div className="flex-1 w-full space-y-4">
                                    <div className="flex justify-between items-end">
                                        <Typography variant="h3" className="text-base">{step.from} → {step.to}</Typography>
                                        <div className="flex items-baseline gap-2">
                                            <Typography variant="h2" className="text-2xl" tone={step.val >= step.bench ? 'success' : 'error'}>{step.val}%</Typography>
                                            <Typography variant="caption" tone="muted">Benchmark: {step.bench}%</Typography>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-surface-alt rounded-full overflow-hidden border border-border-default shadow-inner" role="progressbar" aria-valuenow={step.val} aria-valuemin={0} aria-valuemax={100}>
                                        <div className={cn("h-full transition-all duration-1000", step.val >= step.bench ? "bg-status-success" : "bg-status-error")} style={{ width: `${Math.min(step.val, 100)}%` }} />
                                    </div>
                                </div>
                                {idx < 2 && <ArrowRight size={32} className="text-border-default hidden md:block" aria-hidden="true" />}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
