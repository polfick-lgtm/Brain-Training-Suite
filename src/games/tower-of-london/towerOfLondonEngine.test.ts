import { describe, expect, it } from 'vitest'
import {
  evaluateChoice,
  roundsForDifficulty,
  scoreQuiz,
} from '../shared/quizEngine'
import { buildTowerOfLondonRound } from './towerOfLondonEngine'

describe('Torre di Londra', () => {
  it('genera un round con risposta valida', () => {
    const round = buildTowerOfLondonRound(0, 'easy')
    expect(round.choices).toHaveLength(4)
    expect(evaluateChoice(round, round.correctIndex)).toBe(true)
    expect(evaluateChoice(round, 0)).toBe(false)
    expect(buildTowerOfLondonRound(1, 'medium').choices[1]).toBe('3')
    expect(buildTowerOfLondonRound(2, 'hard').choices[1]).toBe('5')
  })

  it('scala round e punteggio con la difficoltà', () => {
    expect(roundsForDifficulty('hard')).toBe(7)
    expect(roundsForDifficulty('easy')).toBe(3)
    expect(roundsForDifficulty('medium')).toBe(5)
    expect(scoreQuiz(5, 5, 0)).toBe(100)
    expect(scoreQuiz(0, 0, 2)).toBe(0)
  })
})
