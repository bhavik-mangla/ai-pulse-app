/* Entry point: bootstraps state, binds events and loads the first feed. */

import { fetchDigest, fetchMetadata, fetchSources } from "./api.js";
import { refitAll } from "./autofit.js";
import { listBookmarks, loadBookmarks, toggleBookmark } from "./bookmarks.js";
import { STORAGE_KEYS } from "./config.js";
import { $ } from "./dom.js";
import {
  flipCard,
  initObservers,
  itemById,
  loadFeed,
  renderSaved,
  setStreakHandler,
  setToastHandler,
} from "./feed.js";
import { initPullToRefresh, initTapToFlip } from "./gestures.js";
import { haptic } from "./haptics.js";
import { getSettings as digestSettings, restoreDigest, setDigestHeadline } from "./notify.js";
import { SeenManager } from "./seen.js";
import { saveInterests, state, writeStored } from "./state.js";
import { loadStreak } from "./streak.js";
import { FOR_YOU, initTopicSwipe, renderTopics } from "./topics.js";
import { shareStory } from "./share.js";
import {
  applyStrings,
  renderCountryOptions,
  renderInterests,
  renderSourceFilter,
  setTheme,
  showToast,
  changeDigestTime,
  syncDigestControls,
  syncModeBanner,
  syncSavedCount,
  toggleDigest,
  toggleFilters,
  toggleInterest,
  toggleTheme,
  updateHeaderDate,
} from "./ui.js";

function refresh() {
  haptic("impactLight");
  state.showingSaved = false;
  state.mode = "unread";
  syncModeBanner();
  loadFeed({ refresh: true });
}

/**
 * Keep going after catching up.
 *
 * Being finished for the day should not mean the app has nothing left to
 * offer, so this drops the already-read filter and pages back through
 * everything for the current topic, newest first.
 */
function readEarlier() {
  state.mode = "earlier";
  state.showingSaved = false;
  syncModeBanner();
  haptic("impactLight");
  loadFeed({ refresh: true });
}

function backToLatest() {
  state.mode = "unread";
  syncModeBanner();
  haptic("impactLight");
  loadFeed({ refresh: true });
}

/** Switch feed scope: reload the outlets for it, then the feed itself. */
async function setCountry(code) {
  if (!code || code === state.country) return;
  state.country = code;
  writeStored(STORAGE_KEYS.country, code);

  /* A source filter from the previous scope would match nothing here. */
  const sourceSelect = $("sel-src");
  if (sourceSelect) sourceSelect.value = "";

  renderCountryOptions();
  state.sources = await fetchSources(code);
  renderSourceFilter();
  refresh();
}

function setTopic(id) {
  if (!id || id === state.topic) return;
  state.topic = id;
  state.showingSaved = false;
  renderTopics();
  refresh();
}

function toggleTopStories() {
  state.topStoriesOnly = !state.topStoriesOnly;
  $("btn-top-stories")?.classList.toggle("active", state.topStoriesOnly);
  refresh();
}

/** Clear every filter without touching the chosen scope. */
function resetFilters() {
  ["search-q", "sel-src", "filter-date"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  state.interests.clear();
  saveInterests();
  renderInterests();
  state.topStoriesOnly = false;
  $("btn-top-stories")?.classList.remove("active");
  haptic("impactLight");
  refresh();
}

/* --- Card actions --- */

function itemFor(element) {
  const card = element.closest(".feed-item");
  return card ? itemById(card.dataset.id) : null;
}

async function onBookmark(element) {
  const item = itemFor(element);
  if (!item) return;
  const saved = await toggleBookmark(item);
  element.textContent = saved ? "★" : "☆";
  element.classList.toggle("active", saved);
  element.setAttribute("aria-pressed", String(saved));
  element.setAttribute("aria-label", saved ? "Remove from saved" : "Save story");
  syncSavedCount();
  haptic("impactLight");
  showToast(saved ? "Saved" : "Removed from saved", 1500);

  /* Un-saving from within the saved list should remove it from view. */
  if (state.showingSaved && !saved) showSaved();
}

async function onShare(element) {
  const item = itemFor(element);
  if (!item) return;
  haptic("impactLight");
  const result = await shareStory(item, { onStatus: showToast });
  if (result === "unavailable") showToast("Sharing is not available on this device");
}

async function showSaved() {
  state.showingSaved = true;
  const items = await listBookmarks();
  renderSaved(items);
  toggleFilters(false);
}

function showFeed() {
  state.showingSaved = false;
  loadFeed({ refresh: true });
}

/*
 * All chrome interactions run through one delegated handler keyed on
 * data-action, so the markup carries no inline JavaScript. Inline handlers
 * would also stop working now that the app is loaded as an ES module, since
 * module scope is not global.
 */
const ACTIONS = {
  "toggle-theme": toggleTheme,
  "open-filters": () => toggleFilters(true),
  "close-filters": () => toggleFilters(false),
  "toggle-top-stories": toggleTopStories,
  "reset-filters": resetFilters,
  "set-country": (el) => setCountry(el.dataset.country),
  "set-topic": (el) => setTopic(el.dataset.topic),
  "toggle-interest": (el) => {
    toggleInterest(el.dataset.interest);
    if (state.topic === FOR_YOU) refresh();
  },
  "bookmark": onBookmark,
  "share": onShare,
  "show-saved": showSaved,
  "toggle-digest": () => toggleDigest(showToast),
  "show-feed": showFeed,
  "refresh-feed": refresh,
  "read-earlier": readEarlier,
  "back-to-latest": backToLatest,
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

  ["sel-src", "filter-date"].forEach((id) => {
    $(id)?.addEventListener("change", refresh);
  });

  $("digest-time")?.addEventListener("change", () => changeDigestTime(showToast));

  $("search-q")?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") refresh();
  });

  const container = $("feed-container");
  initPullToRefresh(container, $("pull-indicator"), refresh);
  initTapToFlip(container, flipCard);
  /* Swiping to a topic must behave exactly like tapping its tab. */
  initTopicSwipe(container, () => {
    state.mode = "unread";
    state.showingSaved = false;
    syncModeBanner();
    loadFeed({ refresh: true });
  });

  /* Headline sizing depends on viewport height, so re-fit when it changes. */
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refitAll, 150);
  });
}

/**
 * Pick the headline the next reminder will carry.
 *
 * Only worth a request when reminders are actually on, and an empty digest
 * leaves the generic wording in place rather than inventing urgency.
 */
async function primeDigestHeadline() {
  if (!digestSettings().enabled) return;
  const items = await fetchDigest(state.country, [...state.interests], 1);
  setDigestHeadline(items[0]?.title || null);
}

async function init() {
  setToastHandler(showToast);
  setStreakHandler((streak) => {
    showToast(`🔥 ${streak.current} day streak`, 2500);
    haptic("notificationSuccess");
  });

  updateHeaderDate();
  setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  bindEvents();
  initObservers();

  await Promise.all([SeenManager.init(), loadBookmarks(), loadStreak(), fetchMetadata()]);

  /* Persist the detected scope so the next launch does not re-detect it. */
  writeStored(STORAGE_KEYS.country, state.country);
  state.sources = await fetchSources(state.country);

  renderCountryOptions();
  renderTopics();
  applyStrings();
  syncSavedCount();
  syncDigestControls();
  await primeDigestHeadline();
  restoreDigest();

  loadFeed();
}

init();
