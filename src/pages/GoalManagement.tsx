import { useAllStoreGoals } from '@/hooks/useGoals'
import { useStores } from '@/hooks/useTeam'
import { useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { Target, Save, Calendar, Info, Users, ArrowRight, Zap, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Filter, Settings2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

export default function GoalManagement() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, benchmarks, updateGoal, updateBenchmark, loading: goalsLoading } = useAllStoreGoals()
    
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
        setSaving(true)
        try {
            await Promise.all([
                updateGoal(selectedStoreId, storeMeta),
                updateBenchmark(selectedStoreId, storeBench)
            ])
            setHasChanges(false)
            toast.success('Configurações da unidade fixadas!')
        } catch (e) {
            toast.error('Falha ao salvar configurações.')
        } finally {
            setSaving(false)
        }
    }

    if (storesLoading || goalsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-white">
            <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando Matriz de Governança...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 p-4 sm:p-6 md:p-10 overflow-y-auto no-scrollbar bg-white text-pure-black">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-gray-100 pb-10 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-slate-950 rounded-full shadow-lg" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none uppercase">Governança <span className="text-indigo-600">Rede</span></h1>
                    </div>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] pl-6 mt-2">Configuração de Metas e Benchmarks</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSave} 
                        disabled={saving || !hasChanges || !selectedStoreId} 
                        className="h-14 px-10 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all disabled:opacity-30 shadow-xl"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        Firmar Configurações
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Store Selection */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-indigo-600 shadow-sm">
                                <Settings2 size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Unidade Alvo</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Selecionar Loja</label>
                            <select 
                                value={selectedStoreId}
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-indigo-400 transition-all appearance-none cursor-pointer shadow-sm"
                            >
                                <option value="">Selecione a unidade...</option>
                                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {selectedStoreId && (
                            <div className="pt-8 border-t border-gray-200 space-y-6">
                                <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Atual</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-black uppercase">Ativa na Rede</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Configurations */}
                <div className="lg:col-span-8 flex flex-col gap-10">
                    {!selectedStoreId ? (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-10">
                            <Filter size={48} className="text-gray-200 mb-6" />
                            <h3 className="text-2xl font-black text-gray-300 uppercase tracking-tight">Selecione uma unidade</h3>
                            <p className="text-sm font-bold text-gray-400 mt-2">Escolha uma loja à esquerda para gerenciar suas regras de negócio.</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            {/* Meta Card */}
                            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-14 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 rounded-3xl bg-slate-950 text-white flex items-center justify-center shadow-xl transform group-hover:rotate-3 transition-transform">
                                            <Target size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight">Meta Mensal de Vendas</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Objetivo nominal de sell-out</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-8">
                                        <div className="flex-1 w-full">
                                            <input 
                                                type="text" 
                                                inputMode="numeric"
                                                value={storeMeta}
                                                onChange={(e) => { setStoreMeta(Number(e.target.value.replace(/\D/g, '')) || 0); setHasChanges(true) }}
                                                className="w-full text-7xl font-black tracking-tighter text-slate-950 bg-gray-50 border-2 border-transparent rounded-[2rem] py-10 text-center focus:outline-none focus:bg-white focus:border-indigo-200 transition-all font-mono-numbers shadow-inner"
                                            />
                                        </div>
                                        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white w-full sm:w-64 shadow-2xl shadow-indigo-100">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Referência MX</p>
                                            <p className="text-sm font-bold leading-relaxed italic">"Metas agressivas, porém pautadas no histórico de leads da unidade."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Benchmarks Card */}
                            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 md:p-14 shadow-sm">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-inner">
                                        <Zap size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight">Matriz de Benchmarks (20/60/33)</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxas de conversão oficiais para auditoria</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Lead → Agendamento', field: 'lead_to_agend', icon: Users, color: 'text-indigo-600' },
                                        { label: 'Agend. → Visita', field: 'agend_to_visit', icon: Calendar, color: 'text-amber-600' },
                                        { label: 'Visita → Venda', field: 'visit_to_sale', icon: TrendingUp, color: 'text-emerald-600' },
                                    ].map(b => (
                                        <div key={b.field} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 group/item hover:bg-white hover:shadow-xl transition-all">
                                            <div className={cn("w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center mb-6 shadow-sm group-hover/item:scale-110 transition-transform", b.color)}>
                                                <b.icon size={20} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{b.label}</p>
                                            <div className="flex items-baseline gap-2">
                                                <input 
                                                    type="text" 
                                                    inputMode="numeric"
                                                    value={storeBench[b.field as keyof typeof storeBench]}
                                                    onChange={(e) => { setStoreBench(prev => ({ ...prev, [b.field]: Number(e.target.value.replace(/\D/g, '')) || 0 })); setHasChanges(true) }}
                                                    className="w-20 text-4xl font-black tracking-tighter text-slate-950 bg-transparent border-b-2 border-transparent focus:outline-none focus:border-indigo-400 transition-all font-mono-numbers"
                                                />
                                                <span className="text-xl font-black text-gray-300">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
