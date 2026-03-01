import { useStores } from '@/hooks/useTeam'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useGlobalRanking } from '@/hooks/useRanking'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Store, Car, Target, TrendingUp, Award, Activity, Users, Plus, Upload, Calendar } from 'lucide-react'

export default function PainelConsultor() {
    const { stores, loading: storesLoading } = useStores()
    const { goals, loading: goalsLoading } = useAllStoreGoals()
    const { ranking } = useGlobalRanking()
    const [storeSales, setStoreSales] = useState<Record<string, { total: number; porta: number; cart: number; net: number }>>({})

    useEffect(() => {
        async function fetchSales() {
            const now = new Date()
            const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
            const { data } = await supabase.from('daily_checkins').select('store_id, vnd_porta, vnd_cart, vnd_net').gte('date', start)
            if (!data) return
            const map: Record<string, { total: number; porta: number; cart: number; net: number }> = {}
            for (const c of data) {
                if (!map[c.store_id]) map[c.store_id] = { total: 0, porta: 0, cart: 0, net: 0 }
                map[c.store_id].total += (c.vnd_porta || 0) + (c.vnd_cart || 0) + (c.vnd_net || 0)
                map[c.store_id].porta += c.vnd_porta || 0
                map[c.store_id].cart += c.vnd_cart || 0
                map[c.store_id].net += c.vnd_net || 0
            }
            setStoreSales(map)
        }
        fetchSales()
    }, [])

    const totalSales = Object.values(storeSales).reduce((s, v) => s + v.total, 0)
    const totalMeta = goals.reduce((s, g) => s + g.target, 0)
    const pctGlobal = totalMeta > 0 ? Math.round((totalSales / totalMeta) * 100) : 0

    if (storesLoading || goalsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Carregando painel...</p>
            </div>
        )
    }

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar matching SugarCRM Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">Dashboard Resumo</h1>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex -space-x-3 mr-4">
                        <img src="https://i.pravatar.cc/150?img=1" className="w-10 h-10 rounded-full border-2 border-white relative z-50" />
                        <img src="https://i.pravatar.cc/150?img=2" className="w-10 h-10 rounded-full border-2 border-white relative z-40 opacity-90" />
                        <img src="https://i.pravatar.cc/150?img=3" className="w-10 h-10 rounded-full border-2 border-white relative z-30 opacity-80" />
                        <div className="w-10 h-10 rounded-full border-2 border-white relative z-20 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{stores.length}</div>
                    </div>

                    <button className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                        <Plus size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                        <Upload size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                        <Calendar size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full shrink-0">

                {/* Left Section (Global KPIs inside one large block) */}
                <div className="inner-card p-5 sm:p-8 flex flex-col gap-6 w-full lg:col-span-1">
                    <h2 className="text-xl font-bold text-[#1A1D20] mb-2">Visão Geral Mês Atual</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#F8FAFC] rounded-[1.5rem] p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <Store size={20} className="text-gray-500" />
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Lojas</p>
                            <p className="text-3xl font-extrabold text-[#1A1D20]">{stores.length}</p>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-[1.5rem] p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <Car size={20} className="text-blue-500" />
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Vendas</p>
                            <p className="text-3xl font-extrabold text-[#1A1D20]">{totalSales}</p>
                        </div>
                    </div>

                    <div className="bg-black text-white rounded-[1.5rem] p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <Target size={20} className="text-white/80" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest leading-none mb-2">Meta Global</p>
                            <div className="flex items-baseline gap-3 mb-4">
                                <p className="text-4xl font-extrabold text-white">{pctGlobal}%</p>
                                <p className="text-sm font-semibold text-white/70">/ {totalMeta} un.</p>
                            </div>
                            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pctGlobal, 100)}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-white rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section (Stores list inside horizontal blocks) */}
                <div className="inner-card p-5 sm:p-8 lg:col-span-2 flex flex-col w-full h-full overflow-hidden min-w-0">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#1A1D20]">Performance por Loja</h2>
                        <button className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-4 py-2 hover:bg-gray-200 transition-colors">Ver todas</button>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 snap-x flex gap-4 no-scrollbar">
                        {stores.map((store, i) => {
                            const sales = storeSales[store.id] || { total: 0, porta: 0, cart: 0, net: 0 }
                            const goal = goals.find(g => g.store_id === store.id)
                            const meta = goal?.target || 0
                            const pct = meta > 0 ? Math.round((sales.total / meta) * 100) : 0

                            return (
                                <motion.div key={store.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                    className="bg-[#F8FAFC] border border-gray-100 rounded-[2rem] p-6 shrink-0 w-[280px] snap-center flex flex-col justify-between">

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 border border-gray-100">
                                            {store.name.charAt(0)}
                                        </div>
                                        {pct >= 100 ? (
                                            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-full"><TrendingUp size={16} /></div>
                                        ) : (
                                            <div className="bg-orange-100 text-orange-700 p-2 rounded-full"><Target size={16} /></div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="font-bold text-[#1A1D20] text-lg leading-tight mb-1 truncate">{store.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-2xl text-[#1A1D20]">{sales.total}</span>
                                            <span className="text-xs font-bold text-gray-400">/ {meta}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <span className="bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-500 px-3 py-1.5 rounded-full shadow-sm">{sales.porta} Fís</span>
                                        <span className="bg-white border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-500 px-3 py-1.5 rounded-full shadow-sm">{sales.net} Net</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* Bottom Full Width block for Ranking */}
            {ranking.length > 0 && (
                <div className="inner-card p-5 sm:p-8 w-full shrink-0">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-[#1A1D20]">Top 10 Global</h2>
                        <div className="flex gap-2">
                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">M</span>
                            <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">A</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {ranking.slice(0, 10).map((r, i) => (
                            <motion.div key={r.user_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                className="bg-[#F8FAFC] border border-gray-100 rounded-[2rem] p-5 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-white relative
                                           ${i === 0 ? 'bg-black' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-200 text-gray-600'}`}>
                                        {i + 1}
                                        {i < 3 && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border-2 border-[#F8FAFC] rounded-full flex items-center justify-center"><Award size={10} className="text-black" /></div>}
                                    </div>
                                    <div className="flex flex-col overflow-hidden max-w-[100px]">
                                        <span className="font-bold text-[#1A1D20] text-sm truncate">{r.user_name.split(' ')[0]}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">{r.store_name}</span>
                                    </div>
                                </div>
                                <div className="bg-white border text-center border-gray-100 w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-sm">
                                    <span className="font-extrabold text-[#1A1D20]">{r.vnd_total}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}
