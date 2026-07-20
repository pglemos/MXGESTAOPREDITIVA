import { useEffect, useState } from 'react'

async function clearPreRegistrationCaches() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))
  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.map(name => caches.delete(name)))
  }
}

export function PWAUpdater() {
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (registered || typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (window.location.pathname.startsWith('/pre-cadastro')) {
      clearPreRegistrationCaches().catch(() => {})
      return
    }

    let cancelled = false
    let interval: ReturnType<typeof setInterval> | null = null
    ;(async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register')
        const updateSW = registerSW({
          immediate: true,
          onNeedRefresh() { void updateSW(true) },
          onOfflineReady() {},
          onRegisteredSW(_url, registration) {
            if (!registration) return
            interval = setInterval(() => registration.update().catch(() => {}), 5 * 60 * 1000)
          },
        })
        if (!cancelled) setRegistered(true)
      } catch {
        // virtual module ausente em desenvolvimento
      }
    })()

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [registered])

  return null
}
