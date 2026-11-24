import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 3 * 60 * 1000, // odpowiedzi LLM bywają wolne
  expect: { timeout: 90 * 1000 },
  fullyParallel: false,
  workers: 1, // nie obciążamy produkcji równoległymi zapytaniami
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://chat-new.bielik.ai',
    storageState: '.auth/user.json',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
