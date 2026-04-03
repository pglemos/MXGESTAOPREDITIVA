import { useNotifications } from '@/hooks/useData'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, Check, Zap, AlertCircle, Info, Calendar, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Notificacoes() {
    const { notifications, loading, markRead, markAllAsRead, refetch } = useNotifications()

    const handleMarkAll = async () => {
        const promise = markAllAsRead()
        toast.promise(promise, {
            loading: 'Limpando central de alertas...',
            success: 'Todas as notificações marcadas como lidas!',
            error: 'Erro ao processar requisição.'
        })
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full h-full bg-off-white/50 backdrop-blur-xl">
            <div className="w-16 h-16 border-4 border-electric-blue/10 border-t-electric-blue rounded-full animate-spin shadow-xl"></div>
            <p className="mt-6 text-gray-400 text-[10px] font-black tracking-[0.4em] uppercase">Sincronizando Central de Alertas...</p>
        </div>
    )

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="w-full h-full flex flex-col gap-10 md:gap-14 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">
                            Central de Alertas
                        </h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className={cn("w-2 h-2 rounded-full shadow-lg transition-colors", unreadCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60 text-shadow-sm">
                            {unreadCount} Notificações Pendentes
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={() => refetch()}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={handleMarkAll}
                        disabled={unreadCount === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-pure-black text-white font-black hover:bg-black hover:shadow-3xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Check size={18} /> Marcar Todas como Lidas
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 shrink-0 pb-24">
                {notifications.length === 0 ? (
                    <div className="col-span-full py-40 rounded-[4rem] text-center border-dashed border-2 border-gray-200 bg-gray-50/30 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(26,29,32,0.02)_1px,transparent_1px)] bg-[length:32px_32px] pointer-events-none" />
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-gray-100 group-hover:rotate-12 transition-transform duration-500">
                            <Bell size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-pure-black mb-4 tracking-tighter">Zero Alertas</h3>
                        <p className="text-gray-400 text-sm font-bold opacity-80 max-w-sm mx-auto">
                            Sua central de inteligência está limpa. Nenhuma notificação crítica pendente no cluster.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n, i) => (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => !n.read && markRead(n.id)}
                                    className={cn(
                                        "relative rounded-[2.2rem] p-6 sm:p-8 border transition-all flex flex-col md:flex-row gap-6 md:items-center overflow-hidden group",
                                        n.read
                                            ? 'bg-white border-gray-100 shadow-sm opacity-60 hover:opacity-100 grayscale-[0.5] hover:grayscale-0'
                                            : 'bg-white border-indigo-100 shadow-elevation'
                                    )}
                                >
                                    {/* Action indicator line */}
                                    {!n.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-electric-blue" />
                                    )}

                                    {/* Icon */}
                                    <div className={cn(
                                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 transition-all group-hover:rotate-3",
                                        n.read 
                                            ? 'bg-gray-50 text-gray-400 border border-gray-100' 
                                            : 'bg-indigo-50 text-electric-blue border border-indigo-100 shadow-sm'
                                    )}>
                                        {n.title.toLowerCase().includes('alerta') || n.title.toLowerCase().includes('erro') 
                                            ? <AlertCircle size={28} strokeWidth={2.5} /> 
                                            : n.title.toLowerCase().includes('sistema') 
                                                ? <Zap size={28} strokeWidth={2.5} fill="currentColor" className="fill-indigo-200" /> 
                                                : <Info size={28} strokeWidth={2.5} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-2 flex flex-wrap items-center gap-3">
                                            <h3 className={cn(
                                                "font-black text-xl tracking-tight leading-none",
                                                n.read ? 'text-pure-black opacity-60' : 'text-pure-black'
                                            )}>
                                                {n.title}
                                            </h3>
                                            {!n.read && (
                                                <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                                                    Prioridade
                                                </span>
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-sm font-bold leading-relaxed",
                                            n.read ? 'text-gray-400' : 'text-gray-500'
                                        )}>
                                            {n.message}
                                        </p>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex shrink-0 flex-col gap-3 border-t border-gray-50 pt-4 md:border-t-0 md:pt-0 md:items-end">
                                        <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50/50 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                            <Calendar size={12} />
                                            {new Date(n.sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </div>
                                        <span className="text-xs font-black text-gray-300 group-hover:text-gray-400 transition-colors">
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
