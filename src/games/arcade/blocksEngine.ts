import { DifficultyLevel } from '../../core/games/types'

export type Shape = number[][]
export const shapes: Shape[] = [
  [[1, 1, 1, 1]],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
]
export type BlocksState = {
  board: number[][]
  shape: Shape
  x: number
  y: number
  color: number
  lines: number
  target: number
  points: number
  over: boolean
  won: boolean
}
function piece(random: () => number) {
  const color = Math.floor(random() * shapes.length)
  return {
    shape: shapes[color].map((row) => [...row]),
    color: color + 1,
    x: 3,
    y: 0,
  }
}
export function createBlocks(
  difficulty: DifficultyLevel,
  random = Math.random,
): BlocksState {
  return {
    board: Array.from({ length: 16 }, () => Array(10).fill(0) as number[]),
    ...piece(random),
    lines: 0,
    target: difficulty === 'easy' ? 4 : difficulty === 'medium' ? 8 : 12,
    points: 0,
    over: false,
    won: false,
  }
}
export function fits(
  board: number[][],
  shape: Shape,
  x: number,
  y: number,
): boolean {
  return shape.every((row, sy) =>
    row.every(
      (filled, sx) =>
        !filled ||
        (x + sx >= 0 &&
          x + sx < 10 &&
          y + sy >= 0 &&
          y + sy < board.length &&
          board[y + sy][x + sx] === 0),
    ),
  )
}
export function rotateShape(shape: Shape): Shape {
  return shape[0].map((_, col) => shape.map((row) => row[col]).reverse())
}
export function moveBlock(
  state: BlocksState,
  action: 'left' | 'right' | 'rotate',
): BlocksState {
  if (state.over) return state
  const shape = action === 'rotate' ? rotateShape(state.shape) : state.shape
  const x = state.x + (action === 'left' ? -1 : action === 'right' ? 1 : 0)
  for (const offset of action === 'rotate' ? [0, -1, 1, -2, 2] : [0]) {
    if (fits(state.board, shape, x + offset, state.y))
      return { ...state, shape, x: x + offset }
  }
  return state
}
export function dropBlock(
  state: BlocksState,
  hard = false,
  random = Math.random,
): BlocksState {
  if (state.over) return state
  let y = state.y
  if (hard) while (fits(state.board, state.shape, state.x, y + 1)) y++
  else if (fits(state.board, state.shape, state.x, y + 1))
    return { ...state, y: y + 1 }
  const board = state.board.map((row) => [...row])
  state.shape.forEach((row, sy) =>
    row.forEach((filled, sx) => {
      if (filled) board[y + sy][state.x + sx] = state.color
    }),
  )
  const remaining = board.filter((row) => row.some((cell) => cell === 0)),
    cleared = board.length - remaining.length
  while (remaining.length < board.length)
    remaining.unshift(Array(10).fill(0) as number[])
  const next = piece(random),
    lines = state.lines + cleared,
    won = lines >= state.target
  return {
    ...state,
    board: remaining,
    ...next,
    lines,
    points: state.points + cleared * cleared * 100,
    won,
    over: won || !fits(remaining, next.shape, next.x, next.y),
  }
}
