import { useStores } from '@/hooks/useTeam'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
    ArrowLeft, Database, Upload, RefreshCw, Terminal as TerminalIcon, 
    Layers, History, ShieldCheck, 
    FileSpreadsheet, X 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { validateLegacyCSV, ValidationResult } from '@/lib/migration-validator'
import { DataGrid, Column } from '@/components/organisms/DataGrid'

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

            const { error: rpcError } = await supabase.rpc('process_import_data', { p_log_id: log.id })
            if (rpcError) throw new Error(rpcError.message)

            let attempts = 0
            while (attempts < 30) {
                const { data: statusCheck } = await supabase.from('reprocess_logs').select('status, records_processed, records_failed').eq('id', log.id).single()
                if (statusCheck?.status === 'completed') {
                    addLog(`SINCRONIZAÇÃO FINALIZADA: ${statusCheck.records_processed} linhas processadas.`, 'success')
                    break
                }
                if (statusCheck?.status === 'failed') throw new Error('O motor reportou falha crítica.')
                await new Promise(r => setTimeout(r, 1000))
                attempts++
            }
            
            toast.success('Dados integrados!')
            fetchHistory()
        } catch (err: any) {
            addLog(`ERRO: ${err.message}`, 'error')
            toast.error('Falha na injeção.')
        } finally {
            setProcessing(false)
        }
    }

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'created_at',
            header: 'DATA / HORA',
            render: (h) => (
                <div className="flex flex-col">
                    <Typography variant="h3" className="text-sm sm:text-base leading-none mb-1 font-black uppercase tracking-tight">{format(parseISO(h.created_at), 'dd/MM/yyyy')}</Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase opacity-40 text-[8px] sm:text-mx-micro">{format(parseISO(h.created_at), 'HH:mm:ss')}</Typography>
                </div>
            )
        },
        {
            key: 'store_name',
            header: 'UNIDADE',
            render: (h) => (
                <div className="flex items-center gap-mx-sm min-w-0">
                    <div className="w-mx-8 h-mx-8 sm:w-mx-lg sm:h-mx-lg rounded-mx-lg bg-surface-alt border border-border-default flex items-center justify-center shrink-0"><Typography variant="tiny" className="font-black text-[8px]">{h.store_name?.charAt(0)}</Typography></div>
                    <Typography variant="h3" className="text-xs sm:text-sm uppercase tracking-tight font-black truncate">{h.store_name}</Typography>
                </div>
            )
        },
        {
            key: 'rows_processed',
            header: 'REG.',
            align: 'center',
            render: (h) => <Typography variant="mono" tone="brand" className="text-base sm:text-lg font-black tabular-nums">{h.rows_processed || 0}</Typography>
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'right',
            render: (h) => (
                <Badge variant={h.status === 'completed' ? 'success' : 'danger'} className="px-3 sm:px-6 py-1.5 rounded-mx-lg shadow-sm border uppercase border-none text-[8px] sm:text-mx-micro font-black">
                    {h.status === 'completed' ? 'OK' : 'ERRO'}
                </Badge>
            )
        }
    ], [])

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-md md:p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary" id="main-content">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/10 pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
                        <div className="hidden sm:block w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" />
                        <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl">Massa de <Typography as="span" variant="h1" tone="brand">Dados</Typography></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-widest text-[10px] sm:text-xs">DATA INJECTION ENGINE v2.1</Typography>
                </div>

                <div className="flex flex-wrap flex-row items-center justify-center gap-mx-sm shrink-0 w-full lg:w-auto">
                    <Button asChild variant="ghost" className="flex-1 sm:flex-none text-white/40 hover:text-white hover:bg-white/5 rounded-mx-full px-6 font-black uppercase tracking-widest text-[10px]">
                        <Link to="/configuracoes"><ArrowLeft size={14} className="mr-2" /> VOLTAR</Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl border-white/10 text-white/40 h-mx-10 w-mx-10 sm:h-mx-14 sm:w-mx-14 hover:text-white bg-white/5">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
                <section className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="bg-mx-black border-white/5 p-6 sm:p-10 space-y-mx-md shadow-mx-xl relative overflow-hidden">
                        <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-brand-primary/5 rounded-mx-full blur-3xl" />
                        
                        <header className="flex items-center gap-mx-sm border-b border-white/5 pb-6 relative z-10">
                            <div className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl bg-brand-primary text-white flex items-center justify-center shadow-mx-xl border border-white/10 shrink-0"><Database size={24} /></div>
                            <div>
                                <Typography variant="h3" tone="white" className="uppercase tracking-tight font-black text-sm sm:text-lg">Carregar Dados</Typography>
                                <Typography variant="tiny" tone="white" className="opacity-30 uppercase tracking-widest mt-0.5 font-black text-[8px]">UNIDADE ALVO</Typography>
                            </div>
                        </header>

                        <div className="space-y-mx-md relative z-10">
                            <div className="space-y-mx-xs">
                                <Typography variant="tiny" tone="white" as="label" className="opacity-40 ml-2 font-black uppercase tracking-widest text-[8px]">Unidade</Typography>
                                <select 
                                    value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                                    className="w-full h-mx-12 px-4 bg-white/5 border border-white/10 rounded-mx-xl text-white text-xs font-bold appearance-none cursor-pointer uppercase outline-none"
                                >
                                    <option value="" className="bg-mx-black">Selecione...</option>
                                    {stores.map(s => <option key={s.id} value={s.id} className="bg-mx-black">{s.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <div className="space-y-mx-xs">
                                <Typography variant="tiny" tone="white" className="opacity-40 ml-2 font-black uppercase tracking-widest text-[8px]">Arquivo</Typography>
                                <div className="relative group">
                                    <input id="csv-upload" type="file" accept=".csv,.xlsx" onChange={handleFileSelect} className="sr-only" />
                                    <label htmlFor="csv-upload" className={cn("flex flex-col items-center justify-center gap-mx-sm w-full min-h-24 border-2 border-dashed rounded-mx-2xl transition-all cursor-pointer", 
                                        file ? "bg-brand-primary/10 border-brand-primary/50" : "bg-white/5 border-white/10"
                                    )}>
                                        <Upload size={20} className="text-white/20" />
                                        <Typography variant="h3" tone="white" className="text-[10px] truncate max-w-[150px] font-black uppercase">{file ? file.name : 'Selecionar'}</Typography>
                                    </label>
                                </div>
                            </div>

                            <Button onClick={handleUpload} disabled={processing || !file || !selectedStoreId} className="w-full h-mx-14 rounded-mx-full bg-brand-primary shadow-mx-xl border border-white/10 font-black uppercase tracking-widest text-[10px]">
                                {processing ? <RefreshCw className="animate-spin mr-2" /> : <Layers size={16} className="mr-2" />} 
                                INJETAR AGORA
                            </Button>

                            <AnimatePresence>
                                {validation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                        <div className="p-3 bg-white/5 border border-white/10 rounded-mx-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-status-success" />
                                                <Typography variant="tiny" tone="white" className="font-black uppercase text-[8px]">{validation.summary.validRows} VÁLIDOS</Typography>
                                            </div>
                                            <Typography variant="tiny" tone="white" className="opacity-40 text-[8px]">{validation.summary.sellersFound.length} VENDEDORES</Typography>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>

                    <Card className="bg-mx-black border-white/5 p-6 sm:p-10 space-y-mx-sm shadow-mx-lg flex-1">
                        <div className="flex items-center gap-mx-sm mb-2">
                            <TerminalIcon size={14} className="text-brand-primary" />
                            <Typography variant="tiny" tone="white" className="opacity-40 font-black uppercase tracking-widest text-[8px]">LOG DO COMPILADOR</Typography>
                        </div>
                        <div className="bg-mx-black rounded-mx-xl p-4 font-mono text-[9px] leading-tight h-40 lg:h-mx-64 overflow-y-auto no-scrollbar border border-white/5 shadow-mx-inner">
                            {logs.map((log, idx) => (
                                <p key={idx} className={cn("mb-1 uppercase", 
                                    log.type === 'error' ? 'text-status-error font-black' : 
                                    log.type === 'warning' ? 'text-status-warning font-black' : 
                                    log.type === 'success' ? 'text-status-success font-black' : 
                                    'text-brand-primary opacity-60'
                                )}>{log.msg}</p>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </Card>
                </section>

                <section className="lg:col-span-8 flex flex-col">
                    <Card className="bg-white border-none shadow-mx-xl overflow-hidden h-full flex flex-col">
                        <header className="p-6 sm:p-10 border-b border-border-default flex flex-row items-center justify-between bg-surface-alt/30 shrink-0">
                            <div className="flex items-center gap-mx-sm">
                                <div className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl bg-mx-black text-brand-primary flex items-center justify-center shadow-mx-lg shrink-0"><History size={24} /></div>
                                <div>
                                    <Typography variant="h2" className="uppercase tracking-tighter leading-none text-lg sm:text-2xl">Audit Trail</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-widest mt-0.5 font-black uppercase opacity-40 text-[8px] sm:text-xs">EVENTOS DE INGESTÃO</Typography>
                                </div>
                            </div>
                        </header>
                        <div className="flex-1 overflow-hidden">
                            <DataGrid columns={columns} data={history} emptyMessage="Nenhum registro." />
                        </div>
                    </Card>
                </section>
            </div>
        </main>
    )
}
