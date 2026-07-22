import { StatCard } from '../components/StatCard'
import { TrainingSession } from '../storage/models'
import { useTrainingStore } from '../storage/useTrainingStore'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function detailNumber(session: TrainingSession, key: string) {
  const value = session.details[key]
  return typeof value === 'number' ? value : null
}

export function ProgressPage() {
  const { sessions, clearSessions } = useTrainingStore()
  const best = sessions.length
    ? Math.max(...sessions.map((session) => session.score))
    : null
  const average = sessions.length
    ? Math.round(
        sessions.reduce((sum, session) => sum + session.durationSeconds, 0) /
          sessions.length,
      )
    : null
  const level = sessions.length
    ? Math.max(
        ...sessions.map((session) => detailNumber(session, 'disks') ?? 0),
      )
    : null

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">La mia evoluzione</p>
          <h1>Progressi</h1>
          <p>Una lettura semplice e trasparente della tua attività.</p>
        </div>
      </header>
      <section className="summary-grid">
        <StatCard label="Partite completate" value={sessions.length} />
        <StatCard
          label="Miglior punteggio"
          value={best !== null ? Math.round(best) : '—'}
        />
        <StatCard
          label="Tempo medio"
          value={average !== null ? formatTime(average) : '—'}
        />
        <StatCard label="Livello Hanoi più alto" value={level || '—'} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Ultime sessioni</h2>
          {sessions.length > 0 && (
            <button className="button ghost" onClick={clearSessions}>
              Cancella sessioni
            </button>
          )}
        </div>
        {sessions.length === 0 ? (
          <p className="empty">
            Completa una sessione per vedere qui i tuoi progressi.
          </p>
        ) : (
          <div className="history-list">
            {sessions.map((session) => {
              const disks = detailNumber(session, 'disks')
              const moves = detailNumber(session, 'moves')
              return (
                <article key={session.id}>
                  <div>
                    <strong>
                      {session.gameId === 'hanoi'
                        ? 'Torre di Hanoi'
                        : session.gameId}
                      {disks ? ` · ${disks} dischi` : ''}
                    </strong>
                    <small>
                      {new Date(session.completedAt).toLocaleString('it-IT')}
                    </small>
                  </div>
                  <span>
                    {moves !== null ? `${moves} mosse · ` : ''}
                    {formatTime(session.durationSeconds)} · punteggio{' '}
                    {Math.round(session.score)}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
