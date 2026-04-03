import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bot, Sparkles, ClipboardList, ShieldAlert, ArrowRight, Thermometer, FileText, History, Download, Filter, RefreshCw, X } from 'lucide-react'
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

export default function AiDiagnostics() {
    const { team } = useAppStore()
    const location = useLocation()
    const navigate = useNavigate()
    
    // URL Persistence for Tabs
    const queryParams = new URLSearchParams(location.search)
    const initialTab = queryParams.get('tab') || 'engine'
    
    const [isGenerating, setIsGenerating] = useState(false)
    const [diagnostic, setDiagnostic] = useState<{ text: string; actions: string[]; message: string } | null>(null)
    const [selectedSeller, setSelectedSeller] = useState('team')
    const [activeTab, setActiveTab] = useState(initialTab)
    const [diagnosticHistory, setDiagnosticHistory] = useState<any[]>([])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        params.set('tab', activeTab)
        navigate({ search: params.toString() }, { replace: true })
    }, [activeTab, location.search, navigate])

    const generateDiagnostic = () => {
        if (isGenerating) return
        setIsGenerating(true)
        
        // Simulating AI Analysis
        setTimeout(() => {
            const newDiagnostic = {
                id: crypto.randomUUID(),
                date: new Date().toLocaleString('pt-BR'),
                target: selectedSeller === 'team' ? 'Toda Equipe' : team.find(t => t.id === selectedSeller)?.name || selectedSeller,
                text: 'A equipe apresenta uma taxa de conversão saudável em visitas, mas há um acúmulo de leads "Sem Contato" no início do funil (gargalo de D0). A margem média está 2% abaixo da meta estipulada.',
                actions: [
                    'Redistribuir leads estagnados há mais de 48h para a equipe de SDR.',
                    'Revisar a política de descontos no fechamento para proteger a margem mínima.',
                ],
                message: 'Olá [Nome], vi que você demonstrou interesse no [Carro] ontem mas não conseguimos nos falar. Ele acabou de entrar em uma condição especial válida até amanhã. Qual o melhor horário para eu te ligar hoje?',
            }
            setDiagnostic(newDiagnostic)
            setDiagnosticHistory(prev => [newDiagnostic, ...prev])
            setIsGenerating(false)
            toast.success('Diagnóstico Preditivo Gerado!')
        }, 2000)
    }

    const copyMessage = () => {
        if (diagnostic) {
            navigator.clipboard.writeText(diagnostic.message)
            toast.success('Mensagem copiada para uso!')
        }
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-gray-100 pb-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Inteligência Operacional</span>
                    </div>
                    <h1 className="text-[42px] font-black tracking-tighter leading-none mb-4">Sales <span className="text-electric-blue">Analyst</span></h1>
                    <p className="text-sm font-bold text-gray-500 max-w-2xl leading-relaxed">
                        Motor de diagnóstico baseado em padrões comportamentais e análise de faturamento em tempo real.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
                    <TabsList className="bg-gray-100/50 p-1 rounded-2xl border border-gray-100 flex-1 sm:flex-none">
                        <TabsTrigger value="engine" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"><Sparkles className="w-3.5 h-3.5 mr-2" />Análise</TabsTrigger>
                        <TabsTrigger value="history" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"><History className="w-3.5 h-3.5 mr-2" />Histórico</TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"><ClipboardList className="w-3.5 h-3.5 mr-2" />Auditoria</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="rounded-full font-black text-[9px] uppercase tracking-widest border-gray-100 bg-white shadow-sm hover:shadow-md h-10 px-5">
                            <Download className="w-3.5 h-3.5 mr-2" /> Exportar Report
                        </Button>
                    </div>
                </div>

                <TabsContent value="engine" className="mt-0 focus-visible:outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden relative min-h-[500px] flex flex-col group">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-electric-blue/5 rounded-full blur-[80px] pointer-events-none -mt-40 -mr-40 transition-all group-hover:bg-electric-blue/10" />
                                
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl">
                                            <Bot className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Motor de Diagnóstico</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Análise Preditiva de Funil</p>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm text-gray-400">
                                        <Thermometer className="w-3 h-3 text-electric-blue" /> Temp: 0.3
                                    </span>
                                </div>

                                <div className="p-8 relative z-10 flex-1 flex flex-col space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Contexto da Operação</label>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                                                <SelectTrigger className="flex-1 rounded-2xl bg-white border-gray-100 font-bold h-14 shadow-sm focus:ring-2 focus:ring-electric-blue/20">
                                                    <SelectValue placeholder="Alvo da Análise" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-gray-100 shadow-3xl">
                                                    <SelectItem value="team">Visão Consolidada (Cluster)</SelectItem>
                                                    {team.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <button 
                                                onClick={generateDiagnostic} 
                                                disabled={isGenerating} 
                                                className="h-14 px-10 rounded-full font-black text-[10px] uppercase tracking-[0.3em] bg-pure-black text-white hover:bg-black shadow-3xl disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                {isGenerating ? 'Processando...' : 'Iniciar Análise'}
                                            </button>
                                        </div>
                                    </div>

                                    {diagnostic ? (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="p-6 bg-indigo-50/30 border border-indigo-100/50 rounded-3xl space-y-4">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-electric-blue">1. Diagnóstico Identificado</h4>
                                                <p className="text-base font-bold text-gray-600 leading-relaxed italic">"{diagnostic.text}"</p>
                                            </div>
                                            
                                            <div className="grid sm:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">2. Ações Recomendadas</h4>
                                                    <ul className="space-y-3">
                                                        {diagnostic.actions.map((act, i) => (
                                                            <li key={i} className="flex items-start gap-3 text-xs font-bold text-gray-500">
                                                                <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                <span>{act}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">3. Draft de Contato</h4>
                                                        <button onClick={copyMessage} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors shadow-sm">
                                                            <FileText size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 bg-white border border-amber-100 rounded-2xl text-xs font-bold text-gray-400 leading-relaxed italic shadow-inner">
                                                        "{diagnostic.message}"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : !isGenerating && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
                                                <Sparkles className="h-8 w-8 text-gray-200" />
                                            </div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest max-w-[200px]">Selecione o alvo e dispare o motor preditivo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5">
                            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/20 group hover:bg-gray-50/50 transition-colors">
                                <div className="text-center space-y-6">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                                        <Bot className="h-10 w-10 text-electric-blue" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-2xl text-pure-black tracking-tight mb-3">Insights de NLP</h3>
                                        <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto leading-relaxed">Nossa IA está em fase de treinamento para analisar transcrições de áudio e texto do WhatsApp.</p>
                                    </div>
                                    <button className="px-8 py-3 rounded-full border border-gray-200 bg-white text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-pure-black hover:border-gray-300 transition-all">Ver Roadmap IA</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 focus-visible:outline-none pb-20">
                    <div className="bg-white border border-gray-100 shadow-elevation rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-pure-black tracking-tight">Histórico de Inteligência</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Snapshot das últimas 50 análises</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <Table>
                                <TableHeader className="bg-gray-50/50 border-none">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 pl-8 text-gray-400">Data/Hora</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400">Alvo</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400">Status</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 pr-8 text-right text-gray-400">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-50">
                                    {diagnosticHistory.map((h) => (
                                        <TableRow key={h.id} className="hover:bg-gray-50/50 transition-colors border-none group">
                                            <TableCell className="font-bold text-xs py-6 pl-8 text-gray-500">{h.date}</TableCell>
                                            <TableCell className="font-black text-sm py-6 text-pure-black">{h.target}</TableCell>
                                            <TableCell className="py-6">
                                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[8px] uppercase tracking-widest rounded-lg">Sucesso</Badge>
                                            </TableCell>
                                            <TableCell className="py-6 pr-8 text-right">
                                                <button onClick={() => {setDiagnostic(h); setActiveTab('engine')}} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-electric-blue hover:underline">
                                                    Abrir Snapshot <ArrowRight size={14} />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {diagnosticHistory.length === 0 && (
                                        <TableRow><TableCell colSpan={4} className="py-32 text-center text-gray-300 font-black uppercase tracking-widest text-[10px] italic">Banco de memórias vazio</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="audit" className="mt-0 focus-visible:outline-none pb-20">
                    <div className="bg-white border border-gray-100 shadow-elevation rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-1">Trilha de Auditoria</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Integridade de Dados & KPIs</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64 group">
                                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Filtrar Log..." className="w-full bg-white border border-gray-100 rounded-full pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-electric-blue/30 transition-all" />
                                </div>
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-gray-100 bg-white"><Filter size={16} /></Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 pl-8 text-gray-400 w-48">Timestamp</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400 w-64">Responsável</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase tracking-[0.3em] py-6 text-gray-400 pr-8">Evento Sistêmico</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-50">
                                    {mockAuditLogs.map((log, index) => (
                                        <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors border-none group">
                                            <TableCell className="font-bold text-xs text-gray-400 py-6 pl-8 whitespace-nowrap">{log.date}</TableCell>
                                            <TableCell className="py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-[10px] text-pure-black">
                                                        {log.user.charAt(0)}
                                                    </div>
                                                    <span className="font-black text-sm text-pure-black whitespace-nowrap">{log.user}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-6 pr-8">
                                                <div className="flex items-center gap-3 mb-1">
                                                    {log.action.includes('Bloqueado') || log.action.includes('Alerta') 
                                                        ? <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" /> 
                                                        : <div className="w-1.5 h-1.5 rounded-full bg-electric-blue shrink-0 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>}
                                                    <span className={cn('font-black text-sm', log.action.includes('Bloqueado') || log.action.includes('Alerta') ? 'text-rose-600' : 'text-pure-black')}>{log.action}</span>
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-2xl">{log.detail}</p>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
