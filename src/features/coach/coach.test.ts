import { describe, expect, it } from 'vitest'
import { defaultProfile, TrainingSession } from '../../storage/models'
import { buildCoachSuggestions } from './coach'

describe('coach locale', () => {
  it('propone al massimo tre attività motivate al primo avvio', () => {
    const suggestions = buildCoachSuggestions([], defaultProfile())
    expect(suggestions).toHaveLength(3)
    expect(suggestions.every((item) => item.reason.length > 0)).toBe(true)
  })

  it('privilegia l’obiettivo esplicito', () => {
    const profile = { ...defaultProfile(), goal: 'memory' as const }
    const suggestions = buildCoachSuggestions([], profile)
    expect(suggestions[0].gameId).toBe('digit-span')
  })

  it('individua l’area con media recente più bassa', () => {
    const base: Omit<TrainingSession, 'id' | 'gameId' | 'score'> = {
      difficulty: 'easy',
      startedAt: '2026-07-23T10:00:00.000Z',
      completedAt: '2026-07-23T10:01:00.000Z',
      durationSeconds: 60,
      errors: 0,
      completed: true,
      details: {},
    }
    const suggestions = buildCoachSuggestions(
      [
        { ...base, id: '1', gameId: 'memory', score: 50 },
        { ...base, id: '2', gameId: 'hanoi', score: 90 },
      ],
      defaultProfile(),
    )
    expect(['digit-span', 'memory', 'simon', 'visual-memory']).toContain(
      suggestions[0].gameId,
    )
    expect(suggestions[0].reason).toContain('margine')
  })
})
