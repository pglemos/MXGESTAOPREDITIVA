import React from 'react'
import { motion } from 'motion/react'
import type { RankingEntry } from '@/types/database'

interface BattleViewProps {
    opponents: string[]
    ranking: RankingEntry[]
}

export function BattleView({ opponents, ranking }: BattleViewProps) {
    const p1Id = opponents[0]
    const p2Id = opponents[1]

    const p1 = ranking.find(s => s.user_id === p1Id)
    const p2 = ranking.find(s => s.user_id === p2Id)

    if (!p1 || !p2) return <div className="text-center p-10 text-text-tertiary font-bold uppercase tracking-widest">Selecione combatentes</div>

    const ComparisonRow = ({ label, v1, v2, format = (v: any) => v }: { label: string, v1: number, v2: number, format?: (v:any) => string }) => {
        const total = v1 + v2
        const p1Pct = total === 0 ? 50 : (v1 / total) * 100
        const winner = v1 > v2 ? 'p1' : v2 > v1 ? 'p2' : 'draw'

        return (
            <div className="mb-6 group">
                <div className="flex justify-between items-end mb-2 text-sm font-bold text-white">
                    <span className={winner === 'p1' ? 'text-brand-primary scale-110 transition-transform' : 'text-text-tertiary'}>{format(v1)}</span>
                    <span className="text-[10px] uppercase text-text-tertiary tracking-widest">{label}</span>
                    <span className={winner === 'p2' ? 'text-blue-400 scale-110 transition-transform' : 'text-text-tertiary'}>{format(v2)}</span>
                </div>
                <div className="h-4 bg-mx-black rounded-full overflow-hidden flex relative shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${winner === 'p1' ? 'bg-brand-primary shadow-[0_0_15px_#00E5FF]' : 'bg-brand-primary/50'}`} style={{ width: `${p1Pct}%` }}></div>
                    <div className="w-1 bg-surface-alt z-10 skew-x-[-20deg]"></div>
                    <div className={`h-full transition-all duration-1000 flex-1 ${winner === 'p2' ? 'bg-blue-500 shadow-[0_0_15px_#3B82F6]' : 'bg-blue-500/50'}`}></div>
                </div>
            </div>
        )
    }

    const avatar1 = `https://ui-avatars.com/api/?name=${encodeURIComponent(p1.user_name)}&background=random`
    const avatar2 = `https://ui-avatars.com/api/?name=${encodeURIComponent(p2.user_name)}&background=random`

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 relative gap-6 md:gap-0">
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-mx-black border-4 border-surface-alt flex items-center justify-center z-20 shadow-xl">
                    <span className="font-display font-black text-2xl italic text-white">VS</span>
                </div>

                {/* Player 1 */}
                <div className="bg-mx-black p-6 rounded-3xl border border-brand-primary/20 flex flex-col items-center w-full md:w-5/12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary blur-[80px] opacity-20 rounded-full"></div>
                    <img src={avatar1} alt={p1.user_name} className="w-24 h-24 rounded-2xl border-2 border-brand-primary shadow-[0_0_20px_rgba(0,229,255,0.3)] mb-4" />
                    <h3 className="font-display font-bold text-2xl text-white text-center">{p1.user_name}</h3>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-widest text-center mt-1">{p1.store_name}</p>
                </div>

                {/* Player 2 */}
                <div className="bg-mx-black p-6 rounded-3xl border border-blue-500/20 flex flex-col items-center w-full md:w-5/12 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 blur-[80px] opacity-20 rounded-full"></div>
                    <img src={avatar2} alt={p2.user_name} className="w-24 h-24 rounded-2xl border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4" />
                    <h3 className="font-display font-bold text-2xl text-white text-center">{p2.user_name}</h3>
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest text-center mt-1">{p2.store_name}</p>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-[32px] bg-mx-black/80 backdrop-blur-xl border border-white/10">
                <ComparisonRow label="Atingimento (%)" v1={p1.atingimento} v2={p2.atingimento} format={(v) => `${Math.round(v)}%`} />
                <ComparisonRow label="Vendas Totais" v1={p1.vnd_total} v2={p2.vnd_total} />
                <ComparisonRow label="Leads" v1={p1.leads} v2={p2.leads} />
                <ComparisonRow label="Agendamentos" v1={p1.agd_total} v2={p2.agd_total} />
                <ComparisonRow label="Visitas" v1={p1.visitas} v2={p2.visitas} />
            </div>
        </motion.div>
    )
}
