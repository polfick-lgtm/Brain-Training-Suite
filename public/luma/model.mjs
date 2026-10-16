const choice = (prompt, options, answer, note) => ({
  type: 'choice',
  prompt,
  options,
  answer,
  note,
})
const words = (prompt, bank, answer, note) => ({
  type: 'words',
  prompt,
  bank,
  answer,
  note,
})
const listen = (phrase, options, answer, note) => ({
  type: 'listen',
  phrase,
  prompt: 'Ascolta e scegli la traduzione',
  options,
  answer,
  note,
})
export const chapters = [
  {
    title: 'Le prime parole',
    subtitle: 'Ogni conversazione inizia da un piccolo hello.',
    tag: 'LE BASI',
    lessons: [
      {
        title: 'Hello, world!',
        icon: 'sun',
        description: 'Saluta e presentati',
        questions: [
          choice(
            'Come si dice «Ciao»?',
            ['Hello', 'Thanks', 'Sorry'],
            'Hello',
            'Hello è un saluto adatto a qualsiasi momento della giornata.',
          ),
          words(
            'Io sono Anna',
            ['Anna', 'am', 'you', 'I'],
            ['I', 'am', 'Anna'],
            'In inglese il pronome I si scrive sempre maiuscolo.',
          ),
          listen(
            'Good morning',
            ['Buonanotte', 'Buongiorno', 'Arrivederci'],
            'Buongiorno',
            'Good morning si usa al mattino.',
          ),
          choice(
            'Completa: «Nice to ___ you.»',
            ['meet', 'go', 'eat'],
            'meet',
            'Nice to meet you significa Piacere di conoscerti.',
          ),
        ],
      },
      {
        title: 'Piacere di conoscerti',
        icon: 'chat',
        description: 'Parla di te',
        questions: [
          choice(
            '«What is your name?» significa…',
            ['Come ti chiami?', 'Come stai?', 'Dove abiti?'],
            'Come ti chiami?',
            'What is your name? è una domanda per conoscere il nome.',
          ),
          words(
            'Il mio nome è Luca',
            ['Luca', 'is', 'My', 'name', 'your'],
            ['My', 'name', 'is', 'Luca'],
            'My indica qualcosa che appartiene a chi parla.',
          ),
          listen(
            'How are you?',
            ['Quanti anni hai?', 'Come stai?', 'Chi sei?'],
            'Come stai?',
            'Puoi rispondere: I am fine, thank you.',
          ),
          choice(
            'Scegli la risposta a «How are you?»',
            ['I am fine, thanks.', 'My name is Sam.', 'Good night.'],
            'I am fine, thanks.',
            'Fine significa bene.',
          ),
        ],
      },
      {
        title: 'Le parole gentili',
        icon: 'heart',
        description: 'Un grazie fa la differenza',
        questions: [
          choice(
            'Come si dice «Per favore»?',
            ['Please', 'Sorry', 'Welcome'],
            'Please',
            'Aggiungi please per rendere una richiesta più gentile.',
          ),
          words(
            'Grazie mille',
            ['very', 'you', 'Thank', 'much', 'please'],
            ['Thank', 'you', 'very', 'much'],
            'Thank you very much esprime un ringraziamento sentito.',
          ),
          listen(
            'You are welcome',
            ['Scusami', 'Prego', 'Buonasera'],
            'Prego',
            'You are welcome è una risposta a Thank you.',
          ),
          choice(
            'Hai urtato qualcuno. Cosa dici?',
            ['I am sorry.', 'Good morning.', 'See you.'],
            'I am sorry.',
            'Sorry si usa per scusarsi.',
          ),
        ],
      },
      {
        title: 'Un piccolo dialogo',
        icon: 'trophy',
        description: 'Metti insieme ciò che sai',
        questions: [
          choice(
            '«See you soon!» significa…',
            ['A presto!', 'Benvenuto!', 'A domani!'],
            'A presto!',
            'Soon significa presto.',
          ),
          words(
            'Piacere di conoscerti',
            ['meet', 'Nice', 'you', 'to', 'hello'],
            ['Nice', 'to', 'meet', 'you'],
            'Una frase utile quando incontri qualcuno per la prima volta.',
          ),
          listen(
            'Good evening',
            ['Buonasera', 'Buongiorno', 'A presto'],
            'Buonasera',
            'Evening è la sera.',
          ),
          choice(
            'Quale risposta completa «Thank you!»?',
            ['You are welcome!', 'What is your name?', 'Hello!'],
            'You are welcome!',
            'Ottimo: hai completato il tuo primo dialogo!',
          ),
        ],
      },
    ],
  },
  {
    title: 'Il mondo intorno a te',
    subtitle: 'Persone, luoghi e piccole cose di ogni giorno.',
    tag: 'VITA QUOTIDIANA',
    lessons: [
      {
        title: 'Un caffè, per favore',
        icon: 'cup',
        description: 'Ordina qualcosa di buono',
        questions: [
          choice(
            '«A coffee, please.» significa…',
            [
              'Un caffè, per favore.',
              'Un tè, grazie.',
              'Un bicchiere d’acqua.',
            ],
            'Un caffè, per favore.',
            'A si usa davanti a un nome singolare che inizia con un suono consonantico.',
          ),
          words(
            'Vorrei un tè',
            ['tea', 'would', 'a', 'I', 'like', 'coffee'],
            ['I', 'would', 'like', 'a', 'tea'],
            'I would like è una forma cortese per chiedere qualcosa.',
          ),
          listen(
            'The water is cold',
            ['L’acqua è calda.', 'L’acqua è fredda.', 'Il tè è freddo.'],
            'L’acqua è fredda.',
            'Cold significa freddo; hot significa caldo.',
          ),
          choice(
            '«How much is it?» chiede…',
            ['Quanto costa?', 'Dov’è?', 'Che ore sono?'],
            'Quanto costa?',
            'Una domanda utile al bar e nei negozi.',
          ),
        ],
      },
      {
        title: 'La mia famiglia',
        icon: 'heart',
        description: 'Presenta le persone che ami',
        questions: [
          choice(
            '«Sister» significa…',
            ['Sorella', 'Fratello', 'Madre'],
            'Sorella',
            'Brother significa fratello.',
          ),
          words(
            'Questa è mia madre',
            ['mother', 'is', 'This', 'my', 'father'],
            ['This', 'is', 'my', 'mother'],
            'This is si usa per presentare qualcuno.',
          ),
          listen(
            'My brother is a teacher',
            [
              'Mio fratello è un insegnante.',
              'Mia sorella è una studentessa.',
              'Mio padre è un medico.',
            ],
            'Mio fratello è un insegnante.',
            'Teacher significa insegnante.',
          ),
          choice(
            'Come traduci «La mia famiglia»?',
            ['My family', 'Your friend', 'The city'],
            'My family',
            'Family comprende i tuoi familiari.',
          ),
        ],
      },
      {
        title: 'In giro per la città',
        icon: 'map',
        description: 'Trova la tua strada',
        questions: [
          choice(
            'Dove prendi il treno?',
            ['At the station', 'At the park', 'At home'],
            'At the station',
            'Station significa stazione.',
          ),
          words(
            'Dove è il parco',
            ['Where', 'park', 'is', 'the', 'when'],
            ['Where', 'is', 'the', 'park'],
            'Where introduce una domanda su un luogo.',
          ),
          listen(
            'Turn left',
            ['Gira a destra', 'Gira a sinistra', 'Vai dritto'],
            'Gira a sinistra',
            'Left significa sinistra; right significa destra.',
          ),
          choice(
            '«The shop is near the hotel.» significa…',
            [
              'Il negozio è vicino all’hotel.',
              'Il negozio è chiuso.',
              'L’hotel è lontano.',
            ],
            'Il negozio è vicino all’hotel.',
            'Near significa vicino.',
          ),
        ],
      },
      {
        title: 'Una giornata insieme',
        icon: 'trophy',
        description: 'Ripassa la vita quotidiana',
        questions: [
          choice(
            'Come chiedi «Dov’è la stazione?»?',
            [
              'Where is the station?',
              'How is the station?',
              'What is your name?',
            ],
            'Where is the station?',
            'Per chiedere dove si trova qualcosa usa Where is…?',
          ),
          words(
            'Mi piace il caffè',
            ['coffee', 'like', 'I', 'tea'],
            ['I', 'like', 'coffee'],
            'I like significa mi piace.',
          ),
          listen(
            'This is my sister',
            [
              'Questa è mia sorella.',
              'Questo è mio fratello.',
              'Quella è mia madre.',
            ],
            'Questa è mia sorella.',
            'This is introduce una persona o un oggetto vicino.',
          ),
          choice(
            'Ordina gentilmente un bicchiere d’acqua.',
            ['Water, please.', 'Water, sorry.', 'Water, goodbye.'],
            'Water, please.',
            'Please trasforma una richiesta semplice in una richiesta gentile.',
          ),
        ],
      },
    ],
  },
  {
    title: 'Pronti a partire',
    subtitle: 'Porta il tuo inglese un po’ più lontano.',
    tag: 'IN VIAGGIO',
    lessons: [
      {
        title: 'Si parte!',
        icon: 'plane',
        description: 'Il tuo primo viaggio in inglese',
        questions: [
          choice(
            '«Ticket» significa…',
            ['Biglietto', 'Valigia', 'Passaporto'],
            'Biglietto',
            'A train ticket è un biglietto del treno.',
          ),
          words(
            'Ho un biglietto',
            ['ticket', 'a', 'have', 'I', 'my'],
            ['I', 'have', 'a', 'ticket'],
            'Have significa avere.',
          ),
          listen(
            'Where is the airport?',
            [
              'Dov’è l’aeroporto?',
              'Dov’è l’hotel?',
              'Quanto costa il biglietto?',
            ],
            'Dov’è l’aeroporto?',
            'Airport significa aeroporto.',
          ),
          choice(
            '«My flight is at ten.» significa…',
            [
              'Il mio volo è alle dieci.',
              'Il mio volo è in ritardo.',
              'Ho dieci biglietti.',
            ],
            'Il mio volo è alle dieci.',
            'At si usa per indicare un orario.',
          ),
        ],
      },
      {
        title: 'Benvenuto in hotel',
        icon: 'home',
        description: 'Fai il check-in',
        questions: [
          choice(
            '«I have a reservation.» significa…',
            ['Ho una prenotazione.', 'Ho una domanda.', 'Ho una valigia.'],
            'Ho una prenotazione.',
            'Reservation significa prenotazione.',
          ),
          words(
            'La mia camera è grande',
            ['room', 'big', 'My', 'is', 'small'],
            ['My', 'room', 'is', 'big'],
            'Big significa grande; small significa piccolo.',
          ),
          listen(
            'Breakfast is at eight',
            [
              'La colazione è alle otto.',
              'La cena è alle otto.',
              'La colazione è alle nove.',
            ],
            'La colazione è alle otto.',
            'Breakfast significa colazione.',
          ),
          choice(
            'Come dici «Grazie per il tuo aiuto»?',
            [
              'Thank you for your help.',
              'Please help yesterday.',
              'You are welcome.',
            ],
            'Thank you for your help.',
            'For introduce il motivo del ringraziamento.',
          ),
        ],
      },
      {
        title: 'Che bella giornata',
        icon: 'sun',
        description: 'Parla dei tuoi programmi',
        questions: [
          choice(
            '«It is sunny.» significa…',
            ['C’è il sole.', 'Piove.', 'Fa freddo.'],
            'C’è il sole.',
            'Sunny descrive una giornata di sole.',
          ),
          words(
            'Voglio visitare Londra',
            ['London', 'want', 'I', 'visit', 'to', 'go'],
            ['I', 'want', 'to', 'visit', 'London'],
            'Dopo want usa to e il verbo.',
          ),
          listen(
            'Let us go to the park',
            ['Andiamo al parco.', 'Torniamo a casa.', 'Visitiamo l’hotel.'],
            'Andiamo al parco.',
            'Let us, spesso contratto in Let’s, introduce una proposta.',
          ),
          choice(
            '«Tomorrow» significa…',
            ['Domani', 'Ieri', 'Oggi'],
            'Domani',
            'Today significa oggi; yesterday significa ieri.',
          ),
        ],
      },
      {
        title: 'Il tuo primo traguardo',
        icon: 'trophy',
        description: 'Celebra quello che hai imparato',
        questions: [
          choice(
            'Rispondi a «Do you speak English?»',
            ['Yes, a little.', 'It is sunny.', 'A coffee, please.'],
            'Yes, a little.',
            'A little significa un po’.',
          ),
          words(
            'È bello essere qui',
            ['nice', 'here', 'It', 'to', 'is', 'be', 'go'],
            ['It', 'is', 'nice', 'to', 'be', 'here'],
            'Un’espressione utile quando arrivi in un posto nuovo.',
          ),
          listen(
            'Thank you for everything',
            ['Grazie di tutto.', 'Grazie del caffè.', 'Arrivederci a tutti.'],
            'Grazie di tutto.',
            'Everything significa tutto.',
          ),
          choice(
            'Come dici «Ci vediamo domani»?',
            ['See you tomorrow.', 'Good morning.', 'See you yesterday.'],
            'See you tomorrow.',
            'Hai raggiunto il traguardo. Continua a esercitarti!',
          ),
        ],
      },
    ],
  },
]
export const lessons = chapters.flatMap((c, chapter) =>
  c.lessons.map((l) => ({ ...l, chapter })),
)
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function initialState() {
  return {
    version: 2,
    xp: 0,
    gems: 0,
    completed: [],
    extras: [],
    claimedChests: [],
    streak: 0,
    lastStudy: null,
    daily: {
      date: dayKey(),
      xp: 0,
      lessons: 0,
      listening: 0,
      accurate: 0,
      claimed: [],
    },
    history: [],
    streakSavers: 0,
    purchases: [],
    challengeDays: [],
    challengePractice: {},
    challengeReview: {},
    challengeLastDate: null,
  }
}
export function hydrate(raw) {
  const fresh = initialState()
  try {
    const v = JSON.parse(raw)
    if (!v || ![1, 2].includes(v.version)) return fresh
    return {
      ...fresh,
      xp: Math.max(0, Number(v.xp) || 0),
      gems: Math.max(0, Number(v.gems) || 0),
      completed: [
        ...new Set(
          (Array.isArray(v.completed) ? v.completed : []).filter(
            (i) => Number.isInteger(i) && i >= 0 && i < lessons.length,
          ),
        ),
      ].sort((a, b) => a - b),
      extras: [
        ...new Set(
          (Array.isArray(v.extras) ? v.extras : []).filter(
            (x) => typeof x === 'string' && x.length < 80,
          ),
        ),
      ].slice(0, 300),
      claimedChests: [
        ...new Set(
          (Array.isArray(v.claimedChests) ? v.claimedChests : []).filter(
            (i) => Number.isInteger(i) && i >= 0 && i < chapters.length,
          ),
        ),
      ],
      streak: Math.max(0, Number(v.streak) || 0),
      lastStudy: typeof v.lastStudy === 'string' ? v.lastStudy : null,
      daily:
        v.daily?.date === dayKey()
          ? {
              date: dayKey(),
              xp: Math.max(0, Number(v.daily.xp) || 0),
              lessons: Math.max(0, Number(v.daily.lessons) || 0),
              listening: Math.max(0, Number(v.daily.listening) || 0),
              accurate: Math.max(0, Number(v.daily.accurate) || 0),
              claimed: Array.isArray(v.daily.claimed)
                ? v.daily.claimed.filter(
                    (x) => typeof x === 'string' && x.length < 40,
                  )
                : [],
            }
          : fresh.daily,
      history: Array.isArray(v.history)
        ? v.history
            .filter(
              (x) => typeof x?.date === 'string' && Number.isFinite(x?.xp),
            )
            .slice(-30)
        : [],
      streakSavers: Math.max(0, Number(v.streakSavers) || 0),
      purchases: Array.isArray(v.purchases)
        ? v.purchases
            .filter((x) => typeof x?.id === 'string' && Number.isFinite(x?.at))
            .slice(-100)
        : [],
      challengeDays: [
        ...new Set(
          (Array.isArray(v.challengeDays) ? v.challengeDays : []).filter(
            (n) => Number.isInteger(n) && n >= 1 && n <= 8,
          ),
        ),
      ].sort((a, b) => a - b),
      challengeLastDate:
        typeof v.challengeLastDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(v.challengeLastDate)
          ? v.challengeLastDate
          : null,
      challengePractice: Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => String(i + 1)).map((day) => [
          day,
          [
            ...new Set(
              (Array.isArray(v.challengePractice?.[day])
                ? v.challengePractice[day]
                : []
              ).filter(
                (index) => Number.isInteger(index) && index >= 0 && index < 5,
              ),
            ),
          ],
        ]),
      ),
      challengeReview: Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => String(i + 1)).map((day) => [
          day,
          [
            ...new Set(
              (Array.isArray(v.challengeReview?.[day])
                ? v.challengeReview[day]
                : []
              ).filter(
                (index) => Number.isInteger(index) && index >= 0 && index < 5,
              ),
            ),
          ],
        ]),
      ),
    }
  } catch {
    return fresh
  }
}
function calendarDistance(from, to) {
  const a = new Date(from),
    b = new Date(to)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}
