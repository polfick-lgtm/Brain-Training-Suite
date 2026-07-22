import { QuizGamePage } from '../shared/QuizGamePage'
import { QuizGameDefinition } from '../shared/quizEngine'
import { buildMemorySuiteRound } from './memorySuiteEngine'

const definitions = {
  memory: {
    id: 'memory',
    title: 'Memory',
    categoryLabel: 'Memoria di riconoscimento',
    instructions:
      'Individua rapidamente la coppia di simboli identica al modello.',
  },
  'visual-memory': {
    id: 'visual-memory',
    title: 'Memoria visiva',
    categoryLabel: 'Memoria visiva',
    instructions:
      'Osserva e riconosci schemi visivi composti da celle piene e vuote.',
  },
  'digit-span': {
    id: 'digit-span',
    title: 'Digit Span',
    categoryLabel: 'Memoria di lavoro',
    instructions:
      'Mantieni la sequenza numerica e seleziona il suo ordine inverso.',
  },
  simon: {
    id: 'simon',
    title: 'Simon',
    categoryLabel: 'Memoria sequenziale',
    instructions: 'Riconosci e completa sequenze di colori ripetute.',
  },
} as const

function page(id: keyof typeof definitions) {
  const metadata = definitions[id]
  const definition: QuizGameDefinition = {
    ...metadata,
    buildRound: (index, difficulty) =>
      buildMemorySuiteRound(id, index, difficulty),
  }
  return <QuizGamePage definition={definition} />
}

export const MemoryPage = () => page('memory')
export const VisualMemoryPage = () => page('visual-memory')
export const DigitSpanPage = () => page('digit-span')
export const SimonPage = () => page('simon')
