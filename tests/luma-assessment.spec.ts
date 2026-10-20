import { expect, test, type Page } from '@playwright/test'
import {
  chapterAssessmentQuestions,
  initialState,
} from '../public/luma/model.mjs'

test.describe.configure({ timeout: 60_000 })

async function login(page: Page, partial = false) {
  let progress = initialState()
  if (partial) {
    progress.completed = [0]
    progress.xp = 20
  }
  let writes = 0
  await page.addInitScript(() => {
    ;(window as Window & { LUMA_CONFIG: { apiBaseUrl: string } }).LUMA_CONFIG =
      {
        apiBaseUrl: 'https://luma-assessment.test',
      }
  })
  await page.route('https://luma-assessment.test/**', async (route) => {
    const url = route.request().url()
    if (url.endsWith('/api/auth/login'))
      await route.fulfill({
        json: {
          access_token: 'assessment-test-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'assessment-test-refresh',
          user: { id: 'assessment-player', email: 'player@example.test' },
        },
      })
    else if (url.endsWith('/api/auth/me'))
      await route.fulfill({
        json: {
          id: 'assessment-player',
          display_name: 'Player',
          approval_status: 'approved',
        },
      })
    else if (url.endsWith('/api/progress')) {
      if (route.request().method() === 'PUT') {
        progress = route.request().postDataJSON().progress
        writes++
        await route.fulfill({ json: { status: 'saved' } })
      } else await route.fulfill({ json: { progress } })
    } else await route.fulfill({ status: 404, json: { error: 'Not found' } })
  })
  await page.goto('./luma/index.html')
  await page.getByLabel('Email').fill('player@example.test')
  await page.getByLabel('Password').fill('safe-example-password')
  await page.getByRole('button', { name: 'ACCEDI', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'VALUTA E SALTA IL CAPITOLO' }),
  ).toBeVisible()
  await expect.poll(() => writes).toBe(1)
  return {
    get progress() {
      return progress
    },
    get writes() {
      return writes
    },
  }
}

async function startAssessment(page: Page) {
  await page.getByRole('button', { name: 'VALUTA E SALTA IL CAPITOLO' }).click()
  await expect(page.locator('#info-dialog')).toContainText('8 domande')
  await page.getByRole('button', { name: 'AVVIA VALUTAZIONE' }).click()
  await expect(page.locator('#lesson-dialog')).toBeVisible()
}

async function answerAssessment(page: Page, correctCount: number) {
  const dialog = page.locator('#lesson-dialog')
  const questions = chapterAssessmentQuestions(0)
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index]
    const correct = index < correctCount
    if (question.type === 'words') {
      const used = new Set<number>()
      for (const word of question.answer) {
        const wordIndex = question.bank.findIndex(
          (item: string, i: number) => item === word && !used.has(i),
        )
        used.add(wordIndex)
        await dialog.locator(`[data-word="${wordIndex}"]`).click()
      }
    } else {
      const option = question.options.findIndex((item: string) =>
        correct ? item === question.answer : item !== question.answer,
      )
      await dialog.locator(`[data-option="${option}"]`).click()
      if (question.type === 'listen')
        await expect(dialog.locator('[data-action="transcript"]')).toHaveCount(
          0,
        )
    }
    await dialog.locator('[data-action="check"]').click()
    await dialog.locator('[data-action="next"]').click()
  }
}

test('passing an assessment unlocks the next chapter and persists across reloads', async ({
  page,
}) => {
  const account = await login(page)
  await startAssessment(page)
  await answerAssessment(page, 8)
  await expect(
    page.getByRole('heading', { name: 'Capitolo superato!' }),
  ).toBeVisible()
  await expect.poll(() => account.progress.completed).toEqual([0, 1, 2, 3])
  expect(account.progress.chapterAssessments[0]).toMatchObject({
    chapter: 0,
    correct: 8,
    total: 8,
  })
  await page.getByRole('button', { name: 'VAI AL PROSSIMO CAPITOLO' }).click()
  await expect(page.locator('.chapter-banner')).toContainText('CAPITOLO 2 DI 3')
  await expect(page.locator('[data-chapter="2"]')).toBeDisabled()
  await page.locator('[data-chapter="0"]').click()
  await expect(
    page.getByText('SUPERATO CON VALUTAZIONE', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'VALUTA E SALTA IL CAPITOLO' }),
  ).toHaveCount(0)
  await page.reload()
  await expect(page.locator('.chapter-banner')).toContainText('CAPITOLO 2 DI 3')
  expect(account.progress.chapterAssessments).toHaveLength(1)
})

test('failing or leaving an assessment preserves existing progress and locked chapters', async ({
  page,
}) => {
  const account = await login(page, true)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  const before = structuredClone(account.progress)
  const writesBefore = account.writes
  await startAssessment(page)
  await answerAssessment(page, 6)
  await expect(
    page.getByRole('heading', { name: 'Continua ad allenarti' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'TORNA AL PERCORSO' }).click()
  expect(account.progress).toEqual(before)
  await expect(page.locator('[data-chapter="1"]')).toBeDisabled()
  await startAssessment(page)
  await page.getByRole('button', { name: 'Esci dalla lezione' }).click()
  await expect(page.locator('#lesson-dialog')).not.toBeVisible()
  expect(account.progress).toEqual(before)
  expect(account.writes).toBe(writesBefore)
})
