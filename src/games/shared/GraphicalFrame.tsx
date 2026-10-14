import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useGraphicalSession } from './useGraphicalSession'

type Session = ReturnType<typeof useGraphicalSession>
export function GraphicalFrame({
  title,
  instructions,
  session,
  onStart,
  children,
}: {
  title: string
  instructions: string
  session: Session
  onStart: () => void
  children: ReactNode
}) {
  return (
    <>
      <header className="page-header">
        <div>
          <Link to="/giochi">← Torna ai giochi</Link>
          <p className="eyebrow">Allenamento interattivo</p>
          <h1>{title}</h1>
          <p>{instructions}</p>
        </div>
      </header>
      <section className="toolbar">
        <label>
          Difficoltà
          <select
            value={session.difficulty}
            disabled={
              session.status === 'running' || session.status === 'paused'
            }
            onChange={(event) =>
              session.setDifficulty(event.target.value as Session['difficulty'])
            }
          >
            <option value="easy">Facile</option>
            <option value="medium">Media</option>
            <option value="hard">Difficile</option>
          </select>
        </label>
        <button className="button primary" onClick={onStart}>
          {session.status === 'idle' ? 'Avvia' : 'Riavvia'}
        </button>
        {(session.status === 'running' || session.status === 'paused') && (
          <button
            className="button ghost"
            onClick={() =>
              session.setStatus(
                session.status === 'running' ? 'paused' : 'running',
              )
            }
          >
            {session.status === 'running' ? 'Pausa' : 'Riprendi'}
          </button>
        )}
        <span>Tempo: {session.seconds}s</span>
      </section>
      {session.status === 'idle' ? (
        <section className="panel">
          <p>Scegli la difficoltà e premi Avvia.</p>
        </section>
      ) : session.status === 'paused' ? (
        <section className="panel" role="status">
          Sessione in pausa.
        </section>
      ) : session.status === 'completed' ? (
        <section className="panel result-card" role="status">
          <h2>Risultato salvato</h2>
          <p>
            Punteggio: {session.score} su 100 · Tempo: {session.seconds}s
          </p>
          <button className="button primary" onClick={onStart}>
            Gioca ancora
          </button>
        </section>
      ) : (
        children
      )}
    </>
  )
}
