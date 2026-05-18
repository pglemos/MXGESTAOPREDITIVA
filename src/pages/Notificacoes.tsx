import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, X, Search, RefreshCw, 
  MoreVertical, Trash2, ChevronRight, MessageSquare, Megaphone, 
  Zap, Filter, CheckCheck, TrendingUp, History, Smartphone, ShieldCheck, UserRound
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Typography } from '@/components/atoms/Typography'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/molecules/Card'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useNotifications } from '@/hooks/useData'
import { format } from 'date-fns'
import { getSupabaseFunctionUrl, supabase } from '@/lib/supabase'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import type { StorePreRegistration } from '@/types/database'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'

const preRegistrationSelect = [
  'id',
  'store_id',
  'store_name_snapshot',
  'auth_user_id',
  'full_name',
  'email',
  'phone',
  'role',
  'segment',
  'store_tenure',
  'market_experience',
  'notes',
  'company_legal_name',
  'company_cnpj',
  'company_address',
  'company_administrative_phone',
  'avatar_url',
  'avatar_storage_path',
  'status',
  'submitted_at',
  'reviewed_by',
  'reviewed_at',
  'approved_by',
  'approved_at',
  'rejected_by',
  'rejected_at',
  'approval_note',
].join(', ')

function getPreRegistrationIdFromLink(link?: string | null) {
  if (!link) return null

  try {
    const url = new URL(link, 'https://mx.local')
    return url.searchParams.get('preRegistrationId') || url.searchParams.get('pre_registration_id')
  } catch {
    return null
  }
}

