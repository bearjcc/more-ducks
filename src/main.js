// @ts-check
import { createGame, buyProducer, ducksPerSecond, CRUMB_PER_DUCK_PER_SEC } from "./game/economy.js";
import { defaultMeta } from "./game/meta.js";
import { saveGame, loadGame } from "./game/save.js";
import { eraForDucks } from "./game/progression.js";
import { ERAS } from "./data/eras.js";
import { initUI, updateUI, logMessage } from "./ui/render.js";
import { initShop, updateShop } from "./ui/shop.js";

const AUTOSAVE_MS = 15000;

const engine = createGame();
const meta = defaultMeta();

const ducks = engine.resource("ducks");
const breadcrumbs = engine.currency("breadcrumbs");

const loadResult = loadGame(engine, meta);

// Lifetime ducks drives era progression. Counting via the resource event keeps
// manual quacks and producer output in one place.
ducks.on("RESOURCE_COUNT_UPDATED", (e) => {
  if (e.delta > 0) meta.totalDucksEver += e.delta;
});

initUI({
  onQuack() {
    ducks.incrementBy(meta.clickPower);
    breadcrumbs.incrementBy(meta.clickPower); // hand-foraging bootstraps the economy
  },
});

initShop({
  onBuy: (id) => buyProducer(engine, id),
});

if (loadResult.loaded) {
  logMessage("Welcome back to the pond.");
} else {
  logMessage(ERAS[0].intro, true);
}

/** Fire era-entry beats up to the given era. */
function advanceEras() {
  const target = eraForDucks(meta.totalDucksEver);
  if (target <= meta.era) return;
  for (let e = meta.era + 1; e <= target; e++) {
    logMessage(ERAS[e].intro, true);
  }
  meta.era = target;
}

// Main loop.
let lastFrame = Date.now();
let lastAutosave = lastFrame;
function frame() {
  const now = Date.now();
  // Clamp the per-frame delta so returning to a backgrounded tab doesn't dump a
  // huge breadcrumb batch — real offline catch-up is handled separately on load.
  const dtSec = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;

  engine.onTick(now);
  if (ducks.count > 0) {
    breadcrumbs.incrementBy(ducks.count * CRUMB_PER_DUCK_PER_SEC * dtSec);
  }
  advanceEras();

  updateUI({
    ducks: Math.floor(ducks.count),
    breadcrumbs: Math.floor(breadcrumbs.value),
    ducksPerSec: ducksPerSecond(engine),
  });
  updateShop({ engine, breadcrumbs: breadcrumbs.value, era: meta.era });

  if (now - lastAutosave > AUTOSAVE_MS) {
    saveGame(engine, meta);
    lastAutosave = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Save when the player leaves or backgrounds the tab.
addEventListener("visibilitychange", () => {
  if (document.hidden) saveGame(engine, meta);
});
addEventListener("beforeunload", () => saveGame(engine, meta));
