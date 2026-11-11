#!/usr/bin/env node
/**
 * Copies Kenney Interface Sounds subset and builds Opus OGG + AAC M4A fallbacks.
 * Source files were taken from Kenney's Interface Sounds pack (CC0); see assets/audio/KENNEY-LICENSE.txt.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = process.env.KENNEY_SRC || "/tmp/opui/assets/audio/interface";
const UI = path.join(ROOT, "assets/audio/ui");
const MUSIC = path.join(ROOT, "assets/audio/music");
const AMB = path.join(ROOT, "assets/audio/ambience");

const UI_FILES = [
  "click_001.ogg",
  "click_002.ogg",
  "confirmation_001.ogg",
  "confirmation_002.ogg",
  "confirmation_003.ogg",
  "confirmation_004.ogg",
  "maximize_002.ogg",
  "minimize_002.ogg",
  "open_001.ogg",
  "close_001.ogg",
  "drop_002.ogg",
  "switch_002.ogg",
  "glitch_001.ogg",
  "tick_002.ogg",
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function transcodePair(stem, srcPath, outDir) {
  const ogg = path.join(outDir, `${stem}.ogg`);
  const m4a = path.join(outDir, `${stem}.m4a`);
  fs.copyFileSync(srcPath, ogg);
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(srcPath)} -c:a libopus -b:a 48k -vbr on ${JSON.stringify(ogg)}`,
  );
  execSync(
    `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(srcPath)} -c:a aac -b:a 64k -movflags +faststart ${JSON.stringify(m4a)}`,
  );
}

ensureDir(UI);
ensureDir(MUSIC);
ensureDir(AMB);

for (const name of UI_FILES) {
  const src = path.join(SRC, name);
  if (!fs.existsSync(src)) throw new Error(`missing Kenney source ${src}`);
  const stem = name.replace(/\.ogg$/, "");
  transcodePair(stem, src, UI);
  console.log("ui", stem);
}

const musicOgg = path.join(MUSIC, "thinking-music.ogg");
const musicM4a = path.join(MUSIC, "thinking-music.m4a");
const ambDayOgg = path.join(AMB, "pond-day.ogg");
const ambDayM4a = path.join(AMB, "pond-day.m4a");
const ambNightOgg = path.join(AMB, "pond-night.ogg");
const ambNightM4a = path.join(AMB, "pond-night.m4a");

// Calm loop: soft pentatonic pads (original render; replace with incompetech download when available).
execSync(
  `ffmpeg -y -hide_banner -loglevel error -f lavfi -i "sine=frequency=196:duration=48" -f lavfi -i "sine=frequency=294:duration=48" -f lavfi -i "sine=frequency=392:duration=48" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=first:dropout_transition=0,volume=0.08,afade=t=in:st=0:d=2,afade=t=out:st=46:d=2" -c:a libopus -b:a 64k ${JSON.stringify(musicOgg)}`,
);
execSync(
  `ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(musicOgg)} -c:a aac -b:a 80k ${JSON.stringify(musicM4a)}`,
);

// Short ambience beds (bandpassed noise loops).
const dayFilter = "anoisesrc=color=pink:duration=32,asetrate=44100,lowpass=f=700,highpass=f=90,volume=0.35";
const nightFilter = "anoisesrc=color=brown:duration=32,asetrate=44100,lowpass=f=500,highpass=f=120,volume=0.28";
execSync(
  `ffmpeg -y -hide_banner -loglevel error -f lavfi -i ${JSON.stringify(dayFilter)} -af "afade=t=in:st=0:d=3,afade=t=out:st=29:d=3" -c:a libopus -b:a 48k ${JSON.stringify(ambDayOgg)}`,
);
execSync(`ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(ambDayOgg)} -c:a aac -b:a 64k ${JSON.stringify(ambDayM4a)}`);
execSync(
  `ffmpeg -y -hide_banner -loglevel error -f lavfi -i ${JSON.stringify(nightFilter)} -af "afade=t=in:st=0:d=3,afade=t=out:st=29:d=3" -c:a libopus -b:a 48k ${JSON.stringify(ambNightOgg)}`,
);
execSync(`ffmpeg -y -hide_banner -loglevel error -i ${JSON.stringify(ambNightOgg)} -c:a aac -b:a 64k ${JSON.stringify(ambNightM4a)}`);

console.log("done");
