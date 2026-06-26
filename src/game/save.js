// @ts-check

import { mergeSettings } from "./meta.js";
import { upgradeLevel } from "./levels.js";
const SAVE_KEY = "moreDucks.save";

const SAVE_VERSION = 6;

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
 * Migrate legacy meta fields into v6 shape.
 * @param {any} meta
 */

function migrateMeta(meta) {
  if (!meta.upgradeLevels || typeof meta.upgradeLevels !== "object") {
    meta.upgradeLevels = {};
  }

  if (!meta.marketingLevels || typeof meta.marketingLevels !== "object") {
    meta.marketingLevels = {};
  }

  if (Array.isArray(meta.upgradesOwned)) {
    for (const id of meta.upgradesOwned) {
      if (!meta.upgradeLevels[id]) meta.upgradeLevels[id] = 1;
    }

    delete meta.upgradesOwned;
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
  if (data.version !== SAVE_VERSION && data.version !== 5) {
    return `Unsupported save version (${data.version}).`;
  }

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
  if (data.version === 5) data.version = SAVE_VERSION;
  applyMap(engine.currencies, data.currencies);
  applyMap(engine.resources, data.resources);
  applyMap(engine.producers, data.producers);
  const settings = mergeSettings(data.meta.settings);
  Object.assign(meta, data.meta);
  meta.settings = settings;
  migrateMeta(meta);
  if (!Array.isArray(meta.achievements)) meta.achievements = [];
  if (typeof meta.questionsAnswered !== "number") meta.questionsAnswered = 0;
  if (typeof meta.coherence !== "number") meta.coherence = 0;
  if (typeof meta.answersTotal !== "number") meta.answersTotal = 0;
  if (typeof meta.demand !== "number") meta.demand = 0;
  if (typeof meta.ponderingUnlocked !== "boolean") meta.ponderingUnlocked = false;
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
  if (meta.autoFeederOwned || upgradeLevel(meta, "autofeeder") >= 1) meta.autoFeederOwned = true;
  if (upgradeLevel(meta, "scalinglaws") >= 1) meta.ponderingUnlocked = true;
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
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
    } catch (_e) {
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
