import { DifficultyLevel, GameId } from '../../core/games/types'

export type QuizRound = {
  prompt: string
  choices: readonly string[]
  correctIndex: number
}

export type QuizGameDefinition = {
  id: Exclude<GameId, 'hanoi'>
  title: string
  categoryLabel: string
  instructions: string
  buildRound: (index: number, difficulty: DifficultyLevel) => QuizRound
}

export const roundsForDifficulty = (difficulty: DifficultyLevel) =>
  difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7

export function evaluateChoice(round: QuizRound, choiceIndex: number) {
  return choiceIndex === round.correctIndex
}

export function scoreQuiz(correct: number, total: number, errors: number) {
  if (total <= 0) return 0
  return Math.max(0, Math.round((correct / total) * 100 - errors * 2))
}
