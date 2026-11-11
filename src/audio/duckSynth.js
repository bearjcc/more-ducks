// @ts-check
/**
 * Mallard quack synthesizer — JS port of the source-filter model in
 * vendor/duck-pond/synth.rs (CELPHASE / MIT). Bakes one-shot buffers per act.
 */

/** @typedef {"hen"|"drake"|"duckling"|"peck"|"pip"} QuackKind */

const SR = 48000;

/**
 * @param {number} x
 */
function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

/**
 * @param {Float32Array} x
 */
function normalizePeak(x) {
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  if (peak > 0) for (let i = 0; i < x.length; i++) x[i] /= peak;
}

/** @param {number} n @param {() => number} rnd */
function whiteNoise(n, rnd) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = rnd() * 2 - 1;
  return out;
}

/** One-pole highpass-ish (cheap). */
function highpassSimple(buf, cutoff) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SR;
  const alpha = rc / (rc + dt);
  let y = 0;
  let x1 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    y = alpha * (y + x - x1);
    x1 = x;
    buf[i] = y;
  }
}

/**
 * @param {Float32Array} pitchHz
 * @param {Float32Array} env
 * @param {number} jitter
 * @param {number} rasp
 * @param {() => number} rnd
 */
function pulseTrain(pitchHz, env, jitter, rasp, rnd) {
  const n = pitchHz.length;
  const out = new Float32Array(n);
  let phase = rnd();
  let period = 1 / pitchHz[0];
  for (let i = 1; i < n; i++) {
    const target = 1 / Math.max(80, pitchHz[i]);
    period += (target - period) * 0.08;
    period *= 1 + jitter * (rnd() - 0.5) * 0.02;
    phase += 1 / (SR * period);
    if (phase >= 1) {
      phase -= 1;
      const edge = Math.exp(-((i % 2 === 0 ? 0 : 0.15) + rasp * 0.4));
      out[i] += edge * env[i] * (0.9 + 0.2 * (rnd() - 0.5));
    }
  }
  return out;
}

/** Cheap resonant emphasis at a few formants. */
function formantFilter(src, freqs, q = 8) {
  const y = new Float32Array(src.length);
  for (let f of freqs) {
    const w = (2 * Math.PI * f) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const b0 = 1 + alpha;
    const b1 = -2 * Math.cos(w);
    const b2 = 1 - alpha;
    const a0 = 1 + alpha;
    const a1 = -2 * Math.cos(w);
    const a2 = 1 - alpha;
    let z1 = 0;
    let z2 = 0;
    for (let i = 0; i < src.length; i++) {
      const x = src[i];
      const out = (b0 * x + b1 * z1 + b2 * z2 - a1 * z1 - a2 * z2) / a0;
      z2 = z1;
      z1 = out;
      y[i] += out * 0.35;
    }
  }
  return y;
}

/**
 * @param {number} act
 * @param {QuackKind} kind
 * @param {() => number} rnd
 */
function renderQuackSamples(act, kind, rnd) {
  const ai = Math.min(1, act / 4);
  const dur =
    kind === "pip" ? 0.035 :
      kind === "peck" ? 0.05 :
        kind === "duckling" ? 0.12 :
          kind === "drake" ? 0.22 : 0.18;
  const n = Math.ceil((dur + 0.02) * SR);
  const f0 = kind === "duckling" ? 520 : kind === "drake" ? 180 : 360;
  const pitch = new Float32Array(n);
  const env = new Float32Array(n);
  const u = (i) => i / SR / dur;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    env[i] =
      smoothstep(t / 0.04) *
      (1 - smoothstep((t - dur + 0.05) / 0.05)) *
      (kind === "pip" ? 0.18 : 1);
  }
  for (let i = 0; i < n; i++) {
    const wobble = 1 + 0.01 * Math.sin(i / 40);
    const detune = 1 + ai * 0.08 * Math.sin(i / 17);
    pitch[i] = f0 * detune * wobble * (1 + 0.12 * (1 - u(i)));
  }
  const jitter = 0.02 + ai * 0.12;
  const rasp = (kind === "drake" ? 0.5 : 0.25) + ai * 0.35;
  let src =
    kind === "duckling"
      ? (() => {
          const o = new Float32Array(n);
          for (let i = 0; i < n; i++) {
            const w = (2 * Math.PI * pitch[i] * i) / SR;
            o[i] = Math.sin(w) * env[i];
          }
          return o;
        })()
      : pulseTrain(pitch, env, jitter, rasp, rnd);
  const hiss = whiteNoise(n, rnd);
  highpassSimple(hiss, 1200);
  for (let i = 0; i < n; i++) src[i] += hiss[i] * env[i] * (0.03 + ai * 0.04);
  const f2 = 1200 + ai * 400 * Math.sin(3);
  const shaped = formantFilter(src, [780, 1500, f2, 3400]);
  highpassSimple(shaped, 400);
  if (ai > 0.6) {
    for (let i = 0; i < shaped.length; i += 64) {
      const hold = shaped[i];
      for (let j = i; j < Math.min(i + 64, shaped.length); j++) shaped[j] = hold;
    }
  }
  normalizePeak(shaped);
  return shaped;
}

/** @typedef {{ hen: AudioBuffer[], drake: AudioBuffer[], duckling: AudioBuffer[], pip: AudioBuffer[], peck: AudioBuffer[] }} QuackBank */

/** @type {QuackBank|null} */
let bank = null;
/** @type {number} */
let bakedAct = -1;

/**
 * @param {AudioContext} ctx
 * @param {number} act
 */
export function bakeQuackBank(ctx, act) {
  if (bank && bakedAct === act) return bank;
  bakedAct = act;
  /** @param {QuackKind} kind */
  const bake = (kind) => {
    const variants = [];
    for (let v = 0; v < 10; v++) {
      const seed = act * 997 + kind.length * 131 + v * 17;
      const rnd = mulberry32(seed);
      const samples = renderQuackSamples(act, kind, rnd);
      const buf = ctx.createBuffer(1, samples.length, SR);
      buf.getChannelData(0).set(samples);
      variants.push(buf);
    }
    return variants;
  };
  bank = {
    hen: bake("hen"),
    drake: bake("drake"),
    duckling: bake("duckling"),
    pip: bake("pip"),
    peck: bake("peck"),
  };
  return bank;
}

/**
 * @param {number} a
 */
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} act
 * @param {QuackKind} kind
 * @param {number} gain
 */
export function playBakedQuack(ctx, dest, act, kind, gain = 1) {
  const b = bakeQuackBank(ctx, act);
  const list = b[kind === "hen" ? "hen" : kind] || b.hen;
  const buf = list[Math.floor(Math.random() * list.length)];
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 0.96 + Math.random() * 0.08;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  g.connect(dest);
  src.start();
}
