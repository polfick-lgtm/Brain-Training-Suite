import { gameCatalog } from '../../core/games/catalog'
import { CognitiveCategory, GameId } from '../../core/games/types'
import { LocalProfile, TrainingSession } from '../../storage/models'

export type CoachSuggestion = {
  gameId: GameId
  title: string
  route: string
  reason: string
}

export function buildCoachSuggestions(
  sessions: readonly TrainingSession[],
  profile: LocalProfile,
): CoachSuggestion[] {
  const recent = sessions.slice(0, 20)
  const categoryScores = new Map<CognitiveCategory, number[]>()
  for (const session of recent) {
    const game = gameCatalog.find((entry) => entry.id === session.gameId)
    if (!game) continue
    const scores = categoryScores.get(game.category) ?? []
    scores.push(session.score)
    categoryScores.set(game.category, scores)
  }

  const preferredCategory =
    profile.goal === 'balanced'
      ? [...categoryScores.entries()]
          .map(([category, scores]) => ({
            category,
            average:
              scores.reduce((sum, score) => sum + score, 0) / scores.length,
          }))
          .sort((a, b) => a.average - b.average)[0]?.category
      : profile.goal

  return gameCatalog
    .filter((game) => game.status === 'available')
    .sort((a, b) => {
      const aPriority = a.category === preferredCategory ? 0 : 1
      const bPriority = b.category === preferredCategory ? 0 : 1
      return aPriority - bPriority || a.title.localeCompare(b.title)
    })
    .slice(0, 3)
    .map((game) => ({
      gameId: game.id,
      title: game.title,
      route: game.route,
      reason:
        recent.length === 0
          ? profile.goal === 'balanced'
            ? 'Per iniziare con un allenamento vario e breve.'
            : `È coerente con il tuo obiettivo “${profile.goal}”.`
          : game.category === preferredCategory
            ? 'Quest’area ha il margine di miglioramento più evidente nei risultati recenti.'
            : 'Aggiunge varietà alle attività svolte di recente.',
    }))
}
