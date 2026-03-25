import { useCheckins } from '@/hooks/useCheckins'
import { calcularFunil, identificarGargalo } from '@/lib/calculations'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import type { Benchmark } from '@/types/database'
import { GitBranch, AlertTriangle, CheckCircle, BarChart3, Filter, ChevronRight, LayoutDashboard, Target, TrendingUp, Zap, ArrowUpRight, Store, Users, Globe } from 'lucide-react'
import { motion } from 'motion/react'

export default function Funil() {
    const { storeId } = useAuth()
    const { checkins, loading } = useCheckins()
    const [benchmark, setBenchmark] = useState<Benchmark | null>(null)

    useEffect(() => {
        if (storeId) supabase.from('benchmarks').select('*').eq('store_id', storeId).maybeSingle().then(({ data }) => { if (data) setBenchmark(data) })
    }, [storeId])

    const funil = calcularFunil(checkins)
    const defaultBenchmark: Benchmark = { id: '', store_id: storeId || '', lead_to_appt: 30, appt_to_visit: 50, visit_to_sale: 20 }
    const diagnostic = identificarGargalo(funil, benchmark || defaultBenchmark)

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando funil...</p>
        </div>
    )

    const steps = [
        { label: 'Leads', value: funil.leads, pct: 100, bg: 'bg-violet-600', color: 'text-violet-600', subColor: 'bg-violet-50', bench: null },
        { label: 'Agendamentos', value: funil.agd_total, pct: funil.tx_lead_agd, bg: 'bg-blue-600', color: 'text-blue-600', subColor: 'bg-blue-50', bench: benchmark?.lead_to_appt || 30 },
        { label: 'Visitas', value: funil.visitas, pct: funil.tx_agd_visita, bg: 'bg-amber-500', color: 'text-amber-600', subColor: 'bg-amber-50', bench: benchmark?.appt_to_visit || 50 },
        { label: 'Vendas', value: funil.vnd_total, pct: funil.tx_visita_vnd, bg: 'bg-emerald-600', color: 'text-emerald-600', subColor: 'bg-emerald-50', bench: benchmark?.visit_to_sale || 20 },
    ]

    const maxValue = Math.max(funil.leads, 1)

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Funil de Vendas
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Análise de Conversão e Gargalos</p>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-4 shrink-0 sm:w-auto sm:flex-row sm:items-stretch">
                    <button className="flex w-full items-center justify-center gap-2 rounded-[2rem] bg-white px-6 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm transition-all active:scale-95 hover:-translate-y-1 hover:text-blue-600 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 group relative overflow-hidden sm:w-auto">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Filter size={16} /> Período
                    </button>
                    <button className="flex h-14 w-full items-center justify-center rounded-[2rem] bg-[#1A1D20] text-white font-black transition-all active:scale-95 hover:bg-black hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] group relative overflow-hidden sm:w-14">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <BarChart3 size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 shrink-0">

                {/* Diagnostic Panel */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="inner-card p-8 bg-white border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${diagnostic.gargalo ? 'bg-amber-50' : 'bg-emerald-50'} rounded-full blur-[80px] -mr-10 -mt-10 opacity-60 transition-colors pointer-events-none`} />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl ${diagnostic.gargalo ? 'bg-amber-50 text-amber-600 shadow-amber-100' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'} shadow-inner flex items-center justify-center`}>
                                    {diagnostic.gargalo ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                                </div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Diagnóstico</h3>
                            </div>
                        </div>

                        <div className="relative z-10 mb-8">
                            <p className="text-lg font-black text-[#1A1D20] leading-tight tracking-tight mb-4">
                                {diagnostic.gargalo ? "Atenção necessária detectada" : "Fluxo de conversão saudável"}
                            </p>
                            <p className="text-gray-500 text-sm font-bold leading-relaxed mb-6">
                                {diagnostic.mensagem}
                            </p>
                        </div>

                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap size={14} className="text-blue-600" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Benchmarks de Mercado</span>
                            </div>
                            <div className="space-y-3">
                                {steps.slice(1).map(s => (
                                    <div key={s.label} className="flex justify-between items-center bg-white/80 p-2 rounded-xl text-[10px] font-black">
                                        <span className="text-gray-400 uppercase tracking-widest">{s.label}</span>
                                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{s.bench}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Funnel Visualization */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="inner-card p-6 sm:p-8 md:p-10 bg-white border-gray-100 shadow-xl shadow-gray-100/50">
                        <div className="space-y-12 relative">
                            {/* Connecting architecture line */}
                            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gray-50 -z-10 hidden sm:block" />

                            {steps.map((step, i) => (
                                <div key={step.label} className="relative z-10">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
                                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-white shadow-2xl transition-all hover:scale-110 ${step.bg}`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <h4 className="text-[#1A1D20] font-black text-lg tracking-tight uppercase tracking-widest text-[14px]">{step.label}</h4>
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
                                                        {i === 0 ? 'Volume Operacional Total' : `Taxa de Conversão Mensal`}
                                                    </p>
                                                </div>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-3xl font-black text-[#1A1D20] tracking-tighter">{step.value}</span>
                                                    {i > 0 && (
                                                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${step.pct < (step.bench || 0) ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                            {step.pct}% {step.pct >= (step.bench || 0) ? <ArrowUpRight size={10} /> : <AlertTriangle size={10} />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="h-2.5 bg-gray-50 border border-gray-100 rounded-full overflow-hidden relative group">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max((step.value / maxValue) * 100, 2)}%` }}
                                                    transition={{ duration: 1, delay: i * 0.2, ease: 'circOut' }}
                                                    className={`h-full rounded-full ${step.bg} shadow-sm group-hover:brightness-110 transition-all`}
                                                />
                                                {step.bench && (
                                                    <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-white/40"
                                                        style={{ left: `${step.bench}%` }}
                                                        title={`Meta: ${step.bench}%`}
                                                    />
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
            <div className="inner-card p-6 sm:p-8 md:p-10 bg-white border-gray-100 shadow-xl shadow-gray-100/50 mb-10 overflow-hidden relative group">
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-50 rounded-full blur-[100px] z-0 opacity-40" />

                <div className="flex items-center gap-3 mb-10 relative z-10">
                    <div className="w-2 h-6 bg-[#1A1D20] rounded-full" />
                    <h2 className="text-xl font-black tracking-tight uppercase tracking-widest text-[14px]">Análise Multicanal</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {[
                        { label: 'Unidade Física', color: 'text-blue-600', icon: Store },
                        { label: 'Lista de Proprietários', color: 'text-violet-600', icon: Users },
                        { label: 'Canais Digitais', color: 'text-emerald-600', icon: Globe }
                    ].map((canal, idx) => (
                        <div key={canal.label} className="bg-gray-50/50 border border-gray-100 p-8 rounded-[2.5rem] hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all group/card">
                            <div className="flex items-center justify-between mb-8">
                                <div className={`w-12 h-12 rounded-2xl bg-white shadow-inner flex items-center justify-center ${canal.color} group-hover/card:scale-110 transition-transform`}>
                                    <canal.icon size={24} />
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Canal 0{idx + 1}</span>
                            </div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{canal.label}</h4>
                            <p className="text-2xl font-black text-[#1A1D20] mb-6 tracking-tight">Performance Estável</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <ArrowUpRight size={14} />
                                </div>
                                <span>+12% vs mês anterior</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
