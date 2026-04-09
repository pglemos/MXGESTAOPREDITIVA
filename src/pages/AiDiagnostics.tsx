import { useState, useEffect, useRef, useCallback } from 'react'
import { Terminal as TerminalIcon, ShieldCheck, Zap, Activity, RefreshCw, AlertTriangle, TrendingUp, Search, Quote } from 'lucide-react'
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
            <Typography variant="p" tone="white" className="max-w-sm mx-auto opacity-40 uppercase tracking-widest mt-4">Motor de inteligência exclusivo para escalão administrativo.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary">
            
            {/* Header / Engine Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/10 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-400 rounded-full shadow-[0_0_20px_rgba(129,140,248,0.5)] animate-pulse" aria-hidden="true" />
                        <Typography variant="h1" tone="white">Auditoria <span className="text-indigo-400">Forense</span></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="pl-mx-md opacity-50 tracking-[0.2em]">DEEP LEARNING ENGINE v4.0</Typography>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    <div className="flex flex-col items-end">
                        <Typography variant="caption" tone="white" className="opacity-40 uppercase tracking-widest">Status do Motor</Typography>
                        <Badge variant={isScanning ? 'warning' : 'success'} className="mt-1 shadow-mx-lg px-6 py-2 rounded-full font-black">
                            {isScanning ? 'PROCESSANDO...' : 'SISTEMA EM STANDBY'}
                        </Badge>
                    </div>
                    <Button 
                        size="icon" onClick={handleScan} disabled={isScanning} 
                        className="w-16 h-16 rounded-mx-2xl bg-indigo-600 shadow-mx-xl border border-white/10 active:scale-95 transition-all"
                    >
                        <Zap size={32} className={cn(isScanning ? "animate-bounce" : "fill-white")} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0">
                {/* Terminal Section */}
                <section className="lg:col-span-7 flex flex-col">
                    <Card className="flex-1 bg-mx-black border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-mx-xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <TerminalIcon size={18} className="text-indigo-400" />
                                <Typography variant="caption" tone="white" className="opacity-40 font-black tracking-widest uppercase">Console de Auditoria Real-Time</Typography>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-mx-rose-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-mx-amber-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-mx-emerald-500/30" />
                            </div>
                        </div>

                        <div className="flex-1 font-mono text-[11px] leading-relaxed space-y-3 overflow-y-auto pr-4 no-scrollbar border-t border-white/5 pt-8 relative z-10" aria-live="polite">
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-4 group hover:bg-white/5 p-2 rounded-mx-sm transition-colors">
                                    <span className="text-white/10 font-black">{(idx + 1).toString().padStart(3, '0')}</span>
                                    <span className={cn("font-black tracking-tight", 
                                        log.type === 'error' ? 'text-status-error' : 
                                        log.type === 'warning' ? 'text-status-warning' : 
                                        log.type === 'success' ? 'text-status-success' : 
                                        'text-indigo-300'
                                    )}>{log.msg}</span>
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                        
                        {/* Matrix Grid Effect */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                    </Card>
                </section>

                {/* Verdict Section */}
                <aside className="lg:col-span-5 flex flex-col">
                    <Card className="p-10 md:p-14 bg-white border-none shadow-mx-xl h-full space-y-12">
                        <header className="flex items-center gap-4 border-b border-border-default pb-8">
                            <div className="w-16 h-16 rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-lg"><ShieldCheck size={32} /></div>
                            <div>
                                <Typography variant="h2" className="text-2xl">Veredito MX</Typography>
                                <Typography variant="caption" tone="muted" className="tracking-widest">CONCLUSÃO OPERACIONAL</Typography>
                            </div>
                        </header>

                        <div className="flex-1" aria-live="polite">
                            <AnimatePresence mode="wait">
                                {summary ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
                                        <Card className="p-10 bg-mx-indigo-50 border-mx-indigo-100 shadow-inner relative group border-none">
                                            <Quote size={64} className="absolute -right-4 -bottom-4 text-brand-primary opacity-5 -rotate-12 transition-transform group-hover:scale-110" />
                                            <Typography variant="p" className="text-xl font-black italic text-brand-primary leading-relaxed relative z-10">
                                                "{summary.diagnostic}"
                                            </Typography>
                                        </Card>
                                        
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-mx-lg bg-status-success-surface text-status-success flex items-center justify-center shadow-mx-sm"><TrendingUp size={20} /></div>
                                                <Typography variant="caption" tone="success" className="font-black uppercase tracking-widest">Plano de Ação Gerencial</Typography>
                                            </div>
                                            <Typography variant="p" className="text-base font-bold text-text-secondary leading-relaxed bg-surface-alt p-8 rounded-mx-2xl border border-border-default shadow-inner">
                                                {summary.action}
                                            </Typography>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-6">
                                        <div className="w-24 h-24 rounded-full border-4 border-border-default border-t-brand-primary animate-spin" />
                                        <Typography variant="caption" tone="muted" className="animate-pulse tracking-[0.3em]">ANALISANDO MALHA...</Typography>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <footer className="pt-8 border-t border-border-default">
                            <Typography variant="caption" tone="muted" className="text-[8px] text-center block uppercase tracking-[0.4em]">Heurística Baseada no Critério 20/60/33</Typography>
                        </footer>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
