// @ts-check
/**
 * Unified save/load. The continuum-engine ships its own localStorage save, but
 * we roll our own so a single versioned blob holds the engine entities, our
 * meta state, and a `savedAt` timestamp (needed for offline progress).
 */

import { mergeSettings } from "./meta.js";

const SAVE_KEY = "moreDucks.save";
const SAVE_VERSION = 4;

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

/** Copy pre-A1 `breadcrumbs` currency into `coins` before deserialise. */
function migrateCurrencies(currencies) {
  if (!currencies || typeof currencies !== "object") return;
  if (currencies.breadcrumbs != null && currencies.coins == null) {
    currencies.coins = { ...currencies.breadcrumbs, type: "coins" };
    delete currencies.breadcrumbs;
  }
}

/** Bump older saves to current schema before validate/deserialise. */
function migrateSaveData(data) {
  if (!data || typeof data !== "object") return;
  if (data.version === 1) {
    migrateCurrencies(data.currencies);
    data.version = 2;
  }
  if (data.version === 2) {
    const m = data.meta;
    if (m && typeof m === "object") {
      if (!Array.isArray(m.answerdexSeen)) m.answerdexSeen = [];
      if (typeof m.answersSinceFeed !== "number") m.answersSinceFeed = 0;
      if (typeof m.autoFeederOwned !== "boolean") m.autoFeederOwned = false;
      if (typeof m.pondCount !== "number") m.pondCount = 0;
      if (typeof m.pondCapacityBonus !== "number") m.pondCapacityBonus = 0;
      if (typeof m.gameStartMs !== "number") m.gameStartMs = data.savedAt || Date.now();
      if (m.endingId === undefined) m.endingId = null;
      if (!Array.isArray(m.regionsUnlocked)) m.regionsUnlocked = ["home"];
      if (!Array.isArray(m.regionsRented)) m.regionsRented = [];
      if (typeof m.australiaFlooded !== "boolean") m.australiaFlooded = false;
      if (typeof m.saltwaterDeployed !== "boolean") m.saltwaterDeployed = false;
      if (typeof m.spaceDeployed !== "boolean") m.spaceDeployed = false;
      if (typeof m.gameDayAccumulator !== "number") m.gameDayAccumulator = 0;
      if (typeof m.pendingRent !== "number") m.pendingRent = 0;
      if (typeof m.holdRepeatIntervalMs !== "number") m.holdRepeatIntervalMs = 450;
      if (typeof m.manualFeeds !== "number") m.manualFeeds = 0;
    }
    data.version = SAVE_VERSION;
  }
  if (data.version === 3) {
    const m = data.meta;
    if (m && typeof m === "object") {
      delete m.pondWater;
      if (typeof m.spaceDeployed !== "boolean") m.spaceDeployed = false;
    }
    data.version = SAVE_VERSION;
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
  migrateSaveData(data);
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
  if (!Array.isArray(meta.quackmarksOwned)) meta.quackmarksOwned = [];
  if (typeof meta.coherence !== "number") meta.coherence = 0;
  if (typeof meta.answersTotal !== "number") meta.answersTotal = 0;
  if (typeof meta.demand !== "number") meta.demand = 0;
  if (typeof meta.ponderingUnlocked !== "boolean") meta.ponderingUnlocked = false;
  if (typeof meta.citations !== "number") meta.citations = 0;
  if (typeof meta.prestigeCount !== "number") meta.prestigeCount = 0;
  if (typeof meta.answersSinceFeed !== "number") meta.answersSinceFeed = 0;
  if (typeof meta.autoFeederOwned !== "boolean") meta.autoFeederOwned = false;
  if (!Array.isArray(meta.answerdexSeen)) meta.answerdexSeen = [];
  if (typeof meta.pondCount !== "number") meta.pondCount = 0;
  if (typeof meta.pondCapacityBonus !== "number") meta.pondCapacityBonus = 0;
  if (typeof meta.gameStartMs !== "number") meta.gameStartMs = Date.now();
  if (meta.endingId === undefined) meta.endingId = null;
  if (!Array.isArray(meta.regionsUnlocked)) meta.regionsUnlocked = ["home"];
  if (!Array.isArray(meta.regionsRented)) meta.regionsRented = [];
  if (typeof meta.australiaFlooded !== "boolean") meta.australiaFlooded = false;
  if (typeof meta.saltwaterDeployed !== "boolean") meta.saltwaterDeployed = false;
  if (typeof meta.spaceDeployed !== "boolean") meta.spaceDeployed = false;
  if (typeof meta.gameDayAccumulator !== "number") meta.gameDayAccumulator = 0;
  if (typeof meta.pendingRent !== "number") meta.pendingRent = 0;
  if (typeof meta.holdRepeatIntervalMs !== "number") meta.holdRepeatIntervalMs = 450;
  if (typeof meta.manualFeeds !== "number") meta.manualFeeds = 0;
  if (meta.autoFeederOwned || meta.upgradesOwned.includes("autofeeder")) meta.autoFeederOwned = true;

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
