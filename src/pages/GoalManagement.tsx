import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
    Target, Zap, Save, RefreshCw, Settings2, 
    Filter, Users, Calendar, TrendingUp, Info, ArrowLeft,
    ChevronDown
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
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { FormField } from '@/components/molecules/FormField'
import { Link, useSearchParams } from 'react-router-dom'

export default function GoalManagement() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    const [searchParams, setSearchParams] = useSearchParams()
    const initialId = searchParams.get('id')
    
    const [selectedStoreId, setSelectedStoreId] = useState(initialId || '')
    
    // Update selectedStoreId if URL changes
    useEffect(() => {
        if (initialId && initialId !== selectedStoreId) {
            setSelectedStoreId(initialId)
        }
    }, [initialId, selectedStoreId])

    const handleStoreChange = (newId: string) => {
        setSelectedStoreId(newId)
        if (newId) {
            setSearchParams({ id: newId })
        } else {
            setSearchParams({})
        }
    }
    
    const { goal, updateGoal, loading: goalLoading } = useStoreGoal(selectedStoreId)
    const { metaRules, updateMetaRules, loading: rulesLoading } = useStoreMetaRules(selectedStoreId)

    const [storeMeta, setStoreMeta] = useState(0)
    const [storeBench, setStoreBench] = useState({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Reset local state when data is fetched or store changes
    useEffect(() => {
        if (goal) {
            setStoreMeta(goal.target)
        } else {
            setStoreMeta(0)
        }

        if (metaRules) {
            setStoreBench({ 
                lead_to_agend: metaRules.bench_lead_agd || 20, 
                agend_to_visit: metaRules.bench_agd_visita || 60, 
                visit_to_sale: metaRules.bench_visita_vnd || 33 
            })
        } else {
            setStoreBench({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
        }
        
        // Reset hasChanges when new data arrives
        setHasChanges(false)
    }, [goal, metaRules])

    // Reset state immediately when selectedStoreId changes to avoid stale data
    useEffect(() => {
        if (selectedStoreId) {
            setStoreMeta(0)
            setStoreBench({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
            setHasChanges(false)
        }
    }, [selectedStoreId])

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
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse">Sincronizando Metas...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            {/* Header / Governance Toolbar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
                <div className="flex flex-col gap-mx-tiny">
                    <div className="flex items-center gap-mx-sm">
                        <div className="w-mx-xs h-mx-10 bg-brand-secondary rounded-mx-full shadow-mx-md" aria-hidden="true" />
                        <Typography variant="h1">Governança <span className="text-brand-primary">Rede</span></Typography>
                    </div>
                    <Typography variant="caption" className="pl-mx-md">Configuração de Metas e Benchmarks MX</Typography>
                </div>

                <div className="flex items-center gap-mx-sm">
                    {canEdit && (
                        <Button
                            onClick={handleSave}
                            disabled={saving || !hasChanges || !selectedStoreId}
                            className="h-mx-14 px-10 rounded-mx-full shadow-mx-xl"
                        >
                            {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                            FIRMAR CONFIGURAÇÕES
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg">
                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-mx-10 space-y-mx-10 border-none shadow-mx-lg bg-white">
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-8">
                            <div className="w-mx-14 h-mx-14 rounded-mx-xl bg-surface-alt border border-border-default flex items-center justify-center text-brand-primary shadow-inner" aria-hidden="true"><Settings2 size={28} /></div>
                            <Typography variant="h3">Unidade Alvo</Typography>
                        </header>

                        <div className="space-y-mx-sm">
                            <Typography variant="caption" tone="muted" className="ml-2 font-black uppercase tracking-widest">Selecionar Loja</Typography>
                            <div className="relative group">
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => handleStoreChange(e.target.value)}
                                    className="w-full h-mx-14 px-6 bg-surface-alt border border-border-default rounded-mx-md text-sm font-bold text-text-primary outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="">Selecione a unidade...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={18} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none group-hover:text-brand-primary transition-colors" />
                            </div>
                        </div>

                        {selectedStoreId && (
                            <div className="pt-10 border-t border-border-default space-y-mx-md">
                                <Card className="p-mx-md bg-status-success-surface border border-mx-emerald-100 shadow-inner">
                                    <Typography variant="caption" tone="success" className="mb-1 block font-black">STATUS DE REDE</Typography>
                                    <div className="flex items-center gap-mx-xs">
                                        <div className="w-2.5 h-2.5 rounded-mx-full bg-status-success animate-pulse shadow-mx-sm" />
                                        <Typography variant="h3" className="text-base text-status-success">ATIVA E OPERACIONAL</Typography>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </Card>
                </aside>

                <section className="lg:col-span-8 flex flex-col gap-mx-lg" aria-live="polite">
                    {!selectedStoreId ? (
                        <div className="h-full min-h-mx-section-lg border-2 border-dashed border-border-default rounded-mx-3xl bg-white flex flex-col items-center justify-center text-center p-mx-14 group hover:bg-surface-alt transition-all">
                            <div className="w-mx-3xl h-mx-3xl rounded-mx-3xl bg-surface-alt flex items-center justify-center mb-10 border border-border-default group-hover:scale-110 transition-transform">
                                <Filter size={48} className="text-text-tertiary group-hover:text-brand-primary" />
                            </div>
                            <Typography variant="h2" className="mb-4">Seleção Obrigatória</Typography>
                            <Typography variant="p" tone="muted" className="max-w-xs uppercase tracking-tight">Escolha uma unidade tática à esquerda para liberar o painel de governança.</Typography>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-mx-lg">
                            {/* Meta Card */}
                            <Card className="p-mx-10 md:p-14 relative overflow-hidden group border-none shadow-mx-xl bg-white">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-3xl -mr-48 -mt-48" />
                                <div className="relative z-10">
                                    <header className="flex items-center gap-mx-sm mb-14 border-b border-border-default pb-10">
                                        <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl transform group-hover:rotate-3 transition-transform"><Target size={32} className="text-brand-primary/80" /></div>
                                        <div>
                                            <Typography variant="h2">Meta Mensal de Vendas</Typography>
                                            <Typography variant="caption" tone="muted">Objetivo nominal de sell-out por unidade</Typography>
                                        </div>
                                    </header>

                                    <div className="flex flex-col sm:flex-row items-center gap-mx-xl">
                                        <div className="flex-1 w-full relative">
                                            <input
                                                type="text" inputMode="numeric"
                                                value={storeMeta}
                                                onChange={(e) => { if (!canEdit) return; setStoreMeta(Number(e.target.value.replace(/\D/g, '')) || 0); setHasChanges(true) }}
                                                disabled={!canEdit}
                                                className="w-full text-8xl font-black tracking-tighter text-text-primary bg-surface-alt border-4 border-transparent rounded-mx-2xl py-14 text-center focus:outline-none focus:bg-white focus:border-brand-primary transition-all font-mono-numbers shadow-inner disabled:opacity-50"
                                            />
                                            <span className="absolute bottom-mx-md left-1/2 -translate-x-1/2"><Typography variant="caption" tone="muted" className="font-black uppercase tracking-mx-wider">UNIDADES COMERCIAIS</Typography></span>
                                        </div>
                                        <Card className="bg-brand-primary p-mx-10 text-white w-full sm:w-72 shadow-mx-xl flex flex-col justify-center items-center text-center border-none">
                                            <TrendingUp size={48} className="mb-6 opacity-30" />
                                            <Typography variant="p" tone="white" className="text-sm font-black italic uppercase leading-relaxed opacity-80">"Metas agressivas, porém pautadas no histórico."</Typography>
                                        </Card>
                                    </div>
                                </div>
                            </Card>

                            {/* Benchmark Card */}
                            <Card className="p-mx-10 md:p-14 border-none shadow-mx-lg bg-white">
                                <header className="flex items-center gap-mx-sm mb-14 border-b border-border-default pb-10">
                                    <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner"><Zap size={32} /></div>
                                    <div>
                                        <Typography variant="h2">Matriz de Benchmarks (20/60/33)</Typography>
                                        <Typography variant="caption" tone="muted">Taxas de conversão oficiais para auditoria forense</Typography>
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-mx-lg">
                                    {[
                                        { label: 'Lead → Agd', field: 'lead_to_agend', icon: Users, tone: 'brand' },
                                        { label: 'Agd → Visita', field: 'agend_to_visit', icon: Calendar, tone: 'warning' },
                                        { label: 'Visita → Vnd', field: 'visit_to_sale', icon: TrendingUp, tone: 'success' },
                                    ].map(b => (
                                        <Card key={b.field} className="p-mx-10 bg-surface-alt border border-border-default group/item hover:bg-white hover:shadow-mx-xl transition-all shadow-inner">
                                            <div className={cn(
                                                "w-mx-14 h-mx-14 rounded-mx-2xl border flex items-center justify-center mb-8 shadow-mx-sm group-hover/item:scale-110 transition-transform",
                                                b.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                                b.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                                                'bg-status-warning-surface border-mx-amber-100 text-status-warning'
                                            )}><b.icon size={24} strokeWidth={2} /></div>
                                            
                                            <Typography variant="caption" tone="muted" className="mb-4 block font-black tracking-widest">{b.label}</Typography>
                                            
                                            <div className="flex items-baseline gap-mx-xs">
                                                <input
                                                    type="text" inputMode="numeric"
                                                    value={storeBench[b.field as keyof typeof storeBench]}
                                                    onChange={(e) => { if (!canEdit) return; setStoreBench(prev => ({ ...prev, [b.field]: Number(e.target.value.replace(/\D/g, '')) || 0 })); setHasChanges(true) }}
                                                    disabled={!canEdit}
                                                    className="w-mx-3xl text-5xl font-black tracking-tighter text-text-primary bg-transparent border-b-4 border-transparent focus:outline-none focus:border-brand-primary transition-all font-mono-numbers disabled:opacity-50"
                                                />
                                                <Typography variant="h1" tone="muted" className="text-2xl">%</Typography>
                                            </div>
                                        </Card>
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
