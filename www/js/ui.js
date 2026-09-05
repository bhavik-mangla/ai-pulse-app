/* Chrome: theme, language, the preferences sheet and toasts. */

import { AUDIENCES, CATEGORIES, I18N, STORAGE_KEYS } from "./config.js";
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
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
  haptic("impactLight");
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
    CATEGORIES.map((c) => ({ value: c.id, label: c[lang] || c.en }))
  );
  fillSelect(
    "sel-audience",
    strings.whoAreYou,
    AUDIENCES.map((a) => ({ value: a, label: a }))
  );

  const audienceLabel = $("label-audience");
  if (audienceLabel) audienceLabel.textContent = strings.whoAreYou;

  const impactLabel = $("label-high-impact");
  if (impactLabel) impactLabel.textContent = strings.highImpactOnly;

  renderSourceFilter();
}

/* --- Source filter --- */

export function renderSourceFilter() {
  const isNewsSource = (s) => s.id.includes("top_stories");
  const options = state.sources
    .filter((s) => (state.feedType === "news" ? isNewsSource(s) : !isNewsSource(s)))
    .map((s) => ({ value: s.id, label: s.name }));
  fillSelect("sel-src", I18N[state.lang].allPortals, options);
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
