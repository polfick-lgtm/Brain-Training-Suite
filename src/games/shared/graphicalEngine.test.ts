import { describe, expect, it } from 'vitest'
import {
  boardKey,
  checkSimon,
  extendSimon,
  londonChallenges,
  londonStart,
  moveBall,
  pegCapacity,
  shuffledPairs,
} from './graphicalEngine'

describe('giochi grafici', () => {
  it('genera esattamente due carte per simbolo e mescola senza perderle', () => {
    const cards = shuffledPairs(8, () => 0.25)
    expect(cards).toHaveLength(16)
    for (let symbol = 0; symbol < 8; symbol++)
      expect(cards.filter((card) => card === symbol)).toHaveLength(2)
  })
  it('impedisce mosse da aste vuote, piene o verso la stessa asta', () => {
    expect(moveBall(londonStart, 2, 0)).toBeNull()
    expect(moveBall(londonStart, 0, 0)).toBeNull()
    expect(moveBall([[0], [1], [2]], 0, 2)).toBeNull()
  })
  it('sposta solo la pallina in cima senza mutare lo stato iniziale', () => {
    expect(moveBall(londonStart, 0, 2)).toEqual([[0], [2], [1]])
    expect(londonStart).toEqual([[0, 1], [2], []])
  })
  it('produce obiettivi distinti, raggiungibili e rispettosi delle capacità', () => {
    const goals = londonChallenges()
    expect(new Set(goals.map((goal) => boardKey(goal.board))).size).toBe(
      goals.length,
    )
    expect(goals.some((goal) => goal.minimum >= 6)).toBe(true)
    for (const goal of goals) {
      expect(goal.minimum).toBeGreaterThan(0)
      expect(goal.board.flat().sort()).toEqual([0, 1, 2])
      goal.board.forEach((peg, index) =>
        expect(peg.length).toBeLessThanOrEqual(pegCapacity[index]),
      )
    }
  })
  it('riconosce input Simon parziali, completi e sbagliati', () => {
    expect(extendSimon([0, 2], () => 0.75)).toEqual([0, 2, 3])
    expect(checkSimon([0, 2], [0])).toBe('partial')
    expect(checkSimon([0, 2], [0, 2])).toBe('complete')
    expect(checkSimon([0, 2], [2])).toBe('wrong')
    expect(checkSimon([0], [0, 0])).toBe('wrong')
  })
})
