import { useStores } from '@/hooks/useTeam'
import { useAllStoreGoals } from '@/hooks/useGoals'
import { useGlobalRanking } from '@/hooks/useRanking'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Store, Car, Target, TrendingUp, Award, Activity, Users, Globe, Building2, ChevronRight, LayoutDashboard, Zap } from 'lucide-react'

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

    if (storesLoading || goalsLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Nodes...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-[#1A1D20]">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Visão Global
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Operation Hub • Network Status</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex items-center -space-x-4 mr-2 md:mr-6">
                        {stores.slice(0, 4).map((s, i) => (
                            <div key={s.id} className="w-12 h-12 rounded-full border-4 border-white bg-[#F8FAFC] flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm relative z-50 hover:z-50 hover:-translate-y-2 transition-all group cursor-default">
                                {s.name.charAt(0)}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                                <span className="absolute -top-10 bg-[#1A1D20] text-white text-[8px] tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {s.name}
                                </span>
                            </div>
                        ))}
                        {stores.length > 4 && (
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm relative z-40">
                                +{stores.length - 4}
                            </div>
                        )}
                    </div>
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-5 rounded-[2rem] bg-white border border-gray-100 font-black text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 hover:text-[#1A1D20] hover:shadow-xl transition-all shadow-sm active:scale-95 group">
                        <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" /> Ver Relatório
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 shrink-0 pb-20">

                {/* Left Section: Global Stats */}
                <div className="lg:col-span-4 flex flex-col gap-10">
                    <div className="inner-card p-0 bg-white border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col h-full rounded-[2.5rem]">
                        <div className="p-8 border-b border-gray-50 flex items-center gap-4 bg-[#F8FAFC]">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                <Globe size={24} />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black text-[#1A1D20] tracking-tight">Consolidado da Rede</h2>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-80">Métricas Principais</p>
                            </div>
                        </div>

                        <div className="p-8 pb-4 flex-1">
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-[#F8FAFC] border border-gray-100 rounded-[2rem] p-6 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all group flex flex-col justify-between h-36">
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <Building2 size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Ativas</p>
                                        <p className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none">{stores.length}</p>
                                    </div>
                                </div>
                                <div className="bg-[#F8FAFC] border border-gray-100 rounded-[2rem] p-6 hover:bg-white hover:border-emerald-100 hover:shadow-xl transition-all group flex flex-col justify-between h-36">
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <Car size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Sellout</p>
                                        <p className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none">{totalSales}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1A1D20] text-white rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/30 transition-colors" />
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none opacity-50" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                            <Target size={20} className="text-indigo-400" />
                                        </div>
                                        <span className="text-[8px] font-black text-indigo-300 bg-indigo-900/50 px-3 py-1.5 rounded-full uppercase tracking-[0.3em] border border-indigo-800/50 shadow-inner">Goal Tracking</span>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 leading-tight">Alinhamento Global</p>
                                        <div className="flex items-end gap-3 mb-6">
                                            <p className="text-6xl font-black tracking-tighter text-white leading-none">{pctGlobal}%</p>
                                            <div className="flex flex-col pb-1">
                                                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Pacing</span>
                                                <span className="text-[9px] font-bold text-white/30 tracking-widest">{totalMeta} un. originais</span>
                                            </div>
                                        </div>
                                        <div className="h-3.5 w-full bg-[#0F1113] rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(pctGlobal, 100)}%` }}
                                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-400 rounded-full relative"
                                            >
                                                <div className="absolute top-0 bottom-0 right-0 w-4 bg-white/20 blur-sm" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Multi-Store Grid */}
                <div className="lg:col-span-8 flex flex-col">
                    <div className="inner-card p-0 bg-transparent border-none flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none mb-1">Nodes Operacionais</h2>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Performance Individual</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-100 rounded-full p-1.5 shadow-sm">
                                <button className="px-5 py-2.5 rounded-full bg-[#1A1D20] text-white text-[10px] font-black uppercase tracking-widest shadow-md">Grade</button>
                                <button className="px-5 py-2.5 rounded-full text-gray-400 hover:text-[#1A1D20] text-[10px] font-black uppercase tracking-widest transition-colors">Lista</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto no-scrollbar">
                            {stores.map((store, i) => {
                                const sales = storeSales[store.id] || { total: 0, porta: 0, cart: 0, net: 0 }
                                const goal = goals.find(g => g.store_id === store.id)
                                const meta = goal?.target || 0
                                const pct = meta > 0 ? Math.round((sales.total / meta) * 100) : 0

                                return (
                                    <motion.div
                                        key={store.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:border-indigo-100 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.1)] transition-all group relative overflow-hidden flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-[1.5rem] bg-[#F8FAFC] border border-gray-100 flex items-center justify-center font-black text-[#1A1D20] text-xl shadow-inner group-hover:bg-[#1A1D20] group-hover:text-white transition-colors transform group-hover:rotate-6">
                                                    {store.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <h3 className="font-black text-[#1A1D20] text-xl tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase">{store.name}</h3>
                                                    <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span className="text-[9px] font-black tracking-widest uppercase">Node Ativo</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center bg-[#F8FAFC] text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-auto relative z-10">
                                            <div className="bg-[#F8FAFC] rounded-[1.8rem] p-5 border border-gray-50 flex flex-col justify-between group-hover:bg-white transition-colors">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <Car size={10} /> Sellout
                                                </span>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-black text-3xl text-[#1A1D20] tracking-tighter">{sales.total}</span>
                                                    <span className="text-[10px] font-bold text-gray-300 tracking-widest">/ {meta}</span>
                                                </div>
                                            </div>
                                            <div className={`rounded-[1.8rem] p-5 border flex flex-col justify-between transition-colors ${pct >= 100
                                                    ? 'bg-emerald-50 border-emerald-100 group-hover:bg-emerald-100/50'
                                                    : pct >= 80
                                                        ? 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-100/50'
                                                        : 'bg-amber-50 border-amber-100 group-hover:bg-amber-100/50'
                                                }`}>
                                                <span className={`text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${pct >= 100 ? 'text-emerald-700' : pct >= 80 ? 'text-indigo-700' : 'text-amber-700'
                                                    }`}>
                                                    <TrendingUp size={10} /> Pacing
                                                </span>
                                                <span className={`font-black text-3xl tracking-tighter ${pct >= 100 ? 'text-emerald-600' : pct >= 80 ? 'text-indigo-600' : 'text-amber-600'
                                                    }`}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Ranking Section */}
            {ranking.length > 0 && (
                <div className="inner-card p-10 md:p-14 bg-white border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] mt-4 relative overflow-hidden">
                    <div className="absolute -left-32 -top-32 w-80 h-80 bg-amber-50/50 rounded-full blur-[80px] pointer-events-none" />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner text-indigo-600">
                                <Award size={28} />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-3xl font-black text-[#1A1D20] tracking-tighter mb-1">Top Performers Global</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Consultores Destaque</p>
                            </div>
                        </div>
                        <div className="bg-[#F8FAFC] border border-gray-100 rounded-full p-1.5 flex gap-1 shadow-sm">
                            {['Week', 'Month', 'Year'].map((t, idx) => (
                                <button key={t} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${idx === 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-[#1A1D20] hover:bg-white'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                        {ranking.slice(0, 5).map((r, i) => (
                            <motion.div
                                key={r.user_id}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`rounded-[2.5rem] p-8 flex flex-col border transition-all relative overflow-hidden group ${i === 0
                                        ? 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-500/10 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2'
                                        : i === 1
                                            ? 'bg-slate-50 border-slate-200 shadow-xl shadow-slate-500/10 hover:shadow-2xl hover:shadow-slate-500/20 hover:-translate-y-2'
                                            : i === 2
                                                ? 'bg-orange-50 border-orange-200 shadow-xl shadow-orange-500/10 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2'
                                                : 'bg-white border-gray-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] hover:border-indigo-100 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.1)] hover:-translate-y-1'
                                    }`}
                            >
                                {i === 0 && <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(245,158,11,0.05)_1px,transparent_1px)] bg-[length:12px_12px] pointer-events-none" />}

                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-sm ${i === 0 ? 'bg-amber-500 text-white shadow-amber-500/30' :
                                            i === 1 ? 'bg-slate-400 text-white shadow-slate-500/30' :
                                                i === 2 ? 'bg-orange-500 text-white shadow-orange-500/30' :
                                                    'bg-[#F8FAFC] text-gray-400 border border-gray-100'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    {i < 3 && (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-amber-100 text-amber-600' :
                                                i === 1 ? 'bg-slate-200 text-slate-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            <Zap size={18} className={i === 0 ? 'animate-pulse' : ''} />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto relative z-10 flex flex-col items-center text-center">
                                    <h3 className="font-black text-[#1A1D20] text-xl tracking-tight mb-1 truncate w-full">{r.user_name.split(' ')[0]}</h3>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-6 truncate max-w-[120px]">{r.store_name}</p>

                                    <div className="w-full bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex flex-col items-center">
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Sellout Total</span>
                                        <span className={`text-4xl font-black tracking-tighter leading-none ${i === 0 ? 'text-amber-600' : i === 1 ? 'text-slate-600' : i === 2 ? 'text-orange-600' : 'text-[#1A1D20]'
                                            }`}>
                                            {r.vnd_total}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
