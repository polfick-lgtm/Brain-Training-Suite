import { describe, expect, it } from 'vitest'
import { buildSessionPlan } from './sessionPlanner'
import { arcadeDefinitions } from '../../games/arcade/catalog'

describe('session planner', () => {
  it('mantiene i giochi Arcade fuori dai percorsi di allenamento', () => {
    for (const goal of [
      'balanced',
      'memory',
      'attention',
      'logic',
      'speed',
    ] as const) {
      expect(
        buildSessionPlan(goal, 20).some((id) =>
          arcadeDefinitions.some((game) => game.id === id),
        ),
      ).toBe(false)
    }
  })
  it('crea una sessione rapida di tre giochi unici', () => {
    const plan = buildSessionPlan('balanced', 10)
    expect(plan).toHaveLength(3)
    expect(new Set(plan).size).toBe(3)
  })

  it('privilegia l’obiettivo e raggiunge cinque giochi con fallback', () => {
    const plan = buildSessionPlan('memory', 20)
    expect(plan).toHaveLength(5)
    expect(plan).toContain('memory')
  })
})
