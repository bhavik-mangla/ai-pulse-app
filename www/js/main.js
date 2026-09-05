/* Entry point: bootstraps state, binds events and loads the first feed. */

import { fetchMetadata, fetchSources } from "./api.js";
import { refitAll } from "./autofit.js";
import { STORAGE_KEYS, offersHindi } from "./config.js";
import { $ } from "./dom.js";
import { flipCard, initObservers, loadFeed, setToastHandler } from "./feed.js";
import { initPullToRefresh, initTapToFlip } from "./gestures.js";
import { haptic } from "./haptics.js";
import { SeenManager } from "./seen.js";
import { state, writeStored } from "./state.js";
import {
  renderCountryOptions,
  renderSourceFilter,
  setLang,
  setTheme,
  showToast,
  syncLanguageAvailability,
  toggleFilters,
  toggleTheme,
  updateHeaderDate,
} from "./ui.js";

function refresh() {
  haptic("impactLight");
  loadFeed({ refresh: true });
}

/** Switch feed scope: reload the outlets for it, then the feed itself. */
async function setCountry(code) {
  if (!code || code === state.country) return;
  state.country = code;
  writeStored(STORAGE_KEYS.country, code);

  /* Hindi only exists for scopes that generate it. */
  if (!offersHindi(code) && state.lang !== "en") setLang("en");
  syncLanguageAvailability();

  /* A source filter from the previous scope would match nothing here. */
  const sourceSelect = $("sel-src");
  if (sourceSelect) sourceSelect.value = "";

  renderCountryOptions();
  state.sources = await fetchSources(code);
  renderSourceFilter();
  refresh();
}

function toggleTopStories() {
  state.topStoriesOnly = !state.topStoriesOnly;
  $("btn-top-stories")?.classList.toggle("active", state.topStoriesOnly);
  refresh();
}

function toggleLang() {
  setLang(state.lang === "en" ? "hi" : "en");
  refresh();
}

/** Clear every filter without touching the chosen scope. */
function resetFilters() {
  ["search-q", "sel-cat", "sel-src", "filter-date"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  state.topStoriesOnly = false;
  $("btn-top-stories")?.classList.remove("active");
  haptic("impactLight");
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
  "toggle-top-stories": toggleTopStories,
  "reset-filters": resetFilters,
  "set-country": (el) => setCountry(el.dataset.country),
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

  ["sel-src", "sel-cat", "filter-date"].forEach((id) => {
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
  setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  bindEvents();
  initObservers();

  await SeenManager.init();
  await fetchMetadata();

  /* Persist the detected scope so the next launch does not re-detect it. */
  writeStored(STORAGE_KEYS.country, state.country);

  state.sources = await fetchSources(state.country);

  renderCountryOptions();
  syncLanguageAvailability();
  setLang(state.lang);
  loadFeed();
}

init();
