import { defineConfig } from '@playwright/test'

export default defineConfig({
  testMatch: 'browser.spec.ts',
  outputDir: '../evidence/playwright',
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4173' },
  webServer: { command: 'pnpm preview --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
})
