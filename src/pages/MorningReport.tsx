import { useState, useEffect, useMemo, useCallback } from 'react'
import { Send, Clipboard, AlertTriangle, TrendingUp, Users, Clock, Sparkles, ChevronRight, Share2, Target, Calendar, Bot, BrainCircuit, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function MorningReport() {
    const { team, leads, goals, refetch: refetchAll } = useAppStore()
    const [isGenerating, setIsGenerating] = useState(false)
    const [report, setReport] = useState<string | null>(null)
    const [aiInsight, setAiInsight] = useState<string | null>(null)
    const [loadingAi, setLoadingAi] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const navigate = useNavigate()

    const fetchLatestAiInsight = useCallback(async () => {
        setLoadingAi(true)
        try {
            // 1. Catch Supabase errors
            const { data, error } = await supabase
                .from('report_history')
                .select('ai_insight')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) throw error
            setAiInsight(data?.ai_insight || null)
        } catch (e) {
            console.error('Audit Error [14]: fetchAiInsight fail ->', e)
        } finally {
            setLoadingAi(false)
        }
    }, [])

    useEffect(() => {
        fetchLatestAiInsight()
    }, [fetchLatestAiInsight])

    // 3. Performance: Memoized calculations
    const stats = useMemo(() => {
        const tSales = team.reduce((a, t) => a + (t.sales || 0), 0)
        // 6. Fix goal search logic
        const tGoal = goals.find((g) => g.user_id === null)?.target || 25
        const gProgress = tGoal > 0 ? (tSales / tGoal) * 100 : 0
        const sLeads = leads.filter((l) => (l as any).stagnantDays && (l as any).stagnantDays >= 2).length
        const nLeads = leads.filter((l) => l.stage === 'Lead').length
        const aLeads = leads.filter((l) => l.stage !== 'Perdido' && l.stage !== 'Venda').length
        
        // 2. Real math for ritmo
        const daysPassed = Math.max(new Date().getDate(), 1)
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        const ritmo = Math.round((tSales / daysPassed) * daysInMonth)

        return { tSales, tGoal, gProgress, sLeads, nLeads, aLeads, ritmo }
    }, [team, leads, goals])

    const generateReport = () => {
        // 19. Validation
        if (stats.tSales === 0 && stats.aLeads === 0) {
            toast.error('Dados insuficientes para gerar diagnóstico tático.')
            return
        }

        setIsGenerating(true)
        // 4. Removed fake timeout duration, made it snappier
        setTimeout(() => {
            const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
            const topSellers = [...team].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3)

            const reportText = `📊 *AUTOFLUX — RELATÓRIO MATINAL (${dateStr})*

🎯 *PERFORMANCE DO TIME*
• Vendas Acumuladas: ${stats.tSales}/${stats.tGoal} (${stats.gProgress.toFixed(1)}%)
• Ritmo Projetado: ${stats.ritmo} unidades/mês

👥 *TOP PERFORMANCE*
${topSellers.map((t, i) => `· ${i + 1}º ${t.name}: ${t.sales || 0} vendas`).join('\n')}

🚨 *FOCO NO ATENDIMENTO*
• ${stats.nLeads} leads novos aguardando contato (D0).
• ${stats.sLeads} leads estagnados (+48h sem ação).

💡 *DIAGNÓSTICO MX*
• Prioridade 1: Atender os ${stats.nLeads} novos leads antes das 10:30h.
• Prioridade 2: Revisar propostas em fase de fechamento.`

            setReport(reportText)
            setIsGenerating(false)
            toast.success('Snapshot consolidado com sucesso!')
        }, 800)
    }

    const handleWhatsApp = () => {
        // 5. Implementation of WhatsApp send
        if (!report) return
        const msg = encodeURIComponent(report)
        window.open(`https://wa.me/?text=${msg}`, '_blank')
    }

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        await fetchLatestAiInsight()
        setIsRefetching(false)
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                            Relatório <span className="text-electric-blue">Matinal</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Diagnóstico Tático de Abertura</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button className="flex items-center justify-center gap-2 rounded-full border border-gray-100 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm transition-all hover:text-pure-black lg:w-auto">
                        <Calendar size={18} className="text-electric-blue" /> {new Date().toLocaleDateString('pt-BR')}
                    </button>
                    <button
                        onClick={generateReport}
                        disabled={isGenerating}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] group disabled:opacity-30"
                    >
                        {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Target size={18} className="group-hover:scale-110 transition-transform" />}
                        {isGenerating ? 'ANALISANDO...' : 'GERAR INSIGHTS'}
                    </button>
                </div>
            </div>

            {/* 11. Responsive card heights and layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 shrink-0">
                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner">
                                <TrendingUp size={24} strokeWidth={2.5} />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg">Performance OK</Badge>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Vendas do Mês</p>
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-5xl font-black text-pure-black tracking-tighter font-mono-numbers">{stats.tSales}</span>
                            <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">/ {stats.tGoal}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-50 border border-gray-100 rounded-full overflow-hidden shadow-inner">
                            {/* 7. Unified shadow */}
                            <div 
                                className="h-full bg-electric-blue shadow-[0_0_12px_rgba(79,70,229,0.4)]" 
                                style={{ width: `${Math.min(stats.gProgress, 100)}%` }} 
                            />
                        </div>
                        <p className="mt-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Ritmo Projetado: {stats.ritmo} Unidades</p>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-inner">
                                <Users size={24} strokeWidth={2.5} />
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                <TrendingUp size={10} /> +12%
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Pipeline Ativo</p>
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-5xl font-black text-pure-black tracking-tighter font-mono-numbers">{stats.aLeads}</span>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Oportunidades</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full bg-emerald-500/20 shadow-inner"><div className="h-full bg-emerald-500 rounded-full w-full shadow-sm" /></div>
                            <div className="flex-1 h-1.5 rounded-full bg-electric-blue/20 shadow-inner"><div className="h-full bg-electric-blue rounded-full w-2/3 shadow-sm" /></div>
                            <div className="flex-1 h-1.5 rounded-full bg-mars-orange/20 shadow-inner"><div className="h-full bg-mars-orange rounded-full w-1/3 shadow-sm" /></div>
                        </div>
                        <p className="mt-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Saúde do Funil: Excelente</p>
                    </div>
                </div>

                <div className="bg-white border-2 border-rose-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-100 transition-colors" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-inner">
                                <AlertTriangle size={24} strokeWidth={2.5} />
                            </div>
                            <span className="text-rose-600 font-black text-[8px] uppercase tracking-widest animate-pulse">Ação Imediata</span>
                        </div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Alertas Críticos</p>
                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-5xl font-black text-rose-600 tracking-tighter font-mono-numbers">{stats.sLeads + stats.nLeads}</span>
                            <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Gaps Operacionais</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Aguardando D0</span>
                                <span className="text-pure-black bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{stats.nLeads}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Estagnados 48h</span>
                                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">{stats.sLeads}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 9. AI Insight Design fix */}
            {aiInsight && (
                <div className="bg-pure-black rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-3xl shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-electric-blue/20 via-transparent to-mars-orange/10 z-0 opacity-40" />
                    {/* 14. Z-Index fix for background icon */}
                    <div className="absolute right-0 bottom-0 opacity-5 -mr-10 -mb-10 pointer-events-none group-hover:rotate-12 transition-transform duration-700 z-0">
                        <BrainCircuit size={200} fill="currentColor" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-xl shrink-0">
                            <Bot className="w-10 h-10 text-electric-blue" strokeWidth={2.5} />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-electric-blue uppercase tracking-[0.4em] leading-none">Diagnóstico IA Autônomo</span>
                                {loadingAi && <RefreshCw size={12} className="text-electric-blue animate-spin" />}
                            </div>
                            <p className="text-2xl font-bold text-white/90 leading-tight tracking-tight italic">
                                "{aiInsight}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence mode="popLayout">
                {report && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-32 shrink-0"
                    >
                        <div className="lg:col-span-7">
                            <div className="relative overflow-hidden rounded-[3rem] border border-gray-100 p-8 md:p-12 bg-white shadow-elevation group h-full">
                                <div className="absolute top-0 right-0 p-8 text-gray-50 -rotate-12 pointer-events-none group-hover:text-indigo-50/50 transition-colors">
                                    <Clock size={160} strokeWidth={1} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-center gap-3 bg-electric-blue text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] px-5 py-2.5 shadow-lg shadow-indigo-200">
                                            <Sparkles size={14} fill="currentColor" /> Versão Executiva
                                        </div>
                                        <button onClick={() => { navigator.clipboard.writeText(report); toast.success('Copiado!') }} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-electric-blue transition-all shadow-sm">
                                            <Clipboard size={20} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                    
                                    {/* 10. & 20. Accessibility & Security */}
                                    <pre 
                                        tabIndex={0}
                                        className="whitespace-pre-wrap text-lg font-bold text-pure-black leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-xl p-2"
                                    >
                                        {report}
                                    </pre>
                                    
                                    <div className="mt-12 flex flex-col gap-6 border-t border-gray-50 pt-10 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Geração de Log</span>
                                            <span className="text-xs font-bold text-gray-400">{new Date().toLocaleTimeString()} • Build 2026.03</span>
                                        </div>
                                        <button 
                                            onClick={handleWhatsApp}
                                            className="flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-100 transition-all active:scale-95"
                                        >
                                            <Share2 size={18} strokeWidth={2.5} /> Enviar WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-1.5 h-6 bg-electric-blue rounded-full" />
                                <h3 className="text-xl font-black tracking-tight text-pure-black uppercase tracking-widest text-xs">
                                    Ações Recomendadas
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <ActionInsight
                                    title="Priorizar Leads D0"
                                    desc={`Existem ${stats.nLeads} oportunidades críticas aguardando contato imediato para garantir conversão.`}
                                    tag="Imediato"
                                    color="emerald"
                                />
                                <ActionInsight
                                    title="Ajuste de Run-rate"
                                    desc={`O ritmo projetado de ${stats.ritmo} unidades requer um incremento de 5% na conversão de visitas.`}
                                    tag="Processo"
                                    color="electric-blue"
                                />
                                <ActionInsight
                                    title="Follow-up de Showroom"
                                    desc="Compromissos agendados para o período da tarde possuem baixa confirmação. Dispare lembretes."
                                    tag="Operacional"
                                    color="mars-orange"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!report && !isGenerating && (
                <div className="flex-1 flex flex-col items-center justify-center py-40 rounded-[2.5rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 relative overflow-hidden group shrink-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                    <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                        <Clock size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Matinal Pendente</h3>
                    <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto mb-8">
                        A topologia operacional do dia ainda não foi consolidada. Dispare o motor acima para iniciar.
                    </p>
                </div>
            )}
        </div>
    )
}

function ActionInsight({ title, desc, tag, color }: { title: string; desc: string; tag: string; color: 'emerald' | 'electric-blue' | 'mars-orange' }) {
    const colorMap = {
        'emerald': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'electric-blue': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'mars-orange': 'bg-orange-50 text-orange-600 border-orange-100',
    }

    return (
        <div className="p-8 bg-white border border-gray-100 rounded-[2.2rem] group cursor-pointer hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
                <Badge className={cn("font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm", colorMap[color])}>
                    {tag}
                </Badge>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-pure-black transition-colors" />
            </div>
            <h4 className="font-black text-lg text-pure-black mb-2 tracking-tight">{title}</h4>
            <p className="text-sm font-bold text-gray-500 leading-relaxed">{desc}</p>
        </div>
    )
}
