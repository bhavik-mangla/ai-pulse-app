/* Entry point: bootstraps state, binds events and loads the first feed. */

import { fetchMetadata, fetchSources } from "./api.js";
import { refitAll } from "./autofit.js";
import { $ } from "./dom.js";
import { flipCard, initObservers, loadFeed, setToastHandler } from "./feed.js";
import { initPullToRefresh, initTapToFlip } from "./gestures.js";
import { haptic } from "./haptics.js";
import { SeenManager } from "./seen.js";
import { state } from "./state.js";
import {
  renderSourceFilter,
  setLang,
  showToast,
  toggleFilters,
  toggleTheme,
  updateHeaderDate,
} from "./ui.js";

function refresh() {
  haptic("impactLight");
  loadFeed({ refresh: true });
}

function setFeedType(type) {
  state.feedType = type;
  $("btn-type-news")?.classList.toggle("active", type === "news");
  $("btn-type-official")?.classList.toggle("active", type === "official");
  renderSourceFilter();
  refresh();
}

function toggleHighImpact() {
  state.highImpactOnly = !state.highImpactOnly;
  $("btn-high-impact")?.classList.toggle("active", state.highImpactOnly);
  refresh();
}

function toggleLang() {
  setLang(state.lang === "en" ? "hi" : "en");
  refresh();
}

/*
 * All chrome interactions run through one delegated handler keyed on
 * data-action, so the markup carries no inline JavaScript. Inline handlers
 * would also stop working now that the app is loaded as an ES module, since
 * module scope is not global.
 */
const ACTIONS = {
  "toggle-lang": toggleLang,
  "toggle-theme": toggleTheme,
  "open-filters": () => toggleFilters(true),
  "close-filters": () => toggleFilters(false),
  "feed-news": () => setFeedType("news"),
  "feed-official": () => setFeedType("official"),
  "toggle-high-impact": toggleHighImpact,
  "close-card": (el) => {
    const card = el.closest(".feed-item");
    if (card) flipCard(card);
  },
};

function bindEvents() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const handler = ACTIONS[target.dataset.action];
    if (!handler) return;
    event.stopPropagation();
    handler(target);
  });

  /* Tapping the dimmed backdrop closes the sheet; taps inside must not. */
  $("filters-overlay")?.addEventListener("click", (event) => {
    if (event.target.id === "filters-overlay") toggleFilters(false);
  });

  ["sel-src", "sel-cat", "sel-audience", "filter-date"].forEach((id) => {
    $(id)?.addEventListener("change", refresh);
  });

  $("search-q")?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") refresh();
  });

  const container = $("feed-container");
  initPullToRefresh(container, $("pull-indicator"), refresh);
  initTapToFlip(container, flipCard);

  /* Headline sizing depends on viewport height, so re-fit when it changes. */
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refitAll, 150);
  });
}

async function init() {
  setToastHandler(showToast);
  updateHeaderDate();
  bindEvents();
  initObservers();

  await SeenManager.init();
  await fetchMetadata();
  state.sources = await fetchSources();

  setLang(state.lang);
  loadFeed();
}

init();
