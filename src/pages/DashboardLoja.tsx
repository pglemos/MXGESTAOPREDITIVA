import { useCheckins } from '@/hooks/useCheckins'
import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useRanking } from '@/hooks/useRanking'
import { useAuth } from '@/hooks/useAuth'
import { 
    calcularAtingimento, calcularProjecao, calcularFaltaX, getDiasInfo, somarVendas, somarVendasPorCanal, calcularFunil 
} from '@/lib/calculations'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Activity, ArrowUpRight, BarChart3, Car, Calendar, CheckCircle, ChevronRight, Clock, Globe, Target, TrendingUp, Users, RefreshCw
} from 'lucide-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StatProps {
    icon: any; label: string; value: string | number; sub?: string; bg: string; color: string; trend?: string; delay?: number
}

const Stat = ({ icon: Icon, label, value, sub, bg, color, trend, delay = 0 }: StatProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
        className="mx-card p-mx-lg flex flex-col justify-between hover:shadow-mx-lg transition-all group relative overflow-hidden"
    >
        <div className={cn("absolute -right-8 -top-8 w-32 h-32 opacity-5 rounded-full blur-3xl transition-all z-0", bg)} />
        <div className="flex items-start justify-between mb-mx-md relative z-10">
            <div className={cn("w-12 h-12 rounded-mx-lg flex items-center justify-center border border-border-default shadow-sm group-hover:scale-110 transition-transform", bg, color)}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            {trend && (
                <Badge className="bg-status-success-surface text-status-success border-none text-[8px] px-2 h-6 uppercase font-black tracking-widest">{trend}</Badge>
            )}
        </div>
        <div className="relative z-10">
            <p className="mx-text-caption mb-1 !text-[10px] uppercase tracking-[0.2em] text-text-secondary font-black">{label}</p>
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-text-primary tracking-tighter leading-none font-mono-numbers">{value}</p>
                {sub && <span className="text-[10px] font-black text-text-tertiary bg-mx-slate-50 px-2 py-0.5 rounded uppercase tracking-widest">{sub}</span>}
            </div>
        </div>
    </motion.div>
)

