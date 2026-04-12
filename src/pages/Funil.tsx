import { useCheckins } from '@/hooks/useCheckins'
import { useTeam } from '@/hooks/useTeam'
import { calcularFunil, gerarDiagnosticoMX } from '@/lib/calculations'
import { useAuth } from '@/hooks/useAuth'
import { useState, useMemo, useCallback } from 'react'
import { 
    Search, RefreshCw, Zap, TrendingUp, 
    Target, AlertTriangle, ArrowRight,
    Users, Globe, Eye, History, LayoutDashboard, Calendar, Car,
    ChevronDown, User
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Badge } from '@/components/atoms/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'

export default function Funil() {
    const { checkins, loading, fetchCheckins } = useCheckins()
    const { sellers } = useTeam()
    const [isRefetching, setIsRefetching] = useState(false)
    const [activeTab, setActiveTab] = useState<'general' | 'seller'>('general')
    const [selectedSellerId, setSelectedSellerId] = useState('')

    const filteredCheckins = useMemo(() => {
        if (activeTab === 'seller' && selectedSellerId) {
            return checkins.filter(c => c.seller_user_id === selectedSellerId)
        }
        return checkins
    }, [checkins, activeTab, selectedSellerId])

    const funilData = useMemo(() => calcularFunil(filteredCheckins), [filteredCheckins])
    const diagnostico = useMemo(() => gerarDiagnosticoMX(funilData), [funilData])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await fetchCheckins(); setIsRefetching(false)
        toast.success('Funil sincronizado!')
    }, [fetchCheckins])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Escoamento...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Funnel Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Funil de <span className="text-brand-primary">Vendas</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">ANÁLISE DE CONVERSÃO & ESCOAMENTO MX</Typography>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-mx-xl shadow-mx-sm h-mx-xl w-mx-xl">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>
                    <div className="bg-white p-mx-tiny rounded-mx-full border border-border-default shadow-mx-sm flex gap-mx-tiny">
                        <Button 
                            variant={activeTab === 'general' ? 'secondary' : 'ghost'} size="sm" 
                            onClick={() => setActiveTab('general')}
                            className="h-mx-10 rounded-mx-full px-6 font-black uppercase shadow-sm"
                            >
                            <Typography variant="tiny" as="span" className="font-black">Visão Geral</Typography>
                            </Button>
                            <Button
                            variant={activeTab === 'seller' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('seller')}
                            className="h-mx-10 rounded-mx-full px-6 font-black uppercase"
                            >
                            <Typography variant="tiny" as="span" className="font-black">Por Vendedor</Typography>
                            </Button>                    </div>
                </div>
            </header>

            <AnimatePresence>
                {activeTab === 'seller' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="shrink-0 mb-4">
                        <div className="flex items-center gap-mx-sm bg-white p-mx-sm rounded-mx-3xl border border-border-default shadow-mx-sm">
                            <div className="w-mx-10 h-mx-10 rounded-mx-full bg-mx-indigo-50 flex items-center justify-center text-brand-primary"><User size={18} /></div>
                            <div className="flex-1 relative group">
                                <select 
                                    value={selectedSellerId}
                                    onChange={(e) => setSelectedSellerId(e.target.value)}
                                    className="w-full h-mx-xl px-6 bg-surface-alt border border-border-default rounded-mx-2xl text-xs font-black uppercase focus:border-brand-primary transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione um especialista...</option>
                                    {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Diagnostics Section */}

            {/* AI Diagnostics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0">
                <Card className="lg:col-span-8 bg-brand-secondary text-white p-mx-10 md:p-14 shadow-mx-xl relative overflow-hidden border-none group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-card-md h-full bg-gradient-to-l from-white/5 via-transparent to-transparent pointer-events-none" aria-hidden="true" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-mx-10">
                        <div className="w-mx-20 h-mx-header rounded-mx-3xl bg-white text-brand-primary flex items-center justify-center shadow-mx-xl group-hover:rotate-12 transition-transform shrink-0" aria-hidden="true">
                            <Zap size={40} className="fill-current" />
                        </div>
                        <div className="space-y-mx-sm flex-1">
                            <Badge variant="outline" className="text-white border-white/20 px-4 py-1 uppercase font-black">Diagnóstico Inteligente</Badge>
                            <Typography variant="h2" tone="white" className="text-2xl md:text-3xl italic leading-relaxed">"{diagnostico.diagnostico}"</Typography>
                            <div className="flex items-center gap-mx-xs pt-4 border-t border-white/10">
                                <TrendingUp size={20} className="text-brand-primary/80" aria-hidden="true" />
                                <Typography variant="p" tone="white" className="text-sm font-black opacity-80 uppercase tracking-tight">{diagnostico.sugestao}</Typography>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-4 p-mx-10 md:p-14 flex flex-col justify-between border-none shadow-mx-lg bg-white relative overflow-hidden group">
                    <div className="absolute top-mx-0 right-mx-0 w-mx-4xl h-mx-4xl bg-status-success-surface rounded-mx-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <div className="space-y-mx-xs relative z-10">
                        <Typography variant="caption" tone="muted" className="uppercase font-black tracking-mx-wide">Eficiência Global</Typography>
                        <div className="flex items-baseline gap-mx-xs">
                            <Typography variant="h1" className="text-6xl tabular-nums leading-none">{funilData.tx_visita_vnd}</Typography>
                            <Typography variant="h3" tone="muted" className="text-2xl font-black">%</Typography>
                        </div>
                    </div>
                    <div className="pt-10 border-t border-border-default mt-10 relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <Typography variant="caption" className="font-black uppercase">Meta de Conversão</Typography>
                            <Typography variant="mono" tone="brand" className="text-sm font-black">33%</Typography>
                        </div>
                        <div className="h-2.5 w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-0.5">
                            <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${Math.min(funilData.tx_visita_vnd, 100)}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                                className={cn("h-full rounded-mx-full shadow-mx-sm transition-all duration-1000", funilData.tx_visita_vnd >= 33 ? "bg-status-success shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-status-error")} 
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Matrix Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                {[
                    { label: 'Leads Novos', value: funilData.leads, icon: Users, tone: 'brand' },
                    { label: 'Agendamentos', value: funilData.agd_total, icon: Calendar, tone: 'info' },
                    { label: 'Visitas Loja', value: funilData.visitas, icon: Eye, tone: 'warning' },
                    { label: 'Vendas Totais', value: funilData.vnd_total, icon: Car, tone: 'success' },
                ].map(item => (
                    <Card key={item.label} className="p-4 md:p-mx-lg border-none shadow-mx-sm group hover:shadow-mx-lg transition-all bg-white relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={cn("w-mx-14 h-mx-14 rounded-mx-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", 
                                item.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                item.tone === 'info' ? 'bg-status-info-surface border-status-info/20 text-status-info' :
                                item.tone === 'warning' ? 'bg-status-warning-surface border-mx-amber-100 text-status-warning' :
                                'bg-status-success-surface border-mx-emerald-100 text-status-success'
                            )} aria-hidden="true">
                                <item.icon size={24} strokeWidth={2} />
                            </div>
                            <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest">{item.label}</Typography>
                        </div>
                        <Typography variant="h1" className="text-5xl tabular-nums leading-none relative z-10">{item.value}</Typography>
                    </Card>
                ))}
            </div>

            {/* Funnel Visualization */}
            <Card className="w-full mb-32 border-none shadow-mx-lg bg-white overflow-hidden group">
                <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-10">
                    <CardTitle className="text-2xl uppercase">Fluxo de Escoamento</CardTitle>
                    <CardDescription className="uppercase tracking-widest font-black mt-1 opacity-60">TAXAS DE CONVERSÃO ENTRE ETAPAS CRÍTICAS</CardDescription>
                </CardHeader>
                <CardContent className="p-mx-10 md:p-14">
                    <div className="flex flex-col gap-mx-14">
                        {[
                            { from: 'Leads', to: 'Agendamentos', val: funilData.tx_lead_agd, bench: 20, tone: 'brand' },
                            { from: 'Agendamentos', to: 'Visitas', val: funilData.tx_agd_visita, bench: 60, tone: 'warning' },
                            { from: 'Visitas', to: 'Vendas', val: funilData.tx_visita_vnd, bench: 33, tone: 'success' },
                        ].map((step, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row items-center gap-mx-14 relative">
                                <div className="flex-1 w-full space-y-mx-md">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-mx-sm">
                                            <div className="w-mx-10 h-mx-10 rounded-mx-lg bg-surface-alt flex items-center justify-center font-black text-text-tertiary text-xs border border-border-default shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all">0{idx+1}</div>
                                            <Typography variant="h3" className="text-lg uppercase tracking-tight">{step.from} <ArrowRight size={14} className="inline mx-2 opacity-30" /> {step.to}</Typography>
                                        </div>
                                        <div className="flex items-baseline gap-mx-xs">
                                            <Typography variant="h1" className="text-4xl tabular-nums" tone={step.val >= step.bench ? 'success' : 'error'}>{step.val}%</Typography>
                                            <Typography variant="caption" tone="muted" className="font-black">BENCH: {step.bench}%</Typography>
                                        </div>
                                    </div>
                                    <div className="h-mx-sm w-full bg-surface-alt rounded-mx-full overflow-hidden border border-border-default shadow-inner p-mx-tiny">
                                        <motion.div 
                                            initial={{ width: 0 }} animate={{ width: `${Math.min(step.val, 100)}%` }} transition={{ duration: 1.5, delay: idx * 0.2, ease: "circOut" }}
                                            className={cn("h-full rounded-mx-full shadow-mx-sm transition-all duration-1000", 
                                                step.val >= step.bench ? 
                                                (step.tone === 'brand' ? 'bg-brand-primary shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-status-success shadow-[0_0_15px_rgba(16,185,129,0.5)]') : 
                                                'bg-status-error shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                            )} 
                                        />
                                    </div>
                                </div>
                                {idx < 2 && <div className="hidden md:flex flex-col items-center gap-mx-xs opacity-20"><ArrowRight size={40} strokeWidth={2} /></div>}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
