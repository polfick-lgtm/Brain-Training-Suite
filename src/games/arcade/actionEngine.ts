import { DifficultyLevel } from '../../core/games/types'

export type Entity = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  age: number
}
export type Controls = {
  left: boolean
  right: boolean
  up: boolean
  fire: boolean
}
export const noControls: Controls = {
  left: false,
  right: false,
  up: false,
  fire: false,
}
export type ActionKind = 'breakout' | 'space-shooter' | 'asteroids'
export type ActionState = {
  kind: ActionKind
  playerX: number
  playerY: number
  angle: number
  vx: number
  vy: number
  ball: Entity
  enemies: Entity[]
  bullets: Entity[]
  bricks: { id: number; x: number; y: number }[]
  lives: number
  points: number
  target: number
  elapsed: number
  spawn: number
  cooldown: number
  shield: number
  nextId: number
  speed: number
  over: boolean
  won: boolean
}
export const wrap = (value: number): number => ((value % 400) + 400) % 400
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))
export function touches(
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number },
): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius
}
export function createAction(
  kind: ActionKind,
  difficulty: DifficultyLevel,
): ActionState {
  const level = difficulty === 'easy' ? 0 : difficulty === 'medium' ? 1 : 2
  const bricks = Array.from({ length: (3 + level) * 6 }, (_, id) => ({
    id,
    x: 20 + (id % 6) * 60,
    y: 40 + Math.floor(id / 6) * 24,
  }))
  const enemies =
    kind === 'asteroids'
      ? Array.from({ length: 4 + level }, (_, id) => ({
          id,
          x: 35 + id * 65,
          y: 35 + (id % 2) * 300,
          vx: (id % 2 ? -1 : 1) * (25 + level * 10),
          vy: 25 + id * 7,
          radius: 25,
          age: 0,
        }))
      : []
  return {
    kind,
    playerX: 200,
    playerY: kind === 'asteroids' ? 200 : 365,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    ball: {
      id: 0,
      x: 200,
      y: 320,
      vx: 100 + level * 20,
      vy: -175 - level * 25,
      radius: 6,
      age: 0,
    },
    enemies,
    bullets: [],
    bricks,
    lives: 3,
    points: 0,
    target:
      kind === 'breakout'
        ? bricks.length
        : kind === 'asteroids'
          ? enemies.length * 3
          : 12 + level * 6,
    elapsed: 0,
    spawn: 0,
    cooldown: 0,
    shield: 2,
    nextId: 100,
    speed: 1 + level * 0.25,
    over: false,
    won: false,
  }
}
export function stepAction(
  original: ActionState,
  controls: Controls,
  dt: number,
  random = Math.random,
): ActionState {
  if (original.over) return original
  // Cap integration step to avoid tunneling after background-tab delays.
  dt = Math.min(Math.max(dt, 0), 0.025)
  const state: ActionState = {
    ...original,
    ball: { ...original.ball },
    enemies: original.enemies.map((e) => ({ ...e })),
    bullets: original.bullets.map((e) => ({ ...e })),
    bricks: [...original.bricks],
    elapsed: original.elapsed + dt,
    cooldown: Math.max(0, original.cooldown - dt),
    shield: Math.max(0, original.shield - dt),
  }
  if (state.kind === 'breakout') {
    state.playerX = clamp(
      state.playerX +
        (Number(controls.right) - Number(controls.left)) * 280 * dt,
      38,
      362,
    )
    const ball = state.ball,
      oldY = ball.y
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt
    if (ball.x < 6) {
      ball.x = 6
      ball.vx = Math.abs(ball.vx)
    }
    if (ball.x > 394) {
      ball.x = 394
      ball.vx = -Math.abs(ball.vx)
    }
    if (ball.y < 6) {
      ball.y = 6
      ball.vy = Math.abs(ball.vy)
    }
    if (
      ball.vy > 0 &&
      oldY <= 355 &&
      ball.y >= 355 &&
      Math.abs(ball.x - state.playerX) <= 44
    ) {
      ball.y = 354
      ball.vy = -Math.abs(ball.vy)
      ball.vx = (ball.x - state.playerX) * 4
    }
    const brick = state.bricks.find(
      (b) =>
        ball.x + 6 > b.x &&
        ball.x - 6 < b.x + 54 &&
        ball.y + 6 > b.y &&
        ball.y - 6 < b.y + 18,
    )
    if (brick) {
      state.bricks = state.bricks.filter((b) => b.id !== brick.id)
      state.points++
      ball.vy *= -1
      ball.y += Math.sign(ball.vy) * 7
    }
    if (ball.y > 410) {
      state.lives--
      state.ball = {
        ...ball,
        x: state.playerX,
        y: 320,
        vx: 100,
        vy: -180 * state.speed,
      }
    }
  } else if (state.kind === 'space-shooter') {
    state.playerX = clamp(
      state.playerX +
        (Number(controls.right) - Number(controls.left)) * 230 * dt,
      18,
      382,
    )
    state.spawn -= dt
    if (state.spawn <= 0) {
      state.enemies.push({
        id: state.nextId++,
        x: 25 + random() * 350,
        y: -16,
        vx: 0,
        vy: 65 * state.speed,
        radius: 14,
        age: 0,
      })
      state.spawn = 0.9 / state.speed
    }
    if (controls.fire && state.cooldown === 0) {
      state.bullets.push({
        id: state.nextId++,
        x: state.playerX,
        y: 345,
        vx: 0,
        vy: -330,
        radius: 4,
        age: 0,
      })
      state.cooldown = 0.2
    }
    state.enemies.forEach((e) => {
      e.y += e.vy * dt
    })
    state.bullets.forEach((e) => {
      e.y += e.vy * dt
    })
    const removed = new Set<number>(),
      used = new Set<number>()
    for (const enemy of state.enemies)
      for (const bullet of state.bullets) {
        if (
          !removed.has(enemy.id) &&
          !used.has(bullet.id) &&
          touches(enemy, bullet)
        ) {
          removed.add(enemy.id)
          used.add(bullet.id)
          state.points++
        }
      }
    for (const enemy of state.enemies) {
      if (
        !removed.has(enemy.id) &&
        (enemy.y > 400 ||
          touches(enemy, { x: state.playerX, y: 365, radius: 13 }))
      ) {
        removed.add(enemy.id)
        state.lives--
      }
    }
    state.enemies = state.enemies.filter((e) => !removed.has(e.id))
    state.bullets = state.bullets.filter((e) => !used.has(e.id) && e.y > -10)
  } else {
    state.angle += (Number(controls.right) - Number(controls.left)) * 3 * dt
    if (controls.up) {
      state.vx += Math.cos(state.angle) * 145 * dt
      state.vy += Math.sin(state.angle) * 145 * dt
    }
    const drag = Math.exp(-0.45 * dt)
    state.vx *= drag
    state.vy *= drag
    const speed = Math.hypot(state.vx, state.vy)
    if (speed > 230) {
      state.vx *= 230 / speed
      state.vy *= 230 / speed
    }
    state.playerX = wrap(state.playerX + state.vx * dt)
    state.playerY = wrap(state.playerY + state.vy * dt)
    if (controls.fire && state.cooldown === 0) {
      state.bullets.push({
        id: state.nextId++,
        x: state.playerX,
        y: state.playerY,
        vx: Math.cos(state.angle) * 310,
        vy: Math.sin(state.angle) * 310,
        radius: 3,
        age: 0,
      })
      state.cooldown = 0.22
    }
    for (const rock of state.enemies) {
      rock.x = wrap(rock.x + rock.vx * dt)
      rock.y = wrap(rock.y + rock.vy * dt)
    }
    for (const bullet of state.bullets) {
      bullet.x = wrap(bullet.x + bullet.vx * dt)
      bullet.y = wrap(bullet.y + bullet.vy * dt)
      bullet.age += dt
    }
    const removed = new Set<number>(),
      used = new Set<number>(),
      fragments: Entity[] = []
    for (const rock of state.enemies)
      for (const bullet of state.bullets) {
        if (
          !removed.has(rock.id) &&
          !used.has(bullet.id) &&
          touches(rock, bullet)
        ) {
          removed.add(rock.id)
          used.add(bullet.id)
          state.points++
          if (rock.radius > 15)
            for (const sign of [-1, 1])
              fragments.push({
                ...rock,
                id: state.nextId++,
                radius: 12,
                vx: rock.vy * sign * 1.4,
                vy: rock.vx * -sign * 1.4,
              })
        }
      }
    state.enemies = [
      ...state.enemies.filter((e) => !removed.has(e.id)),
      ...fragments,
    ]
    state.bullets = state.bullets.filter((e) => !used.has(e.id) && e.age < 1.3)
    if (
      state.shield === 0 &&
      state.enemies.some((rock) =>
        touches(rock, { x: state.playerX, y: state.playerY, radius: 10 }),
      )
    ) {
      state.lives--
      state.shield = 2
      state.playerX = 200
      state.playerY = 200
      state.vx = 0
      state.vy = 0
    }
  }
  state.won = state.points >= state.target
  state.over = state.won || state.lives <= 0 || state.elapsed >= 180
  return state
}
