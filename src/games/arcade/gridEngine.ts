import { DifficultyLevel } from '../../core/games/types'

export type Direction = 'up' | 'down' | 'left' | 'right'
export const vectors: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
export type GridKind = 'snake' | 'maze' | 'sokoban' | 'puzzle-15'
export type GridState = {
  kind: GridKind
  size: number
  player: number
  walls: number[]
  goals: number[]
  crates: number[]
  snake: number[]
  food: number
  direction: Direction
  turned: boolean
  tiles: number[]
  moves: number
  points: number
  target: number
  over: boolean
  won: boolean
}

export function neighbor(
  cell: number,
  direction: Direction,
  size: number,
): number | null {
  const [dx, dy] = vectors[direction]
  const x = (cell % size) + dx,
    y = Math.floor(cell / size) + dy
  return x < 0 || y < 0 || x >= size || y >= size ? null : y * size + x
}
export function freeCell(
  size: number,
  occupied: readonly number[],
  random = Math.random,
): number {
  const free = Array.from({ length: size * size }, (_, index) => index).filter(
    (cell) => !occupied.includes(cell),
  )
  return free.length ? free[Math.floor(random() * free.length)] : -1
}
export function createGrid(
  kind: GridKind,
  difficulty: DifficultyLevel,
  random = Math.random,
): GridState {
  const level = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
  const state: GridState = {
    kind,
    size: 12,
    player: 65,
    walls: [],
    goals: [],
    crates: [],
    snake: [65, 64, 63],
    food: -1,
    direction: 'right',
    turned: false,
    tiles: [],
    moves: 0,
    points: 0,
    target: 8 + level * 4,
    over: false,
    won: false,
  }
  if (kind === 'snake') {
    state.food = freeCell(12, state.snake, random)
    return state
  }
  if (kind === 'puzzle-15') {
    state.size = 4
    state.tiles = Array.from({ length: 16 }, (_, index) => (index + 1) % 16)
    state.player = 15
    let previous = -1
    for (let step = 0; step < 30 + level * 40; step++) {
      const options = (Object.keys(vectors) as Direction[])
        .map((dir) => neighbor(state.player, dir, 4))
        .filter((cell): cell is number => cell !== null && cell !== previous)
      const cell = options[Math.floor(random() * options.length)]
      previous = state.player
      ;[state.tiles[state.player], state.tiles[cell]] = [
        state.tiles[cell],
        state.tiles[state.player],
      ]
      state.player = cell
    }
    if (state.tiles.every((value, index) => value === (index + 1) % 16)) {
      const cell = neighbor(state.player, 'left', 4)!
      ;[state.tiles[state.player], state.tiles[cell]] = [state.tiles[cell], 0]
      state.player = cell
    }
    state.target = 15
    return state
  }
  if (kind === 'sokoban') {
    state.size = 7
    state.walls = Array.from({ length: 49 }, (_, i) => i).filter(
      (i) => i % 7 === 0 || i % 7 === 6 || i < 7 || i >= 42,
    )
    state.crates = Array.from({ length: level + 1 }, (_, index) => 16 + index)
    state.goals = state.crates.map((cell) => cell - 7)
    state.player = 30
    state.target = level + 1
    return state
  }
  // Depth-first maze generation carves one connected passage network.
  state.size = 7 + level * 2
  const size = state.size,
    passages = new Set([size + 1]),
    stack = [size + 1]
  while (stack.length) {
    const cell = stack[stack.length - 1]
    const options = (Object.keys(vectors) as Direction[])
      .map((dir) => {
        const middle = neighbor(cell, dir, size)
        const end = middle === null ? null : neighbor(middle, dir, size)
        return { middle, end }
      })
      .filter(
        (pair) =>
          pair.end !== null &&
          pair.end % size > 0 &&
          pair.end % size < size - 1 &&
          pair.end >= size &&
          pair.end < size * (size - 1) &&
          !passages.has(pair.end),
      )
    if (!options.length) {
      stack.pop()
      continue
    }
    const { middle, end } = options[Math.floor(random() * options.length)]
    passages.add(middle!)
    passages.add(end!)
    stack.push(end!)
  }
  state.walls = Array.from({ length: size * size }, (_, index) => index).filter(
    (cell) => !passages.has(cell),
  )
  state.player = size + 1
  state.food = size * size - size - 2
  const available = [...passages].filter(
    (cell) => cell !== state.player && cell !== state.food,
  )
  state.goals = [
    available[Math.floor(available.length / 4)],
    available[Math.floor(available.length / 2)],
    available[Math.floor((available.length * 3) / 4)],
  ]
  state.target = 3
  return state
}
export function turnSnake(state: GridState, direction: Direction): GridState {
  const [dx, dy] = vectors[state.direction],
    [nextX, nextY] = vectors[direction]
  if (state.turned || (dx + nextX === 0 && dy + nextY === 0)) return state
  return { ...state, direction, turned: true }
}
export function stepSnake(state: GridState, random = Math.random): GridState {
  if (state.over) return state
  const head = neighbor(state.snake[0], state.direction, state.size)
  const grows = head === state.food
  const body = grows ? state.snake : state.snake.slice(0, -1)
  if (head === null || body.includes(head)) return { ...state, over: true }
  const snake = [head, ...state.snake]
  if (!grows) snake.pop()
  const points = state.points + (grows ? 1 : 0),
    won = points >= state.target
  return {
    ...state,
    snake,
    player: head,
    points,
    food: grows ? freeCell(state.size, snake, random) : state.food,
    turned: false,
    moves: state.moves + 1,
    over: won,
    won,
  }
}
export function moveGrid(state: GridState, direction: Direction): GridState {
  if (state.over) return state
  if (state.kind === 'snake') return turnSnake(state, direction)
  const next = neighbor(state.player, direction, state.size)
  if (next === null || state.walls.includes(next)) return state
  if (state.kind === 'puzzle-15') {
    const tiles = [...state.tiles]
    ;[tiles[state.player], tiles[next]] = [tiles[next], tiles[state.player]]
    const won = tiles.every((value, index) => value === (index + 1) % 16)
    return {
      ...state,
      player: next,
      tiles,
      moves: state.moves + 1,
      won,
      over: won,
      points: tiles.filter((value, index) => value === index + 1).length,
    }
  }
  const crates = [...state.crates]
  const crate = crates.indexOf(next)
  if (crate !== -1) {
    const destination = neighbor(next, direction, state.size)
    if (
      destination === null ||
      state.walls.includes(destination) ||
      crates.includes(destination)
    )
      return state
    crates[crate] = destination
  }
  const goals =
    state.kind === 'maze'
      ? state.goals.filter((cell) => cell !== next)
      : state.goals
  const points =
    state.kind === 'maze'
      ? state.target - goals.length
      : crates.filter((cell) => goals.includes(cell)).length
  const won =
    state.kind === 'maze'
      ? goals.length === 0 && next === state.food
      : points === state.target
  return {
    ...state,
    player: next,
    crates,
    goals,
    moves: state.moves + 1,
    points,
    won,
    over: won,
  }
}
export function slideTile(state: GridState, cell: number): GridState {
  const direction = (Object.keys(vectors) as Direction[]).find(
    (dir) => neighbor(state.player, dir, state.size) === cell,
  )
  return direction ? moveGrid(state, direction) : state
}
