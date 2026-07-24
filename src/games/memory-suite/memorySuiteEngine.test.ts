import { describe, expect, it } from 'vitest'
import { evaluateChoice } from '../shared/quizEngine'
import { buildMemorySuiteRound } from './memorySuiteEngine'

describe.each(['memory', 'visual-memory', 'digit-span', 'simon'] as const)(
  '%s',
  (gameId) => {
    it.each(['easy', 'medium', 'hard'] as const)(
      'genera un round %s valido',
      (difficulty) => {
        const round = buildMemorySuiteRound(gameId, 2, difficulty)
        expect(round.choices.length).toBeGreaterThanOrEqual(2)
        expect(evaluateChoice(round, round.correctIndex)).toBe(true)
      },
    )
  },
)
