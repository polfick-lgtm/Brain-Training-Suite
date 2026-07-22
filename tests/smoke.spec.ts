import { expect, test } from '@playwright/test'

test('naviga tra Home, Progressi, Profilo e Torre di Hanoi', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: /Bentornato/i })).toBeVisible()

  await page.getByRole('link', { name: 'Giochi' }).click()
  await expect(
    page.getByRole('heading', { name: 'Giochi', level: 1 }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Sessioni' }).click()
  await expect(page.getByRole('heading', { name: 'Sessioni' })).toBeVisible()

  await page.getByRole('link', { name: 'Progressi' }).click()
  await expect(page.getByRole('heading', { name: 'Progressi' })).toBeVisible()

  await page.getByRole('link', { name: 'Profilo' }).click()
  await expect(page.getByRole('heading', { name: 'Profilo' })).toBeVisible()

  await page.getByRole('link', { name: 'Impostazioni' }).click()
  await expect(
    page.getByRole('heading', { name: 'Impostazioni' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Home' }).click()
  await page.getByRole('link', { name: /Torre di Hanoi/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Torre di Hanoi' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Piolo 1' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})

test('gestisce una route sconosciuta e il focus principale', async ({
  page,
}) => {
  await page.goto('./pagina-inesistente')
  await expect(
    page.getByRole('heading', { name: 'Pagina non trovata' }),
  ).toBeVisible()
  await expect(page.locator('#contenuto-principale')).toBeFocused()
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

test('importa, esporta e cancella i dati locali con conferma', async ({
  page,
}) => {
  const now = new Date().toISOString()
  await page.goto('./impostazioni')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'brain-training-suite-test.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'brain-training-suite',
        schemaVersion: 1,
        exportedAt: now,
        profile: {
          id: 'local',
          displayName: 'Profilo importato',
          preferredLevel: 4,
          goal: 'memory',
          updatedAt: now,
        },
        settings: {
          id: 'app',
          theme: 'dark',
          textScale: 'large',
          reduceMotion: true,
          sounds: false,
          coachEnabled: false,
          updatedAt: now,
        },
        sessions: [],
      }),
    ),
  })
  await expect(page.getByRole('status')).toContainText(
    'Importazione completata',
  )
  await expect(page.getByLabel('Tema')).toHaveValue('dark')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Esporta JSON' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(
    /^brain-training-suite-.*\.json$/,
  )

  await page.getByRole('button', { name: 'Cancella tutti i dati' }).click()
  await page
    .getByRole('button', { name: 'Conferma cancellazione completa' })
    .click()
  await expect(page.getByRole('status')).toContainText('Tutti i dati locali')
  await page.getByRole('link', { name: 'Profilo' }).click()
  await expect(page.getByLabel('Nome visualizzato')).toHaveValue('')
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
  await expect(page.getByRole('row', { name: /Torre di Hanoi/ })).toBeVisible()
  await expect(
    page.getByRole('img', { name: /punteggio medio/i }),
  ).toBeVisible()
  await page.getByLabel('Periodo').selectOption('all')
  await page
    .locator('.filters label')
    .filter({ hasText: 'Gioco' })
    .locator('select')
    .selectOption('hanoi')
})

test('avvia, mette in pausa e completa Torre di Londra da tastiera', async ({
  page,
}) => {
  await page.goto('./giochi/tower-of-london')
  await page.getByRole('button', { name: 'Avvia' }).click()
  await page.getByRole('button', { name: 'Pausa' }).click()
  await expect(page.getByText('Sessione in pausa.')).toBeVisible()
  await page.getByRole('button', { name: 'Riprendi' }).click()
  for (let round = 0; round < 3; round += 1) await page.keyboard.press('2')
  await expect(
    page.getByRole('heading', { name: 'Risultato salvato' }),
  ).toBeVisible()
})

for (const [slug, title] of [
  ['memory', 'Memory'],
  ['visual-memory', 'Memoria visiva'],
  ['digit-span', 'Digit Span'],
  ['simon', 'Simon'],
  ['stroop', 'Stroop'],
  ['trail-making', 'Trail Making'],
  ['reaction', 'Test di reazione'],
  ['n-back', 'N-Back'],
] as const) {
  test(`avvia il gioco ${title}`, async ({ page }) => {
    await page.goto(`./giochi/${slug}`)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await page.getByRole('button', { name: 'Avvia' }).click()
    await expect(page.locator('.choice-button').first()).toBeVisible()
    await page.locator('.choice-button').first().click()
    await expect(page.getByRole('status').last()).not.toBeEmpty()
  })
}

test('crea una sessione per obiettivo e avanza dopo un gioco', async ({
  page,
}) => {
  await page.goto('./sessioni')
  await page.locator('.session-builder select').nth(0).selectOption('memory')
  await page.locator('.session-builder select').nth(1).selectOption('10')
  await page.getByRole('button', { name: 'Inizia sessione' }).click()
  await page.getByRole('button', { name: 'Pausa sessione' }).click()
  await expect(page.getByText('Sessione in pausa')).toBeVisible()
  await page.getByRole('button', { name: 'Riprendi sessione' }).click()
  await page.getByRole('link', { name: 'Apri gioco' }).click()
  await page.getByRole('button', { name: 'Avvia' }).click()
  for (let round = 0; round < 3; round += 1) await page.keyboard.press('2')
  await page.getByRole('link', { name: 'Sessioni' }).click()
  await expect(page.getByText('Completato').first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Apri gioco' })).toBeVisible()
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
