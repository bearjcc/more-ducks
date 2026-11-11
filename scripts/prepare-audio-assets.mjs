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

console.log("done (music/ambience: run scripts/process-real-audio.mjs)");
