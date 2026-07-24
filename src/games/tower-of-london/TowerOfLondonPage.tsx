import { QuizGamePage } from '../shared/QuizGamePage'
import { QuizGameDefinition } from '../shared/quizEngine'
import { buildTowerOfLondonRound } from './towerOfLondonEngine'

const definition: QuizGameDefinition = {
  id: 'tower-of-london',
  title: 'Torre di Londra',
  categoryLabel: 'Logica e pianificazione',
  instructions:
    'Osserva stato iniziale e obiettivo, poi scegli il numero di mosse pianificate.',
  buildRound: buildTowerOfLondonRound,
}

export function TowerOfLondonPage() {
  return <QuizGamePage definition={definition} />
}
