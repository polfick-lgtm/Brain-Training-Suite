import { expect, test } from '@playwright/test'

test('registra la PWA e riapre la Home offline', async ({ context, page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: /Bentornato/i })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: /Bentornato/i })).toBeVisible()
})
