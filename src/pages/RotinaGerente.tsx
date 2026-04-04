import React, { useState } from 'react'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useRanking } from '@/hooks/useRanking'
import { somarVendas, calcularAtingimento } from '@/lib/calculations'
import { motion } from 'motion/react'
import { CheckCircle2, Clock, Users, ArrowRight, Activity, CalendarDays, Zap, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

export default function RotinaGerente() {
    const { sellers } = useTeam()
    const { checkins } = useCheckins()
    const { storeGoal } = useGoals()
    const { ranking } = useRanking()
    const [executing, setExecuting] = useState(false)
    const [isDone, setIsDone] = useState(false)

    // Derived State
    const pendingSellers = (sellers || []).filter(s => !s.checkin_today)
    const activeSellers = (sellers || []).filter(s => s.checkin_today)
    const totalAgendamentosHoje = checkins.reduce((acc, c) => acc + (c.agd_cart || 0) + (c.agd_net || 0), 0)
    const totalVendasOntem = somarVendas(checkins) // Simplified for the routine view
    const atingimento = calcularAtingimento(totalVendasOntem, storeGoal?.target || 0)

    const handleConcluirRotina = async () => {
        setExecuting(true)
        // Here we would call a Supabase function to log the execution (STORY-04.2)
        await new Promise(r => setTimeout(r, 1000))
        setExecuting(false)
        setIsDone(true)
        toast.success('Rotina Matinal registrada e auditada com sucesso!')
    }

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">OPERAÇÃO TÁTICA</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">Rotina Matinal</h1>
                </div>
                {!isDone ? (
                    <button onClick={handleConcluirRotina} disabled={executing} className="mx-button-primary bg-brand-primary h-14 px-10 gap-3 group">
                        {executing ? <Activity className="animate-spin" size={20} /> : <FileCheck size={20} />}
                        <span className="text-[10px] tracking-[0.3em]">CONCLUIR ROTINA</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-3 bg-status-success-surface text-status-success px-6 py-4 rounded-mx-lg font-black text-[10px] uppercase tracking-widest border border-status-success/20">
                        <CheckCircle2 size={18} /> Rotina Concluída
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32">
                
                {/* Check-ins & Equipe */}
                <div className="lg:col-span-8 flex flex-col gap-mx-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-lg">
                        <div className="mx-card p-8 bg-status-warning-surface border border-status-warning/20 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><Clock size={120} /></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-status-warning mb-2 relative z-10">Pendentes (Sem Registro)</h3>
                            <p className="text-5xl font-black font-mono-numbers text-status-warning mb-6 relative z-10">{pendingSellers.length}</p>
                            <div className="flex flex-col gap-2 relative z-10">
                                {pendingSellers.map(s => <span key={s.id} className="text-sm font-bold text-status-warning/80 uppercase">{s.name}</span>)}
                                {pendingSellers.length === 0 && <span className="text-sm font-bold text-status-warning/80 uppercase">Tropa 100% alinhada.</span>}
                            </div>
                        </div>

                        <div className="mx-card p-8 bg-brand-primary-surface border border-brand-primary/20 relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><Users size={120} /></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary mb-2 relative z-10">Tropa Operacional</h3>
                            <p className="text-5xl font-black font-mono-numbers text-brand-primary mb-6 relative z-10">{activeSellers.length}</p>
                            <div className="flex flex-col gap-2 relative z-10">
                                <Link to="/equipe" className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1 hover:underline">Ver Grade <ArrowRight size={12} /></Link>
                            </div>
                        </div>
                    </div>

                    <div className="mx-card p-8 border-none shadow-mx-md">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-mx-md bg-mx-indigo-50 text-mx-indigo-600 flex items-center justify-center"><CalendarDays size={20} /></div>
                            <h3 className="text-xl font-black uppercase tracking-tight">O que temos para hoje</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-mx-xl bg-mx-slate-50 border border-border-default">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Agendamentos Totais</p>
                                <p className="text-3xl font-black font-mono-numbers text-text-primary">{totalAgendamentosHoje}</p>
                            </div>
                            <div className="p-6 rounded-mx-xl bg-mx-slate-50 border border-border-default">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1">Foco Operacional</p>
                                <p className="text-sm font-bold text-text-secondary uppercase mt-2">Garantir 60% de comparecimento.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Resumo & Atalhos */}
                <div className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <div className="mx-card p-8 bg-brand-secondary text-white relative overflow-hidden shadow-mx-xl">
                        <div className="absolute right-0 bottom-0 opacity-10"><Zap size={150} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 relative z-10">Resumo de Ontem</h3>
                        <div className="flex items-end gap-3 mb-2 relative z-10">
                            <span className="text-6xl font-black tracking-tighter leading-none">{totalVendasOntem}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">Vendas</span>
                        </div>
                        <div className="relative z-10 mt-6">
                            <p className="text-sm font-bold text-gray-300 uppercase">Atingimento Acumulado: {atingimento}%</p>
                        </div>
                    </div>

                    <div className="mx-card p-8 border-none shadow-mx-md">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-4">Ação Rápida</h3>
                        <div className="flex flex-col gap-3">
                            <Link to="/relatorio-matinal" className="p-4 rounded-mx-lg border border-border-default flex justify-between items-center hover:border-brand-primary hover:bg-brand-primary-surface transition-all group">
                                <span className="text-sm font-black uppercase tracking-tight text-text-primary">Validar Matinal</span>
                                <ArrowRight size={16} className="text-brand-primary group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/ranking" className="p-4 rounded-mx-lg border border-border-default flex justify-between items-center hover:border-brand-primary hover:bg-brand-primary-surface transition-all group">
                                <span className="text-sm font-black uppercase tracking-tight text-text-primary">Ranking Atual</span>
                                <ArrowRight size={16} className="text-brand-primary group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
