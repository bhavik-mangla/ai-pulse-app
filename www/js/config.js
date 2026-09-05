/* Static configuration, metadata defaults and UI strings. */

export const API_BASE = "https://aipulse-daily.vercel.app";
export const API = `${API_BASE}/api/v1`;

export const PAGE_SIZE = 15;
export const CACHE_NAME = "aipulse-cache";

export const STORAGE_KEYS = {
  theme: "gov_theme",
  lang: "gov_lang",
};

/* File extension per source logo bundled under assets/logos/. */
export const LOGO_EXT = {
  egazette_central: "svg",
  et_top_stories: "png",
  ibbi_updates: "png",
  income_tax: "png",
  irdai_updates: "webp",
  mca_updates: "png",
  meity_updates: "svg",
  mha_updates: "svg",
  mint_top_stories: "png",
  pib_press_releases: "jpg",
  rbi_circulars: "png",
  rbi_press_releases: "png",
  sebi_news: "jpg",
  bs_top_stories: "png",
};

/* Overridden at runtime by /config/metadata; these are the offline defaults. */
export let CATEGORIES = [
  { id: "jobs", en: "Jobs", hi: "नौकरियां" },
  { id: "schemes", en: "Schemes", hi: "योजनाएं" },
  { id: "tax", en: "Tax", hi: "कर (Tax)" },
  { id: "agriculture", en: "Agriculture", hi: "कृषि" },
  { id: "education", en: "Education", hi: "शिक्षा" },
  { id: "health", en: "Health", hi: "स्वास्थ्य" },
  { id: "legal", en: "Legal", hi: "कानूनी" },
  { id: "gazette", en: "Gazette", hi: "राजपत्र" },
  { id: "finance", en: "Finance", hi: "वित्त" },
  { id: "infrastructure", en: "Infrastructure", hi: "बुनियादी ढांचा" },
  { id: "environment", en: "Environment", hi: "पर्यावरण" },
  { id: "defense", en: "Defense", hi: "रक्षा" },
  { id: "technology", en: "Technology", hi: "प्रौद्योगिकी" },
  { id: "local_governance", en: "Local Governance", hi: "स्थानीय शासन" },
  { id: "women_child", en: "Women & Child", hi: "महिला एवं बाल" },
  { id: "social_welfare", en: "Social Welfare", hi: "समाज कल्याण" },
  { id: "other", en: "Other", hi: "अन्य" },
];

export let AUDIENCES = [
  "Retail Investors", "Farmers", "MSMEs", "Students", "Corporate Legal",
  "Tax Professionals", "Chartered Accountants", "Bankers", "Insurance Professionals",
  "Insolvency Professionals", "Fintech Entities", "Healthcare Providers", "Exporters",
  "Tech Professionals",
];

export function setCategories(next) {
  if (Array.isArray(next) && next.length) CATEGORIES = next;
}

export function setAudiences(next) {
  if (Array.isArray(next) && next.length) AUDIENCES = next;
}

export const I18N = {
  en: {
    details: "Breakdown",
    source: "Official Source",
    back: "Close",
    noSummary: "No summary available.",
    allCats: "All Categories",
    allPortals: "All Portals",
    whoAreYou: "Who are you?",
    highImpactOnly: "High Impact Only",
    general: "General",
    caughtUp: "You are all caught up!",
    noNewItems: "No new items found. Try again later.",
    noRecords: "No records found.",
    networkError: "Network error. Check your connection.",
    serverError: "Server error. Please try again later.",
    rateLimited: "Too many requests. Please wait a moment.",
  },
  hi: {
    details: "सारांश",
    source: "आधिकारिक स्रोत",
    back: "बंद करें",
    noSummary: "सारांश उपलब्ध नहीं है।",
    allCats: "सभी श्रेणियां",
    allPortals: "सभी पोर्टल",
    whoAreYou: "आप कौन हैं?",
    highImpactOnly: "केवल उच्च प्रभाव",
    general: "सामान्य",
    caughtUp: "आप पूरी तरह अपडेट हैं!",
    noNewItems: "कोई नया आइटम नहीं मिला। बाद में पुनः प्रयास करें।",
    noRecords: "कोई रिकॉर्ड नहीं मिला।",
    networkError: "नेटवर्क त्रुटि। अपना कनेक्शन जांचें।",
    serverError: "सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।",
    rateLimited: "बहुत अधिक अनुरोध। कृपया थोड़ा प्रतीक्षा करें।",
  },
};
