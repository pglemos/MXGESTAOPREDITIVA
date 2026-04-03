import { useState, useEffect, useCallback, useRef } from 'react'
import {
    MessageSquare, Send, Bell, Smartphone,
    CheckCircle2, AlertCircle, Clock, Search,
    Filter, Zap, MoreVertical, Paperclip,
    Smile, Image as ImageIcon, User, Bot,
    Sparkles, RefreshCw, QrCode, X, Globe, Link
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import useAppStore from '@/stores/main'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'

interface Message {
    id: string
    text: string
    sender: 'user' | 'ia'
    timestamp: string
}

export default function Communication() {
    const { activeAgencyId, refetch: refetchAll } = useAppStore()
    const [connected, setConnected] = useState(false)
    const [qr, setQr] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Olá! Posso ajudar a redigir mensagens impactantes para seus leads ou gerar um diagnóstico da sua performance atual. O que deseja fazer hoje?', sender: 'ia', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    ])
    const [newMessage, setNewMessage] = useState('')
    const [isRefetching, setIsRefetching] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // 15. Memory Leak fix: Polling simulation with cleanup
    useEffect(() => {
        let isMounted = true
        const timer = setTimeout(() => {
            if (isMounted) setConnected(true)
        }, 2000)
        return () => { isMounted = false; clearTimeout(timer) }
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = useCallback(() => {
        if (!newMessage.trim()) return
        
        const userMsg: Message = {
            id: Date.now().toString(),
            text: newMessage,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
        
        setMessages(prev => [...prev, userMsg])
        setNewMessage('')

        // IA Reaction Simulation
        setTimeout(() => {
            const iaMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Entendido. Estou processando sua solicitação tática e buscarei o melhor template de abordagem para este lead.',
                sender: 'ia',
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            }
            setMessages(prev => [...prev, iaMsg])
        }, 1000)
    }, [newMessage])

    const handleRefresh = async () => {
        setIsRefetching(true)
        await refetchAll?.()
        setIsRefetching(false)
        toast.success('Central de comunicação sincronizada!')
    }

    return (
        <div className="w-full h-full flex flex-col gap-10 overflow-y-auto no-scrollbar relative text-pure-black p-4 sm:p-6 md:p-10">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 w-full shrink-0 border-b border-gray-100 pb-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                        <div className="w-2 h-10 bg-electric-blue rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                        <h1 className="text-[38px] font-black tracking-tighter leading-none">Canal <span className="text-electric-blue">Inteligente</span></h1>
                    </div>
                    <div className="flex items-center gap-3 pl-6 mt-2">
                        <div className={cn("w-2 h-2 rounded-full shadow-lg transition-colors", connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Communication Hub • Multi-channel Active</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <button 
                        onClick={handleRefresh}
                        className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-pure-black transition-all active:scale-90"
                    >
                        <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
                    </button>
                    <Badge variant={connected ? "default" : "destructive"} className={cn("rounded-full px-6 h-12 flex items-center gap-2 font-black text-[9px] uppercase tracking-widest border-none shadow-sm transition-all", 
                        connected ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                    )}>
                        {connected ? <Zap className="w-3.5 h-3.5 fill-current" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {connected ? 'WhatsApp Online' : 'Aguardando Link'}
                    </Badge>
                </div>
            </div>

            {/* 5. Responsive fix: Layout 1:2 on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 pb-32">
                
                {/* Instance Sidebar (4/12) */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-elevation overflow-hidden flex flex-col group">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <div>
                                <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Instâncias</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gerenciamento de Nodes</p>
                            </div>
                            <button className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-pure-black transition-all shadow-sm">
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {!connected ? (
                                <div className="flex flex-col items-center p-10 border-2 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 gap-6 text-center group/qr">
                                    <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-gray-50 transform group-hover/qr:scale-105 transition-transform">
                                        <QrCode size={80} className="text-gray-200" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-pure-black uppercase tracking-widest mb-2">Aguardando Auth</p>
                                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed max-w-[180px]">Escaneie o código no seu terminal para vincular o cluster.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 relative overflow-hidden group/item">
                                    <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover/item:bg-indigo-100" />
                                    <div className="flex items-center justify-between mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            {/* 14. Icon Misuse fixed */}
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-electric-blue shadow-sm">
                                                <Globe size={24} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-pure-black">Node Principal</p>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gateway Alpha</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase border-none px-3 h-6 rounded-lg">ATIVO</Badge>
                                    </div>
                                    <button 
                                        onClick={() => setConnected(false)}
                                        className="w-full py-3.5 rounded-xl bg-white border border-rose-100 text-rose-500 font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 shadow-sm relative z-10"
                                    >
                                        Desconectar Node
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-pure-black rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-3xl">
                        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(79,70,229,0.15)_1px,transparent_1px)] bg-[length:32px:32px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-electric-blue transition-colors">
                                <Zap size={24} className="text-electric-blue group-hover:text-white" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Regras de Automação</h4>
                                <p className="text-sm font-bold text-white/50 leading-relaxed max-w-[220px]">
                                    Mensagens de D0 automáticas estão configuradas para novos leads do cluster.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area (8/12) */}
                <div className="lg:col-span-8">
                    {/* 10. Design System: bg-white instead of bg-pure-black for consistency */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] shadow-elevation flex flex-col h-full overflow-hidden min-h-[600px] relative group">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-pure-black text-white flex items-center justify-center shadow-2xl relative">
                                    <Bot size={28} strokeWidth={2.5} />
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-pure-black tracking-tight leading-none mb-1">Assistente Estratégico MX</h3>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Always-on Intelligence</p>
                                </div>
                            </div>
                            <button className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-pure-black transition-all shadow-sm">
                                <Settings size={20} />
                            </button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-8 sm:p-10 space-y-10">
                            <AnimatePresence mode="popLayout">
                                {messages.map((m) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={cn(
                                            "flex flex-col gap-2 max-w-[85%] sm:max-w-[70%]",
                                            m.sender === 'user' ? "ml-auto items-end" : "items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-6 rounded-[2rem] relative shadow-sm group/msg",
                                            m.sender === 'user' 
                                                ? "bg-pure-black text-white rounded-tr-none" 
                                                /* 7. Contrast fixed for IA balloon */
                                                : "bg-gray-100 text-pure-black rounded-tl-none border border-gray-200"
                                        )}>
                                            <p className="text-sm font-bold leading-relaxed">{m.text}</p>
                                            
                                            {/* 4. Visual timestamps added */}
                                            <div className={cn("absolute top-2 opacity-0 group-hover/msg:opacity-100 transition-opacity", m.sender === 'user' ? "-left-14" : "-right-14")}>
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{m.timestamp}</span>
                                            </div>
                                        </div>
                                        {m.sender === 'ia' && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <div className="w-1 h-1 rounded-full bg-electric-blue shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Optimized Output</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="p-8 sm:p-10 border-t border-gray-50 bg-gray-50/20 shrink-0">
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-4 text-gray-300">
                                    <button className="hover:text-electric-blue transition-colors"><Paperclip size={20} strokeWidth={2.5} /></button>
                                    <button className="hover:text-amber-500 transition-colors"><Smile size={20} strokeWidth={2.5} /></button>
                                </div>
                                
                                {/* 11. Input UX: Enter to send */}
                                <input
                                    placeholder="Abordagem tática ou instrução para IA..."
                                    className="w-full pl-24 pr-24 h-16 bg-white border border-gray-100 rounded-full font-bold text-sm focus:outline-none focus:border-indigo-200 focus:shadow-elevation shadow-inner transition-all"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    {/* 6. Z-Index / Sparkles fix */}
                                    <button className="w-10 h-10 rounded-xl flex items-center justify-center text-electric-blue hover:bg-indigo-50 transition-colors">
                                        <Sparkles size={20} strokeWidth={2.5} />
                                    </button>
                                    <button 
                                        onClick={handleSend}
                                        disabled={!newMessage.trim()}
                                        className="w-12 h-12 rounded-xl bg-pure-black text-white flex items-center justify-center shadow-lg hover:bg-black transition-all active:scale-90 disabled:opacity-30"
                                    >
                                        <Send size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
