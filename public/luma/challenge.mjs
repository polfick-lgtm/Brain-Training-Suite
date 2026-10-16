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

const practice = [
  [
    ['My name is Anna.', 'Mi chiamo Anna.'],
    ['I am from Italy.', 'Vengo dall’Italia.'],
    ['I speak a little English.', 'Parlo un po’ di inglese.'],
    ['Nice to meet you.', 'Piacere di conoscerti.'],
  ],
  [
    ['What is your name?', 'Come ti chiami?'],
    ['Do you live here?', 'Vivi qui?'],
    ['I live in Rome.', 'Vivo a Roma.'],
    ['What do you do?', 'Che lavoro fai?'],
  ],
  [
    ['Could you help me, please?', 'Potresti aiutarmi, per favore?'],
    ['Thank you for your help.', 'Grazie per il tuo aiuto.'],
    ['You are welcome.', 'Prego.'],
    ['Sorry, I do not understand.', 'Scusa, non capisco.'],
  ],
  [
    ['How was your day?', 'Come è andata la tua giornata?'],
    ['It was a good day.', 'È stata una bella giornata.'],
    ['What about you?', 'E tu?'],
    ['See you tomorrow.', 'Ci vediamo domani.'],
  ],
  [
    ['I would like a coffee.', 'Vorrei un caffè.'],
    ['Can I see the menu?', 'Posso vedere il menù?'],
    ['How much is it?', 'Quanto costa?'],
    ['Can I pay by card?', 'Posso pagare con la carta?'],
  ],
  [
    ['I have a sister.', 'Ho una sorella.'],
    ['My brother lives nearby.', 'Mio fratello vive qui vicino.'],
    ['We have dinner together.', 'Ceniamo insieme.'],
    ['She is very kind.', 'Lei è molto gentile.'],
  ],
  [
    ['Is it far from here?', 'È lontano da qui?'],
    ['Turn left at the next street.', 'Gira a sinistra alla prossima strada.'],
    ['The shop is next to the bank.', 'Il negozio è accanto alla banca.'],
    ['How can I get to the station?', 'Come posso arrivare alla stazione?'],
  ],
  [
    ['I would like to practise every day.', 'Vorrei esercitarmi ogni giorno.'],
    ['Could you say that again?', 'Potresti ripeterlo?'],
    [
      'Please speak a little more slowly.',
      'Per favore, parla un po’ più lentamente.',
    ],
    ['I can understand more now.', 'Adesso riesco a capire di più.'],
  ],
]

function questionsFor(phrases) {
  const words = phrases[1].phrase.split(' ')
  const note = 'Riascolta il tutor e ripeti la frase ad alta voce.'
  return [
    {
      type: 'choice',
      prompt: `Come si dice: ${phrases[0].meaning}`,
      options: [phrases[1].phrase, phrases[0].phrase, phrases[3].phrase],
      answer: phrases[0].phrase,
      note,
    },
    {
      type: 'words',
      prompt: phrases[1].meaning,
      bank: [...words.slice(1), words[0]],
      answer: words,
      note,
    },
    {
      type: 'listen',
      prompt: 'Ascolta e scegli il significato',
      phrase: phrases[2].phrase,
      options: [phrases[3].meaning, phrases[4].meaning, phrases[2].meaning],
      answer: phrases[2].meaning,
      note,
    },
    {
      type: 'choice',
      prompt: `Come si dice: ${phrases[4].meaning}`,
      options: [phrases[4].phrase, phrases[2].phrase, phrases[0].phrase],
      answer: phrases[4].phrase,
      note,
    },
  ]
}

export const challengeDays = plan.map(([title, goal, phrase, meaning], day) => {
  const phrases = [[phrase, meaning], ...practice[day]].map(
    ([phrase, meaning]) => ({ phrase, meaning }),
  )
  return {
    day: day + 1,
    title,
    goal,
    phrase,
    meaning,
    lessonIndex: day,
    phrases,
    questions: questionsFor(phrases),
  }
})
