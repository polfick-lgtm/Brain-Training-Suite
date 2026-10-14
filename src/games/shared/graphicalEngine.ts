export const cardSymbols = ['☀', '☾', '★', '◆', '●', '▲', '■', '♥']

export function shuffledPairs(pairs: number, random = Math.random): number[] {
  const cards = Array.from({ length: pairs * 2 }, (_, index) => index % pairs)
  for (let index = cards.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1))
    ;[cards[index], cards[other]] = [cards[other], cards[index]]
  }
  return cards
}

export type BallBoard = number[][]
export const pegCapacity = [3, 2, 1]
export const londonStart: BallBoard = [[0, 1], [2], []]

export function moveBall(
  board: BallBoard,
  from: number,
  to: number,
): BallBoard | null {
  if (
    from === to ||
    !board[from]?.length ||
    !board[to] ||
    board[to].length >= pegCapacity[to]
  )
    return null
  const next = board.map((peg) => [...peg])
  next[to].push(next[from].pop()!)
  return next
}

export function boardKey(board: BallBoard): string {
  return JSON.stringify(board)
}

export function londonChallenges(): { board: BallBoard; minimum: number }[] {
  const queue = [{ board: londonStart, minimum: 0 }]
  const seen = new Set([boardKey(londonStart)])
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index]
    for (let from = 0; from < 3; from++) {
      for (let to = 0; to < 3; to++) {
        const board = moveBall(current.board, from, to)
        if (board && !seen.has(boardKey(board))) {
          seen.add(boardKey(board))
          queue.push({ board, minimum: current.minimum + 1 })
        }
      }
    }
  }
  return queue.filter((entry) => entry.minimum > 0)
}

export function extendSimon(
  sequence: number[],
  random = Math.random,
): number[] {
  return [...sequence, Math.floor(random() * 4)]
}

export function checkSimon(
  sequence: readonly number[],
  input: readonly number[],
): 'wrong' | 'partial' | 'complete' {
  if (
    input.length > sequence.length ||
    input.some((value, index) => value !== sequence[index])
  )
    return 'wrong'
  return input.length === sequence.length ? 'complete' : 'partial'
}
