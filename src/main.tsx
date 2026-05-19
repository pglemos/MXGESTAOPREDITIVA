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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
      <PWAUpdater />
    </QueryProvider>
  </React.StrictMode>
)
