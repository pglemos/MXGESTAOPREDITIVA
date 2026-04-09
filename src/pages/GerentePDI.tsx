import { usePDIs } from '@/hooks/useData'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { 
    Plus, Target, CheckCircle2, Calendar, User, TrendingUp, 
    Search, X, Clock, RefreshCw, Printer, Award, Zap, 
    ChevronLeft, ChevronRight, LayoutDashboard, Sparkles,
    ShieldCheck, Smartphone, History
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from "@/lib/utils"
import { Badge } from "@/components/atoms/Badge"
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'

const statusCfg = {
    aberto: { variant: 'danger' as const, label: 'ABERTO' },
    em_andamento: { variant: 'warning' as const, label: 'EM EXECUÇÃO' },
    concluido: { variant: 'success' as const, label: 'CONCLUÍDO' }
}

export default function GerentePDI() {
    const { role } = useAuth()
    const { pdis, loading, createPDI, refetch } = usePDIs()
    const { sellers } = useTeam()
    const [showForm, setShowForm] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [saving, setSaving] = useState(false)
    const [isRefetching, setIsRefetching] = useState(false)
    const canManagePDI = role === 'admin' || role === 'gerente'

    const [form, setForm] = useState({
        seller_id: '', meta_6m: '', meta_12m: '', meta_24m: '',
        comp_prospeccao: 6, comp_abordagem: 6, comp_demonstracao: 6, comp_fechamento: 6, comp_crm: 6,
        comp_digital: 6, comp_disciplina: 6, comp_organizacao: 6, comp_negociacao: 6, comp_produto: 6,
        action_1: '', action_2: '', action_3: '', action_4: '', action_5: '', due_date: format(new Date(), 'yyyy-MM-dd')
    })

    const steps = [
        { id: 'goals', label: 'Metas de Carreira', icon: Target },
        { id: 'skills', label: 'Radar de Competências', icon: LayoutDashboard },
        { id: 'actions', label: 'Plano de Ação', icon: Zap }
    ]

    const competences = [
        { id: 'comp_prospeccao', label: 'Prospecção' },
        { id: 'comp_abordagem', label: 'Abordagem' },
        { id: 'comp_demonstracao', label: 'Demonstração' },
        { id: 'comp_fechamento', label: 'Fechamento' },
        { id: 'comp_crm', label: 'Gestão CRM' },
        { id: 'comp_digital', label: 'Venda Digital' },
        { id: 'comp_disciplina', label: 'Disciplina' },
        { id: 'comp_organizacao', label: 'Organização' },
        { id: 'comp_negociacao', label: 'Negociação' },
        { id: 'comp_produto', label: 'Prod. Técnico' }
    ]

    const handleRefresh = useCallback(async () => {
        setIsRefetching(true); await refetch(); setIsRefetching(false)
        toast.success('Matriz de PDI sincronizada!')
    }, [refetch])

    const handleSubmit = async () => {
        setSaving(true)
        const { error } = await createPDI(form as any)
        setSaving(false)
        if (error) toast.error(error)
        else {
            toast.success('PDI firmado com sucesso!')
            setShowForm(false)
        }
    }

    const filteredPDIs = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return pdis.filter((p: any) =>
            (p.meta_6m || p.objective || '').toLowerCase().includes(term) ||
            (p.seller_name || '').toLowerCase().includes(term)
        )
    }, [pdis, searchTerm])

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-12 h-12 animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Computando Planos...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">

            {/* Header / PDI Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Ciclo de <span className="text-brand-primary">Evolução</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md uppercase tracking-widest">PERSONAL DEVELOPMENT PLAN (PDI) • MX ACADEMY</Typography>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-mx-sm shrink-0">
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" aria-hidden="true" />
                        <Input
                            placeholder="BUSCAR PLANO..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="!pl-11 !h-12 !text-[10px] uppercase tracking-widest"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-xl shadow-mx-sm h-12 w-12">
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} aria-hidden="true" />
                    </Button>
                    {canManagePDI && (
                        <Button onClick={() => {
                            setForm({
                                seller_id: '', meta_6m: '', meta_12m: '', meta_24m: '',
                                comp_prospeccao: 6, comp_abordagem: 6, comp_demonstracao: 6, comp_fechamento: 6, comp_crm: 6,
                                comp_digital: 6, comp_disciplina: 6, comp_organizacao: 6, comp_negociacao: 6, comp_produto: 6,
                                action_1: '', action_2: '', action_3: '', action_4: '', action_5: '', due_date: format(new Date(), 'yyyy-MM-dd')
                            })
                            setCurrentStep(0)
                            setShowForm(true)
                        }} className="h-12 px-8 shadow-mx-lg bg-brand-secondary">
                            <Plus size={18} className="mr-2" /> NOVO PDI
                        </Button>
                    )}
                </div>
            </header>

            <AnimatePresence>
                {showForm && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-mx-black/60 backdrop-blur-sm"
                    >
                        <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto no-scrollbar shadow-mx-2xl border-none flex flex-col bg-white rounded-[2.5rem]">
                            <header className="p-8 md:p-10 border-b border-border-default flex flex-col gap-8 sticky top-0 bg-white z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center shadow-mx-lg"><Target size={24} /></div>
                                        <div>
                                            <Typography variant="h2">Novo Plano de Evolução</Typography>
                                            <Typography variant="caption" tone="muted">Horizonte de Carreira & Competências</Typography>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="rounded-full w-12 h-12 hover:bg-surface-alt"><X size={24} /></Button>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    {steps.map((step, idx) => (
                                        <div key={step.id} className="flex-1 flex flex-col gap-2">
                                            <div className={cn(
                                                "h-1.5 rounded-full transition-all duration-500",
                                                idx <= currentStep ? "bg-brand-primary shadow-[0_0_10px_rgba(79,70,229,0.3)]" : "bg-surface-alt"
                                            )} />
                                            <div className="flex items-center gap-2 px-2">
                                                <step.icon size={14} className={idx <= currentStep ? "text-brand-primary" : "text-text-tertiary"} />
                                                <span className={cn("text-[10px] font-black uppercase tracking-widest", idx <= currentStep ? "text-text-primary" : "text-text-tertiary")}>{step.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </header>

                            <div className="p-8 md:p-14">
                                {/* Step 0: Goals */}
                                {currentStep === 0 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                        <div className="space-y-4">
                                            <Typography variant="caption" tone="muted" className="ml-2 uppercase font-black tracking-widest">Vendedor</Typography>
                                            <select 
                                                value={form.seller_id}
                                                onChange={(e) => setForm(f => ({ ...f, seller_id: e.target.value }))}
                                                className="w-full h-16 px-8 bg-surface-alt border-2 border-border-default rounded-mx-xl text-lg font-black focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-inner"
                                            >
                                                <option value="">Selecione o especialista...</option>
                                                {sellers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                                            {[
                                                { label: 'Visão 06 Meses', field: 'meta_6m', placeholder: 'Ex: Líder de Equipe' },
                                                { label: 'Visão 12 Meses', field: 'meta_12m', placeholder: 'Ex: Gerente de Unidade' },
                                                { label: 'Visão 24 Meses', field: 'meta_24m', placeholder: 'Ex: Sócio de Operação' },
                                            ].map(item => (
                                                <div key={item.field} className="space-y-4">
                                                    <Typography variant="caption" tone="brand" className="ml-2 uppercase font-black tracking-widest">{item.label}</Typography>
                                                    <textarea 
                                                        value={(form as any)[item.field]}
                                                        onChange={e => setForm(f => ({ ...f, [item.field]: e.target.value }))}
                                                        placeholder={item.placeholder}
                                                        className="w-full h-32 p-6 bg-white border border-border-default rounded-mx-2xl text-sm font-bold focus:border-brand-primary transition-all shadow-sm outline-none resize-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 1: Skills (Radar) */}
                                {currentStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-mx-xl items-center">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                            {competences.map(c => (
                                                <div key={c.id} className="space-y-2">
                                                    <div className="flex justify-between items-center px-2">
                                                        <Typography variant="caption" className="font-black uppercase tracking-tighter text-[9px]">{c.label}</Typography>
                                                        <Typography variant="mono" tone="brand" className="text-xs">{form[c.id as keyof typeof form]}</Typography>
                                                    </div>
                                                    <input 
                                                        type="range" min="1" max="10" 
                                                        value={form[c.id as keyof typeof form]}
                                                        onChange={e => setForm(f => ({ ...f, [c.id]: Number(e.target.value) }))}
                                                        className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-brand-primary shadow-inner"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="h-[400px] w-full bg-surface-alt/30 rounded-[3rem] p-8 border border-border-default shadow-inner flex items-center justify-center">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competences.map(c => ({ subject: c.label, A: form[c.id as keyof typeof form], fullMark: 10 }))}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                                                    <Radar name="Competências" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.2} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 2: Actions */}
                                {currentStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-mx-lg">
                                            <div className="space-y-8">
                                                <Typography variant="caption" tone="muted" className="ml-2 uppercase font-black tracking-widest italic">Ações Práticas Obrigatórias (Top 5)</Typography>
                                                {[1, 2, 3, 4, 5].map(num => (
                                                    <div key={num} className="relative group">
                                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-border-default shadow-sm flex items-center justify-center text-[10px] font-black z-10 group-focus-within:bg-brand-primary group-focus-within:text-white transition-all">{num}</div>
                                                        <Input 
                                                            value={(form as any)[`action_${num}`]}
                                                            onChange={e => setForm(f => ({ ...f, [`action_${num}`]: e.target.value }))}
                                                            placeholder={`Ação ${num}...`}
                                                            className="!pl-8 !h-14 !rounded-xl"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-8">
                                                <div className="p-10 bg-brand-secondary rounded-[2.5rem] text-white shadow-mx-xl space-y-6">
                                                    <Typography variant="h3" tone="white">Prazo de Revisão</Typography>
                                                    <Typography variant="p" tone="white" className="opacity-60 text-xs uppercase font-bold">Quando este ciclo de evolução será auditado pelo gestor?</Typography>
                                                    <input 
                                                        type="date" 
                                                        value={form.due_date}
                                                        onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                                                        className="w-full h-16 px-8 bg-white/10 border border-white/20 rounded-2xl text-xl font-black text-white outline-none focus:bg-white/20 transition-all shadow-inner"
                                                    />
                                                </div>

                                                <Card className="p-8 border-2 border-dashed border-border-default bg-surface-alt/50 flex flex-col items-center justify-center text-center space-y-4 rounded-mx-2xl">
                                                    <Sparkles size={32} className="text-brand-primary opacity-40" />
                                                    <Typography variant="p" tone="muted" className="text-[10px] font-black uppercase">O PDI deve ser impresso e assinado por ambas as partes para validade jurídica e tática.</Typography>
                                                </Card>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <footer className="p-8 md:p-10 border-t border-border-default sticky bottom-0 bg-white z-10 flex justify-between gap-mx-sm mt-auto">
                                <Button variant="ghost" onClick={() => currentStep > 0 ? setCurrentStep(s => s - 1) : setShowForm(false)} className="h-14 px-8 rounded-full font-black uppercase tracking-widest">
                                    <ChevronLeft size={18} className="mr-2" /> {currentStep === 0 ? 'CANCELAR' : 'VOLTAR'}
                                </Button>
                                
                                <Button 
                                    onClick={() => currentStep < 2 ? setCurrentStep(s => s + 1) : handleSubmit()}
                                    disabled={saving || !form.seller_id || (currentStep === 2 && !form.action_1)}
                                    className="h-14 px-12 rounded-full shadow-mx-xl font-black uppercase tracking-widest"
                                >
                                    {saving ? <RefreshCw className="animate-spin mr-2" /> : (currentStep === 2 ? <CheckCircle2 size={18} className="mr-2" /> : <ChevronRight size={18} className="ml-2" />)}
                                    {currentStep === 2 ? 'FIRMAR PLANO' : 'PRÓXIMO'}
                                </Button>
                            </footer>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PDI Grid */}
            <div className="flex-1 min-h-0 pb-32" aria-live="polite">
                {filteredPDIs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-mx-lg">
                        <AnimatePresence mode="popLayout">
                            {filteredPDIs.map((p, i) => {
                                const status = statusCfg[p.status as keyof typeof statusCfg] || statusCfg.aberto
                                return (
                                    <motion.article key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                                        <Card className="p-8 h-full flex flex-col justify-between group hover:shadow-mx-xl transition-all border-none shadow-mx-lg bg-white relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            
                                            <div>
                                                <header className="flex items-start justify-between mb-10 border-b border-border-default pb-6 relative z-10">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-14 h-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center font-black text-text-primary text-xl shadow-inner group-hover:bg-brand-secondary group-hover:text-white transition-all transform group-hover:rotate-3" aria-hidden="true">
                                                            {(p as any).seller_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Typography variant="h3" className="text-base uppercase tracking-tight truncate group-hover:text-brand-primary transition-colors">{(p as any).seller_name}</Typography>
                                                            <Typography variant="caption" tone="muted" className="text-[8px] font-black uppercase tracking-widest">ESPECIALISTA</Typography>
                                                        </div>
                                                    </div>
                                                    <Badge variant={status.variant} className="px-4 py-1 rounded-lg text-[8px] font-black shadow-sm uppercase">{status.label}</Badge>
                                                </header>

                                                <div className="space-y-8 relative z-10">
                                                    <div className="space-y-2">
                                                        <Typography variant="caption" tone="brand" className="font-black uppercase tracking-[0.2em] mb-2 block">Objetivo 06 Meses</Typography>
                                                        <Typography variant="h2" className="text-xl leading-snug line-clamp-2">"{(p as any).meta_6m || (p as any).objective}"</Typography>
                                                    </div>

                                                    <Card className="p-6 bg-surface-alt border-none shadow-inner group-hover:bg-white group-hover:shadow-mx-sm transition-all">
                                                        <header className="flex items-center justify-between mb-4 border-b border-border-strong/10 pb-3">
                                                            <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest text-[8px]">Ação Prioritária #1</Typography>
                                                            <Zap size={14} className="text-brand-primary" />
                                                        </header>
                                                        <Typography variant="p" className="text-xs font-bold leading-relaxed italic uppercase tracking-tight text-text-secondary line-clamp-3">
                                                            "{p.action_1}"
                                                        </Typography>
                                                    </Card>
                                                </div>
                                            </div>

                                            <footer className="pt-8 border-t border-border-default flex items-center justify-between mt-10 relative z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-brand-primary" aria-hidden="true" />
                                                        <Typography variant="mono" className="text-[10px] font-black opacity-40">
                                                            {p.due_date ? format(parseISO(p.due_date), 'dd/MM/yy') : '--/--'}
                                                        </Typography>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-text-tertiary hover:text-brand-primary hover:bg-mx-indigo-50" aria-label="Imprimir">
                                                        <Printer size={18} />
                                                    </Button>
                                                </div>
                                                <Button variant="secondary" size="icon" className="w-12 h-12 rounded-xl shadow-mx-md hover:scale-110 active:scale-95 transition-all">
                                                    <ChevronRight size={24} strokeWidth={2.5} />
                                                </Button>
                                            </footer>
                                        </Card>
                                    </motion.article>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <Card className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-border-default bg-white/50 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="w-24 h-24 rounded-mx-3xl bg-surface-alt shadow-mx-xl flex items-center justify-center mb-8 border border-border-default group-hover:rotate-12 transition-transform duration-500">
                            <TrendingUp size={48} className="text-text-tertiary/20" />
                        </div>
                        <Typography variant="h2" className="mb-4 uppercase tracking-tighter">Matriz de Evolução Limpa</Typography>
                        <Typography variant="p" tone="muted" className="max-w-sm mx-auto uppercase tracking-widest mb-10">Não localizamos planos de desenvolvimento ativos na malha.</Typography>
                        {canManagePDI && (
                            <Button onClick={() => setShowForm(true)} className="h-16 px-12 rounded-full shadow-mx-elite font-black uppercase tracking-widest">
                                <Plus size={20} className="mr-3" /> INICIAR PRIMEIRO PDI
                            </Button>
                        )}
                    </Card>
                )}
            </div>
        </main>
    )
}
