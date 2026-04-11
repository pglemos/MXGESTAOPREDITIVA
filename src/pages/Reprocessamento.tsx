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
import { validateLegacyCSV, ValidationResult } from '@/lib/migration-validator'

interface ImportLog { type: 'info' | 'success' | 'warning' | 'error'; msg: string }

export default function Reprocessamento() {
    const { stores } = useStores()
    const [selectedStoreId, setSelectedStoreId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [processing, setProcessing] = useState(false)
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [logs, setLogs] = useState<ImportLog[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [isRefetching, setIsRefetching] = useState(false)
    const terminalEndRef = useRef<HTMLDivElement>(null)

    const addLog = useCallback((msg: string, type: ImportLog['type'] = 'info') => {
        setLogs(prev => [...prev, { type, msg: `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}` }])
    }, [])

    const fetchHistory = useCallback(async () => {
        const { data } = await supabase.from('reprocess_logs').select(`*, store:stores(name)`).order('created_at', { ascending: false })
        if (data) setHistory(data.map(h => ({ ...h, store_name: (h as any).store?.name })))
    }, [])

    useEffect(() => { fetchHistory() }, [fetchHistory])
    useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

    const handleRefresh = async () => {
        setIsRefetching(true); await fetchHistory(); setIsRefetching(false)
        toast.success('Audit trail atualizado!')
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0])
            setValidation(null)
            setLogs([])
        }
    }

    const handleUpload = async () => {
        if (!file || !selectedStoreId) { toast.error('Selecione unidade e massa de dados.'); return }
        setProcessing(true)
        setLogs([])
        setValidation(null)
        
        addLog(`Iniciando protocolo de injeção: ${file.name}`, 'info')
        
        try {
            const text = await file.text()
            addLog('Executando validação canônica...', 'info')
            
            const result = validateLegacyCSV(text)
            setValidation(result)

            if (!result.isValid) {
                addLog('FALHA CRÍTICA: Estrutura de dados incompatível.', 'error')
                result.errors.forEach(e => addLog(e, 'error'))
                toast.error('Massa de dados inválida.')
                setProcessing(false)
                return
            }

            addLog(`Validação concluída. ${result.summary.validRows} registros íntegros localizados.`, 'success')
            
            const { data: log, error: logError } = await supabase.from('reprocess_logs').insert({
                store_id: selectedStoreId,
                source_type: 'csv_import',
                triggered_by: (await supabase.auth.getUser()).data.user?.id,
                status: 'pending'
            }).select().single()

            if (logError) throw new Error(logError.message)
            addLog(`Lote ${log.id.split('-')[0]} aberto.`, 'success')

            const chunkSize = 100
            for (let i = 0; i < result.records.length; i += chunkSize) {
                const chunk = result.records.slice(i, i + chunkSize)
                const { error: rawError } = await supabase.from('raw_imports').insert(
                    chunk.map(r => ({ log_id: log.id, raw_data: r }))
                )
                if (rawError) throw new Error(rawError.message)
                addLog(`Injetado: ${Math.min(i + chunkSize, result.records.length)}/${result.records.length}`, 'info')
            }

            addLog('Disparando processamento de domínio (RPC)...', 'info')
            const { error: rpcError } = await supabase.rpc('process_import_data', { p_log_id: log.id })
            if (rpcError) throw new Error(rpcError.message)

            addLog('Aguardando reconciliação de dados...', 'info')
            let attempts = 0
            while (attempts < 30) {
                const { data: statusCheck } = await supabase.from('reprocess_logs').select('status, records_processed, records_failed').eq('id', log.id).single()
                if (statusCheck?.status === 'completed') {
                    addLog(`SINCRONIZAÇÃO FINALIZADA: ${statusCheck.records_processed} linhas processadas com sucesso.`, 'success')
                    if (statusCheck.records_failed > 0) addLog(`ALERTA: ${statusCheck.records_failed} registros falharam.`, 'warning')
                    break
                }
                if (statusCheck?.status === 'failed') throw new Error('O motor de processamento reportou falha crítica.')
                await new Promise(r => setTimeout(r, 1000))
                attempts++
            }
            
            toast.success('Dados integrados à malha MX!')
            fetchHistory()
        } catch (err: any) {
            addLog(`ERRO DE SISTEMA: ${err.message}`, 'error')
            toast.error('Falha na injeção de massa.')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/10 pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md animate-pulse" aria-hidden="true" />
                        <Typography variant="h1" tone="white">Painel de <Typography as="span" variant="h1" tone="brand">Reprocessamento</Typography></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="pl-mx-md opacity-50 font-black uppercase tracking-widest">DATA INJECTION ENGINE v2.1</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0 w-full lg:w-auto">
                    <Button asChild variant="ghost" className="w-full sm:w-auto text-white/40 hover:text-white hover:bg-white/5 rounded-mx-full px-6 font-black uppercase tracking-widest text-tiny">
                        <Link to="/configuracoes"><ArrowLeft size={16} className="mr-2" aria-hidden="true" /> VOLTAR AO PAINEL</Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="hidden sm:flex rounded-mx-xl border-white/10 text-white/40 h-mx-xl w-mx-xl hover:text-white bg-white/5" aria-label="Sincronizar histórico">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0">
                <section className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="bg-mx-black border-white/5 p-mx-lg md:p-10 space-y-mx-10 shadow-mx-xl relative overflow-hidden">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl" aria-hidden="true" />
                        
                        <header className="flex items-center gap-mx-sm border-b border-white/5 pb-8 relative z-10">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-xl border border-white/10" aria-hidden="true"><Database size={28} /></div>
                            <div>
                                <Typography variant="h3" tone="white" className="uppercase tracking-tight font-black">Carregar Dados</Typography>
                                <Typography variant="tiny" tone="white" className="opacity-30 uppercase tracking-widest mt-1 font-black">SNAPSHOT DE UNIDADE</Typography>
                            </div>
                        </header>

                        <div className="space-y-mx-10 relative z-10">
                            <div className="space-y-mx-sm">
                                <Typography variant="tiny" tone="white" as="label" htmlFor="store-select" className="opacity-40 ml-2 font-black uppercase tracking-widest">Unidade Alvo</Typography>
                                <div className="relative">
                                    <select 
                                        id="store-select"
                                        value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                                        className="w-full h-mx-14 px-6 bg-white/5 border border-white/10 rounded-mx-xl text-white text-sm font-bold focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer uppercase outline-none shadow-mx-inner"
                                        aria-required="true"
                                    >
                                        <option value="" className="bg-mx-black">Selecione a loja...</option>
                                        {stores.map(s => <option key={s.id} value={s.id} className="bg-mx-black">{s.name.toUpperCase()}</option>)}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" aria-hidden="true" />
                                </div>
                            </div>

                            <div className="space-y-mx-sm">
                                <Typography variant="tiny" tone="white" className="opacity-40 ml-2 font-black uppercase tracking-widest">Arquivo de Massa (CSV/XLSX)</Typography>
                                <div className="relative group">
                                    <input id="csv-upload" type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="sr-only" aria-required="true" />
                                    <label htmlFor="csv-upload" className={cn("flex flex-col items-center justify-center gap-mx-md w-full min-h-64 border-2 border-dashed rounded-mx-3xl transition-all cursor-pointer shadow-mx-inner", 
                                        file ? "bg-brand-primary/10 border-brand-primary/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}>
                                        <div className={cn("w-mx-20 h-mx-header rounded-mx-3xl flex items-center justify-center shadow-mx-xl transition-all", 
                                            file ? "bg-brand-primary text-white rotate-6 scale-110" : "bg-white/5 group-hover:scale-105"
                                        )}>
                                            {file ? <FileSpreadsheet size={40} /> : <Upload size={40} className="text-white/20" aria-hidden="true" />}
                                        </div>
                                        <div className="text-center px-8">
                                            <Typography variant="h3" tone="white" className="text-base truncate max-w-40 font-black uppercase tracking-tight">{file ? file.name : 'Selecionar Massa'}</Typography>
                                            <Typography variant="tiny" tone="white" className="opacity-20 mt-2 block tracking-widest font-black uppercase">CLIQUE PARA EXPLORAR</Typography>
                                        </div>
                                        {file && (
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setFile(null) }} className="absolute top-mx-sm right-mx-sm text-white/20 hover:text-status-error rounded-mx-full w-mx-10 h-mx-10 p-mx-0" aria-label="Remover arquivo">
                                                <X size={20} />
                                            </Button>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <Button 
                                onClick={handleUpload} 
                                disabled={processing || !file || !selectedStoreId} 
                                className="w-full h-mx-2xl rounded-mx-full bg-brand-primary shadow-mx-xl border border-white/10 active:scale-95 transition-all"
                            >
                                <Typography variant="tiny" as="span" tone="white" className="font-black tracking-widest uppercase">
                                    {processing ? <RefreshCw className="animate-spin mr-3 inline-block" /> : <Layers size={20} className="mr-3 inline-block" aria-hidden="true" />} 
                                    INJETAR MASSA
                                </Typography>
                            </Button>

                            <AnimatePresence>
                                {validation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <Card className="p-mx-md bg-white/5 border border-white/10 space-y-mx-md rounded-mx-2xl mt-mx-md">
                                            <header className="flex items-center gap-mx-xs border-b border-white/10 pb-2">
                                                <ShieldCheck size={14} className={validation.isValid ? "text-status-success" : "text-status-error"} />
                                                <Typography variant="tiny" tone="white" className="font-black uppercase tracking-widest">Resumo Estrutural</Typography>
                                            </header>
                                            <div className="grid grid-cols-2 gap-mx-sm">
                                                <div className="text-center p-mx-xs bg-mx-black rounded-mx-xl border border-white/5">
                                                    <Typography variant="tiny" tone="white" className="opacity-40 block mb-1">LINHAS</Typography>
                                                    <Typography variant="h3" tone="white" className="text-lg">{validation.summary.totalRows}</Typography>
                                                </div>
                                                <div className="text-center p-mx-xs bg-mx-black rounded-mx-xl border border-white/5">
                                                    <Typography variant="tiny" tone="white" className="opacity-40 block mb-1">VENDEDORES</Typography>
                                                    <Typography variant="h3" tone="white" className="text-lg">{validation.summary.sellersFound.length}</Typography>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>

                    <Card className="bg-mx-black border-white/5 p-mx-lg md:p-10 space-y-mx-md shadow-mx-lg flex-1">
                        <div className="flex items-center gap-mx-sm mb-4">
                            <TerminalIcon size={18} className="text-brand-primary" aria-hidden="true" />
                            <Typography variant="tiny" tone="white" className="opacity-40 font-black uppercase tracking-widest">Log do Compilador</Typography>
                        </div>
                        <div className="bg-mx-black rounded-mx-2xl p-mx-md font-mono text-sm leading-relaxed h-mx-64 overflow-y-auto no-scrollbar border border-white/5 shadow-mx-inner" aria-live="assertive">
                            {logs.map((log, idx) => (
                                <Typography key={idx} variant="tiny" as="p" className={cn("font-black tracking-tight mb-2 uppercase", 
                                    log.type === 'error' ? 'text-status-error' : 
                                    log.type === 'warning' ? 'text-status-warning' : 
                                    log.type === 'success' ? 'text-status-success' : 
                                    'text-brand-primary'
                                )}>{log.msg}</Typography>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </Card>
                </section>

                <section className="lg:col-span-8 flex flex-col">
                    <Card className="bg-white border-none shadow-mx-xl overflow-hidden h-full flex flex-col">
                        <header className="p-mx-lg md:p-14 border-b border-border-default flex flex-col sm:flex-row items-center justify-between gap-mx-md bg-surface-alt/30">
                            <div className="flex items-center gap-mx-sm">
                                <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-mx-black text-brand-primary flex items-center justify-center shadow-mx-lg" aria-hidden="true"><History size={28} /></div>
                                <div>
                                    <Typography variant="h2" className="uppercase tracking-tighter leading-none">Audit Trail</Typography>
                                    <Typography variant="tiny" tone="muted" className="tracking-widest mt-1 font-black uppercase opacity-40">LOG DE INJEÇÕES OPERACIONAIS</Typography>
                                </div>
                            </div>
                            <Badge variant="outline" className="px-6 py-2 rounded-mx-full font-black border-border-strong uppercase">
                                <Typography variant="tiny" as="span">{history.length} EVENTOS</Typography>
                            </Badge>
                        </header>

                        <div className="overflow-x-auto flex-1 no-scrollbar">
                            <table className="w-full text-left min-w-mx-table">
                                <caption className="sr-only">Histórico consolidado de reprocessamento de dados</caption>
                                <thead>
                                    <tr className="bg-surface-alt/50 border-b border-border-default">
                                        <th scope="col" className="pl-10 py-6"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">DATA / HORA</Typography></th>
                                        <th scope="col" className="px-6 py-6"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">UNIDADE</Typography></th>
                                        <th scope="col" className="px-6 py-6 text-center"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">REGISTROS</Typography></th>
                                        <th scope="col" className="pr-10 py-6 text-right"><Typography variant="caption" className="font-black uppercase tracking-mx-wide">STATUS</Typography></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-default bg-white">
                                    {history.map((h) => (
                                        <tr key={h.id} className="hover:bg-surface-alt/30 transition-colors group h-mx-3xl">
                                            <td className="pl-10">
                                                <div className="flex flex-col">
                                                    <Typography variant="h3" className="text-base leading-none mb-1 font-black uppercase tracking-tight">{format(parseISO(h.created_at), 'dd/MM/yyyy')}</Typography>
                                                    <Typography variant="tiny" tone="muted" className="font-black uppercase opacity-40">{format(parseISO(h.created_at), 'HH:mm:ss')}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-6">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-mx-lg h-mx-lg rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center group-hover:bg-brand-primary transition-all shadow-mx-inner shrink-0" aria-hidden="true">
                                                        <Typography variant="tiny" className="font-black group-hover:text-white uppercase">{h.store_name?.charAt(0)}</Typography>
                                                    </div>
                                                    <Typography variant="h3" className="text-sm uppercase tracking-tight font-black truncate max-w-[150px]">{h.store_name}</Typography>
                                                </div>
                                            </td>
                                            <td className="px-6 text-center">
                                                <Typography variant="mono" tone="brand" className="text-lg font-black">{h.rows_processed || 0}</Typography>
                                            </td>
                                            <td className="pr-10 text-right">
                                                <Badge variant={h.status === 'completed' ? 'success' : 'danger'} className="px-6 py-1.5 rounded-mx-lg shadow-sm border uppercase border-none">
                                                    <Typography variant="tiny" as="span" className="font-black tracking-widest">{h.status === 'completed' ? 'CONCLUÍDO' : 'FALHA'}</Typography>
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
