import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Typography } from '@/components/atoms/Typography'
import { Card, CardContent, CardHeader } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import type { StorePreRegistration } from '@/types/database'
import { NotificacaoApprovalCard } from '../components/NotificacaoApprovalCard'

type NotificationLike = {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  read: boolean
  priority?: string | null
  link?: string | null
  store_id?: string | null
}

type Props = {
  unreadCount: number
  grouped: Record<string, NotificationLike[]>
  isOwner: boolean
  markRead: (id: string) => void | Promise<void>
  markUnread: (id: string) => void | Promise<void>
  deleteNotification: (id: string) => void | Promise<void>
  isApprovalNotification: (n: { type: string; title: string }) => boolean
  getApprovalForNotification: (n: {
    link?: string | null
    store_id?: string | null
    message: string
    type: string
    title: string
  }) => StorePreRegistration | null
  reviewingPreRegistrationId: string | null
  handleReviewPreRegistration: (
    item: StorePreRegistration,
    action: 'approve' | 'reject',
    notificationId?: string,
  ) => void | Promise<void>
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'approval':
      return <ShieldCheck size={20} className="text-brand-primary" />
    case 'discipline':
      return <AlertTriangle size={20} className="text-status-error" />
    case 'performance':
      return <TrendingUp size={20} className="text-status-success" />
    case 'alert':
      return <Clock size={20} className="text-status-warning" />
    default:
      return <Bell size={20} className="text-brand-primary" />
  }
}

