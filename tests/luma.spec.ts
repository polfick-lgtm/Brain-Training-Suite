import { expect, test } from '@playwright/test'

test('Luma requires backend configuration before opening player data', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.addInitScript(() => {
    ;(window as Window & { LUMA_CONFIG: { apiBaseUrl: string } }).LUMA_CONFIG =
      { apiBaseUrl: '' }
  })
  await page.goto('./luma/index.html')
  await expect(
    page.getByRole('heading', { name: 'Account non ancora configurati' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'ACCEDI' })).toHaveCount(0)
  await expect(page.locator('#content')).toBeEmpty()
  expect(consoleErrors).toEqual([])
})

test('an approved player can complete and sync the first challenge day', async ({
  page,
}) => {
  let progressSynced = false
  await page.addInitScript(() => {
    ;(
      window as Window & {
        LUMA_CONFIG: { apiBaseUrl: string }
      }
    ).LUMA_CONFIG = {
      apiBaseUrl: 'https://api.luma.test',
    }
    window.print = () => {}
  })
  await page.route('https://api.luma.test/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/auth/login')) {
      await route.fulfill({
        json: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'test-refresh-token',
          user: { id: 'player-1', email: 'player@example.test' },
        },
      })
    } else if (url.includes('/api/auth/me')) {
      await route.fulfill({
        json: {
          id: 'player-1',
          display_name: 'Player One',
          approval_status: 'approved',
        },
      })
    } else if (url.includes('/api/progress')) {
      if (route.request().method() === 'GET')
        await route.fulfill({ json: { progress: null } })
      else {
        progressSynced = true
        await route.fulfill({ json: { status: 'saved' } })
      }
    } else {
      await route.fulfill({ status: 404, json: { error: 'Not found' } })
    }
  })

  await page.goto('./luma/index.html')
  await page.getByLabel('Email').fill('player@example.test')
  await page.getByLabel('Password').fill('safe-example-password')
  await page.getByRole('button', { name: 'ACCEDI' }).click()
  await expect(page.locator('#content')).not.toBeEmpty()
  await expect(page.getByRole('link', { name: 'Amministrazione' })).toHaveCount(
    0,
  )
  await page.getByRole('link', { name: '8 Giorni' }).click()
  await page.getByRole('button', { name: 'INIZIA LA LEZIONE' }).click()

  const dialog = page.locator('#lesson-dialog')
  await dialog.locator('[data-option]').filter({ hasText: 'Hello' }).click()
  await dialog.locator('[data-action="check"]').click()
  await dialog.locator('[data-action="next"]').click()
  for (const word of ['I', 'am', 'Anna']) {
    await dialog.locator('[data-word]').filter({ hasText: word }).click()
  }
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
  await dialog.locator('[data-action="next"]').click()
  await dialog.getByRole('button', { name: 'TORNA AL PERCORSO' }).click()

  await expect(page.getByText('1 / 8 COMPLETATI')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'TORNA DOMANI' }),
  ).toBeDisabled()
  await expect.poll(() => progressSynced).toBe(true)
})

test('administrator reviews requests and approves a player from the private area', async ({
  page,
}) => {
  await page.addInitScript(() => {
    ;(window as Window & { LUMA_CONFIG: { apiBaseUrl: string } }).LUMA_CONFIG =
      { apiBaseUrl: 'https://api.luma.test' }
  })
  let approved = false
  const admin = {
    id: 'admin-1',
    display_name: 'Admin',
    role: 'admin',
    approval_status: 'approved',
  }
  await page.route('https://api.luma.test/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/login')
      await route.fulfill({
        json: {
          access_token: 'test-admin-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: admin,
        },
      })
    else if (path === '/api/auth/me') await route.fulfill({ json: admin })
    else if (path === '/api/progress')
      await route.fulfill({ json: { progress: null } })
    else if (path === '/api/admin/players')
      await route.fulfill({
        json: {
          total: 1,
          players: [
            {
              id: 'player-1',
              display_name: '<img src=x onerror=alert(1)>',
              email: 'player@example.test',
              approval_status: approved ? 'approved' : 'pending',
            },
          ],
        },
      })
    else if (path === '/api/admin/players/player-1') {
      expect(route.request().postDataJSON()).toEqual({
        approval_status: 'approved',
      })
      approved = true
      await route.fulfill({
        json: { id: 'player-1', approval_status: 'approved' },
      })
    } else await route.fulfill({ status: 404, json: { error: 'Not found' } })
  })
  await page.goto('./luma/index.html')
  await page.getByLabel('Email').fill('admin@example.test')
  await page.getByLabel('Password').fill('test-only-password-123')
  await page.getByRole('button', { name: 'ACCEDI' }).click()
  await page.getByRole('link', { name: 'Amministrazione' }).click()
  await expect(
    page.getByRole('heading', { name: '<img src=x onerror=alert(1)>' }),
  ).toBeVisible()
  await expect(page.locator('.admin-player img')).toHaveCount(0)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'APPROVA', exact: true }).click()
  await expect(page.locator('.admin-player .badge')).toHaveText('Approvato')
  expect(approved).toBe(true)
})

test('a pending player waits for administrator approval and cannot open the learning area', async ({
  page,
}) => {
  await page.addInitScript(() => {
    ;(
      window as Window & {
        LUMA_CONFIG: { apiBaseUrl: string }
      }
    ).LUMA_CONFIG = {
      apiBaseUrl: 'https://api.luma.test',
    }
  })
  await page.route('https://api.luma.test/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/api/auth/login')) {
      await route.fulfill({
        json: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: 'test-refresh-token',
          user: { id: 'player-pending', email: 'pending@example.test' },
        },
      })
    } else if (url.includes('/api/auth/me')) {
      await route.fulfill({
        json: {
          id: 'player-pending',
          display_name: 'Pending Player',
          approval_status: 'pending',
        },
      })
    } else {
      await route.fulfill({ status: 404, json: { error: 'Not found' } })
    }
  })

  await page.goto('./luma/index.html')
  await page.getByLabel('Email').fill('pending@example.test')
  await page.getByLabel('Password').fill('safe-example-password')
  await page.getByRole('button', { name: 'ACCEDI' }).click()
  await expect(
    page.getByText(/Richiesta registrata: attendi l’approvazione/),
  ).toBeVisible()
  await expect(page.locator('#content')).toBeEmpty()
})
