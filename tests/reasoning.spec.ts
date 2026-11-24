import { test, expect } from '@playwright/test';
import { ChatPage, answerText } from './support/chat-page';

test.describe('Wnioskowanie („Myśl dłużej”)', () => {
  test('wymuszone myślenie pokazuje panel przemyśleń i poprawny wynik', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();
    await chat.setThinking(true);

    const turn = await chat.send('Ile to jest 17 razy 23? Podaj sam wynik.');

    expect(turn.request.reasoning).toBe(true);
    expect(turn.end.reasoning_mode).toBe('forced');
    expect(turn.end.reasoning.trim().length).toBeGreaterThan(20);
    expect(turn.end.markdown).toMatch(/391/);

    const panel = turn.assistant.locator('[data-slot="reasoning"]');
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-reasoning-label]')).toHaveText(/Przemyślenia · [\d.]+ s/);
    await expect(panel.locator('[data-reasoning-mode]')).toBeHidden();

    await panel.locator('summary').click();
    await expect(panel.locator('[data-reasoning-text]')).not.toBeEmpty();
    await expect(answerText(turn)).toContainText('391');
  });

  test('bez przełącznika wysyłane jest reasoning=false', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    const turn = await chat.send('Napisz słowo „OK”.');

    expect(turn.request.reasoning).toBe(false);
    expect(turn.end.reasoning_mode).not.toBe('forced');
  });
});
