import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, Sparkles, ClipboardList, ShieldAlert, ArrowRight, History, Download, RefreshCw, X, Search, Activity, CheckCircle2, TrendingUp, Zap, Target, Users, BarChart3, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { calcularFunil, gerarDiagnosticoMX, getDiasInfo } from '@/lib/calculations'
import type { DailyCheckin } from '@/types/database'

export default function AiDiagnostics() {
    const { sellers, loading: loadingTeam } = useTeam()
    const { checkins, loading: loadingCheckins } = useCheckins()
    const location = useLocation()
    const navigate = useNavigate()
    const queryParams = new URLSearchParams(location.search)
    const initialTab = queryParams.get('tab') || 'engine'
    
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedSeller, setSelectedSeller] = useState('all')
    const [activeTab, setActiveTab] = useState(initialTab)
    const [diagnostic, setDiagnostic] = useState<any>(null)

    useEffect(() => {
        const params = new URLSearchParams(location.search); params.set('tab', activeTab)
        navigate({ search: params.toString() }, { replace: true })
    }, [activeTab, location.search, navigate])

    const auditData = useMemo(() => {
        if (selectedSeller === 'all') return checkins
        return checkins.filter(c => c.seller_user_id === selectedSeller)
    }, [checkins, selectedSeller])

    const generateDiagnostic = () => {
        setIsGenerating(true)
        setTimeout(() => {
            const funil = calcularFunil(auditData as DailyCheckin[])
            const diag = gerarDiagnosticoMX(funil)
            const targetName = selectedSeller === 'all' ? 'Unidade Operacional' : sellers.find(s => s.id === selectedSeller)?.name || 'Especialista'
            
            const categoryMap: Record<string, string> = {
                'LEAD_AGD': 'PROSPECÇÃO & ABORDAGEM',
                'AGD_VISITA': 'VALOR PERCEBIDO & AGENDAMENTO',
                'VISITA_VND': 'FECHAMENTO & NEGOCIAÇÃO'
            }

            setDiagnostic({
                id: crypto.randomUUID(),
                target: targetName,
                funil,
                ...diag,
                area: diag.gargalo ? categoryMap[diag.gargalo] : 'ALTA PERFORMANCE',
                timestamp: new Date().toLocaleString('pt-BR')
            })
            setIsGenerating(false)
            toast.success(`Audit MX concluído para ${targetName}`)
        }, 800)
    }

    if (loadingTeam || loadingCheckins) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white" role="status">
            <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} aria-hidden="true" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">Sincronizando Motor Forense...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">
            
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Auditoria <span className="text-indigo-600">IA Forense</span></h1>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em] mt-2 pl-6">Motor de Diagnóstico e Correção de Gaps • Metodologia MX</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => toast.success('Relatório Executivo exportado!')} className="h-12 px-8 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-xl focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none">
                        <Download size={16} aria-hidden="true" /> Report de Unidade
                    </button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                    <TabsList className="bg-gray-100 p-1.5 rounded-full border border-gray-200 shadow-inner" aria-label="Modos de Auditoria">
                        <TabsTrigger value="engine" className="px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><Sparkles size={14} className="mr-2" aria-hidden="true" />Diagnóstico</TabsTrigger>
                        <TabsTrigger value="audit" className="px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><ClipboardList size={14} className="mr-2" aria-hidden="true" />Deep Audit</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <label htmlFor="audit-target-select" className="text-[10px] font-black text-gray-500 uppercase tracking-widest hidden lg:block">Filtrar Alvo:</label>
                        <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                            <SelectTrigger id="audit-target-select" className="w-full md:w-64 h-12 bg-white border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-indigo-500/20 shadow-sm outline-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-gray-200 shadow-2xl">
                                <SelectItem value="all" className="text-[10px] font-black uppercase">UNIDADE CONSOLIDADA</SelectItem>
                                {sellers.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold uppercase">{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <button 
                            onClick={generateDiagnostic} 
                            disabled={isGenerating} 
                            aria-label="Disparar auditoria forense"
                            className="h-12 px-8 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" size={14} aria-hidden="true" /> : <Zap size={14} aria-hidden="true" />}
                            Disparar Audit
                        </button>
                    </div>
                </div>

                <TabsContent value="engine" className="focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8">
                            {diagnostic ? (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10" aria-live="assertive">
                                    {/* Primary Diagnosis */}
                                    <section className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl group" aria-labelledby="audit-status-title">
                                        <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                                        
                                        <div className="flex items-center justify-between mb-14 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center border-4 border-white/10 shadow-2xl group-hover:rotate-12 transition-transform" aria-hidden="true">
                                                    <Bot size={32} className="text-white" />
                                                </div>
                                                <div>
                                                    <h2 id="audit-status-title" className="text-2xl font-black uppercase tracking-tight leading-none">Status Forense: {diagnostic.target}</h2>
                                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">{diagnostic.timestamp}</p>
                                                </div>
                                            </div>
                                            <Badge className={cn("text-[10px] font-black px-6 py-2 rounded-full border-none shadow-xl", diagnostic.gargalo ? "bg-rose-600 animate-pulse" : "bg-emerald-600")}>
                                                {diagnostic.gargalo ? 'GARGALO DETECTADO' : 'PERFORMANCE OK'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-10 relative z-10">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-white/5 pb-14">
                                                {[
                                                    { label: 'Eficiência Leads', val: diagnostic.funil.tx_lead_agd, bench: 20 },
                                                    { label: 'Eficiência Agd', val: diagnostic.funil.tx_agd_visita, bench: 60 },
                                                    { label: 'Eficiência Vnd', val: diagnostic.funil.tx_visita_vnd, bench: 33 }
                                                ].map(m => (
                                                    <div key={m.label} className="space-y-3">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">{m.label}</p>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className={cn("text-5xl font-black tracking-tighter tabular-nums", m.val < m.bench ? "text-rose-400" : "text-white")}>{m.val}%</span>
                                                            <span className="text-[10px] font-black text-white/30 uppercase">/ {m.bench}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
                                                <div className="space-y-6">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                                        <Search size={14} aria-hidden="true" /> Diagnóstico Técnico
                                                    </h3>
                                                    <p className="text-xl font-bold leading-relaxed italic text-white/90">"{diagnostic.diagnostico}"</p>
                                                </div>
                                                <div className="space-y-6">
                                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                                        <Zap size={14} aria-hidden="true" /> Prescrição MX
                                                    </h3>
                                                    <p className="text-xl font-bold leading-relaxed text-white/90">{diagnostic.sugestao}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Actionable Training Plan */}
                                    {diagnostic.gargalo && (
                                        <section className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm group" aria-labelledby="recovery-title">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100" aria-hidden="true">
                                                    <TrendingUp size={24} />
                                                </div>
                                                <div>
                                                    <h3 id="recovery-title" className="text-xl font-black uppercase tracking-tight text-slate-950">Plano de Recuperação</h3>
                                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Correção Obrigatória Baseada em Gap</p>
                                                </div>
                                            </div>
                                            
                                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-10">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Treinamento Prescrito:</span>
                                                    <h4 className="text-2xl font-black uppercase text-slate-900 tracking-tighter">{diagnostic.area}</h4>
                                                </div>
                                                <button onClick={() => navigate('/treinamentos')} className="h-14 px-10 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-slate-500/20">
                                                    Acessar Módulo de Correção <ArrowRight size={16} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </section>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[600px] border-2 border-dashed border-gray-200 rounded-[3rem] bg-gray-50/30 flex flex-col items-center justify-center text-center p-14 group hover:bg-gray-50 transition-all">
                                    <Bot size={64} className="text-gray-300 mb-8 group-hover:text-indigo-600 group-hover:rotate-6 transition-all duration-500" aria-hidden="true" />
                                    <h3 className="text-3xl font-black text-gray-400 uppercase tracking-tighter leading-none mb-4">Aguardando Comando Operacional</h3>
                                    <p className="text-sm font-bold text-gray-500 max-w-[300px] leading-relaxed italic">"O segredo da alta performance está no ajuste constante do funil de vendas. Dispare a auditoria para iniciar."</p>
                                </div>
                            )}
                        </div>

                        <aside className="lg:col-span-4 flex flex-col gap-10">
                            <section className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm space-y-10 overflow-hidden relative group" aria-labelledby="rules-title">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" aria-hidden="true" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200" aria-hidden="true">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <h3 id="rules-title" className="text-lg font-black uppercase tracking-tight leading-none text-slate-950">Regras da Auditoria</h3>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Metodologia Oficial MX</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-6 relative z-10" role="list">
                                    {[
                                        { label: 'Leads -> Agd', target: '20%', desc: 'Eficiência de Prospecção' },
                                        { label: 'Agd -> Visita', target: '60%', desc: 'Eficiência de Comparecimento' },
                                        { label: 'Visita -> Venda', target: '33%', desc: 'Eficiência de Fechamento' },
                                    ].map(r => (
                                        <div key={r.label} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 group/rule hover:bg-white hover:shadow-xl transition-all" role="listitem">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-[10px] font-black uppercase text-slate-950 tracking-widest">{r.label}</span>
                                                <span className="text-2xl font-black text-indigo-700 font-mono-numbers">{r.target}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{r.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4" aria-hidden="true"><Activity size={80} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Insight de Gestão</p>
                                    <p className="text-sm font-bold leading-relaxed italic opacity-90">"Números não mentem, eles apenas apontam onde o treinamento precisa atuar."</p>
                                </div>
                            </section>
                        </aside>
                    </div>
                </TabsContent>

                <TabsContent value="audit" className="focus-visible:outline-none">
                    <Card className="border-gray-200 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-gray-100 p-10 flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-3xl bg-slate-950 text-white flex items-center justify-center shadow-xl" aria-hidden="true">
                                    <ClipboardList size={28} />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-950">Logs de Produção Detalhados</CardTitle>
                                    <CardDescription className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-1">Deep Audit de Registros Canônicos</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left min-w-[800px]">
                                    <caption className="sr-only">Registros históricos de produção auditados</caption>
                                    <thead className="bg-slate-950 border-b border-gray-800">
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            <th scope="col" className="pl-10 py-6">Data Ref</th>
                                            <th scope="col" className="px-4 py-6 text-center">Leads (D-1)</th>
                                            <th scope="col" className="px-4 py-6 text-center">Agend. (D-0)</th>
                                            <th scope="col" className="px-4 py-6 text-center">Visitas (D-1)</th>
                                            <th scope="col" className="px-4 py-6 text-center">Vendas (D-1)</th>
                                            <th scope="col" className="pr-10 py-6 text-right">Eficiência</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {auditData.map((log: any) => {
                                            const vndTotal = (log.vnd_porta_prev_day || 0) + (log.vnd_cart_prev_day || 0) + (log.vnd_net_prev_day || 0)
                                            const eff = log.visit_prev_day > 0 ? Math.round((vndTotal / log.visit_prev_day) * 100) : 0
                                            return (
                                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors h-24 group">
                                                    <td className="pl-10 py-4">
                                                        <p className="font-black text-sm text-slate-950 uppercase"><time dateTime={log.reference_date}>{new Date(log.reference_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</time></p>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 italic">Auditado em {new Date(log.submitted_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-mono-numbers font-black text-slate-900 text-xl">{log.leads_prev_day}</td>
                                                    <td className="px-4 py-4 text-center font-mono-numbers font-black text-amber-700 text-xl">{(log.agd_cart_today || 0) + (log.agd_net_today || 0)}</td>
                                                    <td className="px-4 py-4 text-center font-mono-numbers font-black text-blue-700 text-xl">{log.visit_prev_day}</td>
                                                    <td className="px-4 py-4 text-center font-mono-numbers font-black text-emerald-700 text-xl">{vndTotal}</td>
                                                    <td className="pr-10 py-4 text-right">
                                                        <Badge className={cn("text-[10px] font-black px-4 py-1.5 rounded-full border-none shadow-sm", eff >= 33 ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500")}>
                                                            {eff}% Visita/Vnd
                                                            <span className="sr-only">Eficiência de fechamento do dia</span>
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {auditData.length === 0 && (
                                            <tr><td colSpan={6} className="py-20 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">Nenhum registro localizado para este alvo</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    )
}
