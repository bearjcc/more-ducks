// @ts-check

/** @typedef {keyof typeof UI_MAP} UiSoundId */

const BASE = new URL("../../assets/audio/", import.meta.url);

/** @type {Record<string, { ogg: string, m4a: string }>} */
export const UI_MAP = {
  tab: { ogg: "ui/click_001.ogg", m4a: "ui/click_001.m4a" },
  buy1: { ogg: "ui/confirmation_002.ogg", m4a: "ui/confirmation_002.m4a" },
  buyBulk: { ogg: "ui/confirmation_003.ogg", m4a: "ui/confirmation_003.m4a" },
  toast: { ogg: "ui/confirmation_004.ogg", m4a: "ui/confirmation_004.m4a" },
  collect: { ogg: "ui/confirmation_001.ogg", m4a: "ui/confirmation_001.m4a" },
  feed: { ogg: "ui/drop_002.ogg", m4a: "ui/drop_002.m4a" },
  buyMode: { ogg: "ui/switch_002.ogg", m4a: "ui/switch_002.m4a" },
  viewUp: { ogg: "ui/maximize_002.ogg", m4a: "ui/maximize_002.m4a" },
  viewDown: { ogg: "ui/minimize_002.ogg", m4a: "ui/minimize_002.m4a" },
  act: { ogg: "ui/open_001.ogg", m4a: "ui/open_001.m4a" },
  duckdex: { ogg: "ui/glitch_001.ogg", m4a: "ui/glitch_001.m4a" },
  pip: { ogg: "ui/tick_002.ogg", m4a: "ui/tick_002.m4a" },
  ending: { ogg: "ui/close_001.ogg", m4a: "ui/close_001.m4a" },
};

/** @type {Map<string, AudioBuffer>} */
const cache = new Map();

/** @returns {boolean} */
export function preferM4a() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (ua.includes("Safari") && !ua.includes("Chrome"));
}

/**
 * @param {AudioContext} ctx
 * @param {string} rel
 */
async function fetchDecode(ctx, rel) {
  const res = await fetch(new URL(rel, BASE).href);
  if (!res.ok) throw new Error(`audio fetch ${rel}`);
  const ab = await res.arrayBuffer();
  return ctx.decodeAudioData(ab);
}

/**
 * @param {AudioContext} ctx
 */
export async function preloadUiSamples(ctx) {
  const tasks = Object.entries(UI_MAP).map(async ([id, paths]) => {
    const rel = preferM4a() ? paths.m4a : paths.ogg;
    try {
      const buf = await fetchDecode(ctx, rel);
      cache.set(id, buf);
    } catch {
      const fallback = preferM4a() ? paths.ogg : paths.m4a;
      try {
        cache.set(id, await fetchDecode(ctx, fallback));
      } catch { /* offline tests */ }
    }
  });
  await Promise.all(tasks);
}

/**
 * @param {string} id
 * @returns {AudioBuffer|undefined}
 */
export function getUiBuffer(id) {
  return cache.get(id);
}
