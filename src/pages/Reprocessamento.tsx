import { useStores } from '@/hooks/useTeam'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
    ArrowLeft, Database, Upload, RefreshCw, Terminal as TerminalIcon, 
    Layers, History, ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/molecules/Card'
import { toast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { validateLegacyCSV, ValidationResult } from '@/lib/migration-validator'
import { DataGrid, type Column } from '@/components/organisms/DataGrid'

interface ImportLog { type: 'info' | 'success' | 'warning' | 'error'; msg: string }
type ImportHistoryStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ImportHistory {
    id: string
    created_at: string
    store_name?: string
    rows_processed?: number | null
    records_processed?: number | null
    records_failed?: number | null
    status: ImportHistoryStatus
}

type ImportHistoryRow = Omit<ImportHistory, 'store_name' | 'status'> & {
    status: string
    store: { name: string } | null
}

const statusMeta: Record<ImportHistoryStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' }> = {
    completed: { label: 'OK', variant: 'success' },
    failed: { label: 'ERRO', variant: 'danger' },
    processing: { label: 'PROCESSANDO', variant: 'info' },
    pending: { label: 'PENDENTE', variant: 'warning' },
}

async function calculateFileHash(file: File) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return Array.from(new Uint8Array(hashBuffer)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export default function Reprocessamento() {
    const { lojas } = useStores()
    const [selectedStoreId, setSelectedStoreId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [processing, setProcessing] = useState(false)
    const [validation, setValidation] = useState<ValidationResult | null>(null)
    const [logs, setLogs] = useState<ImportLog[]>([])
    const [history, setHistory] = useState<ImportHistory[]>([])
    const [isRefetching, setIsRefetching] = useState(false)
    const terminalEndRef = useRef<HTMLDivElement>(null)

    const addLog = useCallback((msg: string, type: ImportLog['type'] = 'info') => {
        setLogs(prev => [...prev, { type, msg: `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}` }])
    }, [])

    const fetchHistory = useCallback(async () => {
        const { data, error } = await supabase
            .from('logs_reprocessamento')
            .select('id, created_at, status, rows_processed, records_processed, records_failed, store:lojas(name)')
            .eq('source_type', 'csv_import')
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            toast.error('Falha ao carregar audit trail.')
            return
        }

        setHistory(((data || []) as unknown as ImportHistoryRow[]).map(h => ({
            ...h,
            status: h.status as ImportHistoryStatus,
            store_name: h.store?.name,
        })))
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
        let openedLogId: string | null = null
        
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

            const fileHash = await calculateFileHash(file)
            addLog(`Hash SHA-256 calculado: ${fileHash.slice(0, 12)}...`, 'info')

            const { data: duplicate, error: duplicateError } = await supabase
                .from('logs_reprocessamento')
                .select('id, created_at')
                .eq('file_hash', fileHash)
                .eq('status', 'completed')
                .maybeSingle()

            if (duplicateError) throw new Error(duplicateError.message)
            if (duplicate) throw new Error(`Arquivo já processado em lote concluído (${duplicate.id.split('-')[0]}).`)
            
            const { data: log, error: logError } = await supabase.from('logs_reprocessamento').insert({
                store_id: selectedStoreId,
                source_type: 'csv_import',
                triggered_by: (await supabase.auth.getUser()).data.user?.id,
                status: 'pending',
                file_hash: fileHash,
                rows_processed: 0,
                records_processed: 0,
                records_failed: 0,
                warnings: [],
                errors: [],
            }).select().single()

            if (logError) throw new Error(logError.message)
            openedLogId = log.id
            addLog(`Lote ${log.id.split('-')[0]} aberto.`, 'success')

            const chunkSize = 100
            for (let i = 0; i < result.records.length; i += chunkSize) {
                const chunk = result.records.slice(i, i + chunkSize)
                const { error: rawError } = await supabase.from('importacoes_brutas').insert(
                    chunk.map(r => ({ log_id: log.id, raw_data: r }))
                )
                if (rawError) throw new Error(rawError.message)
                addLog(`Injetado: ${Math.min(i + chunkSize, result.records.length)}/${result.records.length}`, 'info')
            }

            const { error: rpcError } = await supabase.rpc('process_import_data', { p_log_id: log.id })
            if (rpcError) throw new Error(rpcError.message)

            let attempts = 0
            let completed = false
            while (attempts < 30) {
                const { data: statusCheck } = await supabase.from('logs_reprocessamento').select('status, records_processed, records_failed').eq('id', log.id).single()
                if (statusCheck?.status === 'completed') {
                    addLog(`SINCRONIZAÇÃO FINALIZADA: ${statusCheck.records_processed} linhas processadas.`, 'success')
                    completed = true
                    break
                }
                if (statusCheck?.status === 'failed') throw new Error('O motor reportou falha crítica.')
                await new Promise(r => setTimeout(r, 1000))
                attempts++
            }

            if (!completed) throw new Error('Tempo limite aguardando conclusão do motor de importação.')
            
            toast.success('Dados integrados!')
            await fetchHistory()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro inesperado no reprocessamento.'
            if (openedLogId) {
                await supabase
                    .from('logs_reprocessamento')
                    .update({
                        status: 'failed',
                        errors: [message],
                        finished_at: new Date().toISOString(),
                    })
                    .eq('id', openedLogId)
                await fetchHistory()
            }
            addLog(`ERRO: ${message}`, 'error')
            toast.error('Falha na injeção.')
        } finally {
            setProcessing(false)
        }
    }

    const columns = useMemo<Column<ImportHistory>[]>(() => [
        {
            key: 'created_at',
            header: 'DATA / HORA',
            render: (h) => (
                <div className="flex flex-col">
                    <Typography variant="h3" className="text-sm sm:text-base leading-none mb-1 font-black uppercase tracking-tight">{format(parseISO(h.created_at), 'dd/MM/yyyy')}</Typography>
                    <Typography variant="tiny" tone="muted" className="font-black uppercase text-[8px] sm:text-[9px]">{format(parseISO(h.created_at), 'HH:mm:ss')}</Typography>
                </div>
            )
        },
        {
            key: 'store_name',
            header: 'UNIDADE',
            render: (h) => (
                <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0"><Typography variant="tiny" className="font-black text-[8px]">{h.store_name?.charAt(0)}</Typography></div>
                    <Typography variant="h3" className="text-xs sm:text-sm uppercase tracking-tight font-black truncate">{h.store_name}</Typography>
                </div>
            )
        },
        {
            key: 'rows_processed',
            header: 'REG.',
            align: 'center',
            render: (h) => <Typography variant="mono" tone="brand" className="text-base sm:text-lg font-black tabular-nums">{h.records_processed ?? h.rows_processed ?? 0}</Typography>
        },
        {
            key: 'status',
            header: 'STATUS',
            align: 'right',
            render: (h) => {
                const meta = statusMeta[h.status] || statusMeta.failed
                return (
                <Badge variant={meta.variant} className="px-3 sm:px-6 py-1.5 rounded-2xl shadow-sm border uppercase border-none text-[8px] sm:text-[9px] font-black">
                    {meta.label}
                </Badge>
                )
            }
        }
    ], [])

    return (
        <main className="h-full w-full overflow-y-auto bg-gray-900 p-8 no-scrollbar">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/10 pb-10 shrink-0">
                <div className="flex flex-col gap-1 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="hidden sm:block w-2 h-10 bg-emerald-600 rounded-full shadow-sm" />
                        <Typography variant="h1" tone="white" className="text-2xl sm:text-4xl">Massa de <Typography as="span" variant="h1" tone="brand">Dados</Typography></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="opacity-50 font-black uppercase tracking-widest text-[10px] sm:text-xs">DATA INJECTION ENGINE v2.1</Typography>
                </div>

                <div className="flex flex-row items-center justify-center gap-4 shrink-0 w-full lg:w-auto">
                    <Button asChild variant="ghost" className="flex-1 sm:flex-none text-white/40 hover:text-white hover:bg-white/5 rounded-full px-6 font-black uppercase tracking-widest text-[10px]">
                        <Link to="/configuracoes"><ArrowLeft size={14} className="mr-2" /> VOLTAR</Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="rounded-2xl border-white/10 text-white/40 h-10 w-10 sm:h-14 sm:w-14 hover:text-white bg-white/5">
                        <RefreshCw size={18} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                </div>
            </header>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-32">
                <section className="lg:col-span-4 flex flex-col gap-8">
                    <Card className="bg-gray-900 border-white/5 p-6 sm:p-10 space-y-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-full blur-3xl" />
                        
                        <header className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm border border-white/10 shrink-0"><Database size={24} /></div>
                            <div>
                                <Typography variant="h3" tone="white" className="uppercase tracking-tight font-black text-sm sm:text-lg">Carregar Dados</Typography>
                                <Typography variant="tiny" tone="white" className="opacity-30 uppercase tracking-widest mt-0.5 font-black text-[8px]">UNIDADE ALVO</Typography>
                            </div>
                        </header>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <Typography variant="tiny" tone="white" as="label" className="ml-2 font-black uppercase tracking-widest text-[8px]">Unidade</Typography>
                                <select aria-label="Unidade" 
                                    value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold appearance-none cursor-pointer uppercase outline-none"
                                >
                                    <option value="" className="bg-gray-900">Selecione...</option>
                                    {lojas.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Typography variant="tiny" tone="white" className="ml-2 font-black uppercase tracking-widest text-[8px]">Arquivo</Typography>
                                <div className="relative group">
                                    <input aria-label="Selecionar arquivo" id="csv-upload" type="file" accept=".csv,text/csv" onChange={handleFileSelect} className="sr-only" />
                                    <label htmlFor="csv-upload" className={cn("flex flex-col items-center justify-center gap-4 w-full min-h-24 border-2 border-dashed rounded-2xl transition-all cursor-pointer", 
                                        file ? "bg-emerald-600/10 border-emerald-600/50" : "bg-white/5 border-white/10"
                                    )}>
                                        <Upload size={20} className="text-white/20" />
                                        <Typography variant="h3" tone="white" className="text-[10px] truncate max-w-[120px] font-black uppercase">{file ? file.name : 'Selecionar'}</Typography>
                                    </label>
                                </div>
                            </div>

                            <Button onClick={handleUpload} disabled={processing || !file || !selectedStoreId} className="w-full h-14 rounded-full bg-emerald-600 shadow-sm border border-white/10 font-black uppercase tracking-widest text-[10px]">
                                {processing ? <RefreshCw className="animate-spin mr-2" /> : <Layers size={16} className="mr-2" />} 
                                INJETAR AGORA
                            </Button>

                            <AnimatePresence>
                                {validation && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                                        <div className="p-2 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-emerald-600" />
                                                <Typography variant="tiny" tone="white" className="font-black uppercase text-[8px]">{validation.summary.validRows} VÁLIDOS</Typography>
                                            </div>
                                            <Typography variant="tiny" tone="white" className="text-[8px]">{validation.summary.sellersFound.length} VENDEDORES</Typography>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>

                    <Card className="bg-gray-900 border-white/5 p-6 sm:p-10 space-y-4 shadow-sm flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <TerminalIcon size={14} className="text-emerald-600" />
                            <Typography variant="tiny" tone="white" className="font-black uppercase tracking-widest text-[8px]">LOG DO COMPILADOR</Typography>
                        </div>
                        <div className="bg-gray-900 rounded-2xl p-4 font-mono text-[9px] leading-tight h-20 lg:h-64 overflow-y-auto no-scrollbar border border-white/5 shadow-inner">
                            {logs.map((log, idx) => (
                                <p key={idx} className={cn("mb-1 uppercase", 
                                    log.type === 'error' ? 'text-red-600 font-black' : 
                                    log.type === 'warning' ? 'text-amber-600 font-black' : 
                                    log.type === 'success' ? 'text-emerald-600 font-black' : 
                                    'text-emerald-600 opacity-60'
                                )}>{log.msg}</p>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                    </Card>
                </section>

                <section className="lg:col-span-8 flex flex-col">
                    <Card className="bg-white border-none shadow-sm overflow-hidden h-full flex flex-col">
                        <header className="p-6 sm:p-10 border-b border-gray-100 flex flex-row items-center justify-between bg-gray-50/30 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gray-900 text-emerald-600 flex items-center justify-center shadow-sm shrink-0"><History size={24} /></div>
                                <div>
                                    <Typography variant="h2" className="uppercase tracking-tighter leading-none text-lg sm:text-2xl">Audit Trail</Typography>
                                    <Typography variant="caption" tone="muted" className="tracking-widest mt-0.5 font-black uppercase text-[8px] sm:text-xs">EVENTOS DE INGESTÃO</Typography>
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
