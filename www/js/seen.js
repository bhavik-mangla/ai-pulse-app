/*
 * Tracks which articles the reader has already seen, so the feed can skip them.
 *
 * Backed by IndexedDB and capped so the store cannot grow without bound.
 */

const DB_NAME = "AIPulseSeenDB";
const STORE_NAME = "seen_articles";
const MAX_ENTRIES = 5000;
const TRIM_TO = 4000;

export const SeenManager = {
  db: null,
  ids: new Set(),

  async init() {
    try {
      this.db = await openDatabase();
    } catch {
      /* No persistence available; the in-memory set still de-dupes this run. */
      return;
    }
    try {
      const entries = await readAll(this.db);
      this.ids = new Set(entries.map((e) => e.id));
      if (entries.length > MAX_ENTRIES) await this.trim(entries);
    } catch {
      /* Reading failed; start empty rather than blocking startup. */
    }
  },

  /** Drop the oldest entries once the store outgrows its cap. */
  async trim(entries) {
    const sorted = [...entries].sort((a, b) => a.ts - b.ts);
    const stale = sorted.slice(0, sorted.length - TRIM_TO);
    const keep = sorted.slice(sorted.length - TRIM_TO);
    this.ids = new Set(keep.map((e) => e.id));
    try {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      stale.forEach((e) => store.delete(e.id));
    } catch {
      /* Trimming is best-effort. */
    }
  },

  has(id) {
    return this.ids.has(String(id));
  },

  add(id) {
    const key = String(id);
    if (this.ids.has(key)) return;
    this.ids.add(key);
    if (!this.db) return;
    try {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(Date.now(), key);
    } catch {
      /* Best-effort persistence. */
    }
  },
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, 1);
    } catch (err) {
      reject(err);
      return;
    }
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("indexeddb blocked"));
  });
}

function readAll(db) {
  return new Promise((resolve, reject) => {
    /* readonly: this path only reads, unlike the previous readwrite cursor. */
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const entries = [];
    const req = store.openCursor();
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) {
        resolve(entries);
        return;
      }
      entries.push({ id: String(cursor.key), ts: Number(cursor.value) || 0 });
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}
