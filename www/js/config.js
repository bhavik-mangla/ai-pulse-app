/* Static configuration, metadata defaults and UI strings. */

export const API_BASE = "https://aipulse-daily.vercel.app";
export const API = `${API_BASE}/api/v1`;

export const PAGE_SIZE = 15;
export const CACHE_NAME = "aipulse-cache";

export const STORAGE_KEYS = {
  theme: "gov_theme",
  country: "feed_country",
  interests: "feed_interests",
};

/*
 * Feed scopes. Overridden at runtime from /config/metadata so a scope added
 * on the server appears without shipping an app update; these are the offline
 * defaults and the ordering the picker uses.
 */
export let COUNTRIES = [
  { code: "world", name: "World", flag: "🌍" },
  { code: "in", name: "India", flag: "🇮🇳" },
  { code: "us", name: "United States", flag: "🇺🇸" },
];

export const DEFAULT_COUNTRY = "world";

/*
 * File extension of the logo bundled under assets/logos/ for a source.
 *
 * Only the three original Indian outlets ship a bundled logo. Everything else
 * relies on the article image the backend resolves, falling back to the card
 * placeholder; there is no point shipping binary assets for outlets whose
 * feeds carry per-article images.
 */
export const LOGO_EXT = {
  et_top_stories: "png",
  mint_top_stories: "png",
  bs_top_stories: "png",
};

/*
 * Topic categories. Replaced at runtime by /config/metadata. These defaults
 * are general-news topics; the app previously shipped the government notice
 * taxonomy (jobs, schemes, gazette, tax) which no longer matches anything the
 * backend produces.
 */
export let CATEGORIES = [
  { id: "world", en: "World", emoji: "🌍" },
  { id: "business", en: "Business", emoji: "📈" },
  { id: "politics", en: "Politics", emoji: "🏛" },
  { id: "technology", en: "Technology", emoji: "💻" },
  { id: "science", en: "Science", emoji: "🔬" },
  { id: "health", en: "Health", emoji: "🏥" },
  { id: "sports", en: "Sports", emoji: "⚽" },
  { id: "entertainment", en: "Entertainment", emoji: "🎬" },
  { id: "environment", en: "Environment", emoji: "🌱" },
  { id: "education", en: "Education", emoji: "🎓" },
  { id: "other", en: "Other", emoji: "🔗" },
];

export function setCategories(next) {
  if (Array.isArray(next) && next.length) CATEGORIES = next;
}

export function setCountries(next) {
  if (Array.isArray(next) && next.length) COUNTRIES = next;
}

export function countryByCode(code) {
  return COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
}

/**
 * Best-guess scope for a first run, from the device's region.
 *
 * Falls back to World, which is also the right answer for any region we do
 * not carry a dedicated feed for.
 */
export function detectCountry() {
  try {
    const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const locale of locales) {
      const region = String(locale).split("-")[1]?.toLowerCase();
      if (region && COUNTRIES.some((c) => c.code === region)) return region;
    }
  } catch {
    /* Locale unavailable; World is a safe default. */
  }
  return DEFAULT_COUNTRY;
}

/*
 * UI strings.
 *
 * English only. Hindi was removed and preserved on the
 * archive/hindi-localisation branch; translating properly means handling
 * several languages rather than special-casing one, and every article summary
 * would have to be generated in each.
 *
 * The table is kept so adding a language is a matter of adding a key here and
 * a matching entry in the backend's CATEGORY_NAMES, with nothing else in the
 * app being language-specific.
 */
export const DEFAULT_LANGUAGE = "en";

export const I18N = {
  en: {
    details: "Breakdown",
    source: "Read Full Story",
    back: "Close",
    noSummary: "No summary available.",
    allCats: "All Topics",
    allSources: "All Sources",
    topStoriesOnly: "Top Stories Only",
    general: "General",
    caughtUp: "You are all caught up!",
    noNewItems: "No new stories right now. Pull down to refresh.",
    noRecords: "Nothing matches these filters.",
    networkError: "Network error. Check your connection.",
    serverError: "Server error. Please try again later.",
    rateLimited: "Too many requests. Please wait a moment.",
    preferences: "Preferences",
    region: "Region",
    interests: "Interests",
    interestsHint: "Pick the topics you want to see. Leave empty for everything.",
    topic: "Topic",
    sourceLabel: "Source",
    search: "Search",
    date: "Date",
    theme: "Theme",
    done: "Done",
    reset: "Reset filters",
    saved: "Saved stories",
    dailyReminder: "Daily reminder",
  },
};

/** Look up a UI string, falling back to English. */
export function t(key, lang = DEFAULT_LANGUAGE) {
  return (I18N[lang] || I18N[DEFAULT_LANGUAGE])[key] ?? key;
}
