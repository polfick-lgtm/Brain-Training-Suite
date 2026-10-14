import { describe, expect, it } from 'vitest'
import { defaultProfile, defaultSettings } from './models'
import { exportSchema } from './validation'
import { arcadeDefinitions } from '../games/arcade/catalog'

describe('validazione export locale', () => {
  it('accetta risultati dei nuovi Arcade per import ed export', () => {
    const now = new Date().toISOString()
    const data = exportSchema.parse({
      format: 'brain-training-suite',
      schemaVersion: 1,
      exportedAt: now,
      profile: defaultProfile(),
      settings: defaultSettings(),
      sessions: arcadeDefinitions.map((game) => ({
        id: game.id,
        gameId: game.id,
        difficulty: 'easy',
        startedAt: now,
        completedAt: now,
        durationSeconds: 3,
        score: 100,
        errors: 0,
        completed: true,
        details: { arcadePoints: 10 },
      })),
    })
    expect(data.sessions).toHaveLength(8)
  })
  it('accetta un export v1 valido', () => {
    const exportedAt = new Date().toISOString()
    const result = exportSchema.parse({
      format: 'brain-training-suite',
      schemaVersion: 1,
      exportedAt,
      profile: defaultProfile(),
      settings: defaultSettings(),
      sessions: [],
    })
    expect(result.exportedAt).toBe(exportedAt)
  })

  it('rifiuta dati incompatibili', () => {
    expect(() => exportSchema.parse({ format: 'altro' })).toThrow()
  })
})
