import { defineConfig } from '@playwright/test'
const deployedBaseURL = process.env.PLAYWRIGHT_BASE_URL
export default defineConfig({
  testDir: './tests',
  webServer: deployedBaseURL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1',
        port: 5173,
        reuseExistingServer: true,
      },
  use: {
    baseURL: deployedBaseURL ?? 'http://127.0.0.1:5173/Brain-Training-Suite/',
  },
})
