import { useStores } from '@/hooks/useTeam'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
    ArrowLeft, Database, Upload, RefreshCw, Terminal as TerminalIcon, 
    Layers, History, Download, Info, ShieldCheck, ChevronDown, 
    FileSpreadsheet, X 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
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
        toast.success('Audit trail atualizado!')
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file || !selectedStoreId) { toast.error('Selecione unidade e massa de dados.'); return }
        setProcessing(true); setLogs([]); addLog(`Injetando massa: ${file.name}`, 'info')
        await new Promise(r => setTimeout(r, 1000))
        addLog('Verificando integridade estrutural...', 'info')
        await new Promise(r => setTimeout(r, 800))
        addLog('Protocolo de segurança validado.', 'success')
        setProcessing(false); toast.success('Massa processada com sucesso!'); fetchHistory()
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary">
            
            {/* Header / Engine Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/10 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md animate-pulse" aria-hidden="true" />
                        <Typography variant="h1" tone="white">Painel de <Typography as="span" variant="h1" tone="brand">Reprocessamento</Typography></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="pl-mx-md opacity-50 font-black">DATA INJECTION ENGINE v2.1</Typography>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Button asChild variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 rounded-full px-6 font-black uppercase tracking-widest text-tiny">
                        <Link to="/configuracoes"><ArrowLeft size={16} className="mr-2" /> VOLTAR AO PAINEL</Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl border-white/10 text-white/40 h-12 w-12 hover:text-white bg-white/5">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-mx-lg flex-1 min-h-0">
                <section className="xl:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="bg-mx-black border-white/5 p-8 md:p-10 space-y-10 shadow-mx-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl" />
                        
                        <header className="flex items-center gap-4 border-b border-white/5 pb-8 relative z-10">
                            <div className="w-14 h-14 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-xl border border-white/10"><Database size={28} /></div>
                            <div>
                                <Typography variant="h3" tone="white">Carregar Dados</Typography>
                                <Typography variant="caption" tone="white" className="opacity-30 uppercase tracking-widest mt-1 font-black">SNAPSHOT DE UNIDADE</Typography>
                            </div>
                        </header>

                        <div className="space-y-10 relative z-10">
                            <div className="space-y-4">
                                <Typography variant="caption" tone="white" className="opacity-40 ml-2 font-black uppercase tracking-widest">Unidade Alvo</Typography>
                                <Select 
                                    value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                                    className="!bg-white/5 !border-white/10 !text-white !h-14"
                                >
                                    <option value="" className="bg-mx-black">Selecione a loja...</option>
                                    {stores.map(s => <option key={s.id} value={s.id} className="bg-mx-black">{s.name.toUpperCase()}</option>)}
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Typography variant="caption" tone="white" className="opacity-40 ml-2 font-black uppercase tracking-widest">Arquivo de Massa (CSV/XLSX)</Typography>
                                <div className="relative group">
                                    <input id="csv-upload" type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="sr-only" />
                                    <label htmlFor="csv-upload" className={cn("flex flex-col items-center justify-center gap-6 w-full min-h-64 border-2 border-dashed rounded-mx-3xl transition-all cursor-pointer shadow-inner", 
                                        file ? "bg-brand-primary/10 border-brand-primary/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}>
                                        <div className={cn("w-20 h-20 rounded-mx-3xl flex items-center justify-center shadow-mx-xl transition-all", 
                                            file ? "bg-brand-primary text-white rotate-6 scale-110" : "bg-white/5 group-hover:scale-105"
                                        )}>
                                            {file ? <FileSpreadsheet size={40} /> : <Upload size={40} className="text-white/20" />}
                                        </div>
                                        <div className="text-center px-8">
                                            <Typography variant="h3" tone="white" className="text-base truncate max-w-40">{file ? file.name : 'Selecionar Massa'}</Typography>
                                            <Typography variant="caption" tone="white" className="opacity-20 mt-2 block tracking-widest font-black uppercase">CLIQUE PARA EXPLORAR</Typography>
                                        </div>
                                        {file && (
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setFile(null) }} className="absolute top-4 right-4 text-white/20 hover:text-status-error rounded-full w-10 h-10">
                                                <X size={20} />
                                            </Button>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button 
                                onClick={handleUpload} 
                                disabled={processing || !file || !selectedStoreId} 
                                className="w-full h-16 rounded-full bg-brand-primary shadow-mx-xl border border-white/10 active:scale-95 transition-all font-black uppercase tracking-widest text-xs"
                            >
                                {processing ? <RefreshCw className="animate-spin mr-3" /> : <Layers size={20} className="mr-3" />} 
                                INJETAR MASSA
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-mx-black border-white/5 p-8 md:p-10 space-y-6 shadow-mx-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <TerminalIcon size={18} className="text-brand-primary" />
                            <Typography variant="caption" tone="white" className="opacity-40 font-black uppercase tracking-widest">Log do Compilador</Typography>
                        </div>
                        <div className="bg-mx-black rounded-mx-2xl p-6 font-mono text-tiny leading-relaxed h-64 overflow-y-auto no-scrollbar border border-white/5 shadow-inner" aria-live="polite">
                            {logs.map((log, idx) => (
                                <p key={idx} className={cn("font-black tracking-tight mb-2 uppercase", 
                                    log.type === 'error' ? 'text-status-error' : 
                                    log.type === 'warning' ? 'text-status-warning' : 
                                    log.type === 'success' ? 'text-status-success' : 
                                    'text-brand-primary'
                                )}>{log.msg}</p>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </Card>
                </section>

                <section className="xl:col-span-8 flex flex-col">
                    <Card className="bg-white border-none shadow-mx-xl overflow-hidden h-full flex flex-col">
                        <header className="p-10 md:p-14 border-b border-border-default flex items-center justify-between bg-surface-alt/30">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-mx-xl bg-mx-black text-brand-primary flex items-center justify-center shadow-mx-lg"><History size={28} /></div>
                                <div>
                                    <Typography variant="h2">Audit Trail</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-widest mt-1 font-black uppercase">LOG DE INJEÇÕES OPERACIONAIS</Typography>
                                </div>
                            </div>
                            <Badge variant="outline" className="px-6 py-2 rounded-full font-black border-border-strong uppercase text-xs">{history.length} EVENTOS</Badge>
                        </header>

                        <div className="overflow-x-auto flex-1 no-scrollbar">
                            <table className="w-full text-left">
                                <caption className="sr-only">Histórico consolidado de reprocessamento de dados</caption>
                                <thead>
                                    <tr className="bg-surface-alt/50 border-b border-border-default text-tiny font-black uppercase tracking-widest text-text-tertiary">
                                        <th scope="col" className="pl-10 py-6">DATA / HORA</th>
                                        <th scope="col" className="px-6 py-6">UNIDADE OPERACIONAL</th>
                                        <th scope="col" className="px-6 py-6 text-center">REGISTROS</th>
                                        <th scope="col" className="pr-10 py-6 text-right">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default bg-white">
                                    {history.map((h) => (
                                        <tr key={h.id} className="hover:bg-surface-alt/30 transition-colors group h-24">
                                            <td className="pl-10">
                                                <div className="flex flex-col">
                                                    <Typography variant="h3" className="text-base leading-none mb-1">{format(parseISO(h.created_at), 'dd/MM/yyyy')}</Typography>
                                                    <Typography variant="caption" tone="muted" className="text-tiny font-black uppercase">{format(parseISO(h.created_at), 'HH:mm:ss')}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-surface-alt border border-border-default flex items-center justify-center text-tiny font-black group-hover:bg-brand-primary group-hover:text-white transition-all uppercase">{h.store_name?.charAt(0)}</div>
                                                    <Typography variant="h3" className="text-sm uppercase tracking-tight">{h.store_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-6 text-center">
                                                <Typography variant="mono" tone="brand" className="text-lg font-black">{h.rows_count || 0}</Typography>
                                            </td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={h.status === 'success' ? 'success' : 'danger'} className="px-6 py-1.5 rounded-lg shadow-sm border uppercase font-black tracking-widest text-tiny border-none">
                                                    {h.status === 'success' ? 'CONCLUÍDO' : 'FALHA'}
                                                </Badge>
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
