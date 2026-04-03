import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, Sparkles, ClipboardList, ShieldAlert, ArrowRight, Thermometer, FileText, History, Download, Filter, RefreshCw, X, Search, Activity, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { mockAuditLogs } from '@/lib/mock-data'
import useAppStore from '@/stores/main'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

export default function AiDiagnostics() {
    const { team } = useAppStore()
    const location = useLocation()
    const navigate = useNavigate()
    const queryParams = new URLSearchParams(location.search)
    const initialTab = queryParams.get('tab') || 'engine'
    
    const [isGenerating, setIsGenerating] = useState(false)
    const [diagnostic, setDiagnostic] = useState<{ text: string; actions: string[]; message: string } | null>(null)
    const [selectedSeller, setSelectedSeller] = useState('team')
    const [activeTab, setActiveTab] = useState(initialTab)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        const params = new URLSearchParams(location.search); params.set('tab', activeTab)
        navigate({ search: params.toString() }, { replace: true })
    }, [activeTab, location.search, navigate])

    const generateDiagnostic = () => {
        if (isGenerating) return
        setIsGenerating(true)
        setTimeout(() => {
            const diag = {
                id: crypto.randomUUID(), date: new Date().toLocaleString(),
                target: selectedSeller === 'team' ? 'Toda Equipe' : team.find(t => t.id === selectedSeller)?.name || 'Consultor',
                text: 'Equipe apresenta conversão saudável, mas há gargalo de D0 em leads Webmotors.',
                actions: ['Redistribuir leads estagnados +48h', 'Revisar margem mínima de entrada'],
                message: 'Olá [Nome], vi seu interesse no [Carro]. Ele entrou em oferta relâmpago. Podemos falar?'
            }
            setDiagnostic(diag); setHistory(prev => [diag, ...prev]); setIsGenerating(false); toast.success('Diagnóstico Gerado!')
        }, 1500)
    }

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl text-text-primary">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Sales <span className="text-brand-primary">Analyst</span></h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Motor de Inteligência Preditiva</p>
                </div>
                <div className="flex items-center gap-mx-sm">
                    <button onClick={() => toast.success('Exportando Auditoria...')} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all"><Download size={20} /></button>
                    <button className="mx-button-primary bg-brand-secondary">Report Executivo</button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-mx-md mb-mx-xl">
                    <TabsList className="bg-mx-slate-100/50 p-1 rounded-mx-lg border border-border-default">
                        <TabsTrigger value="engine" className="mx-text-caption !text-[9px] px-mx-md h-9 data-[state=active]:bg-white data-[state=active]:shadow-mx-sm"><Sparkles size={12} className="mr-2" />Análise</TabsTrigger>
                        <TabsTrigger value="history" className="mx-text-caption !text-[9px] px-mx-md h-9 data-[state=active]:bg-white data-[state=active]:shadow-mx-sm"><History size={12} className="mr-2" />Log</TabsTrigger>
                        <TabsTrigger value="audit" className="mx-text-caption !text-[9px] px-mx-md h-9 data-[state=active]:bg-white data-[state=active]:shadow-mx-sm"><ClipboardList size={12} className="mr-2" />Audit</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="engine" className="focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                        <div className="lg:col-span-7 flex flex-col gap-mx-lg">
                            <div className="mx-card flex flex-col min-h-[500px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100" />
                                <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-mx-slate-50/30 relative z-10">
                                    <div className="flex items-center gap-mx-sm"><div className="w-12 h-12 rounded-mx-md bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><Bot size={24} /></div><div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Diagnóstico IA</h3><p className="mx-text-caption !text-[8px]">Análise Comportamental</p></div></div>
                                    <Badge variant="outline" className="bg-white border-border-default text-text-tertiary text-[8px] h-6"><Thermometer size={10} className="mr-1.5 text-brand-primary" /> Temp: 0.3</Badge>
                                </div>
                                <div className="p-mx-lg flex-1 flex flex-col space-y-mx-lg relative z-10">
                                    <div className="space-y-2"><label className="mx-text-caption ml-2">Alvo da Análise</label><div className="flex gap-mx-sm"><Select value={selectedSeller} onValueChange={setSelectedSeller}><SelectTrigger className="mx-input !h-14"><SelectValue /></SelectTrigger><SelectContent className="rounded-mx-lg"><SelectItem value="team">Equipe Consolidada</SelectItem>{team.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select><button onClick={generateDiagnostic} disabled={isGenerating} className="mx-button-primary bg-brand-primary !h-14 !px-10">{isGenerating ? <RefreshCw className="animate-spin" /> : 'Disparar'}</button></div></div>
                                    {diagnostic ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-mx-lg"><div className="p-mx-md bg-brand-primary-surface border border-mx-indigo-100 rounded-mx-xl italic font-bold text-text-secondary leading-relaxed">"{diagnostic.text}"</div><div className="grid sm:grid-cols-2 gap-mx-md"><div><h4 className="mx-text-caption text-status-success mb-mx-sm">Ações Sugeridas</h4><ul className="space-y-2">{diagnostic.actions.map((a, i) => (<li key={i} className="flex gap-2 text-xs font-bold text-text-tertiary"><ArrowRight size={12} className="text-status-success mt-0.5" /> {a}</li>))}</ul></div><div><h4 className="mx-text-caption text-status-warning mb-mx-sm">Template Abordagem</h4><div className="p-3 bg-mx-slate-50 border border-border-default rounded-mx-md text-[10px] font-bold text-text-tertiary leading-relaxed italic">"{diagnostic.message}"</div></div></div></motion.div>
                                    ) : !isGenerating && <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40"><Sparkles size={40} className="text-mx-slate-200 mb-mx-sm" /><p className="mx-text-caption">Aguardando comando operacional...</p></div>}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-5"><div className="h-full border-2 border-dashed border-border-default rounded-mx-3xl bg-mx-slate-50/30 flex flex-col items-center justify-center p-mx-xl text-center group hover:bg-mx-slate-50 transition-all"><Bot size={48} className="text-mx-slate-200 mb-mx-lg group-hover:text-brand-primary transition-colors" /><h3 className="text-2xl font-black text-text-primary tracking-tighter mb-mx-sm uppercase">Treinamento NLP</h3><p className="text-xs font-bold text-text-tertiary leading-relaxed max-w-[200px]">Nossa rede neural está indexando áudios e transcrições de negociação.</p></div></div>
                    </div>
                </TabsContent>

                <TabsContent value="history"><div className="mx-card overflow-hidden"><table className="w-full text-left min-w-[600px]"><thead><tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default"><th className="pl-mx-lg py-mx-md uppercase tracking-[0.3em]">Timestamp</th><th className="py-mx-md uppercase tracking-[0.3em]">Alvo</th><th className="py-mx-md uppercase tracking-[0.3em]">Status</th><th className="pr-mx-lg py-mx-md uppercase tracking-[0.3em] text-right">Ação</th></tr></thead><tbody className="divide-y divide-border-subtle bg-white">{history.map(h => (<tr key={h.id} className="hover:bg-mx-slate-50/50 transition-colors h-20 group border-none"><td className="pl-mx-lg py-4 font-mono-numbers font-bold text-xs text-text-tertiary">{h.date}</td><td className="py-4 font-black text-sm text-text-primary uppercase tracking-tight">{h.target}</td><td className="py-4"><Badge className="bg-status-success-surface text-status-success border-none text-[8px]">CONCLUÍDO</Badge></td><td className="pr-mx-lg py-4 text-right"><button onClick={() => {setDiagnostic(h); setActiveTab('engine')}} className="mx-text-caption text-brand-primary hover:underline flex items-center gap-1 ml-auto">Visualizar <ArrowRight size={12} /></button></td></tr>))}</tbody></table></div></TabsContent>
            </Tabs>
        </div>
    )
}
