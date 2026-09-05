/* Touch gestures for the feed: pull-to-refresh and tap-versus-scroll. */

import { haptic } from "./haptics.js";

const PULL_TRIGGER_PX = 70;
const PULL_MAX_PX = 120;

/* A tap is a short, near-stationary touch. Anything else is a scroll. */
const TAP_MAX_MOVE_PX = 12;
const TAP_MAX_DURATION_MS = 500;

/**
 * Pull down at the top of the feed to refresh.
 *
 * Distance is tracked in a variable rather than being read back out of the
 * indicator's transform string, which was fragile and broke whenever the
 * transform format changed.
 */
export function initPullToRefresh(container, indicator, onRefresh) {
  if (!container || !indicator) return;

  let startY = 0;
  let distance = 0;
  let tracking = false;

  const reset = () => {
    tracking = false;
    startY = 0;
    distance = 0;
    indicator.style.transform = "translateY(0)";
    indicator.style.opacity = "0";
  };

  container.addEventListener(
    "touchstart",
    (e) => {
      /* Only start a pull from the very top, and never from inside a card. */
      if (container.scrollTop > 5 || e.touches.length !== 1) {
        tracking = false;
        return;
      }
      if (e.target.closest(".card-back")) {
        tracking = false;
        return;
      }
      tracking = true;
      startY = e.touches[0].pageY;
      distance = 0;
    },
    { passive: true }
  );

  container.addEventListener(
    "touchmove",
    (e) => {
      if (!tracking) return;
      const delta = e.touches[0].pageY - startY;
      if (delta <= 0) {
        distance = 0;
        indicator.style.opacity = "0";
        return;
      }
      distance = Math.min(delta, PULL_MAX_PX);
      indicator.style.opacity = String(Math.min(distance / 80, 1));
      indicator.style.transform = `translateY(${distance}px) rotate(${distance * 3}deg)`;
    },
    { passive: true }
  );

  container.addEventListener("touchend", () => {
    if (!tracking) return;
    const shouldRefresh = distance > PULL_TRIGGER_PX;
    reset();
    if (shouldRefresh) {
      haptic("notificationSuccess");
      onRefresh();
    }
  });

  container.addEventListener("touchcancel", reset);
}

/**
 * Call `onTap(cardEl)` only for genuine taps on a card.
 *
 * The card used to flip from a plain click handler on the whole item, so a
 * swipe that ended as a click flipped the card mid-scroll. Tracking movement
 * and duration separates the two intents.
 */
export function initTapToFlip(container, onTap) {
  if (!container) return;

  let startX = 0;
  let startY = 0;
  let startedAt = 0;
  let candidate = null;

  container.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) {
        candidate = null;
        return;
      }
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startedAt = Date.now();
      candidate = e.target.closest(".feed-item");
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (e) => {
      const card = candidate;
      candidate = null;
      if (!card) return;

      /* Interactive elements handle their own activation. */
      if (e.target.closest("a, button, [data-action]")) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const moved = Math.hypot(touch.clientX - startX, touch.clientY - startY);
      const elapsed = Date.now() - startedAt;
      if (moved > TAP_MAX_MOVE_PX || elapsed > TAP_MAX_DURATION_MS) return;

      onTap(card);
    },
    { passive: true }
  );

  container.addEventListener("touchcancel", () => {
    candidate = null;
  });

  /* Pointer-less environments (desktop debugging) still need a way to flip. */
  container.addEventListener("click", (e) => {
    if (window.matchMedia("(hover: none)").matches) return;
    if (e.target.closest("a, button, [data-action]")) return;
    const card = e.target.closest(".feed-item");
    if (card) onTap(card);
  });
}
