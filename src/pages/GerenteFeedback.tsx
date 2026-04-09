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
    Calendar, ShieldCheck, User 
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { format, subDays, subWeeks, startOfWeek, endOfWeek, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { calcularFunil, gerarDiagnosticoMX, MX_BENCHMARKS, formatStructuredWhatsAppFeedback } from '@/lib/calculations'
import { supabase } from '@/lib/supabase'
import type { FunnelData, FeedbackFormData } from '@/types/database'

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
    
    const canCreateFeedback = role === 'admin' || role === 'gerente'

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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Auditando Mentorias...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-lg bg-surface-alt">
            
            {/* Header / Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Gestão de <span className="text-brand-primary">Feedback</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Rotina Semanal Mandatória • Critério 20/60/33</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="flex p-1 bg-white border border-border-default rounded-mx-full shadow-mx-sm" role="tablist">
                        <Button
                            variant={activeTab === 'individual' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('individual')} className="h-9 rounded-full px-6 text-[10px]"
                        >
                            <User size={14} className="mr-2" /> INDIVIDUAL
                        </Button>
                        <Button
                            variant={activeTab === 'weekly' ? 'secondary' : 'ghost'} size="sm"
                            onClick={() => setActiveTab('weekly')} className="h-9 rounded-full px-6 text-[10px]"
                        >
                            <FileText size={14} className="mr-2" /> RELATÓRIOS
                        </Button>
                    </div>

                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <Input 
                            placeholder="BUSCAR..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                        />
                    </div>
                    
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12 bg-white">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </Button>

                    {activeTab === 'individual' && canCreateFeedback && (
                        <Button onClick={() => setShowForm(true)} className="h-12 px-8 shadow-mx-lg bg-brand-secondary">
                            <Plus size={18} className="mr-2" /> NOVO FEEDBACK
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {activeTab === 'individual' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredFeedbacks.map((f, i) => (
                                <motion.div key={f.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}>
                                    <Card className="p-8 h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div>
                                            <header className="flex items-start justify-between mb-8 border-b border-border-default pb-6 relative z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-lg group-hover:bg-brand-secondary group-hover:text-white transition-all shadow-inner uppercase">{(f as any).seller_name?.charAt(0)}</div>
                                                    <div>
                                                        <Typography variant="h3" className="text-base">{(f as any).seller_name}</Typography>
                                                        <Typography variant="caption" tone="muted">{format(parseISO(f.created_at), 'dd/MM/yyyy')}</Typography>
                                                    </div>
                                                </div>
                                                <Badge variant={f.acknowledged ? 'success' : 'warning'}>{f.acknowledged ? 'LIDO' : 'PENDENTE'}</Badge>
                                            </header>

                                            <div className="space-y-8 relative z-10">
                                                <div className="space-y-2">
                                                    <Typography variant="caption" tone="success" className="flex items-center gap-2 font-black uppercase tracking-widest"><Award size={14} /> PONTOS FORTES</Typography>
                                                    <p className="text-sm font-bold text-text-secondary line-clamp-3 italic bg-status-success-surface/30 p-5 rounded-mx-2xl border border-status-success-surface shadow-inner">"{f.positives}"</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Typography variant="caption" tone="error" className="flex items-center gap-2 font-black uppercase tracking-widest"><AlertCircle size={14} /> OPORTUNIDADES</Typography>
                                                    <p className="text-sm font-bold text-text-secondary line-clamp-3 italic bg-status-error-surface/30 p-5 rounded-mx-2xl border border-status-error-surface shadow-inner">"{f.attention_points}"</p>
                                                </div>
                                                <div className="pt-8 border-t border-border-default">
                                                    <Typography variant="caption" tone="brand" className="mb-3 flex items-center gap-2 font-black uppercase tracking-widest"><Target size={16} /> PRÓXIMO PASSO</Typography>
                                                    <Typography variant="h3" className="text-base text-brand-primary leading-tight">{f.action}</Typography>
                                                </div>
                                            </div>
                                        </div>

                                        <footer className="mt-10 pt-8 border-t border-border-default flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all relative z-10">
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" className="w-10 h-10 p-0 text-status-success hover:bg-status-success-surface rounded-xl"><MessageSquare size={16} /></Button>
                                                <Button variant="ghost" size="icon" className="w-10 h-10 p-0 text-brand-primary hover:bg-mx-indigo-50 rounded-xl"><Send size={16} /></Button>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-10 px-4 text-[9px] uppercase tracking-widest rounded-xl shadow-sm bg-white">
                                                <FileText size={14} className="mr-2" /> Exportar PDF
                                            </Button>
                                        </footer>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        {reports.map((report) => (
                            <motion.div key={report.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <Card className="p-8 md:p-10 hover:shadow-mx-xl transition-all h-full border-none shadow-mx-lg bg-white relative overflow-hidden flex flex-col">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/5 rounded-full blur-[60px] -mr-16 -mt-16" />
                                    
                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-md"><Calendar size={24} /></div>
                                            <div>
                                                <Typography variant="caption" tone="muted" className="uppercase tracking-widest font-black">PERÍODO SEMANAL</Typography>
                                                <Typography variant="h3" className="text-lg">{format(parseISO(report.week_start), 'dd/MM')} a {format(parseISO(report.week_end), 'dd/MM')}</Typography>
                                            </div>
                                        </div>
                                        <Badge variant={report.email_status === 'sent' ? 'success' : 'danger'}>{report.email_status === 'sent' ? 'ENVIADO' : 'FALHA'}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 py-8 border-y border-border-default relative z-10">
                                        <div className="bg-surface-alt rounded-mx-2xl p-6 shadow-inner text-center">
                                            <Typography variant="caption" tone="muted" className="text-[9px] mb-2 block uppercase tracking-widest font-black">META REDE</Typography>
                                            <Typography variant="h2" className="text-2xl font-mono-numbers tabular-nums">{report.weekly_goal}v</Typography>
                                        </div>
                                        <div className="bg-surface-alt rounded-mx-2xl p-6 shadow-inner text-center">
                                            <Typography variant="caption" tone="muted" className="text-[9px] mb-2 block uppercase tracking-widest font-black">MÉDIA TROPA</Typography>
                                            <Typography variant="h2" tone="brand" className="text-2xl font-mono-numbers tabular-nums">{(report.team_avg_json as any).vnd || 0}v</Typography>
                                        </div>
                                    </div>
                                    <div className="pt-10 flex justify-end gap-4 mt-auto relative z-10">
                                        <Button variant="ghost" size="sm" className="h-10 px-6 text-[10px] uppercase rounded-full font-black tracking-widest">CSV</Button>
                                        <Button variant="outline" size="sm" className="h-10 px-6 text-[10px] uppercase rounded-full font-black tracking-widest shadow-sm bg-white">VER COMPLETO</Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
