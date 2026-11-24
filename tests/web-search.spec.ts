import { test, expect } from '@playwright/test';
import { ChatPage } from './support/chat-page';

test.describe('Internet („Szukaj w sieci”)', () => {
  test('wyszukiwanie zwraca odpowiedź ze źródłami', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();
    await chat.setWebSearch(true);

    const turn = await chat.send('Jakie są najnowsze wiadomości sportowe z Polski? Podaj źródła.');

    expect(turn.request.web_search).toBe(true);

    const sources = turn.assistant.locator('[data-slot="sources"]');
    await expect(sources).toBeVisible();
    await expect(sources).toContainText(/Źródła · \d+/);
    await expect(sources).not.toContainText('wyszukano automatycznie');

    const links = sources.locator('a[href^="http"]');
    expect(await links.count()).toBeGreaterThan(0);
    await expect(links.first()).toHaveAttribute('target', '_blank');
    await expect(links.first()).toHaveAttribute('rel', /noopener/);
  });

  test('model zna bieżącą datę dzięki wyszukiwaniu', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();
    await chat.setWebSearch(true);

    const turn = await chat.send('Jaki mamy dzisiaj rok? Odpowiedz samą liczbą.');

    expect(turn.end.markdown).toContain(String(new Date().getFullYear()));
  });
});
