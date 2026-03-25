import { useGoals } from '@/hooks/useGoals'
import { useTeam } from '@/hooks/useTeam'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { toast } from 'sonner'
import { Target, Save, Calendar, Info, Users, ArrowRight, Zap, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function GoalManagement() {
    const { storeGoal, sellerGoals, upsertGoal, currentMonth, currentYear, loading } = useGoals()
    const { sellers } = useTeam()
    const { storeId } = useAuth()
    const [storeMeta, setStoreMeta] = useState<number>(storeGoal?.target || 0)
    const [sellerMetas, setSellerMetas] = useState<Record<string, number>>({})
    const [saving, setSaving] = useState(false)

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Metas...</p>
        </div>
    )

    const getSellerGoal = (userId: string) => sellerMetas[userId] ?? sellerGoals.find(g => g.user_id === userId)?.target ?? 0
    const totalIndividual = sellers.reduce((s, v) => s + getSellerGoal(v.id), 0)
    const storeTarget = storeMeta || storeGoal?.target || 0
    const autoMeta = sellers.length > 0 ? Math.round(storeTarget / sellers.length) : 0
    const diff = totalIndividual - storeTarget

    const handleSave = async () => {
        if (!storeId) return
        setSaving(true)
        try {
            await upsertGoal({ store_id: storeId, user_id: null, month: currentMonth, year: currentYear, target: storeMeta || storeGoal?.target || 0 })
            for (const s of sellers) {
                const val = getSellerGoal(s.id)
                if (val > 0) await upsertGoal({ store_id: storeId, user_id: s.id, month: currentMonth, year: currentYear, target: val })
            }
            toast.success('Planejamento estratégico salvo com sucesso!')
        } catch (e) {
            toast.error('Erro ao salvar planejamento. Verifique sua conexão.')
        } finally {
            setSaving(false)
        }
    }

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">

            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Gestão Estratégica
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Planejamento Mensal • {monthName}</p>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-4 shrink-0 lg:w-auto lg:flex-row lg:items-center">
                    <button className="flex w-full items-center justify-center gap-3 rounded-[2rem] border border-gray-100 bg-white px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 shadow-sm transition-all active:scale-95 hover:text-[#1A1D20] hover:shadow-xl group lg:w-auto">
                        <Calendar size={18} className="group-hover:rotate-12 transition-transform" /> Alterar Ciclo
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex w-full items-center justify-center gap-3 rounded-[2rem] bg-indigo-600 px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all disabled:opacity-50 active:scale-95 hover:bg-indigo-700 hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] group/btn lg:w-auto"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} className="group-hover/btn:scale-110 transition-transform" /> Firmar Planejamento</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-20">

                {/* Left Column (5/12) */}
                <div className="lg:col-span-5 flex flex-col gap-10">

                    {/* Store Target Input */}
                    <div className="inner-card p-6 sm:p-8 md:p-12 bg-white border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(79,70,229,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                        <div className="absolute -right-32 -top-32 w-80 h-80 bg-indigo-50/50 rounded-full blur-[100px] z-0 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-50 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-transform">
                                    <Target size={28} className="text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none mb-1">Meta Global</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-80">Objetivo da Unidade</p>
                                </div>
                            </div>

                            <div className="mb-12 group/input relative">
                                <div className="absolute inset-0 bg-indigo-600 opacity-0 group-focus-within/input:opacity-5 transition-opacity rounded-[3rem]" />
                                <input
                                    type="number"
                                    value={storeMeta || storeGoal?.target || 0}
                                    min={0}
                                    onChange={e => setStoreMeta(parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[3rem] px-6 py-10 text-6xl font-black text-[#1A1D20] focus:outline-none focus:bg-white focus:border-indigo-400 focus:shadow-2xl focus:shadow-indigo-500/10 transition-all text-center tracking-tighter shadow-sm sm:px-8 sm:py-16 sm:text-8xl"
                                />
                                <div className="absolute right-8 bottom-8 pointer-events-none">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100/50 block shadow-sm">Target</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-[#F8FAFC] border border-gray-100 rounded-2xl p-6 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Métrica Base</span>
                                    <span className="text-sm font-black text-[#1A1D20]">Veículos Vendidos</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Aprovação</span>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12} /> Auto-Aprovada</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto-suggest Info */}
                    <div className="inner-card p-10 bg-[#1A1D20] flex flex-col gap-8 relative overflow-hidden group shadow-[0_30px_70px_-20px_rgba(0,0,0,0.4)] text-white">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-transparent to-transparent z-0" />
                        <div className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-700">
                            <Zap size={180} />
                        </div>
                        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-600 opacity-20 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-indigo-500/50 transition-colors">
                                <Info size={20} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Distribuição Inteligente</h4>
                                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest bg-white/5 py-0.5 px-2 rounded-md self-start border border-white/5">Sugestão Preditiva</span>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-t border-white/10 pt-8 mt-2">
                            <p className="font-bold text-white/70 text-sm leading-relaxed max-w-[200px]">
                                Base Média Necessária p/ Consultor Ativo:
                            </p>
                            <div className="flex items-baseline gap-3 shrink-0">
                                <span className="text-6xl font-black text-white tracking-tighter leading-none">{autoMeta}</span>
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">atg/user</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (7/12) */}
                <div className="lg:col-span-7 flex flex-col gap-10">
                    <div className="inner-card p-0 bg-white border border-gray-100 shadow-xl shadow-gray-100/30 overflow-hidden flex flex-col h-full">

                        {/* Header Matrix */}
                        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#F8FAFC]">
                            <div className="flex flex-col gap-2">
                                <h3 className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none">Matriz Elitizada</h3>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Objetivos Fixados por Usuário</p>
                            </div>

                            <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] border-2 transition-all shadow-lg ${diff === 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50 shadow-emerald-500/10' : 'bg-amber-50 text-amber-700 border-amber-100/50 shadow-amber-500/10'} group`}>
                                <div className="flex flex-col text-right">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-0.5">{diff === 0 ? 'Status de Risco' : 'Desvio Calculado'}</p>
                                    <p className="text-base font-black tracking-tight">{diff === 0 ? 'Totalmente Alinhado' : diff > 0 ? `Superávit de ${diff}` : `Déficit de ${Math.abs(diff)}`}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${diff === 0 ? 'bg-emerald-100/50 text-emerald-600' : 'bg-amber-100/50 text-amber-600'} group-hover:scale-110 transition-transform`}>
                                    {diff === 0 ? <CheckCircle2 size={24} /> : <TrendingUp size={24} />}
                                </div>
                            </div>
                        </div>

                        {/* Sellers List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                            <AnimatePresence>
                                {sellers.map((s, i) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, scale: 0.98, x: -10 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-[2.5rem] bg-white border border-gray-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex items-center gap-5 flex-1 pl-2">
                                            <div className="w-16 h-16 rounded-[1.8rem] bg-[#F8FAFC] shadow-inner flex items-center justify-center font-black text-[#1A1D20] border border-gray-50 text-2xl group-hover:bg-[#1A1D20] group-hover:text-white transition-all transform group-hover:-rotate-6 group-hover:scale-105">
                                                {s.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[#1A1D20] font-black text-lg tracking-tight mb-1 group-hover:text-indigo-600 transition-colors">{s.name}</p>
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Users size={12} />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">{s.role}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 bg-[#F8FAFC] rounded-[2rem] p-3 border border-gray-50 group-hover:bg-white group-hover:border-indigo-50 transition-colors">
                                            <div className="flex flex-col items-end px-3">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-0.5">Base Eq.</span>
                                                <span className="text-xs font-black text-gray-300">{autoMeta}</span>
                                            </div>
                                            <div className="w-px h-12 bg-gray-200" />
                                            <div className="relative group/field">
                                                <input
                                                    type="number"
                                                    value={getSellerGoal(s.id)}
                                                    min={0}
                                                    placeholder={String(autoMeta)}
                                                    onChange={e => setSellerMetas(prev => ({ ...prev, [s.id]: parseInt(e.target.value) || 0 }))}
                                                    className="w-32 bg-white border-2 border-transparent rounded-[1.5rem] px-5 py-4 text-center text-[#1A1D20] font-black text-2xl shadow-sm focus:outline-none focus:border-indigo-400 focus:shadow-xl transition-all"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {sellers.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center mb-6 shadow-inner">
                                        <Users size={40} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-2xl font-black text-[#1A1D20] tracking-tighter mb-2">Equipe Vazia</h4>
                                    <p className="text-gray-400 font-bold text-sm max-w-sm mx-auto opacity-80">Nenhum consultor ativo encontrado nesta unidade operacional. Adicione usuários antes de planejar as metas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
