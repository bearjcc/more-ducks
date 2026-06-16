// @ts-check
import { createGame, buyProducer, ducksPerSecond, CRUMB_PER_DUCK_PER_SEC } from "./game/economy.js";
import { defaultMeta, mergeSettings } from "./game/meta.js";
import { saveGame, loadGame, clearSave } from "./game/save.js";
import { eraForDucks } from "./game/progression.js";
import { createMods, applyUpgrades, buyUpgrade } from "./game/upgrades.js";
import { formatNumber } from "./game/format.js";
import { checkDex, dexComplete } from "./game/dex.js";
import { checkAchievements } from "./game/achievements.js";
import { sfxQuack, sfxBuy, sfxToast } from "./game/sfx.js";
import { ERAS } from "./data/eras.js";
import { DUCKS } from "./data/ducks.js";
import { PRODUCERS } from "./data/producers.js";
import { initUI, updateUI, logMessage, applyEra, pulseDuckCounter } from "./ui/render.js";
import { initShop, updateShop } from "./ui/shop.js";
import { initUpgrades, updateUpgrades } from "./ui/upgrades.js";
import { initDex, updateDex } from "./ui/dex.js";
import { initModal, queueModal } from "./ui/modal.js";
import { initEnding, updateFinaleCta, showTerminal } from "./ui/ending.js";
import { applySettings, initSettings } from "./ui/settings.js";
import { initToasts, showToast } from "./ui/toast.js";

const AUTOSAVE_MS = 15000;
const OFFLINE_CAP_SEC = 8 * 3600; // generous but bounded catch-up

const engine = createGame();
const meta = defaultMeta();
const mods = createMods();

const ducks = engine.resource("ducks");
const breadcrumbs = engine.currency("breadcrumbs");

const loadResult = loadGame(engine, meta);
meta.settings = mergeSettings(meta.settings);
applySettings(meta.settings);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
}

// Producer batches pulse the duck counter (idle feedback).
for (const p of PRODUCERS) {
  const prod = engine.producer(p.id);
  if (prod) prod.on("PRODUCER_OUTPUT", () => pulseDuckCounter());
}

// Lifetime ducks drives era progression. Counting via the resource event keeps
// manual quacks, producer output, and offline catch-up in one place.
ducks.on("RESOURCE_COUNT_UPDATED", (e) => {
  if (e.delta > 0) meta.totalDucksEver += e.delta;
});

// Rebuild derived multipliers from owned upgrades (must precede offline calc).
applyUpgrades(engine, meta, mods);

initModal();
initToasts();
initUI({
  onQuack() {
    ducks.incrementBy(meta.clickPower);
    breadcrumbs.incrementBy(meta.clickPower * mods.crumbMult);
    sfxQuack();
    return meta.clickPower;
  },
});
initShop({
  onBuy: (id, qty) => {
    if (buyProducer(engine, id, qty) > 0) sfxBuy();
  },
  onBuyModeChange: (mode) => { meta.settings.buyMode = mode; },
});
initUpgrades({
  onBuy: (id) => {
    if (buyUpgrade(engine, meta, mods, id)) sfxBuy();
  },
});
initDex();
initSettings({
  engine,
  meta,
  onImport: () => { suppressSave = false; },
});

// When resetting we must stop the unload-save from rewriting the cleared save.
let suppressSave = false;
initEnding({
  onReset: () => { suppressSave = true; clearSave(); location.reload(); },
  getTotalDucks: () => meta.totalDucksEver,
  onEnded: () => { meta.flags.ended = true; saveGame(engine, meta); },
});

// Catalogue any breeds already earned by the loaded state (silently — no spam).
checkDex(engine, meta);
updateDex(meta);

// If a previous session already reached the end, go straight to the finale.
if (meta.flags.ended) showTerminal();

if (loadResult.loaded) {
  logMessage("Welcome back to the pond.");
  applyOfflineProgress(loadResult.savedAt);
} else {
  logMessage(ERAS[0].intro, true);
  queueModal({ emoji: ERAS[0].emoji, title: ERAS[0].name, body: ERAS[0].modalBody, button: "Tap the duck" });
}

