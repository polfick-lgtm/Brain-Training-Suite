import { describe, expect, it } from 'vitest'
import { defaultProfile, defaultSettings } from './models'
import { exportSchema } from './validation'

describe('validazione export locale', () => {
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
