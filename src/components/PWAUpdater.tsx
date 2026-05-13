import { useEffect, useState } from 'react'
import { toast } from 'sonner'

async function clearPreRegistrationCaches() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
  }
}

export function PWAUpdater() {
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (registered) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (window.location.pathname.startsWith('/pre-cadastro')) {
      clearPreRegistrationCaches().catch(() => {})
      return
    }

    let cancelled = false
    let updateInterval: ReturnType<typeof setInterval> | null = null

    ;(async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register')
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() {
            toast.info('Nova versão disponível', {
              description: 'Toque para atualizar agora.',
              duration: Infinity,
              action: {
                label: 'Atualizar',
                onClick: () => updateSW(true),
              },
            })
          },
          onOfflineReady() {},
          onRegisteredSW(_swUrl, registration) {
            if (!registration) return
            updateInterval = setInterval(() => {
              registration.update().catch(() => {})
            }, 60 * 60 * 1000)
          },
        })
        if (!cancelled) setRegistered(true)
      } catch {
        // virtual module ausente em dev
      }
    })()

    return () => {
      cancelled = true
      if (updateInterval) clearInterval(updateInterval)
    }
  }, [registered])

  return null
}
