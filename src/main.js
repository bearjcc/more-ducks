// @ts-check
import { createGame, buyProducer, ducksPerSecond } from "./game/economy.js";
import { PRODUCERS } from "./data/producers.js";
import {
  ANSWERS_PER_DUCK_PER_SEC,
  BASE_DEMAND,
  COIN_PER_ANSWER,
  coherenceValueMult,
  decayHype,
  demand,
  servedPerSecond,
  supplyPerSecond,
  updateCoherence,
  ponderDepth,
  ponderEffectiveCoherence,
  ponderCoinBonus,
} from "./game/market.js";
import { defaultMeta, mergeSettings } from "./game/meta.js";
import { saveGame, loadGame, clearSave } from "./game/save.js";
import { actForStats } from "./game/progression.js";
import { createMods, applyUpgrades, buyUpgrade } from "./game/upgrades.js";
import { formatNumber } from "./game/format.js";
import { checkDex } from "./game/dex.js";
import { checkAchievements } from "./game/achievements.js";
import {
  sfxQuack,
  sfxBuy,
  sfxToast,
  sfxFeed,
  sfxBuyMode,
  sfxDuckdex,
  sfxActEntry,
  applyAudioSettings,
  unlockAudio,
  onActChange,
  onTimeOfDayChange,
  onVisibilityHidden,
} from "./game/sfx.js";
import {
  initUI,
  updateUI,
  showExchange,
  applyEra,
  pulseDuckCounter,
  pulseCoinCounter,
  markGameStarted,
  triggerEraBurst,
  updateBuyPondBtn,
  updateTabUnlocks,
} from "./ui/render.js";
import {
  resolveQuestion,
  pickThought,
  pickQuestion,
  pickAnswer,
} from "./game/quack.js";
import { intelligenceScore } from "./game/score.js";
import { dexMods, effectiveCoherence } from "./game/dexMods.js";
import { buyHypeCampaign, effectiveHypeDecay } from "./game/hype.js";
import { initShop, updateShop } from "./ui/shop.js";
import { initHype, updateHype } from "./ui/hype.js";
import { initUpgrades, updateUpgrades } from "./ui/upgrades.js";
import { initDex, updateDex } from "./ui/dex.js";
import { initModal, queueActEntry, queueWelcomeBack } from "./ui/modal.js";
import { initConfirm } from "./ui/confirm.js";
import { initEnding, showTerminal } from "./ui/ending.js";
import { applySettings, initSettings, bindSettingsGear } from "./ui/settings.js";
import { initTimeToggle } from "./ui/theme.js";
import { initToasts, showToast } from "./ui/toast.js";
import { initChat } from "./ui/chat.js";
import { initAnswerdex, updateAnswerdex } from "./ui/answerdex.js";
import { initAchievements, updateAchievements } from "./ui/achievements.js";
import { initRegions, updateRegions } from "./ui/regions.js";
import {
  needsFeed,
  feedDuck,
  recordAnswerForFeed,
  feedOpexPerSec,
} from "./game/feed.js";
import { recordAnswerdex } from "./game/answerdex.js";
import { allTabsUnlocked } from "./game/unlocks.js";
import {
  buyPond,
  clampDucksToCapacity,
  nextPondCost,
  pondCapacity,
} from "./game/capacity.js";
import {
  applyPendingRent,
  floodAustralia,
  rentRegion,
  tickRegions,
  unlockRegion,
  deploySaltwater,
  deploySpace,
} from "./game/regions.js";
import { checkEndings } from "./game/endings.js";
const AUTOSAVE_MS = 15000;
const OFFLINE_CAP_SEC = 8 * 3600;

const engine = createGame();
const meta = defaultMeta();
const mods = createMods();

const ducks = engine.resource("ducks");
const coins = engine.currency("coins");

const loadResult = loadGame(engine, meta);
meta.settings = mergeSettings(meta.settings);
applySettings(meta.settings);
applyAudioSettings(meta.settings);
onActChange(meta.era);
if (!loadResult.loaded && !meta.gameStartMs) meta.gameStartMs = Date.now();
document.addEventListener("pointerdown", () => unlockAudio(true), { once: true });
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
}

for (const p of PRODUCERS) {
  const prod = engine.producer(p.id);
  if (prod) prod.on("PRODUCER_OUTPUT", () => pulseDuckCounter());
}

