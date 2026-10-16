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
      (day) => day.questions.length === 4 && day.phrase && day.meaning,
    ),
  )
})

test('challenge days reward progress and unlock in daily order', () => {
  const today = new Date('2026-10-16T10:00:00')
  const first = completeChallengeDay(
    initialState(),
    1,
    { correct: 4, total: 4, listening: 1 },
    today,
  )
  assert.deepEqual(first.state.challengeDays, [1])
  assert.equal(first.xp, 20)
  assert.equal(first.gems, 3)
  assert.throws(
    () => completeChallengeDay(first.state, 2, { correct: 4, total: 4 }, today),
    /domani/,
  )
  assert.throws(
    () =>
      completeChallengeDay(
        first.state,
        3,
        { correct: 4, total: 4 },
        new Date('2026-10-17T10:00:00'),
      ),
    /ordine/,
  )

  const second = completeChallengeDay(
    first.state,
    2,
    { correct: 3, total: 4 },
    new Date('2026-10-17T10:00:00'),
  )
  assert.deepEqual(second.state.challengeDays, [1, 2])
  assert.equal(second.state.history.at(-1).kind, 'challenge')
})

test('challenge state survives export and hydration', () => {
  const state = completeChallengeDay(
    initialState(),
    1,
    { correct: 3, total: 4 },
    new Date('2026-10-16T10:00:00'),
  ).state
  const restored = hydrate(JSON.stringify(state))
  assert.deepEqual(restored.challengeDays, [1])
  assert.equal(restored.challengeLastDate, '2026-10-16')
})
