/*
 * Minimal IndexedDB helper.
 *
 * Three features need durable storage - which stories have been seen, which
 * are bookmarked, and the reading streak - and each was otherwise going to
 * hand-roll the same open/transaction/promise dance.
 *
 * Every operation resolves rather than rejects on failure. Storage is
 * unavailable in private windows and can be blocked entirely by browser
 * settings, and none of these features is important enough to break the app
 * over.
 */

/*
 * Keep the original database name. Renaming it would orphan the read history
 * of everyone already using the app, so they would be shown stories they had
 * already read. Version 2 adds the bookmark and meta stores alongside it.
 */
const DB_NAME = "AIPulseSeenDB";
const DB_VERSION = 2;

export const STORES = {
  seen: "seen_articles",
  bookmarks: "bookmarks",
  meta: "meta",
};

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
}

async function withStore(storeName, mode, work) {
  const db = await openDatabase();
  if (!db) return null;
  try {
    const tx = db.transaction(storeName, mode);
    return await work(tx.objectStore(storeName));
  } catch {
    return null;
  }
}

function request(req) {
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function get(storeName, key) {
  return withStore(storeName, "readonly", (store) => request(store.get(key)));
}

export async function put(storeName, key, value) {
  return withStore(storeName, "readwrite", (store) => request(store.put(value, key)));
}

export async function remove(storeName, key) {
  return withStore(storeName, "readwrite", (store) => request(store.delete(key)));
}

/** Every [key, value] pair in a store, newest-insertion last. */
export async function entries(storeName) {
  return (
    (await withStore(storeName, "readonly", (store) => {
      return new Promise((resolve) => {
        const results = [];
        const req = store.openCursor();
        req.onsuccess = (event) => {
          const cursor = event.target.result;
          if (!cursor) {
            resolve(results);
            return;
          }
          results.push([String(cursor.key), cursor.value]);
          cursor.continue();
        };
        req.onerror = () => resolve(results);
      });
    })) || []
  );
}

export async function keys(storeName) {
  return (await entries(storeName)).map(([key]) => key);
}
