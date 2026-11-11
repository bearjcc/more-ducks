// @ts-check
import { bakeQuackBank, playBakedQuack } from "./duckSynth.js";
import { getUiBuffer, preloadUiSamples } from "./samples.js";
import {
  markFullQuackPlayed,
  quackKindForHoldTick,
  setHoldRepeatActive,
} from "./holdRepeat.js";
import { aboutPlainText } from "../data/about.js";

/** @typedef {import("../game/meta.js").Settings} Settings */

/** @type {AudioContext|null} */
let ctx = null;
/** @type {GainNode|null} */
let master = null;
/** @type {GainNode|null} */
let sfxBus = null;
/** @type {GainNode|null} */
let musicBus = null;
/** @type {GainNode|null} */
let ambBus = null;
/** @type {ConvolverNode|null} */
let reverb = null;
/** @type {DynamicsCompressorNode|null} */
let limiter = null;

/** @type {Settings|null} */
let settings = null;
/** @type {number} */
let currentAct = 0;
/** @type {boolean} */
let unlocked = false;
/** @type {boolean} */
let hidden = false;

/** @type {AudioBufferSourceNode|null} */
let musicSrc = null;
/** @type {AudioBufferSourceNode|null} */
let ambSrc = null;
/** @type {AudioBuffer|null} */
let musicBuf = null;
/** @type {AudioBuffer|null} */
let ambDayBuf = null;
/** @type {AudioBuffer|null} */
let ambNightBuf = null;
/** @type {AudioBuffer|null} */
let frenzyBuf = null;
/** @type {ReturnType<typeof setTimeout>|null} */
let frenzyTimer = null;

const ASSET_BASE = new URL("../../assets/audio/", import.meta.url);

/**
 * @param {Settings} s
 */
export function applyAudioSettings(s) {
  settings = s;
  if (!master) return;
  const muted = s.masterMute || !s.sfx;
  const sfxGain = muted ? 0 : s.sfxVolume;
  const ambGain = s.masterMute || !s.ambience ? 0 : s.ambienceVolume;
  const musicGain = s.masterMute || !s.music ? 0 : s.musicVolume;
  if (sfxBus) sfxBus.gain.setTargetAtTime(sfxGain, ctx?.currentTime ?? 0, 0.02);
  if (ambBus) ambBus.gain.setTargetAtTime(ambGain, ctx?.currentTime ?? 0, 0.08);
  if (musicBus) musicBus.gain.setTargetAtTime(musicGain, ctx?.currentTime ?? 0, 0.08);
  updateBeds();
}

/** @param {boolean} on */
export function setSfxEnabled(on) {
  if (settings) settings.sfx = on;
  applyAudioSettings(settings ?? defaultAudioSettings());
}

/** @returns {Settings} */
function defaultAudioSettings() {
  return {
    notation: "suffix",
    reduceMotion: null,
    timeOfDay: "system",
    sfx: true,
    buyMode: 1,
    masterMute: false,
    sfxVolume: 1,
    musicVolume: 0.35,
    ambienceVolume: 0.4,
    music: true,
    ambience: true,
  };
}

/** @returns {AudioContext|null} */
function audioContext() {
  return ctx;
}

async function makeImpulse(ctx, seconds = 0.45, decay = 2.8) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return ir;
}

/**
 * @param {boolean} [fromGesture]
 */
export async function unlockAudio(fromGesture = false) {
  if (unlocked && ctx?.state === "running") return;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return;
    }
    master = ctx.createGain();
    master.gain.value = 1;
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    ambBus = ctx.createGain();
    reverb = ctx.createConvolver();
    reverb.buffer = await makeImpulse(ctx);
    limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.ratio.value = 8;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    const drySfx = ctx.createGain();
    drySfx.gain.value = 0.88;
    sfxBus.connect(drySfx);
    sfxBus.connect(wet);
    wet.connect(reverb);
    reverb.connect(limiter);
    drySfx.connect(limiter);
    musicBus.connect(limiter);
    ambBus.connect(limiter);
    limiter.connect(master);
    master.connect(ctx.destination);
    await preloadUiSamples(ctx);
    await loadBeds();
    bakeQuackBank(ctx, currentAct);
    applyAudioSettings(settings ?? defaultAudioSettings());
  }
  if (fromGesture || ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch { /* iOS */ }
  }
  unlocked = ctx.state === "running";
}

