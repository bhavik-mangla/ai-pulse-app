/*
 * Topic navigation.
 *
 * A strip of tabs under the header, and a horizontal swipe on the feed to move
 * between them. Reading a feed one topic at a time is a much more direct way
 * to navigate than opening a settings sheet and ticking boxes, and the swipe
 * makes it something you can do with the same thumb you are already scrolling
 * with.
 *
 * The first tab is "For You", which is the reader's chosen interests, or
 * everything when they have not chosen any. The rest are single topics.
 */

import { CATEGORIES } from "./config.js";
import { $, escapeHtml } from "./dom.js";
import { haptic } from "./haptics.js";
import { state } from "./state.js";

export const FOR_YOU = "__for_you__";

/*
 * A horizontal swipe has to be clearly horizontal before it counts, because
 * the same surface scrolls vertically through stories. Requiring roughly a
 * 2:1 ratio keeps a slightly-diagonal vertical flick from changing topic.
 */
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_HORIZONTAL_RATIO = 1.8;

/** Tabs in display order: For You, then every topic except the catch-all. */
export function tabs() {
  return [
    { id: FOR_YOU, label: "For You", emoji: "✨" },
    ...CATEGORIES.filter((c) => c.id !== "other").map((c) => ({
      id: c.id,
      label: c.en,
      emoji: c.emoji || "",
    })),
  ];
}

export function renderTopics() {
  const strip = $("topic-strip");
  if (!strip) return;

  strip.innerHTML = tabs()
    .map(
      (tab) => `
      <button class="topic-tab${tab.id === state.topic ? " active" : ""}"
              data-action="set-topic" data-topic="${escapeHtml(tab.id)}"
              role="tab" aria-selected="${tab.id === state.topic}">
        ${tab.emoji ? `<span aria-hidden="true">${escapeHtml(tab.emoji)}</span> ` : ""}${escapeHtml(tab.label)}
      </button>`
    )
    .join("");

  scrollActiveIntoView();
}

/** Keep the selected tab visible when it is reached by swiping. */
function scrollActiveIntoView() {
  const active = document.querySelector(".topic-tab.active");
  active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}

/** The categories filter for the current tab. */
export function activeCategories() {
  if (state.topic === FOR_YOU) return [...state.interests];
  return [state.topic];
}

/**
 * Move `offset` tabs along, without wrapping.
 *
 * Not wrapping is deliberate: swiping past the last topic doing nothing tells
 * you that you are at the end, where jumping back to the start would just feel
 * like the app lost your place.
 */
export function stepTopic(offset, onChange) {
  const all = tabs();
  const index = all.findIndex((t) => t.id === state.topic);
  const next = all[index + offset];
  if (!next || next.id === state.topic) return false;
  state.topic = next.id;
  renderTopics();
  haptic("impactLight");
  onChange();
  return true;
}

/** Horizontal swipe on the feed moves between topics. */
export function initTopicSwipe(container, onChange) {
  if (!container) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  container.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) {
        tracking = false;
        return;
      }
      /* A flipped card scrolls its own content; leave it alone. */
      if (event.target.closest(".card-back")) {
        tracking = false;
        return;
      }
      tracking = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (event) => {
      if (!tracking) return;
      tracking = false;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;
      if (Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO) return;

      /* Swiping left moves forward, matching the direction of the strip. */
      stepTopic(dx < 0 ? 1 : -1, onChange);
    },
    { passive: true }
  );

  container.addEventListener("touchcancel", () => {
    tracking = false;
  });
}
