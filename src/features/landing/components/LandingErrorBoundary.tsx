import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; sectionName?: string }
type State = { hasError: boolean; error: Error | null }

/**
 * ErrorBoundary local da landing — usado por seção, para que falha
 * em uma section não derrube a página inteira (AC4 da Story 2.1).
 */
export class LandingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[LandingErrorBoundary:${this.props.sectionName ?? 'unknown'}]`, error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '24px 32px',
            margin: '12px 0',
            border: '1px solid var(--line-2, #243227)',
            borderRadius: 8,
            background: 'var(--bg-1, #0B100C)',
            color: 'var(--ink-2, #9BA89F)',
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            fontSize: 12,
          }}
        >
          <strong style={{ color: 'var(--warn, #FFB547)' }}>
            // Bloco indisponível{this.props.sectionName ? `: ${this.props.sectionName}` : ''}
          </strong>
          <span style={{ display: 'block', marginTop: 6 }}>
            O restante da página continua disponível. Recarregue para tentar novamente.
          </span>
        </div>
      )
    }
    return this.props.children
  }
}

export default LandingErrorBoundary
