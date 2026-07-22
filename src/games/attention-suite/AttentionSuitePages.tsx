import { QuizGamePage } from '../shared/QuizGamePage'
import { QuizGameDefinition } from '../shared/quizEngine'
import { buildAttentionSuiteRound } from './attentionSuiteEngine'

const definitions = {
  stroop: {
    id: 'stroop',
    title: 'Stroop',
    categoryLabel: 'Attenzione selettiva',
    instructions:
      'Rispondi al colore indicato, ignorando il significato della parola.',
  },
  'trail-making': {
    id: 'trail-making',
    title: 'Trail Making',
    categoryLabel: 'Flessibilità attentiva',
    instructions:
      'Alterna numeri e lettere continuando correttamente il percorso.',
  },
  reaction: {
    id: 'reaction',
    title: 'Test di reazione',
    categoryLabel: 'Velocità e inibizione',
    instructions: 'Premi sul segnale verde e attendi sul segnale rosso.',
  },
  'n-back': {
    id: 'n-back',
    title: 'N-Back',
    categoryLabel: 'Memoria di lavoro',
    instructions:
      'Confronta l’ultimo simbolo con quello mostrato due posizioni prima.',
  },
} as const

function page(id: keyof typeof definitions) {
  const metadata = definitions[id]
  const definition: QuizGameDefinition = {
    ...metadata,
    buildRound: (index, difficulty) =>
      buildAttentionSuiteRound(id, index, difficulty),
  }
  return <QuizGamePage definition={definition} />
}

export const StroopPage = () => page('stroop')
export const TrailMakingPage = () => page('trail-making')
export const ReactionPage = () => page('reaction')
export const NBackPage = () => page('n-back')
