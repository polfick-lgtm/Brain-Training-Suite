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
  | ArcadeId

export type ArcadeId =
  | 'snake'
  | 'breakout'
  | 'maze'
  | 'falling-blocks'
  | 'space-shooter'
  | 'asteroids'
  | 'sokoban'
  | 'puzzle-15'

export type CognitiveCategory = 'logic' | 'memory' | 'attention' | 'speed'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export type GameDefinition = {
  mode?: 'training' | 'arcade'
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
