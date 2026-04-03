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
        supabase.from('benchmarks')
            .select('*')
            .eq('store_id', storeId)
            .maybeSingle()
            .then(({ data, error }) => { 
                if (error) console.error('Audit Error [10]: fetchBenchmark fail ->', error.message)
                if (data) setBenchmark(data) 
            })
            .catch(err => console.error('Audit Error [10]: fetchBenchmark crash ->', err))
    }, [storeId])

    const funil = useMemo(() => calcularFunil(checkins), [checkins])
    
    const defaultBenchmark = useMemo((): Benchmark => ({ 
        id: '', 
        store_id: storeId || '', 
        lead_to_appt: 30, 
        appt_to_visit: 50, 
        visit_to_sale: 20 
    }), [storeId])

    const diagnostic = useMemo(() => 
        identificarGargalo(funil, benchmark || defaultBenchmark)
    , [funil, benchmark, defaultBenchmark])

    const steps = useMemo(() => [
        { label: 'Leads', value: funil.leads, pct: 100, bg: 'bg-indigo-600', color: 'text-indigo-600', subColor: 'bg-indigo-50', bench: null },
        { label: 'Agendamentos', value: funil.agd_total, pct: funil.tx_lead_agd, bg: 'bg-blue-600', color: 'text-blue-600', subColor: 'bg-blue-50', bench: benchmark?.lead_to_appt || 30 },
        { label: 'Visitas', value: funil.visitas, pct: funil.tx_agd_visita, bg: 'bg-amber-500', color: 'text-amber-600', subColor: 'bg-amber-50', bench: benchmark?.appt_to_visit || 50 },
        { label: 'Vendas', value: funil.vnd_total, pct: funil.tx_visita_vnd, bg: 'bg-emerald-600', color: 'text-emerald-600', subColor: 'bg-emerald-50', bench: benchmark?.visit_to_sale || 20 },
    ], [funil, benchmark])

    const maxValue = Math.max(funil.leads, 1)

    const handleManualRefresh = async () => {
        setIsRefetching(true)
        await refetch()
        setIsRefetching(false)
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Mapeando eficiência do funil...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Funil de Vendas
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Análise de Conversão e Gargalos</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={handleManualRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all"
                    >
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-full bg-white border border-gray-100 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm hover:shadow-md transition-all">
                        <Filter size={16} /> Período
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0">

                {/* Diagnostic Panel */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation p-8 relative overflow-hidden group">
                        <div className={cn(
                            "absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] -mr-20 -mt-20 opacity-40 transition-colors pointer-events-none",
                            diagnostic.gargalo ? 'bg-rose-100' : 'bg-emerald-100'
                        )} />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border transition-all group-hover:scale-110",
                                    diagnostic.gargalo ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                )}>
                                    {diagnostic.gargalo ? <AlertTriangle size={24} strokeWidth={2.5} /> : <CheckCircle size={24} strokeWidth={2.5} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Diagnóstico</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Motor Preditivo MX</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mb-10">
                            <p className="text-lg font-black text-pure-black leading-tight tracking-tight mb-4 italic">
                                "{diagnostic.mensagem}"
                            </p>
                        </div>

                        <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <Zap size={14} className="text-electric-blue" fill="currentColor" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Benchmarks de Mercado</span>
                            </div>
                            <div className="space-y-4">
                                {steps.slice(1).map(s => (
                                    <div key={s.label} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                                        <span className="bg-indigo-50 text-electric-blue px-3 py-1 rounded-lg font-black text-[10px] border border-indigo-100">{s.bench}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Funnel Visualization */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-gray-100 shadow-elevation rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle,rgba(79,70,229,0.01)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
                        
                        <div className="space-y-14 relative z-10">
                            {steps.map((step, i) => (
                                <div key={step.label} className="relative group/step">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-8">
                                        <div className={cn(
                                            "w-14 h-14 shrink-0 rounded-[1.2rem] flex items-center justify-center font-black text-white shadow-2xl transition-all group-hover/step:scale-110 group-hover/step:rotate-3",
                                            step.bg
                                        )}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <h4 className="text-pure-black font-black text-lg tracking-tight uppercase tracking-widest">{step.label}</h4>
                                                    <p className="text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] opacity-60">
                                                        {i === 0 ? 'Volume Operacional Consolidado' : `Taxa de Conversão da Etapa`}
                                                    </p>
                                                </div>
                                                <div className="flex items-baseline gap-4">
                                                    <span className="text-4xl font-black text-pure-black tracking-tighter">{step.value}</span>
                                                    {i > 0 && (
                                                        <div className={cn(
                                                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                                            step.pct < (step.bench || 0) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        )}>
                                                            {step.pct}% {step.pct >= (step.bench || 0) ? <ArrowUpRight size={12} strokeWidth={3} /> : <AlertTriangle size={12} strokeWidth={3} />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-4 bg-gray-50 border border-gray-100 rounded-full overflow-hidden relative shadow-inner">
                                                <motion.div
                                                    layoutId={`funnel-bar-${i}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max((step.value / maxValue) * 100, 2)}%` }}
                                                    transition={{ duration: 1.2, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                                    className={cn("h-full rounded-full shadow-lg group-hover/step:brightness-110 transition-all", step.bg)}
                                                />
                                                {step.bench && (
                                                    <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-pure-black/10 group-hover/step:border-pure-black/30 transition-colors"
                                                        style={{ left: `${step.bench}%` }}
                                                    >
                                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-pure-black text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/step:opacity-100 transition-opacity">GOAL: {step.bench}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance by Channel */}
            <div className="bg-white border border-gray-100 p-8 md:p-12 rounded-[3rem] shadow-elevation mb-20 overflow-hidden relative group">
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-50/50 rounded-full blur-[100px] z-0 pointer-events-none" />

                <div className="flex items-center gap-4 mb-12 relative z-10">
                    <div className="w-2 h-10 bg-pure-black rounded-full" />
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-pure-black">Análise Multicanal</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Distribuição por Origem de Leads</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {[
                        { label: 'Unidade Física', color: 'text-blue-600', icon: Store, tone: 'bg-blue-50 border-blue-100' },
                        { label: 'Lista Proprietários', color: 'text-indigo-600', icon: Users, tone: 'bg-indigo-50 border-indigo-100' },
                        { label: 'Canais Digitais', color: 'text-emerald-600', icon: Globe, tone: 'bg-emerald-50 border-emerald-100' }
                    ].map((canal, idx) => (
                        <div key={canal.label} className="bg-gray-50/30 border border-gray-100 p-8 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:border-indigo-100 transition-all group/card flex flex-col justify-between min-h-[240px]">
                            <div className="flex items-center justify-between">
                                <div className={cn("w-14 h-14 rounded-2xl shadow-inner flex items-center justify-center border transition-transform group-hover/card:scale-110", canal.tone, canal.color)}>
                                    <canal.icon size={28} strokeWidth={2.5} />
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Node 0{idx + 1}</span>
                            </div>
                            
                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Status do Canal</h4>
                                <p className="text-3xl font-black text-pure-black tracking-tighter mb-6 leading-none">Performance Estável</p>
                                <div className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 w-fit px-4 py-2 rounded-full border border-emerald-100">
                                    <ArrowUpRight size={14} strokeWidth={3} />
                                    <span>+12% vs Month-1</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
