import { DifficultyLevel, GameId } from '../core/games/types'

export type ThemePreference = 'light' | 'dark' | 'system'
export type TextScale = 'normal' | 'large' | 'extra-large'

export type LocalProfile = {
  id: 'local'
  displayName: string
  preferredLevel: number
  goal: 'balanced' | 'memory' | 'attention' | 'logic' | 'speed'
  updatedAt: string
}

export type AppSettings = {
  id: 'app'
  theme: ThemePreference
  textScale: TextScale
  reduceMotion: boolean
  sounds: boolean
  coachEnabled: boolean
  updatedAt: string
}

export type TrainingSession = {
  id: string
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

export type BrainTrainingExport = {
  format: 'brain-training-suite'
  schemaVersion: 1
  exportedAt: string
  profile: LocalProfile
  settings: AppSettings
  sessions: TrainingSession[]
}

export const defaultProfile = (): LocalProfile => ({
  id: 'local',
  displayName: '',
  preferredLevel: 5,
  goal: 'balanced',
  updatedAt: new Date().toISOString(),
})

export const defaultSettings = (): AppSettings => ({
  id: 'app',
  theme: 'system',
  textScale: 'normal',
  reduceMotion: false,
  sounds: true,
  coachEnabled: true,
  updatedAt: new Date().toISOString(),
})
