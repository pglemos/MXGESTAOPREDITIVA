import { useAuth } from '@/hooks/useAuth'
import { useRanking } from '@/hooks/useRanking'
import { motion } from 'motion/react'
import { Trophy, TrendingUp, Target, Medal } from 'lucide-react'

const medals = ['🥇', '🥈', '🥉']

export default function Ranking() {
    const { profile } = useAuth()
    const { ranking, loading } = useRanking()

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Atualizando Ranking...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative">

            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-[28px] font-extrabold tracking-tight text-[#1A1D20]">Ranking Oficial</h1>
                    <span className="bg-amber-100 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full text-amber-700">{ranking.length} na disputa</span>
                </div>
            </div>

            {ranking.length === 0 ? (
                <div className="inner-card p-20 text-center flex flex-col items-center justify-center border-dashed">
                    <Medal size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-[#1A1D20] mb-2">Nenhum dado de ranking</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">As vendas e check-ins deste ciclo ainda não foram processados pelo sistema.</p>
                </div>
            ) : (
                <div className="space-y-4 shrink-0 pb-10">
                    <div className="flex flex-col gap-4">
                        {ranking.map((r, i) => {
                            const isMe = r.user_id === profile?.id
                            const isTop3 = i < 3

                            let cardStyle = 'bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-[2rem] p-6 hover:shadow-md transition-all'
                            let rankBg = 'bg-[#F8FAFC] text-gray-500 border border-gray-100'

                            if (isMe) {
                                cardStyle = 'bg-blue-50/50 border-2 border-blue-200/60 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(59,130,246,0.1)] relative overflow-hidden transition-all hover:shadow-[0_15px_50px_rgba(59,130,246,0.15)] group'
                            }

                            if (i === 0) rankBg = 'bg-gradient-to-br from-amber-200 to-amber-500 text-white shadow-lg shadow-amber-500/30'
                            else if (i === 1) rankBg = 'bg-gradient-to-br from-gray-200 to-gray-400 text-white shadow-lg shadow-gray-400/30'
                            else if (i === 2) rankBg = 'bg-gradient-to-br from-orange-200 to-orange-400 text-white shadow-lg shadow-orange-500/20'

                            return (
                                <motion.div
                                    key={r.user_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cardStyle}
                                >
                                    {isMe && <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl z-0 pointer-events-none group-hover:bg-blue-400/20 transition-all" />}

                                    <div className={`flex items-center gap-6 relative z-10`}>
                                        {/* Rank Badge */}
                                        <div className="flex-shrink-0">
                                            <div className={`w-14 h-14 flex items-center justify-center rounded-full font-extrabold text-xl ${rankBg}`}>
                                                {isTop3 ? medals[i] : `${r.position}º`}
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="text-[#1A1D20] font-extrabold text-lg truncate tracking-tight">{r.user_name}</p>
                                                {isMe && <span className="text-[10px] uppercase tracking-widest bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold shadow-sm shadow-blue-500/30">Você</span>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 overflow-x-auto pb-1 no-scrollbar">
                                                <span className="flex items-center gap-1.5 whitespace-nowrap bg-[#F8FAFC] border border-gray-100 px-3 py-1.5 rounded-full"><Target size={12} className="text-indigo-500" /> {r.leads} leads</span>
                                                <span className="flex items-center gap-1.5 whitespace-nowrap bg-[#F8FAFC] border border-gray-100 px-3 py-1.5 rounded-full"><TrendingUp size={12} className="text-emerald-500" />  {r.agd_total} agd</span>
                                                <span className="flex items-center gap-1.5 whitespace-nowrap bg-[#F8FAFC] border border-gray-100 px-3 py-1.5 rounded-full truncate"> {r.visitas} visitas</span>
                                            </div>
                                        </div>

                                        {/* Stats Right */}
                                        <div className="flex items-center gap-4 sm:gap-8 shrink-0 pl-6 border-l border-gray-100">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Vendas Totais</p>
                                                <p className="text-3xl font-black text-[#1A1D20] tracking-tighter leading-none">{r.vnd_total}</p>
                                            </div>

                                            {r.meta > 0 && (
                                                <div className="text-right pl-4 sm:pl-8 border-l border-gray-100 hidden sm:block">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Meta</p>
                                                    <p className={`text-xl font-extrabold tracking-tight ${r.atingimento >= 100 ? 'text-emerald-500' : r.atingimento >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                                        {r.atingimento}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
