import { useEffect, useMemo, useRef, useState } from 'react'
import { ArcadeId, DifficultyLevel } from '../../core/games/types'
import { GraphicalFrame } from '../shared/GraphicalFrame'
import { useGraphicalSession } from '../shared/useGraphicalSession'
import { useTrainingStore } from '../../storage/useTrainingStore'
import { arcadeDefinitions } from './catalog'
import {
  createGrid,
  Direction,
  GridKind,
  GridState,
  moveGrid,
  slideTile,
  stepSnake,
} from './gridEngine'
import { BlocksState, createBlocks, dropBlock, moveBlock } from './blocksEngine'
import {
  ActionKind,
  clamp,
  Controls,
  createAction,
  noControls,
  stepAction,
} from './actionEngine'

const directions: Direction[] = ['up', 'left', 'down', 'right']
const arrows: Record<Direction, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}
const names: Record<Direction, string> = {
  up: 'Su',
  down: 'Giù',
  left: 'Sinistra',
  right: 'Destra',
}
const keyDirection: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
}
type Session = ReturnType<typeof useGraphicalSession>

function useAutoPause(session: Session) {
  const { status, setStatus } = session
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && status === 'running') setStatus('paused')
    }
    document.addEventListener('visibilitychange', hidden)
    return () => document.removeEventListener('visibilitychange', hidden)
  }, [status, setStatus])
}
function ArcadeRecord({
  id,
  difficulty,
}: {
  id: ArcadeId
  difficulty: DifficultyLevel
}) {
  const sessions = useTrainingStore((store) => store.sessions)
  const record = useMemo(() => {
    const entries = sessions.filter(
      (entry) => entry.gameId === id && entry.difficulty === difficulty,
    )
    if (id === 'sokoban' || id === 'puzzle-15') {
      const wins = entries.filter(
        (entry) =>
          entry.score === 100 && typeof entry.details.moves === 'number',
      )
      return wins.length
        ? `${Math.min(...wins.map((entry) => Number(entry.details.moves)))} mosse`
        : '—'
    }
    return entries.length
      ? `${Math.max(...entries.map((entry) => Number(entry.details.arcadePoints ?? entry.details.points ?? 0)))} punti`
      : '—'
  }, [sessions, id, difficulty])
  return (
    <p className="arcade-record">
      Record locale per questa difficoltà: <strong>{record}</strong>
    </p>
  )
}
function useKeys(
  active: boolean,
  action: (direction: Direction | 'fire') => void,
) {
  const actionRef = useRef(action)
  actionRef.current = action
  useEffect(() => {
    if (!active) return
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input,select,textarea'))
        return
      if (
        event.code === 'Space' &&
        (event.target as HTMLElement)?.closest('button')
      )
        return
      const direction =
        keyDirection[event.key] ?? (event.code === 'Space' ? 'fire' : null)
      if (direction) {
        event.preventDefault()
        // Hard-drop / fire must not repeat: OS keydown auto-repeat would
        // lock pieces (or spam fire) while Space is held.
        if (event.repeat && direction === 'fire') return
        actionRef.current(direction)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [active])
}
function Pad({ onMove }: { onMove: (direction: Direction) => void }) {
  return (
    <div className="arcade-pad" aria-label="Comandi direzionali">
      {directions.map((direction) => (
        <button
          key={direction}
          className={`pad-${direction}`}
          aria-label={names[direction]}
          onClick={() => onMove(direction)}
        >
          {arrows[direction]}
        </button>
      ))}
    </div>
  )
}
function ArcadeScore({
  points,
  target,
  moves,
}: {
  points: number
  target: number
  moves?: number
}) {
  return (
    <p className="arcade-score" aria-live="off">
      Obiettivo:{' '}
      <strong>
        {points}/{target}
      </strong>
      {moves !== undefined ? ` · Mosse: ${moves}` : ''}
    </p>
  )
}

export function GridArcadePage({ kind }: { kind: GridKind }) {
  const session = useGraphicalSession(kind)
  const [state, setState] = useState(() => createGrid(kind, 'easy'))
  const stateRef = useRef(state)
  stateRef.current = state
  const history = useRef<GridState[]>([])
  const meta = arcadeDefinitions.find((game) => game.id === kind)!
  useAutoPause(session)
  function apply(next: GridState) {
    stateRef.current = next
    setState(next)
  }
  function start() {
    history.current = []
    apply(createGrid(kind, session.difficulty))
    session.start()
  }
  function move(direction: Direction) {
    if (session.status !== 'running') return
    const current = stateRef.current,
      next = moveGrid(current, direction)
    if (next !== current && kind === 'sokoban') history.current.push(current)
    apply(next)
  }
  useKeys(session.status === 'running', (direction) => {
    if (direction !== 'fire') move(direction)
  })
  useEffect(() => {
    if (kind !== 'snake' || session.status !== 'running') return
    const delay =
      session.difficulty === 'easy'
        ? 240
        : session.difficulty === 'medium'
          ? 170
          : 110
    const timer = window.setInterval(
      () => apply(stepSnake(stateRef.current)),
      delay,
    )
    return () => window.clearInterval(timer)
  }, [kind, session.status, session.difficulty])
  useEffect(() => {
    if (state.over && session.status === 'running')
      session.finish(
        state.won ? 100 : Math.round((state.points / state.target) * 100),
        state.won ? 0 : 1,
        { points: state.points, target: state.target, moves: state.moves },
      )
  }, [state, session])
  const cells = Array.from(
    { length: state.size * state.size },
    (_, index) => index,
  )
  return (
    <>
      <ArcadeRecord id={kind} difficulty={session.difficulty} />
      <GraphicalFrame
        title={meta.title}
        instructions={meta.instructions}
        session={session}
        onStart={start}
      >
        <section className="panel arcade-panel">
          <ArcadeScore
            points={state.points}
            target={state.target}
            moves={state.moves}
          />
          {kind === 'puzzle-15' ? (
            <div
              className="sliding-board"
              role="group"
              aria-label="Tessere del Puzzle 15"
            >
              {state.tiles.map((value, cell) => (
                <button
                  key={cell}
                  disabled={!value}
                  aria-label={value ? `Tessera ${value}` : 'Spazio vuoto'}
                  className={value ? 'sliding-tile' : 'sliding-empty'}
                  onClick={() => {
                    if (session.status === 'running')
                      apply(slideTile(stateRef.current, cell))
                  }}
                >
                  {value || ''}
                </button>
              ))}
            </div>
          ) : (
            <svg
              className="arcade-screen"
              viewBox={`0 0 ${state.size * 32} ${state.size * 32}`}
              role="img"
              aria-label={`${meta.title}: tavola di gioco`}
            >
              <rect width="100%" height="100%" fill="#081a29" />
              {cells.map((cell) => {
                const x = (cell % state.size) * 32,
                  y = Math.floor(cell / state.size) * 32
                if (state.walls.includes(cell))
                  return (
                    <rect
                      key={cell}
                      x={x + 1}
                      y={y + 1}
                      width="30"
                      height="30"
                      rx="4"
                      fill="#315878"
                    />
                  )
                return (
                  <rect
                    key={cell}
                    x={x}
                    y={y}
                    width="32"
                    height="32"
                    fill="none"
                    stroke="#142d40"
                  />
                )
              })}
              {state.goals.map((cell) => (
                <text
                  key={`goal-${cell}`}
                  x={(cell % state.size) * 32 + 16}
                  y={Math.floor(cell / state.size) * 32 + 24}
                  textAnchor="middle"
                  fill="#ffd84a"
                  fontSize="23"
                >
                  {kind === 'sokoban' ? '◇' : '★'}
                </text>
              ))}
              {state.crates.map((cell) => (
                <g key={`crate-${cell}`}>
                  <rect
                    x={(cell % state.size) * 32 + 4}
                    y={Math.floor(cell / state.size) * 32 + 4}
                    width="24"
                    height="24"
                    rx="4"
                    fill={state.goals.includes(cell) ? '#3ad7a2' : '#de8b38'}
                  />
                  <text
                    x={(cell % state.size) * 32 + 16}
                    y={Math.floor(cell / state.size) * 32 + 24}
                    textAnchor="middle"
                    fill="#132435"
                  >
                    ×
                  </text>
                </g>
              ))}
              {state.food >= 0 && (
                <text
                  x={(state.food % state.size) * 32 + 16}
                  y={Math.floor(state.food / state.size) * 32 + 24}
                  textAnchor="middle"
                  fill={kind === 'maze' ? '#3ad7a2' : '#ffd84a'}
                  fontSize="24"
                >
                  {kind === 'maze' ? '⚑' : '★'}
                </text>
              )}
              {kind === 'snake' ? (
                state.snake.map((cell, index) => (
                  <rect
                    key={`snake-${index}`}
                    x={(cell % state.size) * 32 + 3}
                    y={Math.floor(cell / state.size) * 32 + 3}
                    width="26"
                    height="26"
                    rx="8"
                    fill={index === 0 ? '#e9ffe9' : '#3ad7a2'}
                  />
                ))
              ) : (
                <circle
                  cx={(state.player % state.size) * 32 + 16}
                  cy={Math.floor(state.player / state.size) * 32 + 16}
                  r="10"
                  fill="#60c5ff"
                />
              )}
            </svg>
          )}
          <Pad onMove={move} />
          {kind === 'sokoban' && (
            <button
              className="button ghost"
              disabled={!history.current.length}
              onClick={() => {
                const previous = history.current.pop()
                if (previous) apply(previous)
              }}
            >
              Annulla mossa
            </button>
          )}
          <p role="status">
            {kind === 'snake'
              ? 'Raccogli le stelle e proteggi la coda.'
              : kind === 'maze'
                ? `${state.goals.length} stelle ancora da raccogliere.`
                : kind === 'sokoban'
                  ? 'Porta tutte le casse sui rombi.'
                  : 'Ordine obiettivo: 1–15, spazio vuoto in basso a destra.'}
          </p>
        </section>
      </GraphicalFrame>
      {session.status === 'completed' && (
        <p className="panel" role="status">
          {state.won ? 'Obiettivo raggiunto!' : 'Partita terminata.'} Risultato:{' '}
          {state.points}/{state.target} · Mosse: {state.moves}
        </p>
      )}
    </>
  )
}

export function BlocksArcadePage() {
  const session = useGraphicalSession('falling-blocks')
  const [state, setState] = useState(() => createBlocks('easy'))
  const stateRef = useRef(state)
  stateRef.current = state
  const meta = arcadeDefinitions.find((game) => game.id === 'falling-blocks')!
  useAutoPause(session)
  function apply(next: BlocksState) {
    stateRef.current = next
    setState(next)
  }
  function action(direction: Direction | 'fire') {
    if (session.status !== 'running') return
    apply(
      direction === 'down' || direction === 'fire'
        ? dropBlock(stateRef.current, direction === 'fire')
        : moveBlock(
            stateRef.current,
            direction === 'up' ? 'rotate' : direction,
          ),
    )
  }
  useKeys(session.status === 'running', action)
  useEffect(() => {
    if (session.status !== 'running') return
    const timer = window.setInterval(
      () => apply(dropBlock(stateRef.current)),
      session.difficulty === 'easy'
        ? 750
        : session.difficulty === 'medium'
          ? 500
          : 300,
    )
    return () => window.clearInterval(timer)
  }, [session.status, session.difficulty])
  useEffect(() => {
    if (state.over && session.status === 'running')
      session.finish(
        Math.min(100, Math.round((state.lines / state.target) * 100)),
        state.won ? 0 : 1,
        { lines: state.lines, arcadePoints: state.points },
      )
  }, [state, session])
  const colors = [
    '#0e2334',
    '#59c7ff',
    '#ffd84a',
    '#bba4ff',
    '#3ad7a2',
    '#fd936c',
    '#f086c5',
    '#cadbff',
  ]
  const display = state.board.map((row) => [...row])
  state.shape.forEach((row, sy) =>
    row.forEach((filled, sx) => {
      if (filled && display[state.y + sy])
        display[state.y + sy][state.x + sx] = state.color
    }),
  )
  return (
    <>
      <ArcadeRecord id="falling-blocks" difficulty={session.difficulty} />
      <GraphicalFrame
        title={meta.title}
        instructions={meta.instructions}
        session={session}
        onStart={() => {
          apply(createBlocks(session.difficulty))
          session.start()
        }}
      >
        <section className="panel arcade-panel">
          <ArcadeScore points={state.lines} target={state.target} />
          <p>Punti Arcade: {state.points}</p>
          <svg
            className="arcade-screen blocks-screen"
            viewBox="0 0 200 320"
            role="img"
            aria-label="Blocchi cadenti: tavola di gioco"
          >
            {display.flatMap((row, y) =>
              row.map((value, x) => (
                <rect
                  key={`${x}-${y}`}
                  x={x * 20 + 1}
                  y={y * 20 + 1}
                  width="18"
                  height="18"
                  rx="3"
                  fill={colors[value]}
                />
              )),
            )}
          </svg>
          <Pad onMove={action} />
          <button className="button primary" onClick={() => action('fire')}>
            Lascia cadere
          </button>
          <p role="status">Completa righe intere senza riempire la tavola.</p>
        </section>
      </GraphicalFrame>
      {session.status === 'completed' && (
        <p className="panel">
          {state.won ? 'Obiettivo raggiunto!' : 'Tavola piena.'} Righe:{' '}
          {state.lines} · Punti Arcade: {state.points}
        </p>
      )}
    </>
  )
}

export function ActionArcadePage({ kind }: { kind: ActionKind }) {
  const session = useGraphicalSession(kind)
  const [state, setState] = useState(() => createAction(kind, 'easy'))
  const stateRef = useRef(state)
  stateRef.current = state
  const controls = useRef<Controls>({ ...noControls })
  const screenRef = useRef<SVGSVGElement>(null)
  const meta = arcadeDefinitions.find((game) => game.id === kind)!
  const soundEnabled = useTrainingStore((store) => store.settings.sounds)
  const audio = useRef<AudioContext | null>(null)
  const playedPoints = useRef(0)
  useAutoPause(session)
  useEffect(
    () => () => {
      void audio.current?.close()
    },
    [],
  )
  useEffect(() => {
    if (state.points <= playedPoints.current) {
      playedPoints.current = state.points
      return
    }
    playedPoints.current = state.points
    if (!soundEnabled || !audio.current || audio.current.state !== 'running')
      return
    const context = audio.current,
      oscillator = context.createOscillator(),
      gain = context.createGain()
    oscillator.frequency.value = 520
    gain.gain.setValueAtTime(0.04, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.07)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.08)
  }, [state.points, soundEnabled])
  function start() {
    controls.current = { ...noControls }
    playedPoints.current = 0
    const next = createAction(kind, session.difficulty)
    stateRef.current = next
    setState(next)
    session.start()
    if (soundEnabled && typeof AudioContext !== 'undefined') {
      audio.current ??= new AudioContext()
      void audio.current.resume().catch(() => undefined)
    }
  }
  useEffect(() => {
    if (session.status !== 'running') {
      controls.current = { ...noControls }
      return
    }
    screenRef.current?.focus({ preventScroll: true })
    let frame = 0,
      previous = 0
    const animate = (time: number) => {
      const dt = previous ? (time - previous) / 1000 : 1 / 60
      previous = time
      const next = stepAction(stateRef.current, controls.current, dt)
      stateRef.current = next
      setState(next)
      if (!next.over) frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [session.status])
  useEffect(() => {
    if (session.status !== 'running') return
    const update = (event: KeyboardEvent, held: boolean) => {
      if ((event.target as HTMLElement)?.closest('input,select,textarea'))
        return
      if (
        event.code === 'Space' &&
        (event.target as HTMLElement)?.closest('button:not(.arcade-control)')
      )
        return
      const direction =
        keyDirection[event.key] ?? (event.code === 'Space' ? 'fire' : null)
      if (direction && direction !== 'down') {
        event.preventDefault()
        controls.current[direction] = held
      }
    }
    const down = (event: KeyboardEvent) => update(event, true),
      up = (event: KeyboardEvent) => update(event, false)
    const blur = () => {
      controls.current = { ...noControls }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [session.status])
  useEffect(() => {
    if (state.over && session.status === 'running')
      session.finish(
        Math.min(100, Math.round((state.points / state.target) * 100)),
        Math.max(0, 3 - state.lives),
        {
          arcadePoints: state.points,
          target: state.target,
          lives: Math.max(0, state.lives),
        },
      )
  }, [state, session])
  function heldButton(
    control: 'left' | 'right' | 'up' | 'fire',
    title: string,
  ) {
    return (
      <button
        className="arcade-control"
        key={control}
        aria-label={title}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          controls.current[control] = true
        }}
        onPointerUp={() => {
          controls.current[control] = false
        }}
        onPointerCancel={() => {
          controls.current[control] = false
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') controls.current[control] = true
        }}
        onKeyUp={() => {
          controls.current[control] = false
        }}
        onBlur={() => {
          controls.current[control] = false
        }}
      >
        {title}
      </button>
    )
  }
  return (
    <>
      <ArcadeRecord id={kind} difficulty={session.difficulty} />
      <GraphicalFrame
        title={meta.title}
        instructions={meta.instructions}
        session={session}
        onStart={start}
      >
        <section className="panel arcade-panel">
          <ArcadeScore points={state.points} target={state.target} />
          <p>Vite: {Math.max(0, state.lives)} · Limite: 180s</p>
          <svg
            className="arcade-screen"
            ref={screenRef}
            tabIndex={0}
            viewBox="0 0 400 400"
            role="img"
            aria-label={`${meta.title}: tavola di gioco`}
            onPointerMove={(event) => {
              if (kind === 'breakout') {
                const rect = event.currentTarget.getBoundingClientRect()
                stateRef.current = {
                  ...stateRef.current,
                  playerX: clamp(
                    ((event.clientX - rect.left) / rect.width) * 400,
                    38,
                    362,
                  ),
                }
              }
            }}
          >
            <rect width="400" height="400" fill="#081a29" />
            {Array.from({ length: 20 }, (_, index) => (
              <circle
                key={`star-${index}`}
                cx={(index * 73 + 20) % 400}
                cy={(index * 117 + 30) % 400}
                r="1"
                fill="#829ab1"
              />
            ))}
            {kind === 'breakout' ? (
              <>
                {state.bricks.map((brick) => (
                  <rect
                    key={brick.id}
                    x={brick.x}
                    y={brick.y}
                    width="54"
                    height="18"
                    rx="4"
                    fill={
                      ['#59c7ff', '#ffd84a', '#bba4ff', '#fd936c', '#3ad7a2'][
                        Math.floor(brick.id / 6)
                      ]
                    }
                  />
                ))}
                <rect
                  x={state.playerX - 38}
                  y="361"
                  width="76"
                  height="10"
                  rx="5"
                  fill="#3ad7a2"
                />
                <circle cx={state.ball.x} cy={state.ball.y} r="6" fill="#fff" />
              </>
            ) : (
              <>
                <polygon
                  points="0,-14 11,11 0,6 -11,11"
                  transform={`translate(${state.playerX} ${state.playerY}) rotate(${kind === 'asteroids' ? (state.angle * 180) / Math.PI + 90 : 0})`}
                  fill={
                    state.shield > 0 && kind === 'asteroids'
                      ? '#ffd84a'
                      : '#3ad7a2'
                  }
                />
                {state.enemies.map((enemy) =>
                  kind === 'asteroids' ? (
                    <circle
                      key={enemy.id}
                      cx={enemy.x}
                      cy={enemy.y}
                      r={enemy.radius}
                      fill="#243e55"
                      stroke="#bba4ff"
                      strokeWidth="3"
                    />
                  ) : (
                    <path
                      key={enemy.id}
                      d="M-14,-8 L14,-8 L10,8 L0,14 L-10,8 Z"
                      transform={`translate(${enemy.x},${enemy.y})`}
                      fill="#fd936c"
                    />
                  ),
                )}
                {state.bullets.map((bullet) => (
                  <circle
                    key={bullet.id}
                    cx={bullet.x}
                    cy={bullet.y}
                    r={bullet.radius}
                    fill="#ffd84a"
                  />
                ))}
              </>
            )}
          </svg>
          <div className="arcade-action-controls">
            {heldButton('left', 'Sinistra')}
            {kind === 'asteroids' && heldButton('up', 'Motore')}
            {heldButton('right', 'Destra')}
            {kind !== 'breakout' && heldButton('fire', 'Spara')}
          </div>
          <p role="status">
            Tieni premuti i comandi. La partita si mette in pausa quando cambi
            scheda.
          </p>
        </section>
      </GraphicalFrame>
      {session.status === 'completed' && (
        <p className="panel">
          {state.won ? 'Obiettivo raggiunto!' : 'Partita terminata.'} Punti
          Arcade: {state.points} · Vite rimaste: {Math.max(0, state.lives)}
        </p>
      )}
    </>
  )
}

export function ArcadePage({ id }: { id: ArcadeId }) {
  if (id === 'snake' || id === 'maze' || id === 'sokoban' || id === 'puzzle-15')
    return <GridArcadePage kind={id} />
  if (id === 'falling-blocks') return <BlocksArcadePage />
  return <ActionArcadePage kind={id} />
}
