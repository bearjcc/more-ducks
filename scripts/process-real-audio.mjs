#!/usr/bin/env node
/**
 * Build music + ambience beds from Bear-provided HQ previews (uploads tars).
 * Writes loop metadata to assets/audio/loop-meta.json for the ship report.
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = process.env.MD_AUDIO_SRC || "/tmp/md-audio-src";
const MUSIC = path.join(ROOT, "assets/audio/music");
const AMB = path.join(ROOT, "assets/audio/ambience");

const WINDOW_SEC = 0.25;
const LOOP_LEN = 38;
const XFADE = 2.5;

/** @param {string} src @param {number} [sr] */
function decodeMonoPcm(src, sr = 22050) {
  const out = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", String(sr), "-f", "f32le", "pipe:1"],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  if (out.status !== 0) throw new Error(`decode failed: ${src}`);
  const f32 = new Float32Array(out.stdout.buffer, out.stdout.byteOffset, out.stdout.length / 4);
  return { samples: f32, sr };
}

/**
 * @param {Float32Array} s @param {number} sr @param {number} startSec @param {number} lenSec
 */
function windowStats(s, sr, startSec, lenSec) {
  const w = Math.floor(WINDOW_SEC * sr);
  const start = Math.floor(startSec * sr);
  const end = Math.min(s.length, start + Math.floor(lenSec * sr));
  let maxRms = 0;
  let sumRms = 0;
  let peaks = 0;
  let count = 0;
  for (let i = start; i + w < end; i += w) {
    let sum = 0;
    let peak = 0;
    for (let j = 0; j < w; j++) {
      const v = s[i + j];
      sum += v * v;
      peak = Math.max(peak, Math.abs(v));
    }
    const rms = Math.sqrt(sum / w);
    maxRms = Math.max(maxRms, rms);
    sumRms += rms;
    count++;
    if (peak > 0.12) peaks++;
  }
  return { maxRms, meanRms: sumRms / Math.max(1, count), peaks };
}

/**
 * @param {string} src
 * @param {number} lenSec
 * @param {{ minStart?: number, maxStart?: number }} [opts]
 */
function bestSegment(src, lenSec, opts = {}) {
  const { samples, sr } = decodeMonoPcm(src);
  const totalSec = samples.length / sr;
  const minStart = opts.minStart ?? 5;
  const maxStart = opts.maxStart ?? Math.max(minStart, totalSec - lenSec - 5);
  let best = { start: minStart, score: Infinity, peaks: 999, maxRms: 999, meanRms: 999 };
  const step = 0.5;
  for (let t = minStart; t <= maxStart; t += step) {
    const st = windowStats(samples, sr, t, lenSec);
    const score = st.meanRms * 2 + st.maxRms * 3 + st.peaks * 0.02;
    if (score < best.score) best = { start: t, score, ...st };
  }
  return { ...best, len: lenSec, src: path.basename(src) };
}

/**
 * @param {string} src @param {{ start: number, len: number, label: string }} seg
 * @param {string} outOgg @param {{ stereo?: boolean, bitrate?: string, extraFilter?: string }} [opts]
 */
function renderLoop(src, seg, outOgg, opts = {}) {
  const stereo = opts.stereo ?? false;
  const br = opts.bitrate ?? (stereo ? "64k" : "40k");
  const end = seg.start + seg.len;
  const pad = XFADE;
  const filter =
    `[0:a]atrim=start=${seg.start}:end=${end},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${pad},` +
    `afade=t=out:st=${seg.len - pad}:d=${pad},` +
    `loudnorm=I=-20:TP=-2:LRA=11:print_format=summary` +
    (opts.extraFilter ? `,${opts.extraFilter}` : "") +
    "[out]";
  const ac = stereo ? 2 : 1;
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(src)} -filter_complex ${JSON.stringify(filter)} -map "[out]" -ac ${ac} -c:a libopus -b:a ${br} -vbr on ${JSON.stringify(outOgg)}`,
  );
}

function renderM4a(ogg, m4a) {
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(ogg)} -c:a aac -b:a 80k -movflags +faststart ${JSON.stringify(m4a)}`,
  );
}

/**
 * Pick a loop segment whose first/last 2s RMS are closest (seam-friendly).
 * @param {string} src
 */
