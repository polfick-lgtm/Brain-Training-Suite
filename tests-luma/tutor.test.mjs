import test from 'node:test'
import assert from 'node:assert/strict'
import { PhraseTutor } from '../public/luma/tutor.mjs'

function setup() {
  const spoken = [],
    stages = [],
    timers = new Map()
  let nextTimer = 0
  const tutor = new PhraseTutor({
    synthesis: {
      cancel() {},
      getVoices: () => [],
      speak: (utterance) => spoken.push(utterance),
    },
    Utterance: class {
      constructor(text) {
        this.text = text
      }
    },
    onStage: (stage) => stages.push(stage),
    setTimer: (callback, delay) => {
      const id = ++nextTimer
      timers.set(id, { callback, delay })
      return id
    },
    clearTimer: (id) => timers.delete(id),
  })
  return { tutor, spoken, stages, timers }
}
const pair = { meaning: 'Mi chiamo Anna.', phrase: 'My name is Anna.' }

test('the tutor speaks Italian, waits for recall, then reads English and invites repetition', () => {
  const { tutor, spoken, stages, timers } = setup()
  tutor.play(pair, { pauseSeconds: 8 })
  assert.equal(spoken[0].text, pair.meaning)
  assert.equal(spoken[0].lang, 'it-IT')
  assert.deepEqual(stages, ['italian'])
  spoken[0].onend()
  const timer = [...timers.values()][0]
  assert.equal(timer.delay, 8000)
  assert.equal(spoken.length, 1)
  timer.callback()
  assert.equal(spoken[1].text, pair.phrase)
  assert.equal(spoken[1].lang, 'en-GB')
  spoken[1].onend()
  assert.deepEqual(stages, ['italian', 'think', 'english', 'repeat'])
})

test('stop and a new phrase invalidate pending timers and stale speech callbacks', () => {
  const { tutor, spoken, timers } = setup()
  tutor.play(pair)
  spoken[0].onend()
  const oldTimer = [...timers.values()][0]
  tutor.stop()
  assert.equal(timers.size, 0)
  oldTimer.callback()
  spoken[0].onend()
  assert.equal(spoken.length, 1)
  assert.equal(timers.size, 0)
  tutor.play(pair, { englishOnly: true, slow: true })
  assert.equal(spoken[1].lang, 'en-GB')
  assert.equal(spoken[1].rate, 0.65)
})

test('unsupported or failed speech falls back to readable text without scheduling more audio', () => {
  const { tutor, spoken, stages, timers } = setup()
  tutor.play(pair)
  spoken[0].onerror({ error: 'language-unavailable' })
  spoken[0].onend()
  assert.equal(stages.at(-1), 'unavailable')
  assert.equal(timers.size, 0)
  new PhraseTutor({ onStage: (stage) => stages.push(stage) }).play(pair)
  assert.equal(stages.at(-1), 'unavailable')
})
