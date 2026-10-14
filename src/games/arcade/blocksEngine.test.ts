import { describe, expect, it } from 'vitest'
import {
  createBlocks,
  dropBlock,
  fits,
  moveBlock,
  rotateShape,
} from './blocksEngine'

describe('blocchi cadenti', () => {
  it('ruota le forme, controlla confini e collisioni', () => {
    expect(rotateShape([[1, 1, 1]])).toEqual([[1], [1], [1]])
    const state = createBlocks('easy', () => 0)
    expect(fits(state.board, state.shape, -1, 0)).toBe(false)
    expect(fits(state.board, state.shape, 9, 0)).toBe(false)
    expect(moveBlock({ ...state, x: 0 }, 'left').x).toBe(0)
    expect(moveBlock(state, 'right').x).toBe(4)
    expect(moveBlock(state, 'rotate').shape).toHaveLength(4)
    expect(dropBlock(state).y).toBe(1)
  })
  it('rimuove righe complete, assegna punti e raggiunge il target', () => {
    const state = createBlocks('medium', () => 0.2)
    state.board[14] = Array(10).fill(1) as number[]
    state.board[15] = Array(10).fill(1) as number[]
    state.board[14][3] = 0
    state.board[14][4] = 0
    state.board[15][3] = 0
    state.board[15][4] = 0
    const next = dropBlock({ ...state, target: 2 }, true, () => 0)
    expect(next.lines).toBe(2)
    expect(next.points).toBe(400)
    expect(next.won).toBe(true)
    expect(next.board.every((row) => row.every((cell) => cell === 0))).toBe(
      true,
    )
    expect(state.board[15][3]).toBe(0)
    expect(dropBlock(next)).toBe(next)
    expect(moveBlock(next, 'left')).toBe(next)
  })
  it('termina quando la nuova forma non entra', () => {
    const state = createBlocks('hard', () => 0)
    state.board[0][5] = 1
    const next = dropBlock(
      { ...state, y: 0, x: 0, shape: [[1]] },
      true,
      () => 0,
    )
    expect(next.over).toBe(true)
  })
})
