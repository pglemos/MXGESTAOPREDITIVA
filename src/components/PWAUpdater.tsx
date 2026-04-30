import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function PWAUpdater() {
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (registered) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

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
          onOfflineReady() {
            toast.success('Pronto para uso offline', { duration: 3000 })
          },
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
