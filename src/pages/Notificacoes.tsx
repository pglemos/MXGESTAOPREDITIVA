import { useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, Check, Zap, AlertCircle, Info, Calendar } from 'lucide-react'

export default function Notificacoes() {
    const { notifications, loading, markRead } = useNotifications()

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] soft-card h-full">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Alertas...</p>
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
                            Central de Alertas
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">System Notifications • {notifications.filter(n => !n.read).length} Unread</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button
                        className="flex items-center justify-center gap-3 px-8 py-5 rounded-[2rem] bg-white border border-gray-100 text-[#1A1D20] font-black hover:bg-gray-50 hover:shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] shadow-sm"
                    >
                        <Check size={18} /> Marcar Todas Lidas
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 shrink-0 pb-20">
                {notifications.length === 0 ? (
                    <div className="col-span-full py-40 rounded-[4rem] text-center inner-card flex flex-col items-center justify-center border-dashed border-2 border-gray-200 bg-gray-50/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />
                        <div className="w-32 h-32 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <Bell size={56} className="text-gray-200" />
                        </div>
                        <h3 className="text-4xl font-black text-[#1A1D20] mb-4 tracking-tighter">Zero Alertas</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                            O sistema não encontrou nenhuma notificação pendente no momento.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => !n.read && markRead(n.id)}
                                    className={`relative rounded-[2.5rem] p-8 border hover:-translate-y-1 transition-all cursor-pointer group flex flex-col md:flex-row gap-6 md:items-center overflow-hidden ${n.read
                                            ? 'bg-white border-gray-100 shadow-sm opacity-60 hover:opacity-100'
                                            : 'bg-indigo-50/30 border-indigo-100 shadow-[0_15px_40px_-15px_rgba(79,70,229,0.15)]'
                                        }`}
                                >
                                    {/* Action indicator line */}
                                    {!n.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-r-md" />
                                    )}

                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform ${n.read ? 'bg-[#F8FAFC] text-gray-400 border border-gray-100' : 'bg-white text-indigo-600 border border-indigo-100 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.3)]'
                                        }`}>
                                        {n.title === 'alert' ? <AlertCircle size={28} /> :
                                            n.title === 'system' ? <Zap size={28} /> :
                                                <Info size={28} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className={`font-black text-xl tracking-tight truncate ${n.read ? 'text-[#1A1D20]' : 'text-indigo-900'}`}>
                                                {n.title}
                                            </h3>
                                            {!n.read && (
                                                <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-indigo-100/50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-200 shrink-0">
                                                    Novo
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm font-bold leading-relaxed line-clamp-2 ${n.read ? 'text-gray-500' : 'text-indigo-800/70'}`}>
                                            {n.message}
                                        </p>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex md:flex-col items-center justify-between md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 md:pl-6 md:border-l">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-[#F8FAFC] px-4 py-2 rounded-full border border-gray-100">
                                            <Calendar size={12} />
                                            {new Date(n.sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">
                                            {new Date(n.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    )
}
