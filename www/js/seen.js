/*
 * Tracks which articles the reader has already seen, so the feed can skip them.
 *
 * Kept in memory for the lifetime of the app and mirrored to IndexedDB, capped
 * so the store cannot grow without bound.
 */

import { STORES, entries, put, remove } from "./idb.js";

const MAX_ENTRIES = 5000;
const TRIM_TO = 4000;

export const SeenManager = {
  ids: new Set(),

  async init() {
    const rows = await entries(STORES.seen);
    this.ids = new Set(rows.map(([id]) => id));
    if (rows.length > MAX_ENTRIES) await this.trim(rows);
  },

  /** Drop the oldest entries once the store outgrows its cap. */
  async trim(rows) {
    const sorted = [...rows].sort((a, b) => (Number(a[1]) || 0) - (Number(b[1]) || 0));
    const stale = sorted.slice(0, sorted.length - TRIM_TO);
    this.ids = new Set(sorted.slice(sorted.length - TRIM_TO).map(([id]) => id));
    await Promise.all(stale.map(([id]) => remove(STORES.seen, id)));
  },

  has(id) {
    return this.ids.has(String(id));
  },

  add(id) {
    const key = String(id);
    if (this.ids.has(key)) return;
    this.ids.add(key);
    put(STORES.seen, key, Date.now());
  },
};
