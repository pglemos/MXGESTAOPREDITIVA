import { useAllStoreGoals } from '@/hooks/useGoals'
import { useStores } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Target, Save, Calendar, Info, Users, ArrowRight, Zap, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Filter, Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

export default function GoalManagement() {
    const { role } = useAuth()
    const { stores, loading: storesLoading } = useStores()
    const { goals, benchmarks, updateGoal, updateBenchmark, loading: goalsLoading } = useAllStoreGoals()
    const canEditGoal = role === 'admin' || role === 'gerente'
    const canEditBenchmark = role === 'admin'

    const [selectedStoreId, setSelectedStoreId] = useState<string>('')
    const [storeMeta, setStoreMeta] = useState<number>(0)
    const [storeBench, setStoreBench] = useState({
        lead_to_agend: 20,
        agend_to_visit: 60,
        visit_to_sale: 33
    })

    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (selectedStoreId) {
            const goal = goals.find(g => g.store_id === selectedStoreId)
            setStoreMeta(goal?.target || 0)

            const bench = benchmarks.find(b => b.store_id === selectedStoreId)
            if (bench) {
                setStoreBench({
                    lead_to_agend: bench.lead_to_agend,
                    agend_to_visit: bench.agend_to_visit,
                    visit_to_sale: bench.visit_to_sale
                })
            } else {
                setStoreBench({ lead_to_agend: 20, agend_to_visit: 60, visit_to_sale: 33 })
            }
            setHasChanges(false)
        }
    }, [selectedStoreId, goals, benchmarks])

    const handleSave = async () => {
        if (!selectedStoreId) return
        if (!canEditGoal && !canEditBenchmark) {
            toast.error('Seu papel permite acompanhar metas, mas não editar configurações.')
            return
        }
        setSaving(true)
        try {
            const writes = []
            if (canEditGoal) writes.push(updateGoal(selectedStoreId, storeMeta))
            if (canEditBenchmark) writes.push(updateBenchmark(selectedStoreId, storeBench))
            await Promise.all(writes)
            setHasChanges(false)
            toast.success('Configurações da unidade fixadas!')
        } catch (e) {
            toast.error('Falha ao salvar configurações.')
        } finally {
            setSaving(false)
        }
    }

    if (storesLoading || goalsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-white" role="status">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" aria-hidden="true" />
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-500 animate-pulse">Carregando Matriz de Governança...</p>
        </div>
    )

    return (
        <main className="w-full h-full flex flex-col gap-10 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" aria-hidden="true" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase text-slate-950">Governança <span className="text-indigo-600">Rede</span></h1>
                    </div>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] pl-6 mt-2">Configuração de Metas e Benchmarks • Ciclo 2026</p>
                </div>

                <div className="flex items-center gap-4">
                    {(canEditGoal || canEditBenchmark) && (
                        <button
                            onClick={handleSave}
                            disabled={saving || !hasChanges || !selectedStoreId}
                            className="h-14 px-10 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all disabled:opacity-30 shadow-xl focus-visible:ring-4 focus-visible:ring-slate-500/20 outline-none"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                            Firmar Configurações
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Store Selection */}
                <aside className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-10 space-y-8 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-indigo-600 shadow-sm" aria-hidden="true">
                                <Settings2 size={24} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">Unidade Alvo</h2>
                        </div>

                        <div className="space-y-4">
                            <label htmlFor="store-select" className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Selecionar Loja da Rede</label>
                            <select
                                id="store-select"
                                name="store-select"
                                value={selectedStoreId}
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">Selecione a unidade...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                            </select>
                        </div>

                        {selectedStoreId && (
                            <div className="pt-8 border-t border-gray-200 space-y-6">
                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status de Rede</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                                        <span className="text-[10px] font-black uppercase text-slate-700">Ativa e Operacional</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Configurations */}
                <section className="lg:col-span-8 flex flex-col gap-10" aria-labelledby="config-title">
                    <h2 id="config-title" className="sr-only">Painel de Configurações de Performance</h2>
                    {!selectedStoreId ? (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-[3rem] bg-slate-50/50 flex flex-col items-center justify-center text-center p-10 group hover:bg-gray-50 transition-all">
                            <Filter size={48} className="text-gray-300 mb-6 group-hover:text-indigo-600 transition-colors" aria-hidden="true" />
                            <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tight">Seleção Obrigatória</h3>
                            <p className="text-sm font-bold text-gray-500 mt-2 max-w-xs">Escolha uma loja à esquerda para gerenciar as regras de negócio.</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10" aria-live="polite">
                            {/* Meta Card */}
                            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-14 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" aria-hidden="true" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 rounded-3xl bg-slate-950 text-white flex items-center justify-center shadow-xl transform group-hover:rotate-3 transition-transform" aria-hidden="true">
                                            <Target size={28} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight text-slate-950">Meta Mensal de Vendas</h3>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Objetivo nominal de sell-out por unidade</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-8">
                                        <div className="flex-1 w-full relative">
                                            <label htmlFor="input-meta" className="sr-only">Valor da Meta Mensal (Unidades)</label>
                                            <input
                                                id="input-meta"
                                                name="monthly-goal"
                                                type="text"
                                                inputMode="numeric"
                                                value={storeMeta}
                                                onChange={(e) => { if (!canEditGoal) return; setStoreMeta(Number(e.target.value.replace(/\D/g, '')) || 0); setHasChanges(true) }}
                                                disabled={!canEditGoal}
                                                className="w-full text-7xl font-black tracking-tighter text-slate-950 bg-gray-50 border-2 border-transparent rounded-[2rem] py-10 text-center focus:outline-none focus:bg-white focus:border-indigo-300 transition-all font-mono-numbers shadow-inner disabled:cursor-not-allowed disabled:opacity-70"
                                            />
                                            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidades Comerciais</span>
                                        </div>
                                        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white w-full sm:w-64 shadow-2xl shadow-indigo-100 flex flex-col justify-center items-center text-center">
                                            <TrendingUp size={32} className="mb-4 opacity-40" aria-hidden="true" />
                                            <p className="text-sm font-bold leading-relaxed italic">"Metas agressivas, porém pautadas no histórico de leads da unidade."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Benchmarks Card */}
                            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-14 shadow-sm">
                                <div className="flex items-center gap-4 mb-12 border-b border-gray-50 pb-8">
                                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner" aria-hidden="true">
                                        <Zap size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-950">Matriz de Benchmarks (20/60/33)</h3>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Taxas de conversão oficiais para auditoria forense</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8" role="list">
                                    {[
                                        { label: 'Lead → Agendamento', field: 'lead_to_agend', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                        { label: 'Agend. → Visita', field: 'agend_to_visit', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
                                        { label: 'Visita → Venda', field: 'visit_to_sale', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    ].map(b => (
                                        <div key={b.field} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group/item hover:bg-white hover:shadow-xl transition-all" role="listitem">
                                            <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center mb-6 shadow-sm group-hover/item:scale-110 transition-transform", b.bg, b.color)} aria-hidden="true">
                                                <b.icon size={22} strokeWidth={2.5} />
                                            </div>
                                            <label htmlFor={`input-${b.field}`} className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">{b.label}</label>
                                            <div className="flex items-baseline gap-2">
                                                <input
                                                    id={`input-${b.field}`}
                                                    name={b.field}
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={storeBench[b.field as keyof typeof storeBench]}
                                                    onChange={(e) => { if (!canEditBenchmark) return; setStoreBench(prev => ({ ...prev, [b.field]: Number(e.target.value.replace(/\D/g, '')) || 0 })); setHasChanges(true) }}
                                                    disabled={!canEditBenchmark}
                                                    className="w-20 text-4xl font-black tracking-tighter text-slate-950 bg-transparent border-b-2 border-transparent focus:outline-none focus:border-indigo-400 transition-all font-mono-numbers disabled:cursor-not-allowed disabled:opacity-70"
                                                />
                                                <span className="text-xl font-black text-gray-400" aria-hidden="true">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </section>
            </div>
        </main>
    )
}
