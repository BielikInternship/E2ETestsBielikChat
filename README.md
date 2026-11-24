# Testy E2E — chat-new.bielik.ai

Testy Playwright funkcji czatu Bielik: wnioskowanie, internet, strażnik treści, analiza obrazu, PDF i audio.

## Pierwsze uruchomienie

```bash
npm ci
npx playwright install chromium
npm run login      # otwiera Chrome, zaloguj się ręcznie (SSO SpeakLeash / Google)
npm test
```

Strona stoi za Keycloak SSO (`id.speakleash.org.pl`), a Google blokuje logowanie w przeglądarce
sterowanej przez Playwright. Dlatego `npm run login` uruchamia zwykłego Chrome i zapisuje sesję
do `.auth/user.json` (plik jest w `.gitignore`). Sesja wygasa po kilku dniach — gdy test
`setup` zgłosi „Sesja wygasła”, uruchom `npm run login` jeszcze raz.

## Struktura

| Plik | Co testuje |
|------|------------|
| `tests/auth.setup.ts` | ważność sesji, akceptacja polityki prywatności |
| `tests/composer.spec.ts` | pole wiadomości, przełączniki, podstawowa odpowiedź |
| `tests/reasoning.spec.ts` | „Myśl dłużej” — panel przemyśleń, `reasoning_mode=forced` |
| `tests/web-search.spec.ts` | „Szukaj w sieci” — źródła, aktualne dane |
| `tests/guard.spec.ts` | Strażnik — wykrycie prompt injection, brak fałszywych alarmów |
| `tests/attachments.spec.ts` | analiza obrazu, PDF, audio |
| `tests/support/chat-page.ts` | Page Object; czeka na `/chat/end/stream` i `/guard` |

Asercje sprawdzają jednocześnie UI i odpowiedzi API (`/chat/send`, `/guard`, `/chat/end/stream`).
Pliki testowe w `fixtures/` można odtworzyć poleceniem `npm run fixtures` (macOS, głos `Zosia`).

Każdy test tworzy nową rozmowę w historii konta testowego.
