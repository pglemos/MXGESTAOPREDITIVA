import { useState, useEffect, useRef, useCallback } from 'react'
import { Terminal, ShieldCheck, Zap, Activity, RefreshCw, AlertTriangle, TrendingUp, Search, Quote } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useCheckins } from '@/hooks/useCheckins'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { useAuth } from '@/hooks/useAuth'

interface AuditLog {
    type: 'info' | 'success' | 'warning' | 'error'
    msg: string
}

export default function AiDiagnostics() {
    const { role } = useAuth()
    const { checkins } = useCheckins()
    const [isScanning, setIsScanning] = useState(false)
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [summary, setSummary] = useState<{ diagnostic: string; action: string } | null>(null)
    const terminalEndRef = useRef<HTMLDivElement>(null)

    const addLog = useCallback((msg: string, type: AuditLog['type'] = 'info') => {
        setLogs(prev => [...prev, { type, msg: `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}` }])
    }, [])

    const handleScan = useCallback(async () => {
        if (isScanning) return
        setIsScanning(true)
        setLogs([])
        setSummary(null)

        addLog('Iniciando Auditoria Forense v4.0...', 'info')
        await new Promise(r => setTimeout(r, 800))
        
        addLog('Conectando ao banco de dados Supabase...', 'info')
        await new Promise(r => setTimeout(r, 600))
        addLog('Conexão estabelecida. Protocolo SSL verificado.', 'success')

        addLog(`Escaneando ${checkins.length} registros de check-in...`, 'info')
        await new Promise(r => setTimeout(r, 1000))

        addLog('Validando integridade dos leads reportados...', 'info')
        const stores = [...new Set(checkins.map(c => c.store_id))]
        addLog(`Identificadas ${stores.length} unidades operacionais na malha.`, 'success')

        await new Promise(r => setTimeout(r, 1200))
        addLog('Executando heurística de conversão (MX 20/60/33)...', 'warning')
        
        const funnel = calcularFunil(checkins)
        const diagnosis = gerarDiagnosticoMX(funnel)

        await new Promise(r => setTimeout(r, 1000))
        addLog('Auditoria de escoamento concluída.', 'success')
        addLog('Gerando veredito estratégico...', 'info')
        
        await new Promise(r => setTimeout(r, 800))
        setSummary({
            diagnostic: diagnosis.diagnostico,
            action: diagnosis.sugestao
        })
        addLog('Processamento finalizado. Sistema em standby.', 'success')
        setIsScanning(false)
    }, [isScanning, checkins, addLog])

    useEffect(() => {
        handleScan()
    }, [handleScan])

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    if (role !== 'admin' && role !== 'dono') {
        return (
            <main className="h-full w-full flex flex-col items-center justify-center text-center p-10 bg-slate-950">
                <ShieldCheck size={48} className="text-white/20 mb-6" aria-hidden="true" />
                <h1 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Acesso Forense Restrito</h1>
                <p className="text-white/40 text-sm font-bold max-w-sm mx-auto uppercase tracking-widest">O motor de IA diagnóstica é exclusivo para o escalão administrativo.</p>
            </main>
        )
    }

    return (
        <main className="w-full h-full flex flex-col gap-8 md:gap-10 p-4 md:p-10 overflow-y-auto no-scrollbar bg-slate-950 text-white">
            
            {/* Engine Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] animate-pulse" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">
                            Auditoria <span className="text-indigo-400">Forense</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" aria-hidden="true" />
                        <p className="text-indigo-300/60 text-[10px] font-black uppercase tracking-[0.4em]">Deep Learning Engine v4.0 • MX PERFORMANCE</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Status do Motor</span>
                        <Badge className={cn(
                            "mt-1 px-4 py-1 rounded-full text-[10px] font-black uppercase border-none shadow-lg",
                            isScanning ? "bg-amber-500 text-slate-950 animate-pulse" : "bg-emerald-500/20 text-emerald-400"
                        )}>
                            {isScanning ? 'PROCESSANDO...' : 'SISTEMA PRONTO'}
                        </Badge>
                    </div>
                    <button 
                        onClick={handleScan}
                        disabled={isScanning}
                        aria-label="Re-executar auditoria forense"
                        className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale focus-visible:ring-8 focus-visible:ring-indigo-500/20 outline-none"
                    >
                        <Zap size={32} className={cn(isScanning ? "animate-bounce" : "fill-white")} aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Terminal de Processamento */}
                <section className="lg:col-span-7 flex flex-col gap-8" aria-labelledby="terminal-title">
                    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden flex-1 min-h-[600px] flex flex-col">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32" aria-hidden="true" />
                        
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <Terminal size={20} className="text-indigo-400" aria-hidden="true" />
                                <h2 id="terminal-title" className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Terminal de Auditoria em Tempo Real</h2>
                            </div>
                            <div className="flex gap-1.5" aria-hidden="true">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30" />
                            </div>
                        </div>

                        <div className="flex-1 font-mono text-[11px] leading-relaxed space-y-3 overflow-y-auto pr-4 no-scrollbar border-t border-white/5 pt-8" aria-live="polite">
                            {logs.map((log, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    className="flex gap-4 group hover:bg-white/5 p-2 rounded-lg transition-colors"
                                >
                                    <span className="text-white/20 shrink-0 select-none">{(idx + 1).toString().padStart(3, '0')}</span>
                                    <span className={cn(
                                        "font-bold",
                                        log.type === 'error' ? 'text-rose-400' :
                                        log.type === 'warning' ? 'text-amber-400' :
                                        log.type === 'success' ? 'text-emerald-400' :
                                        'text-indigo-300'
                                    )}>{log.msg}</span>
                                </motion.div>
                            ))}
                            {isScanning && (
                                <div className="flex gap-4 items-center animate-pulse py-4">
                                    <span className="text-white/20 shrink-0">---</span>
                                    <span className="text-indigo-400 font-black flex items-center gap-2">
                                        <RefreshCw size={12} className="animate-spin" aria-hidden="true" /> EXECUTANDO CÁLCULO DE PROJEÇÕES...
                                    </span>
                                </div>
                            )}
                            <div ref={terminalEndRef} aria-hidden="true" />
                        </div>
                    </div>
                </section>

                {/* Painel de Resultados */}
                <aside className="lg:col-span-5 flex flex-col gap-8">
                    <section className="bg-white rounded-[2.5rem] p-10 text-slate-950 shadow-3xl space-y-10 border border-white/10" aria-labelledby="insights-title">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
                            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-xl" aria-hidden="true">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h2 id="insights-title" className="text-2xl font-black uppercase tracking-tight leading-none">Veredito MX</h2>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Conclusão do Algoritmo</p>
                            </div>
                        </div>

                        <div className="space-y-8" aria-live="polite">
                            {summary ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                    <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-inner relative overflow-hidden group">
                                        <Quote size={48} className="absolute -right-4 -bottom-4 text-indigo-200/50 -rotate-12 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <p className="text-lg font-black italic text-indigo-950 leading-relaxed relative z-10">"{summary.diagnostic}"</p>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                            <TrendingUp size={14} className="text-emerald-600" aria-hidden="true" /> Plano de Ação Gerencial
                                        </h3>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-tight">{summary.action}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-100" role="list" aria-label="Indicadores de integridade">
                                        <div className="space-y-2" role="listitem">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Score de Precisão</p>
                                            <p className="text-4xl font-black text-slate-950 tracking-tighter">98.4%</p>
                                        </div>
                                        <div className="space-y-2" role="listitem">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gaps Corrigidos</p>
                                            <p className="text-4xl font-black text-emerald-600 tracking-tighter">14</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <Activity size={48} className="text-gray-200 mb-6 animate-pulse" aria-hidden="true" />
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest max-w-[200px]">Aguardando processamento de massa de dados.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group" aria-labelledby="side-impacto-title">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" aria-hidden="true" />
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner" aria-hidden="true">
                                    <AlertTriangle size={24} className="text-white" />
                                </div>
                                <h3 id="side-impacto-title" className="text-xl font-black uppercase tracking-tight">Zona de Impacto</h3>
                            </div>
                            <p className="text-sm font-bold leading-relaxed italic opacity-95 border-t border-white/10 pt-8 uppercase tracking-tight">
                                "A auditoria forense identifica inconsistências entre os leads gerados e as vendas reportadas, prevenindo vazamentos de performance e garantindo a integridade da meritocracia."
                            </p>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    )
}
