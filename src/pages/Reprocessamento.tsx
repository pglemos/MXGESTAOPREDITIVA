import { useStores } from '@/hooks/useTeam'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
    ArrowLeft, Database, Upload, RefreshCw, Terminal, 
    Layers, History, Download, Info, ShieldCheck 
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface ImportLog { type: 'info' | 'success' | 'warning' | 'error'; msg: string }

export default function Reprocessamento() {
    const { stores } = useStores()
    const [selectedStoreId, setSelectedStoreId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [processing, setProcessing] = useState(false)
    const [logs, setLogs] = useState<ImportLog[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [isRefetching, setIsRefetching] = useState(false)
    const terminalEndRef = useRef<HTMLDivElement>(null)

    const addLog = useCallback((msg: string, type: ImportLog['type'] = 'info') => {
        setLogs(prev => [...prev, { type, msg: `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}` }])
    }, [])

    const fetchHistory = useCallback(async () => {
        const { data } = await supabase.from('import_logs').select(`*, store:stores(name)`).order('created_at', { ascending: false })
        if (data) setHistory(data.map(h => ({ ...h, store_name: (h as any).store?.name })))
    }, [])

    useEffect(() => { fetchHistory() }, [fetchHistory])
    useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

    const handleRefresh = async () => {
        setIsRefetching(true); await fetchHistory(); setIsRefetching(false)
        toast.success('Histórico atualizado!')
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file || !selectedStoreId) { toast.error('Selecione uma unidade e um arquivo.'); return }
        setProcessing(true); setLogs([]); addLog(`Injetando massa: ${file.name}`, 'info')
        await new Promise(r => setTimeout(r, 1000))
        addLog('Parsing estrutura...', 'success')
        setProcessing(false); toast.success('Processamento concluído (Simulação)'); fetchHistory()
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary text-white">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/5 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-500 rounded-full shadow-mx-xl animate-pulse" aria-hidden="true" />
                        <Typography variant="h1" tone="white">Terminal de <span className="text-indigo-400">Reprocessamento</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md opacity-50">Engine de Importação v2.1 • Auditoria Forense</Typography>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Button asChild variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 rounded-full px-6">
                        <Link to="/configuracoes"><ArrowLeft size={16} className="mr-2" /> Painel</Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl border-white/10 text-white/40">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg">
                <section className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="bg-slate-900 border-white/10 p-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl" aria-hidden="true"><Database size={28} /></div>
                            <div>
                                <Typography variant="h3" tone="white">Carregar Dados</Typography>
                                <Typography variant="caption" tone="white" className="opacity-30">Snapshot de Unidade</Typography>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Typography variant="caption" tone="white" className="opacity-40 ml-2">Unidade Alvo</Typography>
                                <select 
                                    value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                                    className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione a loja...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <Typography variant="caption" tone="white" className="opacity-40 ml-2">Arquivo CSV/Excel</Typography>
                                <div className="relative group">
                                    <input id="csv-upload" type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="sr-only" />
                                    <label htmlFor="csv-upload" className={cn("flex flex-col items-center justify-center gap-4 w-full min-h-[240px] border-2 border-dashed rounded-[2.5rem] transition-all cursor-pointer", file ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400" : "bg-slate-950 border-white/10 text-white/20 hover:bg-slate-900")}>
                                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform", file ? "bg-indigo-500 text-white rotate-12" : "bg-white/5 group-hover:scale-110")}><Upload size={32} /></div>
                                        <div className="text-center px-6">
                                            <Typography variant="h3" tone="white" className="text-sm">{file ? file.name : 'Selecionar Massa'}</Typography>
                                            <Typography variant="caption" tone="white" className="opacity-30 mt-2">Clique para explorar arquivos</Typography>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <Button onClick={handleUpload} disabled={processing || !file || !selectedStoreId} className="w-full h-16 rounded-full bg-indigo-600 shadow-mx-xl">
                                {processing ? <RefreshCw className="animate-spin mr-2" /> : <Layers size={20} className="mr-2" />} Injetar Massa
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-slate-900 border-white/10 p-10 space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <Terminal size={20} className="text-indigo-400" aria-hidden="true" />
                            <Typography variant="caption" tone="white" className="opacity-40">Log do Compilador</Typography>
                        </div>
                        <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[10px] leading-relaxed h-[300px] overflow-y-auto no-scrollbar border border-white/5 shadow-inner" aria-live="polite">
                            {logs.map((log, idx) => (
                                <p key={idx} className={cn("font-bold", log.type === 'error' ? 'text-rose-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-indigo-300')}>{log.msg}</p>
                            ))}
                            <div ref={terminalEndRef} aria-hidden="true" />
                        </div>
                    </Card>
                </section>

                <section className="xl:col-span-8">
                    <Card className="bg-slate-900 border-white/10 overflow-hidden h-full flex flex-col">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-indigo-400 flex items-center justify-center shadow-mx-lg" aria-hidden="true"><History size={24} /></div>
                                <Typography variant="h3" tone="white">Audit Trail</Typography>
                            </div>
                            <Badge variant="outline" className="text-white border-white/10 px-4">{history.length} Eventos</Badge>
                        </div>

                        <div className="overflow-x-auto flex-1 no-scrollbar">
                            <table className="w-full text-left">
                                <caption className="sr-only">Histórico de reprocessamentos</caption>
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-white/5">
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Data/Hora</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest">Unidade</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-center">Registros</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map((h) => (
                                        <tr key={h.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <Typography variant="h3" tone="white" className="text-xs">{format(parseISO(h.created_at), 'dd/MM/yyyy')}</Typography>
                                                    <Typography variant="caption" tone="white" className="opacity-30 mt-1">{format(parseISO(h.created_at), 'HH:mm:ss')}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6"><Typography variant="h3" tone="white" className="text-xs">{h.store_name}</Typography></td>
                                            <td className="px-10 py-6 text-center"><Typography variant="mono" tone="white" className="text-sm">{h.rows_count}</Typography></td>
                                            <td className="px-10 py-6 text-center">
                                                <Badge variant={h.status === 'success' ? 'success' : 'danger'} className="px-4">{h.status === 'success' ? 'CONCLUÍDO' : 'FALHA'}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>
            </div>
        </main>
    )
}
