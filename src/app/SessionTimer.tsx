import { useEffect } from 'react'
import { useSessionPlanStore } from '../features/sessions/useSessionPlanStore'

export function SessionTimer() {
  const status = useSessionPlanStore((state) => state.status)
  const tick = useSessionPlanStore((state) => state.tick)

  useEffect(() => {
    if (status !== 'running') return
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [status, tick])

  return null
}