export function currentStreak(state, now = new Date()) {
  const gap = state.lastStudy
    ? calendarDistance(state.lastStudy, dayKey(now))
    : Infinity
  return gap <= 1 || (gap === 2 && state.streakSavers > 0) ? state.streak : 0
}
export function nextLesson(state) {
  return lessons.findIndex((_, i) => !state.completed.includes(i))
}
export function normalize(s) {
  return String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[.,!?;:“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
export function isCorrect(q, answer) {
  return (
    normalize(Array.isArray(answer) ? answer.join(' ') : answer) ===
    normalize(Array.isArray(q.answer) ? q.answer.join(' ') : q.answer)
  )
}
function studyDay(s, xp, now) {
  const today = dayKey(now),
    gap = s.lastStudy ? calendarDistance(s.lastStudy, today) : null
  if (s.lastStudy !== today) {
    if (gap === 1) s.streak++
    else if (gap > 1 && gap <= 2 && s.streakSavers > 0) s.streakSavers--
    else s.streak = 1
    s.lastStudy = today
  }
  if (s.daily.date !== today)
    s.daily = {
      date: today,
      xp: 0,
      lessons: 0,
      listening: 0,
      accurate: 0,
      claimed: [],
    }
  s.daily.xp += xp
}
export function completeLesson(
  state,
  id,
  { correct, total, listening = 0, practice = false },
  now = new Date(),
) {
  if (
    !Number.isInteger(id) ||
    !lessons[id] ||
    !Number.isFinite(total) ||
    total <= 0 ||
    !Number.isFinite(correct) ||
    correct < 0 ||
    correct > total ||
    !Number.isFinite(listening) ||
    listening < 0
  )
    throw new Error('Risultato non valido')
  if (practice && !state.completed.includes(id))
    throw new Error('Ripasso disponibile solo dopo aver completato la lezione')
  if (!practice && id !== nextLesson(state) && !state.completed.includes(id))
    throw new Error('Lezione bloccata')
  const s = structuredClone(state),
    xp = 10 + Math.round((10 * correct) / total),
    first = !s.completed.includes(id) && !practice
  s.xp += xp
  s.gems += first ? 5 : 0
  if (first) s.completed.push(id)
  studyDay(s, xp, now)
  s.daily.lessons++
  s.daily.listening += listening
  if (correct / total >= 0.9) s.daily.accurate++
  s.history.push({
    date: dayKey(now),
    xp,
    lesson: id,
    accuracy: Math.round((correct / total) * 100),
    kind: practice ? 'review' : 'lesson',
  })
  s.history = s.history.slice(-30)
  return { state: s, xp, first, accuracy: Math.round((correct / total) * 100) }
}
export function completeExtra(
  state,
  id,
  { xp = 12, gems = 0, listening = 0, lessons: count = 0 },
  now = new Date(),
) {
  if (
    typeof id !== 'string' ||
    id.length < 3 ||
    id.length > 80 ||
    !/^(story|radio|practice|legendary):\d+$/.test(id) ||
    !Number.isFinite(xp) ||
    xp < 0 ||
    xp > 100 ||
    !Number.isFinite(gems) ||
    gems < 0 ||
    gems > 100 ||
    !Number.isFinite(listening) ||
    listening < 0 ||
    !Number.isFinite(count) ||
    count < 0
  )
    throw new Error('Risultato non valido')
  if (state.extras.includes(id)) throw new Error('Attività già completata')
  const s = structuredClone(state)
  s.extras.push(id)
  s.xp += xp
  s.gems += gems
  studyDay(s, xp, now)
  s.daily.lessons += count
  s.daily.listening += listening
  s.history.push({
    date: dayKey(now),
    xp,
    lesson: null,
    accuracy: 100,
    kind: id.split(':')[0],
  })
  s.history = s.history.slice(-30)
  return { state: s, xp, gems, first: true }
}
export function completeChallengeDay(
  state,
  day,
  { correct, total, listening = 0, missedPhrases = [] },
  now = new Date(),
) {
  if (
    !Number.isInteger(day) ||
    day < 1 ||
    day > 8 ||
    day !== state.challengeDays.length + 1
  )
    throw new Error('Completa i giorni della sfida in ordine.')
  if (state.challengeLastDate === dayKey(now))
    throw new Error(
      'Hai già completato la tappa di oggi. Torna domani per continuare.',
    )
  if (
    !Number.isFinite(correct) ||
    !Number.isFinite(total) ||
    total < 1 ||
    correct < 0 ||
    correct > total ||
    !Number.isFinite(listening) ||
    listening < 0 ||
    !Array.isArray(missedPhrases) ||
    missedPhrases.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= 5,
    )
  )
    throw new Error('Risultato della sfida non valido.')
  const s = structuredClone(state)
  const xp = 8 + Math.round((correct / total) * 12)
  const gems = correct === total ? 3 : 1
  s.challengeDays.push(day)
  s.challengeLastDate = dayKey(now)
  s.challengeReview[day] = [...new Set(missedPhrases)]
  s.xp += xp
  s.gems += gems
  studyDay(s, xp, now)
  s.daily.lessons++
  s.daily.listening += listening
  if (correct / total >= 0.9) s.daily.accurate++
  s.history.push({
    date: dayKey(now),
    xp,
    lesson: null,
    accuracy: Math.round((correct / total) * 100),
    kind: 'challenge',
  })
  s.history = s.history.slice(-30)
  return { state: s, xp, gems, accuracy: Math.round((correct / total) * 100) }
}
export function claimChest(state, chapter, now = new Date()) {
  if (!Number.isInteger(chapter) || chapter < 0 || chapter >= chapters.length)
    throw new Error('Forziere non valido')
  const ids = chapters[chapter].lessons.map(
    (_, i) => chapter * chapters[chapter].lessons.length + i,
  )
  if (!ids.every((id) => state.completed.includes(id)))
    throw new Error(
      'Completa tutte le tappe del capitolo per aprire il forziere',
    )
  if (state.claimedChests.includes(chapter))
    throw new Error('Forziere già aperto')
  const s = structuredClone(state),
    reward = 20
  s.claimedChests.push(chapter)
  s.gems += reward
  s.xp += reward
  studyDay(s, reward, now)
  s.daily.lessons++
  s.daily.accurate++
  s.history.push({
    date: dayKey(now),
    xp: reward,
    lesson: null,
    accuracy: 100,
    kind: 'chest',
  })
  s.history = s.history.slice(-30)
  return { state: s, xp: reward, gems: reward }
}
export function buyStreakSaver(state) {
  const cost = 100
  if (!Number.isFinite(state.gems) || state.gems < cost)
    throw new Error('Servono 100 gemme')
  const s = structuredClone(state)
  s.gems -= cost
  s.streakSavers++
  s.purchases.push({ id: 'streak-saver', at: Date.now() })
  s.purchases = s.purchases.slice(-100)
  return s
}
export function weekActivity(state, now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = dayKey(date)
    return {
      key,
      day: ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'][i],
      date: date.getDate(),
      studied: state.history.some((item) => item.date === key),
      today: key === dayKey(now),
    }
  })
}
