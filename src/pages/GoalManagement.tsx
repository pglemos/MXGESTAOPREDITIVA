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
    
    useEffect(() => {
        if (initialId && initialId !== selectedStoreId) {
            setSelectedStoreId(initialId)
        }
    }, [initialId, selectedStoreId])

    const handleStoreChange = (newId: string) => {
        setSelectedStoreId(newId)
        if (newId) setSearchParams({ id: newId })
        else setSearchParams({})
    }
    
    const { goal, updateGoal, loading: goalLoading } = useStoreGoal(selectedStoreId)
    const { metaRules, updateMetaRules, loading: rulesLoading } = useStoreMetaRules(selectedStoreId)

    const [storeMeta, setStoreMeta] = useState(0)
    const [storeBench, setStoreBench] = useState({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (goal) setStoreMeta(goal.target)
        else setStoreMeta(0)

        if (metaRules) {
            setStoreBench({ 
                lead_to_agend: metaRules.bench_lead_agd || 20, 
                agend_to_visit: metaRules.bench_agd_visita || 60, 
                visit_to_sale: metaRules.bench_visita_vnd || 33 
            })
        } else {
            setStoreBench({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
        }
        setHasChanges(false)
    }, [goal, metaRules])

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
            toast.success('Governança firmada!')
            setHasChanges(false)
        } finally { setSaving(false) }
    }

    const canEdit = role === 'admin' || role === 'dono'

    if (storesLoading) return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-surface-alt">
            <RefreshCw className="w-mx-xl h-mx-xl animate-spin text-brand-primary mb-6" />
            <Typography variant="caption" tone="muted" className="animate-pulse font-black uppercase tracking-widest">Sincronizando...</Typography>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-4 md:gap-mx-lg p-4 md:p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
            
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-default pb-6 shrink-0 text-center lg:text-left">
                <div className="flex flex-col gap-1">
                    <Typography variant="h1" className="text-2xl sm:text-4xl">Governança <span className="text-brand-primary">Rede</span></Typography>
                    <Typography variant="caption" className="uppercase font-black text-[8px] sm:text-xs tracking-widest opacity-40">METAS E BENCHMARKS MX</Typography>
                </div>

                <div className="flex items-center justify-center gap-mx-sm">
                    {canEdit && (
                        <Button
                            onClick={handleSave}
                            disabled={saving || !hasChanges || !selectedStoreId}
                            className="h-mx-12 sm:h-mx-14 px-8 sm:px-10 rounded-full shadow-mx-xl font-black uppercase text-[10px]"
                        >
                            {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                            FIRMAR CONFIGURAÇÕES
                        </Button>
                    )}
                </div>
            </header>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-mx-lg">
                <aside className="lg:col-span-4 flex flex-col gap-mx-lg">
                    <Card className="p-6 sm:p-10 space-y-mx-md border-none shadow-mx-lg bg-white">
                        <header className="flex items-center gap-mx-sm border-b border-border-default pb-6">
                            <div className="w-mx-10 h-mx-10 sm:w-mx-14 sm:h-mx-14 rounded-mx-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-inner shrink-0" aria-hidden="true"><Settings2 size={24} /></div>
                            <Typography variant="h3" className="text-sm sm:text-lg font-black uppercase">Unidade Alvo</Typography>
                        </header>

                        <div className="space-y-mx-xs">
                            <Typography variant="tiny" tone="muted" className="ml-2 font-black uppercase tracking-widest text-[8px]">Selecionar Loja</Typography>
                            <div className="relative group">
                                <select
                                    value={selectedStoreId}
                                    onChange={(e) => handleStoreChange(e.target.value)}
                                    className="w-full h-mx-12 sm:h-mx-14 px-4 sm:px-6 bg-surface-alt border border-border-default rounded-mx-xl text-xs sm:text-sm font-bold text-text-primary outline-none focus:border-brand-primary appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione...</option>
                                    {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                </select>
                                <ChevronDown size={16} className="absolute right-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                            </div>
                        </div>

                        {selectedStoreId && (
                            <div className="pt-6 border-t border-border-default">
                                <Badge variant="success" className="w-full justify-center py-2 rounded-mx-lg font-black uppercase text-[10px]">ATIVA E OPERACIONAL</Badge>
                            </div>
                        )}
                    </Card>
                </aside>

                <section className="lg:col-span-8 flex flex-col gap-mx-lg" aria-live="polite">
                    {!selectedStoreId ? (
                        <div className="min-h-[300px] border-2 border-dashed border-border-default rounded-mx-3xl bg-white flex flex-col items-center justify-center text-center p-10 group hover:bg-surface-alt transition-all">
                            <div className="w-mx-20 h-mx-20 rounded-mx-3xl bg-surface-alt flex items-center justify-center mb-6 border border-border-default group-hover:scale-110 transition-transform">
                                <Filter size={32} className="text-text-tertiary group-hover:text-brand-primary" />
                            </div>
                            <Typography variant="h2" className="text-lg mb-2 uppercase font-black">Seleção Obrigatória</Typography>
                            <Typography variant="p" tone="muted" className="max-w-xs uppercase font-black text-[8px] tracking-widest opacity-40">Escolha uma unidade tática para liberar governança.</Typography>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-mx-lg">
                            <Card className="p-6 sm:p-14 relative overflow-hidden group border-none shadow-mx-xl bg-white">
                                <div className="absolute top-mx-0 right-mx-0 w-mx-96 h-mx-96 bg-brand-primary/5 rounded-mx-full blur-3xl -mr-48 -mt-48" />
                                <div className="relative z-10">
                                    <header className="flex items-center gap-mx-sm mb-10 border-b border-border-default pb-6">
                                        <div className="w-mx-12 h-mx-12 sm:w-mx-2xl rounded-mx-2xl bg-brand-secondary text-white flex items-center justify-center shadow-mx-xl shrink-0"><Target size={24} /></div>
                                        <div>
                                            <Typography variant="h2" className="text-lg sm:text-2xl uppercase tracking-tighter">Meta Mensal</Typography>
                                            <Typography variant="caption" tone="muted" className="text-[8px] sm:text-xs font-black uppercase opacity-40">OBJETIVO NOMINAL DE SELL-OUT</Typography>
                                        </div>
                                    </header>

                                    <div className="flex flex-col sm:flex-row items-center gap-mx-lg">
                                        <div className="flex-1 w-full relative bg-surface-alt p-6 sm:p-10 rounded-mx-2xl shadow-inner border border-border-default">
                                            <input
                                                type="text" inputMode="numeric"
                                                value={storeMeta}
                                                onChange={(e) => { if (!canEdit) return; setStoreMeta(Number(e.target.value.replace(/\D/g, '')) || 0); setHasChanges(true) }}
                                                disabled={!canEdit}
                                                className="w-full text-6xl sm:text-8xl font-black tracking-tighter text-text-primary bg-transparent text-center focus:outline-none font-mono-numbers disabled:opacity-50"
                                            />
                                            <div className="mt-4 text-center"><Typography variant="tiny" tone="muted" className="font-black uppercase tracking-mx-widest text-[8px]">UNIDADES COMERCIAIS</Typography></div>
                                        </div>
                                        <Card className="bg-brand-primary p-6 sm:p-10 text-white w-full sm:w-72 shadow-mx-xl flex flex-col justify-center items-center text-center border-none rounded-mx-2xl">
                                            <TrendingUp size={32} className="mb-4 opacity-30" />
                                            <Typography variant="p" tone="white" className="text-[10px] font-black italic uppercase leading-relaxed opacity-80">"Metas agressivas pautadas no histórico."</Typography>
                                        </Card>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 sm:p-14 border-none shadow-mx-lg bg-white">
                                <header className="flex items-center gap-mx-sm mb-10 border-b border-border-default pb-6">
                                    <div className="w-mx-12 h-mx-12 sm:w-mx-2xl rounded-mx-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner shrink-0"><Zap size={24} /></div>
                                    <div>
                                        <Typography variant="h2" className="text-lg sm:text-2xl uppercase tracking-tighter">Matriz de Benchmarks</Typography>
                                        <Typography variant="caption" tone="muted" className="text-[8px] sm:text-xs font-black uppercase opacity-40">TAXAS OFICIAIS (20/60/33)</Typography>
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-mx-lg">
                                    {[
                                        { label: 'Lead → Agd', field: 'lead_to_agend', icon: Users, tone: 'brand' },
                                        { label: 'Agd → Visita', field: 'agend_to_visit', icon: Calendar, tone: 'warning' },
                                        { label: 'Visita → Vnd', field: 'visit_to_sale', icon: TrendingUp, tone: 'success' },
                                    ].map(b => (
                                        <Card key={b.field} className="p-6 bg-surface-alt border border-border-default hover:bg-white transition-all shadow-inner rounded-mx-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className={cn(
                                                    "w-mx-10 h-mx-10 rounded-mx-xl border flex items-center justify-center shadow-mx-sm",
                                                    b.tone === 'brand' ? 'bg-mx-indigo-50 border-mx-indigo-100 text-brand-primary' :
                                                    b.tone === 'success' ? 'bg-status-success-surface border-mx-emerald-100 text-status-success' :
                                                    'bg-status-warning-surface border-mx-amber-100 text-status-warning'
                                                )}><b.icon size={18} /></div>
                                                <div className="flex items-baseline gap-1">
                                                    <input
                                                        type="text" inputMode="numeric"
                                                        value={storeBench[b.field as keyof typeof storeBench]}
                                                        onChange={(e) => { if (!canEdit) return; setStoreBench(prev => ({ ...prev, [b.field]: Number(e.target.value.replace(/\D/g, '')) || 0 })); setHasChanges(true) }}
                                                        disabled={!canEdit}
                                                        className="w-12 text-2xl font-black tracking-tighter text-text-primary bg-transparent text-right outline-none font-mono-numbers"
                                                    />
                                                    <Typography variant="h3" tone="muted" className="text-sm">%</Typography>
                                                </div>
                                            </div>
                                            <Typography variant="caption" tone="muted" className="font-black uppercase tracking-widest text-[8px]">{b.label}</Typography>
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
