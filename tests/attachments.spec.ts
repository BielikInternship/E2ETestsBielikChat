import { test, expect } from '@playwright/test';
import { ChatPage, answerText } from './support/chat-page';

test.describe('Analiza załączników', () => {
  test('analiza obrazu: rozpoznaje napis i kolor', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    const upload = await chat.attach('image.png');
    expect(upload.status).toBe(200);
    expect(upload.body.kind).toBe('image');
    await expect(chat.attachmentChip).toBeVisible();

    const turn = await chat.send('Co jest na tym obrazku? Jaki napis i jaki kolor ma koło?');

    expect(turn.request.file_uuid).toBe(upload.body.file_uuid);
    expect(turn.end.markdown).toMatch(/ZEBRA/i);
    expect(turn.end.markdown).toMatch(/42/);
    expect(turn.end.markdown).toMatch(/czerwon/i);

    const userMsg = page.locator('[data-author="user"]').last();
    await expect(userMsg.locator('[data-slot="attachment-name"]')).toHaveText('image.png');
    await expect(userMsg.locator('img[data-slot="attachment-thumb"]')).toBeVisible();
    await expect(answerText(turn)).toContainText(/ZEBRA/i);
  });

  test('analiza PDF: odczytuje fakty z dokumentu', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    const upload = await chat.attach('doc.pdf');
    expect(upload.status).toBe(200);
    expect(upload.body.kind).toBe('pdf');

    const turn = await chat.send(
      'Na podstawie załączonego dokumentu: jaka jest stolica Zielonii i jaki jest kod referencyjny?',
    );

    expect(turn.request.file_uuid).toBe(upload.body.file_uuid);
    expect(turn.end.markdown).toMatch(/Szmaragdow/i);
    expect(turn.end.markdown).toContain('ZX-4821');

    const userMsg = page.locator('[data-author="user"]').last();
    await expect(userMsg.locator('[data-slot="attachment-kind"]')).toHaveText('Dokument PDF');
    await expect(userMsg.locator('[data-slot="attachment-name"]')).toHaveText('doc.pdf');
  });

  test('analiza audio: transkrybuje nagranie i odpowiada na pytanie', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    const upload = await chat.attach('speech.wav');
    expect(upload.body.error, 'błąd z /chat/upload').toBeUndefined();
    expect(upload.status).toBe(200);
    expect(upload.body.kind).toBe('audio');

    const turn = await chat.send('Jakie hasło pada w załączonym nagraniu?');

    expect(turn.request.file_uuid).toBe(upload.body.file_uuid);
    expect(turn.end.markdown).toMatch(/pomarańcz/i);
    expect(turn.end.markdown).toMatch(/słoń/i);
  });

  test('pole pliku akceptuje tylko obsługiwane formaty', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.open();

    await expect(chat.fileInput).toHaveAttribute('accept', /\.pdf/);
    await expect(chat.fileInput).toHaveAttribute('accept', /\.wav/);
    await expect(chat.fileInput).toHaveAttribute('accept', /\.png/);
    await expect(chat.fileInput).not.toHaveAttribute('accept', /\.exe/);
  });
});
