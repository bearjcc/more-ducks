// @ts-check
import { createGame, buyProducer, ducksPerSecond } from "./game/economy.js";
import {
  ANSWERS_PER_DUCK_PER_SEC,
  BASE_DEMAND,
  COIN_PER_ANSWER,
  coherenceValueMult,
  decayHype,
  demand,
  researchFromServed,
  servedPerSecond,
  supplyPerSecond,
  updateCoherence,
  ponderDepth,
  ponderEffectiveCoherence,
  ponderResearchBonus,
} from "./game/market.js";
import { defaultMeta, mergeSettings } from "./game/meta.js";
import { saveGame, loadGame, clearSave } from "./game/save.js";
import { actForStats } from "./game/progression.js";
import { createMods, applyUpgrades, buyUpgrade } from "./game/upgrades.js";
import { formatNumber } from "./game/format.js";
import { checkDex } from "./game/dex.js";
import { checkAchievements } from "./game/achievements.js";
import { sfxQuack, sfxBuy, sfxToast } from "./game/sfx.js";
import { ERAS } from "./data/eras.js";
import { PRODUCERS } from "./data/producers.js";
import {
  initUI,
  updateUI,
  showExchange,
  logMessage,
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
  pickQuack,
} from "./game/quack.js";
import { intelligenceScore } from "./game/score.js";
import { dexMods, effectiveCoherence } from "./game/dexMods.js";
import { buyHypeCampaign } from "./game/hype.js";
import { citationsMult } from "./game/prestige.js";
import { initShop, updateShop } from "./ui/shop.js";
import { initHype, updateHype } from "./ui/hype.js";
import { initUpgrades, updateUpgrades } from "./ui/upgrades.js";
import { initQuackmarks, updateQuackmarks } from "./ui/quackmarks.js";
import { buyQuackmark } from "./game/quackmarks.js";
import { QUACKMARKS } from "./data/quackmarks.js";
import { initDex, updateDex } from "./ui/dex.js";
import { initPrestige, updatePrestige, bindPrestigeCtx } from "./ui/prestige.js";
import { initModal, queueModal, queueActEntry, queueWelcomeBack } from "./ui/modal.js";
import { initEnding, showTerminal } from "./ui/ending.js";
import { applySettings, initSettings } from "./ui/settings.js";
import { initTimeToggle } from "./ui/theme.js";
import { initToasts, showToast } from "./ui/toast.js";
import { initChat } from "./ui/chat.js";
import { initAnswerdex, updateAnswerdex } from "./ui/answerdex.js";
import { initRegions, updateRegions } from "./ui/regions.js";
import {
  needsFeed,
  feedDuck,
  recordAnswerForFeed,
  feedOpexPerSec,
} from "./game/feed.js";
import { recordAnswerdex } from "./game/answerdex.js";
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
const research = engine.currency("research");

const loadResult = loadGame(engine, meta);
meta.settings = mergeSettings(meta.settings);
applySettings(meta.settings);

if (!loadResult.loaded && !meta.gameStartMs) meta.gameStartMs = Date.now();

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
updateCoherence(meta, engine);

initModal();
initToasts();

function creditManualAnswer(effCoherence, extraResearch = 0) {
  const dex = dexMods(meta);
  const coherence = effCoherence ?? effectiveCoherence(meta, dex);
  const valueMult = coherenceValueMult(coherence);
  const citeMult = citationsMult(meta);
  const coinGain = COIN_PER_ANSWER * valueMult * mods.crumbMult / dex.coinUpkeep * citeMult;
  coins.incrementBy(coinGain);
  const researchBase = researchFromServed(1) + extraResearch;
  research.incrementBy(researchBase / dex.researchUpkeep * citeMult);
  meta.answersTotal += 1;
  meta.questionsAnswered++;
  recordAnswerForFeed(meta);
  return coinGain;
}

/**
 * @param {string} text
 * @returns {number} coin gain for juice
 */
function manualAsk(text) {
  if (meta.flags.ended || needsFeed(meta)) return 0;
  markGameStarted();
  const dex = dexMods(meta);
  const coherence = effectiveCoherence(meta, dex);

  const { question, answer, baseQuack } = resolveQuestion({
    text,
    score: intelligenceScore(engine, meta),
    totalDucksEver: meta.totalDucksEver,
    coherence,
  });

  const coinGain = creditManualAnswer(coherence);
  const isNew = recordAnswerdex(meta, baseQuack);
  if (isNew) {
    sfxToast();
    showToast({ title: "New quack!", body: baseQuack.slice(0, 60) });
  }

  sfxQuack();
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
  onSend: (text) => manualAsk(text),
  holdRepeatEnabled: () => mods.holdRepeat,
  holdIntervalMs: () => mods.holdRepeatIntervalMs,
});

