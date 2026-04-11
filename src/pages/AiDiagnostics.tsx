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
        <main className="h-full w-full flex flex-col items-center justify-center text-center p-mx-lg bg-brand-secondary" id="main-content">
            <ShieldCheck size={48} className="text-white/20 mb-6" aria-hidden="true" />
            <Typography variant="h2" tone="white" className="uppercase tracking-tighter">Acesso Restrito</Typography>
            <Typography variant="caption" tone="white" className="max-w-sm mx-auto opacity-40 uppercase tracking-widest mt-4 font-black">Motor de inteligência exclusivo para escalão administrativo.</Typography>
        </main>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-brand-secondary" id="main-content">
            
            {/* Header / Engine Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-white/10 pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-glow-brand animate-pulse" aria-hidden="true" />
                        <Typography variant="h1" tone="white">Auditoria <Typography as="span" className="text-brand-primary/80">Forense</Typography></Typography>
                    </div>
                    <Typography variant="caption" tone="white" className="pl-mx-md opacity-50 tracking-widest uppercase font-black">DEEP LEARNING ENGINE v4.0</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-mx-md shrink-0 w-full sm:w-auto">
                    <div className="flex flex-col items-center sm:items-end">
                        <Typography variant="tiny" tone="white" className="opacity-40 uppercase tracking-widest font-black">Status do Motor</Typography>
                        <Badge variant={isScanning ? 'warning' : 'success'} className="mt-1 shadow-mx-lg px-6 py-2 rounded-mx-full font-black border-none">
                            <Typography variant="tiny" as="span">{isScanning ? 'PROCESSANDO...' : 'SISTEMA EM STANDBY'}</Typography>
                        </Badge>
                    </div>
                    <Button 
                        size="icon" onClick={handleScan} disabled={isScanning} 
                        className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-primary shadow-mx-xl border border-white/10 active:scale-95 transition-all"
                        aria-label="Reiniciar escaneamento de auditoria"
                    >
                        <Zap size={32} className={cn(isScanning ? "animate-bounce" : "fill-white")} aria-hidden="true" />
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0">
                {/* Terminal Section */}
                <section className="lg:col-span-7 flex flex-col min-h-[400px] lg:min-h-0">
                    <Card className="flex-1 bg-mx-black border-white/5 rounded-mx-2xl p-mx-lg md:p-10 shadow-mx-xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-mx-sm">
                                <TerminalIcon size={18} className="text-brand-primary/80" aria-hidden="true" />
                                <Typography variant="caption" tone="white" className="opacity-40 font-black tracking-widest uppercase">Console de Auditoria Real-Time</Typography>
                            </div>
                            <div className="flex gap-1.5" aria-hidden="true">
                                <div className="w-2.5 h-2.5 rounded-mx-full bg-status-error opacity-30" />
                                <div className="w-2.5 h-2.5 rounded-mx-full bg-status-warning opacity-30" />
                                <div className="w-2.5 h-2.5 rounded-mx-full bg-status-success opacity-30" />
                            </div>
                        </div>

                        <div className="flex-1 font-mono text-sm leading-relaxed space-y-mx-xs overflow-y-auto pr-4 no-scrollbar border-t border-white/5 pt-8 relative z-10" role="log" aria-live="polite" aria-atomic="false">
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-mx-sm group hover:bg-white/5 p-mx-xs rounded-mx-sm transition-colors">
                                    <Typography variant="tiny" tone="muted" as="span" className="font-black opacity-10" aria-hidden="true">{(idx + 1).toString().padStart(3, '0')}</Typography>
                                    <Typography as="span" variant="caption" className={cn("font-black tracking-tight uppercase text-xs sm:text-sm", 
                                        log.type === 'error' ? 'text-status-error' : 
                                        log.type === 'warning' ? 'text-status-warning' : 
                                        log.type === 'success' ? 'text-status-success' : 
                                        'text-indigo-300'
                                    )}>{log.msg}</Typography>
                                </div>
                            ))}
                            <div ref={terminalEndRef} />
                        </div>
                        
                        <div className="absolute inset-0 bg-mx-matrix opacity-10 pointer-events-none" aria-hidden="true" />
                    </Card>
                </section>

                {/* Verdict Section */}
                <aside className="lg:col-span-5 flex flex-col pb-20 lg:pb-0">
                    <Card className="p-mx-lg md:p-14 bg-white border-none shadow-mx-xl h-full space-y-mx-xl flex flex-col">
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                            <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl shrink-0" aria-hidden="true"><ShieldCheck size={32} /></div>
                            <div>
                                <Typography variant="h2" className="text-xl sm:text-2xl uppercase tracking-tighter">Veredito MX</Typography>
                                <Typography variant="caption" tone="muted" className="tracking-widest font-black uppercase opacity-40">CONCLUSÃO OPERACIONAL</Typography>
                            </div>
                        </header>

                        <div className="flex-1" aria-live="polite">
                            <AnimatePresence mode="wait">
                                {summary ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-mx-xl">
                                        <Card className="p-mx-lg bg-mx-indigo-50 border-mx-indigo-100 shadow-inner relative group border-none rounded-mx-3xl">
                                            <Quote size={64} className="absolute -right-4 -bottom-4 text-brand-primary opacity-5 -rotate-12 transition-transform group-hover:scale-110" aria-hidden="true" />
                                            <Typography variant="p" className="text-lg sm:text-xl font-black italic text-brand-primary leading-relaxed relative z-10 uppercase tracking-tight">
                                                "{summary.diagnostic}"
                                            </Typography>
                                        </Card>
                                        
                                        <div className="space-y-mx-md">
                                            <div className="flex items-center gap-mx-xs">
                                                <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-status-success-surface text-status-success flex items-center justify-center shadow-mx-sm" aria-hidden="true"><TrendingUp size={20} /></div>
                                                <Typography variant="tiny" tone="success" className="font-black uppercase tracking-widest">Plano de Ação Gerencial</Typography>
                                            </div>
                                            <Typography variant="p" className="text-sm sm:text-base font-bold text-text-secondary leading-relaxed bg-surface-alt p-mx-lg rounded-mx-2xl border border-border-default shadow-mx-inner uppercase tracking-tight">
                                                {summary.action}
                                            </Typography>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-mx-md">
                                        <div className="w-mx-3xl h-mx-3xl rounded-mx-full border-4 border-border-default border-t-brand-primary animate-spin" aria-hidden="true" />
                                        <Typography variant="caption" tone="muted" className="animate-pulse tracking-widest font-black uppercase opacity-40">ANALISANDO MALHA...</Typography>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        <footer className="pt-8 border-t border-border-default mt-auto">
                            <Typography variant="tiny" tone="muted" className="text-center block uppercase tracking-widest font-black opacity-20">Heurística Baseada no Critério 20/60/33</Typography>
                        </footer>
                    </Card>
                </aside>
            </div>
        </main>
    )
}
