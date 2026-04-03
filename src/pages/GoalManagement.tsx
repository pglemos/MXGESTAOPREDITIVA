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

    // Sync local state when data loads
    useEffect(() => {
        if (storeGoal) setStoreMeta(storeGoal.target)
        const initialSellers: Record<string, number> = {}
        sellerGoals.forEach(g => { initialSellers[g.user_id] = g.target })
        setSellerMetas(initialSellers)
    }, [storeGoal, sellerGoals])

    const getSellerGoal = useCallback((userId: string) => 
        sellerMetas[userId] ?? 0
    , [sellerMetas])

    // 5. Layout Shift mitigation: useMemo for stats
    const metrics = useMemo(() => {
        const totalIndividual = sellers.reduce((s, v) => s + getSellerGoal(v.id), 0)
        const currentStoreTarget = storeMeta || 0
        const autoMeta = sellers.length > 0 ? Math.round(currentStoreTarget / sellers.length) : 0
        const diff = totalIndividual - currentStoreTarget
        return { totalIndividual, currentStoreTarget, autoMeta, diff }
    }, [sellers, storeMeta, getSellerGoal])

    const handleSave = async () => {
        // 2. Security Check
        if (role !== 'admin' && role !== 'consultor') {
            toast.error('Acesso negado para alteração estratégica.')
            return
        }
        if (!storeId) return

        setSaving(true)
        try {
            // 1. & 9. Grouped updates (Parallel instead of sequential loop)
            const updates = [
                upsertGoal({ store_id: storeId, user_id: null, month: currentMonth, year: currentYear, target: storeMeta })
            ]
            
            for (const s of sellers) {
                const val = getSellerGoal(s.id)
                updates.push(upsertGoal({ store_id: storeId, user_id: s.id, month: currentMonth, year: currentYear, target: val }))
            }

            await Promise.all(updates)
            
            // 17. Refetch to sync dashboard
            await refetchGoals()
            setHasChanges(false)
            toast.success('Planejamento estratégico fixado!')
        } catch (e) {
            toast.error('Falha na persistência dos dados.')
        } finally {
            setSaving(false)
        }
    }

    const monthName = useMemo(() => 
        new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    , [currentMonth, currentYear])

    if (loading || teamLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Matriz de Metas...</p>
        </div>
    )

    return (
        <div className="w-full h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Gestão Estratégica
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Planejamento Mensal • {monthName}</p>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-4 shrink-0 lg:w-auto lg:flex-row lg:items-center">
                    <button className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-100 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 shadow-sm transition-all hover:text-pure-black hover:shadow-md lg:w-auto">
                        <Calendar size={18} /> Alterar Ciclo
                    </button>
                    {/* 4. Disable logic added */}
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="flex w-full items-center justify-center gap-3 rounded-full bg-electric-blue px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 hover:shadow-elevation active:scale-95 lg:w-auto"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Save size={18} /> Firmar Planejamento</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-24">

                {/* Left Column (5/12) */}
                <div className="lg:col-span-5 flex flex-col gap-10">

                    {/* Store Target Input */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-100 transition-transform group-hover:scale-110 group-hover:rotate-3">
                                    <Target size={32} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-pure-black tracking-tighter leading-none mb-1.5">Meta Global</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Objetivo do Cluster</p>
                                </div>
                            </div>

                            <div className="mb-12 relative">
                                <div className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <span className="text-2xl font-black text-gray-200">R$</span>
                                </div>
                                {/* 3. & 14. Fix input logic */}
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={storeMeta}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '')
                                        setStoreMeta(Number(val) || 0)
                                        setHasChanges(true)
                                    }}
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-[2.5rem] py-12 px-8 text-6xl md:text-7xl font-black text-pure-black text-center focus:outline-none focus:bg-white focus:border-electric-blue/30 focus:shadow-2xl transition-all tracking-tighter"
                                />
                                <div className="absolute right-8 bottom-6 pointer-events-none">
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-electric-blue bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 shadow-sm">Target</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50/50 border border-gray-100 rounded-3xl p-6 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Métrica Base</span>
                                    <span className="text-sm font-black text-pure-black">Vendas de Unidades</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Validação</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                        <ShieldCheck size={12} /> OK
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto-suggest Info */}
                    <div className="bg-pure-black rounded-[2.5rem] p-10 flex flex-col gap-10 relative overflow-hidden group shadow-3xl text-white">
                        <div className="absolute inset-0 bg-gradient-to-tr from-electric-blue/20 via-transparent to-transparent z-0" />
                        {/* 16. Zap Icon fix */}
                        <div className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-12 duration-700">
                            <Zap size={200} fill="currentColor" />
                        </div>

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-indigo-500 transition-colors">
                                <Info size={24} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-1">Distribuição Inteligente</h4>
                                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest bg-white/5 py-1 px-3 rounded-full border border-white/5">Insights MX</span>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-t border-white/10 pt-10">
                            <p className="font-bold text-white/60 text-sm leading-relaxed max-w-[220px]">
                                Carga Média Necessária para sustentar o Pacing da Unidade:
                            </p>
                            <div className="flex items-baseline gap-4 shrink-0">
                                <span className="text-7xl font-black text-white tracking-tighter leading-none font-mono-numbers">{metrics.autoMeta}</span>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">atg/user</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (7/12) */}
                <div className="lg:col-span-7 flex flex-col gap-10">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden flex flex-col h-full">

                        {/* Header Matrix */}
                        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-pure-black tracking-tight leading-none mb-2">Matriz Operacional</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Quota Individual por Especialista</p>
                            </div>

                            <div className={cn(
                                "flex items-center gap-5 px-8 py-5 rounded-[2rem] border-2 transition-all shadow-lg group",
                                metrics.diff === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                metrics.diff > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                'bg-rose-50 text-rose-700 border-rose-100'
                            )}>
                                <div className="flex flex-col text-right">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">{metrics.diff === 0 ? 'Equilíbrio' : 'Desvio Calculado'}</p>
                                    <p className="text-base font-black tracking-tight">
                                        {metrics.diff === 0 ? 'Alinhamento Total' : metrics.diff > 0 ? `Superávit: +${metrics.diff}` : `Déficit: ${metrics.diff}`}
                                    </p>
                                </div>
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform",
                                    metrics.diff === 0 ? 'bg-emerald-100/50 text-emerald-600' : 'bg-white text-current'
                                )}>
                                    {metrics.diff === 0 ? <CheckCircle2 size={24} /> : <TrendingUp size={24} />}
                                </div>
                            </div>
                        </div>

                        {/* Sellers List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
                            <AnimatePresence mode="popLayout">
                                {sellers.map((s, i) => (
                                    <motion.div
                                        key={s.id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="flex flex-col sm:flex-row sm:items-center gap-8 p-6 rounded-[2rem] bg-white border border-gray-50 hover:border-indigo-100 hover:shadow-xl transition-all group relative"
                                    >
                                        <div className="flex items-center gap-6 flex-1 min-w-0">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner flex items-center justify-center font-black text-pure-black text-2xl group-hover:bg-pure-black group-hover:text-white transition-all transform group-hover:rotate-3">
                                                {s.name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-pure-black font-black text-xl tracking-tight mb-1 truncate">{s.name}</p>
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Users size={12} strokeWidth={3} className="text-indigo-400" />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">{s.role || 'Especialista'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-8 bg-gray-50/50 rounded-2xl p-4 border border-gray-100 group-hover:bg-white transition-colors">
                                            <div className="flex flex-col items-end px-2">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Ideal</span>
                                                <span className="text-xs font-black text-gray-300 font-mono-numbers">{metrics.autoMeta}</span>
                                            </div>
                                            <div className="w-px h-10 bg-gray-200" />
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={getSellerGoal(s.id)}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, '')
                                                        setSellerMetas(prev => ({ ...prev, [s.id]: Number(val) || 0 }))
                                                        setHasChanges(true)
                                                    }}
                                                    className="w-28 bg-white border-2 border-transparent rounded-xl py-3 text-center text-pure-black font-black text-2xl shadow-sm focus:outline-none focus:border-electric-blue focus:shadow-lg transition-all"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {sellers.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center mb-8">
                                        <Users size={40} className="text-gray-200" />
                                    </div>
                                    <h4 className="text-2xl font-black text-pure-black tracking-tighter mb-2">Vácuo de Especialistas</h4>
                                    <p className="text-gray-400 font-bold text-sm max-w-xs mx-auto">Nenhum consultor ativo localizado nesta unidade operacional.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
