import { useEffect, useState } from 'react'
import { GraphicalFrame } from '../shared/GraphicalFrame'
import { checkSimon, extendSimon } from '../shared/graphicalEngine'
import { useGraphicalSession } from '../shared/useGraphicalSession'

const pads = ['Rosso', 'Blu', 'Verde', 'Giallo']
export function SimonBoardPage() {
  const session = useGraphicalSession('simon')
  const [sequence, setSequence] = useState<number[]>([])
  const [input, setInput] = useState<number[]>([])
  const [showing, setShowing] = useState(true)
  const [lit, setLit] = useState<number | null>(null)
  const [playback, setPlayback] = useState(0)
  const [message, setMessage] = useState('')
  const target =
    session.difficulty === 'easy' ? 3 : session.difficulty === 'medium' ? 5 : 7
  useEffect(() => {
    if (session.status !== 'running') {
      setLit(null)
      return
    }
    if (!showing) return
    setInput([])
    setMessage('Osserva la sequenza luminosa.')
    const delay = session.difficulty === 'hard' ? 500 : 750
    const timers: number[] = []
    sequence.forEach((pad, index) => {
      timers.push(window.setTimeout(() => setLit(pad), 300 + index * delay))
      timers.push(
        window.setTimeout(
          () => setLit(null),
          300 + index * delay + delay * 0.65,
        ),
      )
    })
    timers.push(
      window.setTimeout(
        () => {
          setShowing(false)
          setMessage('Tocca i pulsanti nello stesso ordine.')
        },
        300 + sequence.length * delay,
      ),
    )
    return () => timers.forEach(window.clearTimeout)
  }, [session.status, session.difficulty, sequence, showing, playback])
  function start() {
    setSequence(extendSimon([]))
    setInput([])
    setLit(null)
    setShowing(true)
    setMessage('')
    session.start()
  }
  function choose(pad: number) {
    if (session.status !== 'running' || showing) return
    const next = [...input, pad]
    const result = checkSimon(sequence, next)
    setInput(next)
    if (result === 'wrong') {
      session.finish(Math.round(((sequence.length - 1) / target) * 100), 1, {
        longestSequence: sequence.length - 1,
      })
      return
    }
    if (result === 'complete') {
      if (sequence.length === target)
        session.finish(100, 0, { longestSequence: target })
      else {
        setSequence(extendSimon(sequence))
        setShowing(true)
      }
    }
  }
  useEffect(() => {
    if (session.status === 'paused') setShowing(true)
  }, [session.status])
  return (
    <GraphicalFrame
      title="Simon"
      instructions="Osserva i pulsanti illuminarsi, poi ripeti la sequenza. Ogni livello aggiunge un colore; i numeri distinguono i pulsanti anche senza colore."
      session={session}
      onStart={start}
    >
      <section className="panel graphical-board">
        <p>
          Livello: {sequence.length}/{target} · Risposte: {input.length}/
          {sequence.length}
        </p>
        <div className="simon-board">
          {pads.map((name, index) => (
            <button
              key={name}
              className={`simon-pad pad-${index} ${lit === index ? 'lit' : ''}`}
              disabled={showing}
              aria-label={`${index + 1} ${name}`}
              onClick={() => choose(index)}
            >
              <strong>{index + 1}</strong>
              <span>{name}</span>
              {lit === index && <span>●</span>}
            </button>
          ))}
        </div>
        <button
          className="button ghost"
          disabled={showing}
          onClick={() => {
            setShowing(true)
            setPlayback((value) => value + 1)
          }}
        >
          Rivedi sequenza
        </button>
        <p role="status">
          {message}
          {lit !== null ? ` ${pads[lit]}.` : ''}
        </p>
      </section>
    </GraphicalFrame>
  )
}
