import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { QueryProvider } from './components/providers/QueryProvider'
import { PWAUpdater } from './components/PWAUpdater'
import { initSentry, initWebVitals } from './lib/observability'
import './index.css'
import '../packages/mx-tokens/src/theme.css'

initSentry()
initWebVitals()

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
  </React.StrictMode>,
)
