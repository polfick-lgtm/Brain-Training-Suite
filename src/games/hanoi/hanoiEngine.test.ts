import { describe, expect, it } from 'vitest'
import { canMove, initialPegs, minimumMoves, moveDisk } from './hanoiEngine'
describe('hanoi engine', () => {
  it('calcola il minimo teorico', () => expect(minimumMoves(5)).toBe(31))
  it('crea lo stato iniziale', () =>
    expect(initialPegs(3)).toEqual([[3, 2, 1], [], []]))
  it('impedisce una mossa non valida', () => {
    const pegs = [[3, 2], [1], []]
    expect(canMove(pegs, 0, 1)).toBe(false)
  })
  it('sposta un disco valido', () =>
    expect(moveDisk([[3, 2, 1], [], []], 0, 2)).toEqual([[3, 2], [], [1]]))
})
