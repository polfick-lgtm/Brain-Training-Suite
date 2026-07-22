import { Component, ErrorInfo, ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Errore applicazione', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error">
          <p className="eyebrow">Errore inatteso</p>
          <h1>Non siamo riusciti a mostrare questa schermata</h1>
          <p>I dati locali non sono stati inviati né modificati.</p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Ricarica l'app
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