initUI({
  isPonderingUnlocked: () => meta.ponderingUnlocked,
  onFeedTap: () => {
    if (needsFeed(meta)) {
      feedDuck(meta);
      meta.manualFeeds++;
      sfxBuy();
    }
  },
  onBuyPond: () => {
    if (buyPond(engine, meta)) {
      sfxBuy();
      logMessage("Another pond. More capacity. Same ducks, more room.", true);
    }
  },
  onPonderStart: () => {
    if (!meta.ponderingUnlocked) return null;
    markGameStarted();
    sfxQuack();
    const coherence = effectiveCoherence(meta, dexMods(meta));
    return {
      question: pickQuestion(meta.totalDucksEver),
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
    const answer = pickQuack(
      intelligenceScore(engine, meta),
      effCoherence,
      meta.totalDucksEver,
    );
    const coinGain = creditManualAnswer(effCoherence, ponderResearchBonus(depth));
    return { answer, coinGain };
  },
});

initTimeToggle({ meta, onChange: () => applySettings(meta.settings) });

initShop({
  onBuy: (id, qty) => {
    const bought = buyProducer(engine, id, qty, meta);
    if (bought > 0) sfxBuy();
    return bought > 0;
  },
  onBuyModeChange: (mode) => { meta.settings.buyMode = mode; },
});

initHype({
  onBuy: (id) => {
    const launched = buyHypeCampaign(engine, meta, id);
    if (launched) {
      sfxBuy();
      logMessage(`Launched: ${launched.emoji} ${launched.name}. Demand is trending.`, true);
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
      const ending = checkEndings(engine, meta);
      if (ending) triggerEnding(ending);
    }
    return bought;
  },
});

initQuackmarks({
  onBuy: (id) => {
    const bought = buyQuackmark(engine, meta, id);
    if (bought) {
      sfxBuy();
      sfxToast();
      showToast({ title: bought.label, body: "Intelligence improved. Quack quality unchanged." });
      logMessage(`Certified: ${bought.name}. ${bought.label}.`, true);
      return true;
    }
    return false;
  },
});

initDex();
initAnswerdex();
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

let suppressSave = false;
initEnding({
  onReset: () => { suppressSave = true; clearSave(); location.reload(); },
  onEnded: () => { meta.flags.ended = true; saveGame(engine, meta); },
});
initPrestige({
  onPrestige: () => {
    updateCoherence(meta, engine);
    applyEra(meta.era);
    saveGame(engine, meta);
  },
});

checkDex(engine, meta);
updateDex(meta);
updateAnswerdex(meta);

if (meta.flags.ended && meta.endingId) showTerminal(meta.endingId, meta);

if (loadResult.loaded) {
  logMessage("Welcome back to the pond.");
  applyOfflineProgress(loadResult.savedAt);
} else {
  logMessage(ERAS[0].intro, true);
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
  updateCoherence(meta, engine);
  const coherence = effectiveCoherence(meta, dex);
  const valueMult = coherenceValueMult(coherence);
  const citeMult = citationsMult(meta);
  const offlineCoins = avgServed * COIN_PER_ANSWER * valueMult * mods.crumbMult / dex.coinUpkeep * citeMult * elapsed;
  const offlineAnswers = avgServed * elapsed;

  if (offlineDucks > 0) {
    ducks.incrementBy(offlineDucks);
    clampDucksToCapacity(engine, meta);
    coins.incrementBy(offlineCoins);
    research.incrementBy(researchFromServed(offlineAnswers) / dex.researchUpkeep * citeMult);
    meta.answersTotal += offlineAnswers;
    const mins = Math.round(elapsed / 60);
    logMessage(`While you were away (~${mins} min), the flock made ${formatNumber(offlineDucks)} ducks.`, true);
    pulseDuckCounter();
    pulseCoinCounter();
    sfxToast();
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
    logMessage(ERAS[e].intro, true);
    queueActEntry(e);
    triggerEraBurst();
  }
  meta.era = target;
  applyEra(meta.era);
}
applyEra(meta.era);
advanceEras();

function scoreBadgeText(meta) {
  if (!meta.quackmarksOwned.length) return "";
  const lastId = meta.quackmarksOwned[meta.quackmarksOwned.length - 1];
  const q = QUACKMARKS.find((x) => x.id === lastId);
  return q ? q.label : "";
}

function announceNewDucks() {
  const newly = checkDex(engine, meta);
  if (newly.length > 0) applyUpgrades(engine, meta, mods);
  for (const d of newly) {
    logMessage(`New duck catalogued: ${d.emoji} ${d.name}. ${d.demandBlurb}`, true);
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
  decayHype(engine, dtSec, dex);
  updateCoherence(meta, engine);
  const coherence = effectiveCoherence(meta, dex);
  const marketDemand = demand(meta, engine, dex);
  const supply = supplyPerSecond(engine, mods);
  const served = servedPerSecond(supply, marketDemand) * dtSec;
  const valueMult = coherenceValueMult(coherence);
  const citeMult = citationsMult(meta);

  if (served > 0) {
    coins.incrementBy(served * COIN_PER_ANSWER * valueMult * mods.crumbMult / dex.coinUpkeep * citeMult);
    research.incrementBy(researchFromServed(served) / dex.researchUpkeep * citeMult);
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
    score: intelligenceScore(engine, meta),
    questionsAnswered: meta.questionsAnswered,
    scoreBadge: scoreBadgeText(meta),
    feedOpexPerSec: feedOpex,
    pondCap: cap,
    pondDucks: duckN,
    hungry: needsFeed(meta),
    canAsk: !meta.flags.ended && !needsFeed(meta),
  });

  updateTabUnlocks({ meta, coins: coins.value, engine, answersPerSec, research: research.value });

  updateShop({ engine, meta, coins: coins.value, era: meta.era });
  updateHype({ meta, coins: coins.value });
  updateUpgrades({ engine, meta, coins: coins.value, research: research.value });
  updateQuackmarks({ engine, meta, coins: coins.value });
  bindPrestigeCtx({ engine, meta, mods });
  updatePrestige({ engine, meta, mods });
  updateDex(meta);
  updateAnswerdex(meta);
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
  if (!suppressSave && document.hidden) saveGame(engine, meta);
});
addEventListener("beforeunload", () => {
  if (!suppressSave) saveGame(engine, meta);
});

// @ts-ignore
window.MoreDucks = { engine, meta, mods, ducks, coins, research, save: () => saveGame(engine, meta) };
