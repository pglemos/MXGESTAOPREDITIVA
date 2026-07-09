import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { QueryProvider } from './components/providers/QueryProvider'
import { PWAUpdater } from './components/PWAUpdater'
import { initSentry, initWebVitals } from './lib/observability'
import './index.css'

// Story 0.3 / SYS-017 / X-8 — inicializar Sentry antes de qualquer renderização
// No-op se VITE_SENTRY_DSN não estiver definido (dev local)
initSentry()

// Story 3.15 — Web Vitals (LCP, INP, CLS, FCP, TTFB) → Sentry tags + breadcrumbs
initWebVitals()

// Recupera de "Failed to fetch dynamically imported module": o chunk hasheado
// referenciado pelo bundle já carregado no browser deixou de existir porque um
// novo deploy substituiu os assets. Recarrega uma única vez (guard em
// sessionStorage evita loop infinito se o erro persistir por outro motivo).
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'mx-chunk-reload-at'
  const last = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - last > 10_000) {
    sessionStorage.setItem(key, String(Date.now()))
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
      <PWAUpdater />
    </QueryProvider>
  </React.StrictMode>
)
