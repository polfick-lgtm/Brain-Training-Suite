import { expect, test } from '@playwright/test'
import { arcadeDefinitions } from '../src/games/arcade/catalog'
import {
  createGrid,
  Direction,
  moveGrid,
  neighbor,
  vectors,
} from '../src/games/arcade/gridEngine'

const keys: Record<Direction, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
}

for (const game of arcadeDefinitions) {
  test(`${game.title}: mobile, comandi, pausa e riavvio`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 320, height: 820 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`./giochi/${game.id}`)
    await expect(
      page.getByRole('heading', { name: game.title, exact: true }),
    ).toBeVisible()
    await page
      .getByRole('combobox', { name: 'Difficoltà', exact: true })
      .selectOption('medium')
    await page.getByRole('button', { name: 'Avvia', exact: true }).click()
    await expect(page.locator('.arcade-panel')).toBeVisible()
    expect(
      await page.locator('body').evaluate((body) => body.scrollWidth),
    ).toBeLessThanOrEqual(320)
    if (['space-shooter', 'asteroids', 'breakout'].includes(game.id)) {
      const control = page.getByRole('button', { name: 'Destra', exact: true })
      await control.click()
    } else if (game.id === 'puzzle-15') {
      const empty = await page
        .locator('.sliding-board button')
        .evaluateAll((buttons) =>
          buttons.findIndex((button) => (button as HTMLButtonElement).disabled),
        )
      const cell = neighbor(empty, empty % 4 === 3 ? 'left' : 'right', 4)!
      await page.locator('.sliding-board button').nth(cell).click()
    } else
      await page.getByRole('button', { name: 'Destra', exact: true }).click()
    await page.getByRole('button', { name: 'Pausa', exact: true }).click()
    await expect(
      page.getByText('Sessione in pausa.', { exact: true }),
    ).toBeVisible()
    const time = await page.locator('.toolbar').innerText()
    await page.waitForTimeout(1100)
    expect(await page.locator('.toolbar').innerText()).toBe(time)
    await page.getByRole('button', { name: 'Riprendi', exact: true }).click()
    await expect(page.locator('.arcade-panel')).toBeVisible()
    await page.getByRole('button', { name: 'Riavvia', exact: true }).click()
    await expect(page.locator('.toolbar')).toContainText('Tempo: 0s')
    await page.screenshot({
      path: info.outputPath(`${game.id}-mobile.png`),
      fullPage: true,
    })
    expect(errors).toEqual([])
  })
}

test('Sokoban: annulla, vince da tastiera e conserva il record dopo reload', async ({
  page,
}) => {
  await page.goto('./giochi/sokoban')
  await page.getByRole('button', { name: 'Avvia', exact: true }).click()
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.arcade-score')).toContainText('Mosse: 1')
  await page.getByRole('button', { name: 'Annulla mossa', exact: true }).click()
  await expect(page.locator('.arcade-score')).toContainText('Mosse: 0')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('ArrowUp')
  await expect(
    page.getByRole('heading', { name: 'Risultato salvato' }),
  ).toBeVisible()
  await expect(page.locator('.arcade-record')).toContainText('2 mosse')
  await page.reload()
  await expect(page.locator('.arcade-record')).toContainText('2 mosse')
  await page.getByRole('link', { name: 'Progressi', exact: true }).click()
  await expect(page.getByRole('row', { name: /Sokoban 1 100/ })).toBeVisible()
})

test('Labirinto: raccoglie tutte le chiavi e raggiunge l’uscita', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.37
  })
  await page.goto('./giochi/maze')
  await page.getByRole('button', { name: 'Avvia', exact: true }).click()
  let state = createGrid('maze', 'easy', () => 0.37)
  for (const goal of [...state.goals, state.food]) {
    const queue = [{ cell: state.player, path: [] as Direction[] }],
      seen = new Set([state.player])
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index]
      if (current.cell === goal) {
        for (const direction of current.path) {
          await page.keyboard.press(keys[direction])
          state = moveGrid(state, direction)
        }
        break
      }
      for (const direction of Object.keys(vectors) as Direction[]) {
        const cell = neighbor(current.cell, direction, state.size)
        if (cell !== null && !state.walls.includes(cell) && !seen.has(cell)) {
          seen.add(cell)
          queue.push({ cell, path: [...current.path, direction] })
        }
      }
    }
  }
  await expect(
    page.getByRole('heading', { name: 'Risultato salvato' }),
  ).toBeVisible()
  await expect(
    page.getByText('Obiettivo raggiunto!', { exact: false }),
  ).toBeVisible()
})

