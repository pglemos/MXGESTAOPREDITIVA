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
    AlertTriangle, ArrowUpRight, BarChart3, Car, Calendar, CheckCircle, ChevronRight, Clock, Download, Eye, Filter, Globe, MoreHorizontal, Phone, Share2, Sparkles, Target, TrendingUp, Users, RefreshCw
} from 'lucide-react'
import { useMemo, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StatProps {
    icon: any; label: string; value: string | number; sub?: string; bg: string; color: string; trend?: string; delay?: number
}

const Stat = ({ icon: Icon, label, value, sub, bg, color, trend, delay = 0 }: StatProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="mx-card p-mx-lg flex flex-col justify-between mx-card-hover group relative overflow-hidden"
    >
        <div className={cn("absolute -right-8 -top-8 w-32 h-32 opacity-5 rounded-full blur-3xl transition-all z-0", bg)} />
        <div className="flex items-start justify-between mb-mx-lg relative z-10">
            <div className={cn("w-14 h-14 rounded-mx-lg flex items-center justify-center border border-border-default shadow-mx-sm group-hover:scale-110 transition-transform", bg, color)}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
            {trend && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-status-success bg-status-success-surface px-mx-sm py-1.5 rounded-full border border-mx-emerald-100 uppercase tracking-widest">
                    <ArrowUpRight size={14} strokeWidth={3} /> {trend}
                </div>
            )}
        </div>
        <div className="relative z-10">
            <p className="mx-text-caption mb-2 pl-0.5">{label}</p>
            <div className="flex items-baseline gap-mx-xs">
                <p className="text-4xl font-black text-text-primary tracking-tighter">{value}</p>
                {sub && <span className="text-[10px] font-black bg-mx-slate-50 text-text-tertiary border border-border-default px-2 py-1 rounded-mx-sm uppercase tracking-widest truncate">{sub}</span>}
            </div>
        </div>
    </motion.div>
)

