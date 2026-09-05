/*
 * Saved stories.
 *
 * The whole item is stored, not just its id, so the saved list works offline
 * and keeps working after a story ages out of the feed. Stories are small
 * JSON, so this costs very little.
 */

import { STORES, entries, put, remove } from "./idb.js";

/* Kept in memory so the card renderer can ask synchronously while drawing. */
const savedIds = new Set();

export async function loadBookmarks() {
  const rows = await entries(STORES.bookmarks);
  savedIds.clear();
  rows.forEach(([id]) => savedIds.add(id));
  return savedIds.size;
}

export function isBookmarked(id) {
  return savedIds.has(String(id));
}

export function bookmarkCount() {
  return savedIds.size;
}

/** Toggle a story's saved state. Returns true when it is now saved. */
export async function toggleBookmark(item) {
  const id = String(item.id);
  if (savedIds.has(id)) {
    savedIds.delete(id);
    await remove(STORES.bookmarks, id);
    return false;
  }
  savedIds.add(id);
  await put(STORES.bookmarks, id, { ...item, savedAt: Date.now() });
  return true;
}

/** Saved stories, most recently saved first. */
export async function listBookmarks() {
  const rows = await entries(STORES.bookmarks);
  return rows
    .map(([, item]) => item)
    .filter(Boolean)
    .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

export async function clearBookmarks() {
  const ids = [...savedIds];
  savedIds.clear();
  await Promise.all(ids.map((id) => remove(STORES.bookmarks, id)));
}
