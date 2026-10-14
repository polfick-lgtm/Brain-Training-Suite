import { useState } from 'react'
import { GraphicalFrame } from '../shared/GraphicalFrame'
import {
  BallBoard,
  boardKey,
  londonChallenges,
  londonStart,
  moveBall,
  pegCapacity,
} from '../shared/graphicalEngine'
import { useGraphicalSession } from '../shared/useGraphicalSession'

const colors = ['Rosso', 'Blu', 'Verde']
const challenges = londonChallenges()

export function TowerOfLondonPage() {
  const session = useGraphicalSession('tower-of-london')
  const [board, setBoard] = useState<BallBoard>(londonStart)
  const [goal, setGoal] = useState(challenges[0])
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [errors, setErrors] = useState(0)
  const [message, setMessage] = useState('')
  function start() {
    const distance =
      session.difficulty === 'easy'
        ? 2
        : session.difficulty === 'medium'
          ? 4
          : 6
    const candidates = challenges.filter((entry) => entry.minimum === distance)
    setGoal(
      candidates[Math.floor(Math.random() * candidates.length)] ??
        challenges[challenges.length - 1],
    )
    setBoard(londonStart.map((peg) => [...peg]))
    setSelected(null)
    setMoves(0)
    setErrors(0)
    setMessage('Seleziona un’asta di partenza.')
    session.start()
  }
  function select(peg: number) {
    if (selected === null) {
      if (board[peg].length) {
        setSelected(peg)
        setMessage('Ora scegli l’asta di destinazione.')
      }
      return
    }
    if (selected === peg) {
      setSelected(null)
      return
    }
    const next = moveBall(board, selected, peg)
    setSelected(null)
    if (!next) {
      setErrors((value) => value + 1)
      setMessage('Asta piena: scegli un’altra destinazione.')
      return
    }
    const nextMoves = moves + 1
    setBoard(next)
    setMoves(nextMoves)
    setMessage('Pallina spostata.')
    if (boardKey(next) === boardKey(goal.board))
      session.finish(Math.round((goal.minimum / nextMoves) * 100), errors, {
        moves: nextMoves,
        minimumMoves: goal.minimum,
      })
  }
  function pegs(state: BallBoard, interactive: boolean) {
    return (
      <div className="london-board">
        {state.map((balls, peg) => {
          const contents = (
            <>
              <span
                className="london-rod"
                style={{ height: `${pegCapacity[peg] * 44}px` }}
              />
              <span className="london-balls">
                {balls.map((ball) => (
                  <span key={ball} className={`london-ball ball-${ball}`}>
                    {ball + 1}
                  </span>
                ))}
              </span>
              <span className="peg-caption">
                {peg + 1} · max {pegCapacity[peg]}
              </span>
            </>
          )
          return interactive ? (
            <button
              key={peg}
              className={`london-peg ${selected === peg ? 'selected' : ''}`}
              aria-pressed={selected === peg}
              aria-label={`Asta ${peg + 1}: ${balls.map((ball) => colors[ball]).join(', ') || 'vuota'}`}
              onClick={() => select(peg)}
            >
              {contents}
            </button>
          ) : (
            <div
              key={peg}
              className="london-peg"
              aria-label={`Obiettivo asta ${peg + 1}: ${balls.map((ball) => colors[ball]).join(', ') || 'vuota'}`}
            >
              {contents}
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <GraphicalFrame
      title="Torre di Londra"
      instructions="Sposta una pallina alla volta per ricreare l’obiettivo. Ogni asta ha una capacità diversa. Seleziona partenza e destinazione con touch o Tab e Invio."
      session={session}
      onStart={start}
    >
      <section className="panel graphical-board">
        <h2>Configurazione obiettivo</h2>
        {pegs(goal.board, false)}
        <h2>La tua tavola</h2>
        <p>
          Mosse: {moves} · Minimo: {goal.minimum} · Errori: {errors}
        </p>
        {pegs(board, true)}
        <p role="status">{message}</p>
      </section>
    </GraphicalFrame>
  )
}
