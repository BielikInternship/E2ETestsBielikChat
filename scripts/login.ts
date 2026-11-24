import { chromium, type Browser } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://chat-new.bielik.ai/';
const CHAT_HOST = 'chat-new.bielik.ai';
const ROOT = path.resolve(__dirname, '..');
const AUTH_FILE = path.join(ROOT, '.auth', 'user.json');
const PROFILE_DIR = path.join(ROOT, '.auth', 'chrome-profile');
const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const CDP_PORT = 9333;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_MS = 2000;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function connectWithRetry(): Promise<Browser> {
  for (let i = 0; i < 30; i++) {
    try {
      return await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
    } catch {
      await sleep(500);
    }
  }
  throw new Error('Nie udało się połączyć z Chrome przez CDP');
}

const ALLOWED_DOMAIN = /(^|\.)(bielik\.ai|speakleash\.org\.pl)$/;

function isAllowedDomain(domain: string): boolean {
  return ALLOWED_DOMAIN.test(domain.replace(/^\./, ''));
}

function isLoggedInUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.hostname === CHAT_HOST && !url.pathname.startsWith('/authorized');
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const chrome = spawn(
    CHROME_BIN,
    [
      `--user-data-dir=${PROFILE_DIR}`,
      `--remote-debugging-port=${CDP_PORT}`,
      '--no-first-run',
      '--no-default-browser-check',
      BASE_URL,
    ],
    { stdio: 'ignore' },
  );

  const browser = await connectWithRetry();
  console.log('Zaloguj się w otwartym oknie Chrome. Czekam maks. 5 minut...');

  const deadline = Date.now() + LOGIN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const context = browser.contexts()[0];
    const page = context?.pages().find((p) => isLoggedInUrl(p.url()));
    if (context && page) {
      await page.waitForLoadState('networkidle').catch(() => undefined);
      const state = await context.storageState();
      //ciasteczka
      const filtered = {
        cookies: state.cookies.filter((c) => isAllowedDomain(c.domain)),
        origins: state.origins.filter((o) => isAllowedDomain(new URL(o.origin).hostname)),
      };
      await writeFile(AUTH_FILE, JSON.stringify(filtered, null, 2), { mode: 0o600 });
      console.log(`Sesja zapisana: ${AUTH_FILE}`);
      await browser.close().catch(() => undefined);
      chrome.kill();
      return;
    }
    await sleep(POLL_MS);
  }

  chrome.kill();
  throw new Error('Przekroczono czas na logowanie');
}

main().catch((err: unknown) => {
  console.error('Logowanie nie powiodło się:', err);
  process.exit(1);
});
