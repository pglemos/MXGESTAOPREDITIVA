import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    Target, Zap, Save, RefreshCw, Settings2, 
    Filter, Users, Calendar, TrendingUp, Info, ArrowLeft
} from 'lucide-react'
import { useStores } from '@/hooks/useTeam'
import { useStoreGoal, useStoreMetaRules } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { Link } from 'react-router-dom'

export default function GoalManagement() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    const [selectedStoreId, setSelectedStoreId] = useState('')
    
    const { goal, updateGoal, loading: goalLoading } = useStoreGoal(selectedStoreId)
    const { metaRules, updateMetaRules, loading: rulesLoading } = useStoreMetaRules(selectedStoreId)

    const [storeMeta, setStoreMeta] = useState(0)
    const [storeBench, setStoreBench] = useState({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (goal) setStoreMeta(goal.target)
        if (metaRules) setStoreBench({ 
            lead_to_agend: metaRules.bench_lead_agd || 20, 
            agend_to_visit: metaRules.bench_agd_visita || 60, 
            visit_to_sale: metaRules.bench_visita_vnd || 33 
        })
    }, [goal, metaRules])

    const handleSave = async () => {
        if (!selectedStoreId) return
        setSaving(true)
        try {
            await Promise.all([
                updateGoal(storeMeta),
                updateMetaRules({
                    bench_lead_agd: storeBench.lead_to_agend,
                    bench_agd_visita: storeBench.agend_to_visit,
                    bench_visita_vnd: storeBench.visit_to_sale
                })
            ])
            toast.success('Configurações de governança firmadas!')
            setHasChanges(false)
        } finally { setSaving(false) }
    }

    const canEdit = role === 'admin' || role === 'dono'

    if (storesLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Metas...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-white">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-mx-lg shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-brand-secondary rounded-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Governança <span className="text-brand-primary">Rede</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Configuração de Metas e Benchmarks • Ciclo 2026</Typography>
                </div>

                <div className="flex items-center gap-4">
                    {canEdit && (
                        <Button
                            onClick={handleSave}
                            disabled={saving || !hasChanges || !selectedStoreId}
                            className="h-14 px-10 rounded-full shadow-mx-xl"
                        >
                            {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                            Firmar Configurações
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-10 space-y-8 bg-surface-alt border-none shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-border-default flex items-center justify-center text-brand-primary shadow-mx-sm" aria-hidden="true"><Settings2 size={24} /></div>
                            <Typography variant="h3">Unidade Alvo</Typography>
                        </div>

                        <div className="space-y-4">
                            <Typography variant="caption" tone="muted" className="ml-2">Selecionar Loja da Rede</Typography>
                            <select
                                value={selectedStoreId}
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                className="w-full h-14 px-6 bg-white border border-border-default rounded-mx-md text-sm font-bold text-slate-950 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-mx-sm"
                            >
                                <option value="">Selecione a unidade...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {selectedStoreId && (
                            <div className="pt-8 border-t border-border-default space-y-6">
                                <div className="p-6 bg-white rounded-2xl border border-border-default shadow-mx-sm">
                                    <Typography variant="caption" tone="muted" className="mb-1">Status de Rede</Typography>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" aria-hidden="true" />
                                        <Typography variant="caption" tone="success">Ativa e Operacional</Typography>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                </aside>

                <section className="lg:col-span-8 flex flex-col gap-mx-lg" aria-live="polite">
                    {!selectedStoreId ? (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-border-default rounded-[3rem] bg-surface-alt/50 flex flex-col items-center justify-center text-center p-10 group hover:bg-surface-alt transition-all">
                            <Filter size={48} className="text-text-tertiary mb-6 group-hover:text-brand-primary transition-colors" aria-hidden="true" />
                            <Typography variant="h2" tone="muted">Seleção Obrigatória</Typography>
                            <Typography variant="p" tone="muted" className="mt-2 max-w-xs">Escolha uma loja à esquerda para gerenciar as regras de negócio.</Typography>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <Card className="p-10 md:p-14 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" aria-hidden="true" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 rounded-mx-xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform group-hover:rotate-3 transition-transform" aria-hidden="true"><Target size={28} className="text-indigo-400" /></div>
                                        <div>
                                            <Typography variant="h3">Meta Mensal de Vendas</Typography>
                                            <Typography variant="caption" tone="muted">Objetivo nominal de sell-out por unidade</Typography>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-10">
                                        <div className="flex-1 w-full relative">
                                            <input
                                                type="text" inputMode="numeric"
                                                value={storeMeta}
                                                onChange={(e) => { if (!canEdit) return; setStoreMeta(Number(e.target.value.replace(/\D/g, '')) || 0); setHasChanges(true) }}
                                                disabled={!canEdit}
                                                className="w-full text-7xl font-black tracking-tighter text-slate-950 bg-surface-alt border-2 border-transparent rounded-[2rem] py-10 text-center focus:outline-none focus:bg-white focus:border-brand-primary transition-all font-mono-numbers shadow-inner disabled:opacity-50"
                                            />
                                            <span className="absolute bottom-4 left-1/2 -translate-x-1/2"><Typography variant="caption" tone="muted">Unidades Comerciais</Typography></span>
                                        </div>
                                        <div className="bg-brand-primary rounded-[2rem] p-8 text-white w-full sm:w-64 shadow-mx-xl flex flex-col justify-center items-center text-center">
                                            <TrendingUp size={32} className="mb-4 opacity-40" aria-hidden="true" />
                                            <p className="text-sm font-bold leading-relaxed italic uppercase tracking-tight">"Metas agressivas, porém pautadas no histórico."</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-10 md:p-14">
                                <div className="flex items-center gap-4 mb-12 border-b border-border-default pb-8">
                                    <div className="w-14 h-14 rounded-mx-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner" aria-hidden="true"><Zap size={28} /></div>
                                    <div>
                                        <Typography variant="h3">Matriz de Benchmarks (20/60/33)</Typography>
                                        <Typography variant="caption" tone="muted">Taxas de conversão oficiais para auditoria forense</Typography>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
                                    {[
                                        { label: 'Lead → Agd', field: 'lead_to_agend', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                        { label: 'Agd → Visita', field: 'agend_to_visit', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                                        { label: 'Visita → Vnd', field: 'visit_to_sale', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    ].map(b => (
                                        <div key={b.field} className="p-8 bg-surface-alt rounded-[2.5rem] border border-border-default group/item hover:bg-white hover:shadow-mx-xl transition-all shadow-inner" role="listitem">
                                            <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 shadow-mx-sm group-hover/item:scale-110 transition-transform", b.bg, b.color)} aria-hidden="true"><b.icon size={22} strokeWidth={2.5} /></div>
                                            <Typography variant="caption" tone="muted" className="mb-2 block">{b.label}</Typography>
                                            <div className="flex items-baseline gap-2">
                                                <input
                                                    type="text" inputMode="numeric"
                                                    value={storeBench[b.field as keyof typeof storeBench]}
                                                    onChange={(e) => { if (!canEdit) return; setStoreBench(prev => ({ ...prev, [b.field]: Number(e.target.value.replace(/\D/g, '')) || 0 })); setHasChanges(true) }}
                                                    disabled={!canEdit}
                                                    className="w-20 text-4xl font-black tracking-tighter text-slate-950 bg-transparent border-b-2 border-transparent focus:outline-none focus:border-brand-primary transition-all font-mono-numbers disabled:opacity-50"
                                                />
                                                <Typography variant="h2" tone="muted" className="text-xl">%</Typography>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </section>
            </div>
        </main>
    )
}
