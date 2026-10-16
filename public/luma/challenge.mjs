import { lessons } from './model.mjs'

const plan = [
  [
    'Le prime parole',
    'Saluta e presenta il tuo nome.',
    'Good morning, my name is Anna.',
    'Buongiorno, mi chiamo Anna.',
  ],
  [
    'Piacere di conoscerti',
    'Fai domande semplici per conoscere qualcuno.',
    'Nice to meet you. Where are you from?',
    'Piacere di conoscerti. Di dove sei?',
  ],
  [
    'Le parole gentili',
    'Rendi le tue richieste cortesi e naturali.',
    'Could I have a coffee, please?',
    'Potrei avere un caffè, per favore?',
  ],
  [
    'Un piccolo dialogo',
    'Tieni viva una conversazione di tutti i giorni.',
    'How are you? I am happy, thanks.',
    'Come stai? Sono felice, grazie.',
  ],
  [
    'Un caffè, per favore',
    'Ordina qualcosa e ringrazia chi ti aiuta.',
    'I would like some water, please.',
    'Vorrei dell’acqua, per favore.',
  ],
  [
    'La mia famiglia',
    'Racconta qualcosa delle persone a cui tieni.',
    'This is my family. We are happy.',
    'Questa è la mia famiglia. Siamo felici.',
  ],
  [
    'In giro per la città',
    'Chiedi un’indicazione e capisci la risposta.',
    'Where is the station? Go straight ahead.',
    'Dov’è la stazione? Vai sempre dritto.',
  ],
  [
    'Una giornata insieme',
    'Riunisci le frasi che hai imparato negli ultimi giorni.',
    'Let’s speak English together!',
    'Parliamo inglese insieme!',
  ],
]

export const challengeDays = plan.map(
  ([title, goal, phrase, meaning], day) => ({
    day: day + 1,
    title,
    goal,
    phrase,
    meaning,
    lessonIndex: day,
    questions: lessons[day].questions,
  }),
)
