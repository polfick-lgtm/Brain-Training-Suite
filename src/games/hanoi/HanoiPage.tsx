import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTrainingStore } from '../../storage/useTrainingStore'
import { useSessionPlanStore } from '../../features/sessions/useSessionPlanStore'
import { canMove, initialPegs, minimumMoves, moveDisk } from './hanoiEngine'

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function HanoiPage() {
  const preferredLevel = useTrainingStore(
    (state) => state.profile.preferredLevel,
  )
  const addSession = useTrainingStore((s) => s.addSession)
  const completeSessionGame = useSessionPlanStore((state) => state.completeGame)
  const [disks, setDisks] = useState(preferredLevel)
  const [pegs, setPegs] = useState(() => initialPegs(preferredLevel))
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [started, setStarted] = useState(false)
  const completedRef = useRef(false)
  const minimum = useMemo(() => minimumMoves(disks), [disks])

  useEffect(() => {
    if (!started) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [started])
  useEffect(() => {
    if (pegs[2].length !== disks || completedRef.current) return
    completedRef.current = true
    setStarted(false)
    const efficiency = Math.round((minimum / Math.max(moves, minimum)) * 100)
    addSession({
      id: crypto.randomUUID(),
      gameId: 'hanoi',
      difficulty: disks <= 4 ? 'easy' : disks <= 6 ? 'medium' : 'hard',
      startedAt: new Date(Date.now() - seconds * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSeconds: seconds,
      score: efficiency,
      accuracy: 100,
      errors: Math.max(0, moves - minimum),
      completed: true,
      details: { disks, moves, minimumMoves: minimum },
    })
    completeSessionGame('hanoi')
    window.alert(
      `Complimenti! Hai completato il gioco in ${moves} mosse e ${formatTime(seconds)}.`,
    )
  }, [pegs, disks, moves, seconds, minimum, addSession, completeSessionGame])

  function reset(nextDisks = disks) {
    setDisks(nextDisks)
    setPegs(initialPegs(nextDisks))
    setSelected(null)
    setMoves(0)
    setSeconds(0)
    setStarted(false)
    completedRef.current = false
  }
  function clickPeg(index: number) {
    if (completedRef.current) return
    if (!started) setStarted(true)
    if (selected === null) {
      if (pegs[index].length) setSelected(index)
      return
    }
    if (selected === index) {
      setSelected(null)
      return
    }
    if (canMove(pegs, selected, index)) {
      setPegs(moveDisk(pegs, selected, index))
      setMoves((m) => m + 1)
    }
    setSelected(null)
  }

  return (
    <>
      <header className="page-header">
        <div>
          <Link to="/" className="back-link">
            ← Torna alla home
          </Link>
          <p className="eyebrow">Logica e pianificazione</p>
          <h1>Torre di Hanoi</h1>
          <p>Sposta tutti i dischi sul piolo destro rispettando le regole.</p>
        </div>
      </header>
      <section className="toolbar">
        <label>
          Dischi
          <select value={disks} onChange={(e) => reset(Number(e.target.value))}>
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button className="button primary" onClick={() => reset()}>
          Nuova partita
        </button>
      </section>
      <section className="hanoi-stats">
        <div>
          <span>Mosse</span>
          <strong>{moves}</strong>
        </div>
        <div>
          <span>Tempo</span>
          <strong>{formatTime(seconds)}</strong>
        </div>
        <div>
          <span>Minimo</span>
          <strong>{minimum}</strong>
        </div>
      </section>
      <section className="hanoi-board">
        {pegs.map((peg, pegIndex) => (
          <button
            key={pegIndex}
            className={`hanoi-peg ${selected === pegIndex ? 'selected' : ''}`}
            onClick={() => clickPeg(pegIndex)}
            aria-label={`Piolo ${pegIndex + 1}`}
          >
            <span className="rod" />
            <span className="base" />
            <span className="disk-stack">
              {peg.map((size) => (
                <span
                  key={size}
                  className="disk"
                  style={{ width: `${28 + (size / disks) * 68}%` }}
                />
              ))}
            </span>
          </button>
        ))}
      </section>
      <p className="game-help">
        Tocca prima il piolo di partenza e poi quello di destinazione.
      </p>
    </>
  )
}
