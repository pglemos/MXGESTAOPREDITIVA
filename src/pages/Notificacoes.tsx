import { useNotifications } from '@/hooks/useData'
import { motion } from 'motion/react'
import { Bell, Check } from 'lucide-react'

export default function Notificacoes() {
    const { notifications, loading, markRead } = useNotifications()

    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                    <Bell size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Notificações</h1>
            </div>

            {notifications.length === 0 ? (
                <p className="text-center text-white/40 py-10">Nenhuma notificação</p>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n, i) => (
                        <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            onClick={() => !n.read && markRead(n.id)}
                            className={`rounded-2xl p-4 border cursor-pointer transition ${n.read ? 'bg-white/[0.02] border-white/5' : 'bg-blue-500/5 border-blue-500/20'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-white font-medium text-sm">{n.title}</p>
                                    <p className="text-white/50 text-xs mt-1">{n.message}</p>
                                </div>
                                {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                            </div>
                            <p className="text-white/30 text-[10px] mt-2">{new Date(n.sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
