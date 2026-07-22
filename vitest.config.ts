import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/core/**/*.ts',
        'src/games/**/*.ts',
        'src/storage/database.ts',
        'src/storage/models.ts',
        'src/storage/trainingRepository.ts',
        'src/storage/validation.ts',
        'src/statistics/**/*.ts',
        'src/features/**/*.ts',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
