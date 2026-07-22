import { GameId } from '../core/games/types'
import { TrainingSession } from '../storage/models'

export type PeriodFilter = 7 | 30 | 'all'

export type GameSummary = {
  gameId: GameId
  sessions: number
  bestScore: number
  averageScore: number
  totalSeconds: number
}

export function filterSessions(
  sessions: readonly TrainingSession[],
  period: PeriodFilter,
  gameId: GameId | 'all',
  now = new Date(),
) {
  const threshold =
    period === 'all'
      ? Number.NEGATIVE_INFINITY
      : now.getTime() - period * 24 * 60 * 60 * 1000
  return sessions.filter(
    (session) =>
      new Date(session.completedAt).getTime() >= threshold &&
      (gameId === 'all' || session.gameId === gameId),
  )
}

export function summarizeByGame(
  sessions: readonly TrainingSession[],
): GameSummary[] {
  const groups = new Map<GameId, TrainingSession[]>()
  for (const session of sessions) {
    const group = groups.get(session.gameId) ?? []
    group.push(session)
    groups.set(session.gameId, group)
  }
  return [...groups.entries()]
    .map(([gameId, group]) => ({
      gameId,
      sessions: group.length,
      bestScore: Math.max(...group.map((session) => session.score)),
      averageScore: Math.round(
        group.reduce((sum, session) => sum + session.score, 0) / group.length,
      ),
      totalSeconds: group.reduce(
        (sum, session) => sum + session.durationSeconds,
        0,
      ),
    }))
    .sort((a, b) => b.sessions - a.sessions || a.gameId.localeCompare(b.gameId))
}
