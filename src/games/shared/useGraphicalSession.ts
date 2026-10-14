import { useEffect, useRef, useState } from 'react'
import { DifficultyLevel, GameId } from '../../core/games/types'
import { useTrainingStore } from '../../storage/useTrainingStore'
import { useSessionPlanStore } from '../../features/sessions/useSessionPlanStore'

export function useGraphicalSession(gameId: GameId) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy')
  const [status, setStatus] = useState<
    'idle' | 'running' | 'paused' | 'completed'
  >('idle')
  const [seconds, setSeconds] = useState(0)
  const [score, setScore] = useState(0)
  const startedAt = useRef('')
  const saved = useRef(false)
  const addSession = useTrainingStore((state) => state.addSession)
  const completeGame = useSessionPlanStore((state) => state.completeGame)
  useEffect(() => {
    if (status !== 'running') return
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [status])
  function start() {
    saved.current = false
    startedAt.current = new Date().toISOString()
    setSeconds(0)
    setScore(0)
    setStatus('running')
  }
  function finish(
    result: number,
    errors: number,
    details: Record<string, number>,
  ) {
    if (saved.current) return
    saved.current = true
    setScore(result)
    setStatus('completed')
    addSession({
      id: crypto.randomUUID(),
      gameId,
      difficulty,
      startedAt: startedAt.current,
      completedAt: new Date().toISOString(),
      durationSeconds: seconds,
      score: result,
      errors,
      completed: true,
      details,
    })
    completeGame(gameId)
  }
  return {
    difficulty,
    setDifficulty,
    status,
    setStatus,
    seconds,
    score,
    start,
    finish,
  }
}
