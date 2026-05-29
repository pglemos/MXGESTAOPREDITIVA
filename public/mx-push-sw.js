/* MX Performance — Push Notification Service Worker
 * Sprint 3 / S3-T5. Recebe push do Supabase Edge Function `send-push-notification`
 * (Web Push Protocol + VAPID) e mostra notificação.
 * Click direciona para a URL informada (default: '/notificacoes').
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'MX Performance', body: '', url: '/notificacoes' }
  try {
    if (event.data) {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    }
  } catch (_err) {
    if (event.data) {
      payload.body = event.data.text()
    }
  }
  const title = payload.title || 'MX Performance'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/mx-logo.png',
    badge: payload.badge || '/mx-logo.png',
    data: { url: payload.url || '/notificacoes' },
    tag: payload.tag || 'mx-notification',
    renotify: Boolean(payload.renotify),
    requireInteraction: Boolean(payload.requireInteraction),
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/notificacoes'
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url)
          if (clientUrl.pathname === targetUrl || clientUrl.href.endsWith(targetUrl)) {
            await client.focus()
            return
          }
        } catch (_err) {
          /* noop */
        }
      }
      await self.clients.openWindow(targetUrl)
    })(),
  )
})
