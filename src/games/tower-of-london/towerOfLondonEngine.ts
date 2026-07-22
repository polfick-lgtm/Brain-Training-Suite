import { DifficultyLevel } from '../../core/games/types'
import { QuizRound } from '../shared/quizEngine'

const plans = [
  { start: 'Rosso, Blu, Verde', target: 'Verde, Blu, Rosso', moves: 3 },
  { start: 'Blu, Rosso, Verde', target: 'Rosso, Verde, Blu', moves: 2 },
  { start: 'Verde, Rosso, Blu', target: 'Blu, Verde, Rosso', moves: 3 },
]

export function buildTowerOfLondonRound(
  index: number,
  difficulty: DifficultyLevel,
): QuizRound {
  const plan = plans[index % plans.length]
  const offset = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
  const answer = plan.moves + offset
  const choices = [answer - 1, answer, answer + 1, answer + 2].map(String)
  return {
    prompt: `Da “${plan.start}” a “${plan.target}”: quante mosse pianificate servono?`,
    choices,
    correctIndex: 1,
  }
}
