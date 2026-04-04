import { useCheckins } from '@/hooks/useCheckins'
import { calcularFunil, identificarGargalo } from '@/lib/calculations'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useMemo } from 'react'
import type { Benchmark } from '@/types/database'
import { GitBranch, AlertTriangle, CheckCircle, BarChart3, Filter, ChevronRight, LayoutDashboard, Target, TrendingUp, Zap, ArrowUpRight, Store, Users, Globe, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

export default function Funil() {
    const { storeId } = useAuth()
    const { checkins, loading, refetch } = useCheckins()
    const [benchmark, setBenchmark] = useState<Benchmark | null>(null)
    const [isRefetching, setIsRefetching] = useState(false)

    useEffect(() => {
        if (!storeId) return
        supabase.from('benchmarks').select('*').eq('store_id', storeId).maybeSingle()
            .then(({ data }) => { if (data) setBenchmark(data) })
    }, [storeId])

    const funil = useMemo(() => calcularFunil(checkins), [checkins])
    
    const defaultBenchmark = useMemo((): Benchmark => ({ 
        id: '', store_id: storeId || '', lead_to_appt: 30, appt_to_visit: 50, visit_to_sale: 20 
    }), [storeId])

    const diagnostic = useMemo(() => identificarGargalo(funil, benchmark || defaultBenchmark), [funil, benchmark, defaultBenchmark])

    const steps = useMemo(() => [
        { label: 'Leads', value: funil.leads, pct: 100, bg: 'bg-brand-primary', color: 'text-brand-primary', subColor: 'bg-brand-primary-surface', bench: null },
        { label: 'Agendamentos', value: funil.agd_total, pct: funil.tx_lead_agd, bg: 'bg-status-info', color: 'text-status-info', subColor: 'bg-status-info-surface', bench: benchmark?.lead_to_appt || 30 },
        { label: 'Visitas', value: funil.visitas, pct: funil.tx_agd_visita, bg: 'bg-status-warning', color: 'text-status-warning', subColor: 'bg-status-warning-surface', bench: benchmark?.appt_to_visit || 50 },
        { label: 'Vendas', value: funil.vnd_total, pct: funil.tx_visita_vnd, bg: 'bg-status-success', color: 'text-status-success', subColor: 'bg-status-success-surface', bench: benchmark?.visit_to_sale || 20 },
    ], [funil, benchmark])

    const maxValue = Math.max(funil.leads, 1)

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse uppercase">Analizando Fluxo de Conversão...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Funil de Vendas</h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60">Diagnóstico de Gargalos & Taxas de Conversão</p>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={() => { setIsRefetching(true); refetch().then(() => setIsRefetching(false)) }} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button className="mx-button-primary bg-white !text-text-primary border border-border-default flex items-center gap-2"><Filter size={16} /> Período</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                {/* Diagnostic Panel */}
                <div className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <div className="mx-card p-mx-lg relative overflow-hidden group">
                        <div className={cn("absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] -mr-20 -mt-20 opacity-20 pointer-events-none", diagnostic.gargalo ? 'bg-status-error' : 'bg-status-success')} />
                        <div className="flex items-center gap-mx-sm mb-mx-lg relative z-10">
                            <div className={cn("w-12 h-12 rounded-mx-md flex items-center justify-center shadow-inner border transition-all group-hover:scale-110", diagnostic.gargalo ? 'bg-status-error-surface text-status-error border-mx-rose-100' : 'bg-status-success-surface text-status-success border-mx-emerald-100')}>
                                {diagnostic.gargalo ? <AlertTriangle size={24} strokeWidth={2.5} /> : <CheckCircle size={24} strokeWidth={2.5} />}
                            </div>
                            <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Diagnóstico</h3><p className="mx-text-caption !text-[8px]">Motor Preditivo MX</p></div>
                        </div>
                        <p className="text-lg font-black text-text-primary leading-tight italic mb-mx-lg relative z-10">"{diagnostic.mensagem}"</p>
                        <div className="bg-mx-slate-50/50 rounded-mx-xl p-mx-md border border-border-default relative z-10">
                            <div className="flex items-center gap-2 mb-mx-sm"><Zap size={14} className="text-brand-primary" fill="currentColor" /><span className="mx-text-caption">Benchmarks Ativos</span></div>
                            <div className="space-y-2">
                                {steps.slice(1).map(s => (
                                    <div key={s.label} className="flex justify-between items-center bg-white border border-border-subtle p-2 px-mx-sm rounded-mx-md shadow-mx-sm">
                                        <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{s.label}</span>
                                        <span className="bg-brand-primary-surface text-brand-primary px-2 py-0.5 rounded font-black text-[10px]">{s.bench}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Funnel Matrix */}
                <div className="lg:col-span-8">
                    <div className="mx-card p-mx-lg md:p-mx-xl relative overflow-hidden">
                        <div className="space-y-mx-2xl relative z-10">
                            {steps.map((step, i) => (
                                <div key={step.label} className="group/step">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-mx-lg">
                                        <div className={cn("w-14 h-14 shrink-0 rounded-mx-lg flex items-center justify-center font-black text-white shadow-mx-lg transition-all group-hover/step:rotate-3", step.bg)}>{i + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-mx-sm">
                                                <div>
                                                    <h4 className="font-black text-lg text-text-primary tracking-tight uppercase">{step.label}</h4>
                                                    <p className="mx-text-caption !text-[8px] opacity-60">Volumetria Operacional</p>
                                                </div>
                                                <div className="flex items-baseline gap-mx-md">
                                                    <span className="text-4xl font-black text-text-primary tracking-tighter font-mono-numbers">{step.value}</span>
                                                    {i > 0 && (
                                                        <div className={cn("flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border shadow-mx-sm", step.pct < (step.bench || 0) ? 'bg-status-error-surface text-status-error border-mx-rose-100' : 'bg-status-success-surface text-status-success border-mx-emerald-100')}>
                                                            {step.pct}% {step.pct >= (step.bench || 0) ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <AlertTriangle size={12} strokeWidth={2.5} />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-2 bg-mx-slate-50 border border-border-subtle rounded-full overflow-hidden relative shadow-inner p-px">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max((step.value / maxValue) * 100, 2)}%` }} transition={{ duration: 1.2, delay: i * 0.1 }} className={cn("h-full rounded-full shadow-mx-sm transition-all", step.bg)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
