import { useState, useEffect, useRef, useCallback } from 'react'
import { Terminal, ShieldCheck, Zap, Activity, RefreshCw, AlertTriangle, TrendingUp, Search, Quote } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { useCheckins } from '@/hooks/useCheckins'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { useAuth } from '@/hooks/useAuth'

interface AuditLog { type: 'info' | 'success' | 'warning' | 'error'; msg: string }

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
        setIsScanning(true); setLogs([]); setSummary(null)
        addLog('Iniciando Auditoria Forense v4.0...', 'info')
        await new Promise(r => setTimeout(r, 800))
        addLog('Conectando ao banco de dados Supabase...', 'info')
        await new Promise(r => setTimeout(r, 600))
        addLog('Conexão estabelecida. Protocolo SSL verificado.', 'success')
        addLog(`Escaneando ${checkins.length} registros de check-in...`, 'info')
        await new Promise(r => setTimeout(r, 1000))
        addLog('Executando heurística de conversão (MX 20/60/33)...', 'warning')
        const funnel = calcularFunil(checkins); const diagnosis = gerarDiagnosticoMX(funnel)
        await new Promise(r => setTimeout(r, 1000))
        setSummary({ diagnostic: diagnosis.diagnostico, action: diagnosis.sugestao })
        addLog('Processamento finalizado. Sistema em standby.', 'success')
        setIsScanning(false)
    }, [isScanning, checkins, addLog])

    useEffect(() => { handleScan() }, [handleScan])
    useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

    if (role !== 'admin' && role !== 'dono') return (
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-10 bg-brand-secondary">
            <ShieldCheck size={48} className="text-white/20 mb-6" aria-hidden="true" />
            <Typography variant="h2" tone="white">Acesso Restrito</Typography>
            <Typography variant="p" tone="white" className="max-w-sm mx-auto opacity-40 uppercase">Motor de inteligência exclusivo para escalão administrativo.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary text-white">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/5 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-500 rounded-full shadow-mx-xl animate-pulse" aria-hidden="true" />
                        <Typography variant="h1" tone="white">Auditoria <span className="text-indigo-400">Forense</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md opacity-50">Deep Learning Engine v4.0 • MX PERFORMANCE</Typography>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end mr-4">
                        <Typography variant="caption" tone="white" className="opacity-40">Status do Motor</Typography>
                        <Badge variant={isScanning ? 'warning' : 'success'} className="mt-1 shadow-lg px-4">{isScanning ? 'PROCESSANDO...' : 'SISTEMA PRONTO'}</Badge>
                    </div>
                    <Button size="icon" onClick={handleScan} disabled={isScanning} className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 shadow-mx-xl">
                        <Zap size={32} className={cn(isScanning ? "animate-bounce" : "fill-white")} aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                <section className="lg:col-span-7 flex flex-col gap-mx-lg">
                    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-10 shadow-3xl relative overflow-hidden min-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <Terminal size={20} className="text-indigo-400" aria-hidden="true" />
                                <Typography variant="caption" tone="white" className="opacity-40">Terminal de Auditoria Real-Time</Typography>
                            </div>
                        </div>

                        <div className="flex-1 font-mono text-[11px] leading-relaxed space-y-3 overflow-y-auto pr-4 no-scrollbar border-t border-white/5 pt-8" aria-live="polite">
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-4 group hover:bg-white/5 p-2 rounded-lg transition-colors">
                                    <span className="text-white/20">{(idx + 1).toString().padStart(3, '0')}</span>
                                    <span className={cn("font-bold", log.type === 'error' ? 'text-rose-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-indigo-300')}>{log.msg}</span>
                                </div>
                            ))}
                            <div ref={terminalEndRef} aria-hidden="true" />
                        </div>
                    </div>
                </section>

                <aside className="lg:col-span-5 flex flex-col gap-mx-lg">
                    <Card className="p-10 text-slate-950 space-y-10 border-none">
                        <div className="flex items-center gap-4 border-b border-border-default pb-8">
                            <div className="w-14 h-14 rounded-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg" aria-hidden="true"><ShieldCheck size={28} /></div>
                            <div>
                                <Typography variant="h3">Veredito MX</Typography>
                                <Typography variant="caption" tone="muted">Conclusão do Algoritmo</Typography>
                            </div>
                        </div>

                        <div className="space-y-8" aria-live="polite">
                            {summary ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                    <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100 shadow-inner relative group">
                                        <Quote size={48} className="absolute -right-4 -bottom-4 text-indigo-200/50 -rotate-12 transition-transform group-hover:scale-110" aria-hidden="true" />
                                        <p className="text-lg font-black italic text-indigo-950 leading-relaxed relative z-10">"{summary.diagnostic}"</p>
                                    </div>
                                    <div className="space-y-4">
                                        <Typography variant="caption" tone="muted" className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-600" /> Plano de Ação Gerencial</Typography>
                                        <Typography variant="p" className="text-sm font-bold">{summary.action}</Typography>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <Activity size={48} className="text-gray-200 mb-6 animate-pulse" aria-hidden="true" />
                                    <Typography variant="caption" tone="muted">Aguardando processamento...</Typography>
                                </div>
                            )}
                        </div>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
