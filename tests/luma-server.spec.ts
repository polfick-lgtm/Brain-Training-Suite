import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

let apiProcess: ChildProcess | undefined
let directory: string
let apiBaseUrl: string

test.beforeAll(async ({ baseURL }) => {
  directory = await mkdtemp(join(tmpdir(), 'luma-e2e-'))
  apiProcess = spawn(
    process.env.LUMA_TEST_PYTHON || 'python',
    ['server/tests/serve_test_api.py', directory, new URL(baseURL!).origin],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )
  apiBaseUrl = await new Promise<string>((resolveUrl, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Test API startup timed out')),
      20_000,
    )
    apiProcess!.once('error', reject)
    apiProcess!.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`Test API exited (${code})`))
    })
    apiProcess!.stdout!.on('data', (chunk: Buffer) => {
      const match = chunk.toString().match(/LISTENING:(\d+)/)
      if (match) {
        clearTimeout(timeout)
        resolveUrl(`http://127.0.0.1:${match[1]}`)
      }
    })
  })
})

test.afterAll(async () => {
  if (apiProcess && apiProcess.exitCode === null) {
    const exited = new Promise<void>((done) =>
      apiProcess!.once('exit', () => done()),
    )
    apiProcess.kill()
    await exited
  }
  if (directory) {
    if (
      dirname(resolve(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith('luma-e2e-')
    )
      throw new Error('Unsafe test cleanup path')
    await rm(directory, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    })
  }
})

async function configure(page: Page) {
  await page.addInitScript((url) => {
    ;(window as Window & { LUMA_CONFIG: { apiBaseUrl: string } }).LUMA_CONFIG =
      { apiBaseUrl: url }
  }, apiBaseUrl)
}

async function login(page: Page, email: string) {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('test-only-password-123')
  await page.getByRole('button', { name: 'ACCEDI' }).click()
}

test('real API registration, admin approval, learning sync and session revocation', async ({
  page,
  browser,
  baseURL,
}) => {
  test.setTimeout(60_000)
  await configure(page)
  await page.goto('./luma/index.html')
  await page
    .getByRole('button', { name: 'Non hai un account? Registrati' })
    .click()
  await page.getByLabel('Nome giocatore').fill('Real API Player')
  await page.getByLabel('Email').fill('player@example.test')
  await page.getByLabel('Password').fill('test-only-password-123')
  await page.getByRole('button', { name: 'RICHIEDI ACCESSO' }).click()
  await expect(page.getByText(/L’amministratore potrà approvare/)).toBeVisible()
  await login(page, 'player@example.test')
  await expect(page.getByText(/attendi l’approvazione/)).toBeVisible()
  await expect(page.locator('#content')).toBeEmpty()

  const adminContext = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
  })
  const admin = await adminContext.newPage()
  await configure(admin)
  await admin.goto('./luma/index.html')
  await login(admin, 'admin@example.test')
  await admin.getByRole('link', { name: 'Amministrazione' }).click()
  await expect(
    admin.getByText('player@example.test', { exact: true }),
  ).toBeVisible()
  admin.once('dialog', (dialog) => dialog.accept())
  await admin.getByRole('button', { name: 'APPROVA', exact: true }).click()
  await expect(admin.locator('.admin-player .badge')).toHaveText('Approvato')

  await login(page, 'player@example.test')
  await page.getByRole('link', { name: '8 Giorni' }).click()
  await page.getByRole('button', { name: 'INIZIA LA LEZIONE' }).click()
  const dialog = page.locator('#lesson-dialog')
  await dialog.locator('[data-option]').filter({ hasText: 'Hello' }).click()
  await dialog.locator('[data-action="check"]').click()
  await dialog.locator('[data-action="next"]').click()
  for (const word of ['I', 'am', 'Anna'])
    await dialog.locator('[data-word]').filter({ hasText: word }).click()
  await dialog.locator('[data-action="check"]').click()
  await dialog.locator('[data-action="next"]').click()
  await dialog
    .locator('[data-option]')
    .filter({ hasText: 'Buongiorno' })
    .click()
  await dialog.locator('[data-action="check"]').click()
  await dialog.locator('[data-action="next"]').click()
  await dialog.locator('[data-option]').filter({ hasText: 'meet' }).click()
  await dialog.locator('[data-action="check"]').click()
  const progressSaved = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/progress') &&
      response.request().method() === 'PUT' &&
      response.ok(),
  )
  await dialog.locator('[data-action="next"]').click()
  await dialog.getByRole('button', { name: 'TORNA AL PERCORSO' }).click()
  await expect(page.getByText('1 / 8 COMPLETATI')).toBeVisible()
  // Wait for the real debounced HTTP save to finish before simulating a new device.
  await progressSaved
  const otherContext = await browser.newContext({ baseURL })
  const other = await otherContext.newPage()
  await configure(other)
  await other.goto('./luma/index.html')
  await login(other, 'player@example.test')
  await other.getByRole('link', { name: '8 Giorni' }).click()
  await expect(other.getByText('1 / 8 COMPLETATI')).toBeVisible()

  admin.once('dialog', (event) => event.accept())
  await admin.getByRole('button', { name: 'REVOCA ACCESSO' }).click()
  await expect(admin.locator('.admin-player .badge')).toHaveText('Rifiutato')
  await other.reload()
  await expect(other.getByRole('heading', { name: 'Bentornato' })).toBeVisible()
  await expect(other.locator('#content')).toBeEmpty()
  await adminContext.close()
  await otherContext.close()
})
