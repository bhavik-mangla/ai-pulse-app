/* Backend access: metadata, sources and the paginated feed. */

import { API, CACHE_NAME, PAGE_SIZE, setCategories, setCountries } from "./config.js";

/** Thrown for non-2xx responses so callers can react to the status code. */
export class ApiError extends Error {
  constructor(status) {
    super(`Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Build the feed URL for a page.
 *
 * `filters` mirrors the preferences sheet; empty values are omitted so the
 * cache key stays stable for the common unfiltered case.
 */
export function buildFeedUrl(page, filters) {
  const { query, country, sourceId, categories, date, topStoriesOnly } = filters;
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(PAGE_SIZE),
    country,
  });
  if (query) params.set("q", query);
  if (sourceId) params.set("source_id", sourceId);
  if (categories?.length) params.set("categories", categories.join(","));
  if (date) params.set("date", date);
  if (topStoriesOnly) params.set("impact_level", "high_only");

  const path = query ? "feed/search" : "feed/latest";
  return `${API}/${path}?${params.toString()}`;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}

export async function fetchFeedPage(url) {
  return getJson(url);
}

/** Pull filter metadata, falling back to the bundled defaults on failure. */
export async function fetchMetadata() {
  try {
    const data = await getJson(`${API}/config/metadata`);
    setCategories(data.categories);
    setCountries(data.countries);
  } catch {
    /* Bundled defaults in config.js remain in effect. */
  }
}

/** Outlets carried for a scope, so the source filter only offers real ones. */
export async function fetchSources(country) {
  try {
    const query = country ? `?country=${encodeURIComponent(country)}` : "";
    return await getJson(`${API}/config/sources${query}`);
  } catch {
    return [];
  }
}

/* --- Offline cache for the first page --- */

async function openCache() {
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function readCachedPage(url) {
  const cache = await openCache();
  if (!cache) return null;
  try {
    const hit = await cache.match(url);
    return hit ? await hit.json() : null;
  } catch {
    return null;
  }
}

export async function writeCachedPage(url, payload) {
  const cache = await openCache();
  if (!cache) return;
  try {
    await cache.put(url, new Response(JSON.stringify(payload)));
  } catch {
    /* Cache writes are best-effort. */
  }
}