/**
 * Grant capped offline earnings based on the last save time. Producer output is
 * a constant rate while away, so duck gain is exact; breadcrumbs use the exact
 * integral of a linearly growing flock.
 * @param {number|undefined} savedAt
 */
function applyOfflineProgress(savedAt) {
  if (!savedAt) return;
  const elapsed = Math.min((Date.now() - savedAt) / 1000, OFFLINE_CAP_SEC);
  if (elapsed < 5) return;

  const dps = ducksPerSecond(engine);
  // ponytail: no producers means no offline duck/crumb catch-up — early game is tap-driven.
  if (dps <= 0) return;

  const ducks0 = ducks.count;
  const offlineDucks = Math.floor(dps * elapsed);
  const avgDucks = ducks0 + (dps * elapsed) / 2;
  const offlineCrumbs = avgDucks * CRUMB_PER_DUCK_PER_SEC * mods.crumbMult * elapsed;

  if (offlineDucks > 0) {
    ducks.incrementBy(offlineDucks);
    breadcrumbs.incrementBy(offlineCrumbs);
    const mins = Math.round(elapsed / 60);
    logMessage(`While you were away (~${mins} min), the flock made ${formatNumber(offlineDucks)} ducks.`, true);
  }
}

/** Fire era-entry beats (log + modal) up to the era implied by lifetime ducks. */
function advanceEras() {
  const target = eraForDucks(meta.totalDucksEver);
  if (target <= meta.era) return;
  for (let e = meta.era + 1; e <= target; e++) {
    logMessage(ERAS[e].intro, true);
    queueModal({ emoji: ERAS[e].emoji, title: ERAS[e].name, body: ERAS[e].modalBody });
  }
  meta.era = target;
  applyEra(meta.era);
}
applyEra(meta.era); // reflect the loaded/initial era before the first advance
advanceEras();

/** Catalogue newly-earned breeds and announce them in the log. */
function announceNewDucks() {
  const newly = checkDex(engine, meta);
  for (const d of newly) {
    logMessage(`New duck catalogued: ${d.emoji} ${d.name}.`, true);
  }
}

// Main loop.
let lastFrame = Date.now();
let lastAutosave = lastFrame;
function frame() {
  const now = Date.now();
  // Clamp the per-frame delta so a backgrounded tab doesn't dump a huge crumb
  // batch — real offline catch-up is handled on load.
  const dtSec = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;

  engine.onTick(now);
  if (ducks.count > 0) {
    breadcrumbs.incrementBy(ducks.count * CRUMB_PER_DUCK_PER_SEC * mods.crumbMult * dtSec);
  }
  advanceEras();
  announceNewDucks();
  checkAchievements({ engine, meta }, (spec) => {
    sfxToast();
    showToast(spec);
  });

  updateUI({
    ducks: Math.floor(ducks.count),
    breadcrumbs: Math.floor(breadcrumbs.value),
    ducksPerSec: ducksPerSecond(engine),
  });
  updateShop({ engine, breadcrumbs: breadcrumbs.value, era: meta.era });
  updateUpgrades({ engine, meta, breadcrumbs: breadcrumbs.value });
  updateDex(meta);

  // Endgame: once the world is era 4, surface the finale (or the remaining
  // Duckdex to complete first).
  if (!meta.flags.ended && meta.era >= 4) {
    updateFinaleCta(dexComplete(meta), meta.dexUnlocked.length, DUCKS.length);
  }

  if (!suppressSave && now - lastAutosave > AUTOSAVE_MS) {
    saveGame(engine, meta);
    lastAutosave = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Save when the player leaves or backgrounds the tab (but not while resetting).
addEventListener("visibilitychange", () => {
  if (!suppressSave && document.hidden) saveGame(engine, meta);
});
addEventListener("beforeunload", () => {
  if (!suppressSave) saveGame(engine, meta);
});

// Console handle for debugging and modding (this is a single-player, offline,
// open-source toy — peeking at the engine is part of the fun).
// @ts-ignore
window.MoreDucks = { engine, meta, mods, ducks, breadcrumbs, save: () => saveGame(engine, meta) };
