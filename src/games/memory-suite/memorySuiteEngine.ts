import { DifficultyLevel, GameId } from '../../core/games/types'
import { QuizRound } from '../shared/quizEngine'

type MemoryGameId = Extract<
  GameId,
  'memory' | 'visual-memory' | 'digit-span' | 'simon'
>

const rotate = <T>(items: readonly T[], index: number) =>
  items.map((_, position) => items[(position + index) % items.length])

export function buildMemorySuiteRound(
  gameId: MemoryGameId,
  index: number,
  difficulty: DifficultyLevel,
): QuizRound {
  const level = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
  if (gameId === 'memory') {
    const symbols = rotate(['◆', '●', '▲', '■'], index)
    return {
      prompt: `Trova la coppia identica a ${symbols[0]} ${symbols[1]}.`,
      choices: [
        `${symbols[1]} ${symbols[0]}`,
        `${symbols[0]} ${symbols[1]}`,
        `${symbols[2]} ${symbols[3]}`,
        `${symbols[0]} ${symbols[2]}`,
      ],
      correctIndex: 1,
    }
  }
  if (gameId === 'visual-memory') {
    const patterns = ['■□□■', '□■■□', '■■□□', '□■□■']
    const answer = patterns[(index + level) % patterns.length]
    return {
      prompt: `Quale schema completa la serie: ${answer.slice(0, 2)} … ${answer.slice(2)}?`,
      choices: rotate(patterns, index),
      correctIndex: rotate(patterns, index).indexOf(answer),
    }
  }
  if (gameId === 'digit-span') {
    const digits = [2 + level, 7, 4 + (index % 3), 9]
    const answer = [...digits].reverse().join(' ')
    const choices = [
      digits.join(' '),
      answer,
      [...digits].sort().join(' '),
      `${digits[3]} ${digits[1]} ${digits[2]} ${digits[0]}`,
    ]
    return {
      prompt: `Ripeti al contrario: ${digits.join(' ')}`,
      choices,
      correctIndex: 1,
    }
  }
  const colors = rotate(['Rosso', 'Blu', 'Verde', 'Giallo'], index)
  return {
    prompt: `Completa la sequenza Simon: ${colors[0]} → ${colors[1]} → ${colors[0]} → ?`,
    choices: colors,
    correctIndex: 1,
  }
}
