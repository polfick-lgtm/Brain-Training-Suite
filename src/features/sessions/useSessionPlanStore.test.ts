import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionPlanStore } from './useSessionPlanStore'

describe('stato sessione guidata', () => {
  beforeEach(() => useSessionPlanStore.getState().reset())

  it('avvia, mette in pausa e incrementa il timer solo quando attiva', () => {
    const store = useSessionPlanStore.getState()
    store.start('balanced', 10)
    useSessionPlanStore.getState().tick()
    expect(useSessionPlanStore.getState().elapsedSeconds).toBe(1)
    useSessionPlanStore.getState().togglePause()
    useSessionPlanStore.getState().tick()
    expect(useSessionPlanStore.getState().elapsedSeconds).toBe(1)
    useSessionPlanStore.getState().togglePause()
    expect(useSessionPlanStore.getState().status).toBe('running')
  })

  it('avanza solo completando il gioco corrente', () => {
    useSessionPlanStore.getState().start('balanced', 10)
    const [first, second, third] = useSessionPlanStore.getState().plan
    useSessionPlanStore.getState().completeGame(second)
    expect(useSessionPlanStore.getState().currentIndex).toBe(0)
    useSessionPlanStore.getState().completeGame(first)
    useSessionPlanStore.getState().completeGame(second)
    useSessionPlanStore.getState().completeGame(third)
    expect(useSessionPlanStore.getState().status).toBe('completed')
  })
})
