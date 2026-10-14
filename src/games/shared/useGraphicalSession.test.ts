import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGraphicalSession } from './useGraphicalSession'

const spies = vi.hoisted(() => ({ addSession: vi.fn(), completeGame: vi.fn() }))
vi.mock('../../storage/useTrainingStore', () => ({
  useTrainingStore: (
    select: (state: { addSession: typeof spies.addSession }) => unknown,
  ) => select({ addSession: spies.addSession }),
}))
vi.mock('../../features/sessions/useSessionPlanStore', () => ({
  useSessionPlanStore: (
    select: (state: { completeGame: typeof spies.completeGame }) => unknown,
  ) => select({ completeGame: spies.completeGame }),
}))

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})
describe('sessione grafica', () => {
  it('sospende il timer, salva una sola volta e consente una nuova partita', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useGraphicalSession('memory'))
    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.seconds).toBe(2)
    act(() => result.current.setStatus('paused'))
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.seconds).toBe(2)
    act(() => result.current.setStatus('running'))
    act(() => vi.advanceTimersByTime(1000))
    act(() => {
      result.current.finish(100, 0, { pairs: 4 })
      result.current.finish(100, 0, { pairs: 4 })
    })
    expect(spies.addSession).toHaveBeenCalledTimes(1)
    expect(spies.addSession).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'memory',
        durationSeconds: 3,
        score: 100,
        completed: true,
      }),
    )
    expect(spies.completeGame).toHaveBeenCalledWith('memory')
    expect(result.current.status).toBe('completed')
    act(() => result.current.start())
    expect(result.current.seconds).toBe(0)
    act(() => result.current.finish(50, 2, { pairs: 4 }))
    expect(spies.addSession).toHaveBeenCalledTimes(2)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
