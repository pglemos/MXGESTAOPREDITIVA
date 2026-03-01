import { useFeedbacks, usePDIs } from '@/hooks/useData'
import { motion } from 'motion/react'
import { useState } from 'react'
import { MessageSquare, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function VendedorFeedback() {
    const [tab, setTab] = useState<'feedbacks' | 'pdis'>('feedbacks')
    const { feedbacks, loading: fbLoading, acknowledge: ackFb } = useFeedbacks()
    const { pdis, loading: pdiLoading, acknowledge: ackPdi } = usePDIs()

    const statusIcon = { aberto: AlertCircle, em_andamento: Clock, concluido: CheckCircle }
    const statusColor = { aberto: 'text-red-400 bg-red-500/10', em_andamento: 'text-amber-400 bg-amber-500/10', concluido: 'text-emerald-400 bg-emerald-500/10' }
    const statusLabel = { aberto: 'Aberto', em_andamento: 'Em andamento', concluido: 'Concluído' }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                    <MessageSquare size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">Feedback & PDI</h1>
            </div>

            <div className="flex gap-2">
                {(['feedbacks', 'pdis'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t ? 'bg-blue-500/20 text-blue-400' : 'text-white/50 hover:bg-white/5'}`}>
                        {t === 'feedbacks' ? 'Feedbacks' : 'PDIs'}
                    </button>
                ))}
            </div>

            {tab === 'feedbacks' ? (
                fbLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div> :
                    feedbacks.length === 0 ? <p className="text-center text-white/40 py-10">Nenhum feedback recebido</p> :
                        <div className="space-y-3">
                            {feedbacks.map((f, i) => (
                                <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/40 text-xs">{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                                        {f.acknowledged ? <span className="text-emerald-400 text-xs">✅ Lido</span> : <span className="text-amber-400 text-xs">Novo</span>}
                                    </div>
                                    <div><p className="text-white/50 text-xs mb-0.5">Pontos Positivos</p><p className="text-emerald-300 text-sm">{f.positives}</p></div>
                                    <div><p className="text-white/50 text-xs mb-0.5">Pontos de Atenção</p><p className="text-amber-300 text-sm">{f.attention_points}</p></div>
                                    <div><p className="text-white/50 text-xs mb-0.5">Ação Sugerida</p><p className="text-blue-300 text-sm">{f.action}</p></div>
                                    {!f.acknowledged && (
                                        <button onClick={async () => { await ackFb(f.id); toast.success('Feedback marcado como lido') }}
                                            className="w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition">
                                            ✅ Li e entendi
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
            ) : (
                pdiLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div> :
                    pdis.length === 0 ? <p className="text-center text-white/40 py-10">Nenhum PDI encontrado</p> :
                        <div className="space-y-3">
                            {pdis.map((p, i) => {
                                const Icon = statusIcon[p.status as keyof typeof statusIcon] || AlertCircle
                                const color = statusColor[p.status as keyof typeof statusColor] || ''
                                return (
                                    <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
                                                <Icon size={12} /> {statusLabel[p.status as keyof typeof statusLabel]}
                                            </span>
                                            {p.due_date && <span className="text-white/40 text-xs">Prazo: {new Date(p.due_date).toLocaleDateString('pt-BR')}</span>}
                                        </div>
                                        <div><p className="text-white/50 text-xs mb-0.5">Objetivo</p><p className="text-white text-sm">{p.objective}</p></div>
                                        <div><p className="text-white/50 text-xs mb-0.5">Ação</p><p className="text-blue-300 text-sm">{p.action}</p></div>
                                        {!p.acknowledged && (
                                            <button onClick={async () => { await ackPdi(p.id); toast.success('PDI marcado como lido') }}
                                                className="w-full py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition">
                                                ✅ Li e entendi
                                            </button>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </div>
            )}
        </div>
    )
}
