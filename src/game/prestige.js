// @ts-check
import { createGame } from "./economy.js";
import { defaultMeta } from "./meta.js";
import { PRODUCERS } from "../data/producers.js";
import { applyUpgrades, createMods } from "./upgrades.js";

/**
 * First prestige unlocks at The Quack Boom (economy.md §6 act 4, id 3).
 * All three investment axes are open; demand has outrun supply — time to ship v2.
 */
export const PRESTIGE_MIN_ERA = 3;

/** Permanent coin/research income bonus per banked citation (+10% each). */
export const CITATION_MULT_STEP = 0.1;

/**
 * Citations earned for the current run before reset (minimum 1).
 * @param {{ answersTotal?: number }} meta
 * @returns {number}
 */
export function citationsEarnedThisRun(meta) {
  const bonus = Math.floor(Math.sqrt((meta.answersTotal ?? 0) / 5000));
  return 1 + bonus;
}

/**
 * Stacking prestige multiplier on coin and research income.
 * @param {import("./meta.js").Meta} meta
 * @returns {number}
 */
export function citationsMult(meta) {
  return 1 + (meta.citations ?? 0) * CITATION_MULT_STEP;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {boolean}
 */
export function canPrestige(meta) {
  return meta.era >= PRESTIGE_MIN_ERA && !meta.flags.ended;
}

/**
 * Reset engine currencies, ducks, and producers to a fresh-run baseline.
 * @param {any} engine
 */
export function resetEngineEconomy(engine) {
  const fresh = createGame();
  for (const key in engine.currencies) {
    engine.currency(key).value = fresh.currency(key).value;
  }
  const ducks = engine.resource("ducks");
  const target = fresh.resource("ducks").count;
  const delta = target - ducks.count;
  if (delta !== 0) ducks.incrementBy(delta);
  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (!prod) continue;
    const owned = prod.count;
    if (owned > 0) prod.incrementBy(-owned);
    prod.resetTimers();
  }
}

/**
 * Reset run-scoped meta fields. Keeps collection, citations, prestige, settings.
 * @param {import("./meta.js").Meta} meta
 */
export function resetMetaEconomy(meta) {
  meta.clickPower = 1;
  meta.era = 0;
  meta.upgradesOwned = [];
  meta.coherence = 0;
  meta.answersTotal = 0;
  meta.demand = 0;
  meta.totalDucksEver = 1;
}

/**
 * Ship the next model generation: bank citations, reset economy, unlock pondering once.
 * @param {any} engine
 * @param {import("./meta.js").Meta} meta
 * @param {import("./upgrades.js").Mods} mods
 * @returns {{ ok: boolean, citationsEarned?: number, firstPonder?: boolean }}
 */
export function performPrestige(engine, meta, mods) {
  if (!canPrestige(meta)) return { ok: false };

  const earned = citationsEarnedThisRun(meta);
  meta.citations += earned;
  const firstPonder = meta.prestigeCount === 0;
  if (firstPonder) meta.ponderingUnlocked = true;
  meta.prestigeCount += 1;

  resetEngineEconomy(engine);
  resetMetaEconomy(meta);
  applyUpgrades(engine, meta, mods);

  return { ok: true, citationsEarned: earned, firstPonder };
}

/** Self-check: fresh prestige state matches createGame + defaultMeta economy slice. */
export function _prestigeSelfCheck() {
  const engine = createGame();
  const meta = defaultMeta();
  meta.era = PRESTIGE_MIN_ERA;
  meta.answersTotal = 50_000;
  meta.dexUnlocked = ["mallard"];
  meta.quackmarksOwned = ["bench1"];
  meta.upgradesOwned = ["bighands"];
  meta.clickPower = 5;
  meta.coherence = 0.8;
  meta.demand = 2;
  meta.totalDucksEver = 999;
  meta.questionsAnswered = 42;
  meta.achievements = ["a"];
  engine.currency("coins").incrementBy(900);
  engine.currency("research").incrementBy(20);
  engine.currency("hype").incrementBy(50);
  engine.resource("ducks").incrementBy(99);
  const prod = engine.producer(PRODUCERS[0].id);
  if (prod) prod.incrementBy(3);

  const mods = createMods();
  applyUpgrades(engine, meta, mods);
  const result = performPrestige(engine, meta, mods);
  if (!result.ok || result.citationsEarned !== citationsEarnedThisRun({ answersTotal: 50_000 })) {
    throw new Error("prestige self-check: performPrestige failed");
  }
  if (!meta.ponderingUnlocked || meta.prestigeCount !== 1) {
    throw new Error("prestige self-check: first-run unlock/count");
  }
  if (engine.currency("coins").value !== 0 || engine.currency("research").value !== 0) {
    throw new Error("prestige self-check: currencies not reset");
  }
  if (engine.resource("ducks").count !== 1) {
    throw new Error("prestige self-check: ducks not reset");
  }
  if (prod && prod.count !== 0) {
    throw new Error("prestige self-check: producers not reset");
  }
  if (meta.upgradesOwned.length !== 0 || meta.era !== 0) {
    throw new Error("prestige self-check: meta economy not reset");
  }
  if (meta.dexUnlocked.length !== 1 || meta.quackmarksOwned.length !== 1) {
    throw new Error("prestige self-check: collection not kept");
  }
  if (meta.questionsAnswered !== 42) {
    throw new Error("prestige self-check: lifetime vanity not kept");
  }
}
