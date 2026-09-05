/* Feed loading, rendering and the observers that drive them. */

import { I18N, PAGE_SIZE } from "./config.js";
import { ApiError, buildFeedUrl, fetchFeedPage, readCachedPage, writeCachedPage } from "./api.js";
import { $, escapeHtml, valueOf } from "./dom.js";
import { renderCard } from "./card.js";
import { fitCard } from "./autofit.js";
import { haptic } from "./haptics.js";
import { SeenManager } from "./seen.js";
import { state } from "./state.js";
import { getStreak, recordStoryRead } from "./streak.js";
import { timeAgo } from "./time.js";
import { activeCategories } from "./topics.js";

/* How many unseen stories to gather before rendering, and how hard to look. */
const MIN_UNSEEN_BATCH = 10;
const MAX_PROBE_PAGES = 5;

/*
 * Stories currently rendered, by id, so a card action can find the item it
 * belongs to without re-fetching or stashing JSON in a data attribute.
 */
const rendered = new Map();

/** The item behind a rendered card, or null once it has been replaced. */
export function itemById(id) {
  return rendered.get(String(id)) || null;
}

let activeObserver = null;
let infiniteObserver = null;
let preloadObserver = null;
let showToast = () => {};
let onStreakAdvanced = null;

export function setToastHandler(fn) {
  showToast = fn;
}

/** Called the first time a day counts towards the reading streak. */
export function setStreakHandler(fn) {
  onStreakAdvanced = fn;
}

/** Current preferences-sheet values, as the API layer expects them. */
export function currentFilters() {
  return {
    query: valueOf("search-q"),
    country: state.country,
    sourceId: valueOf("sel-src"),
    categories: activeCategories(),
    date: valueOf("filter-date"),
    topStoriesOnly: state.topStoriesOnly,
  };
}

export function initObservers() {
  activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          entry.target.classList.remove("active");
          return;
        }
        entry.target.classList.add("active");
        if (!SeenManager.has(entry.target.dataset.id)) {
          SeenManager.add(entry.target.dataset.id);
          recordStoryRead().then((streakAdvanced) => {
            if (streakAdvanced) onStreakAdvanced?.(getStreak());
          });
        }
      });
    },
    { threshold: 0.6 }
  );

  infiniteObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !state.isLoading && !state.endReached) {
        loadFeed({ append: true });
      }
    },
    { threshold: 0.1 }
  );

  const trigger = $("infinite-scroll-trigger");
  if (trigger) infiniteObserver.observe(trigger);

  /*
   * Fit headlines slightly before a card reaches the viewport so the text is
   * already sized when it snaps into place.
   */
  preloadObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && fitCard(e.target)),
    { rootMargin: "100% 0px" }
  );
}

/** Detach observers from nodes that are about to be removed from the DOM. */
function unobserveAll(container) {
  container.querySelectorAll(".feed-item").forEach((el) => {
    activeObserver?.unobserve(el);
    preloadObserver?.unobserve(el);
  });
}

function observeCards(container) {
  container.querySelectorAll(".feed-item").forEach((el) => {
    activeObserver?.observe(el);
    preloadObserver?.observe(el);
  });
}

function renderMessage(container, message) {
  container.innerHTML = `<p class="feed-message">${escapeHtml(message)}</p>`;
}

/**
 * The "you are done" screen.
 *
 * Finishing is the whole promise of a short-news app, so the end of the feed
 * gets a real screen rather than a line of grey text: what you read, the
 * streak it earned, and a way back to the top.
 */
function renderCaughtUp(container, { read, streak }) {
  /* Take both forms: naive "+s" turns "story" into "storys". */
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const streakLine =
    streak.current > 0
      ? `<p class="caught-up-streak">🔥 ${count(streak.current, "day", "days")} in a row</p>`
      : streak.storiesNeeded > 0
        ? `<p class="caught-up-streak muted">${count(streak.storiesNeeded, "more story", "more stories")} today to start a streak</p>`
        : "";

  container.innerHTML = `
    <div class="feed-item caught-up">
      <div class="caught-up-inner">
        <div class="caught-up-mark" aria-hidden="true">✓</div>
        <h2 class="caught-up-title">You are all caught up</h2>
        <p class="caught-up-sub">${escapeHtml(count(read, "story", "stories"))} read today</p>
        ${streakLine}
        <button class="btn-action caught-up-action" data-action="refresh-feed">
          Check for new stories
        </button>
      </div>
    </div>`;
}

/** Fill in relative timestamps left as data attributes by the card template. */
function hydrateTimestamps(container) {
  container.querySelectorAll("[data-timeago]").forEach((el) => {
    el.textContent = timeAgo(el.dataset.timeago);
  });
}

