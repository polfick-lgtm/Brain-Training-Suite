import { ArcadeId, CognitiveCategory } from '../../core/games/types'

export const arcadeDefinitions: readonly {
  id: ArcadeId
  title: string
  description: string
  category: CognitiveCategory
  instructions: string
}[] = [
  {
    id: 'snake',
    title: 'Snake',
    category: 'attention',
    description: 'Raccogli stelle senza urtare pareti o coda.',
    instructions:
      'Guida il serpente con frecce o pulsanti. Raccogli tutte le stelle richieste; non puoi invertire immediatamente la direzione.',
  },
  {
    id: 'breakout',
    title: 'Spacca mattoni',
    category: 'speed',
    description: 'Rimbalza la pallina e ripulisci la parete.',
    instructions:
      'Muovi la racchetta con frecce, pulsanti o trascinando sulla tavola. Rompi tutti i mattoni; hai tre vite.',
  },
  {
    id: 'maze',
    title: 'Labirinto arcade',
    category: 'logic',
    description: 'Esplora il labirinto, raccogli le chiavi e trova l’uscita.',
    instructions:
      'Muoviti con frecce o pulsanti. Raccogli tutte le stelle per aprire l’uscita verde. I muri bloccano il passaggio.',
  },
  {
    id: 'falling-blocks',
    title: 'Blocchi cadenti',
    category: 'logic',
    description: 'Ruota le forme e completa le righe.',
    instructions:
      'Sinistra e destra spostano il pezzo, su lo ruota, giù lo accelera. Spazio o Lascia cadere lo posizionano subito. Completa le righe richieste.',
  },
  {
    id: 'space-shooter',
    title: 'Space Shooter',
    category: 'speed',
    description: 'Difendi lo spazio schivando e colpendo i bersagli.',
    instructions:
      'Muovi la nave a sinistra e destra; premi Spazio o Spara. Abbatti i bersagli richiesti prima di perdere tre vite. Tieni premuti i comandi per agire continuamente.',
  },
  {
    id: 'asteroids',
    title: 'Asteroidi',
    category: 'attention',
    description: 'Pilota una nave tra rocce in movimento.',
    instructions:
      'Sinistra e destra ruotano, su attiva il motore, Spazio spara. Le rocce grandi si dividono in due. La nave e le rocce riappaiono dal bordo opposto.',
  },
  {
    id: 'sokoban',
    title: 'Sokoban',
    category: 'logic',
    description: 'Spingi ogni cassa sul suo obiettivo.',
    instructions:
      'Sposta il personaggio con le frecce o i pulsanti. Puoi spingere una cassa alla volta ma non tirarla. Usa Annulla mossa se resti bloccato.',
  },
  {
    id: 'puzzle-15',
    title: 'Puzzle 15',
    category: 'logic',
    description: 'Riordina le tessere numerate.',
    instructions:
      'Tocca una tessera accanto allo spazio vuoto per spostarla. Le frecce spostano lo spazio vuoto. Ricomponi i numeri da 1 a 15.',
  },
]
