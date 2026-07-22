export type Pegs = number[][]
export const minimumMoves = (n: number) => 2 ** n - 1
export const initialPegs = (n: number): Pegs => [
  Array.from({ length: n }, (_, i) => n - i),
  [],
  [],
]
export function canMove(pegs: Pegs, from: number, to: number) {
  if (from === to || pegs[from].length === 0) return false
  const disk = pegs[from][pegs[from].length - 1]
  const target = pegs[to][pegs[to].length - 1]
  return target === undefined || disk < target
}
export function moveDisk(pegs: Pegs, from: number, to: number): Pegs {
  if (!canMove(pegs, from, to)) return pegs
  const next = pegs.map((peg) => [...peg])
  next[to].push(next[from].pop()!)
  return next
}
