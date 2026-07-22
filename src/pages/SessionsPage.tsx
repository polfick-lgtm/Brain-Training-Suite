import { Link } from 'react-router-dom'
import { gameCatalog } from '../core/games/catalog'
import {
  SessionDuration,
  SessionGoal,
} from '../features/sessions/sessionPlanner'
import { useSessionPlanStore } from '../features/sessions/useSessionPlanStore'

const titles = new Map(gameCatalog.map((game) => [game.id, game.title]))
const routes = new Map(gameCatalog.map((game) => [game.id, game.route]))

export function SessionsPage() {
  const session = useSessionPlanStore()

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Percorsi personalizzati</p>
          <h1>Sessioni</h1>
          <p>
            Combina più esercizi senza confronti esterni e interrompi in
            sicurezza quando vuoi.
          </p>
        </div>
      </header>
      {session.status === 'idle' ? (
        <form
          className="panel session-builder"
          onSubmit={(event) => {
            event.preventDefault()
            session.start(session.goal, session.duration)
          }}
        >
          <h2>Crea la tua sessione</h2>
          <label>
            Obiettivo
            <select
              value={session.goal}
              onChange={(event) =>
                useSessionPlanStore.setState({
                  goal: event.target.value as SessionGoal,
                })
              }
            >
              <option value="balanced">Equilibrata</option>
              <option value="memory">Memoria</option>
              <option value="attention">Attenzione</option>
              <option value="logic">Logica</option>
              <option value="speed">Velocità</option>
            </select>
          </label>
          <label>
            Durata obiettivo
            <select
              value={session.duration}
              onChange={(event) =>
                useSessionPlanStore.setState({
                  duration: Number(event.target.value) as SessionDuration,
                })
              }
            >
              <option value={10}>10 minuti · 3 giochi</option>
              <option value={15}>15 minuti · 4 giochi</option>
              <option value={20}>20 minuti · 5 giochi</option>
            </select>
          </label>
          <button className="button primary" type="submit">
            Inizia sessione
          </button>
        </form>
      ) : session.status === 'completed' ? (
        <section className="panel result-card">
          <p className="eyebrow">Sessione completata</p>
          <h2>Hai completato {session.plan.length} esercizi</h2>
          <p>
            Tempo totale: {session.elapsedSeconds} secondi. I risultati sono nei
            Progressi.
          </p>
          <button className="button primary" onClick={session.reset}>
            Crea un'altra sessione
          </button>
        </section>
      ) : (
        <section className="panel session-active">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                Sessione {session.status === 'paused' ? 'in pausa' : 'attiva'}
              </p>
              <h2>Tempo: {session.elapsedSeconds}s</h2>
            </div>
            <button className="button ghost" onClick={session.togglePause}>
              {session.status === 'paused'
                ? 'Riprendi sessione'
                : 'Pausa sessione'}
            </button>
          </div>
          <ol className="session-plan">
            {session.plan.map((gameId, index) => (
              <li
                key={gameId}
                className={
                  index < session.currentIndex
                    ? 'done'
                    : index === session.currentIndex
                      ? 'current'
                      : ''
                }
              >
                <span>{titles.get(gameId)}</span>
                {index < session.currentIndex && <strong>Completato</strong>}
                {index === session.currentIndex &&
                  session.status === 'running' && (
                    <Link
                      className="button primary"
                      to={routes.get(gameId) ?? '/giochi'}
                    >
                      Apri gioco
                    </Link>
                  )}
              </li>
            ))}
          </ol>
          <button className="button danger" onClick={session.reset}>
            Interrompi sessione
          </button>
        </section>
      )}
    </>
  )
}
