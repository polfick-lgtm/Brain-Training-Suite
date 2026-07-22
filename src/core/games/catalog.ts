import { CognitiveCategory, GameDefinition, GameId } from './types'

export type GameStatus = 'available' | 'coming-soon'
export type GameCatalogEntry = GameDefinition & { status: GameStatus }

const upcoming: readonly [GameId, string, CognitiveCategory, number][] = [
  ['memory', 'Memory', 'memory', 5],
  ['visual-memory', 'Memoria visiva', 'memory', 4],
  ['digit-span', 'Digit Span', 'memory', 4],
  ['simon', 'Simon', 'memory', 4],
  ['stroop', 'Stroop', 'attention', 3],
  ['trail-making', 'Trail Making', 'attention', 5],
  ['reaction', 'Test di reazione', 'speed', 3],
  ['n-back', 'N-Back', 'attention', 5],
]

export const gameCatalog: readonly GameCatalogEntry[] = [
  {
    id: 'hanoi',
    title: 'Torre di Hanoi',
    description:
      'Pianifica una sequenza di mosse rispettando dimensioni e ordine.',
    category: 'logic',
    route: '/giochi/hanoi',
    difficulties: ['easy', 'medium', 'hard'],
    estimateMinutes: 5,
    status: 'available',
  },
  {
    id: 'tower-of-london',
    title: 'Torre di Londra',
    description:
      'Pianifica mentalmente il percorso tra stato iniziale e obiettivo.',
    category: 'logic',
    route: '/giochi/tower-of-london',
    difficulties: ['easy', 'medium', 'hard'],
    estimateMinutes: 6,
    status: 'available',
  },
  ...upcoming.map(([id, title, category, estimateMinutes]) => ({
    id,
    title,
    description: 'Modulo previsto nella roadmap v1.0.',
    category,
    route: `/giochi/${id}` as const,
    difficulties: ['easy', 'medium', 'hard'] as const,
    estimateMinutes,
    status: 'coming-soon' as const,
  })),
]
