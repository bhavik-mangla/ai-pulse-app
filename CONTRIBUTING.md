# Contributing

Thanks for considering it. The app is deliberately small and plain — no
framework, no build step — so it should be quick to get into.

## Running it

The fastest loop is a browser:

```bash
cd www && python3 -m http.server 8000
```

Open `http://localhost:8000`, then use your browser's device emulation at a
phone size (412×915 is a good default). What you edit is what ships: Capacitor
copies `www/` verbatim.

The API is remote, so you get real articles. Requests are blocked by CORS from
`localhost`, so if you need data, stub `window.fetch` in a scratch copy of
`index.html` and point it at JSON fixtures.

For a real device:

```bash
npm install
npx cap sync
npx cap open android      # or ios
```

## Good places to start

- **Layout on small screens.** The card is tightest on short Android displays,
  and that is where problems show up first.
- **Empty and error states.** "You are all caught up" is doing a lot of work
  with very little design behind it.
- **Accessibility.** Contrast, focus order, screen-reader labels on the icon
  buttons.
- **The card back.** It is a plain bullet list and could be much better.

## Two rules that are not negotiable

### Escape everything that reaches the DOM

Feed content is scraped third-party HTML rewritten by an LLM, and this WebView
has the Capacitor bridge attached. Injected script here is not cosmetic.

Everything interpolated into `innerHTML` goes through `escapeHtml`, and every
URL through `safeUrl`, both in `js/dom.js`. `safeUrl` returns `""` for anything
that is not `http(s)`, which is what stops a `javascript:` URL in a headline
from executing when the card's link is tapped.

### Never nest a scroll container inside the feed

This one has bitten the app before. Chrome latches a swipe onto an inner
scroller for the entire gesture, so a scrollable element inside a scroll-snap
page **eats the swipe to the next story**. On Android that made long headlines
impossible to scroll past. WebKit hands the gesture to the ancestor mid-swipe,
so iOS looked fine and the bug went unnoticed.

The headline is therefore auto-fitted to the space available
(`js/autofit.js`) rather than made scrollable. If it still overflows at the
minimum size it is clamped with a fade, and the full story is one tap away on
the back of the card.

The single exception is `.card-back`, which is only reachable when a card is
flipped, and which *should* keep its scroll contained.

## Style

- Match the surrounding code. It is plain ES modules with no framework — please
  keep it that way unless there is a strong reason.
- No inline `onclick`. Interactions are delegated through `data-action` in
  `js/main.js`; module scope is not global, so inline handlers would not work
  anyway.
- Comments explain *why*. The code already says what.

## Pull requests

- Branch off `main`.
- Screenshots or a recording for anything visual.
- Say what you changed and why. If you fixed a bug, say what the bug did.
- Keep unrelated changes in separate pull requests.

## Code of conduct

Be decent to each other. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
