import { z } from 'zod'

const isoDate = z.string().datetime()
const gameId = z.enum([
  'hanoi',
  'tower-of-london',
  'memory',
  'visual-memory',
  'stroop',
  'trail-making',
  'reaction',
  'digit-span',
  'n-back',
  'simon',
])

export const exportSchema = z.object({
  format: z.literal('brain-training-suite'),
  schemaVersion: z.literal(1),
  exportedAt: isoDate,
  profile: z.object({
    id: z.literal('local'),
    displayName: z.string().max(30),
    preferredLevel: z.number().int().min(3).max(10),
    goal: z.enum(['balanced', 'memory', 'attention', 'logic', 'speed']),
    updatedAt: isoDate,
  }),
  settings: z.object({
    id: z.literal('app'),
    theme: z.enum(['light', 'dark', 'system']),
    textScale: z.enum(['normal', 'large', 'extra-large']),
    reduceMotion: z.boolean(),
    sounds: z.boolean(),
    coachEnabled: z.boolean(),
    updatedAt: isoDate,
  }),
  sessions: z
    .array(
      z.object({
        id: z.string().min(1),
        gameId,
        difficulty: z.enum(['easy', 'medium', 'hard']),
        startedAt: isoDate,
        completedAt: isoDate,
        durationSeconds: z.number().int().nonnegative(),
        score: z.number().finite(),
        accuracy: z.number().min(0).max(100).optional(),
        errors: z.number().int().nonnegative(),
        completed: z.boolean(),
        details: z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]),
        ),
      }),
    )
    .max(10_000),
})
