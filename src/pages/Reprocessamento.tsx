import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Database, RefreshCw, ShieldAlert, CheckCircle2, AlertTriangle, Clock, Upload, FileType, Table, Download, ShieldCheck, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parseCSV, validateHeaders, MANDATORY_HEADERS, ParsedCSVRow } from '@/lib/csv-parser'
import { format } from 'date-fns'

type ReprocessLog = {
    id: string
    store_id: string | null
    source_type: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    started_at: string
    finished_at: string | null
    rows_processed: number
    warnings: string[] | null
    error_log: any[] | null
    store?: { name: string }
}

export default function Reprocessamento() {
    const { profile, role } = useAuth()
    const { stores } = useStores()
    const [logs, setLogs] = useState<ReprocessLog[]>([])
    const [loading, setLoading] = useState(true)
    const [executing, setExecuting] = useState(false)
    const [selectedStore, setSelectedStore] = useState<string>('all')
    const [importData, setImportData] = useState<ParsedCSVRow[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const navigate = useNavigate()

    const fetchLogs = async () => {
        if (role !== 'admin') {
            setLogs([])
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('reprocess_logs')
            .select('*, store:stores(name)')
            .order('started_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setLogs(data as any)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [role])

    if (role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 text-center">
                <ShieldCheck size={48} className="text-gray-200 mb-6" />
                <h3 className="text-2xl font-black text-pure-black tracking-tight mb-2">Acesso Restrito</h3>
                <p className="text-gray-400 text-sm font-bold max-w-xs mx-auto">Reprocessamento é exclusivo do admin da MX Gestão Preditiva.</p>
            </div>
        )
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            const rows = parseCSV(text)
            if (rows.length > 0) {
                const fileHeaders = Object.keys(rows[0])
                const validation = validateHeaders(fileHeaders)

                if (!validation.valid) {
                    toast.error(`Cabeçalhos ausentes: ${validation.missing.join(', ')}`)
                    return
                }

                setHeaders(fileHeaders)
                setImportData(rows)
                toast.success(`${rows.length} registros carregados e validados!`)
            }
        }
        reader.readAsText(file)
    }

    const handleReprocess = async () => {
        if (!window.confirm("Atenção: Esta operação irá reconstruir a base oficial a partir dos dados fornecidos. Confirma a purga e reconstrução?")) return

        setExecuting(true)
        try {
            // 1. Criar o Log
            const { data: logData, error: logError } = await supabase
                .from('reprocess_logs')
                .insert({
                    store_id: selectedStore === 'all' ? null : selectedStore,
                    source_type: importData.length > 0 ? 'bulk_csv_import' : 'manual_rebuild',
                    triggered_by: profile?.id,
                    status: 'pending'
                })
                .select()
                .single()

            if (logError) throw logError

            // 2. Se houver dados de importação, subir para raw_imports
            if (importData.length > 0) {
                const chunks = []
                for (let i = 0; i < importData.length; i += 100) {
                    chunks.push(importData.slice(i, i + 100))
                }

                for (const chunk of chunks) {
                    const { error: insError } = await supabase.from('raw_imports').insert(
                        chunk.map(row => ({ log_id: logData.id, raw_data: row }))
                    )
                    if (insError) throw insError
                }
            }

            // 3. Chamar o motor de processamento no banco
            const { error: rpcError } = await supabase.rpc('process_import_data', { p_log_id: logData.id })
            if (rpcError) throw rpcError

            toast.success('Processamento concluído com sucesso!')
            setImportData([])
            setHeaders([])
            fetchLogs()
        } catch (error: any) {
            toast.error(`Falha Crítica: ${error.message}`)
        } finally {
            setExecuting(false)
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Sucesso' }
            case 'pending': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Aguardando' }
            case 'processing': return { icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Processando' }
            case 'failed': return { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Erro Base' }
            default: return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: status }
        }
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase text-slate-950">
                            Motor de <span className="text-rose-600">Reprocessamento</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Operações Forenses & Reparo de Base</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/configuracoes" className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90">
                        <ArrowLeft size={20} />
                    </Link>
                    <button onClick={fetchLogs} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90">
                        <RefreshCw size={20} className={cn(loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32">

                {/* Administrative Terminal */}
                <div className="lg:col-span-5 flex flex-col gap-mx-lg">
                    <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white space-y-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />

                        <div className="space-y-2 relative z-10">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Database size={24} className="text-rose-500" /> Terminal de Reparo
                            </h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                Use esta ferramenta para corrigir inconsistências históricas ou importar dados em massa seguindo a metodologia MX.
                            </p>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-2">Origem dos Dados</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group",
                                        importData.length > 0 ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 hover:border-rose-500/50 hover:bg-white/5"
                                    )}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all", importData.length > 0 ? "bg-emerald-500 text-white" : "bg-white/5 text-white/20 group-hover:text-rose-500")}>
                                        {importData.length > 0 ? <ShieldCheck size={28} /> : <Upload size={28} />}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black uppercase tracking-widest">{importData.length > 0 ? 'Arquivo Validado' : 'Carregar Planilha CSV'}</p>
                                        <p className="text-[9px] font-bold text-white/30 uppercase mt-1">Headers mandatórios: {MANDATORY_HEADERS.join(', ')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-2">Escopo do Reparo</label>
                                <select 
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white focus:outline-none focus:border-rose-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all">TODAS AS UNIDADES OPERACIONAIS</option>
                                    {stores.map(s => <option key={s.id} value={s.id} className="text-slate-900">{s.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <button 
                                onClick={handleReprocess}
                                disabled={executing || (importData.length === 0 && selectedStore === 'all')}
                                className="w-full py-6 rounded-full bg-rose-600 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-30 shadow-xl"
                            >
                                {executing ? <RefreshCw size={20} className="animate-spin" /> : <><ShieldAlert size={20} strokeWidth={2.5} /> Executar Reconstrução Bruta</>}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Historical Audit Trail */}
                <div className="lg:col-span-7 flex flex-col gap-mx-lg">
                    <Card className="border-gray-100 shadow-sm rounded-[2.5rem] overflow-hidden flex-1 flex flex-col">
                        <CardHeader className="bg-gray-50/30 border-b border-gray-100 p-8 flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-slate-400 shadow-sm"><Table size={24} /></div>
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-950">Trilha de Auditoria</CardTitle>
                                    <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Log de operações forenses na base canônica.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            <th className="pl-8 py-6">Operação</th>
                                            <th className="px-4 py-6 text-center">Unidade</th>
                                            <th className="px-4 py-6 text-center">Registros</th>
                                            <th className="pr-8 py-6 text-right">Resultado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 bg-white">
                                        {logs.map(log => {
                                            const st = getStatusConfig(log.status)
                                            return (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors h-24 group">
                                                    <td className="pl-8 py-2">
                                                        <p className="font-black text-xs text-slate-950 uppercase tracking-tight">{log.source_type === 'bulk_csv_import' ? 'Importação Planilha' : 'Reconstrução Manual'}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(log.started_at).toLocaleString('pt-BR')}</p>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <Badge variant="outline" className="text-[8px] font-black text-slate-400 border-gray-200 uppercase tracking-widest">
                                                            {log.store?.name || 'REDE TODA'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-base font-black font-mono-numbers text-slate-950">{log.rows_processed || 0}</span>
                                                            {log.warnings && log.warnings.length > 0 && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">-{log.warnings.length} alertas</span>}
                                                        </div>
                                                    </td>
                                                    <td className="pr-8 py-2 text-right">
                                                        <Badge className={cn("text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest border-none shadow-sm gap-2", st.bg, st.color)}>
                                                            <st.icon size={12} strokeWidth={3} className={cn(log.status === 'processing' && "animate-spin")} /> {st.label}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {logs.length === 0 && !loading && (
                                            <tr><td colSpan={4} className="py-20 text-center mx-text-caption opacity-40 uppercase text-slate-300 font-black tracking-[0.4em]">Audit Trail Vazio</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
