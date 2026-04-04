import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Database, RefreshCw, ShieldAlert, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ReprocessLog = {
    id: string
    store_id: string | null
    source_type: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    started_at: string
    finished_at: string | null
    store?: { name: string }
}

export default function Reprocessamento() {
    const { profile } = useAuth()
    const { stores } = useStores()
    const [logs, setLogs] = useState<ReprocessLog[]>([])
    const [loading, setLoading] = useState(true)
    const [executing, setExecuting] = useState(false)
    const [selectedStore, setSelectedStore] = useState<string>('all')

    const fetchLogs = async () => {
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
    }, [])

    const handleReprocess = async () => {
        if (!window.confirm("Você está prestes a forçar a reconstrução da base oficial. Isso pode sobrescrever dados derivados manuais. Confirma a operação?")) return

        setExecuting(true)
        try {
            const payload = {
                p_store_id: selectedStore === 'all' ? null : selectedStore,
                p_source_type: 'manual_admin_trigger',
                p_triggered_by: profile?.id
            }

            const { error } = await supabase.rpc('request_reprocess', payload)
            
            if (error) throw error

            toast.success('Comando de reconstrução despachado para a fila de processamento!')
            fetchLogs()
        } catch (error: any) {
            toast.error(`Falha no comando: ${error.message}`)
        } finally {
            setExecuting(false)
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'completed': return { icon: CheckCircle2, color: 'text-status-success', bg: 'bg-status-success-surface', label: 'Concluído' }
            case 'pending': return { icon: Clock, color: 'text-status-warning', bg: 'bg-status-warning-surface', label: 'Aguardando' }
            case 'processing': return { icon: RefreshCw, color: 'text-brand-primary', bg: 'bg-brand-primary-surface', label: 'Processando' }
            case 'failed': return { icon: AlertTriangle, color: 'text-status-error', bg: 'bg-status-error-surface', label: 'Falha Crítica' }
            default: return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: status }
        }
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10 bg-white">
            
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 relative z-10 w-full shrink-0 border-b border-border-default pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.4)]" />
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase text-text-primary">
                            Base <span className="text-rose-600">Canônica</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-status-warning shadow-lg animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Operações de Reparo & Backfill</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <Link to="/configuracoes" className="w-12 h-12 rounded-2xl bg-white border border-border-default shadow-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all active:scale-90">
                        <ArrowLeft size={20} />
                    </Link>
                    <button onClick={fetchLogs} className="w-12 h-12 rounded-2xl bg-white border border-border-default shadow-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all active:scale-90">
                        <RefreshCw size={20} className={cn(loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg pb-32">
                
                {/* Control Panel */}
                <div className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <div className="mx-card p-8 bg-rose-50 border-rose-100 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-5 transform translate-x-4 -translate-y-4"><ShieldAlert size={150} /></div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-rose-900 mb-6 relative z-10 flex items-center gap-2">
                            <Database size={16} /> Central de Disparo
                        </h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Escopo de Reprocessamento</label>
                                <select 
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                    className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 text-sm font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                >
                                    <option value="all">TODAS AS LOJAS (Global)</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <button 
                                onClick={handleReprocess}
                                disabled={executing}
                                className="w-full py-4 rounded-xl bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {executing ? <RefreshCw size={16} className="animate-spin" /> : <><ShieldAlert size={16} /> Forçar Reconstrução</>}
                            </button>
                            <p className="text-[9px] font-bold text-rose-600/70 text-center uppercase tracking-widest leading-relaxed">
                                Atenção: Jobs enfileirados serão executados em background para preservar a resiliência do core.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Audit Logs */}
                <div className="lg:col-span-8 flex flex-col gap-mx-lg">
                    <Card className="border-none shadow-mx-lg rounded-[2.5rem] overflow-hidden flex-1">
                        <CardHeader className="bg-mx-slate-50/30 border-b border-border-subtle p-mx-lg flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight">Trilha de Auditoria</CardTitle>
                                <CardDescription className="font-bold text-text-tertiary">Histórico de reconstrução de base oficial.</CardDescription>
                            </div>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-mx-slate-50/50 border-b border-border-default">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                        <th className="px-mx-xl py-mx-md">Gatilho</th>
                                        <th className="px-mx-md py-mx-md text-center">Escopo</th>
                                        <th className="px-mx-md py-mx-md text-center">Data/Hora</th>
                                        <th className="px-mx-xl py-mx-md text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {logs.map(log => {
                                        const st = getStatusConfig(log.status)
                                        return (
                                            <tr key={log.id} className="hover:bg-mx-slate-50/30 transition-colors h-16 group">
                                                <td className="px-mx-xl py-3 font-bold text-xs text-text-secondary uppercase tracking-tight">
                                                    {log.source_type}
                                                </td>
                                                <td className="px-mx-md py-3 text-center">
                                                    <span className="text-[10px] font-black bg-mx-slate-100 text-text-tertiary px-2 py-1 rounded uppercase tracking-widest">
                                                        {log.store?.name || 'GLOBAL'}
                                                    </span>
                                                </td>
                                                <td className="px-mx-md py-3 text-center font-mono-numbers text-xs text-text-tertiary font-bold">
                                                    {new Date(log.started_at).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="px-mx-xl py-3 text-right">
                                                    <Badge className={cn("text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest border-none gap-1", st.bg, st.color)}>
                                                        <st.icon size={10} strokeWidth={3} className={cn(log.status === 'processing' && "animate-spin")} /> {st.label}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {logs.length === 0 && !loading && (
                                        <tr><td colSpan={4} className="py-20 text-center mx-text-caption opacity-40 uppercase text-text-secondary font-black">Nenhum evento de reprocessamento auditado.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}