export function renderFeed(items, { append }) {
  const container = $("cards-stack");
  if (!container) return;

  const html = items.map((item) => renderCard(item, state.lang)).join("");

  if (append) {
    container.insertAdjacentHTML("beforeend", html);
  } else {
    unobserveAll(container);
    rendered.clear();
    container.innerHTML = html;
  }
  items.forEach((item) => rendered.set(String(item.id), item));

  hydrateTimestamps(container);
  observeCards(container);
}

/**
 * Load the feed.
 *
 * Probes forward through pages until it has enough stories the reader has not
 * already seen, so a reader who is caught up does not land on an empty screen.
 */
export async function loadFeed({ refresh = false, append = false } = {}) {
  if (state.isLoading) return;
  state.isLoading = true;

  const container = $("cards-stack");
  const strings = I18N[state.lang];
  const filters = currentFilters();
  const isInitial = refresh || (!append && state.page === 1);

  if (refresh) {
    state.page = 1;
    state.endReached = false;
    state.renderedIds.clear();
  }

  if (!append && state.renderedIds.size === 0 && container) {
    container.innerHTML =
      '<div class="feed-item skeleton"><div class="card-inner"></div></div>';
  }

  try {
    if (isInitial && !filters.query && !refresh) {
      await renderFromCache(filters);
    }

    const collected = [];
    let probes = 0;
    let lastFetchedPage = state.page - 1;

    while (probes < (isInitial ? MAX_PROBE_PAGES : 1) && !state.endReached) {
      const url = buildFeedUrl(state.page, filters);
      let data;
      try {
        data = await fetchFeedPage(url);
      } catch (err) {
        reportRequestError(err, strings);
        break;
      }

      lastFetchedPage = state.page;
      const items = data.items || [];

      /*
       * Trust the page size the server actually applied rather than the one we
       * asked for; the API may widen the window server-side.
       */
      const effectiveSize = Number(data.page_size) || PAGE_SIZE;
      if (items.length < effectiveSize) state.endReached = true;

      collected.push(...items.filter((item) => !SeenManager.has(item.id)));

      if (collected.length >= MIN_UNSEEN_BATCH || state.endReached || filters.query) break;

      state.page += 1;
      probes += 1;
    }

    const fresh = collected.filter((item) => !state.renderedIds.has(String(item.id)));

    if (fresh.length) {
      if (isInitial && !filters.query) {
        await writeCachedPage(buildFeedUrl(1, filters), {
          items: fresh.slice(0, PAGE_SIZE),
          total: fresh.length,
          page: 1,
          page_size: PAGE_SIZE,
        });
      }
      const shouldAppend = append || (isInitial && state.renderedIds.size > 0);
      fresh.forEach((item) => state.renderedIds.add(String(item.id)));
      renderFeed(fresh, { append: shouldAppend });
      /*
       * Resume from the page after the last one actually fetched. Advancing
       * from state.page instead would skip a page whenever the probe loop
       * exited on its iteration cap.
       */
      state.page = lastFetchedPage + 1;
    } else if (isInitial && state.renderedIds.size === 0 && container) {
      const hasFilters = Boolean(
        filters.query || filters.sourceId || filters.date || filters.topStoriesOnly
      );
      if (hasFilters) {
        renderMessage(container, strings.noRecords);
      } else {
        const streak = getStreak();
        renderCaughtUp(container, { read: streak.todayCount, streak });
      }
    }
  } finally {
    state.isLoading = false;
  }
}

/** Paint the cached first page immediately so the app is never blank. */
async function renderFromCache(filters) {
  const cached = await readCachedPage(buildFeedUrl(1, filters));
  const items = (cached?.items || []).filter((item) => !SeenManager.has(item.id));
  if (!items.length) return;
  items.forEach((item) => state.renderedIds.add(String(item.id)));
  renderFeed(items, { append: false });
}

function reportRequestError(err, strings) {
  if (err instanceof ApiError) {
    if (err.status === 429) showToast(strings.rateLimited);
    else if (err.status >= 500) showToast(strings.serverError);
    return;
  }
  showToast(strings.networkError);
}

/** Show the saved stories instead of the feed. */
export function renderSaved(items) {
  const container = $("cards-stack");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="feed-item caught-up">
        <div class="caught-up-inner">
          <div class="caught-up-mark" aria-hidden="true">☆</div>
          <h2 class="caught-up-title">Nothing saved yet</h2>
          <p class="caught-up-sub">Tap the star on a story to keep it here.</p>
          <button class="btn-action caught-up-action" data-action="show-feed">
            Back to stories
          </button>
        </div>
      </div>`;
    return;
  }

  unobserveAll(container);
  rendered.clear();
  items.forEach((item) => rendered.set(String(item.id), item));
  container.innerHTML = items.map((item) => renderCard(item, state.lang)).join("");
  hydrateTimestamps(container);
  observeCards(container);
}

export function flipCard(cardEl) {
  cardEl.classList.toggle("flipped");
  haptic("impactLight");
}
