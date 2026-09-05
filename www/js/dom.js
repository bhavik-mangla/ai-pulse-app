/*
 * DOM and escaping helpers.
 *
 * Feed content is scraped third-party HTML passed through an LLM, so every
 * value that reaches innerHTML or an href must be treated as hostile. The
 * WebView has the Capacitor bridge attached, so an injected script here is not
 * a cosmetic bug.
 */

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape a value for interpolation into HTML text or a quoted attribute. */
export function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}

/** True for a bundled relative asset path such as "assets/logos/bbc.png". */
function isBundledAsset(value) {
  return /^assets\/[\w./-]+$/.test(value) && !value.includes("..");
}

/**
 * Return an absolute http(s) URL safe to use as an href, or "" if it is not.
 *
 * Only http and https survive. This blocks `javascript:`, `data:` and friends,
 * which would otherwise execute when a card's source link is tapped.
 */
export function safeUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(String(value).trim());
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    /* Not an absolute URL - treat as unsafe. */
  }
  return "";
}

/**
 * Return a value safe to place inside a CSS url('...').
 *
 * Accepts absolute http(s) URLs and bundled relative asset paths, then encodes
 * the characters that could terminate the url() token and inject extra
 * declarations.
 */
export function safeCssUrl(value) {
  const raw = String(value || "").trim();
  const url = isBundledAsset(raw) ? raw : safeUrl(raw);
  if (!url) return "";
  return url.replace(/["'()\\\s]/g, encodeURIComponent);
}

export const $ = (id) => document.getElementById(id);

/** Read the value of an input/select by id, or "" when it is missing. */
export function valueOf(id) {
  const el = $(id);
  return el ? el.value : "";
}
