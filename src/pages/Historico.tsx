import { useMyCheckins } from '@/hooks/useCheckins'
import { calcularTotais } from '@/lib/calculations'
import { motion } from 'motion/react'
import { History, Calendar, Car, Users, Globe, Eye, Phone, TrendingUp, MessageSquare, ChevronRight } from 'lucide-react'

export default function Historico() {
    const { checkins, loading } = useMyCheckins()

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 text-sm font-bold tracking-widest uppercase">Processando Histórico...</p>
        </div>
    )

    return (
        <div className="soft-card p-4 sm:p-6 md:p-10 h-full flex flex-col gap-6 md:gap-10 overflow-y-auto no-scrollbar relative text-[#1A1D20] px-4 md:px-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 w-full shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-500 rounded-full" />
                        <h1 className="text-[32px] font-black tracking-tighter">Histórico de Performance</h1>
                    </div>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.2em] pl-5 opacity-60">Registros Consolidados</p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-gray-100 px-6 py-2.5 rounded-full shadow-sm">
                    <History size={18} className="text-indigo-600" />
                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{checkins.length} Lançamentos</span>
                </div>
            </div>

            {checkins.length === 0 ? (
                <div className="inner-card p-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-100 bg-gray-50/30 rounded-[3rem]">
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                        <History size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-2xl font-black text-[#1A1D20] mb-2 tracking-tight">Sem Registros</h3>
                    <p className="text-gray-400 max-w-sm mx-auto font-medium">Você ainda não realizou nenhum check-in neste ciclo. Seus resultados aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                    {checkins.map((c, i) => {
                        const totals = calcularTotais(c)
                        const date = new Date(c.date + 'T12:00:00')

                        return (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="inner-card p-6 border border-gray-100 bg-white hover:shadow-2xl hover:border-indigo-100 transition-all group overflow-hidden"
                            >
                                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 transition-colors">
                                            <Calendar size={20} className="text-indigo-600 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Data do Lançamento</p>
                                            <p className="text-lg font-black tracking-tight text-[#1A1D20]">
                                                {date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                    {totals.vnd_total > 0 ? (
                                        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
                                                {totals.vnd_total} {totals.vnd_total === 1 ? 'VENDA' : 'VENDAS'}
                                            </span>
                                        </div>
                                    ) : c.zero_reason ? (
                                        <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                {c.zero_reason}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:shadow-md transition-all text-center">
                                        <Phone size={14} className="text-indigo-500 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none">{c.leads}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Leads</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:shadow-md transition-all text-center">
                                        <Calendar size={14} className="text-blue-500 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none">{totals.agd_total}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Agd</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:shadow-md transition-all text-center">
                                        <Eye size={14} className="text-amber-500 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none">{c.visitas}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Visitas</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:shadow-md transition-all text-center">
                                        <Car size={14} className="text-emerald-500 mx-auto mb-2" />
                                        <p className="text-2xl font-black text-[#1A1D20] tracking-tighter leading-none">{totals.vnd_total}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Vendas</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 border-t border-gray-100 py-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span className="flex items-center gap-1.5"><Globe size={12} className="text-blue-400" /> Digital: {c.vnd_net}</span>
                                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                                        <span className="flex items-center gap-1.5"><Users size={12} className="text-indigo-400" /> Salão: {c.vnd_porta}</span>
                                    </div>
                                    {c.note && (
                                        <div className="flex items-center gap-2 group/note relative cursor-help">
                                            <MessageSquare size={14} className="text-gray-300" />
                                            <span className="text-[10px] font-bold text-gray-400 italic truncate max-w-[120px]">{c.note}</span>

                                            {/* Tooltip basic */}
                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-[#1A1D20] text-white text-[10px] rounded-xl opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                                                {c.note}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
