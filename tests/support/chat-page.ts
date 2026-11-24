import { expect, type Locator, type Page, type Response } from '@playwright/test';
import path from 'node:path';


export interface EndPayload {
  readonly id: number;
  readonly markdown: string;
  readonly html: string;
  readonly model_name: string;
  readonly reasoning: string;
  readonly reasoning_mode: string;
  readonly state: number;
}


export interface GuardPayload {
  readonly enabled: boolean;
  readonly flagged: boolean;
  readonly risk: number;
  readonly categories: ReadonlyArray<{ readonly id: string; readonly p: number }>;
}


export interface SendRequest {
  readonly message: string;
  readonly file_uuid: string;
  readonly web_search: boolean;
  readonly reasoning: boolean;
}

export interface UploadPayload {
  readonly file_uuid?: string;
  readonly kind?: string;
  readonly error?: string;
}

export interface ChatTurn {
  readonly request: SendRequest;
  readonly end: EndPayload;
  readonly guard: GuardPayload;

  readonly assistant: Locator;
}

export const FIXTURES_DIR = path.resolve(__dirname, '..', '..', 'fixtures');
const ANSWER_TIMEOUT_MS = 3 * 60 * 1000;
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;

const isPost = (r: Response, pathname: string): boolean =>
  r.request().method() === 'POST' && new URL(r.url()).pathname === pathname;


export class ChatPage {
  readonly input: Locator;
  readonly sendButton: Locator;
  readonly webSearchToggle: Locator;
  readonly thinkingToggle: Locator;
  readonly attachButton: Locator;
  readonly fileInput: Locator;
  readonly attachmentChip: Locator;
  readonly modal: Locator;
  readonly guardPanel: Locator;

  constructor(readonly page: Page) {
    this.input = page.getByPlaceholder('Wyślij wiadomość do Bielika');
    this.sendButton = page.getByTitle('Wyślij wiadomość do Bielika', { exact: true });
    this.webSearchToggle = page.getByRole('button', { name: 'Szukaj w sieci' });
    this.thinkingToggle = page.getByRole('button', { name: 'Myśl dłużej' });
    this.attachButton = page.getByTitle(/^Dodaj plik/);
    this.fileInput = page.locator('input[type="file"]');
    this.attachmentChip = page.getByRole('button', { name: 'Usuń załącznik' });
    this.modal = page.locator('[x-show="$store.modal.open"]');
    this.guardPanel = page.locator('#app-sidebar section[aria-live="polite"]');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.input).toBeVisible();
  }


  async attach(fileName: string): Promise<{ status: number; body: UploadPayload }> {
    const uploaded = this.page.waitForResponse((r) => isPost(r, '/chat/upload'), {
      timeout: UPLOAD_TIMEOUT_MS,
    });
    await this.fileInput.setInputFiles(path.join(FIXTURES_DIR, fileName));
    const response = await uploaded;
    const body = (await response.json()) as UploadPayload;
    await expect(this.page.getByText('(Ładowanie...)')).toBeHidden();
    return { status: response.status(), body };
  }

  async setWebSearch(on: boolean): Promise<void> {
    await setToggle(this.webSearchToggle, on);
  }

  async setThinking(on: boolean): Promise<void> {
    await setToggle(this.thinkingToggle, on);
  }

  async send(message: string): Promise<ChatTurn> {
    const sent = this.page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/chat/send'));
    const guard = this.page.waitForResponse((r) => isPost(r, '/guard'), { timeout: ANSWER_TIMEOUT_MS });
    const end = this.page.waitForResponse((r) => isPost(r, '/chat/end/stream'), {
      timeout: ANSWER_TIMEOUT_MS,
    });

    await this.input.fill(message);
    await this.sendButton.click();

    const request = (await sent).postDataJSON() as SendRequest;
    const [endResponse, guardResponse] = await Promise.all([end, guard]);
    expect(endResponse.status(), 'POST /chat/end/stream').toBe(200);
    expect(guardResponse.status(), 'POST /guard').toBe(200);

    const assistant = this.page.locator('[data-author="assistant"]').last();
    await expect(assistant.locator('[data-slot="actions"]')).toBeVisible({ timeout: ANSWER_TIMEOUT_MS });

    return {
      request,
      end: (await endResponse.json()) as EndPayload,
      guard: (await guardResponse.json()) as GuardPayload,
      assistant,
    };
  }
}

async function setToggle(toggle: Locator, on: boolean): Promise<void> {
  const expected = String(on);
  if ((await toggle.getAttribute('aria-pressed')) !== expected) await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', expected);
}

export const answerText = (turn: ChatTurn): Locator => turn.assistant.locator('[data-slot="content"]');
