import { create } from 'zustand'
import { GameId } from '../../core/games/types'
import {
  buildSessionPlan,
  SessionDuration,
  SessionGoal,
} from './sessionPlanner'

type SessionStatus = 'idle' | 'running' | 'paused' | 'completed'

type State = {
  status: SessionStatus
  goal: SessionGoal
  duration: SessionDuration
  plan: GameId[]
  currentIndex: number
  elapsedSeconds: number
  start: (goal: SessionGoal, duration: SessionDuration) => void
  togglePause: () => void
  tick: () => void
  completeGame: (gameId: GameId) => void
  reset: () => void
}

const initial = {
  status: 'idle' as const,
  goal: 'balanced' as const,
  duration: 10 as const,
  plan: [] as GameId[],
  currentIndex: 0,
  elapsedSeconds: 0,
}

export const useSessionPlanStore = create<State>((set, get) => ({
  ...initial,
  start: (goal, duration) =>
    set({
      status: 'running',
      goal,
      duration,
      plan: buildSessionPlan(goal, duration),
      currentIndex: 0,
      elapsedSeconds: 0,
    }),
  togglePause: () => {
    const status = get().status
    if (status === 'running') set({ status: 'paused' })
    if (status === 'paused') set({ status: 'running' })
  },
  tick: () => {
    if (get().status === 'running')
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }))
  },
  completeGame: (gameId) => {
    const state = get()
    if (state.status !== 'running' || state.plan[state.currentIndex] !== gameId)
      return
    const nextIndex = state.currentIndex + 1
    set({
      currentIndex: nextIndex,
      status: nextIndex >= state.plan.length ? 'completed' : 'running',
    })
  },
  reset: () => set(initial),
}))
