import { describe, expect, it } from 'vitest'
import {
  createGrid,
  Direction,
  freeCell,
  moveGrid,
  neighbor,
  slideTile,
  stepSnake,
  turnSnake,
} from './gridEngine'

describe('motori Arcade a griglia', () => {
  it('trova celle libere e segnala tavola piena', () => {
    expect(freeCell(2, [0, 1, 2], () => 0)).toBe(3)
    expect(freeCell(1, [0])).toBe(-1)
    expect(neighbor(0, 'left', 4)).toBeNull()
    expect(neighbor(0, 'up', 4)).toBeNull()
    expect(neighbor(15, 'down', 4)).toBeNull()
    expect(neighbor(3, 'right', 4)).toBeNull()
  })
  it('Snake mangia, cresce, evita inversioni e vince', () => {
    let state = createGrid('snake', 'easy', () => 0)
    expect(turnSnake(state, 'left')).toBe(state)
    const turned = turnSnake(state, 'up')
    expect(turnSnake(turned, 'left')).toBe(turned)
    state = stepSnake({ ...state, food: 66, target: 1 }, () => 0)
    expect(state.snake).toHaveLength(4)
    expect(state.points).toBe(1)
    expect(state.won).toBe(true)
    expect(stepSnake(state)).toBe(state)
  })
  it('Snake termina su muro o coda e libera la cella di coda', () => {
    const base = createGrid('snake', 'hard')
    expect(
      stepSnake({ ...base, snake: [11, 10], direction: 'right' }).over,
    ).toBe(true)
    expect(
      stepSnake({ ...base, snake: [5, 6, 7, 19], direction: 'right' }).over,
    ).toBe(true)
    expect(
      stepSnake({ ...base, snake: [5, 6], direction: 'right', food: 0 }).over,
    ).toBe(false)
    expect(moveGrid(base, 'up').direction).toBe('up')
  })
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    it(`Labirinto ${difficulty}: tutte le chiavi e l'uscita sono raggiungibili`, () => {
      let state = createGrid('maze', difficulty, () => 0.37)
      for (const goal of [...state.goals, state.food]) {
        const queue = [{ cell: state.player, path: [] as Direction[] }],
          seen = new Set([state.player])
        for (let index = 0; index < queue.length; index++) {
          const current = queue[index]
          if (current.cell === goal) {
            for (const dir of current.path) state = moveGrid(state, dir)
            break
          }
          for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
            const cell = neighbor(current.cell, dir, state.size)
            if (
              cell !== null &&
              !state.walls.includes(cell) &&
              !seen.has(cell)
            ) {
              seen.add(cell)
              queue.push({ cell, path: [...current.path, dir] })
            }
          }
        }
        expect(state.player).toBe(goal)
      }
      expect(state.won).toBe(true)
      expect(moveGrid(state, 'up')).toBe(state)
    })
  }
  it('Sokoban spinge solo su celle libere e completa il livello', () => {
    const start = createGrid('sokoban', 'easy')
    const nearWall = { ...start, player: 8 }
    expect(moveGrid(nearWall, 'up')).toBe(nearWall)
    const blocked = { ...start, player: 23, crates: [16, 9] }
    expect(moveGrid(blocked, 'up')).toBe(blocked)
    const wallCrate = { ...start, player: 16, crates: [9] }
    expect(moveGrid(wallCrate, 'up')).toBe(wallCrate)
    const won = moveGrid(moveGrid(start, 'up'), 'up')
    expect(won.won).toBe(true)
    expect(won.crates).toEqual([9])
    expect(start.crates).toEqual([16])
  })
  it('Puzzle 15 non parte risolto e conserva parità e tessere per ogni difficoltà', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const state = createGrid('puzzle-15', difficulty, () => 0.25)
      expect([...state.tiles].sort((a, b) => a - b)).toEqual(
        Array.from({ length: 16 }, (_, i) => i),
      )
      const nonzero = state.tiles.filter(Boolean)
      const inversions = nonzero.reduce(
        (sum, tile, index) =>
          sum + nonzero.slice(index + 1).filter((other) => tile > other).length,
        0,
      )
      expect((inversions + 4 - Math.floor(state.player / 4)) % 2).toBe(1)
      expect(state.tiles.every((value, i) => value === (i + 1) % 16)).toBe(
        false,
      )
      expect(slideTile(state, state.player)).toBe(state)
    }
  })
  it('Puzzle 15 completa una mossa valida e ignora tessere lontane', () => {
    const state = {
      ...createGrid('puzzle-15', 'easy'),
      tiles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15],
      player: 14,
    }
    expect(slideTile(state, 0)).toBe(state)
    expect(slideTile(state, 15).won).toBe(true)
  })
})
