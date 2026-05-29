import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

/**
 * Hook do Sprint 3 — S3-T5 (Push notifications).
 *
 * Encapsula:
 *   • Detecção de suporte (PushManager + Notification + ServiceWorker)
 *   • Registro do Service Worker `/mx-push-sw.js`
 *   • Inscrição com VAPID public key (`VITE_VAPID_PUBLIC_KEY`)
 *   • Persistência da subscription em `public.push_subscriptions` via RLS
 *   • Cancelamento e limpeza
 */

const SW_PATH = '/mx-push-sw.js'
const SW_SCOPE = '/'

type PushState = {
  supported: boolean
  permission: NotificationPermission | 'unknown'
  subscribed: boolean
  subscribing: boolean
  error: string | null
}

const INITIAL_STATE: PushState = {
  supported: false,
  permission: 'unknown',
  subscribed: false,
  subscribing: false,
  error: null,
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE)
  if (existing && existing.active && existing.active.scriptURL.endsWith(SW_PATH)) {
    return existing
  }
  return navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE })
}

export function usePushNotifications(userId: string | null | undefined) {
  const [state, setState] = useState<PushState>(INITIAL_STATE)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    setState((current) => ({
      ...current,
      supported,
      permission: supported ? Notification.permission : 'unknown',
    }))
    if (!supported) return
    void (async () => {
      try {
        const reg = await ensureRegistration()
        const sub = await reg.pushManager.getSubscription()
        setState((current) => ({ ...current, subscribed: Boolean(sub) }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao registrar service worker.'
        setState((current) => ({ ...current, error: message }))
      }
    })()
  }, [])

  const subscribe = useCallback(async () => {
    if (!state.supported) {
      toast.error('Push notifications não são suportados neste navegador.')
      return false
    }
    if (!userId) {
      toast.error('Faça login antes de ativar notificações.')
      return false
    }
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!publicKey) {
      toast.error('VAPID public key não configurada (VITE_VAPID_PUBLIC_KEY).')
      return false
    }
    setState((current) => ({ ...current, subscribing: true, error: null }))
    try {
      const permission = await Notification.requestPermission()
      setState((current) => ({ ...current, permission }))
      if (permission !== 'granted') {
        toast.warning('Permissão de notificações foi negada.')
        return false
      }
      const reg = await ensureRegistration()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const payload = sub.toJSON()
      const p256dh = payload?.keys?.p256dh ?? arrayBufferToBase64(sub.getKey('p256dh'))
      const auth = payload?.keys?.auth ?? arrayBufferToBase64(sub.getKey('auth'))
      const endpoint = sub.endpoint
      if (!endpoint || !p256dh || !auth) {
        throw new Error('Subscription incompleta — endpoint/keys ausentes.')
      }
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' },
        )
      if (error) throw error
      setState((current) => ({ ...current, subscribed: true, subscribing: false }))
      toast.success('Notificações ativadas.')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao ativar notificações.'
      setState((current) => ({ ...current, subscribing: false, error: message }))
      toast.error(message)
      return false
    }
  }, [state.supported, userId])

  const unsubscribe = useCallback(async () => {
    if (!state.supported) return false
    try {
      const reg = await ensureRegistration()
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setState((current) => ({ ...current, subscribed: false }))
      toast.success('Notificações desativadas.')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao desativar notificações.'
      setState((current) => ({ ...current, error: message }))
      toast.error(message)
      return false
    }
  }, [state.supported])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}