export default function Notificacoes() {
  const { profile, role } = useAuth()
  const isAdminMx = isAdministradorMx(role)
  const isOwner = role === 'dono'
  const isSeller = role === 'vendedor'
  const {
    notificacoes,
    markRead,
    markUnread,
    markAllAsRead,
    deleteNotification,
    unreadCount,
    fetchNotifications,
  } = useNotifications()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)
  const [reviewingPreRegistrationId, setReviewingPreRegistrationId] = useState<string | null>(null)
  const navigate = useNavigate()
  const approvalFunctionUrl = useMemo(() => getSupabaseFunctionUrl('approve-store-registration'), [])

  const { data: pendingPreRegistrations = [], refetch: refetchPreRegistrations } = useQuery({
    queryKey: ['pre-cadastro-approvals', profile?.id],
    queryFn: async () => {
      if (!isAdminMx) return [] as StorePreRegistration[]

      const { data, error } = await supabase
        .from('pre_cadastros_loja')
        .select(preRegistrationSelect)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false })
        .limit(80)

      if (error) throw error
      return (data || []) as unknown as StorePreRegistration[]
    },
    enabled: !!profile?.id && isAdminMx,
  })

  useEffect(() => {
    if (!profile?.id || !isAdminMx) return

    const channelInstanceId = `${profile.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`
    const channel = supabase
      .channel(`pre-cadastros-approvals:${channelInstanceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pre_cadastros_loja' }, () => {
        void refetchPreRegistrations()
        void fetchNotifications()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchNotifications, isAdminMx, profile?.id, refetchPreRegistrations])

  const pendingPreRegistrationsById = useMemo(() => {
    return new Map(pendingPreRegistrations.map(item => [item.id, item]))
  }, [pendingPreRegistrations])

  const isApprovalNotification = useCallback((notification: { type: string; title: string }) => {
    return notification.type === 'approval' || notification.title.toLowerCase().includes('login pendente')
  }, [])

  const getApprovalForNotification = useCallback((notification: { link?: string | null; store_id?: string | null; message: string; type: string; title: string }) => {
    if (!isApprovalNotification(notification)) return null

    const idFromLink = getPreRegistrationIdFromLink(notification.link)
    if (idFromLink && pendingPreRegistrationsById.has(idFromLink)) {
      return pendingPreRegistrationsById.get(idFromLink) || null
    }

    const normalizedMessage = notification.message.toLocaleLowerCase('pt-BR')
    return pendingPreRegistrations.find(item =>
      item.store_id === notification.store_id &&
      normalizedMessage.includes(item.full_name.toLocaleLowerCase('pt-BR')),
    ) || null
  }, [isApprovalNotification, pendingPreRegistrations, pendingPreRegistrationsById])

  const filtered = useMemo(() => {
    return (notificacoes || []).filter(n => {
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           n.message.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType ? n.type === filterType : true
      return matchesSearch && matchesType
    })
  }, [notificacoes, searchTerm, filterType])

  const grouped = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().split('T')[0]

    return filtered.reduce((acc, n) => {
      const date = n.created_at.split('T')[0]
      let group = 'Anteriores'
      if (date === today) group = 'Hoje'
      else if (date === yesterday) group = 'Ontem'
      
      if (!acc[group]) acc[group] = []
      acc[group].push(n)
      return acc
    }, {} as Record<string, typeof filtered>)
  }, [filtered])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    await Promise.all([fetchNotifications(), refetchPreRegistrations()])
    setIsRefetching(false)
    toast.success('Central sincronizada!')
  }, [fetchNotifications, refetchPreRegistrations])

  const executeReviewPreRegistration = useCallback(async (item: StorePreRegistration, action: 'approve' | 'reject', notificationId?: string) => {
    if (!isAdminMx) return

    setReviewingPreRegistrationId(item.id)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Sessão expirada. Entre novamente.')

      const response = await fetch(approvalFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pre_registration_id: item.id,
          action,
          role: item.role,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Não foi possível revisar o login.')

      if (notificationId) await markRead(notificationId)
      const temporaryPassword = typeof payload.temporary_password === 'string' ? payload.temporary_password : ''
      toast.success(
        action === 'approve' && temporaryPassword
          ? `Login aprovado. Senha temporária: ${temporaryPassword}`
          : action === 'approve' ? 'Login aprovado e sincronizado.' : 'Login rejeitado.',
        action === 'approve' && temporaryPassword ? { duration: 15000 } : undefined,
      )
      await Promise.all([fetchNotifications(), refetchPreRegistrations()])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao revisar login.')
    } finally {
      setReviewingPreRegistrationId(null)
    }
  }, [approvalFunctionUrl, fetchNotifications, isAdminMx, markRead, refetchPreRegistrations])

  const handleReviewPreRegistration = useCallback(async (item: StorePreRegistration, action: 'approve' | 'reject', notificationId?: string) => {
    if (!isAdminMx) return
    const label = action === 'approve' ? 'aprovar' : 'rejeitar'

    requestToastConfirmation({
      key: `notification-pre-registration:${item.id}:${action}`,
      title: `Confirmar ${label} login?`,
      description: `${item.full_name} (${item.email}) será ${action === 'approve' ? 'liberado para acesso' : 'rejeitado'}.`,
      label: action === 'approve' ? 'Aprovar' : 'Rejeitar',
      onConfirm: () => void executeReviewPreRegistration(item, action, notificationId),
    })
  }, [executeReviewPreRegistration, isAdminMx])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'approval': return <ShieldCheck size={20} className="text-brand-primary" />
      case 'discipline': return <AlertTriangle size={20} className="text-status-error" />
      case 'performance': return <TrendingUp size={20} className="text-status-success" />
      case 'alert': return <Clock size={20} className="text-status-warning" />
      default: return <Bell size={20} className="text-brand-primary" />
    }
  }

  return (
    <main className="w-full h-full flex flex-col gap-mx-lg p-mx-lg overflow-y-auto no-scrollbar bg-surface-alt">
      
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-mx-lg border-b border-border-default pb-10 shrink-0">
        <div className="flex flex-col gap-mx-tiny text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-mx-sm">
            <div className="w-mx-xs h-mx-10 bg-brand-primary rounded-mx-full shadow-mx-md" aria-hidden="true" />
            <Typography variant="h1">Central de <Typography as="span" className="text-brand-primary">Alertas</Typography></Typography>
          </div>
          <Typography variant="caption" className="pl-mx-md uppercase tracking-widest font-black">MOTOR DE DISCIPLINA & INTELIGÊNCIA MX</Typography>
        </div>

        <div className="flex items-center justify-center lg:justify-end gap-mx-sm shrink-0 w-full lg:w-auto">
          <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Atualizar" className="w-mx-xl h-mx-xl rounded-mx-xl shadow-mx-sm bg-white">
            <RefreshCw size={20} className={cn(isRefetching && "animate-spin")} />
          </Button>
          <Button variant="outline" onClick={() => {markAllAsRead(); toast.success('Tudo lido!')}} className="h-mx-xl px-6 flex-1 lg:flex-none rounded-mx-full shadow-mx-sm uppercase font-black text-xs bg-white tracking-widest">
            <CheckCheck size={18} className="mr-2" /> MARCAR TUDO
          </Button>
        </div>
      </header>

      {isOwner && (
        <Card className="border border-status-info/20 bg-status-info-surface p-mx-lg shadow-mx-sm">
          <Typography variant="h3" className="uppercase tracking-tight text-status-info">Notificações filtradas para Dono</Typography>
          <Typography variant="p" className="mt-mx-xs text-sm text-status-info">
            Você recebe sinais de decisão, aprovações que exigem ciência e alertas de governança da rede. Ações técnicas de pré-cadastro, permissões e operação diária ficam com Admin MX ou gerente.
          </Typography>
        </Card>
      )}
      {isSeller && (
        <Card className="border border-brand-primary/15 bg-white p-mx-md shadow-mx-sm">
          <div className="flex flex-col gap-mx-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Typography variant="h3" className="uppercase tracking-tight">Parte do ritual diário</Typography>
              <Typography variant="p" tone="muted" className="mt-mx-xs text-sm">
                Revise alertas depois do lançamento: pendências, feedbacks e avisos podem exigir ação antes de seguir para ranking ou treinamentos.
              </Typography>
            </div>
            <Badge variant={unreadCount > 0 ? 'danger' : 'success'} className="w-fit rounded-mx-full px-4 py-1">
              {unreadCount > 0 ? `${unreadCount} pendente(s)` : 'Tudo lido'}
            </Badge>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-mx-lg flex-1 min-h-0 pb-32">
        <section className="lg:col-span-8 flex flex-col order-2 lg:order-1">
          <Card className="border-none shadow-mx-xl bg-white overflow-hidden h-full flex flex-col group relative">
            <div className="absolute top-mx-0 right-mx-0 p-mx-14 text-surface-alt -rotate-12 pointer-events-none group-hover:text-mx-indigo-50/50 transition-colors hidden md:block">
              <Bell size={240} strokeWidth={2} />
            </div>

            <CardHeader className="bg-surface-alt/30 border-b border-border-default p-mx-lg md:p-10 flex flex-col sm:flex-row items-center justify-between relative z-10 gap-mx-md">
              <div className="flex items-center gap-mx-md">
                <div className="w-mx-2xl h-mx-2xl rounded-mx-2xl bg-mx-black text-white flex items-center justify-center shadow-mx-xl shrink-0"><Bell size={32} strokeWidth={2} /></div>
                <div>
                  <Typography variant="h2" className="text-xl sm:text-2xl uppercase tracking-tighter leading-none">Meu Inbox</Typography>
                  <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">SINALIZAÇÕES DE AUDITORIA</Typography>
                </div>
              </div>
              <Badge variant="brand" className="px-6 py-2 rounded-mx-full font-black shadow-mx-sm uppercase text-xs w-full sm:w-auto text-center">{unreadCount} NOVAS</Badge>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-mx-lg md:p-14 relative z-10">
              <AnimatePresence mode="popLayout">
                {Object.entries(grouped).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 text-text-label">
                        <ShieldCheck size={64} className="text-text-tertiary mb-8" />
                        <Typography variant="h2" className="uppercase tracking-tighter">Inbox Limpo</Typography>
                        <Typography variant="caption" tone="muted" className="max-w-xs mt-4 uppercase font-black tracking-widest">Nenhuma sinalização pendente na malha operacional.</Typography>
                    </div>
                ) : (Object.entries(grouped) as Array<[string, typeof filtered]>).map(([group, list]) => (
                  <div key={group} className="space-y-mx-md mb-14 last:mb-0">
                    <div className="flex items-center gap-mx-md px-4">
                      <Typography variant="caption" tone="muted" className="font-black tracking-widest uppercase whitespace-nowrap">{group}</Typography>
                      <div className="h-px flex-1 bg-border-default opacity-50" />
                    </div>
                    {list.map((n) => {
                      const approval = getApprovalForNotification(n)
                      const approvalNotification = isApprovalNotification(n)

                      return (
                      <motion.article 
                        key={n.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                        onClick={() => {
                          markRead(n.id)
                          if (n.link && !approvalNotification) navigate(n.link)
                        }}
                        className={cn(
                          "p-mx-lg rounded-mx-3xl border transition-all relative group/item flex flex-col sm:flex-row gap-mx-lg cursor-pointer", 
                          n.read ? "bg-surface-alt/30 border-border-default opacity-60" : "bg-white border-brand-primary/20 shadow-mx-lg",
                          !n.read && n.priority === 'high' && "border-status-error/20 bg-status-error-surface/30"
                        )}
                      >
                        <div className={cn(
                          "w-mx-2xl h-mx-2xl rounded-mx-2xl shrink-0 flex items-center justify-center shadow-inner transition-transform group-hover/item:scale-110", 
                          n.read ? "bg-surface-alt text-text-tertiary" : "bg-white border border-border-default"
                        )}>
                          {getTypeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <header className="flex justify-between items-start mb-2 gap-mx-sm">
                            <div className="flex items-center gap-mx-sm min-w-0">
                              <Typography variant="h3" className="text-base group-hover/item:text-brand-primary transition-colors truncate uppercase font-black tracking-tight">{n.title}</Typography>
                              {!n.read && n.priority === 'high' && <Badge variant="danger" className="text-mx-nano sm:text-xs font-black h-mx-5 px-3 rounded-mx-full animate-pulse shadow-sm shrink-0">CRÍTICO</Badge>}
                            </div>
                            <Typography variant="mono" tone="muted" className="text-mx-tiny sm:text-xs font-black uppercase tracking-widest shrink-0">{format(new Date(n.created_at), 'HH:mm')}</Typography>
                          </header>
                          <Typography variant="p" tone="muted" className="text-sm font-bold leading-relaxed italic line-clamp-2 uppercase tracking-tight opacity-60">"{n.message}"</Typography>
                          {approval && (
                            <div
                              className="mt-mx-md rounded-mx-2xl border border-brand-primary/15 bg-white p-mx-md shadow-mx-sm"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-mx-sm">
                                <div className="flex items-start gap-mx-sm min-w-0">
                                  <div className="h-mx-14 w-mx-14 overflow-hidden rounded-mx-2xl border border-border-default bg-surface-alt shrink-0">
                                    {approval.avatar_url ? (
                                      <img src={approval.avatar_url} alt={approval.full_name} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-brand-primary"><UserRound size={20} /></div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <Typography variant="caption" className="font-black uppercase tracking-tight truncate">{approval.full_name}</Typography>
                                    <Typography variant="tiny" tone="muted" className="mt-1 block font-bold break-all">
                                      {approval.email} · {approval.phone}
                                    </Typography>
                                  </div>
                                </div>
                                <Badge variant="warning" className="font-black uppercase shrink-0">Pendente</Badge>
                              </div>
                              <div className="mt-mx-md grid grid-cols-1 sm:grid-cols-4 gap-mx-sm text-mx-tiny font-black uppercase">
                                <div>
                                  <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Loja</span>
                                  {approval.store_name_snapshot}
                                </div>
                                <div>
                                  <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Função</span>
                                  {approval.role}
                                </div>
                                <div>
                                  <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Na loja</span>
                                  {approval.store_tenure}
                                </div>
                                <div>
                                  <span className="block text-mx-nano text-text-tertiary tracking-mx-widest">Mercado</span>
                                  {approval.market_experience}
                                </div>
                              </div>
                              {approval.role === 'dono' && (
                                <div className="mt-mx-sm rounded-mx-xl border border-brand-primary/15 bg-surface-alt p-mx-sm">
                                  <Typography variant="tiny" tone="brand" className="mb-mx-xs block font-black uppercase tracking-widest">
                                    Dados administrativos
                                  </Typography>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-mx-xs text-mx-micro font-bold text-text-secondary">
                                    <span><b>Razão:</b> {approval.company_legal_name || 'não informado'}</span>
                                    <span><b>CNPJ:</b> {approval.company_cnpj || 'não informado'}</span>
                                    <span><b>Telefone:</b> {approval.company_administrative_phone || 'não informado'}</span>
                                    <span><b>Endereço:</b> {approval.company_address || 'não informado'}</span>
                                  </div>
                                </div>
                              )}
                              <div className="mt-mx-md flex flex-col sm:flex-row gap-mx-xs">
                                <Button
                                  type="button"
                                  onClick={() => void handleReviewPreRegistration(approval, 'approve', n.id)}
                                  disabled={reviewingPreRegistrationId === approval.id}
                                  className="h-mx-11 rounded-mx-xl font-black uppercase tracking-widest text-mx-nano"
                                >
                                  <CheckCircle2 size={15} className="mr-2" />
                                  Aprovar login
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => void handleReviewPreRegistration(approval, 'reject', n.id)}
                                  disabled={reviewingPreRegistrationId === approval.id}
                                  className="h-mx-11 rounded-mx-xl font-black uppercase tracking-widest text-mx-nano text-status-error hover:bg-status-error-surface"
                                >
                                  <X size={15} className="mr-2" />
                                  Rejeitar
                                </Button>
                              </div>
                            </div>
                          )}
                          <footer className="flex flex-wrap items-center gap-mx-md mt-6">
                            {n.link && !approvalNotification && <Typography variant="caption" tone="brand" className="text-xs font-black uppercase tracking-widest flex items-center gap-mx-xs group-hover/item:translate-x-1 transition-transform">Ação Imediata <ChevronRight size={12} strokeWidth={3} /></Typography>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (n.read) {
                                  markUnread(n.id)
                                  toast.success('Alerta marcado como não lido.')
                                } else {
                                  markRead(n.id)
                                  toast.success('Alerta marcado como lido.')
                                }
                              }}
                              className="text-xs font-black text-text-tertiary hover:text-brand-primary uppercase tracking-widest p-mx-0 h-auto hover:bg-transparent"
                            >
                              {n.read ? 'Marcar não lida' : 'Marcar lida'}
                            </Button>
                            {!isOwner && (
                              <Button
                                variant="ghost" size="sm"
                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); toast.success('Alerta removido!') }}
                                className="text-xs font-black text-text-tertiary hover:text-status-error uppercase tracking-widest p-mx-0 h-auto hover:bg-transparent"
                              >
                                Remover
                              </Button>
                            )}
                          </footer>
                        </div>
                        {!n.read && <div className="absolute right-mx-lg top-mx-sm sm:top-1/2 sm:-translate-y-1/2 w-2.5 h-2.5 rounded-mx-full bg-brand-primary shadow-mx-md animate-pulse" />}
                      </motion.article>
                      )
                    })}
                  </div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        <aside className="lg:col-span-4 flex flex-col gap-mx-lg order-1 lg:order-2">
          <Card className="p-mx-lg md:p-10 border-none shadow-mx-lg bg-white space-y-mx-10">
            <header className="border-b border-border-default pb-8">
                <Typography variant="h3" className="uppercase tracking-tight">Filtro Disciplinar</Typography>
                <Typography variant="caption" tone="muted" className="uppercase tracking-widest mt-1 font-black">SEGMENTAÇÃO DE ALERTAS</Typography>
            </header>
            
            <div className="relative group">
                <Search size={16} className="absolute left-mx-sm top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-brand-primary transition-colors" />
                <Input 
                    placeholder="LOCALIZAR ALERTA..." value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    className="!pl-11 !h-12 uppercase tracking-widest text-xs"
                />
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-mx-xs" role="navigation" aria-label="Filtros de notificação">
              {[
                { label: 'Cadastros', type: 'approval', icon: ShieldCheck, tone: 'brand' },
                { label: 'Lançamentos', type: 'discipline', icon: Smartphone, tone: 'error' },
                { label: 'Feedbacks', type: 'performance', icon: TrendingUp, tone: 'success' },
                { label: 'PDI', type: 'alert', icon: History, tone: 'warning' },
                { label: 'Geral', type: 'system', icon: Megaphone, tone: 'brand' }
              ].map(f => (
                <button 
                  key={f.label} 
                  onClick={() => setFilterType(filterType === f.type ? null : f.type)}
                  className={cn(
                    "w-full p-mx-md rounded-mx-2xl border transition-all text-left flex items-center justify-between group/f",
                    filterType === f.type ? "bg-brand-primary border-brand-primary text-white shadow-mx-lg" : "bg-surface-alt border-border-default hover:bg-white hover:border-brand-primary/20 shadow-inner"
                  )}
                >
                  <div className="flex items-center gap-mx-sm">
                    <f.icon size={16} className={cn(filterType === f.type ? "text-white" : "text-text-label")} />
                    <Typography variant="caption" className={cn("font-black uppercase tracking-widest", filterType === f.type ? "text-white" : "text-text-primary")}>{f.label}</Typography>
                  </div>
                  <ChevronRight size={14} className={cn(filterType === f.type ? "text-white/40" : "text-text-tertiary opacity-20 group-hover/f:text-brand-primary")} />
                </button>
              ))}
            </nav>

            <footer className="pt-8 border-t border-border-default hidden">
                <Button variant="outline" className="w-full h-mx-14 rounded-mx-full shadow-sm font-black uppercase tracking-widest text-xs bg-white border-border-strong hover:border-brand-primary">
                    AJUSTES DE ALERTA
                </Button>
            </footer>
          </Card>
        </aside>
      </div>
    </main>
  )
}
