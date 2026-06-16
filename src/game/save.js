// @ts-check
/**
 * Unified save/load. The continuum-engine ships its own localStorage save, but
 * we roll our own so a single versioned blob holds the engine entities, our
 * meta state, and a `savedAt` timestamp (needed for offline progress).
 */

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
 */
export function saveGame(engine, meta) {
  const data = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    meta,
    currencies: serialiseMap(engine.currencies),
    resources: serialiseMap(engine.resources),
    producers: serialiseMap(engine.producers),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save game:", e);
  }
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

  // Future-version migrations would branch on data.version here.
  applyMap(engine.currencies, data.currencies);
  applyMap(engine.resources, data.resources);
  applyMap(engine.producers, data.producers);
  if (data.meta) Object.assign(meta, data.meta);

  return { loaded: true, savedAt: data.savedAt };
}

/** Wipe the save (used by a future "New Pond" reset). */
export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