export function NotificacoesListSection({
  unreadCount,
  grouped,
  isOwner,
  markRead,
  markUnread,
  deleteNotification,
  isApprovalNotification,
  getApprovalForNotification,
  reviewingPreRegistrationId,
  handleReviewPreRegistration,
}: Props) {
  const navigate = useNavigate()

  return (
    <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group relative">
      <div className="absolute top-mx-0 right-mx-0 p-mx-14 text-surface-alt -rotate-12 pointer-events-none group-hover:text-mx-indigo-50/50 transition-colors hidden md:block">
        <Bell size={240} strokeWidth={2} />
      </div>

      <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg md:p-10 flex flex-col sm:flex-row items-center justify-between relative z-10 gap-mx-md">
        <div className="flex items-center gap-mx-md">
          <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-xl shrink-0">
            <Bell size={32} strokeWidth={2} />
          </div>
          <div>
            <Typography variant="h2" className="text-xl sm:text-2xl uppercase tracking-tighter leading-none">
              Meu Inbox
            </Typography>
            <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">
              SINALIZAÇÕES DE AUDITORIA
            </Typography>
          </div>
        </div>
        <Badge variant="brand" className="px-6 py-2 rounded-mx-full font-black shadow-mx-sm uppercase text-xs w-full sm:w-auto text-center">
          {unreadCount} NOVAS
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto no-scrollbar p-mx-lg md:p-14 relative z-10">
        <AnimatePresence mode="popLayout">
          {Object.entries(grouped).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 text-text-label">
              <ShieldCheck size={64} className="text-text-tertiary mb-8" />
              <Typography variant="h2" className="uppercase tracking-tighter">
                Inbox Limpo
              </Typography>
              <Typography variant="caption" tone="muted" className="max-w-xs mt-4 uppercase font-black tracking-widest">
                Nenhuma sinalização pendente na malha operacional.
              </Typography>
            </div>
          ) : (
            (Object.entries(grouped) as Array<[string, NotificationLike[]]>).map(([group, list]) => (
              <div key={group} className="space-y-mx-md mb-14 last:mb-0">
                <div className="flex items-center gap-mx-md px-4">
                  <Typography variant="caption" tone="muted" className="font-black tracking-widest uppercase whitespace-nowrap">
                    {group}
                  </Typography>
                  <div className="h-px flex-1 bg-border-default opacity-50" />
                </div>
                {list.map(n => {
                  const approval = getApprovalForNotification(n)
                  const approvalNotification = isApprovalNotification(n)

                  return (
                    <motion.article
                      key={n.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        void markRead(n.id)
                        if (n.link && !approvalNotification) navigate(n.link)
                      }}
                      className={cn(
                        'p-mx-lg rounded-mx-3xl border transition-all relative group/item flex flex-col sm:flex-row gap-mx-lg cursor-pointer',
                        n.read ? 'bg-surface-alt/30 border-border-default opacity-60' : 'bg-white border-brand-primary/20 shadow-mx-lg',
                        !n.read && n.priority === 'high' && 'border-status-error/20 bg-status-error-surface/30',
                      )}
                    >
                      <div
                        className={cn(
                          'w-mx-2xl h-mx-2xl rounded-mx-2xl shrink-0 flex items-center justify-center shadow-inner transition-transform group-hover/item:scale-110',
                          n.read ? 'bg-surface-alt text-text-tertiary' : 'bg-white border border-border-default',
                        )}
                      >
                        {getTypeIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <header className="flex justify-between items-start mb-2 gap-mx-sm">
                          <div className="flex items-center gap-mx-sm min-w-0">
                            <Typography variant="h3" className="text-base group-hover/item:text-brand-primary transition-colors truncate uppercase font-black tracking-tight">
                              {n.title}
                            </Typography>
                            {!n.read && n.priority === 'high' && (
                              <Badge variant="danger" className="text-mx-nano sm:text-xs font-black h-mx-5 px-3 rounded-mx-full animate-pulse shadow-sm shrink-0">
                                CRÍTICO
                              </Badge>
                            )}
                          </div>
                          <Typography variant="mono" tone="muted" className="text-mx-tiny sm:text-xs font-black uppercase tracking-widest shrink-0">
                            {format(new Date(n.created_at), 'HH:mm')}
                          </Typography>
                        </header>
                        <Typography variant="p" tone="muted" className="text-sm font-bold leading-relaxed italic line-clamp-2 uppercase tracking-tight opacity-60">
                          "{n.message}"
                        </Typography>
                        {approval && (
                          <NotificacaoApprovalCard
                            approval={approval}
                            notificationId={n.id}
                            reviewingPreRegistrationId={reviewingPreRegistrationId}
                            onReview={handleReviewPreRegistration}
                          />
                        )}
                        <footer className="flex flex-wrap items-center gap-mx-md mt-6">
                          {n.link && !approvalNotification && (
                            <Typography
                              variant="caption"
                              tone="brand"
                              className="text-xs font-black uppercase tracking-widest flex items-center gap-mx-xs group-hover/item:translate-x-1 transition-transform"
                            >
                              Ação Imediata <ChevronRight size={12} strokeWidth={3} />
                            </Typography>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              if (n.read) {
                                void markUnread(n.id)
                                toast.success('Alerta marcado como não lido.')
                              } else {
                                void markRead(n.id)
                                toast.success('Alerta marcado como lido.')
                              }
                            }}
                            className="text-xs font-black text-text-tertiary hover:text-brand-primary uppercase tracking-widest p-mx-0 h-auto hover:bg-transparent"
                          >
                            {n.read ? 'Marcar não lida' : 'Marcar lida'}
                          </Button>
                          {!isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                void deleteNotification(n.id)
                                toast.success('Alerta removido!')
                              }}
                              className="text-xs font-black text-text-tertiary hover:text-status-error uppercase tracking-widest p-mx-0 h-auto hover:bg-transparent"
                            >
                              Remover
                            </Button>
                          )}
                        </footer>
                      </div>
                      {!n.read && (
                        <div className="absolute right-mx-lg top-mx-sm sm:top-1/2 sm:-translate-y-1/2 w-2.5 h-2.5 rounded-mx-full bg-brand-primary shadow-mx-md animate-pulse" />
                      )}
                    </motion.article>
                  )
                })}
              </div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default NotificacoesListSection