test('Snake: collisione termina la partita e salva una sola sessione', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('./giochi/snake')
  await page.getByRole('button', { name: 'Avvia', exact: true }).click()
  await page.clock.runFor(2000)
  await expect(
    page.getByRole('heading', { name: 'Risultato salvato' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Progressi', exact: true }).click()
  await expect(page.getByRole('row', { name: /Snake 1 / })).toBeVisible()
})

test('Blocchi cadenti: drop fino al game over salva il risultato', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.2
  })
  await page.clock.install()
  await page.goto('./giochi/falling-blocks')
  await page.getByRole('button', { name: 'Avvia', exact: true }).click()
  for (let index = 0; index < 8; index++)
    await page
      .getByRole('button', { name: 'Lascia cadere', exact: true })
      .click()
  await expect(
    page.getByRole('heading', { name: 'Risultato salvato' }),
  ).toBeVisible()
})

test('Puzzle 15: ricompone le tessere con mosse reali', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.25
  })
  await page.goto('./giochi/puzzle-15')
  await page.getByRole('button', { name: 'Avvia', exact: true }).click()
  let blank = 15,
    previous = -1
  const path: Direction[] = [],
    inverse: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    }
  for (let step = 0; step < 30; step++) {
    const options = (Object.keys(vectors) as Direction[])
      .map((direction) => ({ direction, cell: neighbor(blank, direction, 4) }))
      .filter((pair) => pair.cell !== null && pair.cell !== previous)
    const chosen = options[Math.floor(0.25 * options.length)]
    previous = blank
    blank = chosen.cell!
    path.push(inverse[chosen.direction])
  }
  for (const direction of path.reverse())
    await page.keyboard.press(keys[direction])
  await expect(
    page.getByRole('heading', { name: 'Risultato salvato' }),
  ).toBeVisible()
  await expect(page.locator('.arcade-record')).toContainText('mosse')
})

test('fallback Pages conserva il sottopercorso e carica Arcade', async ({
  page,
}) => {
  await page.goto('./?p=%2Fgiochi%2Fsnake')
  await expect(
    page.getByRole('heading', { name: 'Snake', exact: true }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/Brain-Training-Suite\/giochi\/snake$/)
})

test('catalogo separa dieci allenamenti e otto Arcade', async ({ page }) => {
  await page.goto('./giochi')
  await expect(
    page.getByRole('region', { name: 'Arcade', exact: true }).locator('a'),
  ).toHaveCount(8)
  await expect(
    page.getByRole('region', { name: 'Allenamento', exact: true }).locator('a'),
  ).toHaveCount(10)
})

for (const id of ['breakout', 'space-shooter', 'asteroids']) {
  test(`${id}: controllo continuo da tastiera e pausa ferma la tavola`, async ({
    page,
  }) => {
    await page.clock.install()
    await page.goto(`./giochi/${id}`)
    await page.getByRole('button', { name: 'Avvia', exact: true }).click()
    const screen = page.locator('.arcade-screen')
    await screen.focus()
    const before = await screen.innerHTML()
    await page.keyboard.down('ArrowRight')
    if (id !== 'breakout') await page.keyboard.down('Space')
    await page.clock.runFor(300)
    await page.keyboard.up('ArrowRight')
    if (id !== 'breakout') await page.keyboard.up('Space')
    expect(await screen.innerHTML()).not.toBe(before)
    await page.getByRole('button', { name: 'Pausa', exact: true }).click()
    await page.clock.runFor(5000)
    await expect(
      page.getByText('Sessione in pausa.', { exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Riprendi', exact: true }).click()
    await expect(screen).toBeVisible()
  })
}
