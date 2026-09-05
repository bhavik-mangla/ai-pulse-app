/* Mutable app state shared between modules. */

import { STORAGE_KEYS } from "./config.js";

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
  lang: readStored(STORAGE_KEYS.lang, "en"),
  feedType: "news",
  page: 1,
  isLoading: false,
  endReached: false,
  highImpactOnly: false,
  sources: [],
  renderedIds: new Set(),
};

export function resetPagination() {
  state.page = 1;
  state.endReached = false;
  state.renderedIds.clear();
}
