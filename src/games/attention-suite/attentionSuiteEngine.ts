import { DifficultyLevel, GameId } from '../../core/games/types'
import { QuizRound } from '../shared/quizEngine'

type AttentionGameId = Extract<
  GameId,
  'stroop' | 'trail-making' | 'reaction' | 'n-back'
>

export function buildAttentionSuiteRound(
  gameId: AttentionGameId,
  index: number,
  difficulty: DifficultyLevel,
): QuizRound {
  const level = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
  if (gameId === 'stroop') {
    const inks = ['Blu', 'Verde', 'Rosso', 'Giallo']
    const correctIndex = (index + level) % inks.length
    return {
      prompt: `La parola “ROSSO” è stampata in ${inks[correctIndex].toLowerCase()}. Scegli il colore dell'inchiostro.`,
      choices: inks,
      correctIndex,
    }
  }
  if (gameId === 'trail-making') {
    const next = 3 + index + level
    return {
      prompt: `Continua alternando numero e lettera: 1 → A → 2 → B → ${next} → ?`,
      choices: ['C', 'D', String(next + 1), 'B'],
      correctIndex: 0,
    }
  }
  if (gameId === 'reaction') {
    const target = (index + level) % 2 === 0
    return {
      prompt: target
        ? 'Segnale verde: quale azione esegui?'
        : 'Segnale rosso: quale azione esegui?',
      choices: ['Premi', 'Attendi'],
      correctIndex: target ? 0 : 1,
    }
  }
  const letters = ['A', 'B', index % 2 === 0 ? 'A' : 'C']
  const matches = letters[0] === letters[2]
  return {
    prompt: `Sequenza 2-back: ${letters.join(' · ')}. L'ultimo simbolo coincide con quello di due posizioni prima?`,
    choices: ['Sì', 'No'],
    correctIndex: matches ? 0 : 1,
  }
}
