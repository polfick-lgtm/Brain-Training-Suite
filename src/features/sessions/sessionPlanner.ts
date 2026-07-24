import { gameCatalog } from '../../core/games/catalog'
import { CognitiveCategory, GameId } from '../../core/games/types'

export type SessionGoal = CognitiveCategory | 'balanced'
export type SessionDuration = 10 | 15 | 20

export function buildSessionPlan(
  goal: SessionGoal,
  duration: SessionDuration,
): GameId[] {
  const count = duration === 10 ? 3 : duration === 15 ? 4 : 5
  const preferred = gameCatalog.filter(
    (game) =>
      game.status === 'available' &&
      (goal === 'balanced' || game.category === goal),
  )
  const fallback = gameCatalog.filter((game) => game.status === 'available')
  const pool =
    preferred.length >= count ? preferred : [...preferred, ...fallback]
  return [...new Set(pool.map((game) => game.id))].slice(0, count)
}
