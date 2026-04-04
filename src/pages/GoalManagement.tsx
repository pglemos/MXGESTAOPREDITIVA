import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Target, Save, Calendar, Info, Users, ArrowRight, Zap, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

export default function GoalManagement() {
    const { storeGoal, sellerGoals, upsertGoal, currentMonth, currentYear, loading, refetch: refetchGoals } = useGoals()
    const { sellers, loading: teamLoading } = useTeam()
    const { storeId, role } = useAuth()
    
    const [storeMeta, setStoreMeta] = useState<number>(0)
    const [sellerMetas, setSellerMetas] = useState<Record<string, number>>({})
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (storeGoal) setStoreMeta(storeGoal.target)
        const initialSellers: Record<string, number> = {}
        sellerGoals.forEach(g => { initialSellers[g.user_id] = g.target })
        setSellerMetas(initialSellers)
    }, [storeGoal, sellerGoals])

    const getSellerGoal = useCallback((userId: string) => sellerMetas[userId] ?? 0, [sellerMetas])

    const metrics = useMemo(() => {
        const totalIndividual = sellers.reduce((s, v) => s + getSellerGoal(v.id), 0)
        const currentStoreTarget = storeMeta || 0
        const autoMeta = sellers.length > 0 ? Math.round(currentStoreTarget / sellers.length) : 0
        const diff = totalIndividual - currentStoreTarget
        return { totalIndividual, currentStoreTarget, autoMeta, diff }
    }, [sellers, storeMeta, getSellerGoal])

    const handleSave = async () => {
        if (role !== 'admin' && role !== 'consultor') { toast.error('Acesso negado.'); return }
        if (!storeId) return
        setSaving(true)
        try {
            const updates = [upsertGoal({ store_id: storeId, user_id: null, month: currentMonth, year: currentYear, target: storeMeta })]
            sellers.forEach(s => { updates.push(upsertGoal({ store_id: storeId, user_id: s.id, month: currentMonth, year: currentYear, target: getSellerGoal(s.id) })) })
            await Promise.all(updates); await refetchGoals(); setHasChanges(false); toast.success('Planejamento fixado!')
        } catch (e) { toast.error('Falha na persistência.') }
        finally { setSaving(false) }
    }

    const monthName = useMemo(() => new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), [currentMonth, currentYear])

    if (loading || teamLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-surface-alt/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"></div>
            <p className="mt-mx-md mx-text-caption animate-pulse">Sincronizando Matriz de Metas...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-mx-lg overflow-y-auto no-scrollbar relative p-mx-md sm:p-mx-lg md:p-mx-xl">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-mx-xs">
                        <div className="w-2 h-10 bg-brand-primary rounded-full shadow-mx-md" />
                        <h1 className="mx-heading-hero">Gestão Estratégica</h1>
                    </div>
                    <p className="mx-text-caption pl-mx-md opacity-60 uppercase">Ciclo Operacional • {monthName}</p>
                </div>

                <div className="flex w-full flex-col gap-mx-sm shrink-0 lg:w-auto lg:flex-row lg:items-center">
                    <button className="flex w-full items-center justify-center gap-3 rounded-full border border-border-default bg-white px-mx-md py-4 mx-text-caption text-text-tertiary hover:text-text-primary shadow-mx-sm lg:w-auto">
                        <Calendar size={18} /> Alterar Ciclo
                    </button>
                    <button onClick={handleSave} disabled={saving || !hasChanges} className="mx-button-primary bg-brand-primary flex w-full lg:w-auto">
                        {saving ? <RefreshCw className="animate-spin" /> : <><Save size={18} /> Firmar Planejamento</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg shrink-0 pb-mx-3xl">
                {/* Left Column (5/12) */}
                <div className="lg:col-span-5 flex flex-col gap-mx-lg">
                    <div className="mx-card p-mx-lg md:p-mx-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-mx-sm mb-mx-xl">
                                <div className="w-14 h-14 rounded-mx-lg bg-brand-primary-surface text-brand-primary flex items-center justify-center shadow-inner border border-mx-indigo-100 transition-transform group-hover:scale-110 group-hover:rotate-3"><Target size={28} strokeWidth={2.5} /></div>
                                <div><h3 className="text-xl font-black text-text-primary tracking-tighter leading-none mb-1">Meta Global</h3><p className="mx-text-caption !text-[8px]">Objetivo da Rede</p></div>
                            </div>
                            <div className="mb-mx-xl relative">
                                <div className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none"><span className="text-2xl font-black text-mx-slate-200">R$</span></div>
                                <input type="text" inputMode="numeric" value={storeMeta} onChange={e => { setStoreMeta(Number(e.target.value.replace(/\D/g, '')) || 0); setHasChanges(true) }} className="w-full bg-mx-slate-50 border-2 border-transparent rounded-mx-3xl py-mx-2xl px-mx-md text-6xl font-black text-text-primary text-center focus:outline-none focus:bg-white focus:border-brand-primary/30 focus:shadow-mx-xl transition-all tracking-tighter" />
                                <div className="absolute right-mx-md bottom-mx-sm pointer-events-none"><span className="text-[8px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary-surface px-mx-sm py-1.5 rounded-full border border-mx-indigo-100">Target</span></div>
                            </div>
                            <div className="flex justify-between items-center bg-mx-slate-50/50 border border-border-default rounded-mx-xl p-mx-md shadow-inner">
                                <div><p className="mx-text-caption !text-[8px] mb-1 opacity-60">Métrica Base</p><p className="font-black text-sm text-text-primary uppercase">Sellout Unidades</p></div>
                                <div className="text-right"><p className="mx-text-caption !text-[8px] mb-1 opacity-60">Validação</p><span className="text-[10px] font-black text-status-success uppercase tracking-widest flex items-center gap-1.5 bg-status-success-surface px-3 py-1 rounded-mx-sm border border-mx-emerald-100"><ShieldCheck size={12} /> OK</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-secondary rounded-mx-3xl p-mx-lg md:p-mx-xl text-white relative overflow-hidden group shadow-mx-elite">
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-transparent to-transparent z-0" />
                        <div className="absolute -right-mx-md -bottom-mx-md opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-700"><Zap size={200} fill="currentColor" /></div>
                        <div className="relative z-10 flex items-center gap-mx-sm mb-mx-lg">
                            <div className="w-12 h-12 rounded-mx-md bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-brand-primary transition-colors"><Info size={20} /></div>
                            <div><h4 className="mx-text-caption text-mx-indigo-400 mb-1">Carga Inteligente</h4><span className="text-[8px] font-black text-white/40 uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/5">Auto-Suggest MX</span></div>
                        </div>
                        <div className="relative z-10 flex flex-col sm:flex-row gap-mx-lg items-start sm:items-center justify-between border-t border-white/10 pt-mx-lg">
                            <p className="font-bold text-white/60 text-sm leading-relaxed max-w-[200px]">Carga média recomendada para sustentar o pacing:</p>
                            <div className="flex items-baseline gap-2 shrink-0"><span className="text-6xl font-black text-white tracking-tighter leading-none font-mono-numbers">{metrics.autoMeta}</span><span className="mx-text-caption text-white/30 uppercase !tracking-widest">un/user</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Column (7/12) */}
                <div className="lg:col-span-7 flex flex-col gap-mx-lg">
                    <div className="mx-card overflow-hidden flex flex-col h-full">
                        <div className="p-mx-lg border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-mx-lg bg-mx-slate-50/30">
                            <div><h3 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">Matriz de Cotas</h3><p className="mx-text-caption">Distribuição Individual de Elite</p></div>
                            <div className={cn("flex items-center gap-mx-sm px-mx-md py-mx-sm rounded-mx-xl border-2 transition-all shadow-mx-sm", metrics.diff === 0 ? 'bg-status-success-surface text-status-success border-mx-emerald-100' : 'bg-brand-primary-surface text-brand-primary border-mx-indigo-100')}>
                                <div className="text-right"><p className="mx-text-caption !text-[8px] opacity-60 mb-1">Desvio Calculado</p><p className="font-black tracking-tight">{metrics.diff === 0 ? 'Alinhamento Total' : metrics.diff > 0 ? `Superávit: +${metrics.diff}` : `Déficit: ${metrics.diff}`}</p></div>
                                <div className="w-10 h-10 rounded-mx-md flex items-center justify-center shadow-inner bg-white">{metrics.diff === 0 ? <CheckCircle2 size={20} /> : <TrendingUp size={20} />}</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-mx-lg space-y-mx-sm">
                            <AnimatePresence mode="popLayout">
                                {sellers.map((s, i) => (
                                    <motion.div key={s.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex flex-col sm:flex-row sm:items-center gap-mx-lg p-mx-md rounded-mx-xl bg-white border border-border-subtle hover:border-mx-indigo-100 hover:shadow-mx-lg transition-all group relative">
                                        <div className="flex items-center gap-mx-md flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-mx-md bg-mx-slate-50 border border-border-default shadow-inner flex items-center justify-center font-black text-text-primary text-sm group-hover:bg-brand-secondary group-hover:text-white transition-all uppercase">{s.name?.charAt(0)}</div>
                                            <div className="min-w-0"><p className="text-text-primary font-black text-lg tracking-tight mb-1 truncate">{s.name}</p><div className="flex items-center gap-2 text-text-tertiary"><Users size={10} strokeWidth={3} className="text-brand-primary" /><p className="text-[8px] font-black uppercase tracking-widest">{s.role || 'Especialista'}</p></div></div>
                                        </div>
                                        <div className="flex items-center gap-mx-md bg-mx-slate-50/50 rounded-mx-md p-mx-sm border border-border-default group-hover:bg-white transition-colors">
                                            <div className="flex flex-col items-end px-2"><span className="text-[8px] font-black text-text-tertiary uppercase tracking-widest">Ideal</span><span className="text-xs font-black text-mx-slate-200 font-mono-numbers">{metrics.autoMeta}</span></div>
                                            <div className="w-px h-8 bg-mx-slate-200" />
                                            <input type="text" inputMode="numeric" value={getSellerGoal(s.id)} onChange={e => { setSellerMetas(prev => ({ ...prev, [s.id]: Number(e.target.value.replace(/\D/g, '')) || 0 })); setHasChanges(true) }} className="w-20 bg-white border border-transparent rounded-mx-sm py-2 text-center text-text-primary font-black text-xl shadow-mx-sm focus:outline-none focus:border-brand-primary transition-all font-mono-numbers" />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
