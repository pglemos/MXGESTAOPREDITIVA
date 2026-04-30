import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { parseNotificationArray, type Notification as AppNotification } from '@/lib/schemas/notification.schema'

export function useNotifications() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['notificacoes', profile?.id],
    queryFn: async () => {
      if (!profile) return { notificacoes: [] as AppNotification[], unreadCount: 0 }

      const { data, error } = await supabase.from('notificacoes')
        .select('*')
        .eq('recipient_id', profile.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        throw error
      }

      const notificacoes = parseNotificationArray(data || [])
      return { notificacoes, unreadCount: notificacoes.filter(n => !n.read).length }
    },
    enabled: !!profile,
  })

  const markReadMut = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!profile) return
      await supabase.from('notificacoes').update({ read: true }).eq('id', notificationId).eq('recipient_id', profile.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })

  const markAllAsReadMut = useMutation({
    mutationFn: async () => {
      if (!profile) return
      await supabase.from('notificacoes').update({ read: true }).eq('recipient_id', profile.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })

  const deleteNotificationMut = useMutation({
    mutationFn: async (id: string) => {
      if (!profile) return
      await supabase.from('notificacoes').delete().eq('id', id).eq('recipient_id', profile.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
    },
  })

  const sendNotificationMut = useMutation({
    mutationFn: async (input: { title: string; message: string; type?: string; priority?: string; recipient_id?: string; store_id?: string; target_role?: string; link?: string }) => {
      if (!profile) return { error: 'Não autenticado' }

      if (!input.recipient_id && (input.target_role || input.store_id)) {
        const { error } = await supabase.rpc('send_broadcast_notification', {
          p_title: input.title,
          p_message: input.message,
          p_type: input.type || 'system',
          p_priority: input.priority || 'medium',
          p_store_id: input.store_id || null,
          p_target_role: input.target_role || 'todos',
          p_link: input.link || null,
          p_sender_id: profile.id,
        })
        return { error: error?.message || null }
      }

      const { error } = await supabase.from('notificacoes').insert({ ...input, sender_id: profile.id, read: false })
      return { error: error?.message || null }
    },
    onSuccess: (result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] })
      }
    },
  })

  return {
    notificacoes: data?.notificacoes || [],
    unreadCount: data?.unreadCount || 0,
    loading,
    markRead: (id: string) => markReadMut.mutateAsync(id),
    markAllAsRead: () => markAllAsReadMut.mutateAsync(),
    deleteNotification: (id: string) => deleteNotificationMut.mutateAsync(id),
    sendNotification: (input: Parameters<typeof sendNotificationMut.mutateAsync>[0]) => sendNotificationMut.mutateAsync(input),
    fetchNotifications: refetch,
    refetch,
  }
}
