# AI Pulse — mobile app

Short news cards you swipe through, one story per screen. Pick a region, tap a
card for the detail, and you are caught up.

This repository is the app. The ingestion pipeline and API live in
[aipulse-backend](https://github.com/bhavik-mangla/aipulse-backend).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Get it

**iOS:** [App Store](https://apps.apple.com/us/app/ai-pulse-daily-short-news/id6770227108)

**Android:** closed testing —
[join the group](https://groups.google.com/g/ai-pulse-testers), then
[opt in](https://play.google.com/apps/testing/com.daily.aipulse).

## How it is built

Plain HTML, CSS and ES modules in `www/`, wrapped by
[Capacitor](https://capacitorjs.com). **There is no build step and no
framework.** Capacitor copies `www/` verbatim, so what you edit is what ships.

```
www/
├── index.html          markup and the pre-paint theme script
├── css/
│   ├── tokens.css      design tokens, themes, reset
│   ├── layout.css      nav, feed viewport, snap items
│   ├── card.css        the news card, front and back
│   └── sheet.css       preferences sheet and controls
└── js/
    ├── main.js         entry point, event wiring
    ├── feed.js         loading, rendering, observers
    ├── card.js         card markup
    ├── api.js          backend access
    ├── dom.js          escaping and URL safety
    ├── autofit.js      fits the headline to the card
    ├── gestures.js     pull-to-refresh, tap vs swipe
    ├── seen.js         which stories you have already read
    ├── ui.js           theme, region picker, interests
    ├── state.js        shared state
    ├── time.js         relative timestamps
    ├── config.js       constants and UI strings
    └── haptics.js      Capacitor haptics
```

## Running it

The fastest loop is a browser — no Android Studio or Xcode needed:

```bash
cd www && python3 -m http.server 8000
```

Then open `http://localhost:8000` and use device emulation at a phone size.
The API is remote, so you get real content. Requests are blocked by CORS from
`localhost`; stub `window.fetch` with fixtures if you need data.

For a real device:

```bash
npm install
npx cap sync
npx cap open android    # or ios
```

## Contributing

Good places to start:

- **Layout on small screens.** The card is tightest on short Android displays.
- **The empty and error states.** They are plain, and could carry more warmth.
- **Accessibility.** Contrast, focus order, screen reader labels.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Two rules worth knowing

**Never put unescaped content into `innerHTML`.** Feed content is scraped
third-party HTML rewritten by an LLM, and this WebView has the Capacitor bridge
attached, so injected script is not a cosmetic problem. Everything goes through
`escapeHtml`, and every URL through `safeUrl`, in `js/dom.js`.

**Never nest a scroll container inside the feed.** Chrome latches a swipe onto
the inner scroller for the whole gesture, so a scrollable element inside a
scroll-snap page eats the swipe to the next story — which is exactly the bug
that made long headlines impossible to scroll past on Android. The headline is
auto-fitted by `js/autofit.js` rather than being made scrollable. The one
exception is the back of a card, which is only reachable when flipped.

## Licence

MIT — see [LICENSE](LICENSE).
