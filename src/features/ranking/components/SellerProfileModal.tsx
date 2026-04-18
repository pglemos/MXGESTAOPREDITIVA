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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-mx-md">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-mx-black/80 backdrop-blur-sm" 
                onClick={onClose} 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-mx-black w-full max-w-3xl rounded-mx-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row text-white max-h-[90vh] border border-white/10"
            >
                <button onClick={onClose} className="absolute top-mx-sm right-mx-sm p-mx-xs hover:bg-white/10 rounded-full transition-colors z-20">
                    <X className="w-mx-md h-mx-md text-text-tertiary" />
                </button>

                {/* Left: Avatar & Badges */}
                <div className="w-full md:w-mx-tiny/3 bg-white/5 p-mx-xl flex flex-col items-center border-r border-white/5 relative overflow-hidden">
                    <div className="absolute top-mx-0 left-mx-0 w-full h-mx-tiny bg-gradient-to-r from-brand-primary to-transparent"></div>
                    <div className="w-mx-32 h-mx-32 rounded-full p-mx-tiny bg-gradient-to-b from-brand-primary to-transparent mb-6 relative shrink-0">
                        <img src={avatar} alt={seller.user_name} className="w-full h-full rounded-full object-cover border-4 border-mx-black bg-surface-alt" />
                        <div className="absolute -bottom-2 -right-2 w-mx-10 h-mx-10 bg-mx-black rounded-full flex items-center justify-center border-2 border-brand-primary text-brand-primary font-black shadow-lg">
                            {seller.position}º
                        </div>
                    </div>
                    
                    <h2 className="font-display font-black text-2xl text-white mb-1 text-center">{seller.user_name}</h2>
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-6">{seller.store_name || 'Vendedor'}</p>

                    <div className="flex gap-mx-xs justify-center w-full flex-wrap mb-8">
                        {badge === 'fire' && <div className="p-mx-xs bg-status-warning-surface text-status-warning rounded-xl border border-status-warning/30" title="On Fire"><Flame className="w-mx-sm h-mx-sm" /></div>}
                        {badge === 'crown' && <div className="p-mx-xs bg-status-warning-surface text-status-warning rounded-xl border border-status-warning/30" title="Rei da Arena"><Crown className="w-mx-sm h-mx-sm" /></div>}
                        {trend === 'up' && <div className="p-mx-xs bg-status-success-surface text-status-success rounded-xl border border-status-success/30" title="Em Ascensão"><TrendingUp className="w-mx-sm h-mx-sm" /></div>}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="w-full space-y-mx-xs mt-auto">
                        <button 
                            onClick={() => setTab('performance')}
                            className={cn(
                                "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-mx-xs transition-all",
                                tab === 'performance' ? "bg-brand-primary text-mx-black shadow-mx-glow-brand" : "bg-white/5 text-text-tertiary hover:bg-white/10"
                            )}
                        >
                            <Activity className="w-mx-sm h-mx-sm" /> Performance
                        </button>
                        <button 
                            onClick={() => setTab('commissions')}
                            className={cn(
                                "w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-mx-xs transition-all",
                                tab === 'commissions' ? "bg-brand-primary text-mx-black shadow-mx-glow-brand" : "bg-white/5 text-text-tertiary hover:bg-white/10"
                            )}
                        >
                            <Wallet className="w-mx-sm h-mx-sm" /> Extrato (Simulado)
                        </button>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="w-full md:w-mx-xs/3 p-mx-xl overflow-y-auto custom-scrollbar bg-mx-black/50">
                    
                    {tab === 'performance' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-mx-xs">
                                    Atributos do Vendedor
                                </h3>
                                <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-black uppercase text-text-secondary">
                                    Nível {Math.floor(seller.atingimento / 10) || 1}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center mb-6 min-h-mx-64">
                                <div className="w-full h-mx-64 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={attributes}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                            <Radar name={seller.user_name} dataKey="A" stroke="#00E5FF" strokeWidth={3} fill="#00E5FF" fillOpacity={0.2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-mx-sm w-full">
                                <div className="bg-white/5 p-mx-md rounded-xl border border-white/5">
                                    <div className="text-mx-tiny text-text-tertiary uppercase font-bold mb-1">Vendas</div>
                                    <div className="text-2xl font-display font-black text-white">{seller.vnd_total}</div>
                                </div>
                                <div className="bg-white/5 p-mx-md rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="text-mx-tiny text-text-tertiary uppercase font-bold mb-1">Leads</div>
                                    <div className="text-2xl font-display font-black text-white">{seller.leads}</div>
                                </div>
                                <div className="bg-white/5 p-mx-md rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="text-mx-tiny text-text-tertiary uppercase font-bold mb-1">Agend.</div>
                                    <div className="text-2xl font-display font-black text-white">{seller.agd_total}</div>
                                </div>
                                <div className="bg-white/5 p-mx-md rounded-xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute right-mx-0 top-mx-0 p-mx-xs opacity-10"><CheckCircle2 className="w-mx-10 h-mx-10" /></div>
                                    <div className="text-mx-tiny text-text-tertiary uppercase font-bold mb-1">Meta</div>
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
                            <div className="grid grid-cols-2 gap-mx-md mb-6">
                                <div className="bg-status-success-surface p-mx-md rounded-2xl border border-status-success/20">
                                    <div className="flex items-center gap-mx-xs mb-2">
                                        <div className="p-mx-tiny.5 bg-status-success-surface rounded-lg text-status-success"><Unlock className="w-mx-sm h-mx-sm" /></div>
                                        <span className="text-mx-tiny font-bold text-status-success uppercase">Liberado</span>
                                    </div>
                                    <div className="text-2xl font-black text-white">R$ {installedCommission}</div>
                                    <div className="text-mx-tiny text-text-tertiary mt-1">{seller.vnd_total} vendas hoje</div>
                                </div>
                                <div className="bg-mx-black p-mx-md rounded-2xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute -right-2 -top-2 text-surface-alt opacity-20"><LockKeyhole className="w-mx-20 h-mx-20" /></div>
                                    <div className="flex items-center gap-mx-xs mb-2">
                                        <div className="p-mx-tiny.5 bg-surface-alt rounded-lg text-text-tertiary"><LockKeyhole className="w-mx-sm h-mx-sm" /></div>
                                        <span className="text-mx-tiny font-bold text-text-tertiary uppercase">Projetado (Meta)</span>
                                    </div>
                                    <div className="text-2xl font-black text-text-secondary">R$ {pendingCommission}</div>
                                    <div className="text-mx-tiny text-text-tertiary mt-1">{pendingSales} faltam pra meta</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-2xl border border-white/5 p-mx-tiny min-h-mx-48">
                                <table className="w-full text-left text-xs">
                                    <thead className="text-text-tertiary font-bold uppercase bg-white/5 sticky top-mx-0">
                                        <tr>
                                            <th className="p-mx-sm">Cliente</th>
                                            <th className="p-mx-sm">Status</th>
                                            <th className="p-mx-sm text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {commissionHistory.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="p-mx-sm">
                                                    <div className="font-bold text-white">{item.client}</div>
                                                    <div className="text-mx-tiny text-text-tertiary">{item.plan} • {item.date}</div>
                                                </td>
                                                <td className="p-mx-sm">
                                                    <span className={`px-2 py-1 rounded text-mx-micro font-bold uppercase border ${item.status === 'Instalado' ? 'bg-status-success-surface text-status-success border-status-success/20' : 'bg-status-warning-surface text-status-warning border-status-warning/20'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="p-mx-sm text-right font-mono font-bold text-text-secondary">
                                                    R$ {item.value}
                                                </td>
                                            </tr>
                                        ))}
                                        {commissionHistory.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-mx-lg text-center text-text-tertiary">Nenhuma comissão registrada ainda.</td>
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
