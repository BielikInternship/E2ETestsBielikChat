import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';

setup('sesja użytkownika jest ważna', async ({ page }) => {
  await page.goto('/');

  if (new URL(page.url()).hostname !== 'chat-new.bielik.ai') {
    throw new Error('Sesja wygasła (przekierowanie do logowania SSO). Uruchom: npm run login');
  }

  if (page.url().includes('/private_policy/form')) {
    await page.locator('#agree').check();
    await page.getByRole('button', { name: 'Zapisz' }).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/private_policy'));
    await page.context().storageState({ path: AUTH_FILE });
  }

  await expect(page.getByPlaceholder('Wyślij wiadomość do Bielika')).toBeVisible();
});
