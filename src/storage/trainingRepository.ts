import { database } from './database'
import {
  AppSettings,
  BrainTrainingExport,
  defaultProfile,
  defaultSettings,
  LocalProfile,
  TrainingSession,
} from './models'
import { exportSchema } from './validation'

const legacyKey = 'brain-training-suite-v1'

type LegacySession = {
  id: string
  completedAt: string
  disks: number
  moves: number
  seconds: number
  minimumMoves: number
  efficiency: number
}

function readLegacyData() {
  const raw = localStorage.getItem(legacyKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as {
      state?: {
        profileName?: string
        preferredLevel?: number
        sessions?: LegacySession[]
      }
    }
  } catch {
    return null
  }
}

async function migrateLegacyData() {
  if ((await database.profiles.count()) > 0) return
  const legacy = readLegacyData()?.state
  if (!legacy) return
  const now = new Date().toISOString()
  const profile: LocalProfile = {
    ...defaultProfile(),
    displayName: legacy.profileName?.slice(0, 30) ?? '',
    preferredLevel: Math.min(10, Math.max(3, legacy.preferredLevel ?? 5)),
    updatedAt: now,
  }
  const sessions: TrainingSession[] = (legacy.sessions ?? []).map(
    (session) => ({
      id: session.id,
      gameId: 'hanoi',
      difficulty:
        session.disks <= 4 ? 'easy' : session.disks <= 6 ? 'medium' : 'hard',
      startedAt: session.completedAt,
      completedAt: session.completedAt,
      durationSeconds: session.seconds,
      score: session.efficiency,
      accuracy: 100,
      errors: Math.max(0, session.moves - session.minimumMoves),
      completed: true,
      details: {
        disks: session.disks,
        moves: session.moves,
        minimumMoves: session.minimumMoves,
      },
    }),
  )
  await database.transaction(
    'rw',
    database.profiles,
    database.settings,
    database.sessions,
    async () => {
      await database.profiles.put(profile)
      await database.settings.put(defaultSettings())
      if (sessions.length) await database.sessions.bulkPut(sessions)
    },
  )
  localStorage.removeItem(legacyKey)
}

export const trainingRepository = {
  async load() {
    await migrateLegacyData()
    const profile = (await database.profiles.get('local')) ?? defaultProfile()
    const settings = (await database.settings.get('app')) ?? defaultSettings()
    const sessions = await database.sessions
      .orderBy('completedAt')
      .reverse()
      .toArray()
    await database.profiles.put(profile)
    await database.settings.put(settings)
    return { profile, settings, sessions }
  },

  saveProfile(profile: LocalProfile) {
    return database.profiles.put(profile)
  },

  saveSettings(settings: AppSettings) {
    return database.settings.put(settings)
  },

  saveSession(session: TrainingSession) {
    return database.sessions.put(session)
  },

  clearSessions() {
    return database.sessions.clear()
  },

  async exportData(): Promise<BrainTrainingExport> {
    const { profile, settings, sessions } = await this.load()
    return {
      format: 'brain-training-suite',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      sessions,
    }
  },

  async importData(value: unknown) {
    const data = exportSchema.parse(value)
    await database.transaction(
      'rw',
      database.profiles,
      database.settings,
      database.sessions,
      async () => {
        await database.profiles.put(data.profile)
        await database.settings.put(data.settings)
        await database.sessions.clear()
        if (data.sessions.length) await database.sessions.bulkPut(data.sessions)
      },
    )
    return data
  },

  async deleteAll() {
    await database.transaction(
      'rw',
      database.profiles,
      database.settings,
      database.sessions,
      async () => {
        await database.profiles.clear()
        await database.settings.clear()
        await database.sessions.clear()
      },
    )
    localStorage.removeItem(legacyKey)
  },
}
