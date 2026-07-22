import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DifficultyLevel } from '../../core/games/types'
import { useTrainingStore } from '../../storage/useTrainingStore'
import { useSessionPlanStore } from '../../features/sessions/useSessionPlanStore'
import {
  evaluateChoice,
  QuizGameDefinition,
  roundsForDifficulty,
  scoreQuiz,
} from './quizEngine'

type Props = { definition: QuizGameDefinition }
type GameStatus = 'idle' | 'running' | 'paused' | 'completed'

export function QuizGamePage({ definition }: Props) {
  const addSession = useTrainingStore((state) => state.addSession)
  const completeSessionGame = useSessionPlanStore((state) => state.completeGame)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy')
  const [status, setStatus] = useState<GameStatus>('idle')
  const [roundIndex, setRoundIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [errors, setErrors] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [feedback, setFeedback] = useState('')
  const startedAt = useRef('')
  const totalRounds = roundsForDifficulty(difficulty)
  const round = useMemo(
    () => definition.buildRound(roundIndex, difficulty),
    [definition, difficulty, roundIndex],
  )

  useEffect(() => {
    if (status !== 'running') return
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [status])

  function start() {
    startedAt.current = new Date().toISOString()
    setRoundIndex(0)
    setCorrect(0)
    setErrors(0)
    setSeconds(0)
    setFeedback('Sessione avviata.')
    setStatus('running')
  }

  function finish(nextCorrect: number, nextErrors: number) {
    const completedAt = new Date().toISOString()
    const score = scoreQuiz(nextCorrect, totalRounds, nextErrors)
    addSession({
      id: crypto.randomUUID(),
      gameId: definition.id,
      difficulty,
      startedAt: startedAt.current,
      completedAt,
      durationSeconds: seconds,
      score,
      accuracy: Math.round((nextCorrect / totalRounds) * 100),
      errors: nextErrors,
      completed: true,
      details: { rounds: totalRounds, correct: nextCorrect },
    })
    completeSessionGame(definition.id)
    setFeedback(`Sessione completata. Punteggio ${score} su 100.`)
    setStatus('completed')
  }

  function choose(choiceIndex: number) {
    if (status !== 'running') return
    const isCorrect = evaluateChoice(round, choiceIndex)
    const nextCorrect = correct + (isCorrect ? 1 : 0)
    const nextErrors = errors + (isCorrect ? 0 : 1)
    setCorrect(nextCorrect)
    setErrors(nextErrors)
    if (roundIndex + 1 >= totalRounds) {
      finish(nextCorrect, nextErrors)
    } else {
      setFeedback(isCorrect ? 'Risposta corretta.' : 'Risposta non corretta.')
      setRoundIndex((value) => value + 1)
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const choiceIndex = Number(event.key) - 1
      if (choiceIndex >= 0 && choiceIndex < round.choices.length)
        choose(choiceIndex)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <>
      <header className="page-header">
        <div>
          <Link to="/giochi" className="back-link">
            ← Torna ai giochi
          </Link>
          <p className="eyebrow">{definition.categoryLabel}</p>
          <h1>{definition.title}</h1>
          <p>{definition.instructions}</p>
        </div>
      </header>
      <section className="toolbar">
        <label>
          Difficoltà
          <select
            value={difficulty}
            disabled={status === 'running' || status === 'paused'}
            onChange={(event) =>
              setDifficulty(event.target.value as DifficultyLevel)
            }
          >
            <option value="easy">Facile</option>
            <option value="medium">Media</option>
            <option value="hard">Difficile</option>
          </select>
        </label>
        <button className="button primary" onClick={start}>
          {status === 'idle' ? 'Avvia' : 'Riavvia'}
        </button>
        {(status === 'running' || status === 'paused') && (
          <button
            className="button ghost"
            onClick={() =>
              setStatus(status === 'running' ? 'paused' : 'running')
            }
          >
            {status === 'running' ? 'Pausa' : 'Riprendi'}
          </button>
        )}
      </section>
      <section className="quiz-stats" aria-label="Stato sessione">
        <span>
          Round <strong>{Math.min(roundIndex + 1, totalRounds)}</strong>/
          {totalRounds}
        </span>
        <span>
          Tempo <strong>{seconds}s</strong>
        </span>
        <span>
          Corrette <strong>{correct}</strong>
        </span>
      </section>
      <section className="panel quiz-panel" aria-live="polite">
        {status === 'idle' ? (
          <p>
            Seleziona la difficoltà e premi Avvia. Usa anche i tasti da 1 a 4.
          </p>
        ) : status === 'paused' ? (
          <p>Sessione in pausa.</p>
        ) : status === 'completed' ? (
          <div className="result-card">
            <h2>Risultato salvato</h2>
            <p>{feedback}</p>
            <button className="button primary" onClick={start}>
              Gioca ancora
            </button>
          </div>
        ) : (
          <>
            <h2>{round.prompt}</h2>
            <div className="choice-grid">
              {round.choices.map((choice, index) => (
                <button
                  className="choice-button"
                  key={choice}
                  onClick={() => choose(index)}
                >
                  <kbd>{index + 1}</kbd> {choice}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
      <p className="status-message" role="status">
        {feedback}
      </p>
    </>
  )
}