ducks.on("RESOURCE_COUNT_UPDATED", (e) => {
  if (e.delta > 0) meta.totalDucksEver += e.delta;
});
applyUpgrades(engine, meta, mods);
updateCoherence(meta);
initModal();
initConfirm();
initToasts();
function creditManualAnswer(effCoherence, ponderBonus = 0) {
  const dex = dexMods(meta);
  const coherence = effCoherence ?? effectiveCoherence(meta, dex);
  const valueMult = coherenceValueMult(coherence);
  const coinGain = COIN_PER_ANSWER * valueMult * mods.coinMult / dex.coinUpkeep * (1 + ponderBonus);
  coins.incrementBy(coinGain);
  meta.answersTotal += 1;
  meta.questionsAnswered++;
  recordAnswerForFeed(meta);
  return coinGain;
}

function metaQuestionsAllowed() {
  return allTabsUnlocked(
    meta,
    coins.value,
    engine,
    supplyPerSecond(engine, mods),
  );
}

/**
 * @param {string} text
 * @returns {number} coin gain for juice
 */
/**
 * @param {string} text
 * @param {{ holdRepeat?: boolean }} [opts]
 */
function manualAsk(text, opts = {}) {
  if (meta.flags.ended || needsFeed(meta)) return 0;
  markGameStarted();
  const dex = dexMods(meta);
  const coherence = effectiveCoherence(meta, dex);
  const { question, answer, baseAnswer } = resolveQuestion({
    text,
    score: intelligenceScore(engine, meta),
    totalDucksEver: meta.totalDucksEver,
    coherence,
    metaQuestionsAllowed: metaQuestionsAllowed(),
  });
  const coinGain = creditManualAnswer(coherence);
  const isNew = recordAnswerdex(meta, baseAnswer);
  if (isNew) {
    sfxToast();
    showToast({ title: "New answer!", body: baseAnswer.slice(0, 60) });
  }

  sfxQuack({ holdRepeat: opts.holdRepeat });
  showExchange(question, answer);
  return coinGain;
}

function triggerEnding(id) {
  if (meta.flags.ended) return;
  meta.endingId = id;
  meta.flags.ended = true;
  saveGame(engine, meta);
  showTerminal(id, meta);
}

initChat({
  canAsk: () => !meta.flags.ended && !needsFeed(meta),
  onSend: (text, opts) => manualAsk(text, opts),
  pickAutoQuestion: (totalDucks) =>
    pickQuestion(totalDucks, undefined, metaQuestionsAllowed()),
  holdRepeatEnabled: () => mods.holdRepeat,
  holdIntervalMs: () => mods.holdRepeatIntervalMs,
});
initUI({
  isPonderingUnlocked: () => meta.ponderingUnlocked,
  onFeedTap: () => {
    if (needsFeed(meta)) {
      feedDuck(meta);
      meta.manualFeeds++;
      sfxFeed();
    }
  },
  onBuyPond: () => {
    if (buyPond(engine, meta)) sfxBuy();
  },
  onPonderStart: () => {
    if (!meta.ponderingUnlocked) return null;
    markGameStarted();
    const coherence = effectiveCoherence(meta, dexMods(meta));
    return {
      question: pickQuestion(meta.totalDucksEver, undefined, metaQuestionsAllowed()),
      thought: pickThought(coherence),
    };
  },
  onPonderTick: () => {
    const coherence = effectiveCoherence(meta, dexMods(meta));
    return { thought: pickThought(coherence) };
  },
  onPonderEnd: (holdMs) => {
    if (!meta.ponderingUnlocked) return null;
    const depth = ponderDepth(holdMs);
    const effCoherence = ponderEffectiveCoherence(effectiveCoherence(meta, dexMods(meta)), depth);
    const answer = pickAnswer(
      intelligenceScore(engine, meta),
      effCoherence,
      meta.totalDucksEver,
    );
    const coinGain = creditManualAnswer(effCoherence, ponderCoinBonus(depth));
    sfxQuack({ kind: "ponder" });
    return { answer, coinGain };
  },
});
initTimeToggle({
  meta,
  onChange: () => {
    applySettings(meta.settings);
    onTimeOfDayChange();
  },
});
initShop({
  onBuy: (id, qty) => {
    const hadProducers = PRODUCERS.some((p) => (engine.producer(p.id)?.count ?? 0) > 0);
    const bought = buyProducer(engine, id, qty, meta);
    if (bought > 0) {
      sfxBuy(qty > 1);
      if (!hadProducers && !meta.flags.firstProducerToast) {
        meta.flags.firstProducerToast = true;
        showToast({ title: "Duck-maker hired", body: "Check Stats for ducks/sec." });
      }
    }
    return bought > 0;
  },
  onBuyModeChange: (mode) => {
    meta.settings.buyMode = mode;
    sfxBuyMode();
  },
});
initHype({
  onBuy: (id) => {
    const launched = buyHypeCampaign(engine, meta, id);
    if (launched) {
      sfxBuy();
      return true;
    }
    return false;
  },
});
initUpgrades({
  onBuy: (id) => {
    const bought = buyUpgrade(engine, meta, mods, id);
    if (bought) {
      sfxBuy();
      if (id === "scalinglaws" && !meta.flags.ponderingIntroToast) {
        meta.flags.ponderingIntroToast = true;
        showToast({
          title: "Pondering unlocked",
          body: "Hold 🦆 while fed to stream thoughts, then release for a pondered answer.",
        });
      }
      const ending = checkEndings(engine, meta);
      if (ending) triggerEnding(ending);
    }
    return bought;
  },
});
initDex();
initAnswerdex();
initAchievements();
initRegions({
  onAction: (id, action) => {
    let ok = false;
    if (action === "unlock") ok = unlockRegion(engine, meta, id);
    else if (action === "rent") ok = rentRegion(engine, meta, id);
    else if (action === "flood") ok = floodAustralia(engine, meta);
    else if (action === "saltwater") ok = deploySaltwater(engine, meta);
    else if (action === "space") ok = deploySpace(engine, meta);
    if (ok) {
      sfxBuy();
      const ending = checkEndings(engine, meta);
      if (ending) triggerEnding(ending);
    }
    return ok;
  },
});
initSettings({ engine, meta, onImport: () => { suppressSave = false; } });
bindSettingsGear(/** @type {HTMLButtonElement|null} */ (document.getElementById("settings-gear")));

