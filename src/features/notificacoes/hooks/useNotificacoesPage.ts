import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/lib/toast'
import { useNotifications } from '@/hooks/useData'
import { getSupabaseFunctionUrl, supabase } from '@/lib/supabase'
import { isAdministradorMx, useAuth } from '@/hooks/useAuth'
import type { StorePreRegistration } from '@/types/database'
import { requestToastConfirmation } from '@/lib/ui/confirmAction'
import {
  getPreRegistrationIdFromLink,
  preRegistrationSelect,
} from '../data/preRegistration'

/**
 * Hook agregador da página Notificacoes — concentra queries, realtime channel
 * (única subscription) e handlers compartilhados pelas seções (header, lista,
 * filtros). Story 3.1, ADR-0050.
 */
export function useNotificacoesPage() {
  const { profile, role } = useAuth()
  const isAdminMx = isAdministradorMx(role)
  const isOwner = role === 'dono'

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
  const [reviewingPreRegistrationId, setReviewingPreRegistrationId] =
    useState<string | null>(null)

  const approvalFunctionUrl = useMemo(
    () => getSupabaseFunctionUrl('approve-store-registration'),
    [],
  )

  const { data: pendingPreRegistrations = [], refetch: refetchPreRegistrations } =
    useQuery({
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

  // Realtime subscription — única, centralizada no hook agregador.
  useEffect(() => {
    if (!profile?.id || !isAdminMx) return

    const channelInstanceId = `${profile.id}:${Date.now()}:${Math.random()
      .toString(36)
      .slice(2)}`
    const channel = supabase
      .channel(`pre-cadastros-approvals:${channelInstanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pre_cadastros_loja' },
        () => {
          void refetchPreRegistrations()
          void fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchNotifications, isAdminMx, profile?.id, refetchPreRegistrations])

  const pendingPreRegistrationsById = useMemo(() => {
    return new Map(pendingPreRegistrations.map(item => [item.id, item]))
  }, [pendingPreRegistrations])

  const isApprovalNotification = useCallback(
    (notification: { type: string; title: string }) => {
      return (
        notification.type === 'approval' ||
        notification.title.toLowerCase().includes('login pendente')
      )
    },
    [],
  )

  const getApprovalForNotification = useCallback(
    (notification: {
      link?: string | null
      store_id?: string | null
      message: string
      type: string
      title: string
    }) => {
      if (!isApprovalNotification(notification)) return null

      const idFromLink = getPreRegistrationIdFromLink(notification.link)
      if (idFromLink && pendingPreRegistrationsById.has(idFromLink)) {
        return pendingPreRegistrationsById.get(idFromLink) || null
      }

      const normalizedMessage = notification.message.toLocaleLowerCase('pt-BR')
      return (
        pendingPreRegistrations.find(
          item =>
            item.store_id === notification.store_id &&
            normalizedMessage.includes(
              item.full_name.toLocaleLowerCase('pt-BR'),
            ),
        ) || null
      )
    },
    [isApprovalNotification, pendingPreRegistrations, pendingPreRegistrationsById],
  )

  const filtered = useMemo(() => {
    return (notificacoes || []).filter(n => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

    return filtered.reduce(
      (acc, n) => {
        const date = n.created_at.split('T')[0]
        let group = 'Anteriores'
        if (date === today) group = 'Hoje'
        else if (date === yesterday) group = 'Ontem'

        if (!acc[group]) acc[group] = []
        acc[group].push(n)
        return acc
      },
      {} as Record<string, typeof filtered>,
    )
  }, [filtered])

  const handleRefresh = useCallback(async () => {
    setIsRefetching(true)
    await Promise.all([fetchNotifications(), refetchPreRegistrations()])
    setIsRefetching(false)
    toast.success('Central sincronizada!')
  }, [fetchNotifications, refetchPreRegistrations])

  const executeReviewPreRegistration = useCallback(
    async (
      item: StorePreRegistration,
      action: 'approve' | 'reject',
      notificationId?: string,
    ) => {
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
        if (!response.ok || !payload.success)
          throw new Error(payload.error || 'Não foi possível revisar o login.')

        if (notificationId) await markRead(notificationId)
        const temporaryPassword =
          typeof payload.temporary_password === 'string'
            ? payload.temporary_password
            : ''
        toast.success(
          action === 'approve' && temporaryPassword
            ? `Login aprovado. Senha temporária: ${temporaryPassword}`
            : action === 'approve'
              ? 'Login aprovado e sincronizado.'
              : 'Login rejeitado.',
          action === 'approve' && temporaryPassword
            ? { duration: 15000 }
            : undefined,
        )
        await Promise.all([fetchNotifications(), refetchPreRegistrations()])
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Falha ao revisar login.',
        )
      } finally {
        setReviewingPreRegistrationId(null)
      }
    },
    [
      approvalFunctionUrl,
      fetchNotifications,
      isAdminMx,
      markRead,
      refetchPreRegistrations,
    ],
  )

  const handleReviewPreRegistration = useCallback(
    async (
      item: StorePreRegistration,
      action: 'approve' | 'reject',
      notificationId?: string,
    ) => {
      if (!isAdminMx) return
      const label = action === 'approve' ? 'aprovar' : 'rejeitar'

      requestToastConfirmation({
        key: `notification-pre-registration:${item.id}:${action}`,
        title: `Confirmar ${label} login?`,
        description: `${item.full_name} (${item.email}) será ${action === 'approve' ? 'liberado para acesso' : 'rejeitado'}.`,
        label: action === 'approve' ? 'Aprovar' : 'Rejeitar',
        onConfirm: () =>
          void executeReviewPreRegistration(item, action, notificationId),
      })
    },
    [executeReviewPreRegistration, isAdminMx],
  )

  return {
    // role flags
    isAdminMx,
    isOwner,
    // data
    unreadCount,
    grouped,
    filtered,
    // filtros
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    // refresh
    isRefetching,
    handleRefresh,
    // ações de notificação
    markRead,
    markUnread,
    markAllAsRead,
    deleteNotification,
    // aprovações
    isApprovalNotification,
    getApprovalForNotification,
    reviewingPreRegistrationId,
    handleReviewPreRegistration,
  }
}

export type NotificacoesPageState = ReturnType<typeof useNotificacoesPage>
