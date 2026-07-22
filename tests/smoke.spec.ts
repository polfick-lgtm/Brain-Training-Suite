import { expect, test } from '@playwright/test'

test('naviga tra Home, Progressi, Profilo e Torre di Hanoi', async ({
  page,
}) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: /Bentornato/i })).toBeVisible()

  await page.getByRole('link', { name: 'Progressi' }).click()
  await expect(page.getByRole('heading', { name: 'Progressi' })).toBeVisible()

  await page.getByRole('link', { name: 'Profilo' }).click()
  await expect(page.getByRole('heading', { name: 'Profilo' })).toBeVisible()

  await page.getByRole('link', { name: 'Home' }).click()
  await page.getByRole('link', { name: /Torre di Hanoi/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Torre di Hanoi' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Piolo 1' })).toBeVisible()
})

test('salva il profilo localmente e lo conserva dopo il reload', async ({
  page,
}) => {
  await page.goto('./profilo')
  await page.getByLabel('Nome visualizzato').fill('Test Utente')
  await page.getByLabel('Livello iniziale consigliato').selectOption('3')
  await page.getByRole('button', { name: 'Salva profilo' }).click()
  await expect(page.getByText('Profilo salvato.')).toBeVisible()

  await page.reload()
  await expect(page.getByLabel('Nome visualizzato')).toHaveValue('Test Utente')
  await expect(page.getByLabel('Livello iniziale consigliato')).toHaveValue('3')
})

test('completa una partita a tre dischi e registra la sessione', async ({
  page,
}) => {
  await page.goto('./giochi/hanoi')
  await page.getByLabel('Dischi').selectOption('3')

  page.once('dialog', (dialog) => dialog.accept())
  for (const [from, to] of [
    [1, 3],
    [1, 2],
    [3, 2],
    [1, 3],
    [2, 1],
    [2, 3],
    [1, 3],
  ]) {
    await page.getByRole('button', { name: `Piolo ${from}` }).click()
    await page.getByRole('button', { name: `Piolo ${to}` }).click()
  }

  await page.getByRole('link', { name: 'Progressi' }).click()
  await expect(page.getByText('Torre di Hanoi · 3 dischi')).toBeVisible()
  await expect(page.getByText(/7 mosse/)).toBeVisible()
})

test('resta utilizzabile su una viewport mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Inizia allenamento/ }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /Torre di Hanoi/ })).toBeVisible()

  const bodyWidth = await page
    .locator('body')
    .evaluate((element) => element.scrollWidth)
  expect(bodyWidth).toBeLessThanOrEqual(390)
})
