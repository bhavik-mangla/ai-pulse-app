/*
 * Fits a headline to the space available on the card.
 *
 * Why this exists: the headline used to be its own scroll container, which
 * trapped the swipe gesture on Android and made long stories hard to scroll
 * past. Rather than nesting a scroller inside a scroll-snap page, the text is
 * shrunk to fit, and only clamped with a fade in the rare case where even the
 * minimum size overflows.
 */

const MIN_FONT_PX = 14;
const FIT_TOLERANCE_PX = 2;

/** Cards already measured, so re-entering a card does not re-run the search. */
const fitted = new WeakSet();

function overflows(el) {
  return el.scrollHeight - el.clientHeight > FIT_TOLERANCE_PX;
}

/**
 * Shrink `el` until its content fits, using a binary search over font sizes so
 * the number of forced reflows stays around five regardless of how long the
 * text is.
 */
export function fitHeadline(el) {
  if (!el || fitted.has(el)) return;
  fitted.add(el);

  el.classList.remove("is-clamped");
  el.style.fontSize = "";

  const maxPx = parseFloat(getComputedStyle(el).fontSize);
  if (!Number.isFinite(maxPx) || maxPx <= MIN_FONT_PX) {
    if (overflows(el)) el.classList.add("is-clamped");
    return;
  }

  if (!overflows(el)) return;

  let low = MIN_FONT_PX;
  let high = maxPx;
  let best = null;

  /* ~5 iterations narrows a 14-30px range to sub-pixel precision. */
  for (let i = 0; i < 5 && high - low > 0.5; i += 1) {
    const mid = (low + high) / 2;
    el.style.fontSize = `${mid}px`;
    if (overflows(el)) {
      high = mid;
    } else {
      best = mid;
      low = mid;
    }
  }

  if (best === null) {
    /* Even the floor overflows: clamp and let the fade signal there is more. */
    el.style.fontSize = `${MIN_FONT_PX}px`;
    if (overflows(el)) el.classList.add("is-clamped");
  } else {
    el.style.fontSize = `${best}px`;
  }
}

/** Fit every headline inside a card element. */
export function fitCard(cardEl) {
  const headline = cardEl?.querySelector(".card-headline");
  if (headline) fitHeadline(headline);
}

/** Re-fit everything, e.g. after a rotation or font size change. */
export function refitAll() {
  document.querySelectorAll(".card-headline").forEach((el) => {
    fitted.delete(el);
    fitHeadline(el);
  });
}
