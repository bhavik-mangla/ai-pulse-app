/* Static configuration, metadata defaults and UI strings. */

export const API_BASE = "https://aipulse-daily.vercel.app";
export const API = `${API_BASE}/api/v1`;

export const PAGE_SIZE = 15;
export const CACHE_NAME = "aipulse-cache";

export const STORAGE_KEYS = {
  theme: "gov_theme",
  lang: "gov_lang",
  country: "feed_country",
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

/* Scopes offered a Hindi translation; mirrors what the backend generates. */
export const HINDI_COUNTRIES = new Set(["in"]);

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
  { id: "world", en: "World", hi: "विश्व", emoji: "🌍" },
  { id: "business", en: "Business", hi: "व्यापार", emoji: "📈" },
  { id: "politics", en: "Politics", hi: "राजनीति", emoji: "🏛" },
  { id: "technology", en: "Technology", hi: "प्रौद्योगिकी", emoji: "💻" },
  { id: "science", en: "Science", hi: "विज्ञान", emoji: "🔬" },
  { id: "health", en: "Health", hi: "स्वास्थ्य", emoji: "🏥" },
  { id: "sports", en: "Sports", hi: "खेल", emoji: "⚽" },
  { id: "entertainment", en: "Entertainment", hi: "मनोरंजन", emoji: "🎬" },
  { id: "environment", en: "Environment", hi: "पर्यावरण", emoji: "🌱" },
  { id: "education", en: "Education", hi: "शिक्षा", emoji: "🎓" },
  { id: "other", en: "Other", hi: "अन्य", emoji: "🔗" },
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

export function offersHindi(code) {
  return HINDI_COUNTRIES.has(code);
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
    topic: "Topic",
    sourceLabel: "Source",
    search: "Search",
    date: "Date",
    language: "Language",
    theme: "Theme",
    done: "Done",
    reset: "Reset filters",
  },
  hi: {
    details: "सारांश",
    source: "पूरी खबर पढ़ें",
    back: "बंद करें",
    noSummary: "सारांश उपलब्ध नहीं है।",
    allCats: "सभी विषय",
    allSources: "सभी स्रोत",
    topStoriesOnly: "केवल प्रमुख खबरें",
    general: "सामान्य",
    caughtUp: "आप पूरी तरह अपडेट हैं!",
    noNewItems: "अभी कोई नई खबर नहीं। रिफ्रेश करने के लिए नीचे खींचें।",
    noRecords: "इन फ़िल्टरों से कुछ मेल नहीं खाता।",
    networkError: "नेटवर्क त्रुटि। अपना कनेक्शन जांचें।",
    serverError: "सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।",
    rateLimited: "बहुत अधिक अनुरोध। कृपया थोड़ा प्रतीक्षा करें।",
    preferences: "प्राथमिकताएं",
    region: "क्षेत्र",
    topic: "विषय",
    search: "खोजें",
    date: "तारीख",
    sourceLabel: "स्रोत",
    language: "भाषा",
    theme: "थीम",
    done: "पूर्ण",
    reset: "फ़िल्टर रीसेट करें",
  },
};
