/*
 * Share a story as an image.
 *
 * The card is redrawn on a canvas rather than screenshotted. Rasterising live
 * DOM needs a library like html2canvas, which would mean either a build step
 * or vendoring a large dependency into a project that has neither. Drawing it
 * by hand is a few dozen lines, has no dependency, works offline, and gives a
 * share image designed for sharing rather than a photo of a phone screen.
 */

import { parseSummary } from "./card.js";

/* 4:5 portrait: the aspect ratio that survives every social feed uncropped. */
const WIDTH = 1080;
const HEIGHT = 1350;
const MARGIN = 88;

const THEME = {
  bg: "#0f1219",
  panel: "#161b22",
  text: "#ffffff",
  muted: "#94a3b8",
  accent: "#38bdf8",
};

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Break text into lines that fit `maxWidth`, up to `maxLines`.
 * The last line is ellipsised if there is more text than fits.
 */
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && line) lines.push(line);

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    if (words.join(" ") !== lines.join(" ")) {
      while (last && ctx.measureText(`${last}…`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}…`;
    }
  }
  return lines;
}

function drawCard(item) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  const inner = WIDTH - MARGIN * 2;

  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  /* Accent bar, so the image is recognisable at thumbnail size. */
  ctx.fillStyle = THEME.accent;
  ctx.fillRect(0, 0, WIDTH, 12);

  let y = MARGIN + 40;

  // Source
  ctx.fillStyle = THEME.accent;
  ctx.font = "800 34px Inter, system-ui, sans-serif";
  ctx.fillText(String(item.source_name || "").toUpperCase(), MARGIN, y);
  y += 78;

  // Headline
  const { oneLiner, bullets } = parseSummary(item.summary);
  ctx.fillStyle = THEME.text;
  ctx.font = "800 62px Inter, system-ui, sans-serif";
  const headline = wrapText(ctx, oneLiner || item.title, inner, 7);
  for (const line of headline) {
    ctx.fillText(line, MARGIN, y);
    y += 82;
  }

  // Key details
  if (bullets.length) {
    y += 34;
    ctx.font = "400 38px Inter, system-ui, sans-serif";
    for (const bullet of bullets.slice(0, 3)) {
      const lines = wrapText(ctx, bullet, inner - 46, 2);
      ctx.fillStyle = THEME.accent;
      ctx.fillText("•", MARGIN, y);
      ctx.fillStyle = THEME.muted;
      for (const line of lines) {
        ctx.fillText(line, MARGIN + 46, y);
        y += 54;
      }
      y += 18;
    }
  }

  // Footer
  const footerHeight = 150;
  const footerY = HEIGHT - footerHeight;
  ctx.fillStyle = THEME.panel;
  roundedRect(ctx, MARGIN, footerY, inner, 96, 24);
  ctx.fill();

  ctx.fillStyle = THEME.text;
  ctx.font = "900 40px Inter, system-ui, sans-serif";
  ctx.fillText("AI Pulse", MARGIN + 36, footerY + 60);

  ctx.fillStyle = THEME.muted;
  ctx.font = "600 30px Inter, system-ui, sans-serif";
  const tagline = "Short news, worth your time";
  ctx.fillText(tagline, MARGIN + 36 + ctx.measureText("AI Pulse   ").width + 40, footerY + 58);

  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    if (canvas.toBlob) canvas.toBlob(resolve, "image/png");
    else resolve(null);
  });
}

function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Share a story.
 *
 * Tries, in order: the Capacitor Share plugin with the image written to the
 * device cache; the Web Share API with a file; the Web Share API with a link;
 * and finally copying the link to the clipboard. Every step degrades rather
 * than failing, because sharing is offered on every card and must not error
 * on a platform that lacks one of these.
 */
export async function shareStory(item, { onStatus } = {}) {
  const link = item.fetch_url || item.source_url || "";
  const title = item.title || "AI Pulse";
  const canvas = drawCard(item);
  const blob = await canvasToBlob(canvas);

  const plugins = window.Capacitor?.Plugins;

  if (plugins?.Share && plugins?.Filesystem && blob) {
    try {
      const base64 = await blobToBase64(blob);
      if (base64) {
        const name = `aipulse-${Date.now()}.png`;
        const written = await plugins.Filesystem.writeFile({
          path: name,
          data: base64,
          directory: "CACHE",
        });
        await plugins.Share.share({ title, text: title, url: written.uri });
        return "shared";
      }
    } catch {
      /* Fall through to the web paths. */
    }
  }

  if (blob && navigator.canShare) {
    try {
      const file = new File([blob], "story.png", { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: title });
        return "shared";
      }
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url: link });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(link || title);
    onStatus?.("Link copied");
    return "copied";
  } catch {
    return "unavailable";
  }
}

/** Exposed for tests: the rendered canvas, without sharing it. */
export function renderShareCard(item) {
  return drawCard(item);
}
