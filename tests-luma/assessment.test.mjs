import test from 'node:test'
import assert from 'node:assert/strict'
import {
  chapters,
  lessons,
  initialState,
  hydrate,
  nextLesson,
  canAssessChapter,
  chapterAssessmentQuestions,
  completeChapterAssessment,
} from '../public/luma/model.mjs'

const result = { correct: 7, total: 8, listening: 1 }

test('each chapter assessment covers every lesson and all three question types', () => {
  chapters.forEach((chapter, index) => {
    const questions = chapterAssessmentQuestions(index)
    assert.equal(questions.length, 8)
    assert.deepEqual([...new Set(questions.map((q) => q.type))].sort(), [
      'choice',
      'listen',
      'words',
    ])
    chapter.lessons.forEach((lesson) => {
      assert.equal(
        questions.filter((q) =>
          lesson.questions.some(
            (source) => JSON.stringify(source) === JSON.stringify(q),
          ),
        ).length,
        2,
      )
    })
    questions[0].prompt = 'modified'
    assert.notEqual(chapterAssessmentQuestions(index)[0].prompt, 'modified')
  })
})

test('passing advances one chapter at a time, retains partial progress and cannot reward twice', () => {
  let state = initialState()
  state.completed = [0]
  state.xp = 20
  const original = structuredClone(state)
  assert.throws(() => completeChapterAssessment(state, 1, result), /corrente/)
  for (let chapter = 0; chapter < chapters.length; chapter++) {
    assert.equal(canAssessChapter(state, chapter), true)
    const outcome = completeChapterAssessment(state, chapter, result)
    assert.equal(outcome.passed, true)
    assert.equal(outcome.xp, 20)
    assert.equal(outcome.gems, 0)
    assert.equal(outcome.state.xp, state.xp + 20)
    assert.equal(outcome.state.completed.length, (chapter + 1) * 4)
    assert.throws(
      () => completeChapterAssessment(outcome.state, chapter, result),
      /corrente/,
    )
    const restored = hydrate(JSON.stringify(outcome.state))
    assert.deepEqual(
      restored.chapterAssessments,
      outcome.state.chapterAssessments,
    )
    assert.equal(
      nextLesson(restored),
      chapter === chapters.length - 1 ? -1 : (chapter + 1) * 4,
    )
    state = restored
  }
  assert.deepEqual(original.completed, [0])
  assert.equal(state.completed.length, lessons.length)
  assert.equal(canAssessChapter(state, chapters.length - 1), false)
})

test('a failed assessment grants no rewards, changes no progress and allows a retry', () => {
  const state = initialState()
  state.completed = [0, 1]
  const before = structuredClone(state)
  const outcome = completeChapterAssessment(state, 0, { correct: 6, total: 8 })
  assert.equal(outcome.passed, false)
  assert.equal(outcome.xp, 0)
  assert.equal(outcome.gems, 0)
  assert.deepEqual(outcome.state, before)
  assert.deepEqual(state, before)
  assert.equal(canAssessChapter(outcome.state, 0), true)
})

test('assessment rejects invalid chapters, forged question counts and impossible results', () => {
  for (const chapter of [-1, 0.5, 3, NaN, '0']) {
    assert.equal(canAssessChapter(initialState(), chapter), false)
    assert.throws(() =>
      completeChapterAssessment(initialState(), chapter, result),
    )
    assert.throws(() => chapterAssessmentQuestions(chapter))
  }
  for (const score of [
    { correct: 1, total: 1 },
    { correct: 6.5, total: 8 },
    { correct: 9, total: 8 },
    { correct: -1, total: 8 },
    { correct: NaN, total: 8 },
    { correct: 8, total: 8, listening: 3 },
    { correct: 8, total: 8, listening: -1 },
  ])
    assert.throws(
      () => completeChapterAssessment(initialState(), 0, score),
      /non valido/,
    )
})

test('legacy profiles hydrate safely and invalid assessment records are removed', () => {
  const legacy = initialState()
  delete legacy.chapterAssessments
  assert.deepEqual(hydrate(JSON.stringify(legacy)).chapterAssessments, [])
  const state = completeChapterAssessment(initialState(), 0, result).state
  state.chapterAssessments.push(
    null,
    {},
    { chapter: 1, correct: 8, total: 8, date: '2026-10-20' },
  )
  assert.equal(hydrate(JSON.stringify(state)).chapterAssessments.length, 1)
  state.chapterAssessments[0].correct = 6
  assert.deepEqual(hydrate(JSON.stringify(state)).chapterAssessments, [])
})
