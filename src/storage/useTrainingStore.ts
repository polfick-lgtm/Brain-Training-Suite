import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Session = {
  id: string
  game: 'hanoi'
  completedAt: string
  disks: number
  moves: number
  seconds: number
  minimumMoves: number
  efficiency: number
}

type State = {
  profileName: string
  preferredLevel: number
  sessions: Session[]
  setProfile: (name: string, level: number) => void
  addSession: (session: Session) => void
  clearSessions: () => void
}

export const useTrainingStore = create<State>()(
  persist(
    (set) => ({
      profileName: '',
      preferredLevel: 5,
      sessions: [],
      setProfile: (profileName, preferredLevel) =>
        set({ profileName, preferredLevel }),
      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, 200),
        })),
      clearSessions: () => set({ sessions: [] }),
    }),
    { name: 'brain-training-suite-v1' },
  ),
)
