import { Megaphone, Send, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBroadcasts } from '@/hooks/useBroadcasts'
import { Card } from '@/components/molecules/Card'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Badge } from '@/components/atoms/Badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { type Notification as AppNotification } from '@/lib/schemas/notification.schema'

type BroadcastDisplay = AppNotification & {
    titulo?: string | null
    mensagem?: string | null
}

export function BroadcastsTab() {
    const { broadcasts, loading, refetch } = useBroadcasts()

    return (
        <div className="space-y-8">
            <Card className="p-8 border-none shadow-sm bg-gray-950 text-white relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex items-start justify-between gap-6">
                    <div className="flex items-start gap-6 flex-1">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-emerald-600">
                            <Megaphone size={28} />
                        </div>
                        <div className="space-y-2">
                            <Typography variant="h3" tone="white" className="uppercase tracking-tight">Comunicados da Rede</Typography>
                            <Typography variant="caption" tone="white" className="uppercase tracking-widest font-black opacity-60">
                                Broadcasts oficiais MX para vendedores, gerentes e donos
                            </Typography>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl font-black uppercase tracking-widest text-xs shrink-0">
                        <Link to="/notificacoes">
                            <Send size={14} className="mr-2" /> Compor
                        </Link>
                    </Button>
                </div>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
                <header className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <Typography variant="caption" className="font-black uppercase tracking-widest">Últimos Broadcasts</Typography>
                        <Typography variant="tiny" tone="muted" className="font-bold">Histórico de comunicados disparados</Typography>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => refetch()} className="rounded-2xl" aria-label="Atualizar broadcasts">
                        <RefreshCw size={16} />
                    </Button>
                </header>

                {loading ? (
                    <div className="p-12 text-center"><RefreshCw size={24} className="animate-spin mx-auto text-emerald-600" /></div>
                ) : broadcasts.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                        <Megaphone size={40} className="mx-auto text-gray-500 opacity-30" />
                        <Typography variant="caption" tone="muted" className="font-black uppercase">Nenhum broadcast disparado ainda</Typography>
                    </div>
                ) : (
                    <div className="divide-y divide-border-default">
                        {broadcasts.slice(0, 10).map((b: BroadcastDisplay) => (
                            <div key={b.broadcast_id || b.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <Typography variant="caption" className="font-black uppercase tracking-tight">
                                            {b.titulo || b.title || 'Sem título'}
                                        </Typography>
                                        <Typography variant="tiny" tone="muted" className="font-bold leading-relaxed mt-1 line-clamp-2">
                                            {b.mensagem || b.message || ''}
                                        </Typography>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0">
                                        {b.created_at ? format(new Date(b.created_at), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
