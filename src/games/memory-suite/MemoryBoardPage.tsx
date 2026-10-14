import { useEffect, useState } from 'react'
import { GraphicalFrame } from '../shared/GraphicalFrame'
import { cardSymbols, shuffledPairs } from '../shared/graphicalEngine'
import { useGraphicalSession } from '../shared/useGraphicalSession'

export function MemoryBoardPage() {
  const session = useGraphicalSession('memory')
  const [cards, setCards] = useState<number[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (flipped.length !== 2 || session.status !== 'running') return
    const timer = window.setTimeout(() => setFlipped([]), 950)
    return () => window.clearTimeout(timer)
  }, [flipped, session.status])
  function start() {
    setCards(
      shuffledPairs(
        session.difficulty === 'easy'
          ? 4
          : session.difficulty === 'medium'
            ? 6
            : 8,
      ),
    )
    setFlipped([])
    setMatched([])
    setAttempts(0)
    setMessage('Trova tutte le coppie.')
    session.start()
  }
  function flip(index: number) {
    if (
      session.status !== 'running' ||
      flipped.length === 2 ||
      flipped.includes(index) ||
      matched.includes(index)
    )
      return
    const next = [...flipped, index]
    setFlipped(next)
    if (next.length < 2) return
    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    if (cards[next[0]] === cards[next[1]]) {
      const nextMatched = [...matched, ...next]
      setMatched(nextMatched)
      setFlipped([])
      setMessage('Coppia trovata!')
      if (nextMatched.length === cards.length)
        session.finish(
          Math.round((cards.length / 2 / nextAttempts) * 100),
          nextAttempts - cards.length / 2,
          { pairs: cards.length / 2, attempts: nextAttempts },
        )
    } else setMessage('Carte diverse: osserva le posizioni e riprova.')
  }
  return (
    <GraphicalFrame
      title="Memory"
      instructions="Gira due carte alla volta e trova le coppie. Usa touch, mouse oppure Tab e Invio."
      session={session}
      onStart={start}
    >
      <section className="panel graphical-board">
        <p>
          Coppie: {matched.length / 2}/{cards.length / 2} · Tentativi:{' '}
          {attempts}
        </p>
        <div className="memory-board">
          {cards.map((symbol, index) => {
            const visible = flipped.includes(index) || matched.includes(index)
            return (
              <button
                key={index}
                className={`memory-card ${visible ? 'revealed' : ''} ${matched.includes(index) ? 'matched' : ''}`}
                disabled={matched.includes(index)}
                aria-label={`Carta ${index + 1}${visible ? `: ${cardSymbols[symbol]}` : ', coperta'}`}
                aria-pressed={visible}
                onClick={() => flip(index)}
              >
                <span aria-hidden="true">
                  {visible ? cardSymbols[symbol] : '?'}
                </span>
              </button>
            )
          })}
        </div>
        <p role="status">{message}</p>
      </section>
    </GraphicalFrame>
  )
}