let suppressSave = false;
initEnding({
  onReset: () => { suppressSave = true; clearSave(); location.reload(); },
  onEnded: () => { meta.flags.ended = true; saveGame(engine, meta); },
});
checkDex(engine, meta);
updateDex(meta);
updateAnswerdex(meta);
updateAchievements(meta);
if (meta.flags.ended && meta.endingId) showTerminal(meta.endingId, meta);
if (loadResult.loaded) {
  applyOfflineProgress(loadResult.savedAt);
} else {
  queueActEntry(0, "Ask the duck");
}

function applyOfflineProgress(savedAt) {
  if (!savedAt) return;
  const elapsed = Math.min((Date.now() - savedAt) / 1000, OFFLINE_CAP_SEC);
  if (elapsed < 5) return;
  const dps = ducksPerSecond(engine);
  if (dps <= 0) return;
  const ducks0 = ducks.count;
  const offlineDucks = Math.floor(dps * elapsed);
  const dex = dexMods(meta);
  const supplyStart = ducks0 * ANSWERS_PER_DUCK_PER_SEC * mods.efficiencyMult;
  const ducksEnd = ducks0 + offlineDucks;
  const supplyEnd = ducksEnd * ANSWERS_PER_DUCK_PER_SEC * mods.efficiencyMult;
  const offlineDemand = BASE_DEMAND + dex.questionIntake;
  const avgServed = servedPerSecond((supplyStart + supplyEnd) / 2, offlineDemand);
  updateCoherence(meta);
  const coherence = effectiveCoherence(meta, dex);
  const valueMult = coherenceValueMult(coherence);
  const offlineCoins = avgServed * COIN_PER_ANSWER * valueMult * mods.coinMult / dex.coinUpkeep * elapsed;
  const offlineAnswers = avgServed * elapsed;
  if (offlineDucks > 0) {
    ducks.incrementBy(offlineDucks);
    clampDucksToCapacity(engine, meta);
    coins.incrementBy(offlineCoins);
    meta.answersTotal += offlineAnswers;
    const mins = Math.round(elapsed / 60);
    pulseDuckCounter();
    pulseCoinCounter();
    queueWelcomeBack({
      mins,
      ducks: formatNumber(offlineDucks),
      coins: formatNumber(offlineCoins, 0),
    });
  }
}

