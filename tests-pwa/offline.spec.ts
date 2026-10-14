import { expect, test } from '@playwright/test'

test('registra la PWA e riapre la Home offline', async ({ context, page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: /Bentornato/i })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Bentornato/i })).toBeVisible()
})

test('tutti gli otto Arcade si avviano offline dalla build installata', async ({
  context,
  page,
}) => {
  await page.goto('./')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  for (const [id, title] of [
    ['snake', 'Snake'],
    ['breakout', 'Spacca mattoni'],
    ['maze', 'Labirinto arcade'],
    ['falling-blocks', 'Blocchi cadenti'],
    ['space-shooter', 'Space Shooter'],
    ['asteroids', 'Asteroidi'],
    ['sokoban', 'Sokoban'],
    ['puzzle-15', 'Puzzle 15'],
  ]) {
    await page.goto(`./giochi/${id}`)
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Avvia', exact: true }).click()
    await expect(page.locator('.arcade-panel')).toBeVisible()
  }
})
