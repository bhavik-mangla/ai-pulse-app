/* Chrome: theme, language, region picker, preferences sheet and toasts. */

import {
  CATEGORIES,
  COUNTRIES,
  I18N,
  STORAGE_KEYS,
  countryByCode,
  offersHindi,
} from "./config.js";
import { $, escapeHtml } from "./dom.js";
import { haptic } from "./haptics.js";
import { state, writeStored } from "./state.js";
import { formatHeaderDate } from "./time.js";

let toastTimer = null;

export function showToast(message, duration = 3000) {
  const el = $("toast");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.display = "none";
  }, duration);
}

/* --- Theme --- */

export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  writeStored(STORAGE_KEYS.theme, theme);
  const btn = $("theme-btn");
  if (btn) btn.textContent = theme === "dark" ? "🌙" : "☀️";
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
  haptic("impactLight");
}

/* --- Region --- */

/** Render the scope chips; the active one is reflected in the header too. */
export function renderCountryOptions() {
  const wrap = $("country-options");
  if (!wrap) return;
  wrap.innerHTML = COUNTRIES.map(
    (c) => `
      <button class="chip${c.code === state.country ? " active" : ""}"
              data-action="set-country" data-country="${escapeHtml(c.code)}">
        <span class="chip-flag">${escapeHtml(c.flag || "")}</span>
        ${escapeHtml(c.name)}
      </button>`
  ).join("");
  syncCountryChip();
}

function syncCountryChip() {
  const country = countryByCode(state.country);
  const btn = $("country-btn");
  if (btn) {
    btn.textContent = country.flag || country.name;
    btn.setAttribute("aria-label", `Region: ${country.name}`);
  }
}

/*
 * Hindi is only generated for scopes that are offered it, so the toggle is
 * hidden elsewhere rather than switching the UI into a language the article
 * summaries are not available in.
 */
export function syncLanguageAvailability() {
  const row = $("language-row");
  if (row) row.hidden = !offersHindi(state.country);
}

/* --- Language --- */

function fillSelect(id, placeholder, options) {
  const select = $(id);
  if (!select) return;
  const previous = select.value;
  select.innerHTML =
    `<option value="">${escapeHtml(placeholder)}</option>` +
    options
      .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
      .join("");
  select.value = previous;
}

export function setLang(lang) {
  state.lang = lang;
  writeStored(STORAGE_KEYS.lang, lang);
  const strings = I18N[lang];

  const langBtn = $("lang-btn");
  if (langBtn) langBtn.textContent = lang === "en" ? "हिन्दी" : "English";

  fillSelect(
    "sel-cat",
    strings.allCats,
    CATEGORIES.map((c) => ({
      value: c.id,
      label: `${c.emoji ? `${c.emoji} ` : ""}${c[lang] || c.en}`,
    }))
  );

  applyStaticLabels(strings);
  renderSourceFilter();
}

/** Text that lives in the sheet rather than being generated per item. */
function applyStaticLabels(strings) {
  const labels = {
    "sheet-title": strings.preferences,
    "label-region": strings.region,
    "label-cat": strings.topic,
    "label-src": strings.sourceLabel,
    "label-search": strings.search,
    "label-date": strings.date,
    "label-language": strings.language,
    "label-top-stories": strings.topStoriesOnly,
    "btn-done": strings.done,
    "btn-reset": strings.reset,
  };
  for (const [id, text] of Object.entries(labels)) {
    const el = $(id);
    if (el) el.textContent = text;
  }
  const search = $("search-q");
  if (search) search.placeholder = strings.search;
}

/* --- Source filter --- */

export function renderSourceFilter() {
  fillSelect(
    "sel-src",
    I18N[state.lang].allSources,
    state.sources.map((s) => ({ value: s.id, label: s.name }))
  );
}

/* --- Preferences sheet --- */

export function toggleFilters(show) {
  const overlay = $("filters-overlay");
  if (!overlay) return;
  if (show) {
    overlay.style.display = "block";
    requestAnimationFrame(() => overlay.classList.add("active"));
  } else {
    overlay.classList.remove("active");
    setTimeout(() => {
      overlay.style.display = "none";
    }, 300);
  }
  haptic("impactLight");
}

export function updateHeaderDate() {
  const el = $("header-date");
  if (el) el.textContent = formatHeaderDate();
}
