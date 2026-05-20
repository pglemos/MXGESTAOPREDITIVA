import { isPerfilInternoMx, useAuth } from '@/hooks/useAuth'
import { FeedbackErrorBoundary } from './components/FeedbackErrorBoundary'
import { AdminFeedbackContainer } from './containers/AdminFeedback.container'
import { StoreFeedbackContainer } from './containers/StoreFeedback.container'

/**
 * GerenteFeedback — container raiz.
 *
 * Decomposição da page monolítica `src/pages/GerenteFeedback.tsx` (Story 2.4 / ADR-0050).
 * Mantém comportamento idêntico: Admin MX vê visão de rede, demais perfis veem visão da loja.
 *
 * Focus traps dos modais Admin/Store foram preservados (Story 3.12 — `useFocusTrap` +
 * Escape handlers) e migrados para dentro de `AdminFeedbackModal` / `StoreFeedbackModal`.
 */
export function GerenteFeedback() {
  const { role } = useAuth()
  const isAdmin = isPerfilInternoMx(role)

  return (
    <FeedbackErrorBoundary sectionName="GerenteFeedback">
      {isAdmin ? <AdminFeedbackContainer /> : <StoreFeedbackContainer />}
    </FeedbackErrorBoundary>
  )
}

export default GerenteFeedback