function musicLoop(src, outOgg) {
  const { samples, sr } = decodeMonoPcm(src);
  const totalSec = samples.length / sr;
  const targetLen = Math.min(88, totalSec - 6);
  const edge = 2;
  let best = { start: 10, len: targetLen, seamDelta: Infinity, score: Infinity, ...windowStats(samples, sr, 10, targetLen) };
  for (let t = 8; t <= totalSec - targetLen - 2; t += 0.5) {
    const head = windowStats(samples, sr, t, edge).meanRms;
    const tail = windowStats(samples, sr, t + targetLen - edge, edge).meanRms;
    const body = windowStats(samples, sr, t, targetLen);
    const seamDelta = Math.abs(head - tail);
    const score = seamDelta * 5 + body.meanRms * 1.5 + body.peaks * 0.15;
    if (score < best.score) {
      best = { start: t, len: targetLen, seamDelta, score, ...body };
    }
  }
  const pad = 3;
  const end = best.start + best.len;
  const filter =
    `[0:a]atrim=start=${best.start}:end=${end},asetpts=PTS-STARTPTS,` +
    `afade=t=in:st=0:d=${pad},afade=t=out:st=${best.len - pad}:d=${pad},` +
    `loudnorm=I=-18:TP=-2:LRA=7:print_format=summary[out]`;
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(src)} -filter_complex ${JSON.stringify(filter)} -map "[out]" -ac 2 -c:a libopus -b:a 64k -vbr on ${JSON.stringify(outOgg)}`,
  );
  return {
    ...best,
    src: path.basename(src),
    loop: `${pad}s symmetric fades + loudnorm −18 LUFS; seam ΔRMS=${best.seamDelta.toFixed(4)}`,
    role: "music",
    why: "Thinking Music — calm section with matched head/tail levels for gapless Web Audio loop.",
  };
}

function mixNight(segA, srcA, segB, srcB, outOgg) {
  const pad = XFADE;
  const fa =
    `atrim=start=${segA.start}:end=${segA.start + segA.len},asetpts=PTS-STARTPTS,` +
    `highpass=f=80,lowpass=f=2800,volume=0.85,afade=t=in:st=0:d=${pad},afade=t=out:st=${segA.len - pad}:d=${pad}`;
  const fb =
    `atrim=start=${segB.start}:end=${segB.start + segB.len},asetpts=PTS-STARTPTS,` +
    `highpass=f=70,lowpass=f=2200,volume=0.35,afade=t=in:st=0:d=${pad},afade=t=out:st=${segB.len - pad}:d=${pad}`;
  const filter = `[0:a]${fa}[a];[1:a]${fb}[b];[a][b]amix=inputs=2:duration=first:dropout_transition=0,` +
    `loudnorm=I=-22:TP=-2:LRA=11[out]`;
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(srcA)} -i ${JSON.stringify(srcB)} ` +
      `-filter_complex ${JSON.stringify(filter)} -map "[out]" -ac 1 -c:a libopus -b:a 40k -vbr on ${JSON.stringify(outOgg)}`,
  );
}

function frenzyLayer(src, seg, outOgg) {
  const pad = 1.5;
  const end = seg.start + seg.len;
  const filter =
    `atrim=start=${seg.start}:end=${end},asetpts=PTS-STARTPTS,highpass=f=200,lowpass=f=4000,volume=0.4,` +
    `afade=t=in:st=0:d=${pad},afade=t=out:st=${seg.len - pad}:d=${pad},` +
    `loudnorm=I=-24:TP=-2:LRA=8`;
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(src)} -af ${JSON.stringify(filter)} ` +
      `-ac 1 -c:a libopus -b:a 36k -vbr on ${JSON.stringify(outOgg)}`,
  );
}

fs.mkdirSync(MUSIC, { recursive: true });
fs.mkdirSync(AMB, { recursive: true });

const files = {
  music: path.join(SRC, "thinking-music.mp3"),
  day: path.join(SRC, "fs-616827.mp3"),
  nightA: path.join(SRC, "fs-152675.mp3"),
  nightB: path.join(SRC, "fs-481883.mp3"),
  frenzy: path.join(SRC, "fs-591702.mp3"),
};
for (const [k, p] of Object.entries(files)) {
  if (!fs.existsSync(p)) throw new Error(`missing ${k}: ${p}`);
}

/** @type {Record<string, unknown>} */
const meta = {};

const daySeg = bestSegment(files.day, LOOP_LEN);
meta.day = { ...daySeg, why: "Lowest RMS/onset score in 38s window; water without prominent duck calls." };
renderLoop(files.day, daySeg, path.join(AMB, "pond-day.ogg"), {
  extraFilter: "highpass=f=90,lowpass=f=3200,volume=0.75",
});
renderM4a(path.join(AMB, "pond-day.ogg"), path.join(AMB, "pond-day.m4a"));

const nightSegA = bestSegment(files.nightA, LOOP_LEN, { minStart: 3 });
const nightSegB = bestSegment(files.nightB, LOOP_LEN, { minStart: 10 });
meta.night = {
  primary: { ...nightSegA, source: "Nirtana fs-152675" },
  under: { ...nightSegB, source: "parret fs-481883" },
  why: "Quiet window on Nirtana night pond, mixed under with softer parret night air.",
};
mixNight(nightSegA, files.nightA, nightSegB, files.nightB, path.join(AMB, "pond-night.ogg"));
renderM4a(path.join(AMB, "pond-night.ogg"), path.join(AMB, "pond-night.m4a"));

const frenzySeg = bestSegment(files.frenzy, 12, { minStart: 20, maxStart: 120 });
meta.frenzy = {
  ...frenzySeg,
  why: "12s excerpt for optional late-act layer; ducked in engine, not looped as bed.",
};
frenzyLayer(files.frenzy, frenzySeg, path.join(AMB, "ducks-frenzy.ogg"));
renderM4a(path.join(AMB, "ducks-frenzy.ogg"), path.join(AMB, "ducks-frenzy.m4a"));

meta.music = musicLoop(files.music, path.join(MUSIC, "thinking-music.ogg"));
renderM4a(path.join(MUSIC, "thinking-music.ogg"), path.join(MUSIC, "thinking-music.m4a"));

fs.writeFileSync(path.join(ROOT, "assets/audio/loop-meta.json"), JSON.stringify(meta, null, 2));
console.log(JSON.stringify(meta, null, 2));
