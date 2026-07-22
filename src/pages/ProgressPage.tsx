import { StatCard } from '../components/StatCard'
import { useTrainingStore } from '../storage/useTrainingStore'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ProgressPage() {
  const { sessions, clearSessions } = useTrainingStore()
  const best = sessions.length
    ? Math.max(...sessions.map((s) => s.efficiency))
    : null
  const average = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.seconds, 0) / sessions.length)
    : null
  const level = sessions.length
    ? Math.max(...sessions.map((s) => s.disks))
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
        <StatCard label="Miglior efficienza" value={best ? `${best}%` : '—'} />
        <StatCard
          label="Tempo medio"
          value={average ? formatTime(average) : '—'}
        />
        <StatCard label="Livello più alto" value={level ?? '—'} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Ultime sessioni</h2>
          {sessions.length > 0 && (
            <button className="button ghost" onClick={clearSessions}>
              Cancella dati
            </button>
          )}
        </div>
        {sessions.length === 0 ? (
          <p className="empty">
            Completa una sessione per vedere qui i tuoi progressi.
          </p>
        ) : (
          <div className="history-list">
            {sessions.map((s) => (
              <article key={s.id}>
                <div>
                  <strong>Torre di Hanoi · {s.disks} dischi</strong>
                  <small>
                    {new Date(s.completedAt).toLocaleString('it-IT')}
                  </small>
                </div>
                <span>
                  {s.moves} mosse · {formatTime(s.seconds)} · {s.efficiency}%
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
