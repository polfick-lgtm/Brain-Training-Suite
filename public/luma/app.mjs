import {
  chapters,
  lessons,
  hydrate,
  nextLesson,
  completeLesson,
  completeExtra,
  claimChest,
  buyStreakSaver,
  isCorrect,
  currentStreak,
  weekActivity,
  dayKey,
  completeChallengeDay,
} from './model.mjs'
import { challengeDays } from './challenge.mjs'
import { PhraseTutor } from './tutor.mjs'
import {
  configured as authConfigured,
  register as registerAccount,
  signIn as signInAccount,
  signOut as signOutAccount,
  currentPlayer,
  loadProgress,
  saveProgress,
  listPlayers,
  setPlayerApproval,
} from './auth.mjs'
const paths = {
  home: 'm3 11 9-8 9 8 M5 10v11h14V10 M9 21v-7h6v7',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2z M9 3v16 M15 5v16',
  sound: 'm3 9 5 0 5-5v16l-5-5H3z M17 8q6 4 0 8 M20 5q9 7 0 14',
  practice: 'm7 4-4 4 4 4 M3 8h11a7 7 0 1 1-7 7',
  trophy:
    'M8 3h8v8a4 4 0 0 1-8 0z M8 5H4v3q0 4 5 4 M16 5h4v3q0 4-5 4 M12 15v6 M8 21h8',
  quest: 'm13 2-9 12h7l-1 8 10-13h-8z',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 22v-3a8 8 0 0 1 16 0v3',
  heart: 'M12 21 3 12C-2 4 8-1 12 6 16-1 26 4 21 12z',
  gem: 'm7 3-5 7 10 12 10-12-5-7z M2 10h20 M7 3l5 19 5-19',
  fire: 'M12 2q1 6-4 9 0-4-3-4-6 14 7 15 13-2 5-14 0 5-3 6 2-6-2-12',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M4 20l2-2 M18 6l2-2',
  chat: 'M21 11a9 8 0 0 1-9 8H6l-4 3V11a9 8 0 0 1 19 0 M7 10h10 M7 14h6',
  cup: 'M4 4h12v10a5 5 0 0 1-10 0V4 M16 5h2a4 4 0 0 1 0 8h-2 M3 22h16',
  plane: 'm22 3-6 19-4-8-10-4z M12 14l10-11',
  lock: 'M5 10h14v12H5z M8 10V6a4 4 0 0 1 8 0v4 M12 15v3',
  book: 'M12 5q-5-3-10 0v15q5-3 10 0 5-3 10 0V5q-5-3-10 0 M12 5v15',
  check: 'm5 12 5 5L20 6',
  arrow: 'm9 5 7 7-7 7',
  star: 'm12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z',
  target: 'M21 12a9 9 0 1 1-9-9 M17 12a5 5 0 1 1-5-5 M12 12l9-9 M16 3h5v5',
  store:
    'M3 10h18l-2-7H5z M5 10v11h14V10 M9 21v-7h6v7 M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0',
  chest: 'M3 8h18v13H3z M2 4h20v4H2z M10 12h4v5h-4z',
  medal: 'M8 3h8l3 6-7 4-7-4z M12 13v8 M8 21h8',
  ear: 'M7 13v-2a5 5 0 1 1 10 0c0 4-4 4-4 8a3 3 0 0 1-6 0',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  back: 'M19 12H5 M12 5l-7 7 7 7',
}
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.star}"/></svg>`
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )
const MIGRATION_KEY = 'luma-progress-owner-v1'
let raw = null,
  storageAvailable = true
try {
  raw = localStorage.getItem('luma-progress-v1')
} catch {
  storageAvailable = false
}
let state = hydrate(raw),
  session = null,
  view = 'learn',
  chapterShown = null,
  player = null,
  syncTimer = null
const content = document.querySelector('#content'),
  lessonDialog = document.querySelector('#lesson-dialog'),
  infoDialog = document.querySelector('#info-dialog'),
  authGate = document.querySelector('#auth-gate')
let tutorIndex = 0
let tutorDayNumber = 1
const tutor = new PhraseTutor({
  synthesis: window.speechSynthesis,
  Utterance: window.SpeechSynthesisUtterance,
  onStage: updateTutorStage,
})

function tutorRoot() {
  return (infoDialog.open ? infoDialog : content).querySelector('.tutor-card')
}
function updateTutorStage(stage) {
  const root = tutorRoot()
  if (!root) return
  const labels = {
    ready:
      'Avvia il tutor: ascolta l’italiano, prova a tradurre e poi ripeti l’inglese.',
    italian: 'Ascolta la frase in italiano.',
    think: 'Ora prova a dirla in inglese. La risposta arriva dopo la pausa.',
    english: 'Ascolta la pronuncia inglese.',
    repeat:
      'Tocca a te: ripeti ad alta voce. Quando sei pronto, passa alla prossima frase.',
    revealed: 'Confronta la tua frase e ascolta la pronuncia inglese.',
    unavailable:
      'Audio non disponibile: leggi entrambe le versioni e ripeti ad alta voce.',
  }
  root.querySelector('[data-tutor-status]').textContent = labels[stage]
  root.querySelector('[data-tutor-answer]').hidden = [
    'ready',
    'italian',
    'think',
  ].includes(stage)
}
function tutorCard(day) {
  if (tutorDayNumber !== day.day) tutorIndex = 0
  tutorDayNumber = day.day
  const pair = day.phrases[tutorIndex]
  const practised = state.challengePractice[day.day] || []
  return `<section class="tutor-card" aria-label="Tutor italiano e inglese"><small>FRASI GUIDATE · ${tutorIndex + 1} / ${day.phrases.length} · ${practised.length} PRATICATE</small><h3>Prima l’italiano, poi tocca a te.</h3><p class="tutor-prompt" lang="it">${escape(pair.meaning)}</p><p class="tutor-answer" data-tutor-answer lang="en" hidden>${escape(pair.phrase)}</p><p data-tutor-status role="status">Avvia il tutor: ascolta l’italiano, prova a tradurre e poi ripeti l’inglese.</p><label>Pausa per tradurre <select data-tutor-pause aria-label="Pausa per tradurre"><option value="3">3 secondi</option><option value="5" selected>5 secondi</option><option value="8">8 secondi</option></select></label><div class="tutor-controls"><button class="primary" data-action="tutor-play">${icon('sound')} ASCOLTA IL TUTOR</button><button class="secondary" data-action="tutor-stop">FERMA AUDIO</button><button class="auth-switch" data-action="tutor-reveal">MOSTRA L’INGLESE</button><button class="auth-switch" data-action="tutor-english">RIASCOLTA INGLESE</button><button class="auth-switch" data-action="tutor-slow">INGLESE LENTO</button></div><div class="tutor-controls"><button class="secondary" data-action="tutor-previous" ${tutorIndex === 0 ? 'disabled' : ''}>PRECEDENTE</button><button class="secondary" data-action="tutor-confirm">${tutorIndex === day.phrases.length - 1 ? 'HO RIPETUTO · CONCLUDI PRATICA' : 'HO RIPETUTO · PROSSIMA'}</button></div><p><a class="auth-switch" href="https://translate.google.com/?sl=it&amp;tl=en&amp;text=${encodeURIComponent(pair.meaning)}&amp;op=translate" target="_blank" rel="noopener noreferrer">APRI QUESTA FRASE IN GOOGLE TRADUTTORE</a></p><p class="muted">Voci sintetiche del dispositivo. La ripetizione è libera: il microfono non viene registrato né valutato. Dopo le frasi, completa i quattro esercizi della lezione.</p></section>`
}
const navItems = [
  ['learn', 'map', 'Impara'],
  ['challenge', 'sun', '8 Giorni'],
  ['sounds', 'sound', 'Suoni'],
  ['practice', 'practice', 'Ripasso'],
  ['translate', 'chat', 'Traduttore'],
  ['ranking', 'trophy', 'Classifiche'],
  ['quests', 'quest', 'Missioni'],
  ['shop', 'store', 'Negozio'],
  ['profile', 'profile', 'Profilo'],
]
const destinations = {
  learn: '#learn',
  challenge: '#challenge',
  sounds: '#sounds',
  practice: '#practice',
  translate: '#translate',
  ranking: '#ranking',
  quests: '#quests',
  shop: '#shop',
  profile: '#profile',
  admin: '#admin',
}
document.querySelector('#navigation').innerHTML =
  navItems
    .map(
      ([id, i, title]) =>
        `<a class="nav-link" href="${destinations[id]}" data-view="${id}" aria-label="${title}">${icon(i)}<span class="nav-label">${title}</span></a>`,
    )
    .join('') +
  `<button class="nav-link more-toggle" data-action="more" aria-expanded="false">${icon('more')}<span class="nav-label">Mostra altro</span></button>`
