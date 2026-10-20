import test from 'node:test'
import assert from 'node:assert/strict'
import { challengeDays } from '../public/luma/challenge.mjs'
import {
  completeChallengeDay,
  hydrate,
  initialState,
} from '../public/luma/model.mjs'

test('the challenge contains eight guided lessons with four exercises each', () => {
  assert.equal(challengeDays.length, 8)
  assert.ok(
    challengeDays.every(
      (day) =>
        day.questions.length === 4 &&
        day.phrase &&
        day.meaning &&
        day.phrases.length === 5 &&
        day.phrases.every((pair) => pair.phrase && pair.meaning),
    ),
  )
})

test('challenge days can be chosen freely while completion stays limited to one per day', () => {
  const today = new Date('2026-10-16T10:00:00')
  const first = completeChallengeDay(
    initialState(),
    4,
    { correct: 4, total: 4, listening: 1 },
    today,
  )
  assert.deepEqual(first.state.challengeDays, [4])
  assert.equal(first.xp, 20)
  assert.equal(first.gems, 3)
  assert.throws(
    () => completeChallengeDay(first.state, 5, { correct: 4, total: 4 }, today),
    /domani/,
  )
  assert.throws(
    () =>
      completeChallengeDay(
        first.state,
        4,
        { correct: 4, total: 4 },
        new Date('2026-10-17T10:00:00'),
      ),
    /già completata/,
  )

  const second = completeChallengeDay(
    first.state,
    1,
    { correct: 3, total: 4 },
    new Date('2026-10-17T10:00:00'),
  )
  assert.deepEqual(second.state.challengeDays, [4, 1])
  assert.equal(second.state.history.at(-1).kind, 'challenge')
})

test('challenge state survives export and hydration', () => {
  const state = completeChallengeDay(
    initialState(),
    4,
    { correct: 3, total: 4 },
    new Date('2026-10-16T10:00:00'),
  ).state
  const restored = hydrate(JSON.stringify(state))
  assert.deepEqual(restored.challengeDays, [4])
  assert.equal(restored.challengeLastDate, '2026-10-16')
  state.challengePractice = { 2: [0, 1, 1, 99, -1], 99: [0] }
  const resumed = hydrate(JSON.stringify(state))
  assert.deepEqual(resumed.challengePractice[2], [0, 1])
  assert.equal(resumed.challengePractice[99], undefined)
})

test('challenge stores a safe, deduplicated list of phrases to review', () => {
  const result = completeChallengeDay(
    initialState(),
    4,
    { correct: 3, total: 4, missedPhrases: [0, 2, 2] },
    new Date('2026-10-16T10:00:00'),
  )
  assert.deepEqual(result.state.challengeReview[4], [0, 2])
  assert.deepEqual(
    hydrate(JSON.stringify(result.state)).challengeReview[4],
    [0, 2],
  )
  assert.throws(
    () =>
      completeChallengeDay(
        initialState(),
        1,
        { correct: 3, total: 4, missedPhrases: [5] },
        new Date('2026-10-16T10:00:00'),
      ),
    /non valido/,
  )
})

test('challenge questions map answers to the phrase practiced', () => {
  for (const day of challengeDays) {
    assert.deepEqual(
      day.questions.map((question) => question.phraseIndex),
      [0, 1, 2, 4],
    )
  }
})