export default function DashboardLoja() {
    const { membership, memberships, role, setActiveStoreId } = useAuth()
    const [searchParams] = useSearchParams()
    const { checkins, loading, fetchCheckins: refetchCheckins } = useCheckins()
    const { storeGoal, fetchGoals: refetchGoals } = useGoals()
    const { sellers, refetch: refetchTeam } = useTeam()
    const { ranking, refetch: refetchRanking } = useRanking()
    const [isRefetching, setIsRefetching] = useState(false)

    useEffect(() => {
        const storeIdParam = searchParams.get('id')
        if (!storeIdParam) return
        if (role === 'admin' || memberships.some(m => m.store_id === storeIdParam)) {
            setActiveStoreId(storeIdParam)
        }
    }, [memberships, role, searchParams, setActiveStoreId])

    const metrics = useMemo(() => {
        const meta = storeGoal?.target || 0
        const vendasMes = somarVendas(checkins)
        const porCanal = somarVendasPorCanal(checkins)
        const atingimento = calcularAtingimento(vendasMes, meta)
        const dias = getDiasInfo()
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        const checkedInCount = (sellers || []).filter(s => s.checkin_today).length
        const funil = calcularFunil(checkins)
        return { meta, vendasMes, porCanal, atingimento, projecao, faltaX, checkedInCount, funil, storeName: membership?.store?.name || 'UNIDADE' }
    }, [checkins, storeGoal, sellers, membership])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), refetchTeam(), refetchRanking?.() || Promise.resolve()])
            toast.success('Performance sincronizada!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, refetchTeam, refetchRanking])

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-brand-primary" /></div>

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            {/* Header Area - Aligned */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div>
                    <span className="mx-text-caption text-brand-primary mb-2 block font-black tracking-[0.3em]">UNIT MONITORING</span>
                    <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tighter uppercase leading-none">{metrics.storeName}</h1>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={handleRefresh} disabled={isRefetching} className="w-14 h-14 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-brand-primary transition-all">
                        <RefreshCw size={24} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button className="mx-button-primary bg-brand-secondary h-14 px-10">RELATÓRIOS</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Stat icon={Target} label="Meta Oficial" value={metrics.meta} sub={`${metrics.atingimento}% Atingido`} bg="bg-mx-indigo-50" color="text-mx-indigo-600" trend="ALVO" delay={0.1} />
                <Stat icon={Car} label="Acumulado (Vendido)" value={metrics.vendasMes} sub={`Faltam ${metrics.faltaX}`} bg="bg-status-success-surface" color="text-status-success" trend="REALIZADO" delay={0.2} />
                <Stat icon={TrendingUp} label="Projeção" value={metrics.projecao} bg="bg-status-info-surface" color="text-status-info" sub={metrics.projecao >= metrics.meta ? 'Ritmo Saudável' : 'Ritmo Abaixo'} trend="ESTIMADO" delay={0.3} />
                <Stat icon={Users} label="Check-ins" value={`${metrics.checkedInCount}/${(sellers || []).length}`} bg="bg-status-warning-surface" color="text-status-warning" sub={`${(sellers || []).length - metrics.checkedInCount} Sem Registro`} trend="OPERAÇÃO" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-2xl">
                <div className="lg:col-span-8 flex flex-col gap-mx-lg">
                    {/* Canal Analysis - Unified Shapes */}
                    <div className="mx-card overflow-hidden border-none shadow-mx-lg rounded-[2.5rem]">
                        <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-mx-slate-50/30">
                            <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1 uppercase">Canais de Conversão</h3><p className="mx-text-caption !text-[9px] text-text-secondary font-black">Mix Operacional do Ciclo</p></div>
                            <BarChart3 size={24} className="text-text-tertiary" />
                        </div>
                        <div className="p-mx-lg grid grid-cols-1 sm:grid-cols-3 gap-mx-lg">
                            {[
                                { label: 'Showroom', value: metrics.porCanal.porta, icon: Car, color: 'text-status-success', bg: 'bg-status-success-surface', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, color: 'text-status-info', bg: 'bg-status-info-surface', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, color: 'text-brand-primary', bg: 'bg-brand-primary-surface', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={cn("rounded-mx-3xl p-mx-lg transition-all hover:shadow-mx-md group/item border border-border-subtle bg-white")}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={cn("w-10 h-10 rounded-mx-lg flex items-center justify-center shadow-inner", ch.bg, ch.color)}><ch.icon size={20} strokeWidth={2.5} /></div>
                                        <Badge variant="outline" className={cn("text-[9px] font-black border-none px-2 h-6", ch.bg, ch.color)}>{ch.pct}%</Badge>
                                    </div>
                                    <p className="text-4xl font-black text-text-primary tracking-tighter font-mono-numbers leading-none mb-2">{ch.value}</p>
                                    <p className="mx-text-caption !text-[9px] uppercase tracking-widest text-text-secondary font-black">{ch.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Elite Team Table - Validated */}
                    <Card className="border-none shadow-mx-lg rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="flex-row items-center justify-between p-mx-lg bg-mx-slate-50/30 border-b border-border-subtle">
                            <div><CardTitle className="text-xl font-black uppercase tracking-tight">Grade de Performance</CardTitle><CardDescription className="font-bold text-text-tertiary">Ranking individual da tropa local.</CardDescription></div>
                            <Link to="/equipe" className="mx-button-primary !h-10 !px-6 text-[10px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15">Ver Time</Link>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-mx-slate-50/50 border-b border-border-default">
                                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">
                                        <th className="px-mx-xl py-mx-md w-16 text-center">#</th>
                                        <th className="py-mx-md">Vendedor</th>
                                        <th className="py-mx-md text-center">Status</th>
                                        <th className="py-mx-md text-center">Vendas</th>
                                        <th className="px-mx-xl py-mx-md text-right">Eficiência</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {(ranking || []).slice(0, 5).map((r, i) => {
                                        const seller = sellers?.find(s => s.id === r.user_id)
                                        const isCheckedIn = seller?.checkin_today
                                        return (
                                        <tr key={r.user_id} className="hover:bg-mx-slate-50/30 transition-colors h-20 group">
                                            <td className="px-mx-xl py-4 text-center font-black text-xs text-text-tertiary">{(i + 1).toString().padStart(2, '0')}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-mx-md">
                                                    <div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all uppercase">{r.user_name?.charAt(0)}</div>
                                                    <p className="font-black text-sm text-text-primary uppercase tracking-tight">{r.user_name}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center">
                                                <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest uppercase border-none", isCheckedIn ? "bg-status-success-surface text-status-success" : "bg-status-error-surface text-status-error")}>
                                                    {isCheckedIn ? 'Registrado' : 'Sem Registro'}
                                                </Badge>
                                            </td>
                                            <td className="py-4 text-center font-black text-lg font-mono-numbers text-text-primary">{r.vnd_total}</td>
                                            <td className="px-mx-xl py-4 text-right">
                                                <span className={cn("font-mono-numbers font-black text-base", r.atingimento >= 100 ? 'text-status-success' : 'text-status-warning')}>{r.atingimento}%</span>
                                            </td>
                                        </tr>
                                    )})}
                                    {(ranking || []).length === 0 && <tr><td colSpan={5} className="py-20 text-center mx-text-caption uppercase text-text-secondary font-black">Aguardando dados de performance...</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-mx-lg">
                    {/* Quick Funnel - Fixed Align */}
                    <div className="mx-card p-mx-lg md:p-mx-xl group relative overflow-hidden h-full flex flex-col justify-between">
                        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-mx-slate-50 opacity-50 rounded-full blur-[80px] pointer-events-none" />
                        <div>
                            <h3 className="text-xl font-black text-text-primary tracking-tight mb-mx-xl relative z-10 uppercase">Fluxo Ativo</h3>
                            <div className="space-y-mx-xl relative z-10">
                                {[
                                    { label: 'Leads (D-1)', value: metrics.funil.leads, pct: 100, color: 'bg-brand-primary' },
                                    { label: 'Agendamentos (D-1)', value: metrics.funil.agd_total, pct: metrics.funil.tx_lead_agd, color: 'bg-mx-indigo-600' },
                                    { label: 'Visitas (D-1)', value: metrics.funil.visitas, pct: metrics.funil.tx_agd_visita, color: 'bg-status-warning' },
                                    { label: 'Vendas (D-1)', value: metrics.funil.vnd_total, pct: metrics.funil.tx_visita_vnd, color: 'bg-status-success' },
                                ].map((step, i) => (
                                    <div key={step.label} className="space-y-3 group/step">
                                        <div className="flex justify-between items-end">
                                            <span className="mx-text-caption !text-[10px] font-black uppercase text-text-secondary">{step.label}</span>
                                            <span className="text-4xl font-black text-text-primary tracking-tighter font-mono-numbers leading-none">{step.value}</span>
                                        </div>
                                        <div className="h-2 bg-mx-slate-50 rounded-full overflow-hidden border border-border-subtle p-px shadow-inner relative">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${step.pct}%` }} transition={{ duration: 1.5, delay: i * 0.1 }} className={cn("h-full rounded-full shadow-sm", step.color)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-mx-xl relative z-10 border-t border-border-subtle mt-mx-xl">
                            <p className="text-[10px] font-bold text-text-secondary uppercase leading-relaxed italic font-black">"Otimize o tempo de visita para aumentar a taxa de fechamento em 12%."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