function notify(message) {
  const el = document.querySelector('#toast')
  el.textContent = message
  el.classList.add('visible')
  clearTimeout(notify.timer)
  notify.timer = setTimeout(() => el.classList.remove('visible'), 4000)
}
function save() {
  try {
    localStorage.setItem('luma-progress-v1', JSON.stringify(state))
    if (player?.approval_status === 'approved') {
      clearTimeout(syncTimer)
      const owner = player.id
      const snapshot = JSON.parse(JSON.stringify(state))
      syncTimer = setTimeout(() => {
        if (player?.id !== owner) return
        saveProgress(owner, snapshot).catch(() =>
          notify(
            'Sincronizzazione non riuscita. Riprova quando la connessione è disponibile.',
          ),
        )
      }, 700)
    }
  } catch {
    storageAvailable = false
    notify(
      'Salvataggio non disponibile: i progressi restano in questa sessione.',
    )
  }
}
function showAuth({ mode = 'login', message = '', setup = false } = {}) {
  document.body.classList.add('auth-required')
  authGate.hidden = false
  if (setup) {
    authGate.innerHTML = `<div class="auth-card"><img src="mascot.svg" alt="" width="58" height="58"><p class="eyebrow">LUMA · ACCOUNT</p><h1 id="auth-title">Account non ancora configurati</h1><p>Il servizio dei profili personali è in preparazione.</p><p class="auth-message">Riprova più tardi.</p></div>`
    return
  }
  const registering = mode === 'register'
  authGate.innerHTML = `<div class="auth-card"><img src="mascot.svg" alt="" width="58" height="58"><p class="eyebrow">LUMA · INGLESE GENERALE</p><h1 id="auth-title">${registering ? 'Crea il tuo profilo' : 'Bentornato'}</h1><p>${registering ? 'La richiesta di accesso viene sottoposta ad approvazione.' : 'Accedi per continuare il tuo percorso da ogni dispositivo.'}</p>${registering ? '<p class="auth-privacy">Nome e indirizzo email saranno visibili all’amministratore per valutare la richiesta. I progressi saranno salvati nel tuo profilo personale. Non verranno inviate email.</p>' : ''}<form id="auth-form">${registering ? '<label>Nome giocatore<input name="displayName" autocomplete="nickname" maxlength="40" required></label>' : ''}<label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="${registering ? 'new-password' : 'current-password'}" minlength="12" maxlength="128" required></label><button class="primary" type="submit">${registering ? 'RICHIEDI ACCESSO' : 'ACCEDI'}</button><p class="auth-message" role="status">${escape(message)}</p></form><button class="auth-switch" data-auth-mode="${registering ? 'login' : 'register'}">${registering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}</button></div>`
}
async function activatePlayer(profile) {
  player = profile
  if (profile.approval_status !== 'approved') {
    if (profile.approval_status === 'rejected') {
      showAuth({
        message:
          'La richiesta di accesso non è stata approvata. Contatta chi gestisce Luma per ricevere assistenza.',
      })
      return
    }
    showAuth({
      message:
        'Richiesta registrata: attendi l’approvazione dell’amministratore, poi accedi di nuovo.',
    })
    return
  }
  const remote = await loadProgress(profile.id)
  const previousOwner = localStorage.getItem(MIGRATION_KEY)
  if (remote) state = hydrate(JSON.stringify(remote))
  else if (raw && (!previousOwner || previousOwner === profile.id)) {
    await saveProgress(profile.id, state)
    localStorage.setItem(MIGRATION_KEY, profile.id)
  } else state = hydrate(null)
  localStorage.setItem(MIGRATION_KEY, profile.id)
  save()
  authGate.hidden = true
  document.body.classList.remove('auth-required')
  document.querySelector('[data-view="admin"]')?.remove()
  if (profile.role === 'admin')
    document
      .querySelector('#navigation')
      .insertAdjacentHTML(
        'beforeend',
        `<a class="nav-link" href="#admin" data-view="admin" aria-label="Amministrazione">${icon('lock')}<span class="nav-label">Amministrazione</span></a>`,
      )
  render()
}
async function initializeAuth() {
  if (!authConfigured) {
    showAuth({ setup: true })
    return
  }
  try {
    const profile = await currentPlayer()
    if (!profile) {
      showAuth()
      return
    }
    await activatePlayer(profile)
  } catch {
    showAuth({
      message:
        'Sessione scaduta o servizio non raggiungibile. Accedi di nuovo.',
    })
  }
}
authGate.addEventListener('click', (event) => {
  const switcher = event.target.closest('[data-auth-mode]')
  if (switcher) showAuth({ mode: switcher.dataset.authMode })
})
authGate.addEventListener('submit', async (event) => {
  if (event.target.id !== 'auth-form') return
  event.preventDefault()
  const form = new FormData(event.target)
  const submit = event.target.querySelector('[type="submit"]')
  submit.disabled = true
  try {
    if (form.has('displayName')) {
      await registerAccount({
        displayName: String(form.get('displayName')).trim(),
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      })
      showAuth({
        message:
          'Richiesta registrata. L’amministratore potrà approvare il tuo profilo dalla propria area. Accedi dopo l’approvazione.',
      })
    } else {
      await signInAccount({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      })
      const profile = await currentPlayer()
      if (!profile)
        throw new Error('Profilo non trovato. Completa prima la registrazione.')
      await activatePlayer(profile)
    }
  } catch (error) {
    showAuth({
      mode: form.has('displayName') ? 'register' : 'login',
      message: error.message || 'Operazione non riuscita.',
    })
  }
})
function refreshDay() {
  if (state.daily.date !== dayKey())
    state.daily = {
      date: dayKey(),
      xp: 0,
      lessons: 0,
      listening: 0,
      accurate: 0,
      claimed: [],
    }
}
function quests() {
  refreshDay()
  return [
    {
      id: 'xp',
      icon: 'quest',
      title: 'Guadagna 10 XP',
      value: state.daily.xp,
      total: 10,
      gems: 2,
    },
    {
      id: 'accuracy',
      icon: 'target',
      title: 'Ottieni almeno il 90% in 1 lezione',
      value: state.daily.accurate,
      total: 1,
      gems: 2,
    },
    {
      id: 'listening',
      icon: 'sound',
      title: 'Completa 7 esercizi di ascolto',
      value: state.daily.listening,
      total: 7,
      gems: 3,
    },
  ]
}
function questHTML() {
  return quests()
    .map((q) => {
      const done = q.value >= q.total,
        claimed = state.daily.claimed.includes(q.id)
      return `<div class="quest"><div class="quest-icon">${icon(q.icon)}</div><div class="quest-copy"><strong>${q.title}</strong><div class="progress-track" role="progressbar" aria-label="${q.title}" aria-valuenow="${Math.min(q.value, q.total)}" aria-valuemin="0" aria-valuemax="${q.total}"><div class="progress-fill" style="width:${Math.min((q.value / q.total) * 100, 100)}%"></div></div><div class="quest-meta"><span>${Math.min(q.value, q.total)} / ${q.total}</span>${done ? (claimed ? `<span class="claimed-label">RISCOSSA ✓</span>` : `<button class="claim-button" data-claim="${q.id}" aria-label="Riscatta ${q.gems} gemme">RISCATTA +${q.gems} 💎</button>`) : `<span>OGGI</span>`}</div></div></div>`
    })
    .join('')
}
function weeklyHTML() {
  return weekActivity(state)
    .map(
      (d) =>
        `<div class="weekday ${d.studied ? 'studied' : ''} ${d.today ? 'today' : ''}" aria-label="${d.day} ${d.date}${d.studied ? ', studiato' : ''}">${d.day[0].toUpperCase()}<div class="day-dot">${d.studied ? '✓' : d.date}</div></div>`,
    )
    .join('')
}
function renderShell() {
  document.querySelectorAll('.nav-link[data-view]').forEach((el) => {
    el.classList.toggle('active', el.dataset.view === view)
    if (el.dataset.view === view) el.setAttribute('aria-current', 'page')
    else el.removeAttribute('aria-current')
  })
  document.querySelector('#stats').innerHTML =
    `<span class="stat league-stat" title="Lega settimanale">${icon('trophy')}<span>Esploratori</span></span><span class="stat fire" title="Giorni consecutivi">${icon('fire')}${currentStreak(state)}</span><span class="stat gem" title="Gemme">${icon('gem')}${state.gems}</span><span class="stat xp" title="Esperienza totale">${icon('quest')}${state.xp} <small>XP</small></span><a href="#profile" class="avatar" aria-label="Apri il tuo profilo">L</a>`
  document.querySelector('#rightbar').innerHTML =
    `<section class="panel league-panel"><div class="panel-heading"><h2>Lega Esploratori</h2><a class="link-button" href="#ranking">VEDI LEGA</a></div><div class="league-body"><span class="league-medal">${icon('trophy')}</span><div><strong>Il tuo viaggio è iniziato.</strong><p>Ogni lezione aggiunge XP alla classifica.</p><span class="badge">CLASSIFICA DIMOSTRATIVA</span></div></div></section><section class="panel"><div class="panel-heading"><h2>Missioni giornaliere</h2><a class="link-button" href="#quests">VEDI TUTTE</a></div>${questHTML()}</section><section class="panel"><div class="panel-heading"><h2>La tua settimana</h2><span class="badge">${currentStreak(state)} ${currentStreak(state) === 1 ? 'GIORNO' : 'GIORNI'}</span></div><div class="weekly">${weeklyHTML()}</div><p class="week-note">Un piccolo passo al giorno.<br>Ogni settimana fa strada.</p></section><div class="side-footer"><b>luma</b> · IMPARA CON CURIOSITÀ<br>PERCORSO INDIPENDENTE · INGLESE GENERALE</div>`
  if (!storageAvailable)
    document.querySelector('.sidebar-bottom').textContent =
      'Salvataggio browser non disponibile'
}
function header(kicker, title, desc) {
  return `<p class="eyebrow">${kicker}</p><h1 class="page-heading">${title}</h1><p class="intro">${desc}</p>`
}
function activityNode(
  chapter,
  type,
  title,
  label,
  available,
  done,
  extra = {},
) {
  const symbol = done
      ? 'check'
      : available
        ? extra.icon ||
          {
            story: 'chat',
            chest: 'chest',
            radio: 'sound',
            practice: 'practice',
            legendary: 'trophy',
          }[type]
        : 'lock',
    id = `${type}:${chapter}`
  return `<div class="path-step"><button class="node activity-node ${done ? 'done' : available ? 'current' : ''} ${type}-node" data-activity="${type}" data-chapter-index="${chapter}" ${!available && !done ? 'disabled' : ''} aria-label="${done ? 'Completata' : available ? 'Inizia' : 'Bloccata'}: ${title}" title="${title}">${icon(symbol)}${type === 'chest' && available && !done ? '<span class="node-sparkle">✦</span>' : ''}</button><span class="node-label ${available && !done ? 'current-label' : ''}">${escape(label)}</span></div>`
}
function renderLearn() {
  const next = nextLesson(state),
    chapter =
      chapterShown ?? (next < 0 ? chapters.length - 1 : lessons[next].chapter),
    c = chapters[chapter],
    offset = chapter * 4,
    doneCount = c.lessons.filter((_, i) =>
      state.completed.includes(offset + i),
    ).length,
    extraDone = (id) => state.extras.includes(id),
    lesson = (i, title) => {
      const id = offset + i,
        l = lessons[id],
        done = state.completed.includes(id),
        active = id === next || done
      return `<div class="path-step"><button class="node ${done ? 'done' : active ? 'current' : ''}" data-lesson="${id}" ${!active ? 'disabled' : ''} aria-label="${done ? 'Ripassa' : active ? 'Inizia' : 'Bloccata'}: ${l.title}" title="${l.title}">${icon(done ? 'check' : active ? l.icon : 'lock')}</button><span class="node-label ${active && !done ? 'current-label' : ''}">${escape(title || l.title)}</span></div>`
    }
  const selectedLocked = chapter > 0 && lessons[next]?.chapter < chapter
  const nodes = [
    lesson(0),
    activityNode(
      chapter,
      'story',
      'Una piccola storia',
      'Storia',
      doneCount >= 1,
      extraDone(`story:${chapter}`),
    ),
    lesson(1),
    activityNode(
      chapter,
      'chest',
      'Il tuo forziere',
      'Forziere',
      doneCount === 4 && !state.claimedChests.includes(chapter),
      state.claimedChests.includes(chapter),
    ),
    activityNode(
      chapter,
      'radio',
      'Ascolta la conversazione',
      'Radio',
      doneCount >= 2,
      extraDone(`radio:${chapter}`),
    ),
    lesson(2),
    activityNode(
      chapter,
      'practice',
      'Ripassa questo capitolo',
      'Ripasso',
      doneCount >= 1,
      false,
    ),
    lesson(3),
    activityNode(
      chapter,
      'legendary',
      'Prova la sfida leggendaria',
      'Leggendaria',
      doneCount === 4,
      extraDone(`legendary:${chapter}`),
    ),
  ].join('')
  content.innerHTML =
    header(
      'IL TUO PERCORSO · INGLESE A1',
      'Un passo alla volta.',
      'Impara, esercitati e scopri nuove tappe.',
    ) +
    `<section class="chapter-banner"><div><small>SEZIONE 1 · CAPITOLO ${chapter + 1} DI ${chapters.length}</small><h2>${escape(c.title)}</h2></div><button class="guide-button" data-action="guide">${icon('book')} GUIDA</button></section>${selectedLocked ? '<div class="locked-note">Completa le tappe precedenti per continuare in questo capitolo.</div>' : ''}<div class="section-divider">${escape(c.tag)} · ${doneCount} DI 4 LEZIONI</div><div class="learning-path"><svg class="path-line" viewBox="0 0 480 900" preserveAspectRatio="none" aria-hidden="true"><path d="M240 32C240 90 125 110 165 178S350 226 300 304 195 360 240 430 355 498 300 575 180 632 240 705 340 776 240 850"/></svg>${nodes}<span class="mascot-note">Il gufo tifa per te!</span><img class="path-mascot" src="mascot.svg" alt="La mascotte Luma ti incoraggia"><div class="path-footer">${escape(c.subtitle)}</div></div><div class="chapter-next"><div><small>${chapter < chapters.length - 1 ? 'IL PROSSIMO CAPITOLO' : 'FINE DELLA SEZIONE'}</small><h3>${chapter < chapters.length - 1 ? escape(chapters[chapter + 1].title) : 'Complimenti, hai completato il corso!'}</h3></div>${icon(chapter < chapters.length - 1 ? 'lock' : 'trophy')}</div><div class="lesson-list"><h2 style="font-size:16px">La sezione A1</h2>${chapters
      .map((ch, i) => {
        const unlocked =
          i === 0 ||
          chapters[i - 1].lessons.every((_, j) =>
            state.completed.includes((i - 1) * 4 + j),
          )
        return `<button class="lesson-row" data-chapter="${i}" ${!unlocked ? 'disabled' : ''}>${icon(i === chapter ? 'book' : unlocked ? 'map' : 'lock')}<span><strong>Capitolo ${i + 1} · ${escape(ch.title)}</strong><small>${ch.lessons.filter((_, j) => state.completed.includes(i * 4 + j)).length} di 4 lezioni completate</small></span><span class="arrow">${icon('arrow')}</span></button>`
      })
      .join('')}</div>`
}
function renderPractice() {
  content.innerHTML =
    header(
      'RITROVA QUELLO CHE SAI',
      'L’inglese si allena.',
      'Ripeti le lezioni e trasforma le parole in abitudini.',
    ) +
    `<div class="content-card"><h2>Un ripasso senza fretta</h2><p>Puoi esercitarti anche prima di iniziare il percorso. Ogni ripasso ti dà XP e contribuisce alle missioni del giorno.</p><button class="primary" data-action="practice">INIZIA IL RIPASSO</button></div><h2 style="font-size:17px">Le tue lezioni completate</h2><div class="lesson-list">${state.completed.length ? state.completed.map((i) => `<button class="lesson-row" data-lesson="${i}">${icon(lessons[i].icon)}<span><strong>${lessons[i].title}</strong><small>${lessons[i].description}</small></span><span class="arrow">${icon('arrow')}</span></button>`).join('') : '<p class="muted">Le lezioni completate appariranno qui. La prima ti aspetta nel percorso!</p>'}</div>`
}
const soundWords = [
  ['Hello', 'Ciao', '/həˈləʊ/'],
  ['Thank you', 'Grazie', '/ˈθæŋk juː/'],
  ['Please', 'Per favore', '/pliːz/'],
  ['Welcome', 'Benvenuto', '/ˈwelkəm/'],
  ['Water', 'Acqua', '/ˈwɔːtə/'],
  ['Family', 'Famiglia', '/ˈfæməli/'],
  ['Tomorrow', 'Domani', '/təˈmɒrəʊ/'],
  ['Journey', 'Viaggio', '/ˈdʒɜːni/'],
]
const storyOptions = [
  {
    context: 'Mia: «Hi! Is this seat free?» · Alex: «Of course!»',
    prompt: 'Cosa dice Mia?',
    options: ['Questo posto è libero?', 'Dov’è il parco?', 'Vuoi un caffè?'],
    answer: 'Questo posto è libero?',
    note: 'Is this seat free? è una domanda cortese.',
  },
  {
    context: 'Alex: «Here you are.» · Mia: «Thank you!»',
    prompt: 'Come risponde Mia?',
    options: ['Grazie!', 'Mi dispiace!', 'A domani!'],
    answer: 'Grazie!',
    note: 'Thank you è un modo semplice e gentile per ringraziare.',
  },
  {
    context: 'Alex: «You are welcome.» · Mia: «Would you like a coffee?»',
    prompt: 'Cosa offre Mia?',
    options: ['Un caffè', 'Un biglietto', 'Una mappa'],
    answer: 'Un caffè',
    note: 'Would you like…? significa Vorresti…?',
  },
]
const radioPhrases = [
  ['Would you like some water?', 'Vorresti dell’acqua?'],
  ['I am happy to help.', 'Sono felice di aiutarti.'],
  ['The train arrives at nine.', 'Il treno arriva alle nove.'],
  ['It was a wonderful day.', 'È stata una giornata meravigliosa.'],
  ['Where can I find the station?', 'Dove posso trovare la stazione?'],
  ['Thank you for waiting.', 'Grazie per aver aspettato.'],
]
function renderSounds() {
  content.innerHTML =
    header(
      'DAI VOCE ALLE PAROLE',
      'Ascolta. Ripeti. Sorridi.',
      'Tocca una parola e familiarizza con i suoni dell’inglese.',
    ) +
    `<p class="muted">Audio con la sintesi vocale del browser. Voci e pronuncia dipendono dal dispositivo.</p><div class="sound-grid">${soundWords.map(([word, it, ipa], i) => `<button class="sound-card" data-sound="${i}" aria-label="Ascolta ${word}">${icon('sound')}<b>${word}</b><span>${ipa}<br>${it}</span></button>`).join('')}</div>`
}
function renderQuests() {
  content.innerHTML =
    header(
      'MISSIONI · AGGIORNATE OGNI GIORNO',
      'Un obiettivo alla volta.',
      'Completa le missioni e riscatta le gemme prima del cambio di giornata.',
    ) +
    `<section class="content-card large-quests"><div class="panel-heading"><h2>Missioni di oggi</h2><span class="badge">${new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></div>${questHTML()}</section><section class="content-card"><div class="panel-heading"><h2>La tua settimana</h2><span class="badge">${currentStreak(state)} ${currentStreak(state) === 1 ? 'GIORNO' : 'GIORNI'} CONSECUTIVI</span></div><div class="weekly">${weeklyHTML()}</div><p>Una lezione al giorno costruisce una serie. Il ripasso aiuta la memoria e conta per restare attivi.</p></section>`
}
function renderRanking() {
  const people = [
    { name: 'Tu', xp: state.xp, me: true },
    { name: 'Sofia', xp: Math.max(350, state.xp + 48) },
    { name: 'Marco', xp: Math.max(290, state.xp + 27) },
    { name: 'Alex', xp: Math.max(210, state.xp + 11) },
    { name: 'Emma', xp: Math.max(90, state.xp - 12) },
  ].sort((a, b) => b.xp - a.xp)
  content.innerHTML =
    header(
      'LEGA · AGGIORNAMENTO SETTIMANALE',
      'Impara insieme agli altri.',
      'Una classifica dimostrativa: gli altri partecipanti sono esempi locali.',
    ) +
    `<section class="content-card"><div class="panel-heading"><h2>Lega Esploratori</h2><span class="badge">ESEMPI LOCALI</span></div><p>Il tuo totale è ${state.xp} XP. La classifica reale richiede account e un servizio online.</p><div class="podium">${people
      .slice(0, 3)
      .map(
        (p, i) =>
          `<div class="podium-person ${p.me ? 'me' : ''}"><span class="avatar">${escape(p.name[0])}</span><b>${escape(p.name)}</b><small>${p.xp} XP</small><span class="podium-block rank-${i + 1}">${i + 1}</span></div>`,
      )
      .join(
        '',
      )}</div>${people.map((p, i) => `<div class="rank-row ${p.me ? 'me' : ''}"><span>${i + 1}</span><span class="avatar">${escape(p.name[0])}</span><strong>${escape(p.name)}${p.me ? ' · Tu' : ''}</strong><b>${p.xp} XP</b></div>`).join('')}</section>`
}
function renderProfile() {
  content.innerHTML =
    header(
      'PROFILO · I TUOI PROGRESSI',
      'Il tuo percorso personale.',
      'Il tuo percorso personale, sincronizzato con il tuo account.',
    ) +
    `<div class="score-grid"><div class="score-box"><strong>${state.xp}</strong><span>XP guadagnati</span></div><div class="score-box"><strong>${state.completed.length} / ${lessons.length}</strong><span>Lezioni completate</span></div><div class="score-box"><strong>${currentStreak(state)}</strong><span>Giorni di serie</span></div><div class="score-box"><strong>${state.gems}</strong><span>Gemme raccolte</span></div></div><section class="content-card"><h2>${escape(player?.display_name || 'Il tuo profilo')}</h2><p>ACCOUNT APPROVATO · progressi sincronizzati</p><button class="auth-switch" data-action="logout">ESCI DALL’ACCOUNT</button></section><section class="content-card"><h2>Attività settimanale</h2><div class="weekly">${weeklyHTML()}</div></section><section class="content-card"><div class="panel-heading"><h2>Esporta i progressi</h2><span class="badge">COPIA DI SICUREZZA</span></div><p>Scarica una copia JSON di lezioni, missioni e serie.</p><button class="primary" data-action="export">ESPORTA I PROGRESSI</button></section><section class="content-card"><h2>Le ultime attività</h2>${
      state.history.length
        ? state.history
            .slice(-8)
            .reverse()
            .map(
              (h) =>
                `<p>${escape(h.date)} · ${escape(h.lesson == null ? { review: 'Ripasso', story: 'Storia', radio: 'Radio', legendary: 'Sfida leggendaria', chest: 'Forziere' }[h.kind] || 'Percorso' : lessons[h.lesson]?.title || 'Lezione')} · +${h.xp} XP${Number.isFinite(h.accuracy) ? ` · ${h.accuracy}%` : ''}</p>`,
            )
            .join('')
        : '<p>Il tuo viaggio comincia con la prima lezione.</p>'
    }</section>`
}
function renderChallenge() {
  const complete = state.challengeDays.length
  const nextDay = complete + 1
  const waiting = state.challengeLastDate === dayKey()
  const active = challengeDays[nextDay - 1]
  content.innerHTML =
    header(
      'PERCORSO INTENSIVO · 8 GIORNI',
      'Piccoli passi, ogni giorno.',
      'Una sfida quotidiana per mettere in pratica frasi utili con ascolto, ripetizione e una breve lezione guidata.',
    ) +
    `<section class="content-card challenge-overview"><div class="panel-heading"><h2>La tua 8 Days Challenge</h2><span class="badge">${complete} / 8 COMPLETATI</span></div><div class="progress-track" role="progressbar" aria-label="Avanzamento 8 Days Challenge" aria-valuenow="${complete}" aria-valuemin="0" aria-valuemax="8"><div class="progress-fill" style="width:${(complete / 8) * 100}%"></div></div><p>Ogni tappa propone cinque frasi originali: ascolta l’italiano, prova a tradurre durante la pausa, ascolta l’inglese e ripeti. Poi verifica quello che hai imparato con quattro esercizi sulle stesse frasi. Completa un giorno alla volta.</p></section>${active ? `<section class="content-card challenge-current"><span class="eyebrow">${waiting ? 'PROSSIMA TAPPA · DOMANI' : `GIORNO ${nextDay} · LA TAPPA DI OGGI`}</span><h2>${escape(active.title)}</h2><p>${escape(active.goal)}</p>${waiting ? '<p>La prossima lezione si apre domani. Puoi ripassare le frasi dei giorni completati qui sotto.</p>' : tutorCard(active)}<div class="challenge-actions"><button class="primary" data-action="challenge-start" data-day="${nextDay}" ${waiting || (state.challengePractice[nextDay] || []).length !== active.phrases.length ? 'disabled' : ''}>${waiting ? 'TORNA DOMANI' : (state.challengePractice[nextDay] || []).length === active.phrases.length ? 'INIZIA LA LEZIONE' : 'COMPLETA PRIMA LE FRASI'}</button><button class="auth-switch" data-action="challenge-print" data-day="${nextDay}">STAMPA LA SCHEDA</button></div></section>` : `<section class="content-card challenge-current"><span class="eyebrow">TRAGUARDO RAGGIUNTO</span><h2>Hai completato gli otto giorni!</h2><p>Ripassa dal percorso o continua con le altre lezioni di inglese generale.</p></section>`}<section class="challenge-grid" aria-label="Le otto tappe">${challengeDays
      .map((day) => {
        const done = state.challengeDays.includes(day.day)
        const reviewCount = state.challengeReview[day.day]?.length || 0
        const isNext = day.day === nextDay
        return `<article class="content-card challenge-day ${done ? 'completed' : isNext && !waiting ? 'available' : ''}"><span class="challenge-day-number">${done ? '✓' : String(day.day).padStart(2, '0')}</span><div><small>GIORNO ${day.day}</small><h3>${escape(day.title)}</h3><p>${escape(day.goal)}</p></div><span class="badge">${done ? 'COMPLETATO' : isNext ? (waiting ? 'DOMANI' : 'OGGI') : 'BLOCCATO'}</span>${done ? `<button class="auth-switch" data-action="tutor-review" data-day="${day.day}">${reviewCount ? `RIPASSO MIRATO · ${reviewCount}` : 'RIPASSA TUTTE LE FRASI'}</button>` : ''}</article>`
      })
      .join(
        '',
      )}</section><section class="content-card challenge-note"><h2>Materiali e sessioni</h2><p>Luma offre esercizi originali, ascolto tramite sintesi vocale e una scheda giornaliera stampabile. Video-corsi, PDF originali, lezioni live e supporto di tutor di Learnworlds non fanno parte di questa app.</p></section>${googlePracticeCard()}<section class="challenge-print-sheet" id="challenge-print-sheet"><p class="eyebrow">LUMA · SCHEDA GIORNALIERA</p><h1 id="challenge-print-title"></h1><p id="challenge-print-goal"></p><h2 id="challenge-print-phrase"></h2><p id="challenge-print-meaning"></p><p>Ascolta la frase, ripetila ad alta voce e completa la lezione del giorno.</p></section>`
}
function googlePracticeCard() {
  return `<section class="content-card google-practice"><h2>Google Traduttore e Fai pratica</h2><p>Usa il traduttore come supporto alle frasi del giorno. Si apre una pagina Google separata quando premi il pulsante.</p><form action="https://translate.google.com/" method="get" target="_blank" rel="noopener noreferrer"><input type="hidden" name="sl" value="auto"><input type="hidden" name="op" value="translate"><label for="google-translation-text">Frase da tradurre</label><textarea id="google-translation-text" name="text" maxlength="500" required placeholder="Scrivi una frase da approfondire…"></textarea><label for="google-translation-language">Traduci in</label><select id="google-translation-language" name="tl"><option value="en">Inglese</option><option value="it">Italiano</option></select><button class="secondary" type="submit">TRADUCI CON GOOGLE</button></form><h3>Conversazione e ascolto con Fai pratica (Beta)</h3><p>Nell’app Google Traduttore sul telefono: apri <strong>Fai pratica</strong>, scegli italiano per le istruzioni, inglese da imparare, il tuo livello e uno scenario legato alla lezione di oggi. La disponibilità dipende dall’app, dall’account e dalla regione.</p><a class="auth-switch" href="https://support.google.com/translate/answer/16475590?hl=it" target="_blank" rel="noopener noreferrer">ISTRUZIONI UFFICIALI DI GOOGLE</a><p class="muted">Questa funzione appartiene a Google e si usa nella sua app. I suoi risultati e progressi non vengono sincronizzati con Luma; Luma non invia il profilo o i progressi a Google.</p></section>`
}
function renderTranslator() {
  content.innerHTML =
    header(
      'STRUMENTI DI SUPPORTO',
      'Approfondisci una frase.',
      'Traduzione e pratica aggiuntiva per accompagnare il tuo percorso Luma.',
    ) + googlePracticeCard()
}
function renderShop() {
  content.innerHTML =
    header(
      'NEGOZIO · RICOMPENSE DI PERCORSO',
      'Usa le gemme che hai guadagnato.',
      'Ricompense dimostrative, senza acquisti o pagamenti reali.',
    ) +
    `<section class="content-card store-balance"><span class="store-gem">${icon('gem')}</span><div><small>IL TUO SALDO</small><strong>${state.gems} gemme</strong></div></section><div class="store-grid"><article class="store-item"><span class="store-art">${icon('fire')}</span><span class="badge">SERIE GIORNALIERA</span><h2>Salva serie</h2><p>Una protezione dimostrativa per un giorno di serie.</p><small>Possedute: ${state.streakSavers}</small><button class="primary" data-action="buy-streak" ${state.gems < 100 ? 'disabled' : ''}>ACQUISTA · 100 GEMME</button></article><article class="store-item"><span class="store-art">${icon('heart')}</span><span class="badge">PERSONALIZZAZIONE</span><h2>La volpe Luma</h2><p>La tua mascotte originale ti accompagna nel percorso.</p><small>Già disponibile nel tuo corso</small><button class="primary" data-action="cosmetic">SELEZIONATA ✓</button></article></div>`
}
function renderChess() {
  content.innerHTML =
    header(
      'PAUSA DI LOGICA',
      'La prossima mossa è tua.',
      'Una piccola sfida dimostrativa ispirata agli scacchi.',
    ) +
    `<section class="content-card chess-puzzle"><span class="badge">SFIDA LOCALE</span><h2>Proteggi il re</h2><p>Sei il bianco. Quale pezzo sposti per dare scacco matto in una mossa?</p><div class="chess-board" role="grid" aria-label="Scacchiera dimostrativa">${['♜', '·', '·', '♚', '·', '♟', '·', '·', '·', '♔', '·', '♕', '·', '·', '♙', '·'].map((square, i) => `<button data-square="${i}" class="square ${Math.floor(i / 4) % 2 === Math.floor((i % 4) / 2) ? 'light' : ''}" aria-label="Casella ${i + 1}${square !== '·' ? `, ${square}` : ''}">${square}</button>`).join('')}</div><div class="feedback" id="chess-feedback" aria-live="polite">Seleziona la regina bianca sulla scacchiera.</div></section>`
}
let adminOffset = 0
let adminRequest = 0
async function renderAdmin() {
  if (player?.role !== 'admin') {
    content.innerHTML = header(
      'ACCESSO RISERVATO',
      'Amministrazione',
      'Questa pagina è riservata all’amministratore.',
    )
    return
  }
  const request = ++adminRequest
  const intro = header(
    'GESTIONE GIOCATORI',
    'Amministrazione',
    'Approva le nuove richieste e gestisci gli accessi a Luma.',
  )
  content.innerHTML =
    intro +
    '<section class="content-card" role="status">Caricamento richieste…</section>'
  try {
    const result = await listPlayers(adminOffset)
    if (
      view !== 'admin' ||
      request !== adminRequest ||
      player?.role !== 'admin'
    )
      return
    const labels = {
      pending: 'In attesa',
      approved: 'Approvato',
      rejected: 'Rifiutato',
    }
    content.innerHTML =
      intro +
      `<section class="content-card"><div class="panel-heading"><h2>${result.total} giocatori registrati</h2><button class="auth-switch" data-action="admin-refresh">AGGIORNA</button></div><div class="admin-players">${result.players.map((item) => `<article class="admin-player"><div><h3>${escape(item.display_name)}</h3><p>${escape(item.email)}</p><span class="badge">${labels[item.approval_status] || 'In attesa'}</span></div><div class="admin-actions">${item.approval_status !== 'approved' ? `<button class="primary" data-review-id="${escape(item.id)}" data-review-status="approved">APPROVA</button>` : ''}${item.approval_status !== 'rejected' ? `<button class="secondary" data-review-id="${escape(item.id)}" data-review-status="rejected">${item.approval_status === 'approved' ? 'REVOCA ACCESSO' : 'RIFIUTA'}</button>` : ''}</div></article>`).join('') || '<p>Nessuna richiesta da mostrare.</p>'}</div><div class="admin-pagination"><button class="auth-switch" data-admin-page="${Math.max(0, adminOffset - 100)}" ${adminOffset === 0 ? 'disabled' : ''}>PRECEDENTI</button><button class="auth-switch" data-admin-page="${adminOffset + 100}" ${adminOffset + 100 >= result.total ? 'disabled' : ''}>SUCCESSIVI</button></div></section>`
  } catch (error) {
    if (view === 'admin')
      content.innerHTML =
        intro +
        `<section class="content-card" role="alert">${escape(error.message)}<button class="auth-switch" data-action="admin-refresh">RIPROVA</button></section>`
  }
}
function render() {
  if (player?.approval_status !== 'approved') return
  refreshDay()
  renderShell()
  ;(
    ({
      learn: renderLearn,
      challenge: renderChallenge,
      practice: renderPractice,
      translate: renderTranslator,
      sounds: renderSounds,
      quests: renderQuests,
      ranking: renderRanking,
      profile: renderProfile,
      admin: renderAdmin,
      shop: renderShop,
      chess: renderChess,
    })[view] || renderLearn
  )()
}
function navigate() {
  tutor.stop()
  view = Object.hasOwn(destinations, location.hash.slice(1))
    ? location.hash.slice(1)
    : location.hash === '#chess'
      ? 'chess'
      : 'learn'
  render()
}
window.addEventListener('hashchange', () => {
  navigate()
  content.focus()
  window.scrollTo(0, 0)
})
function info(title, body) {
  infoDialog.innerHTML = `<button class="close-button" data-action="close-info" aria-label="Chiudi">×</button><h2 id="info-title">${title}</h2>${body}`
  infoDialog.showModal()
}
function speak(text) {
  tutor.stop()
  if (!('speechSynthesis' in window)) {
    notify('Sintesi vocale non disponibile in questo browser.')
    return false
  }
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  u.rate = 0.85
  const voice =
    speechSynthesis.getVoices().find((v) => v.lang === 'en-GB') ||
    speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'))
  if (voice) u.voice = voice
  u.onerror = (e) => {
    if (!['canceled', 'interrupted'].includes(e.error))
      notify(
        'Audio non disponibile sul dispositivo. Puoi usare la trascrizione.',
      )
  }
  speechSynthesis.speak(u)
  return true
}
function startLesson(id, practice = false, config = {}) {
  tutor.stop()
  const unlocked =
    state.completed.includes(id) || id === nextLesson(state) || practice
  if (!unlocked) return
  session = {
    id,
    practice,
    index: 0,
    answer: null,
    selected: [],
    checked: false,
    correct: 0,
    missedPhrases: [],
    listening: 0,
    finished: false,
    questions: [...(config.questions || lessons[id].questions)],
    title: config.title || lessons[id].title,
    chapter: config.chapter ?? lessons[id].chapter,
    extraId: config.extraId || null,
    extraXp: config.xp,
    extraGems: config.gems,
    challengeDay: config.challengeDay || null,
  }
  renderExercise()
  lessonDialog.showModal()
}
function startActivity(type, chapter) {
  const base = chapter * 4
  if (type === 'chest') {
    try {
      const r = claimChest(state, chapter)
      state = r.state
      save()
      render()
      info(
        'Il forziere è aperto!',
        `<div class="reward-open">${icon('gem')}<strong>+${r.gems} gemme</strong><p>Hai completato tutte le lezioni del capitolo. Le gemme sono già nel tuo saldo.</p><button class="primary" data-action="close-info">CONTINUA</button></div>`,
      )
    } catch (e) {
      notify(e.message)
    }
    return
  }
  if (type === 'practice') {
    const id =
      state.completed.findLast((id) => lessons[id]?.chapter === chapter) ??
      state.completed.at(-1)
    if (id === undefined) {
      notify('Completa prima una lezione: il ripasso ti aspetta qui.')
      return
    }
    startLesson(id, true, {
      title: `Ripasso · ${chapters[chapter].title}`,
      chapter,
    })
    return
  }
  if (type === 'story') {
    const finished = state.extras.includes(`story:${chapter}`)
    startLesson(base, true, {
      title: `Storia · ${chapters[chapter].title}`,
      chapter,
      questions: storyOptions,
      extraId: finished ? null : `story:${chapter}`,
      xp: 14,
      gems: 2,
    })
    return
  }
  if (type === 'radio') {
    const qs = radioPhrases
        .slice(chapter * 2, chapter * 2 + 4)
        .map(([phrase, answer]) => ({
          type: 'listen',
          phrase,
          prompt: 'Ascolta la frase e scegli il significato',
          options: [
            answer,
            phrase.includes('water')
              ? 'L’acqua è fredda.'
              : phrase.includes('train')
                ? 'Il treno arriva alle dieci.'
                : 'Ci vediamo domani.',
            phrase.includes('happy') ? 'Sono triste.' : 'Grazie mille.',
          ],
          answer,
          note: 'Prova ad ascoltare ancora, poi ripeti la frase ad alta voce.',
        })),
      finished = state.extras.includes(`radio:${chapter}`)
    startLesson(base, true, {
      title: `Radio · ${chapters[chapter].title}`,
      chapter,
      questions: qs,
      extraId: finished ? null : `radio:${chapter}`,
      xp: 16,
      gems: 1,
    })
    return
  }
  if (type === 'legendary') {
    const qs = chapters[chapter].lessons
        .flatMap((l) => l.questions)
        .filter((q) => q.type === 'choice')
        .slice(-4),
      finished = state.extras.includes(`legendary:${chapter}`)
    startLesson(base, true, {
      title: `Sfida leggendaria · ${chapters[chapter].title}`,
      chapter,
      questions: qs,
      extraId: finished ? null : `legendary:${chapter}`,
      xp: 30,
      gems: 20,
    })
  }
}
function renderExercise() {
  const q = session.questions[session.index],
    n = session.questions.length,
    label = session.title
  lessonDialog.innerHTML = `<div class="lesson-layout"><div class="lesson-top"><button class="close-button" data-action="exit-lesson" aria-label="Esci dalla lezione">×</button><div class="progress-track" role="progressbar" aria-label="Avanzamento lezione" aria-valuenow="${session.index}" aria-valuemin="0" aria-valuemax="${n}"><div class="progress-fill" style="width:${(session.index / n) * 100}%"></div></div><small>${session.index + 1} / ${n}</small></div><section class="exercise"><p class="eyebrow">${escape(label)} · ${q.type === 'words' ? 'COSTRUISCI LA FRASE' : q.type === 'listen' ? 'ALLENA L’ASCOLTO' : session.extraId?.startsWith('story:') ? 'UNA STORIA IN TRE MOMENTI' : 'SCEGLI LA RISPOSTA'}</p><h2>${q.type === 'words' ? 'Traduci questa frase' : escape(q.prompt)}</h2>${q.context ? `<div class="story-context">${escape(q.context)}</div>` : ''}${q.type === 'words' ? `<div class="prompt-box">${escape(q.prompt)}</div><div class="answer-line" aria-label="La tua risposta" aria-live="polite"></div><div class="word-bank">${q.bank.map((w, i) => `<button class="word" data-word="${i}">${escape(w)}</button>`).join('')}</div>` : q.type === 'listen' ? `<button class="listen-button" data-action="listen" aria-label="Ascolta la frase">${icon('sound')}</button><div class="transcript-toggle"><button class="link-button" data-action="transcript">MOSTRA TRASCRIZIONE</button><p id="transcript" class="muted" hidden>${escape(q.phrase)}</p></div><div class="options">${q.options.map(optionHTML).join('')}</div>` : `<div class="options">${q.options.map(optionHTML).join('')}</div>`}</section><footer class="lesson-bottom"><div class="feedback" aria-live="polite"></div><button class="primary" data-action="check" disabled>VERIFICA</button></footer></div>`
}
function optionHTML(o, i) {
  return `<button class="option" data-option="${i}" aria-pressed="false"><span class="key">${i + 1}</span>${escape(o)}</button>`
}
function updateWords() {
  const q = session.questions[session.index]
  lessonDialog.querySelector('.answer-line').innerHTML = session.selected
    .map(
      (i) =>
        `<button class="word" data-remove-word="${i}" aria-label="Rimuovi ${escape(q.bank[i])}">${escape(q.bank[i])}</button>`,
    )
    .join('')
  lessonDialog
    .querySelectorAll('[data-word]')
    .forEach(
      (b) => (b.disabled = session.selected.includes(Number(b.dataset.word))),
    )
  lessonDialog.querySelector('[data-action="check"]').disabled =
    !session.selected.length
  session.answer = session.selected.map((i) => q.bank[i])
}
function check() {
  if (!session || session.checked || session.answer === null) return
  const q = session.questions[session.index],
    correct = isCorrect(q, session.answer)
  session.checked = true
  if (correct) {
    session.correct++
    if (q.type === 'listen') session.listening++
  }
  if (!correct && session.challengeDay && Number.isInteger(q.phraseIndex))
    session.missedPhrases.push(q.phraseIndex)
  if (!correct && session.challengeDay && !q.retry) {
    session.questions.push({
      ...q,
      retry: true,
      prompt: `Ripasso mirato · ${q.prompt}`,
    })
  }
  const fb = lessonDialog.querySelector('.feedback')
  fb.classList.toggle('error', !correct)
  fb.innerHTML = `<strong>${correct ? 'Esatto, ben fatto!' : 'Ci siamo quasi!'}</strong>${correct ? '' : `Risposta: ${escape(Array.isArray(q.answer) ? q.answer.join(' ') : q.answer)}<br>`}<small>${escape(q.note)}</small>`
  lessonDialog
    .querySelectorAll('[data-option],[data-word],[data-remove-word]')
    .forEach((b) => (b.disabled = true))
  lessonDialog.querySelectorAll('[data-option]').forEach((b) => {
    const answer = q.options[Number(b.dataset.option)]
    b.classList.toggle('correct', isCorrect(q, answer))
    if (b.classList.contains('selected') && !correct) b.classList.add('wrong')
  })
  const btn = lessonDialog.querySelector('[data-action="check"]')
  btn.dataset.action = 'next'
  btn.textContent =
    session.index === session.questions.length - 1
      ? 'VEDI RISULTATO'
      : 'CONTINUA'
  btn.focus()
}
function next() {
  if (!session?.checked) return
  session.index++
  if (session.index === session.questions.length) {
    finish()
    return
  }
  session.answer = null
  session.selected = []
  session.checked = false
  renderExercise()
  lessonDialog.querySelector('.exercise').scrollTop = 0
  lessonDialog.querySelector('.close-button').focus()
}
function finish() {
  if (session.finished) return
  session.finished = true
  const total = session.questions.length,
    accuracy = Math.round((session.correct / total) * 100)
  let result
  if (session.challengeDay) {
    result = completeChallengeDay(state, session.challengeDay, {
      correct: session.correct,
      total,
      listening: session.listening,
      missedPhrases: session.missedPhrases,
    })
  } else if (session.extraId) {
    result = completeExtra(state, session.extraId, {
      xp: session.extraXp,
      gems: session.extraGems,
      listening: session.listening,
      lessons:
        session.extraId.startsWith('story:') ||
        session.extraId.startsWith('legendary:')
          ? 1
          : 0,
    })
    result.accuracy = accuracy
  } else
    result = completeLesson(state, session.id, {
      correct: session.correct,
      total,
      listening: session.listening,
      practice: session.practice,
    })
  state = result.state
  save()
  render()
  const chestReward = session.extraId?.startsWith('legendary:')
    ? 20
    : result.gems || 0
  lessonDialog.innerHTML = `<div class="lesson-layout"><section class="summary"><img src="mascot.svg" alt="La mascotte Luma festeggia con te"><p class="eyebrow">IL TUO PROSSIMO PASSO</p><h2>${session.extraId?.startsWith('story:') ? 'Storia completata!' : session.extraId?.startsWith('radio:') ? 'Radio completata!' : session.extraId?.startsWith('legendary:') ? 'Sfida leggendaria!' : 'Lezione completata!'}</h2><p>${accuracy === 100 ? 'Perfetto! Hai ascoltato con attenzione e scelto ogni risposta correttamente.' : 'Ogni tentativo aiuta la memoria. Puoi ripetere questa tappa dal percorso.'}</p><div class="summary-stats"><div><small>XP GUADAGNATI</small><strong>+${result.xp}</strong></div><div><small>PRECISIONE</small><strong>${accuracy}%</strong></div><div><small>GEMME</small><strong>+${chestReward}</strong></div></div></section><footer class="lesson-bottom"><button class="primary" data-action="finish">TORNA AL PERCORSO</button></footer></div>`
  if (session.challengeDay)
    lessonDialog.querySelector('.summary h2').textContent =
      `Giorno ${session.challengeDay} completato!`
  lessonDialog.querySelector('.primary').focus()
}
function closeLesson() {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  lessonDialog.close()
  session = null
}
document.addEventListener('click', async (event) => {
  const b = event.target.closest('button')
  if (!b) return
  if (b.dataset.reviewId !== undefined) {
    if (player?.role !== 'admin') return
    const approve = b.dataset.reviewStatus === 'approved'
    if (
      !confirm(
        approve
          ? 'Approvare questo giocatore?'
          : 'Rifiutare o revocare l’accesso a questo giocatore?',
      )
    )
      return
    b.disabled = true
    try {
      await setPlayerApproval(b.dataset.reviewId, b.dataset.reviewStatus)
      await renderAdmin()
      notify(approve ? 'Giocatore approvato.' : 'Accesso revocato.')
    } catch (error) {
      b.disabled = false
      notify(error.message)
    }
    return
  }
  if (b.dataset.adminPage !== undefined) {
    adminOffset = Number(b.dataset.adminPage)
    await renderAdmin()
    return
  }
  if (b.dataset.action === 'admin-refresh') {
    await renderAdmin()
    return
  }
  if (b.dataset.chapter !== undefined) {
    const selected = Number(b.dataset.chapter),
      furthest =
        nextLesson(state) < 0
          ? chapters.length - 1
          : lessons[nextLesson(state)].chapter
    if (selected > furthest) {
      notify(
        'Completa prima il capitolo corrente per sbloccare questo percorso.',
      )
      return
    }
    chapterShown = selected
    renderLearn()
    window.scrollTo(0, 0)
    return
  }
  if (b.dataset.lesson !== undefined) {
    startLesson(Number(b.dataset.lesson))
    return
  }
  if (b.dataset.activity !== undefined) {
    startActivity(b.dataset.activity, Number(b.dataset.chapterIndex))
    return
  }
  if (b.dataset.claim !== undefined) {
    const mission = quests().find((q) => q.id === b.dataset.claim)
    if (!mission || mission.value < mission.total) return
    if (!state.daily.claimed.includes(mission.id)) {
      state.daily.claimed.push(mission.id)
      state.gems += mission.gems
      save()
      render()
      notify(`Missione completata: +${mission.gems} gemme.`)
    }
    return
  }
  if (b.dataset.sound !== undefined) {
    speak(soundWords[Number(b.dataset.sound)][0])
    return
  }
  if (b.dataset.square !== undefined) {
    const fb = document.querySelector('#chess-feedback')
    if (!fb) return
    fb.textContent =
      Number(b.dataset.square) === 11
        ? 'Scacco matto! Hai trovato la mossa.'
        : 'Prova un’altra casella. Cerca una mossa che metta il re nero sotto attacco.'
    fb.classList.toggle('success', Number(b.dataset.square) === 11)
    return
  }
  if (session && !session.finished) {
    const q = session.questions[session.index]
    if (b.dataset.option !== undefined && !session.checked) {
      session.answer = q.options[Number(b.dataset.option)]
      lessonDialog.querySelectorAll('[data-option]').forEach((el) => {
        const selected = el === b
        el.classList.toggle('selected', selected)
        el.setAttribute('aria-pressed', String(selected))
      })
      lessonDialog.querySelector('[data-action="check"]').disabled = false
      return
    }
    if (b.dataset.word !== undefined && !session.checked) {
      session.selected.push(Number(b.dataset.word))
      updateWords()
      return
    }
    if (b.dataset.removeWord !== undefined && !session.checked) {
      session.selected = session.selected.filter(
        (i) => i !== Number(b.dataset.removeWord),
      )
      updateWords()
      return
    }
  }
  switch (b.dataset.action) {
    case 'logout':
      tutor.stop()
      tutorIndex = 0
      clearTimeout(syncTimer)
      if (player) await saveProgress(player.id, state).catch(() => {})
      signOutAccount()
      player = null
      content.innerHTML = ''
      document.querySelector('[data-view="admin"]')?.remove()
      showAuth()
      break
    case 'tutor-review': {
      const day = challengeDays[Number(b.dataset.day) - 1]
      if (!day || !state.challengeDays.includes(day.day)) break
      tutor.stop()
      tutorIndex = 0
      const missed = state.challengeReview[day.day] || []
      const pairs = missed.length
        ? missed.map((index) => day.phrases[index]).filter(Boolean)
        : day.phrases
      const reviewDay = { ...day, phrases: pairs }
      tutorDayNumber = day.day
      info(
        `Ripasso · Giorno ${day.day}`,
        `${missed.length ? `<p class="badge">RIPASSO MIRATO · ${missed.length} ${missed.length === 1 ? 'FRASE' : 'FRASI'}</p><p>Ripartiamo dalle frasi che nel quiz hanno richiesto più attenzione.</p>` : '<p>Nel quiz non hai sbagliato frasi. Puoi comunque ripassare tutto il giorno.</p>'}${tutorCard(reviewDay)}`,
      )
      break
    }
    case 'tutor-play':
    case 'tutor-english':
    case 'tutor-slow': {
      const day = challengeDays[tutorDayNumber - 1]
      const pauseSeconds = Number(
        tutorRoot().querySelector('[data-tutor-pause]').value,
      )
      tutor.play(day.phrases[tutorIndex], {
        pauseSeconds,
        englishOnly: b.dataset.action !== 'tutor-play',
        slow: b.dataset.action === 'tutor-slow',
      })
      break
    }
    case 'tutor-stop':
      tutor.stop()
      updateTutorStage('ready')
      break
    case 'tutor-reveal':
      tutor.stop()
      updateTutorStage('revealed')
      break
    case 'tutor-previous':
    case 'tutor-next': {
      const day = challengeDays[tutorDayNumber - 1]
      tutor.stop()
      tutorIndex = Math.min(
        day.phrases.length - 1,
        Math.max(0, tutorIndex + (b.dataset.action === 'tutor-next' ? 1 : -1)),
      )
      tutorRoot().outerHTML = tutorCard(day)
      tutorRoot().querySelector('[data-action="tutor-play"]').focus()
      break
    }
    case 'tutor-confirm': {
      const day = challengeDays[tutorDayNumber - 1]
      const practised = state.challengePractice[day.day] || []
      if (!practised.includes(tutorIndex)) {
        state.challengePractice[day.day] = [...practised, tutorIndex]
        save()
      }
      tutor.stop()
      tutorIndex = Math.min(day.phrases.length - 1, tutorIndex + 1)
      tutorRoot().outerHTML = tutorCard(day)
      const ready =
        state.challengePractice[day.day].length === day.phrases.length
      const quiz = content.querySelector('[data-action="challenge-start"]')
      if (
        ready &&
        quiz &&
        Number(quiz.dataset.day) === day.day &&
        state.challengeLastDate !== dayKey()
      ) {
        quiz.disabled = false
        quiz.textContent = 'INIZIA LA LEZIONE'
      }
      tutorRoot().querySelector('[data-action="tutor-play"]').focus()
      if (ready)
        notify(
          'Pratica completata. Ora puoi verificare le stesse frasi nella lezione.',
        )
      break
    }
    case 'challenge-start': {
      const dayNumber = Number(b.dataset.day)
      const day = challengeDays[dayNumber - 1]
      if (
        dayNumber !== state.challengeDays.length + 1 ||
        state.challengeLastDate === dayKey() ||
        !day ||
        (state.challengePractice[dayNumber] || []).length !== day.phrases.length
      ) {
        notify('La prossima tappa sarà disponibile domani.')
        return
      }
      startLesson(day.lessonIndex, true, {
        title: `8 Days Challenge · Giorno ${dayNumber}`,
        chapter: lessons[day.lessonIndex].chapter,
        questions: day.questions,
        challengeDay: dayNumber,
      })
      break
    }
    case 'challenge-print': {
      const day = challengeDays[Number(b.dataset.day) - 1]
      if (!day) break
      document.querySelector('#challenge-print-title').textContent =
        `Giorno ${day.day} · ${day.title}`
      document.querySelector('#challenge-print-goal').textContent = day.goal
      document.querySelector('#challenge-print-phrase').textContent =
        'Le cinque frasi del giorno'
      document.querySelector('#challenge-print-meaning').textContent =
        day.phrases
          .map((pair) => `${pair.meaning}\n${pair.phrase}`)
          .join('\n\n')
      document.body.classList.add('challenge-printing')
      window.print()
      setTimeout(
        () => document.body.classList.remove('challenge-printing'),
        500,
      )
      break
    }
    case 'more': {
      const menu = document.querySelector('#more-menu'),
        open = b.getAttribute('aria-expanded') !== 'true'
      b.setAttribute('aria-expanded', String(open))
      menu.hidden = !open
      menu.innerHTML = open
        ? `<a href="#chess" class="more-item">${icon('trophy')} Minigioco di scacchi</a><button class="more-item" data-action="about">${icon('book')} Come funziona</button><div class="more-note">Altre attività didattiche arriveranno con le prossime versioni.</div>`
        : ''
      break
    }
    case 'about':
      info(
        'Impara con Luma',
        `<p>Un percorso indipendente d’inglese generale ispirato a tappe, ripasso, missioni e ascolti.</p><ul><li>Lezioni con risposta multipla e frasi da comporre.</li><li>Storie interattive, ascolto e ripasso dei capitoli.</li><li>Missioni giornaliere, progressi e ricompense locali.</li></ul><p>I progressi sono sincronizzati nel profilo personale e una copia resta nel browser. Classifica e scacchi sono funzioni dimostrative.</p>`,
      )
      break
    case 'course-choice':
      info(
        'Corso selezionato',
        `<p>Inglese generale · livello A1 · interfaccia italiana.</p><p>Per aggiungere altre lingue o livelli occorre creare un altro corso e i relativi esercizi.</p>`,
      )
      break
    case 'continue': {
      const id = nextLesson(state)
      if (id < 0)
        startLesson(state.completed.at(-1), true, {
          title: 'Ripasso · Inglese A1',
        })
      else startLesson(id)
      break
    }
    case 'practice':
      startActivity(
        'practice',
        chapterShown ??
          (nextLesson(state) < 0
            ? chapters.length - 1
            : lessons[nextLesson(state)].chapter),
      )
      break
    case 'guide': {
      const chapter =
        chapterShown ??
        (nextLesson(state) < 0
          ? chapters.length - 1
          : lessons[nextLesson(state)].chapter)
      info(
        `Guida · ${chapters[chapter].title}`,
        `<p>${escape(chapters[chapter].subtitle)}</p><ul>${chapters[chapter].lessons.map((l) => `<li><strong>${escape(l.title)}</strong> — ${escape(l.description)}</li>`).join('')}</ul><p>Il capitolo alterna lezioni, una storia, ascolto radio, un forziere di ricompense e una sfida di ripasso.</p>`,
      )
      break
    }
    case 'close-info':
      infoDialog.close()
      break
    case 'exit-lesson':
      closeLesson()
      notify('Tappa interrotta. I progressi già salvati restano disponibili.')
      break
    case 'listen':
      speak(session.questions[session.index].phrase)
      break
    case 'transcript': {
      const p = lessonDialog.querySelector('#transcript')
      p.hidden = !p.hidden
      b.textContent = p.hidden ? 'MOSTRA TRASCRIZIONE' : 'NASCONDI TRASCRIZIONE'
      break
    }
    case 'check':
      check()
      break
    case 'next':
      next()
      break
    case 'finish':
      {
        const route = session?.challengeDay ? 'challenge' : 'learn'
        closeLesson()
        chapterShown = null
        if (location.hash !== `#${route}`) location.hash = route
        else render()
      }
      break
    case 'buy-streak':
      try {
        state = buyStreakSaver(state)
        save()
        render()
        notify('Salva serie aggiunto al tuo inventario.')
      } catch {
        notify('Ti serviranno altre gemme per questa ricompensa.')
      }
      break
    case 'cosmetic':
      notify('La mascotte Luma è già con te nel percorso.')
      break
    case 'export': {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
          type: 'application/json',
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement('a')
      a.href = url
      a.download = `luma-progressi-${dayKey()}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      notify('Copia dei progressi esportata.')
      break
    }
  }
})
lessonDialog.addEventListener('cancel', () => {
  session = null
  if ('speechSynthesis' in window) speechSynthesis.cancel()
})
infoDialog.addEventListener('close', () => {
  tutor.stop()
  if (player?.approval_status === 'approved' && view === 'challenge')
    renderChallenge()
})
document.addEventListener('keydown', (e) => {
  if (!lessonDialog.open || !session || session.finished) return
  if (e.key === 'Enter') {
    e.preventDefault()
    const b = lessonDialog.querySelector(
      '[data-action="check"],[data-action="next"]',
    )
    if (b && !b.disabled) b.click()
  } else if (/^[1-9]$/.test(e.key) && !session.checked) {
    lessonDialog.querySelector(`[data-option="${Number(e.key) - 1}"]`)?.click()
  }
})
document.addEventListener('visibilitychange', () => {
  tutor.stop()
  if (!document.hidden) render()
})
initializeAuth().then(() => {
  if (player?.approval_status === 'approved') navigate()
})
