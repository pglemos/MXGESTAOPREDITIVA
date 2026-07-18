import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; sectionName?: string }
type State = { hasError: boolean; error: Error | null }

/**
 * ErrorBoundary local da page Lojas — falha em uma section não derruba a página inteira.
 *
 * Story 3.5 reconciliada (ADR-0050). Espelha o pattern do FeedbackErrorBoundary (Story 2.4),
 * AgendaErrorBoundary (Story 2.6) e DashboardErrorBoundary (Story 2.5).
 */
export class LojasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(
        `[LojasErrorBoundary:${this.props.sectionName ?? 'unknown'}]`,
        error,
        info,
      )
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="my-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs font-black uppercase tracking-widest text-amber-500"
        >
          <strong>
            // Bloco indisponível{this.props.sectionName ? `: ${this.props.sectionName}` : ''}
          </strong>
          <span className="mt-2 block normal-case tracking-normal text-gray-600">
            O restante da página continua disponível. Recarregue para tentar novamente.
          </span>
        </div>
      )
    }
    return this.props.children
  }
}

export default LojasErrorBoundary
