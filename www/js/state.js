/* Mutable app state shared between modules. */

import { DEFAULT_COUNTRY, STORAGE_KEYS, detectCountry } from "./config.js";

/** Safe localStorage read: private mode and blocked site data both throw. */
export function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Non-fatal: the preference just will not survive a restart. */
  }
}

export const state = {
  lang: "en",
  /*
   * Feed scope. Seeded from the device region on first run so a reader lands
   * on something relevant without being asked, and remembered thereafter.
   */
  country: readStored(STORAGE_KEYS.country, "") || detectCountry() || DEFAULT_COUNTRY,
  page: 1,
  isLoading: false,
  endReached: false,
  topStoriesOnly: false,
  sources: [],
  renderedIds: new Set(),
  /* Topics the reader chose; empty means show everything. */
  interests: new Set(readStored(STORAGE_KEYS.interests, "").split(",").filter(Boolean)),
  /* Which topic tab is active. FOR_YOU means "use my interests". */
  topic: "__for_you__",
  /* True while the saved-stories list is showing instead of the feed. */
  showingSaved: false,
};

/** Persist the chosen interests. */
export function saveInterests() {
  writeStored(STORAGE_KEYS.interests, [...state.interests].join(","));
}

export function resetPagination() {
  state.page = 1;
  state.endReached = false;
  state.renderedIds.clear();
}