async function loadBeds() {
  if (!ctx) return;
  const pickExt = (p) => p + (preferOgg() ? ".ogg" : ".m4a");
  musicBuf = await fetchDecode(pickExt("music/thinking-music"));
  ambDayBuf = await fetchDecode(pickExt("ambience/pond-day"));
  ambNightBuf = await fetchDecode(pickExt("ambience/pond-night"));
  try {
    frenzyBuf = await fetchDecode(pickExt("ambience/ducks-frenzy"));
  } catch { /* optional */ }
}

function preferOgg() {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent;
  return !(/iPhone|iPad|iPod/i.test(ua) || (ua.includes("Safari") && !ua.includes("Chrome")));
}

/**
 * @param {string} path
 */
async function fetchDecode(path) {
  const res = await fetch(new URL(path, ASSET_BASE).href);
  const ab = await res.arrayBuffer();
  return /** @type {AudioContext} */ (ctx).decodeAudioData(ab);
}

function ambienceLevelForAct(act) {
  if (act <= 1) return 0.04;
  if (act === 2) return 0.35;
  if (act === 3) return 0.55;
  return 0.75;
}

function musicLevelForAct(act) {
  if (act <= 1) return 0;
  if (act === 2) return 0.45;
  return 0.85;
}

function isNight() {
  const mode = settings?.timeOfDay ?? "system";
  if (mode === "night") return true;
  if (mode === "day") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function updateBeds() {
  if (!ctx || !ambBus || !musicBus || !settings) return;
  const act = currentAct;
  const ambTarget = settings.masterMute || !settings.ambience ? 0 : settings.ambienceVolume * ambienceLevelForAct(act);
  const musicTarget = settings.masterMute || !settings.music ? 0 : settings.musicVolume * musicLevelForAct(act);
  ambBus.gain.setTargetAtTime(ambTarget, ctx.currentTime, 0.3);
  musicBus.gain.setTargetAtTime(musicTarget, ctx.currentTime, 0.3);
  startAmbienceLoop();
  startMusicLoop();
  syncFrenzySchedule();
}

function playFrenzyColour() {
  if (!ctx || !ambBus || !frenzyBuf || hidden || currentAct < 4) return;
  if (settings?.masterMute || !settings?.ambience) return;
  const src = ctx.createBufferSource();
  src.buffer = frenzyBuf;
  const g = ctx.createGain();
  const base = (settings.ambienceVolume ?? 0.4) * ambienceLevelForAct(currentAct);
  g.gain.value = base * 0.14;
  src.connect(g);
  g.connect(ambBus);
  src.start();
}

function syncFrenzySchedule() {
  if (frenzyTimer) {
    clearTimeout(frenzyTimer);
    frenzyTimer = null;
  }
  if (!frenzyBuf || currentAct < 4 || hidden) return;
  const plan = () => {
    frenzyTimer = setTimeout(() => {
      playFrenzyColour();
      plan();
    }, 55_000 + Math.random() * 45_000);
  };
  plan();
}

function startLoop(which, buf, bus, /** @type {AudioBufferSourceNode|null} */ prev) {
  if (!ctx || !buf || hidden) return;
  if (prev) {
    try { prev.stop(); } catch { /* */ }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(/** @type {GainNode} */ (bus));
  src.start();
  return src;
}

function startAmbienceLoop() {
  const buf = isNight() ? ambNightBuf : ambDayBuf;
  if (!buf) return;
  ambSrc = startLoop("amb", buf, ambBus, ambSrc) ?? ambSrc;
}

function startMusicLoop() {
  if (!musicBuf || musicLevelForAct(currentAct) <= 0) {
    if (musicSrc) {
      try { musicSrc.stop(); } catch { /* */ }
      musicSrc = null;
    }
    return;
  }
  musicSrc = startLoop("music", musicBuf, musicBus, musicSrc) ?? musicSrc;
}

/**
 * @param {number} act
 */
export function onActChange(act) {
  currentAct = act;
  if (ctx) bakeQuackBank(ctx, act);
  updateBeds();
  syncFrenzySchedule();
}

export function onTimeOfDayChange() {
  startAmbienceLoop();
}

/**
 * @param {boolean} isHidden
 */
export function onVisibilityHidden(isHidden) {
  hidden = isHidden;
  if (!ctx) return;
  if (isHidden) {
    if (frenzyTimer) {
      clearTimeout(frenzyTimer);
      frenzyTimer = null;
    }
    try { ctx.suspend(); } catch { /* */ }
  } else {
    ctx.resume().catch(() => {});
    updateBeds();
  }
}

/**
 * @param {string} id
 * @param {number} gain
 */
function playUi(id, gain = 0.55) {
  if (!settings?.sfx || settings.masterMute) return;
  const ac = audioContext();
  if (!ac || !sfxBus) return;
  const buf = getUiBuffer(id);
  if (!buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(sfxBus);
  src.start();
}

/** @param {number} ms */
function vibrate(ms) {
  if (!settings?.sfx || settings.masterMute) return;
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try { navigator.vibrate(ms); } catch { /* */ }
}

/**
 * @param {{ holdRepeat?: boolean, kind?: string }} [opts]
 */
export async function sfxQuack(opts = {}) {
  await unlockAudio(true);
  const ac = audioContext();
  if (!ac || !sfxBus || !settings?.sfx || settings.masterMute) return;
  let kind = "hen";
  let gain = 0.75;
  if (opts.holdRepeat) {
    const q = quackKindForHoldTick();
    if (q === "pip") {
      playUi("pip", 0.12);
      return;
    }
    if (q === "skip") return;
  }
  markFullQuackPlayed();
  if (opts.kind === "ponder") kind = /** @type {any} */ ("drake");
  playBakedQuack(ac, sfxBus, currentAct, /** @type {any} */ (kind), gain);
  vibrate(12);
}

export async function sfxBuy(bulk = false) {
  await unlockAudio(true);
  playUi(bulk ? "buyBulk" : "buy1", bulk ? 0.5 : 0.45);
  if (bulk) playUi("buy1", 0.2);
  vibrate(8);
}

export async function sfxFeed() {
  await unlockAudio(true);
  playUi("feed", 0.5);
  playBakedQuack(/** @type {AudioContext} */ (ctx), /** @type {GainNode} */ (sfxBus), currentAct, "peck", 0.35);
  vibrate(8);
}

export async function sfxToast() {
  await unlockAudio(true);
  playUi("toast", 0.42);
  vibrate(6);
}

export async function sfxTab() {
  await unlockAudio(true);
  playUi("tab", 0.28);
}

/** @param {"up"|"down"} dir */
export async function sfxViewMode(dir) {
  await unlockAudio(true);
  playUi(dir === "up" ? "viewUp" : "viewDown", 0.32);
}

export async function sfxBuyMode() {
  await unlockAudio(true);
  playUi("buyMode", 0.3);
}

export async function sfxCollect() {
  await unlockAudio(true);
  playUi("collect", 0.48);
}

export async function sfxDuckdex() {
  await unlockAudio(true);
  playUi("duckdex", 0.5);
}

export async function sfxActEntry() {
  await unlockAudio(true);
  playUi("act", 0.55);
}

/** @param {boolean} active */
export function bindHoldRepeat(active) {
  setHoldRepeatActive(active);
}

export function getCreditsText() {
  return aboutPlainText();
}
