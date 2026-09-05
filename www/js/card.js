/* Builds the markup for one feed card. */

import { API_BASE, CATEGORIES, I18N, LOGO_EXT } from "./config.js";
import { escapeHtml, safeCssUrl, safeUrl } from "./dom.js";
import { isBookmarked } from "./bookmarks.js";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000";

/**
 * Parse the stored summary, which is a JSON blob from the enrichment step but
 * may also be plain text from the extractive fallback.
 */
export function parseSummary(summary, lang = "en") {
  if (!summary) return { oneLiner: "", bullets: [] };

  let data = summary;
  if (typeof summary === "string") {
    const trimmed = summary.trim();
    if (trimmed.startsWith("{")) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        data = null;
      }
    } else {
      data = null;
    }
  }

  if (data && typeof data === "object") {
    return {
      oneLiner: data.quick_take || "",
      bullets: Array.isArray(data.key_details) ? data.key_details : [],
    };
  }

  const lines = String(summary).split("\n").filter((l) => l.trim());
  return { oneLiner: lines[0] || "", bullets: lines.slice(1) };
}

/** Resolve the best image for an item, preferring a bundled logo over remote. */
function resolveImage(item) {
  let url = item.image_url;

  if (url && url.startsWith("/static/logos/")) {
    url = `assets/logos/${url.split("/").pop()}`;
  } else if (url && url.startsWith("/")) {
    url = API_BASE + url;
  }

  if (!url) {
    const ext = LOGO_EXT[item.source_id] || "png";
    url = `assets/logos/${item.source_id}.${ext}`;
  }

  const isLogo = url.startsWith("assets/logos/") || url.includes("/logos/");
  return { url, isLogo };
}

export function renderCard(item, lang) {
  const strings = I18N[lang];
  const { oneLiner, bullets } = parseSummary(item.summary, lang);
  const isHighImpact = item.impact_level === "high" || item.impact_level === "critical";

  const { url: imageUrl, isLogo } = resolveImage(item);
  const safeImage = safeCssUrl(imageUrl) || safeCssUrl(FALLBACK_IMAGE);

  const category = CATEGORIES.find((c) => c.id === item.category);
  const isGeneral = !category || category.id === "other";
  const categoryLabel = category
    ? `${category.emoji ? `${category.emoji} ` : ""}${category[lang] || category.en}`
    : strings.general;

  const saved = isBookmarked(item.id);
  const sourceLabel = String(item.source_name || item.source_id || "").toUpperCase();
  const link = safeUrl(item.fetch_url) || safeUrl(item.source_url);

  const bulletHtml = bullets.length
    ? bullets.map((line) => `<li>${escapeHtml(line)}</li>`).join("")
    : `<li>${escapeHtml(strings.noSummary)}</li>`;

  const linkHtml = link
    ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"
          class="btn-action" data-action="open-source">${escapeHtml(strings.source)}</a>`
    : "";

  return `
    <div class="feed-item${isHighImpact ? " high-impact" : ""}" id="item-${escapeHtml(item.id)}"
         data-id="${escapeHtml(item.id)}">
      <div class="card-inner">
        <div class="card-front">
          <div class="card-image-wrap">
            <div class="card-image-bg${isLogo ? " logo" : ""}"
                 style="background-image:url('${safeImage}')"></div>
            <div class="card-source-tag">
              <span class="source-name-mini">${escapeHtml(sourceLabel)}</span>
            </div>
          </div>
          <div class="card-content-front">
            ${isGeneral ? "" : `<span class="card-category">${escapeHtml(categoryLabel)}</span>`}
            <h3 class="card-headline">${escapeHtml(oneLiner || item.title)}</h3>
            <div class="card-meta">
              <div class="card-meta-row">
                <div class="card-meta-left">
                  <span data-timeago="${escapeHtml(item.published_at || item.created_at || "")}"></span>
                </div>
                <div class="card-actions">
                  <button class="card-action${saved ? " active" : ""}" data-action="bookmark"
                          aria-label="${saved ? "Remove from saved" : "Save story"}"
                          aria-pressed="${saved}">${saved ? "★" : "☆"}</button>
                  <button class="card-action" data-action="share" aria-label="Share story">↗</button>
                </div>
              </div>
              <div class="card-meta-row">
                <span class="card-meta-hint">${escapeHtml(strings.details.toUpperCase())}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-back">
          <div class="card-back-title">${escapeHtml(item.title)}</div>
          <ul class="card-back-bullets">${bulletHtml}</ul>
          <div class="card-back-actions">
            ${linkHtml}
            <button class="btn-secondary" data-action="close-card">
              ${escapeHtml(strings.back)}
            </button>
          </div>
        </div>
      </div>
    </div>`;
}