function advanceEras() {
  const target = actForStats({ totalDucksEver: meta.totalDucksEver, answersTotal: meta.answersTotal });
  if (target <= meta.era) return;
  for (let e = meta.era + 1; e <= target; e++) {
    queueActEntry(e);
    triggerEraBurst();
    sfxActEntry();
  }
  meta.era = target;
  applyEra(meta.era);
  onActChange(meta.era);
}
applyEra(meta.era);
advanceEras();
function announceNewDucks() {
  const newly = checkDex(engine, meta);
  if (newly.length > 0) {
    applyUpgrades(engine, meta, mods);
    sfxDuckdex();
  }
}

let lastFrame = Date.now();
let lastAutosave = lastFrame;

function frame() {
  const now = Date.now();
  const dtSec = Math.min((now - lastFrame) / 1000, 1);
  lastFrame = now;
  if (!meta.flags.ended) {
    const ending = checkEndings(engine, meta);
    if (ending) {
      triggerEnding(ending);
    }
  }

  engine.onTick(now);
  clampDucksToCapacity(engine, meta);
  const dex = dexMods(meta);
  decayHype(engine, dtSec, dex, effectiveHypeDecay(meta));
  updateCoherence(meta);
  const coherence = effectiveCoherence(meta, dex);
  const marketDemand = demand(meta, engine, dex);
  const supply = supplyPerSecond(engine, mods);
  const served = servedPerSecond(supply, marketDemand) * dtSec;
  const valueMult = coherenceValueMult(coherence);
  if (served > 0) {
    coins.incrementBy(served * COIN_PER_ANSWER * valueMult * mods.coinMult / dex.coinUpkeep);
    meta.answersTotal += served;
  }

  const answersPerSec = servedPerSecond(supply, marketDemand);
  const feedOpex = feedOpexPerSec(answersPerSec, meta);
  if (feedOpex > 0) coins.incrementBy(-feedOpex * dtSec);
  tickRegions(meta, dtSec);
  if (meta.pendingRent > 0) applyPendingRent(engine, meta);
  advanceEras();
  announceNewDucks();
  checkAchievements({ engine, meta }, (spec) => {
    sfxToast();
    showToast(spec);
  });
  const dps = ducksPerSecond(engine);
  const hype = engine.currency("hype")?.value ?? 0;
  const cap = pondCapacity(meta);
  const duckN = Math.floor(ducks.count);
  updateUI({
    ducks: duckN,
    coins: Math.floor(coins.value),
    ducksPerSec: dps,
    answersPerSec,
    supplyPerSec: supply,
    demandPerSec: marketDemand,
    hype,
    questionsAnswered: meta.questionsAnswered,
    feedOpexPerSec: feedOpex,
    pondCap: cap,
    pondDucks: duckN,
    hungry: needsFeed(meta),
    canAsk: !meta.flags.ended && !needsFeed(meta),
  });
  updateTabUnlocks({ meta, coins: coins.value, engine, answersPerSec });
  updateShop({ engine, meta, coins: coins.value, era: meta.era });
  updateHype({ meta, coins: coins.value });
  updateUpgrades({ engine, meta, coins: coins.value });
  updateDex(meta);
  updateAnswerdex(meta);
  updateAchievements(meta);
  updateRegions({ engine, meta, era: meta.era });
  const pondCost = nextPondCost(meta);
  updateBuyPondBtn(pondCost, coins.value >= pondCost, meta.era >= 2);
  if (!suppressSave && now - lastAutosave > AUTOSAVE_MS) {
    saveGame(engine, meta);
    lastAutosave = now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener("visibilitychange", () => {
  onVisibilityHidden(document.hidden);
  if (!suppressSave && document.hidden) saveGame(engine, meta);
});
addEventListener("beforeunload", () => {
  if (!suppressSave) saveGame(engine, meta);
});

/**
 * Fast-forward simulation for capture tooling (steps the main loop with fake dt).
 * @param {number} deltaSec
 */
function advanceGame(deltaSec) {
  if (deltaSec <= 0 || meta.flags.ended) return;
  let remaining = deltaSec;
  while (remaining > 0) {
    const step = Math.min(remaining, 0.25);
    lastFrame = Date.now() - step * 1000;
    frame();
    remaining -= step;
  }
}

// @ts-ignore
window.MoreDucks = {
  engine,
  meta,
  mods,
  ducks,
  coins,
  save: () => saveGame(engine, meta),
  advanceGame,
};
