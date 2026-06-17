// @ts-check
/**
 * Unified save/load. The continuum-engine ships its own localStorage save, but
 * we roll our own so a single versioned blob holds the engine entities, our
 * meta state, and a `savedAt` timestamp (needed for offline progress).
 */

import { mergeSettings } from "./meta.js";
import { POND_MAX } from "./pond.js";

const SAVE_KEY = "moreDucks.save";
const SAVE_VERSION = 1;

/**
 * @param {Record<string, { serialise: () => any }>} map
 * @returns {Record<string, any>}
 */
function serialiseMap(map) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const key in map) out[key] = map[key].serialise();
  return out;
}

/**
 * @param {Record<string, { deserialise: (o: any) => void }>} map
 * @param {Record<string, any> | undefined} saved
 */
function applyMap(map, saved) {
  if (!saved) return;
  for (const key in saved) {
    if (map[key]) map[key].deserialise(saved[key]);
  }
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {object}
 */
function buildSaveData(engine, meta) {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    meta,
    currencies: serialiseMap(engine.currencies),
    resources: serialiseMap(engine.resources),
    producers: serialiseMap(engine.producers),
  };
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 */
export function saveGame(engine, meta) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData(engine, meta)));
  } catch (e) {
    console.warn("Could not save game:", e);
  }
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {string}
 */
export function exportSaveText(engine, meta) {
  return JSON.stringify(buildSaveData(engine, meta));
}

/**
 * @param {any} data
 * @returns {string|null}
 */
function validateSave(data) {
  if (!data || typeof data !== "object") return "Invalid save format.";
  if (data.version !== SAVE_VERSION) return `Unsupported save version (${data.version}).`;
  if (!data.meta || !data.currencies || !data.resources || !data.producers) {
    return "Save is missing required data.";
  }
  return null;
}

/**
 * Load parsed save data into engine and meta (both mutated in place).
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {any} data
 * @returns {{ ok: boolean, error?: string, savedAt?: number }}
 */
function applySaveData(engine, meta, data) {
  const err = validateSave(data);
  if (err) return { ok: false, error: err };

  applyMap(engine.currencies, data.currencies);
  applyMap(engine.resources, data.resources);
  applyMap(engine.producers, data.producers);

  const settings = mergeSettings(data.meta.settings);
  Object.assign(meta, data.meta);
  meta.settings = settings;
  if (!Array.isArray(meta.achievements)) meta.achievements = [];
  if (typeof meta.questionsAnswered !== "number") meta.questionsAnswered = 0;
  if (typeof meta.pondWater !== "number") meta.pondWater = POND_MAX;
  if (!Array.isArray(meta.quackmarksOwned)) meta.quackmarksOwned = [];

  return { ok: true, savedAt: data.savedAt };
}

/**
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {string} raw
 * @returns {{ ok: boolean, error?: string, savedAt?: number }}
 */
export function importSaveText(engine, meta, raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Could not parse JSON." };
  }
  const result = applySaveData(engine, meta, data);
  if (result.ok) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      return { ok: false, error: "Save parsed but could not write to storage." };
    }
  }
  return result;
}

/**
 * Load a save into the given engine and meta (both mutated in place).
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @returns {{ loaded: boolean, savedAt?: number }}
 */
export function loadGame(engine, meta) {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { loaded: false };

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.warn("Corrupt save, starting fresh:", e);
    return { loaded: false };
  }

  const result = applySaveData(engine, meta, data);
  if (!result.ok) {
    console.warn("Invalid save, starting fresh:", result.error);
    return { loaded: false };
  }
  return { loaded: true, savedAt: result.savedAt };
}

/** Wipe the save (post-ending "Start a new pond" reset). */
export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
