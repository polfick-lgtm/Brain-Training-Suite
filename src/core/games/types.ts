export type GameId =
  | 'hanoi'
  | 'tower-of-london'
  | 'memory'
  | 'visual-memory'
  | 'stroop'
  | 'trail-making'
  | 'reaction'
  | 'digit-span'
  | 'n-back'
  | 'simon'

export type CognitiveCategory = 'logic' | 'memory' | 'attention' | 'speed'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type GameDefinition = {
  id: GameId
  title: string
  description: string
  category: CognitiveCategory
  route: `/giochi/${string}`
  difficulties: readonly DifficultyLevel[]
  estimateMinutes: number
}

export type GameResult = {
  gameId: GameId
  difficulty: DifficultyLevel
  startedAt: string
  completedAt: string
  durationSeconds: number
  score: number
  accuracy?: number
  errors: number
  completed: boolean
  details: Record<string, string | number | boolean>
}
