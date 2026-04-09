import { useFeedbacks, useWeeklyFeedbackReports } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useCheckins } from '@/hooks/useCheckins'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { 
    MessageSquare, Plus, X, Send, Award, AlertCircle, Zap, 
    ChevronRight, LayoutDashboard, Target, TrendingUp, 
    Sparkles, RefreshCw, Search, FileText, ExternalLink, 
    Calendar, ShieldCheck 
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { format, subDays, subWeeks, startOfWeek, endOfWeek, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { calcularFunil, gerarDiagnosticoMX, MX_BENCHMARKS, formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import { PrintableFeedback } from '@/components/feedback/PrintableFeedback'
import { WeeklyStoreReport } from '@/components/feedback/WeeklyStoreReport'
import { supabase } from '@/lib/supabase'
import type { FunnelData, FeedbackFormData } from '@/types/database'

function getPreviousWeekRange(baseDate = new Date()) {
    const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
    const start = addDays(currentWeekStart, -7); const end = addDays(currentWeekStart, -1)
    return { start, end, startKey: format(start, 'yyyy-MM-dd'), endKey: format(end, 'yyyy-MM-dd'), label: `${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}` }
}

export default function GerenteFeedback() {
    const { role } = useAuth()
    const { feedbacks, loading: feedbacksLoading, createFeedback, refetch: refetchFeedbacks } = useFeedbacks()
    const { reports, loading: reportsLoading, refetch: refetchReports } = useWeeklyFeedbackReports()
    const { sellers } = useTeam()
    const { checkins } = useCheckins()
    const [activeTab, setActiveTab] = useState<'individual' | 'weekly'>('individual')
    const [showForm, setShowForm] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const [saving, setSaving] = useState(false)
    const [printingFeedback, setPrintingFeedback] = useState<any>(null)
    const [printingWeeklyReport, setPrintingWeeklyReport] = useState<any>(null)
    const [sendingEmail, setSendingEmail] = useState<string | null>(null)
    const canCreateFeedback = role === 'admin' || role === 'gerente'
    const previousWeek = useMemo(() => getPreviousWeekRange(), [])

    const [form, setForm] = useState<FeedbackFormData>({ 
        seller_id: '', week_reference: previousWeek.startKey,
        leads_week: 0, agd_week: 0, visit_week: 0, vnd_week: 0,
        tx_lead_agd: 0, tx_agd_visita: 0, tx_visita_vnd: 0,
        meta_compromisso: 0, positives: '', attention_points: '', action: '', notes: '' 
    })

    const [weeklySnapshot, setWeeklySnapshot] = useState<FunnelData | null>(null)
    const [commitmentSuggested, setCommitmentSuggested] = useState(0)

    const filteredFeedbacks = useMemo(() => {
        return feedbacks.filter(f => 
            (f as any).seller_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.positives.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [feedbacks, searchTerm])

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true)
        if (activeTab === 'individual') await refetchFeedbacks()
        else await refetchReports()
        setIsRefetching(false)
        toast.success('Sincronizado!')
    }, [activeTab, refetchFeedbacks, refetchReports])

    if (feedbacksLoading || reportsLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Mentorias...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Feedback <span className="text-indigo-600">Oficial</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Rotina Semanal Mandatória • Critério 20/60/33</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="flex p-1 bg-surface-alt border border-border-default rounded-full" role="tablist">
                        <Button
                            variant={activeTab === 'individual' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('individual')} className="h-10 rounded-full px-6"
                        >
                            <User size={14} className="mr-2" /> Individual
                        </Button>
                        <Button
                            variant={activeTab === 'weekly' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('weekly')} className="h-10 rounded-full px-6"
                        >
                            <FileText size={14} className="mr-2" /> Relatórios
                        </Button>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
                        <input 
                            type="text" placeholder="BUSCAR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface-alt border border-border-default rounded-full h-12 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-brand-primary transition-all shadow-inner"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    {activeTab === 'individual' && canCreateFeedback && (
                        <Button onClick={() => setShowForm(true)} className="h-12 px-8 shadow-mx-lg">
                            <Plus size={18} aria-hidden="true" /> NOVO FEEDBACK
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {activeTab === 'individual' ? (
                    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredFeedbacks.map((f, i) => (
                                <motion.li key={f.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className="p-8 group hover:shadow-mx-xl transition-all h-full flex flex-col">
                                        <div className="flex items-start justify-between mb-8 border-b border-border-default pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-slate-900 text-lg group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner" aria-hidden="true">{(f as any).seller_name?.charAt(0)}</div>
                                                <div>
                                                    <Typography variant="h3" className="text-sm">{(f as any).seller_name}</Typography>
                                                    <Typography variant="caption" tone="muted">{format(parseISO(f.created_at), 'dd/MM/yyyy')}</Typography>
                                                </div>
                                            </div>
                                            <Badge variant={f.acknowledged ? 'success' : 'warning'}>{f.acknowledged ? 'LIDO' : 'PENDENTE'}</Badge>
                                        </div>

                                        <div className="space-y-6 flex-1">
                                            <div className="space-y-3">
                                                <Typography variant="caption" tone="success" className="flex items-center gap-2"><Award size={14} /> Pontos Positivos</Typography>
                                                <p className="text-sm font-bold text-gray-600 line-clamp-2 italic bg-emerald-50/30 p-4 rounded-2xl border border-emerald-50 shadow-inner">"{f.positives}"</p>
                                            </div>
                                            <div className="space-y-3">
                                                <Typography variant="caption" tone="error" className="flex items-center gap-2"><AlertCircle size={14} /> Atenção</Typography>
                                                <p className="text-sm font-bold text-gray-600 line-clamp-2 italic bg-rose-50/30 p-4 rounded-2xl border border-rose-50 shadow-inner">"{f.attention_points}"</p>
                                            </div>
                                            <div className="pt-6 border-t border-border-default">
                                                <Typography variant="caption" tone="brand" className="mb-3 flex items-center gap-2"><Target size={16} /> Missão Definida</Typography>
                                                <Typography variant="h3" className="text-base">{f.action}</Typography>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border-default flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-status-success hover:bg-status-success-surface" onClick={() => {}} aria-label="WhatsApp"><MessageSquare size={16} /></Button>
                                                <Button variant="ghost" size="sm" className="w-10 h-10 p-0 text-brand-primary hover:bg-brand-primary/5" onClick={() => {}} aria-label="E-mail"><Send size={16} /></Button>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-10 px-4 text-[10px]"><FileText size={14} className="mr-2" /> PDF</Button>
                                        </div>
                                    </Card>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </ul>
                ) : (
                    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        {reports.map((report) => (
                            <motion.li key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Card className="p-10 hover:shadow-mx-xl transition-all h-full">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md" aria-hidden="true"><Calendar size={20} /></div>
                                            <div>
                                                <Typography variant="caption">Período Semanal</Typography>
                                                <Typography variant="h3" className="text-sm">{format(parseISO(report.week_start), 'dd/MM')} a {format(parseISO(report.week_end), 'dd/MM')}</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={report.email_status === 'sent' ? 'success' : 'danger'}>{report.email_status === 'sent' ? 'ENVIADO' : 'FALHA'}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-border-default">
                                        <div className="bg-surface-alt rounded-2xl p-4 shadow-inner text-center">
                                            <Typography variant="caption" className="text-[8px] mb-1">Meta</Typography>
                                            <Typography variant="h2" className="text-xl tabular-nums">{report.weekly_goal}v</Typography>
                                        </div>
                                        <div className="bg-surface-alt rounded-2xl p-4 shadow-inner text-center">
                                            <Typography variant="caption" className="text-[8px] mb-1">Média</Typography>
                                            <Typography variant="h2" tone="brand" className="text-xl tabular-nums">{(report.team_avg_json as any).vnd || 0}v</Typography>
                                        </div>
                                    </div>
                                    <div className="pt-8 flex justify-end gap-3">
                                        <Button variant="ghost" size="sm" className="h-9 px-4 text-[9px] uppercase">CSV</Button>
                                        <Button variant="outline" size="sm" className="h-9 px-4 text-[9px] uppercase">VER PDF</Button>
                                    </div>
                                </Card>
                            </motion.li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    )
}
