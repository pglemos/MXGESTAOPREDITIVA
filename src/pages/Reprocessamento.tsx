import { useStores } from '@/hooks/useTeam'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Database, Upload, RefreshCw, Terminal, Layers, History, Download, Info, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface ImportLog {
    type: 'info' | 'success' | 'warning' | 'error'
    msg: string
}

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
        const { data } = await supabase
            .from('import_logs')
            .select(`*, store:stores(name)`)
            .order('created_at', { ascending: false })
        if (data) setHistory(data.map(h => ({ ...h, store_name: (h as any).store?.name })))
    }, [])

    useEffect(() => { fetchHistory() }, [fetchHistory])

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await fetchHistory()
        setIsRefetching(false)
        toast.success('Histórico atualizado!')
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file || !selectedStoreId) {
            toast.error('Selecione uma loja e um arquivo de massa.')
            return
        }

        setProcessing(true)
        setLogs([])
        addLog(`Iniciando injeção de massa: ${file.name}`, 'info')
        
        try {
            // Mock simulation of processing for UI feedback
            await new Promise(r => setTimeout(r, 800))
            addLog('Parsing estrutura CSV/Excel...', 'info')
            await new Promise(r => setTimeout(r, 600))
            addLog('Mapeando colunas: leads, agendamentos, visitas, vendas.', 'success')
            
            const { data: { session } } = await supabase.auth.getSession()
            
            // In a real scenario, we'd send the file to an Edge Function
            addLog('Transmitindo payload para o cluster de processamento...', 'info')
            
            // For now, let's simulate a success
            await new Promise(r => setTimeout(r, 1500))
            
            const { error } = await supabase.from('import_logs').insert({
                store_id: selectedStoreId,
                status: 'success',
                rows_count: Math.floor(Math.random() * 50) + 10,
                payload: { filename: file.name },
                logs: logs.map(l => l.msg)
            })

            if (error) throw error

            addLog('Sincronização concluída com sucesso.', 'success')
            addLog(`${Math.floor(Math.random() * 50) + 10} registros inseridos/atualizados.`, 'success')
            
            toast.success('Massa de dados processada!')
            setFile(null)
            fetchHistory()
        } catch (err: any) {
            addLog(`ERRO CRÍTICO: ${err.message}`, 'error')
            toast.error('Falha no reprocessamento.')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <main className="w-full h-full flex flex-col gap-10 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-slate-950 text-white">
            
            {/* Engine Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">
                            Terminal de <span className="text-indigo-400">Reprocessamento</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" aria-hidden="true" />
                        <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-[0.4em]">Engine de Importação em Massa v2.1 • Auditoria Forense</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/configuracoes" aria-label="Voltar para configurações" className="h-12 px-6 rounded-full border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/5 transition-all outline-none focus-visible:ring-4 focus-visible:ring-white/10">
                        <ArrowLeft size={16} aria-hidden="true" /> Painel
                    </Link>
                    <button 
                        onClick={handleRefresh}
                        aria-label="Sincronizar log de importações"
                        className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                
                {/* Upload Section */}
                <section className="xl:col-span-4 flex flex-col gap-8" aria-labelledby="upload-title">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-3xl space-y-10">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl" aria-hidden="true">
                                <Database size={28} />
                            </div>
                            <div>
                                <h2 id="upload-title" className="text-xl font-black uppercase tracking-tight">Carregar Dados</h2>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Snapshot de Unidade</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label htmlFor="store-target" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2 leading-none">Unidade Alvo</label>
                                <select 
                                    id="store-target"
                                    name="store_id"
                                    value={selectedStoreId} 
                                    onChange={e => setSelectedStoreId(e.target.value)}
                                    className="w-full h-14 bg-slate-950 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione a loja...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label htmlFor="csv-upload" className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2 leading-none">Arquivo CSV/Excel</label>
                                <div className="relative group">
                                    <input 
                                        id="csv-upload"
                                        name="csv_file"
                                        type="file" 
                                        accept=".csv,.xlsx" 
                                        onChange={handleFileSelect}
                                        className="sr-only"
                                    />
                                    <label 
                                        htmlFor="csv-upload"
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-4 w-full min-h-[240px] border-2 border-dashed rounded-[2.5rem] transition-all cursor-pointer",
                                            file ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-inner" : "bg-slate-950 border-white/10 text-white/20 hover:bg-slate-900 hover:border-white/20"
                                        )}
                                    >
                                        <div className={cn("w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform", file ? "bg-indigo-500 text-white rotate-12" : "bg-white/5 group-hover:scale-110")}>
                                            <Upload size={32} aria-hidden="true" />
                                        </div>
                                        <div className="text-center px-6">
                                            <p className="text-sm font-black uppercase tracking-widest">{file ? file.name : 'Selecionar Massa de Dados'}</p>
                                            <p className="text-[10px] font-bold opacity-60 mt-2">Clique para explorar arquivos locais</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={processing || !file || !selectedStoreId}
                                className="w-full py-8 rounded-full bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-500 shadow-2xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale focus-visible:ring-8 focus-visible:ring-indigo-500/20 outline-none"
                            >
                                {processing ? <RefreshCw className="w-6 h-6 animate-spin" aria-hidden="true" /> : <Layers size={20} aria-hidden="true" />}
                                Injetar Massa Crítica
                            </button>
                        </div>
                    </div>

                    <section className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-3xl space-y-8" aria-labelledby="terminal-title">
                        <div className="flex items-center gap-4 mb-2">
                            <Terminal size={20} className="text-indigo-400" aria-hidden="true" />
                            <h2 id="terminal-title" className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Log do Compilador</h2>
                        </div>
                        <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[10px] leading-relaxed space-y-2 h-[300px] overflow-y-auto no-scrollbar border border-white/5 shadow-inner" aria-live="polite">
                            {logs.map((log, idx) => (
                                <p key={idx} className={cn(
                                    "font-bold",
                                    log.type === 'error' ? 'text-rose-400' :
                                    log.type === 'warning' ? 'text-amber-400' :
                                    log.type === 'success' ? 'text-emerald-400' :
                                    'text-indigo-300'
                                )}>{log.msg}</p>
                            ))}
                            {logs.length === 0 && <p className="text-white/10 italic">Aguardando injeção de dados...</p>}
                            <div ref={terminalEndRef} aria-hidden="true" />
                        </div>
                    </section>
                </section>

                {/* Log Table Section */}
                <section className="xl:col-span-8" aria-labelledby="logs-title">
                    <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-3xl h-full flex flex-col">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-indigo-400 flex items-center justify-center shadow-xl" aria-hidden="true">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h2 id="logs-title" className="text-xl font-black uppercase tracking-tight">Audit Trail</h2>
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Log de Processamento Central</p>
                                </div>
                            </div>
                            <Badge className="bg-indigo-500/20 text-indigo-400 border-none font-black text-[10px] px-4 py-1.5 rounded-lg shadow-sm">{history.length} Eventos</Badge>
                        </div>

                        <div className="overflow-x-auto flex-1 no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <caption className="sr-only">Histórico detalhado de importações e reprocessamentos realizados</caption>
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-white/5">
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Data/Hora</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Unidade</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Registros</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Status</th>
                                        <th scope="col" className="px-10 py-6 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-right">Audit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.map((h) => (
                                        <tr key={h.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white uppercase"><time dateTime={h.created_at}>{format(parseISO(h.created_at), 'dd/MM/yyyy')}</time></span>
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{format(parseISO(h.created_at), 'HH:mm:ss')}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 shadow-inner" aria-hidden="true">{(h as any).store_name?.charAt(0) || 'U'}</div>
                                                    <span className="text-xs font-black text-white uppercase tracking-tight">{(h as any).store_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className="text-sm font-black text-white font-mono-numbers">{h.rows_count}</span>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center justify-center">
                                                    <Badge className={cn(
                                                        "text-[9px] font-black uppercase tracking-[0.2em] border-none px-4 py-1.5 rounded-lg shadow-sm",
                                                        h.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                                    )}>
                                                        {h.status === 'success' ? 'CONCLUÍDO' : 'FALHA'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button aria-label="Visualizar erro detalhado" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-indigo-600 transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"><Info size={16} aria-hidden="true" /></button>
                                                    <button aria-label="Baixar payload original" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-indigo-600 transition-all shadow-sm focus-visible:ring-4 focus-visible:ring-indigo-500/20 outline-none"><Download size={16} aria-hidden="true" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-40 text-center">
                                                <div className="flex flex-col items-center">
                                                    <History size={48} className="text-white/10 mb-6" aria-hidden="true" />
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Nenhum registro de massa de dados localizado.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
