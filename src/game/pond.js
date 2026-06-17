// @ts-check
import { PRODUCERS } from "../data/producers.js";

/** Starting pond volume. Water only leaves; it never returns. */
export const POND_MAX = 25_000;

/** Each question asked at the tap costs a sip. */
export const WATER_PER_QUACK = 2;

/**
 * Litres per second drained by the flock and its infrastructure.
 * ponytail: sqrt(ducks) keeps late-game billions from emptying the pond in seconds.
 * @param {any} engine
 * @returns {number}
 */
export function pondDrainPerSec(engine) {
  const ducks = engine.resource("ducks")?.count ?? 0;
  let rate = Math.sqrt(Math.max(ducks, 0)) * 0.08;
  for (const p of PRODUCERS) {
    const prod = engine.producer(p.id);
    if (prod && prod.count > 0) {
      rate += prod.count * (0.15 * (p.era + 1));
    }
  }
  return rate;
}

/**
 * @param {import("./meta.js").Meta} meta
 * @param {number} amount
 */
export function drainPond(meta, amount) {
  if (amount <= 0) return;
  meta.pondWater = Math.max(0, meta.pondWater - amount);
}

/**
 * @param {import("./meta.js").Meta} meta
 * @returns {number} 0–1
 */
export function pondFraction(meta) {
  return Math.max(0, Math.min(1, meta.pondWater / POND_MAX));
}

/**
 * One-shot narrative beats as the pond shrinks. Glib, never preachy.
 * @param {import("./meta.js").Meta} meta
 * @param {(msg: string) => void} onBeat
 * @param {(spec: any) => void} [onModal]
 */
export function checkPondBeats(meta, onBeat, onModal = () => {}) {
  const frac = pondFraction(meta);
  if (frac < 0.25 && !meta.flags.pondLow) {
    meta.flags.pondLow = true;
    onBeat("The pond looks smaller.");
  }
  if (meta.pondWater <= 0 && !meta.flags.pondEmpty) {
    meta.flags.pondEmpty = true;
    onBeat("The pond is mostly ducks now.");
    onModal({
      emoji: "🌊",
      title: "The Pond Is Gone",
      body: "The ducks have taken the last drop. They've renamed the basin 'Legacy Aquatic Infrastructure.' Output is up. It's fine.",
      button: "It's fine",
    });
  }
}
