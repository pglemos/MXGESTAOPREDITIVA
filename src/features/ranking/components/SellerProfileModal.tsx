import React, { useState } from 'react'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import { X, Flame, Crown, TrendingUp, Activity, Wallet, CheckCircle2, Unlock, LockKeyhole } from 'lucide-react'
import type { RankingEntry } from '@/types/database'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface SellerProfileModalProps {
    seller: RankingEntry
    onClose: () => void
}

export function SellerProfileModal({ seller, onClose }: SellerProfileModalProps) {
    const [tab, setTab] = useState<'performance' | 'commissions'>('performance')
    
    // Default avatar
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random`
    
    // Calculate "RPG Attributes" based on real stats
    // Atingimento (Meta), Volume (Leads/Visitas), Conversão (Vendas / Leads), Consistência (Ritmo)
    const attributes = [
        { subject: 'Atingimento', A: Math.min(seller.atingimento, 100), fullMark: 100 },
        { subject: 'Volume', A: Math.min(((seller.leads + seller.visitas) / 100) * 100, 100), fullMark: 100 }, // Mock logic
        { subject: 'Conversão', A: seller.leads > 0 ? Math.min((seller.vnd_total / seller.leads) * 100, 100) : 0, fullMark: 100 },
        { subject: 'Ritmo', A: Math.min(seller.ritmo * 10, 100), fullMark: 100 },
        { subject: 'Visitas', A: Math.min(seller.visitas * 5, 100), fullMark: 100 },
    ]

    // Mock Commission Data (since we don't have this in real database yet)
    const installedCommission = seller.vnd_total * 50 // R$ 50 por venda
    const pendingSales = Math.max(0, seller.meta - seller.vnd_total)
    const pendingCommission = pendingSales * 50
    
    const commissionHistory = [
        ...Array.from({length: Math.min(5, seller.vnd_total)}).map((_, i) => ({
            id: `c-${i}`,
            client: `Cliente Exemplo ${i+1}`,
            plan: 'Plano Controle',
            date: new Date().toLocaleDateString('pt-BR'),
            status: 'Instalado',
            value: 50.00
        }))
    ]

    const trend = seller.atingimento > 80 ? 'up' : 'down'
    const badge = seller.position === 1 ? 'crown' : seller.atingimento >= 100 ? 'fire' : 'none'

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-mx-black/80 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-gradient-to-br from-surface-alt to-mx-black w-full max-w-3xl rounded-mx-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row text-white max-h-[90vh] border border-white/10"
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
                    <X className="w-6 h-6 text-text-tertiary" />
                </button>

                {/* Left: Avatar & Badges */}
                <div className="w-full md:w-1/3 bg-white/5 p-8 flex flex-col items-center border-r border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-transparent"></div>
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-b from-brand-primary to-transparent mb-6 relative shrink-0">
                        <img src={avatar} alt={seller.user_name} className="w-full h-full rounded-full object-cover border-4 border-mx-black bg-surface-alt" />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-mx-black rounded-full flex items-center justify-center border-2 border-brand-primary text-brand-primary font-black shadow-lg">
                            {seller.position}º
                        </div>
                    </div>
                    
                    <h2 className="font-display font-black text-2xl text-white mb-1 text-center">{seller.user_name}</h2>
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-6">{seller.store_name || 'Vendedor'}</p>

                    <div className="flex gap-2 justify-center w-full flex-wrap mb-8">
                        {badge === 'fire' && <div className="p-2 bg-orange-500/20 text-orange-500 rounded-xl border border-orange-500/30" title="On Fire"><Flame className="w-5 h-5" /></div>}
                        {badge === 'crown' && <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-xl border border-yellow-500/30" title="Rei da Arena"><Crown className="w-5 h-5" /></div>}
                        {trend === 'up' && <div className="p-2 bg-green-500/20 text-green-500 rounded-xl border border-green-500/30" title="Em Ascensão"><TrendingUp className="w-5 h-5" /></div>}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="w-full space-y-2 mt-auto">
                        <button 
                            onClick={() => setTab('performance')}
                            className={cn(
                                "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                                tab === 'performance' ? "bg-brand-primary text-mx-black shadow-[0_0_15px_#00E5FF]" : "bg-white/5 text-text-tertiary hover:bg-white/10"
                            )}
                        >
                            <Activity className="w-4 h-4" /> Performance
                        </button>
                        <button 
                            onClick={() => setTab('commissions')}
                            className={cn(
                                "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                                tab === 'commissions' ? "bg-brand-primary text-mx-black shadow-[0_0_15px_#00E5FF]" : "bg-white/5 text-text-tertiary hover:bg-white/10"
                            )}
                        >
                            <Wallet className="w-4 h-4" /> Extrato (Simulado)
                        </button>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="w-full md:w-2/3 p-8 overflow-y-auto custom-scrollbar bg-mx-black/50">
                    
                    {tab === 'performance' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    Atributos do Vendedor
                                </h3>
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black uppercase text-text-secondary">
                                    Nível {Math.floor(seller.atingimento / 10) || 1}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center mb-6 min-h-[250px]">
                                <div className="w-full h-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={attributes}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                            <Radar name={seller.user_name} dataKey="A" stroke="#00E5FF" strokeWidth={3} fill="#00E5FF" fillOpacity={0.2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Vendas</div>
                                    <div className="text-2xl font-display font-black text-white">{seller.vnd_total}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Leads</div>
                                    <div className="text-2xl font-display font-black text-white">{seller.leads}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Agend.</div>
                                    <div className="text-2xl font-display font-black text-white">{seller.agd_total}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-2 opacity-10"><CheckCircle2 className="w-10 h-10" /></div>
                                    <div className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Meta</div>
                                    <div className="text-2xl font-display font-black text-brand-primary">{seller.meta}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {tab === 'commissions' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-1">Extrato de Comissões</h3>
                                <p className="text-xs text-text-tertiary">Mock para demonstração visual baseado em vendas.</p>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-green-500/20 rounded-lg text-green-400"><Unlock className="w-4 h-4" /></div>
                                        <span className="text-[10px] font-bold text-green-400 uppercase">Liberado</span>
                                    </div>
                                    <div className="text-2xl font-black text-white">R$ {installedCommission}</div>
                                    <div className="text-[10px] text-text-tertiary mt-1">{seller.vnd_total} vendas hoje</div>
                                </div>
                                <div className="bg-mx-black p-4 rounded-2xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute -right-2 -top-2 text-surface-alt opacity-20"><LockKeyhole className="w-20 h-20" /></div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-surface-alt rounded-lg text-text-tertiary"><LockKeyhole className="w-4 h-4" /></div>
                                        <span className="text-[10px] font-bold text-text-tertiary uppercase">Projetado (Meta)</span>
                                    </div>
                                    <div className="text-2xl font-black text-text-secondary">R$ {pendingCommission}</div>
                                    <div className="text-[10px] text-text-tertiary mt-1">{pendingSales} faltam pra meta</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-2xl border border-white/5 p-1 min-h-[200px]">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-text-tertiary font-bold uppercase bg-white/5 sticky top-0">
                                        <tr>
                                            <th className="p-3">Cliente</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {commissionHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="p-3">
                                                    <div className="font-bold text-white">{item.client}</div>
                                                    <div className="text-[10px] text-text-tertiary">{item.plan} • {item.date}</div>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase border ${item.status === 'Instalado' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-mono font-bold text-text-secondary">
                                                    R$ {item.value}
                                                </td>
                                            </tr>
                                        ))}
                                        {commissionHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-6 text-center text-text-tertiary">Nenhuma comissão registrada ainda.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
