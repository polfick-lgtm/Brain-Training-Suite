import { describe, expect, it } from 'vitest'
import { createAction, noControls, stepAction, wrap } from './actionEngine'

describe('Arcade azione', () => {
  it('Spacca mattoni rimbalza su pareti, soffitto e racchetta', () => {
    const state = createAction('breakout', 'easy')
    expect(
      stepAction(
        { ...state, ball: { ...state.ball, x: 2, vx: -100 } },
        noControls,
        0.01,
      ).ball.vx,
    ).toBeGreaterThan(0)
    expect(
      stepAction(
        { ...state, ball: { ...state.ball, x: 399, vx: 100 } },
        noControls,
        0.01,
      ).ball.vx,
    ).toBeLessThan(0)
    expect(
      stepAction(
        { ...state, ball: { ...state.ball, y: 2, vy: -100 } },
        noControls,
        0.01,
      ).ball.vy,
    ).toBeGreaterThan(0)
    expect(
      stepAction(
        { ...state, ball: { ...state.ball, x: 200, y: 354, vy: 200 } },
        noControls,
        0.01,
      ).ball.vy,
    ).toBeLessThan(0)
  })
  it('Spacca mattoni distrugge una volta e perde vite sulle palle mancate', () => {
    const state = createAction('breakout', 'medium')
    const hit = stepAction(
      {
        ...state,
        target: 1,
        ball: { ...state.ball, x: 40, y: 43, vx: 0, vy: -100 },
      },
      noControls,
      0.01,
    )
    expect(hit.points).toBe(1)
    expect(hit.won).toBe(true)
    expect(state.bricks).toHaveLength(24)
    expect(
      stepAction(
        { ...state, lives: 1, ball: { ...state.ball, y: 412 } },
        noControls,
        0,
      ).over,
    ).toBe(true)
  })
  it('Space Shooter spara, colpisce, spawna bersagli e perde vite', () => {
    const state = createAction('space-shooter', 'hard')
    const fired = stepAction(
      state,
      { ...noControls, fire: true, right: true },
      0.02,
      () => 0.5,
    )
    expect(fired.bullets).toHaveLength(1)
    expect(fired.enemies).toHaveLength(1)
    expect(fired.playerX).toBeGreaterThan(200)
    const enemy = { id: 1, x: 100, y: 100, vx: 0, vy: 0, radius: 14, age: 0 }
    const bullet = { ...enemy, id: 2, radius: 4 }
    const hit = stepAction(
      { ...state, spawn: 1, target: 1, enemies: [enemy], bullets: [bullet] },
      noControls,
      0,
    )
    expect(hit.points).toBe(1)
    expect(hit.won).toBe(true)
    expect(hit.bullets).toHaveLength(0)
    const missed = stepAction(
      { ...state, spawn: 1, lives: 1, enemies: [{ ...enemy, y: 410 }] },
      noControls,
      0,
    )
    expect(missed.over).toBe(true)
  })
  it('Asteroidi divide rocce, consuma proiettili e protegge il respawn', () => {
    const state = createAction('asteroids', 'easy'),
      rock = state.enemies[0]
    const hit = stepAction(
      { ...state, enemies: [rock], bullets: [{ ...rock, id: 9, radius: 3 }] },
      noControls,
      0,
    )
    expect(hit.enemies).toHaveLength(2)
    expect(hit.enemies.every((e) => e.radius === 12)).toBe(true)
    expect(hit.points).toBe(1)
    const collision = {
      ...state,
      shield: 0,
      enemies: [{ ...rock, x: 200, y: 200 }],
    }
    const respawn = stepAction(collision, noControls, 0)
    expect(respawn.lives).toBe(2)
    expect(respawn.shield).toBe(2)
    expect(stepAction(respawn, noControls, 0).lives).toBe(2)
    const smallHit = stepAction(
      {
        ...state,
        target: 1,
        enemies: [{ ...rock, radius: 12 }],
        bullets: [{ ...rock, id: 9, radius: 3 }],
      },
      noControls,
      0,
    )
    expect(smallHit.enemies).toHaveLength(0)
    expect(smallHit.won).toBe(true)
  })
  it('Asteroidi accelera, ruota, spara e riappare dai bordi', () => {
    const state = createAction('asteroids', 'hard')
    const next = stepAction(
      { ...state, playerX: 399, vx: 200 },
      { left: true, right: false, up: true, fire: true },
      0.02,
    )
    expect(next.playerX).toBeLessThan(10)
    expect(next.angle).toBeLessThan(state.angle)
    expect(next.bullets).toHaveLength(1)
    expect(wrap(-1)).toBe(399)
    const capped = stepAction({ ...state, vx: 500, vy: 500 }, noControls, 2)
    expect(Math.hypot(capped.vx, capped.vy)).toBeLessThanOrEqual(230.0001)
  })
  it('termina al limite di tempo e ignora tick dopo fine partita', () => {
    const state = createAction('space-shooter', 'easy')
    const over = stepAction({ ...state, elapsed: 180 }, noControls, 0)
    expect(over.over).toBe(true)
    expect(stepAction(over, noControls, 1)).toBe(over)
  })
})
