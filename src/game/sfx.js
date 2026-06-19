// @ts-check
/** Tiny Web Audio bleeps — no asset files. */

/** @type {boolean} */
let enabled = true;
/** @type {AudioContext|null} */
let ctx = null;

/** @param {boolean} on */
export function setSfxEnabled(on) {
  enabled = on;
}

function audio() {
  if (!enabled) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/**
 * @param {number} freq
 * @param {number} duration
 * @param {number} [volume]
 */
function blip(freq, duration, volume = 0.08) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ac.destination);
  const t = ac.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

export function sfxQuack() {
  blip(420, 0.06, 0.06);
  setTimeout(() => blip(520, 0.05, 0.04), 40);
  vibrate(12);
}

export function sfxBuy() {
  blip(660, 0.08, 0.05);
  vibrate(8);
}

export function sfxToast() {
  blip(880, 0.12, 0.04);
  vibrate(6);
}

/** @param {number} ms */
function vibrate(ms) {
  if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) return;
  try { navigator.vibrate(ms); } catch { /* unsupported */ }
}
