## What does this change?

## Why?

## Evidence it works

<!--
Screenshots or a screen recording are ideal for UI changes.
If you touched the feed or the card, please check on a small Android screen —
that is where the layout is tightest.
-->

## Checklist

- [ ] Ran it (`cd www && python3 -m http.server`, or on a device)
- [ ] Any content that reaches `innerHTML` goes through `escapeHtml`, and any
      URL through `safeUrl` — feed content is scraped and LLM-written
- [ ] No new nested scroll containers inside the feed (they trap the swipe on Android)
