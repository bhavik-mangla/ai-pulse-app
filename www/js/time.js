/* Relative and absolute time formatting. */

const UNITS = [
  { limit: 31536000, suffix: "y" },
  { limit: 2592000, suffix: "mo" },
  { limit: 86400, suffix: "d" },
  { limit: 3600, suffix: "h" },
  { limit: 60, suffix: "m" },
];

/** "3h ago" style relative time; empty string for a missing or bad date. */
export function timeAgo(value) {
  if (!value) return "";
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "";

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";

  for (const { limit, suffix } of UNITS) {
    if (seconds >= limit) return `${Math.floor(seconds / limit)}${suffix} ago`;
  }
  return "just now";
}

export function formatHeaderDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