export default function DashboardLoja() {
    const { membership } = useAuth()
    const { checkins, loading, refetch: refetchCheckins } = useCheckins()
    const { storeGoal, refetch: refetchGoals } = useGoals()
    const { sellers, refetch: refetchTeam } = useTeam()
    const { ranking, refetch: refetchRanking } = useRanking()
    const [isRefetching, setIsRefetching] = useState(false)

    const metrics = useMemo(() => {
        const meta = storeGoal?.target || 0
        const vendasMes = somarVendas(checkins)
        const porCanal = somarVendasPorCanal(checkins)
        const atingimento = calcularAtingimento(vendasMes, meta)
        const dias = getDiasInfo()
        const projecao = calcularProjecao(vendasMes, dias.decorridos, dias.total)
        const faltaX = calcularFaltaX(meta, vendasMes)
        const checkedInCount = sellers.filter(s => s.checkin_today).length
        return { meta, vendasMes, porCanal, atingimento, projecao, faltaX, checkedInCount, storeName: membership?.store?.name || 'Unidade' }
    }, [checkins, storeGoal, sellers, membership])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        try {
            await Promise.all([refetchCheckins(), refetchGoals(), refetchTeam(), refetchRanking?.() || Promise.resolve()])
            toast.success('Performance sincronizada!')
        } finally { setIsRefetching(false) }
    }, [refetchCheckins, refetchGoals, refetchTeam, refetchRanking])

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse uppercase">Escaneando Unit Intelligence...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">{metrics.storeName}</h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60">Monitoramento de Performance de Unidade</p>
                </div>

                <div className="flex items-center gap-mx-sm shrink-0">
                    <button onClick={handleRefresh} disabled={isRefetching} className="w-12 h-12 rounded-mx-lg bg-white border border-border-default shadow-mx-sm flex items-center justify-center text-text-tertiary hover:text-text-primary transition-all">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <button className="mx-button-primary bg-brand-secondary">Relatórios</button>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-mx-lg shrink-0">
                <Stat icon={Target} label="Meta Mensal" value={metrics.meta} sub={`${metrics.atingimento}%`} bg="bg-mx-indigo-50" color="text-mx-indigo-600" trend="Tracking" delay={0.1} />
                <Stat icon={Car} label="Fechamentos" value={metrics.vendasMes} sub={`Faltam ${metrics.faltaX}`} bg="bg-status-success-surface" color="text-status-success" delay={0.2} />
                <Stat icon={TrendingUp} label="Projeção IA" value={metrics.projecao} bg="bg-status-info-surface" color="text-status-info" sub="Predictive" delay={0.3} />
                <Stat icon={Users} label="Check-in Team" value={`${metrics.checkedInCount}/${sellers.length}`} bg="bg-status-warning-surface" color="text-status-warning" sub="Online" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                <div className="lg:col-span-8 flex flex-col gap-mx-lg">
                    {/* Canal Analysis */}
                    <div className="mx-card overflow-hidden group">
                        <div className="p-mx-lg border-b border-border-subtle flex items-center justify-between bg-mx-slate-50/30">
                            <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Canais de Conversão</h3><p className="mx-text-caption">Mix Operacional</p></div>
                            <BarChart3 size={24} className="text-text-tertiary" />
                        </div>
                        <div className="p-mx-lg grid grid-cols-1 sm:grid-cols-3 gap-mx-md">
                            {[
                                { label: 'Showroom', value: metrics.porCanal.porta, icon: Car, color: 'text-status-success', bg: 'bg-status-success-surface border-mx-emerald-100', pct: Math.round((metrics.porCanal.porta / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Carteira', value: metrics.porCanal.carteira, icon: Users, color: 'text-status-info', bg: 'bg-status-info-surface border-mx-indigo-100', pct: Math.round((metrics.porCanal.carteira / (metrics.vendasMes || 1)) * 100) },
                                { label: 'Digital', value: metrics.porCanal.internet, icon: Globe, color: 'text-brand-primary', bg: 'bg-brand-primary-surface border-mx-indigo-100', pct: Math.round((metrics.porCanal.internet / (metrics.vendasMes || 1)) * 100) },
                            ].map(ch => (
                                <div key={ch.label} className={cn(ch.bg, "border rounded-mx-xl p-mx-md transition-all hover:shadow-mx-lg hover:-translate-y-1 group/item")}>
                                    <div className="flex justify-between items-start mb-mx-md">
                                        <div className="w-10 h-10 rounded-mx-md bg-white flex items-center justify-center shadow-mx-sm border border-border-subtle group-hover/item:rotate-6 transition-transform">
                                            <ch.icon size={20} className={ch.color} strokeWidth={2.5} />
                                        </div>
                                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/80 border", ch.color)}>{ch.pct}%</span>
                                    </div>
                                    <p className="text-4xl font-black text-text-primary tracking-tighter font-mono-numbers mb-1">{ch.value}</p>
                                    <p className="mx-text-caption opacity-80">{ch.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Elite Team Table */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div><CardDescription>Especialistas da Unidade</CardDescription><CardTitle>Grade de Performance</CardTitle></div>
                            <Link to="/equipe"><button className="mx-button-primary !h-10 !px-6">Ver Time</button></Link>
                        </CardHeader>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="bg-mx-slate-50/50 mx-text-caption border-b border-border-default">
                                        <th className="pl-mx-lg py-mx-md w-16 text-center">#</th>
                                        <th className="py-mx-md">Consultor</th>
                                        <th className="py-mx-md text-center">Vendas</th>
                                        <th className="pr-mx-lg py-mx-md text-right">Eficiência</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {ranking.slice(0, 5).map((r, i) => (
                                        <tr key={r.user_id} className="hover:bg-mx-slate-50/50 transition-colors group">
                                            <td className="pl-mx-lg py-mx-md">
                                                <div className="w-8 h-8 rounded-mx-sm bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-xs text-text-tertiary mx-auto">{i + 1}</div>
                                            </td>
                                            <td className="py-mx-md">
                                                <div className="flex items-center gap-mx-sm">
                                                    <div className="w-10 h-10 rounded-mx-md bg-mx-slate-50 border border-border-default flex items-center justify-center font-black text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all uppercase">{r.user_name?.charAt(0)}</div>
                                                    <div><p className="font-black text-sm text-text-primary leading-none mb-1">{r.user_name}</p><p className="mx-text-caption !text-[8px] opacity-60 uppercase">Elite Member</p></div>
                                                </div>
                                            </td>
                                            <td className="py-mx-md text-center font-black text-sm">{r.vnd_total}</td>
                                            <td className="pr-mx-lg py-mx-md text-right">
                                                <span className={cn("font-mono-numbers font-black text-sm", r.atingimento >= 100 ? 'text-status-success' : 'text-status-warning')}>{r.atingimento}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-mx-lg">
                    {/* Alerta Operational Gap */}
                    {sellers.length > metrics.checkedInCount && (
                        <div className="bg-brand-secondary text-white p-mx-lg rounded-mx-3xl shadow-mx-elite relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-status-error/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex items-center gap-mx-sm mb-mx-md relative z-10">
                                <div className="w-12 h-12 rounded-mx-md bg-status-error flex items-center justify-center shadow-mx-lg shadow-status-error/40 transition-transform group-hover:rotate-6"><AlertTriangle size={24} /></div>
                                <div><h3 className="text-xl font-black tracking-tight leading-none mb-1">GAP Operacional</h3><p className="mx-text-caption text-white/40">Check-in Pendente</p></div>
                            </div>
                            <p className="text-sm font-bold text-white/60 leading-relaxed relative z-10">
                                <span className="text-white font-black">{sellers.length - metrics.checkedInCount} consultores</span> não registraram atividade hoje. Requer intervenção tática.
                            </p>
                        </div>
                    )}

                    {/* Quick Funnel */}
                    <div className="mx-card p-mx-lg group relative overflow-hidden">
                        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-mx-slate-50 opacity-50 rounded-full blur-[80px] pointer-events-none" />
                        <h3 className="text-xl font-black text-text-primary tracking-tight mb-mx-lg relative z-10 uppercase">Fluxo Ativo</h3>
                        <div className="space-y-mx-lg relative z-10">
                            {[
                                { label: 'Leads', value: metrics.funil.leads, pct: 100, color: 'bg-brand-primary' },
                                { label: 'Visitas', value: metrics.funil.visitas, pct: metrics.funil.tx_agd_visita, color: 'bg-status-warning' },
                                { label: 'Vendas', value: metrics.funil.vnd_total, pct: metrics.funil.tx_visita_vnd, color: 'bg-status-success' },
                            ].map((step, i) => (
                                <div key={step.label} className="space-y-2 group/step">
                                    <div className="flex justify-between items-end">
                                        <span className="mx-text-caption opacity-60">{step.label}</span>
                                        <span className="text-2xl font-black text-text-primary tracking-tighter">{step.value}</span>
                                    </div>
                                    <div className="h-1.5 bg-mx-slate-50 rounded-full overflow-hidden border border-border-subtle p-px shadow-inner">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${step.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className={cn("h-full rounded-full", step.color)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
