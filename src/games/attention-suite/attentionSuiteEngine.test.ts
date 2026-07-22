import { describe, expect, it } from 'vitest'
import { evaluateChoice } from '../shared/quizEngine'
import { buildAttentionSuiteRound } from './attentionSuiteEngine'

describe.each(['stroop', 'trail-making', 'reaction', 'n-back'] as const)(
  '%s',
  (gameId) => {
    it.each(['easy', 'medium', 'hard'] as const)(
      'genera un round %s valido',
      (difficulty) => {
        const round = buildAttentionSuiteRound(gameId, 1, difficulty)
        expect(round.choices.length).toBeGreaterThanOrEqual(2)
        expect(evaluateChoice(round, round.correctIndex)).toBe(true)
      },
    )
  },
)
