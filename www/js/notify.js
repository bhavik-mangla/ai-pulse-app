/*
 * Daily reading reminder.
 *
 * These are *local* notifications, scheduled on the device. That is a
 * deliberate choice: server-driven push would need Firebase and APNs
 * credentials, a device-token store and a server to send from, none of which
 * this project has, and all of which cost money or maintenance.
 *
 * A local daily reminder gets most of the retention benefit for none of that.
 * The trade is that it cannot say what today's top story is, only that there
 * is one waiting. If the project ever grows a push backend, this module is the
 * seam to replace.
 */

import { readStored, writeStored } from "./state.js";

const STORAGE_KEY_ENABLED = "digest_enabled";
const STORAGE_KEY_TIME = "digest_time";

const DEFAULT_TIME = "08:00";
const NOTIFICATION_ID = 1;

const TITLE = "Your stories are ready";
const BODY = "A few minutes, and you are caught up.";

/*
 * The reminder carries a real headline when we have one worth carrying.
 *
 * On-device models cannot run in the background and background fetch is
 * throttled hard on iOS, so the content is chosen when the app is open and
 * scheduled ahead. It can therefore name a story from earlier in the day
 * rather than this minute's, which is a fair trade for a notification that
 * says something instead of nothing.
 */
let pendingHeadline = null;

export function setDigestHeadline(headline) {
  pendingHeadline = headline || null;
}

export function getSettings() {
  return {
    enabled: readStored(STORAGE_KEY_ENABLED, "false") === "true",
    time: readStored(STORAGE_KEY_TIME, DEFAULT_TIME),
  };
}

function parseTime(value) {
  const [hour, minute] = String(value || DEFAULT_TIME).split(":").map(Number);
  return {
    hour: Number.isFinite(hour) ? hour : 8,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

/** True when this device can schedule a daily reminder at all. */
export function isSupported() {
  return Boolean(window.Capacitor?.Plugins?.LocalNotifications || "Notification" in window);
}

async function scheduleNative(plugin, time) {
  const permission = await plugin.requestPermissions();
  if (permission?.display !== "granted") return false;

  /* Replace rather than stack: rescheduling must not leave the old time live. */
  await plugin.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  await plugin.schedule({
    notifications: [
      {
        id: NOTIFICATION_ID,
        title: pendingHeadline ? "Worth knowing today" : TITLE,
        body: pendingHeadline || BODY,
        schedule: { on: parseTime(time), repeats: true, allowWhileIdle: true },
      },
    ],
  });
  return true;
}

/**
 * Turn the daily reminder on or off.
 *
 * Returns "enabled", "disabled", "denied" when the reader refused permission,
 * or "unsupported" on a platform that cannot schedule one.
 */
export async function setDigest(enabled, time) {
  const chosen = time || getSettings().time;
  const plugin = window.Capacitor?.Plugins?.LocalNotifications;

  if (!enabled) {
    writeStored(STORAGE_KEY_ENABLED, "false");
    try {
      await plugin?.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    } catch {
      /* Nothing scheduled; nothing to cancel. */
    }
    return "disabled";
  }

  if (plugin) {
    try {
      const ok = await scheduleNative(plugin, chosen);
      if (!ok) return "denied";
      writeStored(STORAGE_KEY_ENABLED, "true");
      writeStored(STORAGE_KEY_TIME, chosen);
      return "enabled";
    } catch {
      return "unsupported";
    }
  }

  /*
   * In a browser there is no way to schedule a notification for a future day
   * without a service worker and a push subscription. Record the preference so
   * the setting is not lost, and say so honestly rather than pretending.
   */
  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return "denied";
      writeStored(STORAGE_KEY_ENABLED, "true");
      writeStored(STORAGE_KEY_TIME, chosen);
      return "web-only";
    } catch {
      return "unsupported";
    }
  }

  return "unsupported";
}

/** Re-apply the saved schedule on launch, in case the OS dropped it. */
export async function restoreDigest() {
  const { enabled, time } = getSettings();
  if (!enabled) return;
  const plugin = window.Capacitor?.Plugins?.LocalNotifications;
  if (!plugin) return;
  try {
    const pending = await plugin.getPending();
    const exists = pending?.notifications?.some((n) => n.id === NOTIFICATION_ID);
    if (!exists) await scheduleNative(plugin, time);
  } catch {
    /* Best effort. */
  }
}
