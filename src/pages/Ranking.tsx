import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { motion, AnimatePresence } from 'motion/react'
import { Trophy, TrendingUp, Target, Medal, Star, Crown, ChevronRight, User, Award, Sparkles, Zap, Flame } from 'lucide-react'

export default function Ranking() {
    const { profile } = useAuth()
    const { ranking, loading } = useRanking()

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-black tracking-widest uppercase">Processando Metadados de Performance...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-50 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Hall da Fama</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">Elite & Performance Intelligence</p>
                    </div>
                </div>
                <div className="flex w-full items-center gap-4 shrink-0 lg:w-auto">
                    <div className="flex w-full items-center justify-center gap-3 rounded-[2rem] border border-gray-100 bg-white px-6 py-5 shadow-sm lg:w-auto">
                        <Trophy size={18} className="text-amber-500" />
                        <span className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">{ranking.length} Competidores Ativos</span>
                    </div>
                </div>
            </div>

            {ranking.length === 0 ? (
                <div className="inner-card p-24 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/20 rounded-[4.5rem]">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center mb-8 shadow-2xl border border-gray-50 ring-8 ring-gray-100/30">
                        <Medal size={50} className="text-gray-200" />
                    </div>
                    <h3 className="text-3xl font-black text-[#1A1D20] mb-3 tracking-tighter">Temporada em Análise</h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-black text-[10px] uppercase tracking-[0.2em] leading-loose opacity-60">O ranking será atualizado assim que os primeiros dados forem processados.</p>
                </div>
            ) : (
                <div className="grid gap-8 shrink-0 pb-16">
                    <AnimatePresence>
                        {ranking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop3 = i < 3

                            return (
                                <motion.div
                                    key={r.user_id}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`inner-card p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12 transition-all relative group overflow-hidden border ${isMe ? 'border-indigo-500 bg-indigo-50/20 shadow-2xl shadow-indigo-500/10 z-20 ring-4 ring-indigo-500/5' :
                                        isTop3 ? 'border-gray-100 bg-white hover:shadow-2xl hover:-translate-y-2' :
                                            'border-gray-50 bg-white/50 hover:bg-white hover:shadow-xl'
                                        }`}
                                >
                                    {isTop3 && (
                                        <div className={`absolute right-0 top-0 w-64 h-64 ${i === 0 ? 'bg-amber-100/30' : i === 1 ? 'bg-gray-100/30' : 'bg-orange-100/30'} rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32`} />
                                    )}

                                    <div className="flex min-w-0 flex-1 flex-col gap-8 sm:flex-row sm:items-center lg:gap-12">
                                        {/* Position Component */}
                                        <div className="relative flex min-w-0 flex-shrink-0 flex-col items-center justify-center sm:min-w-[100px]">
                                            {i === 0 ? (
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white group-hover:scale-110 transition-transform group-hover:rotate-3">
                                                        <span className="text-4xl font-black text-white italic tracking-tighter">1º</span>
                                                    </div>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-500 drop-shadow-lg animate-bounce">
                                                        <Crown size={32} className="fill-amber-500" />
                                                    </div>
                                                </div>
                                            ) : i === 1 ? (
                                                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-gray-300 to-gray-500 flex items-center justify-center shadow-xl shadow-gray-400/30 border-4 border-white group-hover:scale-105 transition-transform">
                                                    <span className="text-3xl font-black text-white italic tracking-tighter">2º</span>
                                                </div>
                                            ) : i === 2 ? (
                                                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-[#CD7F32] to-[#A0522D] flex items-center justify-center shadow-xl shadow-orange-500/20 border-4 border-white group-hover:scale-105 transition-transform">
                                                    <span className="text-3xl font-black text-white italic tracking-tighter">3º</span>
                                                </div>
                                            ) : (
                                                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black text-2xl border ${isMe ? 'bg-[#1A1D20] text-white border-transparent' : 'bg-gray-50 text-gray-300 border-gray-100 opacity-60'}`}>
                                                    {r.position}
                                                </div>
                                            )}
                                        </div>

                                        {/* Detail Component */}
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                                                <h3 className={`break-words text-2xl font-black leading-none tracking-tighter sm:text-3xl ${isMe ? 'text-indigo-900' : 'text-[#1A1D20]'}`}>
                                                    {r.user_name}
                                                </h3>
                                                {isMe && (
                                                    <div className="flex items-center gap-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-indigo-600/30 self-start sm:self-auto">
                                                        <Star size={12} className="fill-white" /> Seu Perfil
                                                    </div>
                                                )}
                                                {i === 0 && (
                                                    <div className="flex items-center gap-2 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-amber-500/20 self-start sm:self-auto">
                                                        <Flame size={12} className="fill-white" /> On Fire
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2 bg-gray-50/80 border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-inner">
                                                    <Zap size={14} className="text-indigo-500" /> {r.leads} Leads
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50/80 border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-inner">
                                                    <TrendingUp size={14} className="text-emerald-500" /> {r.agd_total} Agd
                                                </div>
                                                <div className="flex items-center gap-2 bg-gray-50/80 border border-gray-100 px-4 py-2 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-inner">
                                                    <Target size={14} className="text-amber-500" /> {r.visitas} Visitas
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Component */}
                                    <div className="flex w-full flex-col gap-8 border-t border-gray-50 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-12 lg:w-auto lg:justify-end lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
                                        <div className="flex flex-col items-start lg:items-end">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 leading-none opacity-60">Resultados</p>
                                            <div className="flex items-center gap-4">
                                                <div className="text-left lg:text-right">
                                                    <p className={`text-5xl font-black tracking-tighter leading-none sm:text-6xl ${isTop3 ? 'text-[#1A1D20]' : 'text-gray-400'}`}>
                                                        {r.vnd_total}
                                                    </p>
                                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1 opacity-60">Vendas Mes</p>
                                                </div>
                                                <ChevronRight size={32} className="text-gray-100 group-hover:text-indigo-100 transition-colors hidden xl:block" />
                                            </div>
                                        </div>

                                        {r.meta > 0 && (
                                            <div className="flex min-w-0 flex-col items-start text-left sm:min-w-[120px] sm:items-end sm:text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 leading-none opacity-60">Eficiência</p>
                                                <div className="flex flex-col items-end gap-3">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={`text-3xl font-black tracking-tighter ${r.atingimento >= 100 ? 'text-emerald-500' : r.atingimento >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                            {r.atingimento}%
                                                        </span>
                                                    </div>
                                                    <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100 shadow-inner">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(r.atingimento, 100)}%` }}
                                                            transition={{ duration: 1.5, ease: "circOut" }}
                                                            className={`h-full rounded-full ${r.atingimento >= 100 ? 'bg-emerald-500' : r.atingimento >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
