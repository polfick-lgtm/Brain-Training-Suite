import { create } from 'zustand'
import {
  AppSettings,
  defaultProfile,
  defaultSettings,
  LocalProfile,
  TrainingSession,
} from './models'
import { trainingRepository } from './trainingRepository'

type State = {
  hydrated: boolean
  profile: LocalProfile
  settings: AppSettings
  sessions: TrainingSession[]
  hydrate: () => Promise<void>
  setProfile: (
    displayName: string,
    preferredLevel: number,
    goal?: LocalProfile['goal'],
  ) => void
  updateSettings: (
    changes: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>,
  ) => void
  addSession: (session: TrainingSession) => void
  clearSessions: () => void
  importData: (value: unknown) => Promise<void>
  deleteAllData: () => Promise<void>
}

let hydration: Promise<void> | null = null

export const useTrainingStore = create<State>((set, get) => ({
  hydrated: false,
  profile: defaultProfile(),
  settings: defaultSettings(),
  sessions: [],
  hydrate: async () => {
    if (!hydration) {
      hydration = trainingRepository.load().then((data) => {
        set({ ...data, hydrated: true })
      })
    }
    await hydration
  },
  setProfile: (displayName, preferredLevel, goal = get().profile.goal) => {
    const profile = {
      ...get().profile,
      displayName,
      preferredLevel,
      goal,
      updatedAt: new Date().toISOString(),
    }
    set({ profile })
    void trainingRepository.saveProfile(profile)
  },
  updateSettings: (changes) => {
    const settings = {
      ...get().settings,
      ...changes,
      updatedAt: new Date().toISOString(),
    }
    set({ settings })
    void trainingRepository.saveSettings(settings)
  },
  addSession: (session) => {
    set((state) => ({
      sessions: [session, ...state.sessions].slice(0, 10_000),
    }))
    void trainingRepository.saveSession(session)
  },
  clearSessions: () => {
    set({ sessions: [] })
    void trainingRepository.clearSessions()
  },
  importData: async (value) => {
    const data = await trainingRepository.importData(value)
    set({
      profile: data.profile,
      settings: data.settings,
      sessions: data.sessions,
    })
  },
  deleteAllData: async () => {
    await trainingRepository.deleteAll()
    const profile = defaultProfile()
    const settings = defaultSettings()
    await trainingRepository.saveProfile(profile)
    await trainingRepository.saveSettings(settings)
    set({ profile, settings, sessions: [] })
  },
}))
