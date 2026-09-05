/*
 * Reading streak.
 *
 * The point of a short-news app is that you can finish it. Finishing should
 * feel like something, so the app counts consecutive days on which you read a
 * few stories and shows that when you reach the end of the feed.
 *
 * Deliberately forgiving: the streak counts days you read, and missing a
 * single day breaks it - but nothing nags you about it, and there is no
 * penalty beyond the number resetting.
 */

import { STORES, get, put } from "./idb.js";

/** Stories that count as having read for the day. */
const STORIES_FOR_A_DAY = 3;

const KEY = "streak";

const state = {
  current: 0,
  best: 0,
  lastDay: null,
  todayCount: 0,
  countedToday: false,
  loaded: false,
};

/** Local calendar day as YYYY-MM-DD; streaks are a local-time idea. */
function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function yesterdayOf(dayString) {
  const date = new Date(`${dayString}T00:00:00`);
  date.setDate(date.getDate() - 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function loadStreak() {
  const saved = (await get(STORES.meta, KEY)) || {};
  state.current = Number(saved.current) || 0;
  state.best = Number(saved.best) || 0;
  state.lastDay = saved.lastDay || null;

  if (state.lastDay === today()) {
    state.todayCount = Number(saved.todayCount) || 0;
    state.countedToday = true;
  } else {
    state.todayCount = 0;
    state.countedToday = false;
    /* A gap of more than one day ends the run. */
    if (state.lastDay && state.lastDay !== yesterdayOf(today())) state.current = 0;
  }

  state.loaded = true;
  return getStreak();
}

async function persist() {
  await put(STORES.meta, KEY, {
    current: state.current,
    best: state.best,
    lastDay: state.lastDay,
    todayCount: state.todayCount,
  });
}

/**
 * Record that a story was read. Returns true the moment today first counts
 * towards the streak, so the caller can celebrate it.
 */
export async function recordStoryRead() {
  if (!state.loaded) await loadStreak();

  state.todayCount += 1;
  if (state.countedToday || state.todayCount < STORIES_FOR_A_DAY) {
    await persist();
    return false;
  }

  const day = today();
  state.current = state.lastDay === yesterdayOf(day) ? state.current + 1 : 1;
  state.best = Math.max(state.best, state.current);
  state.lastDay = day;
  state.countedToday = true;
  await persist();
  return true;
}

export function getStreak() {
  return {
    current: state.current,
    best: state.best,
    todayCount: state.todayCount,
    countsToday: state.countedToday,
    storiesNeeded: Math.max(0, STORIES_FOR_A_DAY - state.todayCount),
  };
}
