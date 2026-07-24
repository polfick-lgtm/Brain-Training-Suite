import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { StatCard } from '../components/StatCard'
import { gameCatalog } from '../core/games/catalog'
import { GameId } from '../core/games/types'
import {
  filterSessions,
  PeriodFilter,
  summarizeByGame,
} from '../statistics/analytics'
import { useTrainingStore } from '../storage/useTrainingStore'

const titles = new Map(gameCatalog.map((game) => [game.id, game.title]))

function formatMinutes(seconds: number) {
  return `${Math.round(seconds / 60)} min`
}

export function ProgressPage() {
  const { sessions, clearSessions } = useTrainingStore()
  const [period, setPeriod] = useState<PeriodFilter>(30)
  const [gameId, setGameId] = useState<GameId | 'all'>('all')
  const filtered = useMemo(
    () => filterSessions(sessions, period, gameId),
    [gameId, period, sessions],
  )
  const summaries = useMemo(() => summarizeByGame(filtered), [filtered])
  const best = filtered.length
    ? Math.max(...filtered.map((session) => session.score))
    : null
  const totalSeconds = filtered.reduce(
    (sum, session) => sum + session.durationSeconds,
    0,
  )
  const chartData = summaries.map((summary) => ({
    name: titles.get(summary.gameId) ?? summary.gameId,
    media: summary.averageScore,
  }))

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">La mia evoluzione</p>
          <h1>Progressi</h1>
          <p>
            Statistiche locali descrittive, senza confronti clinici o con altri
            utenti.
          </p>
        </div>
      </header>
      <section className="filters" aria-label="Filtri statistiche">
        <label>
          Periodo
          <select
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target.value === 'all'
                  ? 'all'
                  : (Number(event.target.value) as 7 | 30),
              )
            }
          >
            <option value={7}>Ultimi 7 giorni</option>
            <option value={30}>Ultimi 30 giorni</option>
            <option value="all">Tutto</option>
          </select>
        </label>
        <label>
          Gioco
          <select
            value={gameId}
            onChange={(event) =>
              setGameId(event.target.value as GameId | 'all')
            }
          >
            <option value="all">Tutti i giochi</option>
            {gameCatalog.map((game) => (
              <option value={game.id} key={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="summary-grid">
        <StatCard label="Sessioni" value={filtered.length} />
        <StatCard
          label="Miglior punteggio"
          value={best !== null ? Math.round(best) : '—'}
        />
        <StatCard label="Tempo totale" value={formatMinutes(totalSeconds)} />
        <StatCard label="Giochi allenati" value={summaries.length} />
      </section>
      <section className="panel">
        <div className="panel-header">
          <h2>Punteggio medio per gioco</h2>
          {sessions.length > 0 && (
            <button className="button ghost" onClick={clearSessions}>
              Cancella sessioni
            </button>
          )}
        </div>
        {chartData.length ? (
          <>
            <div
              className="progress-chart"
              role="img"
              aria-label="Grafico del punteggio medio per gioco"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="media" fill="#2f80ed" name="Punteggio medio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-scroll">
              <table>
                <caption>Riepilogo testuale equivalente al grafico</caption>
                <thead>
                  <tr>
                    <th scope="col">Gioco</th>
                    <th scope="col">Sessioni</th>
                    <th scope="col">Media</th>
                    <th scope="col">Migliore</th>
                    <th scope="col">Tempo</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => (
                    <tr key={summary.gameId}>
                      <th scope="row">{titles.get(summary.gameId)}</th>
                      <td>{summary.sessions}</td>
                      <td>{summary.averageScore}</td>
                      <td>{summary.bestScore}</td>
                      <td>{formatMinutes(summary.totalSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="empty">Nessun risultato per i filtri selezionati.</p>
        )}
      </section>
    </>
  )
}
