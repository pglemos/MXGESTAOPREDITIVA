import React, { useState, useEffect } from 'react'
import { Trophy, Send, Megaphone, X, PhoneForwarded, Headphones, Coffee, Inbox, Activity, Mic, Users } from 'lucide-react'
import type { RankingEntry } from '@/types/database'
import { motion } from 'motion/react'

interface LiveFloorProps {
    ranking: RankingEntry[]
}

export function LiveFloor({ ranking }: LiveFloorProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [monitoringTarget, setMonitoringTarget] = useState<string | null>(null)
    const [monitorMode, setMonitorMode] = useState<'spy' | 'whisper' | 'barge'>('spy')
    const [broadcastMsg, setBroadcastMsg] = useState('')
    const [showBroadcastInput, setShowBroadcastInput] = useState(false)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Randomize Mock Status just for visual demo
    const statuses = [
        { type: 'on_call', label: 'Em Ligação', color: 'text-status-error', bg: 'bg-status-error-surface border-status-error/20', icon: PhoneForwarded },
        { type: 'available', label: 'Disponível', color: 'text-status-success', bg: 'bg-status-success-surface border-status-success/20', icon: Headphones },
        { type: 'paused', label: 'Pausa', color: 'text-status-warning', bg: 'bg-status-warning-surface border-status-warning/20', icon: Coffee },
        { type: 'chatting', label: 'Em Chat', color: 'text-status-info', bg: 'bg-status-info-surface border-status-info/20', icon: Inbox },
    ]

    const liveAgents = ranking.map((seller, idx) => {
        const statusIndex = (idx + Math.floor(currentTime.getMinutes() / 10)) % 4
        const status = statuses[statusIndex]
        const durationSeconds = (idx * 120) + (currentTime.getSeconds() * (idx + 1)) % 600

        const duration = new Date(durationSeconds * 1000).toISOString().substring(14, 19)
        const isCritical = (status.type === 'paused' && durationSeconds > 600) || (status.type === 'on_call' && durationSeconds > 900)

        return {
            ...seller,
            status,
            duration,
            durationSeconds,
            isCritical,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.user_name)}&background=random`
        }
    })

    const activeAgent = liveAgents.find(a => a.user_id === monitoringTarget)

    const totalSalesToday = ranking.reduce((acc, curr) => acc + (curr.vnd_yesterday || 0), 0) // usando vnd_yesterday como proxy de venda recente
    const teamGoal = ranking.reduce((acc, curr) => acc + curr.meta, 0) / 30 // meta do dia approx
    const teamProgress = teamGoal > 0 ? (totalSalesToday / teamGoal) * 100 : 0

    const events = [
        { id: 1, text: 'Novo lead atendido', type: 'call', time: 'Agora' },
        { id: 2, text: 'Venda confirmada', type: 'sale', time: '2 min' },
        { id: 3, text: 'Check-in realizado', type: 'info', time: '5 min' },
    ]

    const handleBroadcast = () => {
        if(!broadcastMsg) return
        alert(`Mensagem enviada: "${broadcastMsg}"`)
        setBroadcastMsg('')
        setShowBroadcastInput(false)
    }

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full gap-mx-lg pb-2 relative">

            {/* 1. Team Goal & Broadcast Bar */}
            <div className="bg-mx-black rounded-mx-2xl p-mx-tiny border border-white/10 flex items-center justify-between gap-mx-lg relative overflow-hidden shrink-0 shadow-lg">
                <div className="absolute top-mx-0 left-mx-0 h-full bg-brand-primary/10 transition-all duration-1000" style={{ width: `${Math.min(teamProgress, 100)}%` }}></div>

                <div className="flex items-center gap-mx-md px-6 py-3 relative z-10">
                    <div className="w-mx-10 h-mx-10 rounded-xl bg-brand-primary text-black flex items-center justify-center font-black shadow-mx-glow-brand">
                        <Trophy className="w-mx-sm h-mx-sm" />
                    </div>
                    <div>
                        <div className="text-mx-tiny font-bold text-text-tertiary uppercase tracking-widest">Ritmo do Time Hoje</div>
                        <div className="text-xl font-black text-white flex items-baseline gap-mx-tiny">
                            {totalSalesToday} <span className="text-sm text-text-tertiary font-bold">/ ~{Math.round(teamGoal)} Vendas</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 h-mx-xs bg-white/10 rounded-full overflow-hidden relative mx-4 max-w-md">
                    <div className="h-full bg-gradient-to-r from-brand-primary to-status-info transition-all duration-1000 relative" style={{ width: `${Math.min(teamProgress, 100)}%` }}>
                        <div className="absolute right-mx-0 top-mx-0 bottom-mx-0 w-mx-xs bg-white/50 blur-sm"></div>
                    </div>
                </div>

                <div className="px-6 py-3 relative z-10 flex items-center gap-mx-sm">
                    {showBroadcastInput ? (
                        <div className="flex items-center gap-mx-xs animate-in slide-in-from-right-mx-sm">
                            <input
                                type="text"
                                value={broadcastMsg}
                                onChange={(e) => setBroadcastMsg(e.target.value)}
                                placeholder="Mensagem..."
                                className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-text-tertiary focus:outline-none focus:border-brand-primary w-mx-64"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                            />
                            <button onClick={handleBroadcast} className="p-mx-xs bg-brand-primary text-black rounded-lg"><Send className="w-mx-xs h-mx-xs" /></button>
                            <button onClick={() => setShowBroadcastInput(false)} className="p-mx-xs text-text-tertiary hover:text-white"><X className="w-mx-xs h-mx-xs" /></button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowBroadcastInput(true)}
                            className="flex items-center gap-mx-xs text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 rounded-xl transition-all"
                        >
                            <Megaphone className="w-mx-sm h-mx-sm text-brand-primary" />
                            Broadcast
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-mx-lg min-h-0">

                {/* 2. Agents Grid */}
                <div className="flex-1 bg-mx-black rounded-mx-3xl border border-white/10 p-mx-lg overflow-y-auto custom-scrollbar relative">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-display font-bold text-xl text-white flex items-center gap-mx-xs">
                            <span className="w-mx-xs h-mx-xs rounded-full bg-status-error animate-pulse"></span>
                            Monitoramento (Status Simulado)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-mx-md pb-20">
                        {liveAgents.map(agent => (
                            <div key={agent.user_id} className={`p-mx-md rounded-2xl border transition-all duration-300 relative overflow-hidden group hover:scale-[1.02]
                                ${agent.isCritical ? 'bg-status-error-surface border-status-error/20 shadow-mx-glow-brand animate-pulse' : agent.status.bg}`}>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex items-center gap-mx-sm">
                                        <div className="relative">
                                            <img src={agent.avatar} alt="" className="w-mx-10 h-mx-10 rounded-xl object-cover border border-white/10" />
                                            <div className={`absolute -bottom-1 -right-1 w-mx-xs h-mx-xs rounded-full border-2 border-mx-black ${agent.status.type === 'available' ? 'bg-status-success' : agent.status.type === 'on_call' ? 'bg-status-error' : agent.status.type === 'chatting' ? 'bg-status-info' : 'bg-status-warning'}`}></div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{agent.user_name}</h4>
                                            <div className={`flex items-center gap-mx-tiny text-mx-tiny font-bold uppercase mt-0.5 ${agent.status.color}`}>
                                                <agent.status.icon className="w-mx-xs h-mx-xs" />
                                                {agent.status.label}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`font-mono font-bold text-sm px-2 py-1 rounded-lg border
                                        ${agent.isCritical ? 'bg-status-error text-white border-status-error' : 'bg-black/20 text-white/80 border-white/5'}`}>
                                        {agent.duration}
                                    </div>
                                </div>

                                <div className="space-y-mx-xs mb-4 relative z-10">
                                    <div>
                                        <div className="flex justify-between text-mx-micro font-bold text-text-tertiary uppercase mb-1">
                                            <span>Vendas</span>
                                            <span className={agent.vnd_total > 0 ? 'text-brand-primary' : ''}>{agent.vnd_total}/{agent.meta}</span>
                                        </div>
                                        <div className="h-mx-tiny.5 bg-black/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(agent.atingimento, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-mx-xs relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    {(agent.status.type === 'on_call' || agent.status.type === 'chatting') ? (
                                        <button
                                            onClick={() => { setMonitoringTarget(agent.user_id); setMonitorMode('spy'); }}
                                            className="bg-black/40 hover:bg-white/10 text-white border border-white/10 rounded-lg py-2 flex justify-center items-center gap-mx-xs text-xs font-bold uppercase transition-colors"
                                        >
                                            <Headphones className="w-mx-sm h-mx-sm" /> Escutar
                                        </button>
                                    ) : (
                                        <div className="text-center text-mx-tiny font-bold text-text-tertiary py-1.5">
                                            Aguardando atividade...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Live Feed Sidebar */}
                <div className="w-full lg:w-mx-80 bg-mx-black rounded-mx-3xl border border-white/10 p-mx-lg flex flex-col shrink-0">
                    <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-mx-xs">
                        <Activity className="w-mx-sm h-mx-sm text-brand-primary" />
                        Feed (Mock)
                    </h3>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-mx-md pr-2">
                        {events.map((event, i) => (
                            <div key={i} className="flex gap-mx-sm relative pb-4 border-l border-white/10 pl-4 last:border-0 last:pb-0">
                                <div className={`absolute -left-[5px] top-mx-0 w-mx-xs.5 h-mx-xs.5 rounded-full border-2 border-mx-black
                                    ${event.type === 'sale' ? 'bg-brand-primary shadow-mx-glow-brand' :
                                      event.type === 'call' ? 'bg-status-info' : 'bg-text-tertiary'}`}></div>

                                <div>
                                    <p className="text-xs font-medium text-text-secondary leading-snug">{event.text}</p>
                                    <span className="text-mx-tiny font-bold text-text-tertiary mt-1 block">{event.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* 4. Active Monitoring Dock */}
            {monitoringTarget && activeAgent && (
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-mx-lg left-mx-lg right-mx-lg lg:left-mx-20 lg:right-mx-20 bg-mx-black/90 backdrop-blur-xl border border-white/10 shadow-mx-glow-brand text-white p-mx-md rounded-2xl flex flex-col md:flex-row items-center justify-between gap-mx-lg z-[60]">
                    <div className="flex items-center gap-mx-md min-w-mx-48">
                        <div className="relative">
                            <img src={activeAgent.avatar} alt="" className="w-mx-14 h-mx-14 rounded-xl border border-white/20" />
                            <div className="absolute -top-1 -right-1 w-mx-xs h-mx-xs bg-status-error rounded-full animate-pulse shadow-lg"></div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-text-tertiary uppercase tracking-wide">Monitorando</div>
                            <div className="font-display font-bold text-lg leading-none">{activeAgent.user_name}</div>
                            <div className="text-mx-tiny text-text-tertiary mt-1">{activeAgent.duration}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-mx-sm">
                        <button onClick={() => setMonitorMode('spy')} className={`flex flex-col items-center justify-center w-mx-20 h-mx-14 rounded-xl border transition-all ${monitorMode === 'spy' ? 'bg-surface-overlay border-white/20 text-white' : 'bg-transparent border-transparent text-text-tertiary hover:bg-white/5'}`}>
                            <Headphones className="w-mx-sm h-mx-sm mb-1" />
                            <span className="text-mx-micro font-bold uppercase">Espião</span>
                        </button>
                        <button onClick={() => setMonitorMode('whisper')} className={`flex flex-col items-center justify-center w-mx-20 h-mx-14 rounded-xl border transition-all ${monitorMode === 'whisper' ? 'bg-status-info-surface border-status-info/20 text-status-info' : 'bg-transparent border-transparent text-text-tertiary hover:bg-white/5'}`}>
                            <Mic className="w-mx-sm h-mx-sm mb-1" />
                            <span className="text-mx-micro font-bold uppercase">Sussurro</span>
                        </button>
                        <button onClick={() => setMonitorMode('barge')} className={`flex flex-col items-center justify-center w-mx-20 h-mx-14 rounded-xl border transition-all ${monitorMode === 'barge' ? 'bg-status-error-surface border-status-error/20 text-status-error' : 'bg-transparent border-transparent text-text-tertiary hover:bg-white/5'}`}>
                            <Users className="w-mx-sm h-mx-sm mb-1" />
                            <span className="text-mx-micro font-bold uppercase">Entrar</span>
                        </button>
                        <div className="w-px h-mx-10 bg-white/10 mx-2"></div>
                        <button onClick={() => setMonitoringTarget(null)} className="bg-status-error hover:bg-status-error text-white p-mx-sm rounded-xl transition-colors shadow-lg">
                            <X className="w-mx-sm h-mx-sm" />
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
