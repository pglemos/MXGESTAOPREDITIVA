import { usePDIs } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useState, useMemo } from 'react'
import { Target, CheckCircle2, Calendar, TrendingUp, Sparkles, Zap, Award, Clock, MessageSquare, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

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

export default function VendedorPDI() {
    const { profile } = useAuth()
    const { pdis, loading, acknowledge } = usePDIs()
    
    // Pega o PDI mais recente do vendedor logado
    const activePDI = useMemo(() => {
        return (pdis || []).find(p => p.seller_id === profile?.id)
    }, [pdis, profile])

    const radarData = useMemo(() => {
        if (!activePDI) return []
        return competences.map(c => ({
            subject: c.label,
            value: (activePDI as any)[c.id] || 6,
            fullMark: 10
        }))
    }, [activePDI])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Escaneando Radar...</p>
        </div>
    )

    if (!activePDI) return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-24 h-24 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-8 border border-gray-100">
                <Target size={40} className="text-gray-200" />
            </div>
            <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter uppercase">Radar Não Ativado</h3>
            <p className="text-gray-400 text-sm font-bold max-w-sm leading-relaxed uppercase">Seu Plano de Desenvolvimento Individual ainda não foi configurado pela gerência.</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-lg" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Meu <span className="text-indigo-600">Radar</span></h1>
                    </div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] pl-6 mt-2 opacity-60">Plano de Desenvolvimento Profissional</p>
                </div>

                {!activePDI.acknowledged && (
                    <button 
                        onClick={() => acknowledge(activePDI.id)}
                        className="px-10 py-4 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-700 shadow-xl transition-all active:scale-95"
                    >
                        Dar Ciência no Plano
                    </button>
                )}
            </div>

            <div className="grid lg:grid-cols-2 gap-10 shrink-0">
                {/* Visual Radar */}
                <div className="bg-slate-950 rounded-[3rem] p-10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group min-h-[500px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex items-center gap-2 mb-8 relative z-10">
                        <Sparkles size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Minha Capacidade Técnica</span>
                    </div>
                    <div className="w-full h-[400px] relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#ffffff20" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 8, fontWeight: 'bold' }} />
                                <Radar
                                    name="Eu"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Plano de Ação */}
                <div className="space-y-8">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                <Zap size={20} className="text-rose-500" /> Ações de Evolução
                            </h3>
                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-3 h-6 rounded-lg bg-gray-50">Ciclo Atual</Badge>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(n => {
                                const action = (activePDI as any)[`action_${n}`]
                                if (!action) return null
                                return (
                                    <div key={n} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                                        <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-black text-[10px] shrink-0">{n}</div>
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-tight mt-1">{action}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Horizontes */}
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { label: 'Horizonte 6 Meses', val: activePDI.meta_6m, icon: Target },
                            { label: 'Horizonte 12 Meses', val: activePDI.meta_12m, icon: TrendingUp },
                            { label: 'Visão 24 Meses', val: activePDI.meta_24m, icon: Award }
                        ].map((h, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3">
                                    <h.icon size={12} /> {h.label}
                                </div>
                                <p className="text-sm font-black text-pure-black uppercase tracking-tight">{h.val || '---'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer / Deadlines */}
            <div className="pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 text-gray-400">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                    <Calendar size={14} className="text-indigo-400" /> Próxima Revisão Técnica: {activePDI.due_date ? new Date(activePDI.due_date).toLocaleDateString('pt-BR') : 'Sem data'}
                </div>
                {activePDI.acknowledged && (
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <CheckCircle2 size={12} /> Acordo Cientificado
                    </div>
                )}
            </div>
        </div>
    )
}
