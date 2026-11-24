import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(__dirname, '..', 'fixtures');
const SPEECH_TEXT = 'Dzień dobry. Hasło na dziś to pomarańczowy słoń. Powtarzam: pomarańczowy słoń.';

const IMAGE_HTML = `<body style="margin:0;width:800px;height:600px;background:#fff;display:flex;
  flex-direction:column;align-items:center;justify-content:center;font-family:Arial">
  <div style="width:300px;height:300px;border-radius:50%;background:#e00"></div>
  <h1 style="font-size:96px;margin:24px 0 0">ZEBRA 42</h1></body>`;

const PDF_HTML = `<body style="font-family:Arial;padding:40px">
  <h1>Raport o kraju Zielonia</h1>
  <p>Zielonia to fikcyjny kraj stworzony na potrzeby testów.</p>
  <p>Stolicą Zielonii jest miasto Szmaragdowo.</p>
  <p>Kod referencyjny dokumentu: ZX-4821.</p></body>`;

async function makeImageAndPdf(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(IMAGE_HTML);
  await page.screenshot({ path: path.join(OUT, 'image.png') });
  await page.setContent(PDF_HTML);
  await page.pdf({ path: path.join(OUT, 'doc.pdf'), format: 'A4' });
  await browser.close();
}

function makeSpeech(): void {
  const aiff = path.join(OUT, 'speech.aiff');
  execFileSync('say', ['-v', 'Zosia', '-o', aiff, SPEECH_TEXT]);
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEI16@16000', aiff, path.join(OUT, 'speech.wav')]);
  rmSync(aiff);
}

makeImageAndPdf()
  .then(makeSpeech)
  .then(() => console.log(`Fixtures zapisane w ${OUT}`))
  .catch((err: unknown) => {
    console.error('Generowanie fixtures nie powiodło się:', err);
    process.exit(1);
  });
