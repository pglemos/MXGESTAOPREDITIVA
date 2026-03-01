import { useMyCheckins } from '@/hooks/useCheckins'
import { calcularTotais } from '@/lib/calculations'
import { motion } from 'motion/react'
import { History, Calendar, Car, Users, Globe, Eye, Phone } from 'lucide-react'

export default function Historico() {
    const { checkins, loading } = useMyCheckins()

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                    <History size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Meu Histórico</h1>
                    <p className="text-white/40 text-sm">{checkins.length} check-in{checkins.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {checkins.length === 0 ? (
                <div className="text-center py-16 text-white/40">
                    <History size={48} className="mx-auto mb-4 opacity-30" />
                    <p>Nenhum check-in encontrado</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {checkins.map((c, i) => {
                        const totals = calcularTotais(c)
                        const date = new Date(c.date + 'T12:00:00')
                        return (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-white/40" />
                                        <span className="text-white font-medium text-sm">
                                            {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    {totals.vnd_total > 0 && (
                                        <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">
                                            {totals.vnd_total} venda{totals.vnd_total > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {c.zero_reason && (
                                        <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">{c.zero_reason}</span>
                                    )}
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="bg-violet-500/10 rounded-xl p-2">
                                        <Phone size={12} className="text-violet-400 mx-auto mb-0.5" />
                                        <p className="text-lg font-bold text-white">{c.leads}</p>
                                        <p className="text-[9px] text-white/40">Leads</p>
                                    </div>
                                    <div className="bg-blue-500/10 rounded-xl p-2">
                                        <Calendar size={12} className="text-blue-400 mx-auto mb-0.5" />
                                        <p className="text-lg font-bold text-white">{totals.agd_total}</p>
                                        <p className="text-[9px] text-white/40">AGD</p>
                                    </div>
                                    <div className="bg-amber-500/10 rounded-xl p-2">
                                        <Eye size={12} className="text-amber-400 mx-auto mb-0.5" />
                                        <p className="text-lg font-bold text-white">{c.visitas}</p>
                                        <p className="text-[9px] text-white/40">Visitas</p>
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-xl p-2">
                                        <Car size={12} className="text-emerald-400 mx-auto mb-0.5" />
                                        <p className="text-lg font-bold text-white">{totals.vnd_total}</p>
                                        <p className="text-[9px] text-white/40">Vendas</p>
                                    </div>
                                </div>

                                {/* Channel breakdown on expansion */}
                                <div className="mt-2 grid grid-cols-3 gap-1">
                                    <div className="text-center text-[10px] text-white/30">P:{c.vnd_porta} C:{c.vnd_cart} I:{c.vnd_net}</div>
                                    <div className="text-center text-[10px] text-white/30">AC:{c.agd_cart} AI:{c.agd_net}</div>
                                    {c.note && <div className="text-right text-[10px] text-white/30 truncate">💬 {c.note}</div>}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
