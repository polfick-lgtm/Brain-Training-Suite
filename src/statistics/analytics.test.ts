import { describe, expect, it } from 'vitest'
import { TrainingSession } from '../storage/models'
import { filterSessions, summarizeByGame } from './analytics'

const makeSession = (
  id: string,
  gameId: TrainingSession['gameId'],
  completedAt: string,
  score: number,
): TrainingSession => ({
  id,
  gameId,
  difficulty: 'easy',
  startedAt: completedAt,
  completedAt,
  durationSeconds: 60,
  score,
  errors: 0,
  completed: true,
  details: {},
})

const sessions = [
  makeSession('1', 'hanoi', '2026-07-22T10:00:00.000Z', 80),
  makeSession('2', 'hanoi', '2026-07-20T10:00:00.000Z', 100),
  makeSession('3', 'memory', '2026-06-01T10:00:00.000Z', 70),
]

describe('statistiche locali', () => {
  it('filtra per periodo e gioco', () => {
    const now = new Date('2026-07-23T10:00:00.000Z')
    expect(filterSessions(sessions, 7, 'all', now)).toHaveLength(2)
    expect(filterSessions(sessions, 'all', 'memory', now)).toHaveLength(1)
  })

  it('calcola migliori risultati e medie', () => {
    expect(summarizeByGame(sessions)).toEqual([
      {
        gameId: 'hanoi',
        sessions: 2,
        bestScore: 100,
        averageScore: 90,
        totalSeconds: 120,
      },
      {
        gameId: 'memory',
        sessions: 1,
        bestScore: 70,
        averageScore: 70,
        totalSeconds: 60,
      },
    ])
  })
})
