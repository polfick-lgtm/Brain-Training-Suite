import { describe, expect, it } from 'vitest'
import { buildSessionPlan } from './sessionPlanner'

describe('session planner', () => {
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
