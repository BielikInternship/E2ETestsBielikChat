import { defineConfig, devices } from '@playwright/test';

export const AUTH_FILE = '.auth/user.json';

// SLOWMO=500 spowalnia każdą akcję (ms), CHROME=1 używa zainstalowanego Google Chrome zamiast Chromium.
const SLOW_MO_MS = Number(process.env.SLOWMO ?? 0);
const CHANNEL = process.env.CHROME === '1' ? 'chrome' : undefined;

export default defineConfig({
  testDir: './tests',
  timeout: 4 * 60 * 1000,
  expect: { timeout: 30 * 1000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://chat-new.bielik.ai',
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    channel: CHANNEL,
    launchOptions: { slowMo: SLOW_MO_MS },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { storageState: AUTH_FILE } },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: AUTH_FILE },
    },
  ],
});
