import { test, expect } from '@playwright/test';
import { ChatPage } from './support/chat-page';

test.describe('Kompozytor wiadomości', () => {
  test('pokazuje pole wiadomości, przełączniki i model', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    await expect(chat.sendButton).toBeDisabled();
    await expect(chat.webSearchToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(chat.thinkingToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(chat.attachButton).toBeVisible();
    await expect(page.getByRole('button', { name: /Bielik .*v\d/ })).toBeVisible();
  });

  test('przełączniki „Szukaj w sieci” i „Myśl dłużej” zmieniają stan', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    await chat.setWebSearch(true);
    await chat.setThinking(true);
    await chat.setWebSearch(false);
    await chat.setThinking(false);
  });

  test('przycisk wysyłania aktywuje się po wpisaniu tekstu', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    await chat.input.fill('test');
    await expect(chat.sendButton).toBeEnabled();
  });

  test('podstawowa rozmowa zwraca odpowiedź modelu', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    const turn = await chat.send('Ile to jest 2+2? Odpowiedz jedną liczbą.');

    expect(turn.request).toMatchObject({ web_search: false, reasoning: false, file_uuid: '' });
    expect(turn.end.markdown).toMatch(/\b4\b/);
    await expect(turn.assistant.locator('[data-slot="author"]')).toHaveText(turn.end.model_name);
  });
});
