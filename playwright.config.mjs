import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // tests/e2e/ contains raw Node scripts (not @playwright/test specs) — exclude them
  testIgnore: ['**/e2e/**'],
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3001',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx vite --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
