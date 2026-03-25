import { useState, useEffect } from 'react'
import {
    MessageSquare, Send, Bell, Smartphone,
    CheckCircle2, AlertCircle, Clock, Search,
    Filter, Zap, MoreVertical, Paperclip,
    Smile, Image as ImageIcon, User, Bot,
    Sparkles, RefreshCcw, QrCode
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useUsers } from '@/stores/main'
import useAppStore from '@/stores/main'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Mock hook for build stability
function useWhatsAppPolling() {
    return { connected: true, qr: null }
}

export default function Communication() {
    const { activeAgencyId } = useAppStore()
    const [waStatus, setWaStatus] = useState({ connected: false, qr: null })
    const { connected, qr } = waStatus

    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4 md:px-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-electric-blue animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">COMMUNICATION HUB</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-pure-black dark:text-off-white">
                        Canal <span className="text-electric-blue">Inteligente</span>
                    </h1>
                </div>

                <div className="flex w-full md:w-auto items-center gap-3">
                    <Badge variant={connected ? "default" : "destructive"} className="rounded-full px-4 h-9 flex items-center gap-2 font-bold bg-green-500/10 text-green-600 border-none">
                        {connected ? <Zap className="w-3.5 h-3.5 fill-current" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {connected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-none bg-white dark:bg-pure-black shadow-sm rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-extrabold">Instâncias</CardTitle>
                        <CardDescription className="font-semibold">Gerencie suas conexões de WhatsApp.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!connected && qr && (
                            <div className="flex flex-col items-center p-6 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl gap-4">
                                <QrCode className="w-32 h-32 text-muted-foreground opacity-50" />
                                <p className="text-xs text-center text-muted-foreground font-bold leading-relaxed px-4">
                                    Escaneie o QR Code no seu WhatsApp para conectar esta agência.
                                </p>
                            </div>
                        )}
                        {connected && (
                            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Smartphone className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Principal</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Smartphone</p>
                                        </div>
                                    </div>
                                    <Badge className="bg-green-500 text-white font-bold border-none">Ativo</Badge>
                                </div>
                                <Button variant="ghost" size="sm" className="w-full rounded-xl font-bold text-mars-orange hover:bg-mars-orange/10 border-none">
                                    Desconectar
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none bg-white dark:bg-pure-black shadow-sm rounded-3xl min-h-[500px] flex flex-col">
                    <CardHeader className="border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-electric-blue/10 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-electric-blue" />
                                </div>
                                <div>
                                    <p className="font-bold">Assistente de IA</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Sempre pronto para otimizar suas vendas.</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0">
                        <div className="flex-1 p-6 space-y-4">
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-black/5 dark:bg-white/5">
                                    <p className="text-sm font-semibold leading-relaxed">
                                        Olá! Posso ajudar a redigir mensagens impactantes para seus leads ou gerar um diagnóstico da sua performance atual. O que deseja fazer hoje?
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-black/5 dark:border-white/5">
                            <div className="relative">
                                <Input
                                    placeholder="Escreva sua mensagem ou peça ajuda da IA..."
                                    className="pr-24 h-14 rounded-2xl border-none bg-black/5 dark:bg-white/5 font-semibold text-sm"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <div className="absolute right-2 top-2 flex gap-1">
                                    <Button size="icon" variant="ghost" className="rounded-xl text-electric-blue hover:bg-electric-blue/10">
                                        <Sparkles className="w-5 h-5" />
                                    </Button>
                                    <Button size="icon" className="rounded-xl bg-electric-blue hover:bg-electric-blue/90">
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
