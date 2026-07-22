import { beforeEach, describe, expect, it } from 'vitest'
import { database } from './database'
import { defaultProfile, defaultSettings, TrainingSession } from './models'
import { trainingRepository } from './trainingRepository'

const session: TrainingSession = {
  id: 'session-1',
  gameId: 'hanoi',
  difficulty: 'easy',
  startedAt: '2026-07-23T10:00:00.000Z',
  completedAt: '2026-07-23T10:01:00.000Z',
  durationSeconds: 60,
  score: 100,
  accuracy: 100,
  errors: 0,
  completed: true,
  details: { disks: 3, moves: 7, minimumMoves: 7 },
}

describe('repository locale', () => {
  beforeEach(async () => {
    await database.delete()
    await database.open()
    localStorage.clear()
  })

  it('inizializza profilo e preferenze predefiniti', async () => {
    const data = await trainingRepository.load()
    expect(data.profile.id).toBe('local')
    expect(data.settings.theme).toBe('system')
    expect(data.sessions).toEqual([])
    expect((await trainingRepository.load()).profile).toEqual(data.profile)
  })

  it('ignora dati legacy illeggibili senza corrompere il database', async () => {
    localStorage.setItem('brain-training-suite-v1', '{json non valido')
    const data = await trainingRepository.load()
    expect(data.profile).toMatchObject({ displayName: '', preferredLevel: 5 })
    expect(data.sessions).toEqual([])
  })

  it('applica valori sicuri quando il legacy è incompleto', async () => {
    localStorage.setItem(
      'brain-training-suite-v1',
      JSON.stringify({ state: { preferredLevel: 99 } }),
    )
    const data = await trainingRepository.load()
    expect(data.profile.preferredLevel).toBe(10)
    expect(data.sessions).toEqual([])
  })

  it('salva ed esporta dati tipizzati', async () => {
    const profile = { ...defaultProfile(), displayName: 'Ada' }
    const settings = { ...defaultSettings(), reduceMotion: true }
    await trainingRepository.saveProfile(profile)
    await trainingRepository.saveSettings(settings)
    await trainingRepository.saveSession(session)

    const exported = await trainingRepository.exportData()
    expect(exported.profile.displayName).toBe('Ada')
    expect(exported.settings.reduceMotion).toBe(true)
    expect(exported.sessions).toEqual([session])

    await trainingRepository.clearSessions()
    expect((await trainingRepository.load()).sessions).toEqual([])
  })

  it('importa un export valido e rifiuta input incompatibili', async () => {
    const valid = {
      format: 'brain-training-suite' as const,
      schemaVersion: 1 as const,
      exportedAt: new Date().toISOString(),
      profile: { ...defaultProfile(), displayName: 'Importato' },
      settings: defaultSettings(),
      sessions: [session],
    }
    await trainingRepository.importData(valid)
    expect((await trainingRepository.load()).profile.displayName).toBe(
      'Importato',
    )
    await expect(
      trainingRepository.importData({ format: 'errato' }),
    ).rejects.toThrow()
    expect((await trainingRepository.load()).sessions).toHaveLength(1)

    await trainingRepository.importData({ ...valid, sessions: [] })
    expect((await trainingRepository.load()).sessions).toEqual([])
  })

  it('migra i dati v0.1 e rimuove la copia legacy', async () => {
    localStorage.setItem(
      'brain-training-suite-v1',
      JSON.stringify({
        state: {
          profileName: 'Legacy',
          preferredLevel: 4,
          sessions: [
            {
              id: 'legacy-1',
              completedAt: '2026-07-22T10:00:00.000Z',
              disks: 3,
              moves: 8,
              seconds: 45,
              minimumMoves: 7,
              efficiency: 88,
            },
          ],
        },
      }),
    )
    const data = await trainingRepository.load()
    expect(data.profile.displayName).toBe('Legacy')
    expect(data.sessions[0]).toMatchObject({ gameId: 'hanoi', errors: 1 })
    expect(localStorage.getItem('brain-training-suite-v1')).toBeNull()
  })

  it('cancella tutte le tabelle locali', async () => {
    await trainingRepository.saveProfile(defaultProfile())
    await trainingRepository.saveSettings(defaultSettings())
    await trainingRepository.saveSession(session)
    await trainingRepository.deleteAll()
    expect(await database.profiles.count()).toBe(0)
    expect(await database.settings.count()).toBe(0)
    expect(await database.sessions.count()).toBe(0)
  })
})
